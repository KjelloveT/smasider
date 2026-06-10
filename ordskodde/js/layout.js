/* layout.js — utleggingsmotor for Ordskodde.
   Arkimedisk spiral frå sentrum + kollisjonssjekk mot eit grovt okkupasjonsgrid
   (4 px celler) og formtest mot maskefunksjonen til vald form. Seeded PRNG gjev
   deterministisk utlegging slik at lagra skyer alltid blir teikna likt. */
(function (root) {
  'use strict';

  const CELL = 4;
  const MAX_STEPS = 3000;
  const SPIRAL_DT = 0.35;   // radianar per steg
  const SPIRAL_GROWTH = 2.2; // radius-vekst per radian

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');

  function measureWord(word, fontSize, fontStack) {
    mctx.font = '700 ' + fontSize + 'px ' + fontStack;
    const m = mctx.measureText(word);
    let h;
    if (m.actualBoundingBoxAscent != null && m.actualBoundingBoxDescent != null) {
      h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    } else {
      h = fontSize * 1.15; // fallback der actualBoundingBox manglar
    }
    // Liten luft rundt ordet så nabordord ikkje kliner seg inntil
    return { w: m.width + fontSize * 0.12, h: h + fontSize * 0.12 };
  }

  /** Andel av lerretet forma dekkjer (Monte Carlo over eit grid) — blir brukt
      til å skalere ordstorleikane så skya faktisk fyller forma. */
  const areaFactorCache = {};
  function shapeAreaFactor(shapeId, shape) {
    if (areaFactorCache[shapeId] != null) return areaFactorCache[shapeId];
    const n = 48;
    let inside = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (shape.contains((i + 0.5) / n * 2 - 1, (j + 0.5) / n * 2 - 1)) inside++;
      }
    }
    areaFactorCache[shapeId] = inside / (n * n);
    return areaFactorCache[shapeId];
  }

  /**
   * @param words [{word, count, enabled}] sortert på count desc
   * @param opts { width, height, shape, fontStack, maxWords, minSize, maxSize, rotationMode, seed }
   * @returns { placed: [{word, count, x, y, fontSize, rotated, colorIdx}], width, height, skipped }
   */
  function compute(words, opts) {
    const W = opts.width || 1200;
    const H = opts.height || 1200;
    const shapeId = opts.shape || 'circle';
    const shape = OrdskoddeThemes.SHAPES[shapeId] || OrdskoddeThemes.SHAPES.circle;
    const selection = words.filter(w => w.enabled).slice(0, opts.maxWords || 80);

    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    const grid = new Uint8Array(cols * rows);

    const maxC = selection.length ? selection[0].count : 1;
    const minC = selection.length ? selection[selection.length - 1].count : 0;
    const minS = opts.minSize || 14;
    const maxS = opts.maxSize || 110;
    const rotChance = opts.rotationMode === 'some' ? 0.3
      : opts.rotationMode === 'many' ? 0.5 : 0;

    const cx = W / 2, cy = H / 2;
    const ex = W / 2 - 8, ey = H / 2 - 8; // halv-utstrekning for normalisering

    // Adaptiv skalering: mål samla ordareal ved grunnstorleik og skaler slik at
    // det dekkjer ~45 % av formarealet. Krympar ved retry om ord ikkje får plass.
    function baseSize(count) {
      const t01 = maxC === minC ? 1 : (count - minC) / (maxC - minC);
      return minS + (maxS - minS) * Math.sqrt(t01);
    }
    let sumArea = 0;
    for (const entry of selection) {
      const m = measureWord(entry.word, baseSize(entry.count), opts.fontStack);
      sumArea += m.w * m.h;
    }
    const usable = shapeAreaFactor(shapeId, shape) * W * H * 0.72;
    let scale = sumArea > 0 ? Math.sqrt(usable / sumArea) : 1;
    scale = Math.max(0.5, Math.min(2.2, scale));

    function gridFree(x0, y0, w, h) {
      const c0 = Math.floor(x0 / CELL) - 1;
      const r0 = Math.floor(y0 / CELL) - 1;
      const c1 = Math.floor((x0 + w) / CELL) + 1;
      const r1 = Math.floor((y0 + h) / CELL) + 1;
      if (c0 < 0 || r0 < 0 || c1 >= cols || r1 >= rows) return false;
      for (let r = r0; r <= r1; r++) {
        const base = r * cols;
        for (let c = c0; c <= c1; c++) {
          if (grid[base + c]) return false;
        }
      }
      return true;
    }

    function gridMark(x0, y0, w, h) {
      const c0 = Math.max(0, Math.floor(x0 / CELL));
      const r0 = Math.max(0, Math.floor(y0 / CELL));
      const c1 = Math.min(cols - 1, Math.floor((x0 + w) / CELL));
      const r1 = Math.min(rows - 1, Math.floor((y0 + h) / CELL));
      for (let r = r0; r <= r1; r++) {
        const base = r * cols;
        for (let c = c0; c <= c1; c++) grid[base + c] = 1;
      }
    }

    function insideShape(x0, y0, w, h) {
      // 4 hjørne + kantmidtpunkt + senter — utan kantmidtpunkta kan ord
      // «byggje bru» over konkave parti (t.d. kløfta øvst i hjartet)
      const pts = [
        [x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h],
        [x0 + w / 2, y0], [x0 + w / 2, y0 + h], [x0, y0 + h / 2], [x0 + w, y0 + h / 2],
        [x0 + w / 2, y0 + h / 2]
      ];
      for (let i = 0; i < pts.length; i++) {
        if (!shape.contains((pts[i][0] - cx) / ex, (pts[i][1] - cy) / ey)) return false;
      }
      return true;
    }

    // Plasseringsforsøk: krympar skalaen til (nesten) alle ord får plass.
    let placed = [];
    let skipped = 0;
    let attemptScale = scale;
    const maxAttempts = 4;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rand = mulberry32(opts.seed || 1); // same sekvens per forsøk → deterministisk
      grid.fill(0);
      placed = [];
      skipped = 0;
      attemptScale = scale * Math.pow(0.88, attempt);

      selection.forEach((entry, i) => {
        const fontSize = Math.max(8, Math.round(baseSize(entry.count) * attemptScale));
        const rotated = rand() < rotChance;
        let { w, h } = measureWord(entry.word, fontSize, opts.fontStack);
        if (rotated) { const tmp = w; w = h; h = tmp; }

        const startAngle = rand() * Math.PI * 2;
        let success = false;
        for (let step = 0; step < MAX_STEPS; step++) {
          const t = step * SPIRAL_DT;
          const r = SPIRAL_GROWTH * t;
          if (r > Math.max(ex, ey) + Math.max(w, h)) break; // utanfor lerretet — gje opp
          const x = cx + r * Math.cos(t + startAngle);
          const y = cy + r * Math.sin(t + startAngle);
          const x0 = x - w / 2, y0 = y - h / 2;
          if (!insideShape(x0, y0, w, h)) continue;
          if (!gridFree(x0, y0, w, h)) continue;
          gridMark(x0, y0, w, h);
          placed.push({
            word: entry.word, count: entry.count,
            x, y, fontSize, rotated,
            colorIdx: i % 5
          });
          success = true;
          break;
        }
        if (!success) skipped++;
      });

      // Godta resultatet når maks ~12 % av orda manglar (eller siste forsøk).
      // Å droppe nokre småord gjev langt betre formfylling enn å krympe alt.
      if (skipped <= Math.max(0, Math.round(selection.length * 0.12))) break;
    }

    return { placed, width: W, height: H, skipped, scaleUsed: attemptScale, baseScale: scale };
  }

  root.OrdskoddeLayout = { compute };
})(window);
