/* A3-innhald og målt paginering. All innskriven tekst går gjennom DOM. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, el = Vy.el;
    let t, sheets, pages, pageByMatch;
    function sheet(title, instruction) {
        const page = el('article', 'ts-sheet'), header = el('header', 'ts-sheet-header');
        const logo = el('img'); logo.src = '../_resources/vyrdepil-design/logos/tevlingstreet-mala.png'; logo.alt = '';
        const text = el('div'); text.append(el('h1', '', t.title), el('p', '', title + ' · Oppsett ' + t.setup));
        header.append(logo, text);
        const body = el('div', 'ts-sheet-body'); if (instruction) body.append(el('p', '', instruction));
        const footer = el('footer', 'ts-sheet-footer'); footer.append(el('span', '', 'Tevlingstreet · Vyrdepil'), el('span', 'ts-sheet-number'));
        page.append(header, body, footer); sheets.append(page); pages.push(page);
        return { page, body };
    }
    function fits(body) { return body.scrollHeight <= body.clientHeight + 1; }
    function table(headers, widths, className) {
        const table = el('table', 'ts-paper-table ' + (className || ''));
        const col = el('colgroup'); widths.forEach(w => { const c = el('col'); c.style.width = w + '%'; col.append(c); }); table.append(col);
        const head = el('thead'), row = el('tr'); headers.forEach(h => row.append(el('th', '', h))); head.append(row);
        const body = el('tbody'); table.append(head, body); return { table, body };
    }
    function row(values) { const row = el('tr'); values.forEach(v => row.append(el('td', '', String(v ?? '')))); return row; }
    function resultText(m) { return m.result === 'draw' ? 'Uavgjort' : m.result ? C.label(t, m.result === 'a' ? m.a : m.b) + ' vann' : ''; }
    function matchRow(m, shortNames) {
        const name = s => shortNames ? shortNames[C.resolve(t, s).id] || C.label(t, s) : C.label(t, s);
        const values = ['K' + m.id, m.wave ? 'Bolk ' + m.wave + (m.venue ? ' · ' + m.venue : '') : 'Friplass', name(m.a), name(m.b), m.result === 'draw' ? 'U' : m.result ? m.result.toUpperCase() : 'A / U / B'];
        return row(values);
    }
    function matchTable() { return table(['Kamp', 'Spelstad', 'A', 'B', 'Resultat'], [8, 18, 32, 32, 10], 'ts-paper-matches'); }
    const matchInstruction = 'Set ring rundt A når A vinn, B når B vinn, eller U ved uavgjort. Siger: WIN poeng. Uavgjort: DRAW. Tap: LOSS. Før poenga i tabellen.';
    function instructions() { return matchInstruction.replace('WIN', t.settings.win).replace('DRAW', t.settings.draw).replace('LOSS', t.settings.loss); }
    function matches(title, list, pauses) {
        let current, grid;
        function addPage() { current = sheet(title, instructions()); grid = matchTable(); current.body.append(grid.table); }
        addPage();
        list.forEach(m => {
            const r = matchRow(m); grid.body.append(r);
            if (!fits(current.body) && grid.body.children.length > 1) { r.remove(); addPage(); grid.body.append(r); }
            pageByMatch.set(m.id, pages.length);
        });
        if (pauses?.length) {
            const note = el('p', '', pauses.map(id => C.participant(t, id).name).join(', ') + (t.settings.format === 'swiss' ? ' har frirunde og får ' + t.settings.win + ' poeng.' : ' har pause utan poeng.'));
            current.body.append(note); if (!fits(current.body)) { note.remove(); current = sheet(title + ' — pause', ''); current.body.append(note); }
        }
        return current;
    }
    function standings(title, ids, target) {
        let current = target, grid;
        function addPage() { current = sheet(title, 'Summer poenga etter kvar runde. Like poeng gjev delt plass. Skriv sluttplass i den siste kolonnen.'); }
        function addTable() {
            grid = table(['Nr.', 'Deltakar', 'Siger', 'Uavgjort', 'Tap', 'Poeng', 'Plass'], [6, 46, 9, 10, 9, 10, 10]);
            current.body.append(el('h2', '', title), grid.table);
        }
        if (!current) addPage(); addTable();
        const rows = C.standings(t, ids);
        rows.forEach(r => {
            const node = row([t.order.indexOf(r.id) + 1, r.name, r.win || '', r.draw || '', r.loss || '', r.points || '', t.matches.every(m => C.done(t, m)) ? r.place : '']);
            grid.body.append(node);
            if (!fits(current.body)) {
                node.remove();
                if (!grid.body.children.length) { grid.table.previousElementSibling.remove(); grid.table.remove(); }
                addPage(); addTable(); grid.body.append(node);
            }
        });
        return current;
    }
    function cup(limit) {
        limit = limit || 16;
        const firstPage = pages.length;
        const sections = TS.View.treeSections(t, limit), destinations = new Map();
        sections.forEach(s => {
            const current = sheet(s.title, 'Set ring rundt vinnaren. Skriv namnet i vinnarfeltet og i den neste kampboksen. Ved uavgjort må kampen avgjerast før nokon går vidare.');
            const grid = el('div', 'ts-paper-tree'); grid.style.setProperty('--rounds', s.rounds.length);
            s.rounds.forEach((ids, index) => {
                const column = el('div', 'ts-paper-column'), stack = el('div', 'ts-paper-stack');
                column.append(el('h3', '', s.title === 'Bronsefinale' ? 'Bronsefinale' : 'Runde ' + t.matches.find(m => m.id === ids[0]).round));
                stack.style.setProperty('--slots', s.rounds[0].length);
                ids.forEach(id => {
                    const m = t.matches.find(m => m.id === id), box = el('div', 'ts-paper-match' + (index === s.rounds.length - 1 ? ' ts-paper-last' : ''));
                    box.style.gridRow = 'span ' + Math.pow(2, index);
                    box.append(el('p', '', 'Kamp ' + id + (m.wave ? ' · Bolk ' + m.wave + (m.venue ? ' · ' + m.venue : '') : ' · Friplass')));
                    [m.a, m.b].forEach(source => {
                        const label = el('p', 'ts-paper-name', C.label(t, source));
                        if (source?.kind === 'winner' || source?.kind === 'loser') label.dataset.sourceMatch = source.id;
                        box.append(label);
                    });
                    const winner = C.resolve(t, { kind: 'winner', id });
                    if (C.done(t, m) && !C.ready(t, m)) box.append(el('p', '', 'Går vidare utan kamp.'));
                    box.append(el('p', 'ts-paper-write', 'Vinnar: ' + (winner.id ? C.displayName(t, winner.id) : '')));
                    const dest = el('p'); destinations.set(id, dest); box.append(dest);
                    pageByMatch.set(id, pages.length); stack.append(box);
                });
                column.append(stack); grid.append(column);
            });
            current.body.append(grid);
        });
        destinations.forEach((node, id) => {
            const next = t.matches.find(m => [m.a, m.b].some(s => s?.kind === 'winner' && s.id === id));
            const bronze = t.matches.find(m => [m.a, m.b].some(s => s?.kind === 'loser' && s.id === id));
            node.textContent = next ? 'Vinnar → kamp ' + next.id + ' på ark ' + pageByMatch.get(next.id) : t.matches.find(m => m.id === id).stage === 'bronze' ? 'Vinnaren får tredjeplass.' : 'Vinnaren vinn turneringa.';
            if (bronze) node.textContent += ' Tapar → kamp ' + bronze.id + ' på ark ' + pageByMatch.get(bronze.id) + '.';
        });
        sheets.querySelectorAll('[data-source-match]').forEach(node => {
            const id = Number(node.dataset.sourceMatch); node.textContent += ' (ark ' + pageByMatch.get(id) + ')';
        });
        const tooTight = pages.slice(firstPage).some(page => {
            if (!fits(page.querySelector('.ts-sheet-body'))) return true;
            return [...page.querySelectorAll('.ts-paper-stack')].some(stack => {
                const boxes = [...stack.children].map(box => box.getBoundingClientRect());
                return boxes.some((box, index) => index && boxes[index - 1].bottom > box.top - 2);
            });
        });
        if (tooTight && limit > 2) {
            pages.splice(firstPage).forEach(page => page.remove());
            t.matches.filter(m => ['cup', 'bronze'].includes(m.stage)).forEach(m => pageByMatch.delete(m.id));
            cup(limit / 2);
        }
    }
    function groupSheet(pool, league) {
            const names = Object.fromEntries(pool.ids.map((id, i) => [id, 'P' + (i + 1)]));
            const current = sheet(league ? 'Alle kampar og poeng' : 'Pulje ' + pool.id + ' — alle kampar og poeng', instructions() + ' P-nummera viser til namna i tabellen på dette arket.');
            const score = table(['Nr.', 'Deltakar', 'Poeng', 'Plass', league ? 'Pauserunde' : 'Går vidare'], [6, 64, 10, 10, 10]);
            const ranks = C.standings(t, pool.ids);
            pool.ids.forEach(id => {
                const r = ranks.find(r => r.id === id);
                score.body.append(row([names[id], r.name, r.points || '', '', league ? t.rounds.filter(r => r.pauses.includes(id)).map(r => r.number).join(', ') : t.qualification[pool.id]?.includes(id) ? 'Ja' : '']));
            });
            current.body.append(score.table, el('p', '', league ? 'Like poeng gjev delt plass. Pause gjev ingen poeng. Spel éin bolk om gongen; sjå runden ved kampnummeret.' : 'Dei ' + t.settings.advance + ' beste går vidare. Like poeng må avgjerast av læraren. Før namnet i sluttspelruta for rett pulje og plass.'));
            const columns = el('div', 'ts-paper-columns'), all = t.matches.filter(m => league ? m.stage === 'league' : m.pool === pool.id);
            for (let i = 0; i < 2; i++) {
                const grid = table(['Kamp', 'A', 'B', 'Bolk / stad', 'Ring'], [12, 10, 10, 48, 20], 'ts-paper-compact');
                all.slice(i * Math.ceil(all.length / 2), (i + 1) * Math.ceil(all.length / 2)).forEach(m => {
                    grid.body.append(row(['K' + m.id + (league ? ' / R' + m.round : ''), names[C.resolve(t, m.a).id], names[C.resolve(t, m.b).id], m.wave + (m.venue ? ' / ' + m.venue : ''), m.result === 'draw' ? 'U' : m.result ? m.result.toUpperCase() : 'A / U / B']));
                    pageByMatch.set(m.id, pages.length);
                }); columns.append(grid.table);
            }
            current.body.append(columns);
            if (!fits(current.body)) {
                // Keep the complete pool's matches and scores on one sheet; move only the name key.
                score.table.remove();
                const namePage = sheet((league ? 'Deltakarar' : 'Pulje ' + pool.id) + ' — fulle namn', 'Denne namnelista høyrer til kampoversikta på ark ' + (pages.length) + '. Bruk P-nummera i kampane.');
                namePage.body.append(score.table);
                const short = table(['Nr.', 'Poeng', 'Plass', 'Går vidare'], [25, 25, 25, 25]);
                pool.ids.forEach(id => short.body.append(row([names[id], '', '', ''])));
                current.body.prepend(el('p', '', 'Fulle namn står på ark ' + pages.length + '.'), short.table);
            }
    }
    function pools() {
        t.pools.forEach(pool => groupSheet(pool, false));
        cup();
        // The final page references every pool and the precise qualifier slot.
        const qualification = sheet('Frå pulje til sluttspel', 'Avgjer like poeng før du fyller inn dei som går vidare. Bruk dei same namna på sluttspelarka.');
        const grid = table(['Pulje', 'Plass', 'Namn som går vidare', 'Neste kamp og ark'], [10, 10, 50, 30]);
        qualification.body.append(grid.table);
        const remaining = t.pools.flatMap(pool => Array.from({ length: t.settings.advance }, (_, i) => ({ pool, place: i + 1 })));
        let current = qualification, target = grid;
        remaining.forEach(({ pool, place }) => {
            const m = t.matches.find(m => [m.a, m.b].some(s => s?.kind === 'qualifier' && s.pool === pool.id && s.place === place));
            const r = row([pool.id, place, C.participant(t, t.qualification[pool.id]?.[place - 1])?.name || '', 'Kamp ' + m.id + ' · ark ' + pageByMatch.get(m.id)]);
            target.body.append(r);
            if (!fits(current.body)) { r.remove(); current = sheet('Frå pulje til sluttspel — framhald', 'Avgjer like poeng og fyll sluttspelarka.'); target = table(['Pulje', 'Plass', 'Namn som går vidare', 'Neste kamp og ark'], [10, 10, 50, 30]); current.body.append(target.table); target.body.append(r); }
        });
    }
    function roundRobin() {
        if (t.participants.length <= 8) {
            groupSheet({ id: '', ids: t.order }, true);
        } else {
            t.rounds.forEach(r => matches('Runde ' + r.number, r.matches.map(id => t.matches.find(m => m.id === id)), r.pauses));
            standings('Samla poengoversikt');
        }
    }
    function begin(state) { t = state; sheets = document.getElementById('sheets'); sheets.replaceChildren(); pages = []; pageByMatch = new Map(); }
    function finish() {
        const count = pages.length;
        pages.forEach((page, i) => { page.querySelector('.ts-sheet-number').textContent = 'Ark ' + (i + 1) + ' av ' + count; });
        const bad = pages.filter(page => !fits(page.querySelector('.ts-sheet-body')));
        bad.forEach(page => page.classList.add('ts-sheet-overflow'));
        return { count, overflow: bad.length };
    }
    TS.Paper = { begin, finish, sheet, fits, table, row, matches, standings, cup, pools, roundRobin, instructions, get tournament() { return t; }, get pages() { return pages; } };
})(window);
