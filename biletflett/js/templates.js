/* ══════════════════════════════════════
   TEMPLATES.JS — Data-drivne maldefinisjonar for BiletFlett
   Alle posisjonar er normaliserte (0..1) i høve til lerretet,
   så malane skalerer fritt mellom portrett/landskap/kvadrat.

   Fargar er Open Color-token ('green.7') eller paletnøklar
   ('accent', 'ink', …) — sjå js/palette.js. Rå hex er framleis lov
   der ein mal treng ein heilt bestemt farge, t.d. dei mørke
   festbakgrunnane som ligg utanfor Open Color-skalaen.

   Mal-skjema:
   {
     id, name, category: 'standard' | 'tema' | 'ungdom',
     orientation: 'portrait' | 'landscape' | 'square',
     palette: { bg, ink, accent, accent2, accent3 },
     background: { type:'solid'|'gradient'|'pattern', ... },   // valfri (default palette.bg)
     decor:  [ { type, layer:'back'|'front', ... } ],          // canvas-teikna pynt
     texts:  [ { id, x, y, w, text, size, font, color, align, weight, rotation, stroke, strokeW, shadow, bg } ],
     slots:  [ { x, y, w, h, frame:'plain'|'rounded'|'circle'|'polaroid', rotation, shadow } ]
   }
   ══════════════════════════════════════ */

const Templates = (() => {

    /* ---- Skrifttype-stablar (sjå js/fonts.js — lokale woff2-filer) ---- */
    const F = Fonts.stack;

    /* ---- Kortform for palettbygging ---- */
    const P = Palette.build;

    /* ---- Hjelpar: byggjer eit reint rutenett av slots ---- */
    function grid(cols, rows, m, g, frame) {
        m = m == null ? 0.045 : m;   // ytre marg
        g = g == null ? 0.025 : g;   // mellomrom
        const slots = [];
        const w = (1 - 2 * m - g * (cols - 1)) / cols;
        const h = (1 - 2 * m - g * (rows - 1)) / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                slots.push({
                    x: m + c * (w + g),
                    y: m + r * (h + g),
                    w, h,
                    frame: frame || 'plain'
                });
            }
        }
        return slots;
    }

    /* ════════ 8 STANDARD-OPPSETT (reine, utan pynt) ════════ */
    const NEUTRAL = P('white', 'gray.9', 'gray.7', 'gray.6', 'gray.3');

    const standard = [
        { id: 'std-2x2', name: '2×2 rutenett', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: grid(2, 2) },
        { id: 'std-2x3', name: '2×3 rutenett', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: grid(2, 3) },
        { id: 'std-3x3', name: '3×3 rutenett', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: grid(3, 3) },
        { id: 'std-big2', name: 'Stor + 2 små', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: [
            { x: 0.05, y: 0.05, w: 0.90, h: 0.55, frame: 'plain' },
            { x: 0.05, y: 0.63, w: 0.435, h: 0.32, frame: 'plain' },
            { x: 0.515, y: 0.63, w: 0.435, h: 0.32, frame: 'plain' }
          ] },
        { id: 'std-magasin', name: 'Magasin (1 stor + 3)', category: 'standard', orientation: 'landscape',
          palette: NEUTRAL, slots: [
            { x: 0.04, y: 0.05, w: 0.56, h: 0.90, frame: 'plain' },
            { x: 0.63, y: 0.05, w: 0.33, h: 0.283, frame: 'plain' },
            { x: 0.63, y: 0.358, w: 0.33, h: 0.283, frame: 'plain' },
            { x: 0.63, y: 0.666, w: 0.33, h: 0.284, frame: 'plain' }
          ] },
        { id: 'std-panorama', name: 'Panorama-stripe', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: [
            { x: 0.05, y: 0.06, w: 0.90, h: 0.28, frame: 'plain' },
            { x: 0.05, y: 0.37, w: 0.90, h: 0.28, frame: 'plain' },
            { x: 0.05, y: 0.68, w: 0.90, h: 0.28, frame: 'plain' }
          ] },
        { id: 'std-enkelt', name: 'Eitt bilete', category: 'standard', orientation: 'portrait',
          palette: NEUTRAL, slots: [{ x: 0.06, y: 0.06, w: 0.88, h: 0.88, frame: 'plain' }] },
        { id: 'std-duo', name: 'To side om side', category: 'standard', orientation: 'landscape',
          palette: NEUTRAL, slots: [
            { x: 0.04, y: 0.06, w: 0.45, h: 0.88, frame: 'plain' },
            { x: 0.51, y: 0.06, w: 0.45, h: 0.88, frame: 'plain' }
          ] }
    ];

    /* Biletgenererte malar med redigerbare tekstfelt og fotofelt. */
    const tema = BiletflettAssets.backgrounds.map(asset => ({
        id: asset.id, name: asset.name, style: asset.style, theme: asset.theme, category: 'tema', orientation: 'portrait',
        palette: P('white', 'black', 'green.7', 'green.5', 'green.2'),
        background: { type: 'image', src: asset.src, pixelated: asset.style === 'pixel' }, thumb: asset.thumb,
        texts: [
            { id: 'title', x: .18, y: .16, w: .64, text: '', size: .045,
              font: F.body, color: '#000000', align: 'center' },
            { id: 'sub', x: .20, y: .84, w: .60, text: '', size: .028,
              font: F.body, color: '#000000', align: 'center' }
        ],
        slots: [
            { x: .20, y: .25, w: .60, h: .25, frame: 'rounded' },
            { x: .20, y: .54, w: .28, h: .25, frame: 'rounded' },
            { x: .52, y: .54, w: .28, h: .25, frame: 'rounded' }
        ]
    }));
    const ungdom = [];
    const blank = { ...tema[0], id: 'blank', name: 'Lys flate', thumb: null, background: { type: 'solid', color: '#fffdf5' }, slots: [] };
    const all = [blank, ...standard, ...tema];
    const byId = Object.fromEntries(all.map(t => [t.id, t]));
    return { all, standard, tema, ungdom, get: id => byId[id], fonts: F };
})();
