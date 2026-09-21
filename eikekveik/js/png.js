// Eikekveik — PNG (last ned kartet som bilete)
//
// Kartet blir bygd som ein frittståande SVG og teikna over på eit canvas.
// Det krev inga ny avhengnad, og biletet blir laga i nettlesaren — ingenting
// blir sendt nokon stad (AGENTS.md §2).
//
// Tekstlinjene blir henta frå DOM-en teikn for teikn i staden for å bli
// brotne om att med measureText. Då står linjeskifta i biletet nøyaktig der
// dei står på lerretet, og teksten kan ikkje renne ut av forma.
//
// Biletet har alltid kvit bakgrunn og mørke linjer, uansett tema. Det skal
// inn i ein presentasjon eller eit dokument, ikkje sjå ut som skjermen.

Eikekveik.Png = (function () {
    const INK = '#1a1a1a';
    const PAPER = '#ffffff';
    const PAD = 24;
    const MAX_SIDE = 8000;
    const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

    const esc = v => Vy.escapeHtml(v);

    function init() {
        Eikekveik.el.btnPng.addEventListener('click', download);
    }

    async function download() {
        const btn = Eikekveik.el.btnPng;
        btn.disabled = true;
        try {
            const built = buildSvg();
            if (!built) return;
            const blob = await rasterize(built);
            Vy.downloadBlob(blob, 'eikekveik-' + Eikekveik.Export.isoStamp() + '.png');
        } catch (err) {
            console.error(err);
            Vy.toast('Klarte ikkje å lage biletet.', { icon: 'alertTriangle', kind: 'warn' });
        } finally {
            btn.disabled = false;
        }
    }

    function buildSvg() {
        const b = Eikekveik.View.contentBounds();
        if (!b) return null;

        const width = Math.ceil(b.maxX - b.minX + 2 * PAD);
        const height = Math.ceil(b.maxY - b.minY + 2 * PAD);
        // Dobbel oppløysing så biletet er skarpt på ein projektor, men ikkje
        // større enn det nettlesarane klarer å halde i eit canvas.
        const scale = Math.min(2, MAX_SIDE / Math.max(width, height));
        const outW = Math.round(width * scale);
        const outH = Math.round(height * scale);

        const parts = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${width} ${height}">`,
            '<defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse" markerUnits="strokeWidth">',
            `<path d="M0 0L10 5L0 10Z" fill="${INK}"/></marker></defs>`,
            `<rect width="${width}" height="${height}" fill="${PAPER}"/>`,
            `<g transform="translate(${PAD - b.minX} ${PAD - b.minY})">`
        ];

        for (const edge of Eikekveik.Render.edgeItems()) {
            const markerStart = edge.ending === 'start' || edge.ending === 'both' ? ' marker-start="url(#a)"' : '';
            const markerEnd = edge.ending === 'end' || edge.ending === 'both' ? ' marker-end="url(#a)"' : '';
            parts.push(`<path d="${edge.d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"${markerStart}${markerEnd}/>`);
        }

        const k = Eikekveik.View.get().k;
        const world = Eikekveik.el.world;
        for (const n of Eikekveik.State.getNodes()) {
            const el = world.querySelector(`.node[data-id="${n.id}"]`);
            if (el) parts.push(nodeSvg(n, el, k));
        }

        parts.push('</g></svg>');
        return { svg: parts.join(''), width: outW, height: outH };
    }

    function nodeSvg(n, el, k) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const p = Eikekveik.Shapes.paths(n.shape, w, h);
        const stroke = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;

        const out = [`<g transform="translate(${n.x} ${n.y})">`];
        out.push(`<path d="${p.outline}" transform="translate(4 4)" fill="${INK}" ${stroke}/>`);
        out.push(`<path d="${p.outline}" fill="${esc(n.color)}" ${stroke}/>`);
        if (p.detail) out.push(`<path d="${p.detail}" fill="none" ${stroke}/>`);

        // Posisjonane blir målte på skjermen, der zoomen skalerer alt.
        // Deling på k gjev dei att i storleiken noden har i kartet.
        const box = el.getBoundingClientRect();
        const local = r => ({
            x: (r.left - box.left) / k,
            y: (r.top - box.top) / k,
            w: r.width / k,
            h: r.height / k
        });

        const iconEl = el.querySelector('.node-icon');
        if (n.icon && iconEl && !iconEl.hidden) {
            if (n.icon.type === 'emoji') {
                const r = local(iconEl.getBoundingClientRect());
                const size = parseFloat(getComputedStyle(iconEl).fontSize);
                out.push(`<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" font-size="${size}" text-anchor="middle" dominant-baseline="central" font-family="${esc(EMOJI_FONT)}">${esc(n.icon.value)}</text>`);
            } else {
                const svgEl = iconEl.querySelector('svg');
                const paths = window.VyrdepilIcons && VyrdepilIcons.ICON_PATHS[n.icon.value];
                if (svgEl && paths) {
                    const r = local(svgEl.getBoundingClientRect());
                    out.push(`<svg x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" viewBox="0 0 24 24" color="${INK}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`);
                }
            }
        }

        const textEl = el.querySelector('.node-text');
        if (textEl && n.text) {
            const cs = getComputedStyle(textEl);
            const font = `font-family="${esc(cs.fontFamily)}" font-size="${parseFloat(cs.fontSize)}" font-weight="${esc(cs.fontWeight)}"`;
            for (const line of textLines(textEl)) {
                const r = local(line.rect);
                out.push(`<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2}" text-anchor="middle" dominant-baseline="central" fill="${INK}" ${font}>${esc(line.text)}</text>`);
            }
        }

        out.push('</g>');
        return out.join('');
    }

    // Grupper teikna etter kva linje nettlesaren la dei på.
    function textLines(textEl) {
        const node = textEl.firstChild;
        if (!node || node.nodeType !== Node.TEXT_NODE) return [];

        const range = document.createRange();
        const lines = [];
        let cur = null;
        let i = 0;

        for (const ch of node.textContent) {
            const start = i;
            i += ch.length;
            // Mellomrom blir med i teksten, men ikkje i målinga: eit mellomrom
            // på slutten av ei linje ville elles skuve midten av linja.
            if (/\s/.test(ch)) {
                if (cur) cur.text += ch;
                continue;
            }
            range.setStart(node, start);
            range.setEnd(node, i);
            const r = range.getClientRects()[0];
            if (!r) continue;
            if (!cur || Math.abs(r.top - cur.firstTop) > r.height / 2) {
                cur = { firstTop: r.top, text: '', left: r.left, right: r.right, top: r.top, bottom: r.bottom };
                lines.push(cur);
            }
            cur.text += ch;
            cur.left = Math.min(cur.left, r.left);
            cur.right = Math.max(cur.right, r.right);
            cur.top = Math.min(cur.top, r.top);
            cur.bottom = Math.max(cur.bottom, r.bottom);
        }

        return lines
            .map(l => ({
                text: l.text.trim(),
                rect: { left: l.left, top: l.top, width: l.right - l.left, height: l.bottom - l.top }
            }))
            .filter(l => l.text);
    }

    function rasterize({ svg, width, height }) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas gav ikkje noko bilete.'));
                    }, 'image/png');
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('SVG-en lét seg ikkje teikne.'));
            };
            img.src = url;
        });
    }

    return { init, buildSvg };
})();
