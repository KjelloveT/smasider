/* Stabil førehandsvising: endrar seg fyrst når læraren ber om nye resultat. */
(function () {
    'use strict';
    let current, revision = -1, refresh = false;
    const receiver = TS.Receiver.start(t => {
        if (current && !refresh) return;
        current = t; revision = t.revision; refresh = false;
        TS.Paper.begin(t);
        if (t.settings.format === 'cup') TS.Paper.cup();
        else if (t.settings.format === 'pools') TS.Paper.pools();
        else if (t.settings.format === 'league') TS.Paper.roundRobin();
        else TS.PaperSwiss.render(t);
        const result = TS.Paper.finish();
        document.getElementById('printCount').textContent = result.count + ' A3-ark · Oppsett ' + t.setup + ' · ' + (result.overflow ? 'Eit ark har for lite plass. Utskrift er stoppa; kort ned spelstadnamn eller bruk mindre puljar.' : 'Kontroller arka nedanfor.');
        document.getElementById('printButton').disabled = result.overflow > 0;
        document.documentElement.dataset.printReady = result.overflow ? 'error' : 'true';
    });
    document.getElementById('refreshPrint').addEventListener('click', () => { refresh = true; receiver?.request(); });
    document.getElementById('printButton').addEventListener('click', () => { if (current && revision >= 0) window.print(); });
})();
