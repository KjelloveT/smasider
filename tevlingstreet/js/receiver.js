/* Visingsvindauge spør læraren om tilstanden, også ved minnelagring. */
(function (root) {
    'use strict';
    const TS = root.TS;
    function start(onState) {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { id = ''; }
        const status = document.getElementById('connection');
        if (!id || id.length > 200) { status.textContent = 'Opne denne visinga med knappen i lærarvindauget.'; return null; }
        let lastContact = 0, revision = -1, known = false;
        const channel = TS.Sync.open(id, message => {
            if (message.type === 'state' && message.payload?.id === id && message.payload.revision >= revision) {
                lastContact = Date.now(); revision = message.payload.revision; known = true; onState(message.payload);
            } else if (message.type === 'heartbeat') lastContact = Date.now();
            else if (message.type === 'closed') lastContact = 0;
            updateStatus();
        });
        function updateStatus() {
            status.textContent = lastContact && Date.now() - lastContact < 10000 ? 'Direktekontakt med lærarvindauget' :
                known ? 'Ingen kontakt med lærarvindauget. Viser sist mottekne oppsett. Opne lærarvindauget att for nye resultat.' :
                    'Vent på lærarvindauget. Opne turneringa der, i same nettlesarprofil.';
        }
        function request() { TS.Sync.send(channel, id, 'request'); }
        const saved = TS.Store.get(id);
        if (saved) { known = true; revision = saved.revision; onState(saved); }
        request(); updateStatus();
        const timer = setInterval(() => { request(); updateStatus(); }, 5000);
        root.addEventListener('beforeunload', () => { clearInterval(timer); channel?.close(); });
        return { request };
    }
    TS.Receiver = { start };
    // Following a different local viewing link must open that tournament's channel.
    root.addEventListener('hashchange', () => root.location.reload());
})(window);
