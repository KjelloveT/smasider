/* Ein full papirpakke for sveitser, utan krav om datamaskin undervegs. */
(function (root) {
    'use strict';
    const TS = root.TS, P = TS.Paper, C = TS.Core, el = Vy.el;
    function guide(t) {
        const current = P.sheet('Sveitser — slik lagar du neste runde', 'Dette er ei enkel skuleturnering. Ingen skal møte same motstandar to gonger. Alle spelar heile turneringa.');
        const steps = el('ol');
        [
            'Før resultatet i kampoversikta: A vann, B vann eller Uavgjort. Fullfør alle kampane i runden.',
            'Summer poenga: siger gjev ' + t.settings.win + ', uavgjort ' + t.settings.draw + ' og tap ' + t.settings.loss + '. Skriv poenga og motstandarnummeret i historikken og på sorteringskortet.',
            'Ved oddetal: gje frirunde til ein av dei med færrast poeng som ikkje har hatt frirunde før. Frirunden gjev ' + t.settings.win + ' poeng. Legg kortet til side.',
            'Sorter korta frå flest til færrast poeng. Like poeng treng inga rangering. Ta eitt kort og finn ein ledig motstandar med om lag like mange poeng, som eleven eller laget ikkje har møtt før.',
            'Dersom dei siste korta ikkje kan møtast: løys opp det sist laga paret. Prøv å byte ein deltakar med eitt av dei siste korta. Kontroller begge dei nye para mot historikken. Om det ikkje går, løys opp fleire par og prøv andre kombinasjonar.',
            'Kontroller: kvart namn står éin gong, alle har ein motstandar eller frirunde, ingen har møtt kvarandre før, og ingen får to frirundar. Ikkje publiser eit oppsett før alt stemmer.',
            'Skriv namna i neste rundeark, fordel kampane på dei trykte banene/borda og vis arket til elevane. Set i gang éin spelbolk om gongen.',
            'Etter siste runde: summer alle poenga. Like poeng gjev delt plass. Læraren kan avgjere med omkamp eller loddtrekking dersom de treng éin vinnar.'
        ].forEach(text => { const li = el('li', '', text); li.style.marginBottom = '4mm'; steps.append(li); });
        current.body.append(steps, el('p', '', 'Tal på rundar: ' + t.settings.rounds + '. «Nr.» viser til det faste deltakarnummeret i historikken og på sorteringskorta. Bruk nummer når namna er like.'));
        if (t.participants.length > 32) current.body.append(el('p', '', 'Stor turnering: manuell paring krev mykje arbeid. Digital paring i Tevlingstreet er tilrådd. Om de ikkje finn gyldige par, bruk den digitale paringsdialogen til å prøve fleire kombinasjonar.'));
    }
    function rounds(t) {
        const perRound = Math.floor(t.participants.length / 2), capacity = t.settings.venues.length || perRound, waves = Math.ceil(perRound / capacity);
        for (let n = 1; n <= t.settings.rounds; n++) {
            const existing = t.rounds.find(r => r.number === n);
            if (existing) { P.matches('Sveitser · runde ' + n, existing.matches.map(id => t.matches.find(m => m.id === id)), existing.pauses); continue; }
            let current, grid;
            function add() {
                current = P.sheet('Sveitser · runde ' + n + ' — fyll inn motstandarane', P.instructions() + ' Bruk oppskrifta for paring, og kontroller alle namna før de byrjar.');
                grid = P.table(['Kamp', 'Bolk / stad', 'A — namn eller nr.', 'B — namn eller nr.', 'Ring'], [8, 18, 32, 32, 10], 'ts-paper-matches');
                current.body.append(grid.table);
            }
            add();
            for (let i = 0; i < perRound; i++) {
                const venue = t.settings.venues[i % capacity];
                const row = P.row(['K' + ((n - 1) * perRound + i + 1), 'Bolk ' + ((n - 1) * waves + Math.floor(i / capacity) + 1) + (venue ? ' · ' + venue : ''), '', '', 'A / U / B']);
                grid.body.append(row);
                if (!P.fits(current.body) && grid.body.children.length > 1) { row.remove(); add(); grid.body.append(row); }
            }
            if (t.participants.length % 2) {
                const note = el('p', 'ts-paper-write', 'Frirunde: ____________________________________ · ' + t.settings.win + ' poeng. Kontroller at deltakaren ikkje har hatt frirunde før.');
                current.body.append(note);
                if (!P.fits(current.body)) { note.remove(); current = P.sheet('Sveitser · runde ' + n + ' — frirunde', ''); current.body.append(note); }
            }
        }
    }
    function history(t) {
        let current, grid;
        function add() {
            current = P.sheet('Poeng og motstandarhistorikk', 'Skriv poenga og motstandaren sitt nr. etter kvar runde. Skriv F ved frirunde. Summer i «Sum». Like poeng gjev delt plass.');
            grid = P.table(['Nr.', 'Deltakar', ...Array.from({ length: t.settings.rounds }, (_, i) => 'R' + (i + 1) + ' poeng / nr.'), 'Sum'], [4, 26, ...Array(t.settings.rounds).fill(62 / t.settings.rounds), 8]); current.body.append(grid.table);
        }
        add();
        t.order.forEach((id, index) => {
            const values = Array.from({ length: t.settings.rounds }, (_, i) => {
                const r = t.rounds.find(r => r.number === i + 1);
                if (!r) return '';
                if (r.pauses.includes(id)) return t.settings.win + ' / F';
                const m = t.matches.find(m => r.matches.includes(m.id) && [m.a.id, m.b.id].includes(id));
                if (!m?.result) return '';
                const side = m.a.id === id ? 'a' : 'b', other = side === 'a' ? m.b.id : m.a.id;
                return t.settings[m.result === 'draw' ? 'draw' : m.result === side ? 'win' : 'loss'] + ' / ' + (t.order.indexOf(other) + 1);
            });
            const row = P.row([index + 1, C.participant(t, id).name, ...values, '']);
            grid.body.append(row);
            if (!P.fits(current.body) && grid.body.children.length > 1) { row.remove(); add(); grid.body.append(row); }
        });
    }
    function cards(t) {
        let current, grid;
        function add() { current = P.sheet('Sorteringskort — klipp ut og par deltakarane', 'Skriv nye poeng og motstandarnummer etter kvar runde. Sorter korta etter samla poeng. Legg to gyldige motstandarar saman.'); grid = el('div', 'ts-paper-card-grid'); current.body.append(grid); }
        add();
        t.order.forEach((id, index) => {
            const card = el('div', 'ts-paper-sort-card'); card.append(el('strong', '', (index + 1) + '. ' + C.participant(t, id).name), el('p', '', 'Poeng: '), el('p', '', 'Møtt nr.: '), el('p', '', 'Frirunde: '));
            grid.append(card);
            if (!P.fits(current.body) && grid.children.length > 1) { card.remove(); add(); grid.append(card); }
        });
    }
    TS.PaperSwiss = { render(t) { guide(t); rounds(t); history(t); cards(t); } };
})(window);
