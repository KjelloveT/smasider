// Eikekveik — Render (nodar + SVG-kantar)

Eikekveik.Render = (function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function init() {}

    function renderAll() {
        renderNodes();
        renderEdges();
        updateUndoRedo();
        renderColorPalette();
    }

    function renderNodes() {
        const canvas = Eikekveik.el.canvas;
        const existing = new Map();
        canvas.querySelectorAll('.node').forEach(el => {
            existing.set(parseInt(el.dataset.id, 10), el);
        });

        const seen = new Set();
        const nodes = Eikekveik.State.getNodes();
        const selectedId = Eikekveik.State.getSelectedId();
        const rootId = nodes.find(n => n.parentId == null)?.id;

        for (const n of nodes) {
            seen.add(n.id);
            let el = existing.get(n.id);
            if (!el) {
                el = createNodeEl(n);
                canvas.appendChild(el);
            } else {
                updateNodeEl(el, n);
            }
            el.classList.toggle('selected', n.id === selectedId);
            el.classList.toggle('root', n.id === rootId);
        }

        for (const [id, el] of existing) {
            if (!seen.has(id)) el.remove();
        }
    }

    function createNodeEl(node) {
        const el = document.createElement('div');
        el.className = 'node';
        el.dataset.id = node.id;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.style.background = node.color;
        el.tabIndex = 0;

        const text = document.createElement('span');
        text.className = 'node-text';
        text.textContent = node.text;
        el.appendChild(text);

        const actions = document.createElement('div');
        actions.className = 'node-actions';

        const addBtn = document.createElement('button');
        addBtn.className = 'node-btn add';
        addBtn.type = 'button';
        addBtn.dataset.action = 'add';
        addBtn.setAttribute('aria-label', 'Legg til barn-node');
        addBtn.title = 'Legg til barn';
        addBtn.textContent = '+';
        actions.appendChild(addBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'node-btn delete';
        delBtn.type = 'button';
        delBtn.dataset.action = 'delete';
        delBtn.setAttribute('aria-label', 'Slett node');
        delBtn.title = 'Slett';
        delBtn.textContent = '×';
        actions.appendChild(delBtn);

        el.appendChild(actions);
        return el;
    }

    function updateNodeEl(el, node) {
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        el.style.background = node.color;
        const text = el.querySelector('.node-text');
        if (text && text.textContent !== node.text) {
            text.textContent = node.text;
        }
    }

    function renderEdges() {
        const svg = Eikekveik.el.edges;
        const canvas = Eikekveik.el.canvas;
        const rect = canvas.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

        while (svg.firstChild) svg.removeChild(svg.firstChild);

        const edges = Eikekveik.State.getEdges();
        for (const e of edges) {
            const from = Eikekveik.State.findNode(e.fromId);
            const to = Eikekveik.State.findNode(e.toId);
            if (!from || !to) continue;
            const fromEl = canvas.querySelector(`.node[data-id="${from.id}"]`);
            const toEl = canvas.querySelector(`.node[data-id="${to.id}"]`);
            if (!fromEl || !toEl) continue;

            const x1 = from.x + fromEl.offsetWidth / 2;
            const y1 = from.y + fromEl.offsetHeight / 2;
            const x2 = to.x + toEl.offsetWidth / 2;
            const y2 = to.y + toEl.offsetHeight / 2;

            const path = document.createElementNS(SVG_NS, 'path');
            const dx = (x2 - x1) * 0.5;
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            path.setAttribute('d', d);
            svg.appendChild(path);
        }
    }

    function updateNodePosition(id) {
        const node = Eikekveik.State.findNode(id);
        if (!node) return;
        const el = Eikekveik.el.canvas.querySelector(`.node[data-id="${id}"]`);
        if (el) {
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
        }
        renderEdges();
    }

    function updateUndoRedo() {
        Eikekveik.el.btnUndo.disabled = !Eikekveik.State.canUndo();
        Eikekveik.el.btnRedo.disabled = !Eikekveik.State.canRedo();
    }

    function renderColorPalette() {
        const row = Eikekveik.el.colorRow;
        if (row.children.length) return;
        for (const c of Eikekveik.COLORS) {
            const btn = document.createElement('button');
            btn.className = 'color-swatch';
            btn.type = 'button';
            btn.dataset.color = c.value;
            btn.style.background = c.value;
            btn.setAttribute('aria-label', 'Farge: ' + c.name);
            btn.title = c.name;
            row.appendChild(btn);
        }
    }

    function showColorPalette(show) {
        Eikekveik.el.colorPalette.hidden = !show;
        if (show) updateActiveSwatch();
    }

    function updateActiveSwatch() {
        const selId = Eikekveik.State.getSelectedId();
        const node = selId ? Eikekveik.State.findNode(selId) : null;
        const row = Eikekveik.el.colorRow;
        row.querySelectorAll('.color-swatch').forEach(btn => {
            btn.classList.toggle('active', node && btn.dataset.color === node.color);
        });
    }

    function getCanvasPoint(clientX, clientY) {
        const r = Eikekveik.el.canvas.getBoundingClientRect();
        return { x: clientX - r.left, y: clientY - r.top };
    }

    return {
        init, renderAll, renderNodes, renderEdges,
        updateNodePosition, updateUndoRedo,
        showColorPalette, updateActiveSwatch,
        getCanvasPoint
    };
})();
