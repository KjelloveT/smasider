/* Lesbare sider på prosjektoren, med lokale kontrollar for sidebyte. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, V = TS.View, el = Vy.el;
    const content = document.getElementById('displayContent');
    let t, pages = [], page = 0, paused = false, mode = '';
    function fits(draw) {
        content.replaceChildren(); draw();
        const padding = parseFloat(getComputedStyle(content.parentElement).paddingBottom) || 0;
        return content.getBoundingClientRect().bottom <= innerHeight - padding - 8;
    }
    function paginate(items, limit, draw) {
        for (let start = 0; start < items.length;) {
            let count = 1;
            for (let size = 1; size <= Math.min(limit, items.length - start); size++) {
                if (!fits(() => draw(items.slice(start, start + size)))) break;
                count = size;
            }
            const subset = items.slice(start, start + count);
            pages.push(() => draw(subset)); start += count;
        }
    }
    function build() {
        pages = [];
        document.getElementById('displayTitle').textContent = t.title;
        if (t.display.mode === 'tree' && t.matches.some(m => m.stage === 'cup')) {
            V.treeSections(t, 4).forEach(s => {
                const draw = () => content.append(el('h2', '', s.title), V.tree(t, s));
                if (fits(draw)) pages.push(draw);
                else s.rounds.forEach(ids => ids.forEach(id => pages.push(() => {
                    content.append(el('h2', '', s.title), V.tree(t, { title: s.title, rounds: [[id]] }));
                })));
            });
        } else if (t.display.mode === 'table' && t.settings.format === 'cup') {
            const final = t.matches.filter(m => m.stage === 'cup').at(-1), winner = C.resolve(t, { kind: 'winner', id: final.id });
            const list = [final, ...t.matches.filter(m => m.stage === 'bronze')];
            paginate(list, 2, subset => {
                content.append(el('h2', '', 'Sluttresultat'), el('p', '', winner.id ? 'Turneringsvinnar: ' + C.displayName(t, winner.id) : 'Vinnaren blir klar når finalen er avgjord.'));
                const grid = el('div', 'ts-match-grid');
                subset.forEach(m => { const box = V.card(t, m); box.prepend(el('h3', '', m.stage === 'bronze' ? 'Bronsefinale' : 'Finale')); grid.append(box); });
                content.append(grid);
            });
        } else if (t.display.mode === 'table') {
            const groups = t.pools.length ? t.pools : [{ id: '', ids: t.participants.map(p => p.id) }];
            groups.forEach(g => {
                const template = V.table(t, g.ids), original = template.querySelector('table');
                const rows = Array.from(original.querySelectorAll('tbody tr'));
                paginate(rows, 8, subset => {
                    const wrapper = template.cloneNode(false), table = original.cloneNode(false), body = el('tbody');
                    table.append(original.querySelector('thead').cloneNode(true));
                    subset.forEach(row => body.append(row.cloneNode(true))); table.append(body); wrapper.append(table);
                    content.append(el('h2', '', g.id ? 'Pulje ' + g.id : 'Poengtabell'), wrapper);
                });
            });
        } else {
            const pending = t.matches.filter(m => m.wave > t.activeWave && !C.done(t, m));
            const next = t.activeWave ? Math.min(...pending.map(m => m.wave), Infinity) : TS.Engine.nextWave(t);
            const active = t.matches.filter(m => t.activeWave && m.wave === t.activeWave);
            const upcoming = t.matches.filter(m => m.wave === next && !active.includes(m));
            const list = [...active, ...upcoming];
            if (!list.length) pages.push(() => content.append(el('h2', '', 'Alle oppsette kampar er ferdige'), el('p', '', t.settings.format === 'swiss' && t.rounds.length < t.settings.rounds ? 'Neste motstandar blir klar når læraren publiserer den nye runden.' : 'Sjå tabellen eller turneringstreet for sluttresultatet.')));
            paginate(list, 4, subset => {
                const grid = el('div', 'ts-match-grid');
                subset.forEach(m => grid.append(V.card(t, m)));
                content.append(el('h2', '', 'Spelar no og neste spelbolk'), grid);
            });
        }
        page = Math.min(page, Math.max(0, pages.length - 1)); render();
    }
    function render() {
        if (!t) return;
        content.replaceChildren(); pages[page]?.();
        document.getElementById('displayTitle').textContent = t.title;
        document.getElementById('pageNumber').textContent = 'Side ' + (page + 1) + ' av ' + pages.length;
        document.getElementById('pause').textContent = paused || !t.display.rotate ? 'Start sidebyte' : 'Pause sidebyte';
    }
    function move(delta) { if (pages.length) page = (page + delta + pages.length) % pages.length; render(); }
    document.getElementById('previous').addEventListener('click', () => { paused = true; move(-1); });
    document.getElementById('next').addEventListener('click', () => { paused = true; move(1); });
    document.getElementById('pause').addEventListener('click', () => { paused = !(paused || !t?.display.rotate); if (t && !t.display.rotate && !paused) t.display.rotate = true; render(); });
    document.getElementById('fullscreen').addEventListener('click', () => {
        const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        action?.catch(() => { document.getElementById('connection').textContent = 'Fullskjerm vart ikkje opna. Bruk nettlesaren sin fullskjermknapp.'; });
    });
    setInterval(() => { if (t?.display.rotate && !paused) move(1); }, 15000);
    let resizeTimer;
    root.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (t) build(); }, 80); });
    TS.Receiver.start(state => {
        if (mode !== state.display.mode) { mode = state.display.mode; page = 0; }
        t = state; build();
    });
})(window);
