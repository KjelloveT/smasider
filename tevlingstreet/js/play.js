/* Tevlingstreet — kontroll, kvalifisering og sveitserdialog. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, E = TS.Engine, V = TS.View, U = VyrdepilElevgrupperUI, el = Vy.el;
    async function result(app, id, value) {
        if (!app.editable) return;
        try {
            const affected = E.impact(app.t, id, value);
            if (affected.length && !await Vy.confirmAction('Dette endrar motstandarane i kamp ' + affected.join(', ') + '. Resultata i desse kampane blir tømde. Kontroller papirark som alt er utfylte.', 'Rette eit tidlegare resultat', 'Rett og tøm seinare resultat')) return;
            E.setResult(app.t, id, value); app.changed();
        } catch (e) { app.error(e.message); }
    }
    function qualify(app, pool) {
        try {
            const info = E.qualifiers(app.t, pool.id), dialog = Vy.createDialog('Kven går vidare frå pulje ' + pool.id + '?');
            dialog.append(el('p', 'vp-prose', info.tied ? 'Like poeng gjev delt plass. Avgjer rekkjefølgja med omkamp eller loddtrekking, og vel kven som går vidare.' : 'Kontroller rekkjefølgja og stadfest kven som går vidare.'), V.table(app.t, pool.ids));
            const selects = [];
            for (let i = 0; i < info.count; i++) {
                const select = el('select', 'vp-input'); info.rows.forEach(r => select.append(new Option(r.name + ' — ' + r.points + ' poeng', r.id)));
                select.value = app.t.qualification[pool.id]?.[i] || info.rows[i].id;
                dialog.append(U.field((i + 1) + '. plass i pulja', select)); selects.push(select);
            }
            const error = el('p', 'vp-notice vp-notice--text vp-notice--error'); error.hidden = true; error.setAttribute('role', 'alert'); dialog.append(error);
            dialog.append(U.button('Stadfest vidare deltakarar', async () => {
                try {
                    const ids = selects.map(s => s.value), test = C.copy(app.t);
                    E.qualify(test, pool.id, ids);
                    const affected = app.t.matches.filter(m => m.result && !test.matches.find(x => x.id === m.id).result).map(m => m.id);
                    if (affected.length && !await Vy.confirmAction('Endringa tømmer resultata i kamp ' + affected.join(', ') + '.', 'Endre kvalifisering', 'Endre og tøm')) return;
                    E.qualify(app.t, pool.id, ids); Vy.closeModal(dialog); app.changed();
                } catch (e) { error.textContent = e.message; error.hidden = false; }
            }, true));
            Vy.openModal(dialog);
        } catch (e) { app.error(e.message); }
    }
    function swiss(app) {
        const t = app.t, dialog = Vy.createDialog('Neste sveitserrunde');
        let proposal, warning = '';
        try { proposal = TS.Swiss.propose(t); } catch (e) { warning = e.message; proposal = { pairs: Array.from({ length: Math.floor(t.participants.length / 2) }, () => ['', '']), bye: null }; }
        dialog.classList.add('vp-library-dialog');
        dialog.append(el('p', 'vp-prose', 'Kontroller paringa før du publiserer runden. Kvar deltakar skal stå éin gong. Ingen skal møte ein tidlegare motstandar.'));
        if (warning) dialog.append(el('p', 'vp-notice vp-notice--text vp-notice--warning', warning));
        const scores = C.standings(t), pairs = [];
        proposal.pairs.forEach((pair, i) => {
            const row = el('div', 'vp-library-row'), selects = [];
            pair.forEach((id, side) => {
                const select = el('select', 'vp-input'); select.append(new Option('Vel deltakar', ''));
                scores.forEach(r => select.append(new Option(r.name + ' — ' + r.points + ' poeng', r.id)));
                select.value = id; select.setAttribute('aria-label', 'Kamp ' + (i + 1) + ', deltakar ' + (side + 1)); row.append(select); selects.push(select);
            });
            dialog.append(row); pairs.push(selects);
        });
        let bye = null;
        if (t.participants.length % 2) {
            bye = el('select', 'vp-input'); bye.append(new Option('Vel frirunde', ''));
            const used = new Set(t.rounds.flatMap(r => r.pauses || []));
            scores.slice().reverse().filter(r => !used.has(r.id)).forEach(r => bye.append(new Option(r.name + ' — ' + r.points + ' poeng', r.id)));
            bye.value = proposal.bye || ''; dialog.append(U.field('Frirunde — gjev ' + t.settings.win + ' poeng', bye));
        }
        const error = el('p', 'vp-notice vp-notice--text vp-notice--error'); error.hidden = true; error.setAttribute('role', 'alert');
        dialog.append(error, U.button('Kontroller og publiser runden', () => {
            try {
                TS.Swiss.confirm(t, { pairs: pairs.map(row => row.map(s => s.value)), bye: bye?.value || null });
                Vy.closeModal(dialog); app.roundPage = undefined; app.changed();
            } catch (e) { error.textContent = e.message; error.hidden = false; }
        }, true));
        Vy.openModal(dialog);
    }
    function rename(app) {
        const dialog = Vy.createDialog('Rett deltakar- eller lagnamn'), inputs = [];
        app.t.participants.forEach(p => {
            const input = el('input', 'vp-input'); input.value = p.name; input.maxLength = 120;
            dialog.append(U.field(p.name, input)); inputs.push([p, input]);
        });
        dialog.append(U.button('Lagre namna', () => {
            if (inputs.some(([p, input]) => !input.value.trim())) return app.error('Alle deltakarane må ha eit namn.');
            inputs.forEach(([p, input]) => { p.name = input.value.trim(); }); Vy.closeModal(dialog); app.changed();
        }, true)); Vy.openModal(dialog);
    }
    function swap(app) {
        const dialog = Vy.createDialog('Byt startplassar i trekninga'), selects = [];
        dialog.append(el('p', '', 'Vel to deltakarar som skal byte plass. Oppsettsnummeret blir endra; kontroller nye papirark etterpå.'));
        for (let i = 0; i < 2; i++) {
            const select = el('select', 'vp-input');
            app.t.order.forEach(id => select.append(new Option(C.displayName(app.t, id), id)));
            select.value = app.t.order[i]; dialog.append(U.field('Deltakar ' + (i + 1), select)); selects.push(select);
        }
        dialog.append(U.button('Byt plassane', () => {
            const [a, b] = selects.map(s => app.t.order.indexOf(s.value));
            if (a === b) return;
            [app.t.order[a], app.t.order[b]] = [app.t.order[b], app.t.order[a]];
            app.t.setup++; E.generate(app.t); Vy.closeModal(dialog); app.changed();
        }, true)); Vy.openModal(dialog);
    }
    function render(app) {
        const t = app.t, area = app.area; area.replaceChildren();
        area.dataset.tournamentId = t.id;
        const panel = el('section', 'vp-panel vp-panel--plain ts-stack');
        panel.append(el('h2', 'vp-heading', t.title), el('p', 'vp-help', C.formats[t.settings.format].name + ' · ' + t.participants.length + ' deltakarar · Oppsett ' + t.setup));
        if (!app.editable) panel.append(el('p', 'vp-notice vp-notice--text vp-notice--warning', 'Denne turneringa er open i eit anna lærarvindauge. Lukk det vindauget og opne turneringa her på nytt for å registrere resultat.'));
        const actions = el('div', 'vp-toolbar-group');
        if (!t.frozen && app.editable) {
            panel.append(el('p', 'vp-notice vp-notice--text', '4. Kontroller trekninga. Når du festar oppsettet, kan du skrive ut eller starte turneringa.'));
            actions.append(U.button('Fest oppsettet', () => { t.frozen = true; app.changed(); }, true),
                U.button('Trekk på nytt', () => { t.seed = Vy.newSeed(); t.order = Vy.shuffle(t.participants.map(p => p.id), Vy.rng(t.seed)); t.setup++; E.generate(t); app.changed(); }),
                U.button('Byt startplassar', () => swap(app)), U.button('Endre deltakarar eller reglar', () => app.editSetup()));
        }
        if (t.frozen && app.editable) actions.append(U.button('Start neste spelbolk', () => { try { if (!E.startWave(t)) return app.error('Ingen fleire spelbolkar er klare. Set opp neste sveitserrunde dersom turneringa held fram.'); app.changed(); } catch (e) { app.error(e.message); } }, true),
            U.button('Angre siste registrering', () => { if (C.undo(t)) app.changed(); }),
            U.button('Rett namn', () => rename(app)));
        if (t.frozen && app.editable && !t.started && !t.matches.some(m => m.result)) actions.append(U.button('Endre oppsettet', async () => {
            if (await Vy.confirmAction('Dette lagar eit nytt oppsett. Skriv ut nye ark dersom dei gamle alt er skrivne ut.', 'Endre før første resultat', 'Endre oppsettet')) app.editSetup();
        }));
        const print = U.button('A3-ark / PDF', () => {
            const tab = window.open('print.html#' + encodeURIComponent(t.id), '_blank');
            if (!tab) app.error('Nettlesaren blokkerte utskriftsvindauget. Tillat vindauge frå Vyrdepil og prøv att.');
        }); print.disabled = !t.frozen;
        actions.append(print, U.button('Last ned turneringa', () => Vy.downloadJson(TS.Store.exportData(t), Vy.slug(t.title) + '.json')),
            U.button('Kopier som ny turnering', () => { const copy = C.create(t.participants, t.settings, t.title + ' — kopi'); E.generate(copy); app.install(copy, true); }));
        panel.append(actions);
        if (t.frozen) {
            const displayTools = el('div', 'vp-toolbar-group');
            displayTools.append(U.button('Opne storskjerm', () => {
                const screen = window.open('display.html#' + encodeURIComponent(t.id), 'tevlingstreet-' + t.id, 'width=1280,height=800');
                if (!screen) app.error('Nettlesaren blokkerte storskjermen. Tillat vindauge frå Vyrdepil og prøv att.');
            }));
            const mode = el('select', 'vp-input'); mode.setAttribute('aria-label', 'Vising på storskjermen');
            [['matches', 'Kampar'], ['tree', 'Turneringstre'], ['table', 'Poengtabell']].forEach(([id, text]) => mode.append(new Option(text, id)));
            mode.value = t.display.mode; mode.disabled = !app.editable;
            mode.addEventListener('change', () => { t.display.mode = mode.value; app.changed(); }); displayTools.append(mode);
            [['rotate', 'Byt side kvart 15. sekund'], ['members', 'Vis elevnamn på laga']].forEach(([key, text]) => {
                const label = el('label', 'vp-choice'), input = el('input'); input.type = 'checkbox'; input.checked = t.display[key]; input.disabled = !app.editable;
                input.addEventListener('change', () => { t.display[key] = input.checked; app.changed(); }); label.append(input, el('span', '', text)); displayTools.append(label);
            }); panel.append(displayTools);
        }
        const next = E.nextWave(t);
        panel.append(el('p', 'vp-notice vp-notice--text', Number.isFinite(next) ? 'Pågåande bolk: ' + (t.activeWave || 'ikkje starta') + '. Neste uferdige bolk: ' + next + '.' : 'Alle oppsette kampar er ferdige.'));
        if (t.settings.format === 'swiss' && t.rounds.length < t.settings.rounds && app.editable && t.frozen) {
            const b = U.button('Lag neste sveitserrunde', () => swiss(app), true); b.disabled = !t.matches.every(m => C.done(t, m)); panel.append(b);
        }
        const search = el('select', 'vp-input'); search.setAttribute('aria-label', 'Finn neste kamp for ein deltakar'); search.append(new Option('Kven skal eg møte?', ''));
        t.participants.forEach(p => search.append(new Option(C.displayName(t, p.id), p.id)));
        const nextInfo = el('p', 'vp-notice vp-notice--text'); nextInfo.hidden = true;
        search.addEventListener('change', () => { nextInfo.textContent = search.value ? C.participant(t, search.value).name + ': ' + E.next(t, search.value) : ''; nextInfo.hidden = !search.value; }); panel.append(search, nextInfo);
        const tabs = el('div', 'vp-toolbar-group');
        ['Kampar', 'Turneringstre', 'Poengtabell'].forEach((label, i) => { const b = U.button(label, () => { app.view = i; render(app); }); b.setAttribute('aria-pressed', String((app.view || 0) === i)); tabs.append(b); });
        panel.append(tabs);
        if (t.participants.some(p => p.members?.length)) {
            const roster = el('details', 'vp-accordion');
            roster.append(el('summary', '', 'Laga og elevane'));
            const body = el('div', 'vp-accordion-body');
            t.participants.forEach(p => { body.append(el('h3', '', C.displayName(t, p.id)), el('p', '', p.members.map(s => s.name).join(', ') || 'Ingen elevnamn lagde til.')); });
            roster.append(body); panel.append(roster);
        }
        if (app.view === 1) {
            const sections = V.treeSections(t, 8);
            if (!sections.length) panel.append(el('p', '', 'Denne turneringsforma bruker rundar og poengtabell.'));
            else {
                const select = el('select', 'vp-input'); select.setAttribute('aria-label', 'Vel grein i turneringstreet');
                sections.forEach((s, i) => select.append(new Option(s.title + ' · del ' + (i + 1), i)));
                app.treePage = Math.min(app.treePage || 0, sections.length - 1); select.value = app.treePage;
                select.addEventListener('change', () => { app.treePage = Number(select.value); render(app); });
                const scroll = el('div', 'ts-tree-scroll'); scroll.append(V.tree(t, sections[app.treePage])); panel.append(select, scroll);
            }
        } else if (app.view === 2) {
            if (t.pools.length) t.pools.forEach(p => {
                panel.append(el('h3', '', 'Pulje ' + p.id), V.table(t, p.ids));
                if (app.editable && t.frozen) { const b = U.button(t.qualification[p.id] ? 'Sjå eller endre kven som går vidare' : 'Avgjer kven som går vidare', () => qualify(app, p)); b.disabled = !t.matches.filter(m => m.pool === p.id).every(m => C.done(t, m)); panel.append(b); }
            });
            else if (t.settings.format === 'cup') {
                const final = t.matches.filter(m => m.stage === 'cup').at(-1), winner = C.resolve(t, { kind: 'winner', id: final.id });
                panel.append(el('p', 'vp-notice vp-notice--text', winner.id ? 'Turneringsvinnar: ' + C.participant(t, winner.id).name : 'Vinnaren blir klar når finalen er avgjord.'));
            } else panel.append(V.table(t));
        } else {
            const select = el('select', 'vp-input'); select.setAttribute('aria-label', 'Vel runde eller pulje');
            t.rounds.forEach((r, i) => select.append(new Option((r.pool ? 'Pulje ' + r.pool + ' · ' : '') + (r.stage === 'bronze' ? 'Bronsefinale' : r.stage === 'cup' ? 'Sluttspel · runde ' + r.number : 'Runde ' + r.number), i)));
            if (app.roundPage === undefined) app.roundPage = Math.max(0, t.rounds.findIndex(r => r.matches.some(id => t.matches.find(m => m.id === id).wave === next)));
            app.roundPage = Math.min(app.roundPage, t.rounds.length - 1); select.value = app.roundPage;
            select.addEventListener('change', () => { app.roundPage = Number(select.value); render(app); });
            panel.append(select);
            const r = t.rounds[app.roundPage], matches = el('div', 'ts-match-grid');
            r.matches.forEach(id => matches.append(V.card(t, t.matches.find(m => m.id === id), app.editable && t.frozen ? (id, outcome) => result(app, id, outcome) : null)));
            panel.append(matches);
            if (r.pauses.length) panel.append(el('p', 'vp-notice vp-notice--text', r.pauses.map(id => C.participant(t, id).name).join(', ') + (r.stage === 'swiss' ? ' har frirunde: ' + t.settings.win + ' poeng.' : ' har pause utan poeng.')));
            if (r.pool && app.editable && t.frozen) {
                const pool = t.pools.find(p => p.id === r.pool), b = U.button('Tabell og vidare deltakarar frå pulje ' + r.pool, () => qualify(app, pool));
                b.disabled = !t.matches.filter(m => m.pool === r.pool).every(m => C.done(t, m)); panel.append(b);
            }
        }
        area.append(panel);
    }
    TS.Play = { render };
})(window);
