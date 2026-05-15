// Eikekveik — Interaction (drag, dobbeltklikk-redigering, slett, tastatur)

Eikekveik.Interaction = (function () {
    let drag = null; // { id, offsetX, offsetY, moved }
    let editingId = null;

    function init() {
        const canvas = Eikekveik.el.canvas;

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        canvas.addEventListener('dblclick', onCanvasDblClick);
        canvas.addEventListener('click', onCanvasClick);

        document.addEventListener('keydown', onKeyDown);

        Eikekveik.el.btnNew.addEventListener('click', onNew);

        // Undo/redo: renderAll() MÅ kallast før afterChange() så DOM speglar ny state
        Eikekveik.el.btnUndo.addEventListener('click', () => {
            if (Eikekveik.State.undo()) {
                Eikekveik.Render.renderAll();
                afterChange();
            }
        });
        Eikekveik.el.btnRedo.addEventListener('click', () => {
            if (Eikekveik.State.redo()) {
                Eikekveik.Render.renderAll();
                afterChange();
            }
        });

        Eikekveik.el.colorRow.addEventListener('click', onColorPick);

        canvas.addEventListener('click', (e) => {
            if (e.target === canvas) {
                Eikekveik.State.setSelected(null);
                Eikekveik.Render.renderAll();
                Eikekveik.Render.showColorPalette(false);
            }
        });

        window.addEventListener('resize', () => Eikekveik.Render.renderEdges());
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

        const pt = Eikekveik.Render.getCanvasPoint(e.clientX, e.clientY);
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
        const pt = Eikekveik.Render.getCanvasPoint(e.clientX, e.clientY);
        const newX = Math.max(0, pt.x - drag.offsetX);
        const newY = Math.max(0, pt.y - drag.offsetY);
        const node = Eikekveik.State.findNode(drag.id);
        if (!node) return;
        if (!drag.moved && (Math.abs(newX - node.x) > 2 || Math.abs(newY - node.y) > 2)) {
            drag.moved = true;
        }
        node.x = newX;
        node.y = newY;
        Eikekveik.Render.updateNodePosition(drag.id);
    }

    function onPointerUp(e) {
        if (!drag) return;
        const nodeEl = Eikekveik.el.canvas.querySelector(`.node[data-id="${drag.id}"]`);
        if (nodeEl) nodeEl.classList.remove('dragging');

        if (!drag.moved) {
            Eikekveik.State.setSelected(drag.id);
            Eikekveik.Render.renderAll();
            Eikekveik.Render.showColorPalette(true);
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
            const pt = Eikekveik.Render.getCanvasPoint(e.clientX, e.clientY);
            const node = Eikekveik.State.addNode({
                text: 'Ny node',
                x: pt.x - 50,
                y: pt.y - 20,
                color: Eikekveik.DEFAULT_COLOR,
                parentId: null
            });
            Eikekveik.State.setSelected(node.id);
            Eikekveik.Render.renderAll();
            Eikekveik.Render.showColorPalette(true);
            afterChange();
            startEdit(node.id);
        }
    }

    function onCanvasClick(e) {
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
        const y = parent.y + 80 + (siblings.length * 20);

        const child = Eikekveik.State.addNode({
            text: 'Ny node',
            x: Math.max(10, x),
            y: Math.max(10, y),
            color: parent.color,
            parentId
        });
        Eikekveik.State.setSelected(child.id);
        Eikekveik.Render.renderAll();
        Eikekveik.Render.showColorPalette(true);
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
        Eikekveik.Render.showColorPalette(false);
        afterChange();
    }

    function startEdit(id) {
        const nodeEl = Eikekveik.el.canvas.querySelector(`.node[data-id="${id}"]`);
        if (!nodeEl) return;
        const textEl = nodeEl.querySelector('.node-text');
        if (!textEl) return;

        editingId = id;
        const node = Eikekveik.State.findNode(id);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'node-edit';
        input.value = node.text;
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
            if (save && newText && newText !== node.text) {
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

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (Eikekveik.State.undo()) {
                Eikekveik.Render.renderAll();
                afterChange();
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
            e.preventDefault();
            if (Eikekveik.State.redo()) {
                Eikekveik.Render.renderAll();
                afterChange();
            }
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
            if (id != null) {
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

    function onColorPick(e) {
        const btn = e.target.closest('.color-swatch');
        if (!btn) return;
        const id = Eikekveik.State.getSelectedId();
        if (id == null) return;
        Eikekveik.State.updateNode(id, { color: btn.dataset.color });
        Eikekveik.Render.renderAll();
        Eikekveik.Render.updateActiveSwatch();
        afterChange();
    }

    function onNew() {
        const hasContent = Eikekveik.State.getNodes().length > 1;
        if (hasContent) {
            const ok = confirm('Lage nytt Eikekveik-kart? Det noverande kartet blir borte (med mindre det er lagra).');
            if (!ok) return;
        }
        Eikekveik.State.reset();
        Eikekveik.Render.renderAll();
        Eikekveik.Render.showColorPalette(false);
        afterChange();
    }

    function afterChange() {
        Eikekveik.Render.updateUndoRedo();
        Eikekveik.Render.updateActiveSwatch();
        if (Eikekveik.Storage && Eikekveik.Storage.autoSave) {
            Eikekveik.Storage.autoSave();
        }
    }

    return { init, afterChange, startEdit, addChild };
})();
