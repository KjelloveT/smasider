/* Delte DOM-visingar for lærar og storskjerm. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, el = Vy.el;
    function table(t, ids, editable) {
        const wrapper = el('div', 'ts-table-wrap'), table = el('table', 'vp-data-table ts-table');
        const head = el('thead'), tr = el('tr');
        ['Plass', 'Deltakar', 'Spelt', 'Siger', 'Uavgjort', 'Tap', 'Frirunde', 'Poeng'].forEach(s => tr.append(el('th', '', s)));
        head.append(tr); table.append(head);
        const body = el('tbody');
        C.standings(t, ids).forEach(r => {
            const row = el('tr');
            [r.place + '.', r.name, r.played, r.win, r.draw, r.loss, r.bye, r.points].forEach(v => row.append(el('td', '', String(v))));
            body.append(row);
        });
        table.append(body); wrapper.append(table); return wrapper;
    }
    function card(t, m, onResult) {
        const card = el('article', 'vp-panel vp-panel--plain vp-panel--compact ts-match');
        const meta = el('p', 'vp-help', 'Kamp ' + m.id + (m.venue ? ' · ' + m.venue : '') + (m.wave ? ' · Bolk ' + m.wave : ''));
        const sides = el('div', 'ts-match-sides');
        [m.a, m.b].forEach((source, index) => {
            const row = el('div', 'ts-match-side'), name = el('strong', '', C.label(t, source));
            row.append(name);
            if (t.display.members) {
                const p = C.participant(t, C.resolve(t, source).id);
                if (p?.members?.length) row.append(el('small', '', p.members.map(s => s.name).join(', ')));
            }
            if (onResult && C.ready(t, m)) {
                const b = el('button', 'vp-button vp-button--positive vp-button--compact', 'Vann');
                b.type = 'button'; b.setAttribute('aria-label', C.label(t, source) + ' vann kamp ' + m.id);
                b.setAttribute('aria-pressed', String(m.result === (index ? 'b' : 'a')));
                b.addEventListener('click', () => onResult(m.id, index ? 'b' : 'a'));
                row.append(b);
            }
            if (m.result === (index ? 'b' : 'a')) row.append(el('span', 'ts-status', 'Vinnar'));
            sides.append(row);
        });
        card.append(meta, sides);
        let text = '';
        if (m.result === 'draw') text = ['cup', 'bronze'].includes(m.stage) ? 'Uavgjort — må avgjerast' : 'Uavgjort';
        else if (!C.ready(t, m)) text = C.done(t, m) ? 'Går vidare utan kamp' : 'Vent på motstandarane';
        else if (!m.result) text = m.wave === t.activeWave ? 'Spelar no' : 'Klar for kamp';
        if (text) card.append(el('p', 'vp-help', text));
        if (onResult && C.ready(t, m)) {
            const actions = el('div', 'vp-toolbar-group');
            [['Uavgjort', 'draw'], ['Tøm resultat', null]].forEach(([name, value]) => {
                const b = el('button', 'vp-button vp-button--compact', name); b.type = 'button';
                if (value) b.setAttribute('aria-pressed', String(m.result === value));
                b.disabled = value === null && !m.result;
                b.addEventListener('click', () => onResult(m.id, value)); actions.append(b);
            });
            card.append(actions);
        }
        return card;
    }
    function treeSections(t, maxLeaves) {
        maxLeaves = maxLeaves || (t.participants.some(p => p.name.length > 35) ? 8 : 16);
        const rounds = t.rounds.filter(r => r.stage === 'cup');
        if (!rounds.length) return [];
        const depth = Math.max(1, Math.floor(Math.log2(maxLeaves))), sections = [];
        for (let start = 0; start < rounds.length; start += depth) {
            const end = Math.min(rounds.length, start + depth), roots = rounds[end - 1].matches;
            roots.forEach((id, i) => {
            const included = new Set();
            function visit(id) {
                if (included.has(id)) return; included.add(id);
                const m = t.matches.find(m => m.id === id);
                [m.a, m.b].forEach(s => { if (s?.kind === 'winner' && t.matches.find(x => x.id === s.id).round > start) visit(s.id); });
            }
            visit(id);
            sections.push({ title: start ? 'Sluttspel · del ' + (i + 1) : roots.length === 1 ? 'Turneringstreet' : 'Grein ' + (i + 1), rootId: id, rounds: rounds.slice(start, end).map(r => r.matches.filter(id => included.has(id))) });
            });
        }
        const bronze = t.matches.find(m => m.stage === 'bronze');
        if (bronze) sections.push({ title: 'Bronsefinale', rootId: bronze.id, rounds: [[bronze.id]] });
        return sections;
    }
    function tree(t, section) {
        const grid = el('div', 'ts-tree'); grid.style.setProperty('--rounds', section.rounds.length);
        const largest = section.rounds[0].length;
        section.rounds.forEach((ids, index) => {
            const column = el('div', 'ts-tree-column');
            column.append(el('h3', '', section.title === 'Bronsefinale' ? 'Bronse' : 'Runde ' + t.matches.find(m => m.id === ids[0]).round));
            const stack = el('div', 'ts-tree-stack'); stack.style.setProperty('--slots', largest);
            ids.forEach(id => {
                const box = card(t, t.matches.find(m => m.id === id)); box.classList.add('ts-tree-node');
                const next = t.matches.find(m => [m.a, m.b].some(s => s?.kind === 'winner' && s.id === id));
                if (next) box.append(el('p', 'vp-help', 'Vinnaren går til kamp ' + next.id + '.'));
                box.style.gridRow = 'span ' + Math.pow(2, index); stack.append(box);
            });
            column.append(stack); grid.append(column);
        });
        return grid;
    }
    TS.View = { table, card, treeSections, tree };
})(window);
