/* ══════════════════════════════════════
   TEMPLATES.JS — Data-drivne maldefinisjonar for BiletFlett
   Alle posisjonar er normaliserte (0..1) i høve til lerretet,
   så malane skalerer fritt mellom portrett/landskap/kvadrat.

   Mal-skjema:
   {
     id, name, category: 'standard' | 'tema',
     orientation: 'portrait' | 'landscape' | 'square',
     palette: { bg, ink, accent, accent2, accent3 },
     background: { type:'solid'|'gradient'|'pattern', ... },   // valfri (default palette.bg)
     decor:  [ { type, layer:'back'|'front', ... } ],          // canvas-teikna pynt
     texts:  [ { id, x, y, w, text, size, font, color, align, weight, rotation, stroke, strokeW, shadow, bg } ],
     slots:  [ { x, y, w, h, frame:'plain'|'rounded'|'circle'|'polaroid', rotation, shadow } ]
   }
   ══════════════════════════════════════ */

const Templates = (() => {

    /* ---- Skrifttype-stablar (systemfontar — ingen eksterne avhengnader) ---- */
    const F = {
        play:   "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', 'Trebuchet MS', cursive",
        bold:   "'Arial Black', 'Trebuchet MS', system-ui, sans-serif",
        impact: "Impact, 'Haettenschweiler', 'Arial Black', sans-serif",
        serif:  "Georgia, 'Times New Roman', serif",
        body:   "'Trebuchet MS', system-ui, sans-serif"
    };

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
    const NEUTRAL = { bg: '#ffffff', ink: '#1a1a1a', accent: '#444444', accent2: '#888888', accent3: '#dddddd' };

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

    /* ════════ 20 TEMA-MALAR (sprek, med redigerbar tekst) ════════ */
    const tema = [

        /* 1 — Tur til skogen */
        { id: 'tur-skog', name: 'Tur til skogen', category: 'tema', orientation: 'portrait',
          palette: { bg: '#eaf4e1', ink: '#23401f', accent: '#3f7d33', accent2: '#8a5a2b', accent3: '#d8a657' },
          background: { type: 'gradient', from: '#eef6e6', to: '#cfe6c2' },
          decor: [
            { type: 'sun', layer: 'back', x: 0.84, y: 0.12, r: 0.09, color: '#f2c14e' },
            { type: 'mountains', layer: 'back', color: '#9cc78a', color2: '#3f7d33', h: 0.28 },
            { type: 'leaves', layer: 'front', count: 14, colors: ['#3f7d33', '#8a5a2b', '#d8a657'] },
            { type: 'frame', variant: 'tape-corners', color: '#8a5a2b' }
          ],
          texts: [
            { id: 'title', x: 0.08, y: 0.085, w: 0.84, text: 'Tur til skogen', size: 0.10, font: F.play, color: '#23401f', align: 'center', rotation: -2 },
            { id: 'date', x: 0.08, y: 0.20, w: 0.84, text: 'Dato og stad', size: 0.038, font: F.body, color: '#3f7d33', align: 'center' }
          ],
          slots: [
            { x: 0.10, y: 0.27, w: 0.50, h: 0.30, frame: 'polaroid', rotation: -3 },
            { x: 0.46, y: 0.40, w: 0.45, h: 0.27, frame: 'polaroid', rotation: 3 },
            { x: 0.13, y: 0.62, w: 0.48, h: 0.30, frame: 'polaroid', rotation: 2 },
            { x: 0.52, y: 0.66, w: 0.40, h: 0.26, frame: 'polaroid', rotation: -2 }
          ] },

        /* 2 — På tur: dagsoppsummering (tidslinje med bilettekst) */
        { id: 'tur-dagsoppsummering', name: 'Dagsoppsummering', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fdf6ec', ink: '#3a2e22', accent: '#c2682b', accent2: '#2f7d8a', accent3: '#e8b84b' },
          background: { type: 'solid', color: '#fdf6ec' },
          decor: [
            { type: 'ribbonBanner', x: 0.06, y: 0.05, w: 0.88, h: 0.10, color: '#c2682b' },
            { type: 'timeline', x: 0.20, color: '#c2682b' },
            { type: 'frame', variant: 'solid', color: '#3a2e22' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.063, w: 0.88, text: 'Dagen vår', size: 0.07, font: F.bold, color: '#ffffff', align: 'center' },
            { id: 'cap1', x: 0.30, y: 0.20, w: 0.62, text: 'Først …', size: 0.034, font: F.body, color: '#3a2e22', align: 'left' },
            { id: 'cap2', x: 0.30, y: 0.40, w: 0.62, text: 'Så …', size: 0.034, font: F.body, color: '#3a2e22', align: 'left' },
            { id: 'cap3', x: 0.30, y: 0.60, w: 0.62, text: 'Etterpå …', size: 0.034, font: F.body, color: '#3a2e22', align: 'left' },
            { id: 'cap4', x: 0.30, y: 0.80, w: 0.62, text: 'Til slutt …', size: 0.034, font: F.body, color: '#3a2e22', align: 'left' }
          ],
          slots: [
            { x: 0.06, y: 0.18, w: 0.20, h: 0.16, frame: 'rounded' },
            { x: 0.06, y: 0.38, w: 0.20, h: 0.16, frame: 'rounded' },
            { x: 0.06, y: 0.58, w: 0.20, h: 0.16, frame: 'rounded' },
            { x: 0.06, y: 0.78, w: 0.20, h: 0.16, frame: 'rounded' }
          ] },

        /* 3 — Strandtur / sommartur */
        { id: 'tur-strand', name: 'Strandtur', category: 'tema', orientation: 'landscape',
          palette: { bg: '#e6f7ff', ink: '#0b3a52', accent: '#0d9bd1', accent2: '#f4c542', accent3: '#ff9e5e' },
          background: { type: 'gradient', from: '#bdecff', to: '#fff4d6' },
          decor: [
            { type: 'sun', layer: 'back', x: 0.12, y: 0.16, r: 0.10, color: '#f4c542' },
            { type: 'waves', layer: 'front', color: '#0d9bd1', color2: '#5cc8ee', h: 0.18 },
            { type: 'sparkles', layer: 'front', count: 16, color: '#ffffff' },
            { type: 'frame', variant: 'double', color: '#0d9bd1' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Sommar ved sjøen', size: 0.085, font: F.play, color: '#0b3a52', align: 'center', rotation: -1 }
          ],
          slots: [
            { x: 0.08, y: 0.27, w: 0.40, h: 0.42, frame: 'polaroid', rotation: -3 },
            { x: 0.52, y: 0.24, w: 0.40, h: 0.34, frame: 'polaroid', rotation: 2 },
            { x: 0.56, y: 0.55, w: 0.34, h: 0.30, frame: 'polaroid', rotation: -2 }
          ] },

        /* 4 — Fjelltur */
        { id: 'tur-fjell', name: 'Fjelltur', category: 'tema', orientation: 'portrait',
          palette: { bg: '#eef2f5', ink: '#22323d', accent: '#4a6b7c', accent2: '#9fb6c2', accent3: '#d98c5f' },
          background: { type: 'gradient', from: '#dfe9ef', to: '#b9cfd9' },
          decor: [
            { type: 'mountains', layer: 'back', color: '#9fb6c2', color2: '#4a6b7c', h: 0.40, snow: true },
            { type: 'sun', layer: 'back', x: 0.80, y: 0.14, r: 0.07, color: '#ffe2a8' },
            { type: 'frame', variant: 'solid', color: '#22323d' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'På toppen!', size: 0.11, font: F.impact, color: '#22323d', align: 'center' },
            { id: 'sub', x: 0.06, y: 0.205, w: 0.88, text: 'Kor høgt kom vi?', size: 0.04, font: F.body, color: '#4a6b7c', align: 'center' }
          ],
          slots: [
            { x: 0.10, y: 0.30, w: 0.80, h: 0.34, frame: 'rounded' },
            { x: 0.10, y: 0.67, w: 0.385, h: 0.26, frame: 'rounded' },
            { x: 0.515, y: 0.67, w: 0.385, h: 0.26, frame: 'rounded' }
          ] },

        /* 5 — Gardsbesøk / dyr */
        { id: 'tur-gard', name: 'Gardsbesøk', category: 'tema', orientation: 'portrait',
          palette: { bg: '#f6f0e2', ink: '#4a2f1b', accent: '#c0392b', accent2: '#7a9e3f', accent3: '#e0b54a' },
          background: { type: 'solid', color: '#f6f0e2' },
          decor: [
            { type: 'grass', layer: 'back', color: '#7a9e3f', h: 0.16 },
            { type: 'polkaDots', layer: 'back', count: 26, color: '#e0b54a', r: 0.012 },
            { type: 'frame', variant: 'scallop', color: '#c0392b' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'På garden', size: 0.10, font: F.play, color: '#c0392b', align: 'center', rotation: -2 }
          ],
          slots: [
            { x: 0.09, y: 0.24, w: 0.40, h: 0.32, frame: 'polaroid', rotation: -3 },
            { x: 0.52, y: 0.24, w: 0.40, h: 0.32, frame: 'polaroid', rotation: 3 },
            { x: 0.30, y: 0.55, w: 0.42, h: 0.32, frame: 'polaroid', rotation: 1 }
          ] },

        /* 6 — Bursdag i barnehagen */
        { id: 'bursdag-barnehage', name: 'Bursdag i barnehagen', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fff0f6', ink: '#7a1f4f', accent: '#e84393', accent2: '#4aa3df', accent3: '#ffd23f' },
          background: { type: 'gradient', from: '#fff4fa', to: '#ffe1ef' },
          decor: [
            { type: 'bunting', layer: 'back', y: 0.045, colors: ['#e84393', '#4aa3df', '#ffd23f', '#7bd389'] },
            { type: 'balloons', layer: 'back', x: 0.10, y: 0.34, colors: ['#e84393', '#ffd23f', '#4aa3df'] },
            { type: 'balloons', layer: 'back', x: 0.90, y: 0.34, colors: ['#4aa3df', '#e84393', '#7bd389'] },
            { type: 'confetti', layer: 'front', count: 60, colors: ['#e84393', '#4aa3df', '#ffd23f', '#7bd389'] },
            { type: 'frame', variant: 'solid', color: '#e84393' }
          ],
          texts: [
            { id: 'title', x: 0.10, y: 0.12, w: 0.80, text: 'Gratulerer med dagen!', size: 0.082, font: F.play, color: '#ffffff', align: 'center', rotation: -2, bg: { color: '#e84393', pad: 0.02 } },
            { id: 'name', x: 0.10, y: 0.62, w: 0.80, text: 'Namn', size: 0.075, font: F.bold, color: '#7a1f4f', align: 'center' },
            { id: 'age', x: 0.10, y: 0.72, w: 0.80, text: 'blir 4 år', size: 0.05, font: F.body, color: '#e84393', align: 'center' }
          ],
          slots: [
            { x: 0.24, y: 0.27, w: 0.52, h: 0.33, frame: 'circle' }
          ] },

        /* 7 — Bursdagsbarnet (krone) */
        { id: 'bursdag-krone', name: 'Bursdagsbarnet', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fff7e6', ink: '#6b3f12', accent: '#f2a900', accent2: '#e8523f', accent3: '#7b5bd6' },
          background: { type: 'gradient', from: '#fff9ec', to: '#ffe9bf' },
          decor: [
            { type: 'sparkles', layer: 'back', count: 22, color: '#f2a900' },
            { type: 'crown', layer: 'front', x: 0.5, y: 0.26, w: 0.34, color: '#f2a900' },
            { type: 'stars', layer: 'front', count: 12, colors: ['#e8523f', '#7b5bd6', '#f2a900'] },
            { type: 'frame', variant: 'double', color: '#f2a900' }
          ],
          texts: [
            { id: 'age', x: 0.10, y: 0.60, w: 0.80, text: '4 år i dag', size: 0.12, font: F.impact, color: '#e8523f', align: 'center' },
            { id: 'name', x: 0.10, y: 0.78, w: 0.80, text: 'Bursdagsbarnet', size: 0.06, font: F.play, color: '#6b3f12', align: 'center' }
          ],
          slots: [
            { x: 0.27, y: 0.30, w: 0.46, h: 0.28, frame: 'circle' }
          ] },

        /* 8 — Bursdagsinvitasjon */
        { id: 'bursdag-invitasjon', name: 'Bursdagsinvitasjon', category: 'tema', orientation: 'portrait',
          palette: { bg: '#eef6ff', ink: '#173a5e', accent: '#2f80ed', accent2: '#eb5757', accent3: '#f2c94c' },
          background: { type: 'solid', color: '#eef6ff' },
          decor: [
            { type: 'balloons', layer: 'back', x: 0.85, y: 0.20, colors: ['#eb5757', '#f2c94c', '#2f80ed'] },
            { type: 'confetti', layer: 'front', count: 36, colors: ['#2f80ed', '#eb5757', '#f2c94c'] },
            { type: 'frame', variant: 'solid', color: '#2f80ed' }
          ],
          texts: [
            { id: 'title', x: 0.08, y: 0.08, w: 0.84, text: 'Du er invitert!', size: 0.085, font: F.play, color: '#2f80ed', align: 'center', rotation: -2 },
            { id: 'name', x: 0.08, y: 0.60, w: 0.84, text: 'til Namn sin bursdag', size: 0.05, font: F.bold, color: '#173a5e', align: 'center' },
            { id: 'when', x: 0.08, y: 0.70, w: 0.84, text: 'Når: laurdag kl. 14', size: 0.04, font: F.body, color: '#173a5e', align: 'center' },
            { id: 'where', x: 0.08, y: 0.78, w: 0.84, text: 'Stad: heime hos oss', size: 0.04, font: F.body, color: '#173a5e', align: 'center' }
          ],
          slots: [
            { x: 0.22, y: 0.21, w: 0.56, h: 0.34, frame: 'rounded' }
          ] },

        /* 9 — Karneval / fest */
        { id: 'fest-karneval', name: 'Karneval', category: 'tema', orientation: 'landscape',
          palette: { bg: '#1b1140', ink: '#ffffff', accent: '#ff3d81', accent2: '#36e3c2', accent3: '#ffd23f' },
          background: { type: 'gradient', from: '#2a1a5e', to: '#120a2e' },
          decor: [
            { type: 'confetti', layer: 'back', count: 80, colors: ['#ff3d81', '#36e3c2', '#ffd23f', '#7b5bd6'] },
            { type: 'sparkles', layer: 'front', count: 24, color: '#ffd23f' },
            { type: 'frame', variant: 'double', color: '#ff3d81' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Karneval!', size: 0.12, font: F.impact, color: '#ffd23f', align: 'center', rotation: -2, shadow: true }
          ],
          slots: [
            { x: 0.07, y: 0.30, w: 0.27, h: 0.58, frame: 'rounded', rotation: -3 },
            { x: 0.37, y: 0.26, w: 0.27, h: 0.62, frame: 'rounded', rotation: 2 },
            { x: 0.67, y: 0.30, w: 0.27, h: 0.58, frame: 'rounded', rotation: -2 }
          ] },

        /* 10 — Første skuledag (tavle + kritt) */
        { id: 'skule-forste-dag', name: 'Første skuledag', category: 'tema', orientation: 'portrait',
          palette: { bg: '#274038', ink: '#ffffff', accent: '#f7f3e3', accent2: '#f2c94c', accent3: '#eb5757' },
          background: { type: 'solid', color: '#2f4a40' },
          decor: [
            { type: 'frame', variant: 'solid', color: '#7a5230', width: 0.04 },
            { type: 'scribbles', layer: 'front', count: 6, color: '#f7f3e3' }
          ],
          texts: [
            { id: 'title', x: 0.08, y: 0.08, w: 0.84, text: 'Mitt første skuleår', size: 0.08, font: F.play, color: '#f7f3e3', align: 'center' },
            { id: 'name', x: 0.08, y: 0.66, w: 0.84, text: 'Namn', size: 0.07, font: F.bold, color: '#f2c94c', align: 'center' },
            { id: 'class', x: 0.08, y: 0.76, w: 0.84, text: 'Klasse 1A', size: 0.045, font: F.body, color: '#f7f3e3', align: 'center' }
          ],
          slots: [
            { x: 0.24, y: 0.22, w: 0.52, h: 0.40, frame: 'rounded' }
          ] },

        /* 11 — Skuleåret oppsummert (9-rutes + merkelapp) */
        { id: 'skule-aaret', name: 'Skuleåret vårt', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fbf3ff', ink: '#3d2257', accent: '#8e44ad', accent2: '#27ae60', accent3: '#f39c12' },
          background: { type: 'solid', color: '#fbf3ff' },
          decor: [
            { type: 'ribbonBanner', x: 0.06, y: 0.045, w: 0.88, h: 0.09, color: '#8e44ad' },
            { type: 'frame', variant: 'solid', color: '#8e44ad' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.057, w: 0.88, text: 'Året vårt', size: 0.06, font: F.bold, color: '#ffffff', align: 'center' }
          ],
          slots: grid(3, 3, 0.06, 0.02).map(s => ({ ...s, y: 0.17 + (s.y - 0.06) * 0.78, h: s.h * 0.78, frame: 'rounded' })) },

        /* 12 — Klassen vår / vennskap */
        { id: 'skule-klassen', name: 'Klassen vår', category: 'tema', orientation: 'landscape',
          palette: { bg: '#fff5f5', ink: '#7a1f1f', accent: '#eb5757', accent2: '#2f80ed', accent3: '#f2c94c' },
          background: { type: 'gradient', from: '#fff7f7', to: '#ffe6e6' },
          decor: [
            { type: 'hearts', layer: 'front', count: 14, colors: ['#eb5757', '#f2994a', '#2f80ed'] },
            { type: 'frame', variant: 'scallop', color: '#eb5757' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Klassen vår', size: 0.10, font: F.play, color: '#eb5757', align: 'center', rotation: -1 }
          ],
          slots: grid(3, 2, 0.06, 0.025).map(s => ({ ...s, y: 0.26 + (s.y - 0.06) * 0.66, h: s.h * 0.78, frame: 'circle' })) },

        /* 13 — Tema-prosjekt (stor ramme) */
        { id: 'skule-prosjekt', name: 'Tema-prosjekt', category: 'tema', orientation: 'portrait',
          palette: { bg: '#f0fbff', ink: '#0b3a52', accent: '#0d9bd1', accent2: '#f2994a', accent3: '#27ae60' },
          background: { type: 'solid', color: '#f0fbff' },
          decor: [
            { type: 'frame', variant: 'double', color: '#0d9bd1' },
            { type: 'polkaDots', layer: 'back', count: 30, color: '#cfeefc', r: 0.018 }
          ],
          texts: [
            { id: 'label', x: 0.08, y: 0.08, w: 0.84, text: 'TEMA:', size: 0.045, font: F.bold, color: '#0d9bd1', align: 'center' },
            { id: 'title', x: 0.08, y: 0.12, w: 0.84, text: 'Skriv emnet her', size: 0.085, font: F.impact, color: '#0b3a52', align: 'center' }
          ],
          slots: grid(2, 2, 0.08, 0.03).map(s => ({ ...s, y: 0.28 + (s.y - 0.08) * 0.66, h: s.h * 0.78, frame: 'rounded' })) },

        /* 14 — Haust */
        { id: 'aar-haust', name: 'Haust', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fdeecf', ink: '#5c2e0e', accent: '#d35400', accent2: '#b9770e', accent3: '#e0b54a' },
          background: { type: 'gradient', from: '#fdeecf', to: '#f4c98a' },
          decor: [
            { type: 'leaves', layer: 'back', count: 22, colors: ['#d35400', '#b9770e', '#e0b54a', '#a04000'] },
            { type: 'frame', variant: 'tape-corners', color: '#d35400' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Haust', size: 0.11, font: F.serif, color: '#5c2e0e', align: 'center' }
          ],
          slots: [
            { x: 0.12, y: 0.24, w: 0.46, h: 0.32, frame: 'polaroid', rotation: -3 },
            { x: 0.46, y: 0.40, w: 0.42, h: 0.30, frame: 'polaroid', rotation: 3 },
            { x: 0.20, y: 0.64, w: 0.50, h: 0.30, frame: 'polaroid', rotation: 1 }
          ] },

        /* 15 — Vinter / snø */
        { id: 'aar-vinter', name: 'Vinterglede', category: 'tema', orientation: 'portrait',
          palette: { bg: '#e9f3fb', ink: '#1f3b5c', accent: '#5aa9e6', accent2: '#9ad0ec', accent3: '#ffffff' },
          background: { type: 'gradient', from: '#f3f9ff', to: '#cfe6f7' },
          decor: [
            { type: 'snow', layer: 'front', count: 60, color: '#ffffff' },
            { type: 'frame', variant: 'double', color: '#5aa9e6' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Vinterglede', size: 0.09, font: F.play, color: '#1f3b5c', align: 'center', rotation: -1 }
          ],
          slots: [
            { x: 0.10, y: 0.25, w: 0.80, h: 0.32, frame: 'rounded' },
            { x: 0.10, y: 0.61, w: 0.385, h: 0.30, frame: 'rounded' },
            { x: 0.515, y: 0.61, w: 0.385, h: 0.30, frame: 'rounded' }
          ] },

        /* 16 — Vår */
        { id: 'aar-vaar', name: 'Vår', category: 'tema', orientation: 'portrait',
          palette: { bg: '#eefbef', ink: '#1f5c2e', accent: '#27ae60', accent2: '#f06292', accent3: '#f7d046' },
          background: { type: 'gradient', from: '#f3fdf4', to: '#d7f3dd' },
          decor: [
            { type: 'grass', layer: 'back', color: '#27ae60', h: 0.14 },
            { type: 'flowers', layer: 'front', count: 12, colors: ['#f06292', '#f7d046', '#ba68c8'] },
            { type: 'frame', variant: 'scallop', color: '#27ae60' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'Vår i lufta', size: 0.10, font: F.play, color: '#1f5c2e', align: 'center', rotation: -2 }
          ],
          slots: [
            { x: 0.10, y: 0.25, w: 0.40, h: 0.32, frame: 'polaroid', rotation: -3 },
            { x: 0.52, y: 0.25, w: 0.40, h: 0.32, frame: 'polaroid', rotation: 3 },
            { x: 0.30, y: 0.55, w: 0.42, h: 0.30, frame: 'polaroid', rotation: 1 }
          ] },

        /* 17 — Feiring (17. mai — teikna vimplar, ingen flagg-emoji) */
        { id: 'fest-feiring', name: 'Feiring (17. mai)', category: 'tema', orientation: 'portrait',
          palette: { bg: '#ffffff', ink: '#002a6d', accent: '#ba0c2f', accent2: '#002a6d', accent3: '#f2f2f2' },
          background: { type: 'solid', color: '#ffffff' },
          decor: [
            { type: 'bunting', layer: 'back', y: 0.045, colors: ['#ba0c2f', '#ffffff', '#002a6d'] },
            { type: 'streamers', layer: 'front', colors: ['#ba0c2f', '#002a6d'] },
            { type: 'frame', variant: 'double', color: '#ba0c2f' }
          ],
          texts: [
            { id: 'title', x: 0.08, y: 0.12, w: 0.84, text: 'Hurra for dagen!', size: 0.085, font: F.impact, color: '#ba0c2f', align: 'center' }
          ],
          slots: [
            { x: 0.10, y: 0.26, w: 0.80, h: 0.34, frame: 'rounded' },
            { x: 0.10, y: 0.63, w: 0.385, h: 0.28, frame: 'rounded' },
            { x: 0.515, y: 0.63, w: 0.385, h: 0.28, frame: 'rounded' }
          ] },

        /* 18 — Jul / advent */
        { id: 'fest-jul', name: 'God jul', category: 'tema', orientation: 'portrait',
          palette: { bg: '#0f3d2e', ink: '#ffffff', accent: '#c0392b', accent2: '#1e8449', accent3: '#f1c40f' },
          background: { type: 'gradient', from: '#124a37', to: '#0a2c20' },
          decor: [
            { type: 'snow', layer: 'front', count: 50, color: '#ffffff' },
            { type: 'stars', layer: 'back', count: 16, colors: ['#f1c40f', '#ffffff'] },
            { type: 'frame', variant: 'double', color: '#c0392b' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.08, w: 0.88, text: 'God jul', size: 0.11, font: F.serif, color: '#f1c40f', align: 'center' }
          ],
          slots: [
            { x: 0.24, y: 0.24, w: 0.52, h: 0.34, frame: 'circle' },
            { x: 0.12, y: 0.62, w: 0.36, h: 0.28, frame: 'rounded', rotation: -3 },
            { x: 0.52, y: 0.62, w: 0.36, h: 0.28, frame: 'rounded', rotation: 3 }
          ] },

        /* 19 — Påske */
        { id: 'fest-paaske', name: 'God påske', category: 'tema', orientation: 'portrait',
          palette: { bg: '#fffbe6', ink: '#7a5c00', accent: '#f2c94c', accent2: '#7bd389', accent3: '#f29bb8' },
          background: { type: 'gradient', from: '#fffdf0', to: '#fdf0c4' },
          decor: [
            { type: 'polkaDots', layer: 'back', count: 30, color: '#f29bb8', r: 0.014 },
            { type: 'flowers', layer: 'front', count: 8, colors: ['#f29bb8', '#7bd389', '#f2c94c'] },
            { type: 'frame', variant: 'scallop', color: '#f2c94c' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.07, w: 0.88, text: 'God påske', size: 0.10, font: F.play, color: '#7a5c00', align: 'center', rotation: -2 }
          ],
          slots: [
            { x: 0.10, y: 0.25, w: 0.40, h: 0.32, frame: 'polaroid', rotation: -3 },
            { x: 0.52, y: 0.25, w: 0.40, h: 0.32, frame: 'polaroid', rotation: 3 },
            { x: 0.30, y: 0.55, w: 0.42, h: 0.30, frame: 'polaroid', rotation: 1 }
          ] },

        /* 20 — Minnebok */
        { id: 'minnebok', name: 'Mine beste minne', category: 'tema', orientation: 'portrait',
          palette: { bg: '#f7f1e8', ink: '#3a2f25', accent: '#b5651d', accent2: '#5a8f7b', accent3: '#d9a441' },
          background: { type: 'pattern', kind: 'paper', color: '#f7f1e8', color2: '#efe6d6' },
          decor: [
            { type: 'tape', layer: 'front', items: [
                { x: 0.18, y: 0.24, rot: -18 }, { x: 0.74, y: 0.30, rot: 14 },
                { x: 0.30, y: 0.66, rot: 8 }, { x: 0.80, y: 0.70, rot: -10 } ], color: '#d9a441' },
            { type: 'frame', variant: 'solid', color: '#3a2f25' }
          ],
          texts: [
            { id: 'title', x: 0.06, y: 0.06, w: 0.88, text: 'Mine beste minne', size: 0.075, font: F.serif, color: '#3a2f25', align: 'center' },
            { id: 'date', x: 0.55, y: 0.90, w: 0.40, text: 'Sommaren 2026', size: 0.035, font: F.body, color: '#b5651d', align: 'right', rotation: -3 }
          ],
          slots: [
            { x: 0.10, y: 0.22, w: 0.42, h: 0.30, frame: 'polaroid', rotation: -4 },
            { x: 0.52, y: 0.26, w: 0.40, h: 0.28, frame: 'polaroid', rotation: 5 },
            { x: 0.14, y: 0.60, w: 0.40, h: 0.28, frame: 'polaroid', rotation: 3 },
            { x: 0.54, y: 0.62, w: 0.38, h: 0.26, frame: 'polaroid', rotation: -3 }
          ] }
    ];

    const all = [...standard, ...tema];
    const byId = {};
    all.forEach(t => { byId[t.id] = t; });

    return {
        all,
        standard,
        tema,
        get: (id) => byId[id],
        fonts: F
    };
})();
