/* ══════════════════════════════════════
   STORAGE.JS — localStorage + JSON import/export
   ══════════════════════════════════════ */

const Storage = (() => {
    const GAME = 'klassekart';
    const LIST_KEY = 'oppsett';
    const EXPORT_VERSION = 1;
    // Bound untrusted parsing and DOM work while leaving room for large classes and many layouts.
    const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
    const MAX_STUDENTS = 300;
    const MAX_DESKS = 300;
    const MAX_FURNITURE = 100;
    const MAX_TABS = 100;
    const MAX_TEXT_LENGTH = 500;
    // The canvas is 1200 × 800; allow twice its size for transformed objects, but reject extreme positions.
    const MAX_COORDINATE_X = 2400;
    const MAX_COORDINATE_Y = 1600;
    const FURNITURE_TYPES = new Set(['kateter', 'tavle', 'dor', 'vindu', 'hylle', 'tekst']);
    const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

    function getAll() {
        return VyrdepilStorage.getList(GAME, LIST_KEY);
    }

    function saveSetup(name, data) {
        const entry = {
            id: crypto.randomUUID(),
            name,
            date: new Date().toISOString(),
            data
        };
        VyrdepilStorage.saveListItem(GAME, LIST_KEY, entry);
        return entry;
    }

    function deleteSetup(id) {
        VyrdepilStorage.deleteListItem(GAME, LIST_KEY, id);
    }

    function loadSetup(id) {
        return VyrdepilStorage.getList(GAME, LIST_KEY).find(s => s.id === id) || null;
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
        const payload = {
            app: GAME,
            version: EXPORT_VERSION,
            ...captureState(true)
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'klassekart.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function isRecord(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isText(value, maxLength, allowEmpty = false) {
        return typeof value === 'string' && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
    }

    function isId(value) {
        return isText(value, 128);
    }

    function isColor(value) {
        return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    }

    function isCoordinate(value, max) {
        return Number.isFinite(value) && Math.abs(value) <= max;
    }

    function validateLayout(state, allowTabs = true) {
        if (!isRecord(state) || !Array.isArray(state.students) || !Array.isArray(state.desks) || !Array.isArray(state.furniture)) {
            throw new Error('Fila manglar ei gyldig Klassekart-flate.');
        }
        if (state.students.length > MAX_STUDENTS || state.desks.length > MAX_DESKS || state.furniture.length > MAX_FURNITURE) {
            throw new Error('Fila har for mange elevar, plassar eller møblar.');
        }

        const studentIds = new Set();
        for (const student of state.students) {
            if (!isRecord(student) || !isId(student.id) || !isText(student.name, MAX_TEXT_LENGTH)) {
                throw new Error('Fila har ein ugyldig elev.');
            }
            if (studentIds.has(student.id)) throw new Error('Fila har duplikate elev-ID-ar.');
            studentIds.add(student.id);
            if (student.color != null && !isColor(student.color)) throw new Error('Fila har ein ugyldig elevfarge.');
        }

        const deskIds = new Set();
        for (const desk of state.desks) {
            if (!isRecord(desk) || !isId(desk.id) || !isText(desk.name, MAX_TEXT_LENGTH) ||
                !isCoordinate(desk.x, MAX_COORDINATE_X) || !isCoordinate(desk.y, MAX_COORDINATE_Y)) {
                throw new Error('Fila har ein ugyldig elevplass.');
            }
            if (deskIds.has(desk.id)) throw new Error('Fila har duplikate ID-ar for elevplassar.');
            deskIds.add(desk.id);
            if (desk.color != null && !isColor(desk.color)) throw new Error('Fila har ein ugyldig plassfarge.');
            if (desk.locked != null && typeof desk.locked !== 'boolean') throw new Error('Fila har ein ugyldig låsestatus.');
            if (desk.rotation != null && !VALID_ROTATIONS.has(desk.rotation)) throw new Error('Fila har ein ugyldig rotasjon.');
            if (desk.w != null && (!Number.isFinite(desk.w) || desk.w < 40 || desk.w > 1200)) throw new Error('Fila har ei ugyldig plassbreidd.');
            if (desk.h != null && (!Number.isFinite(desk.h) || desk.h < 40 || desk.h > 800)) throw new Error('Fila har ei ugyldig plasshøgd.');
        }

        for (const furniture of state.furniture) {
            if (!isRecord(furniture) || !FURNITURE_TYPES.has(furniture.type) ||
                !isCoordinate(furniture.x, MAX_COORDINATE_X) || !isCoordinate(furniture.y, MAX_COORDINATE_Y)) {
                throw new Error('Fila har eit ugyldig møbel.');
            }
            if (furniture.rotation != null && !VALID_ROTATIONS.has(furniture.rotation)) throw new Error('Fila har ein ugyldig møbelrotasjon.');
            if (furniture.w != null && (!Number.isFinite(furniture.w) || furniture.w < 40 || furniture.w > 1200)) throw new Error('Fila har ei ugyldig møbelbreidd.');
            if (furniture.h != null && (!Number.isFinite(furniture.h) || furniture.h < 40 || furniture.h > 800)) throw new Error('Fila har ei ugyldig møbelhøgd.');
            if (furniture.label != null && !isText(furniture.label, MAX_TEXT_LENGTH, true)) throw new Error('Fila har ein ugyldig møbeletekst.');
        }

        if (Object.prototype.hasOwnProperty.call(state, 'tabs')) {
            if (!allowTabs || !Array.isArray(state.tabs) || state.tabs.length === 0 || state.tabs.length > MAX_TABS) {
                throw new Error('Fila har ei ugyldig faneliste.');
            }
            const tabIds = new Set();
            let activeCount = 0;
            for (const tab of state.tabs) {
                if (!isRecord(tab) || !isId(tab.id) || !isText(tab.name, MAX_TEXT_LENGTH) || tabIds.has(tab.id)) {
                    throw new Error('Fila har ei ugyldig eller duplisert fane.');
                }
                tabIds.add(tab.id);
                if (tab.active != null) {
                    if (typeof tab.active !== 'boolean') throw new Error('Fila har ein ugyldig aktiv fane.');
                    if (tab.active) activeCount++;
                }
                validateLayout(tab.data, false);
            }
            if (activeCount > 1) throw new Error('Fila har meir enn éi aktiv fane.');
        }
    }

    function validateImportPayload(data) {
        if (!isRecord(data)) throw new Error('Fila inneheld ikkje eit Klassekart-oppsett.');

        const hasApp = Object.prototype.hasOwnProperty.call(data, 'app');
        const hasVersion = Object.prototype.hasOwnProperty.call(data, 'version');
        if (!hasApp && !hasVersion) {
            // Older Klassekart exports were unversioned captureState() objects.
            // Accept them only when their complete legacy shape is valid.
            const legacyKeys = new Set(['students', 'desks', 'furniture', 'tabs']);
            if (Object.keys(data).some(key => !legacyKeys.has(key))) {
                throw new Error('Fila har ikkje formatet til ei eldre Klassekart-fil.');
            }
            data = { ...data, app: GAME, version: EXPORT_VERSION };
        } else {
            if (data.app !== GAME) throw new Error('Fila høyrer ikkje til Klassekart.');
            if (!Number.isInteger(data.version) || data.version < 1) throw new Error('Fila manglar eit gyldig versjonsnummer.');
            if (data.version > EXPORT_VERSION) throw new Error('Fila er laga i ei nyare utgåve av Klassekart.');
        }

        validateLayout(data);
        return data;
    }

    /* ── JSON file import ── */
    function importJSON(file) {
        return new Promise((resolve, reject) => {
            if (!file || !Number.isFinite(file.size) || file.size < 0 || file.size > MAX_IMPORT_BYTES) {
                reject(new Error('JSON-fila er ugyldig eller større enn 5 MB.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = validateImportPayload(JSON.parse(e.target.result));
                    if (data.tabs) {
                        if (typeof Tabs === 'undefined') throw new Error('Denne utgåva av Klassekart kan ikkje opne fanene i fila.');
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
