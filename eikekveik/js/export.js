// Eikekveik — Export (JSON eksport/import, print)

Eikekveik.Export = (function () {
    let viewBeforePrint = null;

    function init() {
        Eikekveik.el.btnExport.addEventListener('click', exportJSON);
        Eikekveik.el.btnImport.addEventListener('click', () => Eikekveik.el.importFile.click());
        Eikekveik.el.importFile.addEventListener('change', onImportFile);
        Eikekveik.el.btnPrint.addEventListener('click', () => window.print());

        window.addEventListener('beforeprint', onBeforePrint);
        window.addEventListener('afterprint', onAfterPrint);
    }

    function exportJSON() {
        Vy.downloadJson({
            app: 'eikekveik',
            version: Eikekveik.EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            data: Eikekveik.State.snapshot()
        }, 'eikekveik-' + isoStamp() + '.json');
    }

    function onImportFile(e) {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const payload = JSON.parse(ev.target.result);
                if (!payload || payload.app !== 'eikekveik') {
                    alert('Dette ser ikkje ut til å vere ei Eikekveik-fil.');
                    return;
                }
                if (Number(payload.version) > Eikekveik.EXPORT_VERSION) {
                    alert('Fila er laga med ei nyare utgåve av Eikekveik. Last sida på nytt og prøv igjen.');
                    return;
                }
                if (!payload.data || !Array.isArray(payload.data.nodes)) {
                    alert('Fila manglar nodar.');
                    return;
                }
                if (Eikekveik.State.getNodes().length > 1) {
                    const ok = confirm('Erstatte noverande kart med importert?');
                    if (!ok) return;
                }
                Eikekveik.State.load(payload.data);
                Eikekveik.Render.renderAll();
                Eikekveik.View.showAll({ onlyIfNeeded: true });
                Eikekveik.Storage.autoSave();
            } catch (err) {
                console.error(err);
                alert('Klarte ikkje lese fila: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // Utskrifta viser heile kartet uansett kvar brukaren har zooma seg inn.
    // Visninga blir sett tilbake etterpå.
    function onBeforePrint() {
        const b = Eikekveik.View.contentBounds();
        if (!b) return;
        viewBeforePrint = Eikekveik.View.get();

        // A4 ståande med 1,5 cm marg gjev om lag 680 × 990 CSS-pikslar.
        const pad = 12;
        const bw = b.maxX - b.minX + 2 * pad;
        const bh = b.maxY - b.minY + 2 * pad;
        const s = Math.min(680 / bw, 990 / bh, 1);

        const canvas = Eikekveik.el.canvas;
        canvas.style.width = Math.ceil(bw * s) + 'px';
        canvas.style.height = Math.ceil(bh * s) + 'px';
        Eikekveik.View.set({ k: s, x: (pad - b.minX) * s, y: (pad - b.minY) * s });
    }

    function onAfterPrint() {
        const canvas = Eikekveik.el.canvas;
        canvas.style.removeProperty('width');
        canvas.style.removeProperty('height');
        if (viewBeforePrint) {
            Eikekveik.View.set(viewBeforePrint);
            viewBeforePrint = null;
        }
    }

    function isoStamp() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    return { init, exportJSON, isoStamp };
})();
