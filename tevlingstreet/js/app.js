/* Tevlingstreet — livssyklus for lærarvindauget. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core, U = VyrdepilElevgrupperUI;
    const app = {
        area: document.getElementById('workspace'), t: null, editable: false, view: 0,
        draft: { title: 'Turneringa vår', mode: 'students', rows: [], studentPool: [], settings: C.defaults(0) },
        error(message) { const box = document.getElementById('appError'); box.textContent = message; box.hidden = false; },
        clearError() { document.getElementById('appError').hidden = true; },
        saveDraft() { VyrdepilStorage.setGameState('tevlingstreet', { lastId: app.t?.id || null, draft: app.draft }); app.status(); },
        refreshSetup() { app.clearError(); app.saveDraft(); TS.Setup.render(app); },
        status() { document.getElementById('saveStatus').textContent = VyrdepilStorage.getStatus().mode === 'persistent' ? 'Lagra i denne nettlesaren' : 'Berre i minnet — last ned ei kopi før du lukkar'; },
        broadcast() { if (app.t && app.editable) TS.Sync.send(app.channel, app.t.id, 'state', TS.Sync.publicState(app.t)); },
        changed() { if (!app.editable) return; app.clearError(); TS.Store.save(app.t); app.status(); app.broadcast(); TS.Play.render(app); },
        release() {
            if (app.channel) { if (app.editable) TS.Sync.send(app.channel, app.t?.id, 'closed'); app.channel.close(); app.channel = null; }
            if (app.releaseLock) { app.releaseLock(); app.releaseLock = null; }
            app.editable = false;
        },
        install(t, preview, saveNew) {
            app.release(); app.epoch = (app.epoch || 0) + 1; const epoch = app.epoch;
            app.t = t; app.view = 0; app.roundPage = undefined; app.treePage = 0;
            if (preview) t.frozen = false;
            app.clearError();
            const token = t.id;
            app.channel = TS.Sync.open(token, message => { if (message.type === 'request') app.broadcast(); });
            if (!app.channel) app.error('Denne nettlesaren støttar ikkje direktevising mellom vindauge.');
            if (!navigator.locks) { app.error('Bruk ein nyare nettlesar på HTTPS eller localhost for å redigere trygt. Du kan framleis sjå og skrive ut oppsettet.'); TS.Play.render(app); return; }
            navigator.locks.request('tevlingstreet-edit:' + token, { ifAvailable: true }, async lock => {
                if (app.epoch !== epoch || app.t?.id !== token || !lock) { if (app.epoch === epoch) TS.Play.render(app); return; }
                app.editable = true;
                if (preview || saveNew) TS.Store.save(t);
                app.status(); app.broadcast(); TS.Play.render(app);
                await new Promise(resolve => { app.releaseLock = resolve; });
            }).catch(e => app.error(e.message));
            TS.Play.render(app);
        },
        editSetup() {
            if (app.t.started || app.t.matches.some(m => m.result)) return app.error('Deltakarar og reglar er låste etter første resultat.');
            app.draft = { title: app.t.title, setup: app.t.setup + 1, mode: app.t.participants.some(p => p.members?.length) ? 'teams' : 'students', rows: C.copy(app.t.participants), studentPool: [], settings: C.copy(app.t.settings) };
            app.release(); app.t = null; app.refreshSetup();
        }
    };
    document.getElementById('newTournament').addEventListener('click', () => { app.release(); app.t = null; app.draft = { title: 'Turneringa vår', mode: 'students', rows: [], studentPool: [], settings: C.defaults(0) }; app.refreshSetup(); });
    document.getElementById('openLibrary').addEventListener('click', () => U.open());
    document.getElementById('loadTournament').addEventListener('click', () => {
        const dialog = Vy.createDialog('Opne lagra turnering'), list = Vy.el('div', 'ts-stack'); dialog.append(list);
        function render() {
            list.replaceChildren();
            const entries = TS.Store.all();
            if (!entries.length) list.append(Vy.el('p', '', 'Ingen turneringar er lagra enno.'));
            entries.forEach(t => {
                const row = Vy.el('div', 'vp-panel vp-panel--plain vp-panel--compact');
                row.append(Vy.el('h3', '', t.title), U.button('Opne', () => { Vy.closeModal(dialog); app.install(C.copy(t)); }),
                    U.button('Slett', async () => { if (await Vy.confirmAction('Slett «' + t.title + '» frå denne nettlesaren? Ei nedlasta fil blir verande.', 'Slett turnering', 'Slett')) { TS.Store.remove(t.id); if (app.t?.id === t.id) { app.release(); app.t = null; TS.Setup.render(app); } render(); } }));
                list.append(row);
            });
        }
        render(); Vy.openModal(dialog);
    });
    const fileInput = document.getElementById('importFile');
    document.getElementById('importTournament').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0]; if (!file) return;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('Fila er større enn 5 MB.');
            const t = TS.Store.importData(JSON.parse(await file.text())); t.frozen = true; app.install(t, false, true);
        } catch (e) { app.error('Kunne ikkje hente turneringa: ' + e.message); }
        fileInput.value = '';
    });
    setInterval(() => { if (app.t && app.editable) TS.Sync.send(app.channel, app.t.id, 'heartbeat', { revision: app.t.revision }); }, 2000);
    root.addEventListener('beforeunload', () => { if (app.t && app.editable) TS.Sync.send(app.channel, app.t.id, 'closed'); });
    const saved = VyrdepilStorage.getGameState('tevlingstreet');
    if (saved?.draft && Array.isArray(saved.draft.rows) && saved.draft.rows.length <= 128) app.draft = saved.draft;
    const current = saved?.lastId && TS.Store.get(saved.lastId);
    if (current) app.install(C.copy(current)); else TS.Setup.render(app);
    app.status(); TS.App = app;
})(window);
