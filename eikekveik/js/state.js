// Eikekveik — State (nodar, kantar, historikk)

Eikekveik.State = (function () {
    const HISTORY_LIMIT = 20;

    const state = {
        nodes: [],          // [{ id, text, x, y, color, parentId, shape, icon, lineEnding }]
        selectedId: null,
        selectedEdgeId: null, // ID-en til barnet som eig den valde lina
        nextId: 1,
        history: [],
        historyIndex: -1
    };

    function init() {}

    function newId() {
        return state.nextId++;
    }

    function findNode(id) {
        return state.nodes.find(n => n.id === id) || null;
    }

    function getNodes() {
        return state.nodes;
    }

    function getEdges() {
        return state.nodes
            .filter(n => n.parentId != null)
            .map(n => ({ fromId: n.parentId, toId: n.id, ending: n.lineEnding }));
    }

    function getSelectedId() {
        return state.selectedId;
    }

    function setSelected(id) {
        state.selectedId = id;
        state.selectedEdgeId = null;
    }

    function getSelectedEdgeId() {
        return state.selectedEdgeId;
    }

    function setSelectedEdge(id) {
        const node = findNode(id);
        state.selectedEdgeId = node && node.parentId != null ? id : null;
        state.selectedId = null;
    }

    function cleanLineEnding(value, fallback = 'none') {
        return ['none', 'start', 'end', 'both'].includes(value) ? value : fallback;
    }

    // Eit importert kart kan innehalde kva som helst, så kvar node blir
    // bygd opp att felt for felt i staden for å bli kopiert rett inn.
    function cleanNode(n, legacyLineEnding) {
        const color = typeof n.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(n.color)
            ? n.color : Eikekveik.DEFAULT_COLOR;
        return {
            id: Number(n.id),
            text: String(n.text ?? ''),
            x: Number(n.x) || 0,
            y: Number(n.y) || 0,
            color,
            parentId: n.parentId == null ? null : Number(n.parentId),
            shape: Eikekveik.Shapes.has(n.shape) ? n.shape : Eikekveik.DEFAULT_SHAPE,
            icon: Eikekveik.Symbols.clean(n.icon),
            lineEnding: cleanLineEnding(n.lineEnding, legacyLineEnding)
        };
    }

    function reset() {
        state.nodes = [];
        state.nextId = 1;
        state.selectedId = null;
        state.selectedEdgeId = null;
        state.history = [];
        state.historyIndex = -1;

        const canvas = Eikekveik.el.canvas;
        const rect = canvas.getBoundingClientRect();
        const cx = Math.max(200, rect.width / 2);
        const cy = Math.max(150, rect.height / 2);

        addNode({
            text: 'Hovudidé',
            x: cx - 60,
            y: cy - 24,
            color: Eikekveik.DEFAULT_COLOR,
            parentId: null
        }, { skipHistory: true });

        pushHistory();
    }

    function load(snapshot) {
        if (!snapshot || !Array.isArray(snapshot.nodes)) return;
        const legacyLineEnding = snapshot.arrows ? 'end' : 'none';
        state.nodes = snapshot.nodes.map(n => cleanNode(n, legacyLineEnding)).filter(n => Number.isFinite(n.id));
        state.nextId = state.nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
        state.selectedId = null;
        state.selectedEdgeId = null;
        state.history = [];
        state.historyIndex = -1;
        pushHistory();
    }

    function snapshot() {
        return {
            nodes: state.nodes.map(n => ({ ...n, icon: n.icon ? { ...n.icon } : null })),
            nextId: state.nextId
        };
    }

    function addNode(props, opts = {}) {
        const node = {
            id: newId(),
            text: props.text ?? 'Ny node',
            x: props.x ?? 100,
            y: props.y ?? 100,
            color: props.color ?? Eikekveik.DEFAULT_COLOR,
            parentId: props.parentId ?? null,
            shape: props.shape ?? Eikekveik.DEFAULT_SHAPE,
            icon: props.icon ?? null,
            lineEnding: cleanLineEnding(props.lineEnding)
        };
        state.nodes.push(node);
        if (!opts.skipHistory) pushHistory();
        return node;
    }

    function updateNode(id, patch, opts = {}) {
        const n = findNode(id);
        if (!n) return null;
        Object.assign(n, patch);
        if (!opts.skipHistory) pushHistory();
        return n;
    }

    function updateEdge(id, ending, opts = {}) {
        const n = findNode(id);
        if (!n || n.parentId == null) return null;
        n.lineEnding = cleanLineEnding(ending);
        if (!opts.skipHistory) pushHistory();
        return n;
    }

    function deleteNode(id, opts = {}) {
        const node = findNode(id);
        if (!node) return [];

        const toRemove = new Set([id]);
        let changed = true;
        while (changed) {
            changed = false;
            for (const n of state.nodes) {
                if (n.parentId != null && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
                    toRemove.add(n.id);
                    changed = true;
                }
            }
        }

        state.nodes = state.nodes.filter(n => !toRemove.has(n.id));
        if (toRemove.has(state.selectedId)) state.selectedId = null;
        if (toRemove.has(state.selectedEdgeId)) state.selectedEdgeId = null;
        if (!opts.skipHistory) pushHistory();
        return [...toRemove];
    }

    function descendants(id) {
        const result = [];
        const collect = (parentId) => {
            for (const n of state.nodes) {
                if (n.parentId === parentId) {
                    result.push(n.id);
                    collect(n.id);
                }
            }
        };
        collect(id);
        return result;
    }

    function pushHistory() {
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(JSON.stringify(snapshot()));
        if (state.history.length > HISTORY_LIMIT) {
            state.history.shift();
        }
        state.historyIndex = state.history.length - 1;
    }

    function canUndo() { return state.historyIndex > 0; }
    function canRedo() { return state.historyIndex < state.history.length - 1; }

    function undo() {
        if (!canUndo()) return false;
        state.historyIndex--;
        applySnapshot(JSON.parse(state.history[state.historyIndex]));
        return true;
    }

    function redo() {
        if (!canRedo()) return false;
        state.historyIndex++;
        applySnapshot(JSON.parse(state.history[state.historyIndex]));
        return true;
    }

    function applySnapshot(snap) {
        state.nodes = snap.nodes.map(n => ({ ...n }));
        state.nextId = snap.nextId;
        if (!findNode(state.selectedId)) state.selectedId = null;
        const edgeNode = findNode(state.selectedEdgeId);
        if (!edgeNode || edgeNode.parentId == null) state.selectedEdgeId = null;
    }

    return {
        init, reset, load, snapshot,
        getNodes, getEdges, findNode, descendants,
        getSelectedId, setSelected, getSelectedEdgeId, setSelectedEdge,
        addNode, updateNode, updateEdge, deleteNode,
        undo, redo, canUndo, canRedo, pushHistory
    };
})();
