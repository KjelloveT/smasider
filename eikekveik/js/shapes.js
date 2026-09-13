// Eikekveik — Former (tankekart og flytskjemasymbol etter ISO 5807)
//
// Kvar form blir rekna ut frå den faktiske pikselstorleiken til noden, ikkje
// frå ein viewBox som blir strekt. Ein strekt viewBox gjer avrunda hjørne
// ovale og streken tjukkare på langsida enn på kortsida.

Eikekveik.Shapes = (function () {
    const LIST = [
        { id: 'rounded',     group: 'kart', name: 'Avrunda boks' },
        { id: 'ellipse',     group: 'kart', name: 'Ellipse' },
        { id: 'cloud',       group: 'kart', name: 'Sky' },
        { id: 'terminal',    group: 'flyt', name: 'Start/slutt',   hint: 'Der flyten byrjar eller sluttar.' },
        { id: 'process',     group: 'flyt', name: 'Prosess',       hint: 'Eit steg der noko blir gjort.' },
        { id: 'decision',    group: 'flyt', name: 'Avgjerd',       hint: 'Eit spørsmål med fleire utgangar, til dømes ja og nei.' },
        { id: 'io',          group: 'flyt', name: 'Inn/ut-data',   hint: 'Data som kjem inn eller går ut.' },
        { id: 'subprocess',  group: 'flyt', name: 'Delprosess',    hint: 'Eit steg som er skildra i eit eige skjema.' },
        { id: 'document',    group: 'flyt', name: 'Dokument',      hint: 'Eit dokument eller ein rapport.' },
        { id: 'database',    group: 'flyt', name: 'Database',      hint: 'Lagra data.' },
        { id: 'preparation', group: 'flyt', name: 'Førebuing',     hint: 'Eit steg som gjer klar til det neste.' },
        { id: 'manualInput', group: 'flyt', name: 'Inntasting',    hint: 'Data som nokon skriv inn for hand.' },
        { id: 'delay',       group: 'flyt', name: 'Venting',       hint: 'Ein pause før flyten held fram.' },
        { id: 'connector',   group: 'flyt', name: 'Koplingspunkt', hint: 'Knyter saman delar av skjemaet.' }
    ];

    const BY_ID = new Map(LIST.map(s => [s.id, s]));

    function has(id) { return BY_ID.has(id); }
    function get(id) { return BY_ID.get(id) || BY_ID.get(Eikekveik.DEFAULT_SHAPE); }
    function inGroup(group) { return LIST.filter(s => s.group === group); }

    const r1 = v => Math.round(v * 10) / 10;

    function roundedRect(w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        if (!r) return `M0 0H${w}V${h}H0Z`;
        return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}` +
            `A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}` +
            `V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
    }

    function ellipse(w, h) {
        const rx = w / 2, ry = h / 2;
        return `M0 ${ry}A${rx} ${ry} 0 1 0 ${w} ${ry}A${rx} ${ry} 0 1 0 0 ${ry}Z`;
    }

    // Ramanujan si tilnærming. Godt nok til å fordele bogane jamt.
    function ellipsePerimeter(a, b) {
        return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    }

    // Skya er bogar mellom punkt på ein ellipse. Punkta står med lik
    // bogelengd mellom seg, ikkje lik vinkel — på ein flat ellipse ville lik
    // vinkel gje små bular i endane og store på langsida. Kvar boge bular ut
    // om lag ein firedel av kordelengda, så ellipsen blir krympa så mykje at
    // bulane held seg innanfor noden.
    function cloud(w, h) {
        const n = Math.max(7, Math.min(16, Math.round((w + h) / 30)));
        const bulge = 0.26 * ellipsePerimeter(w / 2, h / 2) / n;
        const rx = Math.max(4, w / 2 - bulge);
        const ry = Math.max(4, h / 2 - bulge);

        const STEPS = 180;
        const samples = [];
        const lengths = [0];
        for (let i = 0; i <= STEPS; i++) {
            const t = Math.PI + (i / STEPS) * 2 * Math.PI;
            samples.push([w / 2 + rx * Math.cos(t), h / 2 + ry * Math.sin(t)]);
            if (i) {
                const [ax, ay] = samples[i - 1];
                lengths.push(lengths[i - 1] + Math.hypot(samples[i][0] - ax, samples[i][1] - ay));
            }
        }

        const total = lengths[STEPS];
        const pts = [];
        let j = 0;
        for (let k = 0; k < n; k++) {
            const target = total * k / n;
            while (lengths[j + 1] < target) j++;
            const f = (target - lengths[j]) / ((lengths[j + 1] - lengths[j]) || 1);
            pts.push([
                samples[j][0] + (samples[j + 1][0] - samples[j][0]) * f,
                samples[j][1] + (samples[j + 1][1] - samples[j][1]) * f
            ]);
        }

        // Punkta går med klokka på skjermen, så sweep-flag 1 bular utover.
        let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
        for (let k = 0; k < n; k++) {
            const [ax, ay] = pts[k];
            const [bx, by] = pts[(k + 1) % n];
            const r = r1(Math.hypot(bx - ax, by - ay) * 0.62);
            d += `A${r} ${r} 0 0 1 ${r1(bx)} ${r1(by)}`;
        }
        return d + 'Z';
    }

    // Omrisset (fylt og strekt) og eventuelle detaljstrekar (berre strek).
    function paths(id, w, h) {
        switch (id) {
            case 'process':
                return { outline: roundedRect(w, h, 0) };
            case 'terminal':
                return { outline: roundedRect(w, h, h / 2) };
            case 'ellipse':
            case 'connector':
                return { outline: ellipse(w, h) };
            case 'cloud':
                return { outline: cloud(w, h) };
            case 'decision':
                return { outline: `M${w / 2} 0L${w} ${h / 2}L${w / 2} ${h}L0 ${h / 2}Z` };
            case 'io': {
                const s = ioSkew(w, h);
                return { outline: `M${s} 0H${w}L${w - s} ${h}H0Z` };
            }
            case 'subprocess': {
                const d = Math.min(10, w * 0.08);
                return { outline: roundedRect(w, h, 0), detail: `M${d} 0V${h}M${w - d} 0V${h}` };
            }
            case 'document': {
                const a = documentWave(h);
                return { outline: `M0 0H${w}V${h - a}C${r1(w * 0.66)} ${h - 3 * a} ${r1(w * 0.33)} ${h + a} 0 ${h - a}Z` };
            }
            case 'database': {
                const ry = databaseLid(h);
                return {
                    outline: `M0 ${ry}A${w / 2} ${ry} 0 0 1 ${w} ${ry}V${h - ry}A${w / 2} ${ry} 0 0 1 0 ${h - ry}Z`,
                    detail: `M0 ${ry}A${w / 2} ${ry} 0 0 0 ${w} ${ry}`
                };
            }
            case 'preparation': {
                const s = Math.min(h * 0.5, w * 0.2);
                return { outline: `M${s} 0H${w - s}L${w} ${h / 2}L${w - s} ${h}H${s}L0 ${h / 2}Z` };
            }
            case 'manualInput': {
                const t = manualSlant(h);
                return { outline: `M0 ${t}L${w} 0V${h}H0Z` };
            }
            case 'delay': {
                const r = Math.min(h / 2, w / 2);
                return { outline: `M0 0H${w - r}A${r} ${h / 2} 0 0 1 ${w - r} ${h}H0Z` };
            }
            case 'rounded':
            default:
                return { outline: roundedRect(w, h, 12) };
        }
    }

    function ioSkew(w, h) { return Math.min(h * 0.4, w * 0.25); }
    function documentWave(h) { return Math.min(10, h * 0.18); }
    function databaseLid(h) { return Math.min(10, h * 0.2); }
    function manualSlant(h) { return Math.min(h * 0.35, 16); }

    // Punktet der midtlinja til noden møter omrisset på ei gitt side.
    // Linjene festar seg her, så pilspissen treffer kanten og ikkje
    // forsvinn inn under noden.
    function anchor(id, w, h, side) {
        const p = {
            top:    { x: w / 2, y: 0 },
            bottom: { x: w / 2, y: h },
            left:   { x: 0,     y: h / 2 },
            right:  { x: w,     y: h / 2 }
        }[side];

        if (id === 'io' && (side === 'left' || side === 'right')) {
            const s = ioSkew(w, h) / 2;
            p.x = side === 'left' ? s : w - s;
        } else if (id === 'document' && side === 'bottom') {
            p.y = h - documentWave(h);
        } else if (id === 'manualInput' && side === 'top') {
            p.y = manualSlant(h) / 2;
        }
        return p;
    }

    // Lita førehandsvising til knappane i panelet.
    function previewSvg(id) {
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'shape-preview');
        svg.setAttribute('viewBox', '-2 -2 48 30');
        svg.setAttribute('width', '48');
        svg.setAttribute('height', '30');
        svg.setAttribute('aria-hidden', 'true');

        const square = id === 'connector';
        const w = square ? 26 : 44;
        const h = 26;
        const g = document.createElementNS(SVG_NS, 'g');
        if (square) g.setAttribute('transform', 'translate(9 0)');

        const p = paths(id, w, h);
        for (const d of [p.outline, p.detail]) {
            if (!d) continue;
            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', d);
            g.appendChild(path);
        }
        svg.appendChild(g);
        return svg;
    }

    return { LIST, has, get, inGroup, paths, anchor, previewSvg };
})();
