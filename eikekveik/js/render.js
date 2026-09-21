// Eikekveik — Render (nodar, former, SVG-kantar og eigenskapspanelet)

Eikekveik.Render = (function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const ARROW_GAP = 12;
    let resizeObserver = null;

    function init() {
        // Storleiken på ein node kjem frå innhaldet og kan endre seg utan at
        // state gjer det: medan nokon skriv, når ein font blir lasta eller når
        // ein node blir rot. Då må forma og linjene teiknast på nytt.
        resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const el = entry.target;
                const node = Eikekveik.State.findNode(parseInt(el.dataset.id, 10));
                if (node && el.isConnected) drawShape(el, node);
            }
            renderEdges();
        });
        ensureEdgeLayer();
        buildPanel();
    }

    function svgEl(tag, attrs) {
        const node = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
        return node;
    }

    function renderAll() {
        renderNodes();
        renderEdges();
        updateUndoRedo();
        updatePanel();
    }

    function nodeEls() {
        const map = new Map();
        Eikekveik.el.world.querySelectorAll('.node').forEach(el => {
            map.set(parseInt(el.dataset.id, 10), el);
        });
        return map;
    }

    // ── Nodar ──

    function renderNodes() {
        const world = Eikekveik.el.world;
        const existing = nodeEls();
        const nodes = Eikekveik.State.getNodes();
        const selectedId = Eikekveik.State.getSelectedId();
        const rootId = nodes.find(n => n.parentId == null)?.id;
        const seen = new Set();
        const drawn = [];

        for (const n of nodes) {
            seen.add(n.id);
            let el = existing.get(n.id);
            if (!el) {
                el = createNodeEl(n);
                world.appendChild(el);
                resizeObserver.observe(el);
            }
            updateNodeEl(el, n);
            el.classList.toggle('selected', n.id === selectedId);
            el.classList.toggle('root', n.id === rootId);
            drawn.push([el, n]);
        }

        for (const [id, el] of existing) {
            if (!seen.has(id)) {
                resizeObserver.unobserve(el);
                el.remove();
            }
        }

        // Formene blir teikna etter alle DOM-endringane, så layouten berre
        // blir rekna ut éin gong.
        for (const [el, n] of drawn) drawShape(el, n);
    }

    function createNodeEl(node) {
        const el = document.createElement('div');
        el.className = 'node';
        el.dataset.id = node.id;
        el.tabIndex = 0;

        const shape = svgEl('svg', { class: 'node-shape', 'aria-hidden': 'true' });
        shape.append(
            svgEl('path', { class: 'shape-shadow' }),
            svgEl('path', { class: 'shape-fill' }),
            svgEl('path', { class: 'shape-detail' })
        );
        el.appendChild(shape);

        const icon = document.createElement('span');
        icon.className = 'node-icon';
        icon.hidden = true;
        el.appendChild(icon);

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
        el.style.setProperty('--node-fill', node.color);
        if (el.dataset.shape !== node.shape) el.dataset.shape = node.shape;

        const text = el.querySelector('.node-text');
        if (text && text.textContent !== node.text) {
            text.textContent = node.text;
        }

        const iconKey = node.icon ? node.icon.type + ':' + node.icon.value : '';
        if (el.dataset.icon !== iconKey) {
            el.dataset.icon = iconKey;
            fillIcon(el.querySelector('.node-icon'), node.icon, 24);
        }
    }

    function fillIcon(target, icon, size) {
        target.replaceChildren();
        target.hidden = !icon;
        if (!icon) return;
        if (icon.type === 'emoji') {
            target.textContent = icon.value;
        } else {
            // ICON() gjev fast SVG-markup frå vår eigen ikonmodul og set aldri
            // namnet inn i markupen — eit ukjent namn gjev berre eit tomt ikon.
            target.innerHTML = ICON(icon.value, size);
        }
    }

    function drawShape(el, node) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const key = `${node.shape}|${w}|${h}`;
        if (el.dataset.shapeKey === key) return;
        el.dataset.shapeKey = key;

        const svg = el.querySelector('.node-shape');
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

        const p = Eikekveik.Shapes.paths(node.shape, w, h);
        svg.querySelector('.shape-shadow').setAttribute('d', p.outline);
        svg.querySelector('.shape-fill').setAttribute('d', p.outline);
        const detail = svg.querySelector('.shape-detail');
        if (p.detail) detail.setAttribute('d', p.detail);
        else detail.removeAttribute('d');
    }

    // ── Kantar ──

    function ensureEdgeLayer() {
        const svg = Eikekveik.el.edges;
        if (svg.querySelector('.edge-layer')) return;
        const defs = svgEl('defs');
        const marker = svgEl('marker', {
            id: 'ek-arrow', viewBox: '0 0 10 10', refX: '8', refY: '5',
            markerWidth: '4', markerHeight: '4',
            orient: 'auto-start-reverse', markerUnits: 'strokeWidth'
        });
        marker.appendChild(svgEl('path', { d: 'M0 0L10 5L0 10Z' }));
        defs.appendChild(marker);
        svg.append(defs, svgEl('g', { class: 'edge-layer' }));
    }

    // Linjene som SVG-stiar i verdskoordinatar. Både lerretet og
    // PNG-eksporten brukar denne, så dei to kan ikkje bli ulike.
    function edgeItems() {
        const els = nodeEls();
        const out = [];
        for (const e of Eikekveik.State.getEdges()) {
            const a = Eikekveik.State.findNode(e.fromId);
            const b = Eikekveik.State.findNode(e.toId);
            const aEl = els.get(e.fromId);
            const bEl = els.get(e.toId);
            if (!a || !b || !aEl || !bEl) continue;
            out.push({
                toId: e.toId,
                ending: e.ending,
                label: `Samband frå ${a.text || 'node'} til ${b.text || 'node'}`,
                d: edgePath(a, aEl.offsetWidth, aEl.offsetHeight, b, bEl.offsetWidth, bEl.offsetHeight, e.ending)
            });
        }
        return out;
    }

    function edgePaths() {
        return edgeItems().map(edge => edge.d);
    }

    function edgePath(a, aw, ah, b, bw, bh, ending) {
        const acx = a.x + aw / 2, acy = a.y + ah / 2;
        const bcx = b.x + bw / 2, bcy = b.y + bh / 2;

        // Linja går mellom dei to sidene som vender mot kvarandre, langs den
        // aksen der det er mest luft mellom nodane. Eit flytskjema som går
        // nedover får då linjer frå botn til topp, og pilspissen peikar rett.
        const gapX = Math.abs(bcx - acx) - (aw + bw) / 2;
        const gapY = Math.abs(bcy - acy) - (ah + bh) / 2;
        const vertical = gapY > gapX;
        const [sideA, sideB] = vertical
            ? (bcy >= acy ? ['bottom', 'top'] : ['top', 'bottom'])
            : (bcx >= acx ? ['right', 'left'] : ['left', 'right']);

        const p = Eikekveik.Shapes.anchor(a.shape, aw, ah, sideA);
        const q = Eikekveik.Shapes.anchor(b.shape, bw, bh, sideB);
        let x1 = a.x + p.x, y1 = a.y + p.y;
        let x2 = b.x + q.x, y2 = b.y + q.y;

        // Pilspissen skal ikkje liggje heilt inntil forma. Berre enden som
        // faktisk har pil blir flytt ut i mellomrommet; ein vanleg strek
        // brukar ankerpunktet på omrisset og går difor heilt inn til boksen.
        const vectors = {
            top: { x: 0, y: -1 }, right: { x: 1, y: 0 },
            bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }
        };
        if (ending === 'start' || ending === 'both') {
            x1 += vectors[sideA].x * ARROW_GAP;
            y1 += vectors[sideA].y * ARROW_GAP;
        }
        if (ending === 'end' || ending === 'both') {
            x2 += vectors[sideB].x * ARROW_GAP;
            y2 += vectors[sideB].y * ARROW_GAP;
        }

        if (vertical) {
            const k = (y2 - y1) / 2;
            return `M ${x1} ${y1} C ${x1} ${y1 + k}, ${x2} ${y2 - k}, ${x2} ${y2}`;
        }
        const k = (x2 - x1) / 2;
        return `M ${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`;
    }

    function renderEdges() {
        const layer = Eikekveik.el.edges.querySelector('.edge-layer');
        layer.replaceChildren();
        const selectedId = Eikekveik.State.getSelectedEdgeId();
        for (const edge of edgeItems()) {
            const group = svgEl('g', { class: 'edge' });
            const hit = svgEl('path', {
                class: 'edge-hit', d: edge.d, tabindex: '0', role: 'button',
                'data-edge-id': edge.toId,
                'aria-label': edge.label
            });
            const line = svgEl('path', { class: 'edge-line', d: edge.d });
            if (edge.ending === 'start' || edge.ending === 'both') {
                line.setAttribute('marker-start', 'url(#ek-arrow)');
            }
            if (edge.ending === 'end' || edge.ending === 'both') {
                line.setAttribute('marker-end', 'url(#ek-arrow)');
            }
            line.classList.toggle('selected', edge.toId === selectedId);
            group.append(hit, line);
            layer.appendChild(group);
        }
    }

    function updateNodePosition(id) {
        const node = Eikekveik.State.findNode(id);
        if (!node) return;
        const el = Eikekveik.el.world.querySelector(`.node[data-id="${id}"]`);
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

    // ── Eigenskapspanelet ──

    function buildPanel() {
        const el = Eikekveik.el;

        for (const c of Eikekveik.COLORS) {
            const btn = document.createElement('button');
            btn.className = 'color-swatch';
            btn.type = 'button';
            btn.dataset.color = c.value;
            btn.style.background = c.value;
            btn.setAttribute('aria-label', 'Farge: ' + c.name);
            btn.title = c.name;
            el.colorRow.appendChild(btn);
        }

        const grids = { kart: el.shapeGridKart, flyt: el.shapeGridFlyt };
        for (const [group, grid] of Object.entries(grids)) {
            for (const s of Eikekveik.Shapes.inGroup(group)) {
                const btn = document.createElement('button');
                btn.className = 'shape-btn';
                btn.type = 'button';
                btn.dataset.shape = s.id;
                btn.title = s.hint ? `${s.name}: ${s.hint}` : s.name;
                btn.append(Eikekveik.Shapes.previewSvg(s.id), Vy.el('span', 'shape-name', s.name));
                grid.appendChild(btn);
            }
        }
    }

    function updatePanel() {
        const el = Eikekveik.el;
        const id = Eikekveik.State.getSelectedId();
        const node = id != null ? Eikekveik.State.findNode(id) : null;
        const edgeId = Eikekveik.State.getSelectedEdgeId();
        const edgeNode = edgeId != null ? Eikekveik.State.findNode(edgeId) : null;

        el.panelNode.hidden = !node;
        el.panelEdge.hidden = !edgeNode;
        el.panelEmpty.hidden = !!node || !!edgeNode;
        if (edgeNode) {
            el.edgeEndingRow.querySelectorAll('.edge-ending-btn').forEach(btn => {
                btn.setAttribute('aria-pressed', btn.dataset.ending === edgeNode.lineEnding ? 'true' : 'false');
            });
        }
        if (!node) return;

        el.colorRow.querySelectorAll('.color-swatch').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.color === node.color ? 'true' : 'false');
        });
        el.shapePicker.querySelectorAll('.shape-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.shape === node.shape ? 'true' : 'false');
        });

        const preview = el.iconPreview;
        fillIcon(preview, node.icon, 28);
        preview.hidden = false;
        preview.classList.toggle('empty', !node.icon);
        if (!node.icon) preview.textContent = 'Ikkje valt';

        el.btnIcon.textContent = node.icon ? 'Byt ikon' : 'Vel ikon';
        el.btnIconRemove.disabled = !node.icon;
    }

    return {
        init, renderAll, renderNodes, renderEdges, edgeItems, edgePaths,
        updateNodePosition, updateUndoRedo, updatePanel
    };
})();
