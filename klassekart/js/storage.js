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

    /* ── History (Undo/Redo) ── */
    const history = [];
    const redoStack = [];
    const MAX_HISTORY = 20;

    function pushHistory() {
        const state = captureState(true);
        // Only push if different from last state
        if (history.length > 0) {
            const last = JSON.stringify(history[history.length - 1]);
            if (last === JSON.stringify(state)) return;
        }
        
        history.push(state);
        if (history.length > MAX_HISTORY) history.shift();
        redoStack.length = 0; // Clear redo on new action
        updateHistoryButtons();
    }

    function undo() {
        if (history.length <= 1) return;
        const current = history.pop();
        redoStack.push(current);
        const previous = history[history.length - 1];
        restoreGlobalState(previous);
        updateHistoryButtons();
    }

    function redo() {
        if (redoStack.length === 0) return;
        const next = redoStack.pop();
        history.push(next);
        restoreGlobalState(next);
        updateHistoryButtons();
    }

    function restoreGlobalState(state) {
        if (state.tabs && typeof Tabs !== 'undefined') {
            Tabs.setAllTabs(state.tabs, true); // true = skip push history
        } else {
            restoreState(state, true); // true = skip push history
        }
    }

    function updateHistoryButtons() {
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if (btnUndo) btnUndo.disabled = history.length <= 1;
        if (btnRedo) btnRedo.disabled = redoStack.length === 0;
    }

    /* ── Snapshot current state ── */
    function captureState(includeTabs = false) {
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
        
        const state = { students, desks, furniture };
        
        if (includeTabs && typeof Tabs !== 'undefined') {
            state.tabs = Tabs.getAllTabs();
        }

        return state;
    }

    /* ── Restore state ── */
    function restoreState(data, isUndoRedo = false) {
        Grid.clearCanvas();
        App.setStudentList(data.students || []);

        (data.furniture || []).forEach(f => {
            Grid.createFurniture(f.type, f.x, f.y, f.rotation, f.label, f.w, f.h);
        });

        (data.desks || []).forEach(d => {
            Grid.createDesk(d.name, d.x, d.y, d.color, d.locked, d.id, d.rotation);
            // Size is handled by CSS/defaults, but we can set it if stored
            const el = Grid.getDesks().find(el => el.dataset.studentId === d.id);
            if (el) {
                if (d.w) el.style.width = d.w + 'px';
                if (d.h) el.style.height = d.h + 'px';
            }
        });

        App.refreshStudentPanel();
        
        if (!isUndoRedo) {
            pushHistory();
        }
    }

    /* ── JSON file export ── */
    function exportJSON() {
        const state = captureState(true);
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
                    if (data.tabs && typeof Tabs !== 'undefined') {
                        Tabs.setAllTabs(data.tabs);
                    } else {
                        restoreState(data);
                    }
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
        captureState, restoreState, restoreGlobalState, exportJSON, importJSON,
        pushHistory, undo, redo
    };
})();
