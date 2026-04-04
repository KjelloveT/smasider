/* ══════════════════════════════════════
   STORAGE.JS — localStorage + JSON import/export
   ══════════════════════════════════════ */

const Storage = (() => {
    const KEY = 'klassekart_oppsett';

    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch { return []; }
    }

    function saveSetup(name, data) {
        const all = getAll();
        const entry = {
            id: crypto.randomUUID(),
            name,
            date: new Date().toISOString(),
            data
        };
        all.push(entry);
        localStorage.setItem(KEY, JSON.stringify(all));
        return entry;
    }

    function deleteSetup(id) {
        const all = getAll().filter(s => s.id !== id);
        localStorage.setItem(KEY, JSON.stringify(all));
    }

    function loadSetup(id) {
        return getAll().find(s => s.id === id) || null;
    }

    /* ── Snapshot current state ── */
    function captureState() {
        const desks = Grid.getDesks().map(d => ({
            id: d.dataset.studentId,
            name: d.dataset.studentName,
            x: parseInt(d.style.left),
            y: parseInt(d.style.top),
            w: d.offsetWidth,
            h: d.offsetHeight,
            color: d.dataset.color || '#ffffff',
            locked: d.dataset.locked === '1',
            rotation: parseInt(d.dataset.rotation) || 0
        }));

        const furniture = Grid.getFurniture().map(f => {
            const lbl = f.querySelector('.furn-label');
            return {
                type: f.dataset.type,
                x: parseInt(f.style.left),
                y: parseInt(f.style.top),
                w: f.offsetWidth,
                h: f.offsetHeight,
                rotation: parseInt(f.dataset.rotation) || 0,
                label: lbl ? lbl.textContent : ''
            };
        });

        const students = App.getStudentList();

        return { students, desks, furniture };
    }

    /* ── Restore state ── */
    function restoreState(data) {
        Grid.clearCanvas();
        App.setStudentList(data.students || []);

        (data.furniture || []).forEach(f => {
            Grid.createFurniture(f.type, f.x, f.y, f.rotation, f.label, f.w, f.h);
        });

        (data.desks || []).forEach(d => {
            const el = Grid.createDesk(d.name, d.x, d.y, d.color, d.locked, d.id);
            if (d.w) el.style.width = d.w + 'px';
            if (d.h) el.style.height = d.h + 'px';
            if (d.rotation) {
                el.dataset.rotation = d.rotation;
                el.classList.add('rot-' + d.rotation);
            }
        });

        App.refreshStudentPanel();
    }

    /* ── JSON file export ── */
    function exportJSON() {
        const state = captureState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'klassekart.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ── JSON file import ── */
    function importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    restoreState(data);
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    return {
        getAll, saveSetup, deleteSetup, loadSetup,
        captureState, restoreState, exportJSON, importJSON
    };
})();
