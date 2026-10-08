/* Eitt autoritativt lærarvindauge, mange lokale visingsvindauge. */
(function (root) {
    'use strict';
    const TS = root.TS;
    function open(id, onMessage) {
        return Vy.openChannel('tevlingstreet:' + id, data => {
            if (data?.protocol === 1 && data.tournamentId === id && ['request', 'state', 'heartbeat', 'closed'].includes(data.type)) onMessage(data);
        });
    }
    function send(channel, id, type, payload) {
        if (channel) channel.send({ protocol: 1, tournamentId: id, type, payload: payload || null });
    }
    function publicState(t) {
        const state = TS.Store.exportData(t);
        if (!t.display.members) state.participants.forEach(p => { p.members = []; });
        return state;
    }
    TS.Sync = { open, send, publicState };
})(window);
