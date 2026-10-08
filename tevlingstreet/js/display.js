/* Lesbare sider på prosjektoren, med lokale kontrollar for sidebyte. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, V = TS.View, el = Vy.el;
    const content = document.getElementById('displayContent');
    let t, pages = [], page = 0, paused = false, mode = '';
    function build() {
        pages = [];
        if (t.display.mode === 'tree' && t.matches.some(m => m.stage === 'cup')) {
            V.treeSections(t, 4).forEach(s => pages.push(() => { content.append(el('h2', '', s.title), V.tree(t, s)); }));
        } else if (t.display.mode === 'table') {
            const groups = t.pools.length ? t.pools : [{ id: '', ids: t.participants.map(p => p.id) }];
            groups.forEach(g => {
                const ids = C.standings(t, g.ids).map(r => r.id);
                for (let i = 0; i < ids.length; i += 8) {
                    const subset = ids.slice(i, i + 8);
                    pages.push(() => {
                        content.append(el('h2', '', g.id ? 'Pulje ' + g.id : 'Poengtabell'));
                        const table = V.table(t, g.ids), rows = table.querySelectorAll('tbody tr');
                        rows.forEach((row, index) => { if (!subset.includes(ids[index])) row.remove(); });
                        content.append(table);
                    });
                }
            });
        } else {
            const pending = t.matches.filter(m => m.wave > t.activeWave && !C.done(t, m));
            const next = t.activeWave ? Math.min(...pending.map(m => m.wave), Infinity) : TS.Engine.nextWave(t);
            const active = t.matches.filter(m => t.activeWave && m.wave === t.activeWave);
            const upcoming = t.matches.filter(m => m.wave === next && !active.includes(m));
            const list = [...active, ...upcoming];
            if (!list.length) pages.push(() => content.append(el('h2', '', 'Alle oppsette kampar er ferdige'), el('p', '', t.settings.format === 'swiss' && t.rounds.length < t.settings.rounds ? 'Neste motstandar blir klar når læraren publiserer den nye runden.' : 'Sjå tabellen eller turneringstreet for sluttresultatet.')));
            for (let i = 0; i < list.length; i += 4) {
                const subset = list.slice(i, i + 4);
                pages.push(() => {
                    const grid = el('div', 'ts-match-grid');
                    subset.forEach(m => grid.append(V.card(t, m)));
                    content.append(el('h2', '', 'Spelar no og neste spelbolk'), grid);
                });
            }
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
    TS.Receiver.start(state => {
        if (mode !== state.display.mode) { mode = state.display.mode; page = 0; }
        t = state; build();
    });
})(window);
