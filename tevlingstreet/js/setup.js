/* Tevlingstreet — deltakarar, lag og startval. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, el = Vy.el, L = VyrdepilElevgrupper, U = VyrdepilElevgrupperUI;
    function render(app) {
        const d = app.draft, area = app.area;
        area.replaceChildren();
        delete area.dataset.tournamentId;
        const grid = el('div', 'ts-setup-grid');
        const people = el('section', 'vp-panel vp-panel--plain ts-stack');
        people.append(el('h2', 'vp-heading', '1. Vel deltakarar'));
        const title = el('input', 'vp-input'); title.value = d.title; title.maxLength = 120;
        title.addEventListener('input', () => { d.title = title.value; app.saveDraft(); });
        people.append(U.field('Namn på turneringa', title));
        const mode = el('select', 'vp-input'); mode.append(new Option('Enkeltelevar', 'students'), new Option('Lag med elevar', 'teams')); mode.value = d.mode;
        mode.addEventListener('change', async () => {
            if (d.rows.length && !await Vy.confirmAction('Dette tømmer deltakarlista i dette oppsettet. Biblioteket blir ikkje endra.', 'Byte deltakarform', 'Byte og tøm')) { mode.value = d.mode; return; }
            d.mode = mode.value; d.rows = []; d.studentPool = []; app.refreshSetup();
        });
        people.append(U.field('Kven skal tevle?', mode));
        const sourceActions = el('div', 'vp-toolbar-group');
        sourceActions.append(U.button('Hent elevar eller grupper', () => U.open({ kind: d.mode === 'teams' ? 'any' : 'students', onChoose: item => {
            if (d.mode === 'teams' && item.kind === 'groups') {
                d.rows = item.groups.map(g => ({ id: Vy.uuid(), name: g.name, members: item.students.filter(s => g.memberIds.includes(s.id)) }));
                d.studentPool = item.students;
            } else if (d.mode === 'teams') d.studentPool = item.students;
            else d.rows = item.students.map(s => ({ id: s.id, name: s.name, members: [] }));
            d.settings = C.defaults(d.rows.length); app.refreshSetup();
        } })));
        if (d.mode === 'teams') {
            const count = el('input', 'vp-input'); count.type = 'number'; count.min = 2; count.max = 128; count.value = 4;
            sourceActions.append(U.field('Tal lag ved tilfeldig trekking', count), U.button('Trekk jamstore lag', () => {
                const n = Number(count.value);
                if (!Number.isInteger(n) || n < 2 || n > 128 || d.studentPool.length < n) return app.error('Hent minst like mange elevar som lag, og vel 2–128 lag.');
                const shuffled = Vy.shuffle(d.studentPool);
                d.rows = Array.from({ length: n }, (_, i) => ({ id: Vy.uuid(), name: 'Lag ' + (i + 1), members: [] }));
                shuffled.forEach((s, i) => d.rows[i % n].members.push(s)); d.settings = C.defaults(n); app.refreshSetup();
            }));
            people.append(el('p', 'vp-help', d.studentPool.length + ' elevar klare til trekking. Hent ei elevliste eller legg namn til elevutvalet nedanfor.'));
        }
        people.append(sourceActions);
        const paste = el('textarea', 'vp-input'); paste.rows = 4;
        people.append(U.field(d.mode === 'teams' ? 'Lagnamn — eitt per linje' : 'Elevnamn — eitt per linje', paste), U.button('Legg til deltakarane', () => {
            const names = paste.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            if (d.rows.length + names.length > 128 || names.some(n => n.length > 120)) return app.error('Bruk høgst 128 deltakarar og namn på høgst 120 teikn.');
            d.rows.push(...names.map(name => ({ id: Vy.uuid(), name, members: [] })));
            d.settings = C.defaults(d.rows.length); app.refreshSetup();
        }, true));
        if (d.mode === 'teams') {
            const students = el('textarea', 'vp-input'); students.rows = 3;
            people.append(U.field('Elevutval til laga — eitt namn per linje', students), U.button('Legg til elevutvalet', () => {
                try { d.studentPool.push(...L.students(students.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean))); app.refreshSetup(); } catch (e) { app.error(e.message); }
            }));
        }
        const roster = el('div', 'ts-roster');
        d.rows.forEach((p, i) => {
            const row = el('div', 'ts-person'), name = el('input', 'vp-input');
            name.value = p.name; name.maxLength = 120; name.setAttribute('aria-label', 'Namn på deltakar ' + (i + 1));
            name.addEventListener('input', () => { p.name = name.value; app.saveDraft(); });
            row.append(el('span', '', String(i + 1)), name, U.button('Fjern', () => { d.rows.splice(i, 1); app.refreshSetup(); }));
            if (d.mode === 'teams') {
                const members = el('div', 'ts-members');
                p.members.forEach(s => {
                    const r = el('div', 'ts-member'), n = el('input', 'vp-input'), move = el('select', 'vp-input');
                    n.value = s.name; n.maxLength = 120; n.setAttribute('aria-label', 'Elevnamn på ' + p.name);
                    n.addEventListener('input', () => { s.name = n.value; app.saveDraft(); });
                    d.rows.forEach(team => move.append(new Option('Til ' + team.name, team.id)));
                    move.value = p.id; move.setAttribute('aria-label', 'Flytt ' + s.name + ' til lag');
                    move.addEventListener('change', () => { p.members = p.members.filter(x => x.id !== s.id); d.rows.find(x => x.id === move.value).members.push(s); app.refreshSetup(); });
                    r.append(n, move, U.button('Fjern elev', () => { p.members = p.members.filter(x => x.id !== s.id); app.refreshSetup(); })); members.append(r);
                });
                const choose = el('select', 'vp-input'); choose.setAttribute('aria-label', 'Legg elev til ' + p.name);
                choose.append(new Option('Vel frå elevutvalet …', ''));
                const assigned = new Set(d.rows.flatMap(p => p.members.map(s => s.id)));
                d.studentPool.filter(s => !assigned.has(s.id)).forEach(s => choose.append(new Option(s.name + ' (nr. ' + (d.studentPool.findIndex(p => p.id === s.id) + 1) + ')', s.id)));
                choose.addEventListener('change', () => { const s = d.studentPool.find(s => s.id === choose.value); if (s) { p.members.push(L.clone(s)); app.refreshSetup(); } });
                const newName = el('input', 'vp-input'); newName.placeholder = 'Nytt elevnamn'; newName.maxLength = 120; newName.setAttribute('aria-label', 'Nytt elevnamn på ' + p.name);
                const add = el('div', 'ts-member'); add.append(choose, newName, U.button('Legg elev til laget', () => {
                    if (!newName.value.trim()) return app.error('Skriv eit elevnamn.');
                    p.members.push({ id: Vy.uuid(), name: newName.value.trim() }); app.refreshSetup();
                })); members.append(add); row.append(members);
            }
            roster.append(row);
        });
        people.append(el('h3', '', d.rows.length + ' deltakarar'), roster);
        if (d.rows.length) people.append(U.button('Lagre deltakarane i elevbiblioteket', () => {
            if (d.mode === 'teams') {
                if (d.rows.some(p => !p.members.length)) return app.error('Legg minst éin elev på kvart lag før du lagrar eit gruppesett. Turneringa kan elles bruke lag utan elevnamn.');
                U.editor({ kind: 'groups', name: d.title, students: d.rows.flatMap(p => p.members), groups: d.rows.map(p => ({ id: p.id, name: p.name, memberIds: p.members.map(s => s.id) })) });
            } else U.editor({ kind: 'roster', name: d.title, students: d.rows.map(p => ({ id: p.id, name: p.name })), groups: [] });
        }));
        const settings = el('section', 'vp-panel vp-panel--plain ts-stack');
        settings.append(el('h2', 'vp-heading', '2. Vel turneringsform'));
        const forms = el('fieldset', 'ts-stack'); forms.append(el('legend', 'vp-label', 'Korleis skal de tevle?'));
        Object.entries(C.formats).forEach(([id, format]) => {
            const label = el('label', 'vp-choice ts-format'), radio = el('input'); radio.type = 'radio'; radio.name = 'format'; radio.value = id; radio.checked = d.settings.format === id;
            radio.addEventListener('change', () => { d.settings.format = id; app.refreshSetup(); });
            label.append(radio, el('strong', '', format.name), el('span', 'ts-choice-description', format.description)); forms.append(label);
        });
        settings.append(forms, el('h2', 'vp-heading', '3. Reglar og spelstader'));
        const numbers = el('div', 'ts-inline');
        [['win', 'Poeng for siger'], ['draw', 'Poeng for uavgjort'], ['loss', 'Poeng for tap']].forEach(([key, label]) => {
            const input = el('input', 'vp-input'); input.type = 'number'; input.min = 0; input.max = 100; input.step = 0.5; input.value = d.settings[key];
            input.addEventListener('input', () => { d.settings[key] = Number(input.value); app.saveDraft(); }); numbers.append(U.field(label, input));
        }); settings.append(numbers);
        if (d.settings.format === 'pools') {
            const count = el('input', 'vp-input'); count.type = 'number'; count.min = Math.max(2, Math.ceil(d.rows.length / 8)); count.max = Math.floor(d.rows.length / 3); count.value = d.settings.poolCount;
            count.addEventListener('change', () => { d.settings.poolCount = Number(count.value); app.refreshSetup(); });
            const advance = el('select', 'vp-input'); advance.append(new Option('Éin frå kvar pulje', 1), new Option('To frå kvar pulje', 2)); advance.value = d.settings.advance;
            advance.addEventListener('change', () => { d.settings.advance = Number(advance.value); app.refreshSetup(); });
            settings.append(U.field('Tal puljar — 3–8 deltakarar i kvar', count), U.field('Kven går vidare?', advance));
        }
        if (d.settings.format === 'swiss') {
            const rounds = el('input', 'vp-input'); rounds.type = 'number'; rounds.min = 1; rounds.max = Math.max(1, C.maxSwiss(d.rows.length)); rounds.value = d.settings.rounds;
            rounds.addEventListener('change', () => { d.settings.rounds = Number(rounds.value); app.refreshSetup(); });
            settings.append(U.field('Tal rundar', rounds), el('p', 'vp-help', 'Frirunde gjev like mange poeng som siger. Store sveitserturneringar er lettare å pare digitalt; arka har òg ei oppskrift for manuell paring.'));
        }
        if (['cup', 'pools'].includes(d.settings.format)) {
            const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = d.settings.bronze;
            checkbox.addEventListener('change', () => { d.settings.bronze = checkbox.checked; app.saveDraft(); });
            const label = el('label', 'vp-choice'); label.append(checkbox, el('span', '', 'Ta med bronsefinale')); settings.append(label);
        }
        const venues = el('textarea', 'vp-input'); venues.rows = 3; venues.value = d.settings.venues.join('\n');
        venues.addEventListener('input', () => { d.settings.venues = venues.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean); app.saveDraft(); });
        settings.append(U.field('Baner eller bord — eitt namn per linje', venues), el('p', 'vp-help', 'Kampar blir samla i spelbolkar. De vel sjølve når kvar bolk byrjar. Lat feltet stå tomt for å spele ei heil runde samtidig utan banefordeling.'));
        const n = d.rows.length;
        let amount = d.settings.format === 'cup' ? Math.max(0, n - 1) : d.settings.format === 'league' ? n * (n - 1) / 2 : d.settings.format === 'swiss' ? Math.floor(n / 2) * d.settings.rounds : null;
        if (d.settings.format === 'pools' && d.settings.poolCount >= 2) {
            const g = d.settings.poolCount, small = Math.floor(n / g), extra = n % g;
            amount = extra * (small + 1) * small / 2 + (g - extra) * small * (small - 1) / 2 + g * d.settings.advance - 1;
        }
        const notice = el('div', 'vp-notice vp-notice--text' + (amount > 200 ? ' vp-notice--warning' : ''));
        notice.append(el('strong', '', (amount ?? 0) + ' kampar' + (d.settings.bronze && ['cup', 'pools'].includes(d.settings.format) ? ' + bronsefinale' : '')),
            el('p', '', d.settings.format === 'cup' ? 'Somme får berre éin kamp. Vel puljar eller sveitser dersom alle skal spele meir.' : d.settings.format === 'league' ? 'Kvar deltakar får ' + Math.max(0, n - 1) + ' kampar.' : d.settings.format === 'swiss' ? 'Kvar deltakar får ' + d.settings.rounds + ' rundar, med eventuell frirunde.' : 'Alle får kampar i pulja før sluttspel.'));
        if (amount > 200) notice.append(el('p', '', 'Dette er ei stor turnering og kan krevje svært mange ark. Vurder puljar eller færre sveitserrundar.'));
        settings.append(notice, U.button('Lag og kontroller kampoppsettet', () => {
            try { const t = C.create(d.rows, d.settings, d.title); t.setup = d.setup || 1; TS.Engine.generate(t); app.install(t, true); } catch (e) { app.error(e.message); }
        }, true));
        grid.append(people, settings); area.append(grid);
    }
    TS.Setup = { render };
})(window);
