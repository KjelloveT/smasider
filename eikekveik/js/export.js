// Eikekveik — Export (JSON eksport/import, print)

Eikekveik.Export = (function () {

    function init() {
        Eikekveik.el.btnExport.addEventListener('click', exportJSON);
        Eikekveik.el.btnImport.addEventListener('click', () => Eikekveik.el.importFile.click());
        Eikekveik.el.importFile.addEventListener('change', onImportFile);
        Eikekveik.el.btnPrint.addEventListener('click', () => window.print());

        window.addEventListener('beforeprint', onBeforePrint);
        window.addEventListener('afterprint', onAfterPrint);
    }

    function exportJSON() {
        const payload = {
            app: 'eikekveik',
            version: Eikekveik.EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            data: Eikekveik.State.snapshot()
        };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eikekveik-' + isoStamp() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                Eikekveik.Render.showColorPalette(false);
                Eikekveik.Storage.autoSave();
            } catch (err) {
                console.error(err);
                alert('Klarte ikkje lese fila: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function onBeforePrint() {
        const canvas = Eikekveik.el.canvas;
        const edges = Eikekveik.el.edges;
        const nodes = canvas.querySelectorAll('.node');
        let maxX = 400, maxY = 300;
        nodes.forEach(n => {
            maxX = Math.max(maxX, (parseInt(n.style.left) || 0) + n.offsetWidth + 20);
            maxY = Math.max(maxY, (parseInt(n.style.top) || 0) + n.offsetHeight + 20);
        });
        const scale = Math.min(680 / maxX, 990 / maxY, 1);
        canvas.style.setProperty('--print-scale', scale);
        canvas.style.width = maxX + 'px';
        canvas.style.height = maxY + 'px';
        canvas.style.minHeight = maxY + 'px';
        edges.style.width = maxX + 'px';
        edges.style.height = maxY + 'px';
        edges.style.transform = `scale(${scale})`;
        edges.style.transformOrigin = 'top left';
        edges.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);
    }

    function onAfterPrint() {
        const canvas = Eikekveik.el.canvas;
        const edges = Eikekveik.el.edges;
        canvas.style.removeProperty('--print-scale');
        canvas.style.removeProperty('width');
        canvas.style.removeProperty('height');
        canvas.style.removeProperty('min-height');
        edges.style.removeProperty('width');
        edges.style.removeProperty('height');
        edges.style.removeProperty('transform');
        edges.style.removeProperty('transform-origin');
        edges.removeAttribute('viewBox');
        Eikekveik.Render.renderEdges();
    }

    function isoStamp() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    return { init, exportJSON };
})();
