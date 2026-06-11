/* ══════════════════════════════════════
   ENGINE.JS — Éin klokke-tick (1 s) som driv alt tidsstyrt:
   dagsplan-markering, nedteljingar, varsel og aktivitetsbyte.
   Støttar ?testTime=HH:MM for manuell testing (forskuv klokka).
   ══════════════════════════════════════ */

const Engine = (() => {
    let offsetMs = 0;
    let timer = null;
    let planProvider = null;
    let lastKey = null;
    const tickCbs = [];
    const switchCbs = [];

    (function initTestTime() {
        const param = new URLSearchParams(location.search).get('testTime');
        const m = param && /^(\d{1,2}):(\d{2})$/.exec(param);
        if (m) {
            const d = new Date();
            d.setHours(+m[1], +m[2], 0, 0);
            offsetMs = d.getTime() - Date.now();
        }
    })();

    function now() { return new Date(Date.now() + offsetMs); }

    function tick() {
        const n = now();
        const plan = planProvider ? planProvider() : null;
        const status = State.computeStatus(plan, n);
        for (const cb of tickCbs) cb(n, status);
        const key = status.activeBlockIdx + ':' + status.activeActivityIdx;
        if (lastKey !== null && key !== lastKey) {
            for (const cb of switchCbs) cb(status);
        }
        lastKey = key;
    }

    function start() {
        if (timer) return;
        tick();
        timer = setInterval(tick, 1000);
        // intervall blir throttla i bakgrunnsfaner — synk straks fana er aktiv att
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) tick();
        });
    }

    return {
        now,
        start,
        tick,
        onTick: (cb) => tickCbs.push(cb),
        onSwitch: (cb) => switchCbs.push(cb),
        setPlanProvider: (fn) => { planProvider = fn; }
    };
})();
