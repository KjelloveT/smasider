// Eikekveik — Interaction (drag, redigering, slett, tastatur og eigenskapspanelet)

Eikekveik.Interaction = (function () {
    let drag = null; // { id, offsetX, offsetY, moved }
    let editingId = null;

    function init() {
        const el = Eikekveik.el;
        const canvas = el.canvas;

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        canvas.addEventListener('dblclick', onCanvasDblClick);
        canvas.addEventListener('click', onCanvasClick);

        document.addEventListener('keydown', onKeyDown);

        el.btnNew.addEventListener('click', onNew);
        el.btnUndo.addEventListener('click', undo);
        el.btnRedo.addEventListener('click', redo);

        el.colorRow.addEventListener('click', onColorPick);
        el.shapePicker.addEventListener('click', onShapePick);
        el.btnIcon.addEventListener('click', onIconPick);
        el.btnIconRemove.addEventListener('click', () => updateSelected({ icon: null }));
        el.arrowsToggle.addEventListener('change', onArrowsToggle);
    }

    // Undo/redo: renderAll() MÅ kallast før afterChange() så DOM speglar ny state
    function undo() {
        if (Eikekveik.State.undo()) {
            Eikekveik.Render.renderAll();
            afterChange();
        }
    }

    function redo() {
        if (Eikekveik.State.redo()) {
            Eikekveik.Render.renderAll();
            afterChange();
        }
    }

    function findNodeEl(target) {
        return target.closest ? target.closest('.node') : null;
    }

    function onPointerDown(e) {
        if (editingId) return;
        const nodeEl = findNodeEl(e.target);
        if (!nodeEl) return;
        if (e.target.closest('.node-btn')) return;

        const id = parseInt(nodeEl.dataset.id, 10);
        const node = Eikekveik.State.findNode(id);
        if (!node) return;

        const pt = Eikekveik.View.toWorld(e.clientX, e.clientY);
        drag = {
            id,
            offsetX: pt.x - node.x,
            offsetY: pt.y - node.y,
            moved: false
        };
        nodeEl.classList.add('dragging');
        nodeEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
        if (!drag) return;
        const node = Eikekveik.State.findNode(drag.id);
        if (!node) return;
        const pt = Eikekveik.View.toWorld(e.clientX, e.clientY);
        const newX = pt.x - drag.offsetX;
        const newY = pt.y - drag.offsetY;
        if (!drag.moved && Math.hypot(newX - node.x, newY - node.y) <= 2) return;
        drag.moved = true;
        node.x = newX;
        node.y = newY;
        Eikekveik.Render.updateNodePosition(drag.id);
    }

    function onPointerUp() {
        if (!drag) return;
        const nodeEl = Eikekveik.el.world.querySelector(`.node[data-id="${drag.id}"]`);
        if (nodeEl) nodeEl.classList.remove('dragging');

        if (!drag.moved) {
            Eikekveik.State.setSelected(drag.id);
            Eikekveik.Render.renderAll();
        } else {
            Eikekveik.State.pushHistory();
            afterChange();
        }
        drag = null;
    }

    function onCanvasDblClick(e) {
        if (editingId) return;
        const nodeEl = findNodeEl(e.target);
        if (nodeEl) {
            startEdit(parseInt(nodeEl.dataset.id, 10));
            return;
        }
        if (e.target === Eikekveik.el.canvas) {
            const pt = Eikekveik.View.toWorld(e.clientX, e.clientY);
            const node = Eikekveik.State.addNode({
                text: 'Ny node',
                x: pt.x - 50,
                y: pt.y - 20,
                color: Eikekveik.DEFAULT_COLOR,
                parentId: null
            });
            Eikekveik.State.setSelected(node.id);
            Eikekveik.Render.renderAll();
            afterChange();
            startEdit(node.id);
        }
    }

    function onCanvasClick(e) {
        if (e.target === Eikekveik.el.canvas) {
            if (Eikekveik.View.consumeClick()) return;
            if (Eikekveik.State.getSelectedId() != null) {
                Eikekveik.State.setSelected(null);
                Eikekveik.Render.renderAll();
            }
            return;
        }

        const btn = e.target.closest('.node-btn');
        if (!btn) return;
        const nodeEl = findNodeEl(btn);
        if (!nodeEl) return;
        const id = parseInt(nodeEl.dataset.id, 10);
        const action = btn.dataset.action;

        if (action === 'add') {
            addChild(id);
        } else if (action === 'delete') {
            deleteWithConfirm(id);
        }
    }

    function addChild(parentId) {
        const parent = Eikekveik.State.findNode(parentId);
        if (!parent) return;

        const siblings = Eikekveik.State.getNodes().filter(n => n.parentId === parentId);
        const offset = 120 + (siblings.length % 4) * 30;
        const angle = (siblings.length * 0.6) - 0.6;
        const x = parent.x + Math.cos(angle) * offset + 40;
        // Under den faktiske høgda til forelderen: ei avgjerd eller ei sky er
        // mykje høgare enn ein boks, og eit fast sprang ville lagt barnet oppå.
        const parentEl = Eikekveik.el.world.querySelector(`.node[data-id="${parentId}"]`);
        const parentHeight = parentEl ? parentEl.offsetHeight : 48;
        const y = parent.y + parentHeight + 40 + (siblings.length * 20);

        // I eit tankekart held greina fram i same form. Etter eit
        // flytskjemasymbol kjem som regel eit vanleg steg, ikkje ei ny avgjerd.
        const shape = Eikekveik.Shapes.get(parent.shape).group === 'flyt' ? 'process' : parent.shape;

        const child = Eikekveik.State.addNode({
            text: 'Ny node',
            x,
            y,
            color: parent.color,
            shape,
            parentId
        });
        Eikekveik.State.setSelected(child.id);
        Eikekveik.Render.renderAll();
        afterChange();
        startEdit(child.id);
    }

    function deleteWithConfirm(id) {
        const children = Eikekveik.State.descendants(id);
        if (children.length > 0) {
            const ok = confirm(`Slette noden og ${children.length} barn-node(ar)?`);
            if (!ok) return;
        }
        Eikekveik.State.deleteNode(id);
        Eikekveik.State.setSelected(null);
        Eikekveik.Render.renderAll();
        afterChange();
    }

    function startEdit(id) {
        const nodeEl = Eikekveik.el.world.querySelector(`.node[data-id="${id}"]`);
        if (!nodeEl) return;
        const textEl = nodeEl.querySelector('.node-text');
        if (!textEl) return;

        editingId = id;
        const node = Eikekveik.State.findNode(id);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'node-edit';
        input.value = node.text;
        input.setAttribute('aria-label', 'Tekst på noden');
        textEl.style.display = 'none';
        nodeEl.insertBefore(input, textEl);
        input.focus();
        input.select();

        const finish = (save) => {
            if (editingId !== id) return;
            editingId = null;
            const newText = save ? input.value.trim() : node.text;
            input.remove();
            textEl.style.display = '';
            // Tom tekst er greitt når noden har eit ikon — då er ikonet innhaldet.
            if (save && newText !== node.text && (newText || node.icon)) {
                Eikekveik.State.updateNode(id, { text: newText });
                Eikekveik.Render.renderAll();
                afterChange();
            } else {
                Eikekveik.Render.renderAll();
            }
        };

        input.addEventListener('blur', () => finish(true));
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
            ev.stopPropagation();
        });
        input.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    }

    function onKeyDown(e) {
        const t = e.target;
        const isField = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;

        if (e.key === 'Escape') {
            if (Eikekveik.Storage && Eikekveik.Storage.closeOpenModals) {
                Eikekveik.Storage.closeOpenModals();
            }
        }

        if (isField) return;

        // Medan ein dialog står open, høyrer tastane til han. Elles ville
        // Delete på ein knapp i ikonveljaren slette noden bak dialogen.
        if (document.querySelector('.modal-overlay.open')) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
            e.preventDefault();
            redo();
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            const id = Eikekveik.State.getSelectedId();
            if (id != null) {
                e.preventDefault();
                deleteWithConfirm(id);
            }
        }

        if (e.key === 'Enter' || e.key === 'F2') {
            const id = Eikekveik.State.getSelectedId();
            if (id != null && t.tagName !== 'BUTTON') {
                e.preventDefault();
                startEdit(id);
            }
        }

        if (e.key === '+' || e.key === '=') {
            const id = Eikekveik.State.getSelectedId();
            if (id != null) {
                e.preventDefault();
                addChild(id);
            }
        }
    }

    // ── Eigenskapspanelet ──

    function updateNodeProps(id, patch) {
        const node = Eikekveik.State.findNode(id);
        if (!node) return;
        const same = Object.keys(patch).every(k => JSON.stringify(node[k]) === JSON.stringify(patch[k]));
        if (same) return;
        // Ein node utan tekst og utan ikon blir ein tom klatt ingen finn att.
        if (patch.icon === null && !node.text) patch = { ...patch, text: 'Ny node' };
        Eikekveik.State.updateNode(id, patch);
        Eikekveik.Render.renderAll();
        afterChange();
    }

    function updateSelected(patch) {
        const id = Eikekveik.State.getSelectedId();
        if (id != null) updateNodeProps(id, patch);
    }

    function onColorPick(e) {
        const btn = e.target.closest('.color-swatch');
        if (btn) updateSelected({ color: btn.dataset.color });
    }

    function onShapePick(e) {
        const btn = e.target.closest('.shape-btn');
        if (btn) updateSelected({ shape: btn.dataset.shape });
    }

    function onIconPick() {
        const id = Eikekveik.State.getSelectedId();
        const node = id != null ? Eikekveik.State.findNode(id) : null;
        if (!node) return;
        Eikekveik.Picker.open(node.icon, icon => updateNodeProps(id, { icon }));
    }

    function onArrowsToggle(e) {
        Eikekveik.State.setArrows(e.target.checked);
        Eikekveik.Render.renderEdges();
        afterChange();
    }

    function onNew() {
        const hasContent = Eikekveik.State.getNodes().length > 1;
        if (hasContent) {
            const ok = confirm('Lage nytt Eikekveik-kart? Det noverande kartet blir borte (med mindre det er lagra).');
            if (!ok) return;
        }
        Eikekveik.View.reset();
        Eikekveik.State.reset();
        Eikekveik.Render.renderAll();
        afterChange();
    }

    function afterChange() {
        Eikekveik.Render.updateUndoRedo();
        if (Eikekveik.Storage && Eikekveik.Storage.autoSave) {
            Eikekveik.Storage.autoSave();
        }
    }

    return { init, afterChange, startEdit, addChild };
})();
