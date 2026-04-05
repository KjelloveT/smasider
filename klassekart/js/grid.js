/* ══════════════════════════════════════
   GRID.JS — Canvas grid, snap, drag-and-drop
   ══════════════════════════════════════ */

const Grid = (() => {
    const CELL = 40;
    let canvas = null;
    let selectedEl = null;
    let dragEl = null;
    let dragStartMouseX = 0;
    let dragStartMouseY = 0;
    let dragStartLeft = 0;
    let dragStartTop = 0;
    let isDragging = false;
    let movedDuringDrag = false;

    let resizeEl = null;
    let resizeStartMouseX = 0;
    let resizeStartMouseY = 0;
    let resizeStartW = 0;
    let resizeStartH = 0;
    let isResizing = false;

    function init() {
        canvas = document.getElementById('canvas');
        canvas.addEventListener('mousedown', onCanvasMouseDown);
        canvas.addEventListener('mousemove', onCanvasMouseMove);
        canvas.addEventListener('mouseup', onCanvasMouseUp);
        canvas.addEventListener('mouseleave', onCanvasMouseUp);
        document.addEventListener('keydown', onKeyDown);
        canvas.addEventListener('click', onCanvasClick);
    }

    function snap(val) {
        return Math.round(val / CELL) * CELL;
    }

    function snapPos(x, y, rot, w, h) {
        const isRot = (rot === 90 || rot === 270);
        if (isRot) {
            // For rotated elements, we want the visual bounding box to snap to grid.
            // Visual Left = x + (w-h)/2
            // Visual Top = y + (h-w)/2
            const offset = (w - h) / 2;
            return {
                x: Math.round((x + offset) / CELL) * CELL - offset,
                y: Math.round((y - offset) / CELL) * CELL + offset
            };
        }
        return { x: snap(x), y: snap(y) };
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function getCanvasRect() {
        return canvas.getBoundingClientRect();
    }

    /* ── Select / Deselect ── */
    function selectElement(el) {
        deselectAll();
        if (el) {
            el.classList.add('selected');
            selectedEl = el;
        }
    }

    function deselectAll() {
        if (selectedEl) selectedEl.classList.remove('selected');
        selectedEl = null;
        App.hideElementTools();
        document.getElementById('color-picker').classList.add('hidden');
    }

    function getSelected() {
        return selectedEl;
    }

    /* ── Canvas mouse events ── */
    function onCanvasClick(e) {
        if (e.target === canvas) {
            deselectAll();
            return;
        }

        const el = e.target.closest('.desk, .furniture');
        if (el) {
            selectElement(el);
            App.showElementTools(el);
        }
    }

    function onCanvasMouseDown(e) {
        if (e.button !== 0) return;

        if (e.target.closest('#element-tools')) return;

        const handle = e.target.closest('.resize-handle');
        if (handle) {
            resizeEl = handle.closest('.furniture');
            if (!resizeEl) return;
            selectElement(resizeEl);
            resizeStartMouseX = e.clientX;
            resizeStartMouseY = e.clientY;
            resizeStartW = resizeEl.offsetWidth;
            resizeStartH = resizeEl.offsetHeight;
            isResizing = true;
            App.hideElementTools();
            e.preventDefault();
            return;
        }

        if (e.target.closest('.furn-label[contenteditable="true"]')) return;

        const el = e.target.closest('.desk, .furniture');
        if (!el) return;

        selectElement(el);
        dragEl = el;
        dragStartMouseX = e.clientX;
        dragStartMouseY = e.clientY;
        dragStartLeft = parseInt(el.style.left) || 0;
        dragStartTop = parseInt(el.style.top) || 0;
        isDragging = true;
        movedDuringDrag = false;
        el.style.zIndex = 50;
        el.style.cursor = 'grabbing';
        App.hideElementTools();
        e.preventDefault();
    }

    function onCanvasMouseMove(e) {
        if (isResizing && resizeEl) {
            const dx = e.clientX - resizeStartMouseX;
            const dy = e.clientY - resizeStartMouseY;
            const newW = Math.max(40, snap(resizeStartW + dx));
            const newH = Math.max(40, snap(resizeStartH + dy));
            resizeEl.style.width = newW + 'px';
            resizeEl.style.height = newH + 'px';
            updateFurnLayout(resizeEl);
            e.preventDefault();
            return;
        }

        if (!isDragging || !dragEl) return;
        const dx = e.clientX - dragStartMouseX;
        const dy = e.clientY - dragStartMouseY;

        let x = dragStartLeft + dx;
        let y = dragStartTop + dy;

        const rot = (parseInt(dragEl.dataset.rotation) || 0) % 360;
        const w = dragEl.offsetWidth;
        const h = dragEl.offsetHeight;
        const snapped = snapPos(x, y, rot, w, h);
        x = snapped.x;
        y = snapped.y;

        const bounds = getElementBoundsForClamp(dragEl);
        x = clamp(x, bounds.minLeft, bounds.maxLeft);
        y = clamp(y, bounds.minTop, bounds.maxTop);

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedDuringDrag = true;

        dragEl.style.left = x + 'px';
        dragEl.style.top = y + 'px';
    }

    function onCanvasMouseUp() {
        if (isResizing && resizeEl) {
            App.showElementTools(resizeEl);
            Storage.pushHistory();
        }
        resizeEl = null;
        isResizing = false;

        if (dragEl) {
            dragEl.style.zIndex = '';
            dragEl.style.cursor = 'grab';
            if (dragEl.classList.contains('desk')) dragEl.style.zIndex = 10;
            if (dragEl.classList.contains('furniture')) dragEl.style.zIndex = 5;
            App.showElementTools(dragEl);
            if (movedDuringDrag) {
                Storage.pushHistory();
            }
        }
        dragEl = null;
        isDragging = false;
    }

    function getElementBoundsForClamp(el) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const rot = (parseInt(el.dataset.rotation) || 0) % 360;
        const cw = canvas.offsetWidth;
        const ch = canvas.offsetHeight;

        if (rot === 90 || rot === 270) {
            const minLeft = (h - w) / 2;
            const maxLeft = cw - (h + w) / 2;
            const minTop = (w - h) / 2;
            const maxTop = ch - (h + w) / 2;
            return { minLeft, maxLeft, minTop, maxTop };
        }

        return {
            minLeft: 0,
            maxLeft: cw - w,
            minTop: 0,
            maxTop: ch - h
        };
    }

    /* ── Keyboard ── */
    function onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        if (e.key === 'Delete' && selectedEl) {
            App.removeElement(selectedEl);
            selectedEl = null;
        }
        if (e.key === 'Escape') {
            deselectAll();
            App.exitSwapMode();
        }
    }

    /* ── Create desk ── */
    function createDesk(name, x, y, color, locked, id, rotation) {
        const d = document.createElement('div');
        d.className = 'desk';
        d.dataset.studentId = id || crypto.randomUUID();
        d.dataset.studentName = name;
        d.dataset.locked = locked ? '1' : '0';
        d.dataset.color = color || '#ffffff';
        const rot = rotation || 0;
        d.dataset.rotation = rot;
        
        const snapped = snapPos(x, y, rot % 360, 80, 40);
        d.style.left = snapped.x + 'px';
        d.style.top = snapped.y + 'px';
        d.style.width = '80px';
        d.style.height = '40px';
        
        if (rot) d.classList.add('rot-' + rot);
        
        if (color && color !== '#ffffff') {
            d.style.background = color;
        }
        if (locked) d.classList.add('locked');

        const nameEl = document.createElement('span');
        nameEl.className = 'desk-name';
        nameEl.textContent = name;
        d.appendChild(nameEl);

        if (locked) {
            const lock = document.createElement('span');
            lock.className = 'lock-icon';
            lock.appendChild(Icons.create('lock', 12));
            d.appendChild(lock);
        }

        canvas.appendChild(d);
        return d;
    }

    /* Icon name map for furniture types */
    const FURN_ICONS = {
        kateter: 'monitor', tavle: 'presentation', dor: 'door-open',
        vindu: 'grid-2x2', hylle: 'library', tekst: 'type'
    };
    const FURN_LABELS = {
        kateter: 'Kateter', tavle: 'Tavle', dor: 'Dør',
        vindu: 'Vindu', hylle: 'Hylle', tekst: 'Tekst'
    };

    /* ── Create furniture ── */
    function createFurniture(type, x, y, rotation, labelText, w, h) {
        const f = document.createElement('div');
        f.className = 'furniture';
        f.dataset.type = type;
        const rot = rotation || 0;
        f.dataset.rotation = rot;
        
        // Initial sizes from CSS or provided
        const initialW = w || 120; // Default fallback
        const initialH = h || 40;
        
        const snapped = snapPos(x, y, rot % 360, initialW, initialH);
        f.style.left = snapped.x + 'px';
        f.style.top = snapped.y + 'px';
        if (w) f.style.width = w + 'px';
        if (h) f.style.height = h + 'px';

        if (rot) f.classList.add('rot-' + rot);

        /* Inner wrapper — counter-rotated to keep content upright */
        const inner = document.createElement('div');
        inner.className = 'furn-inner';

        const iconWrap = document.createElement('span');
        iconWrap.className = 'furn-icon-wrap';
        iconWrap.appendChild(Icons.create(FURN_ICONS[type] || 'move', 18));
        inner.appendChild(iconWrap);

        const lbl = document.createElement('span');
        lbl.className = 'furn-label';
        lbl.textContent = labelText || FURN_LABELS[type] || type;
        if (type === 'tekst') {
            lbl.contentEditable = true;
            let oldText = lbl.textContent;
            lbl.addEventListener('focus', () => { oldText = lbl.textContent; });
            lbl.addEventListener('blur', () => {
                if (lbl.textContent !== oldText) {
                    Storage.pushHistory();
                }
            });
        }
        inner.appendChild(lbl);

        f.appendChild(inner);

        const handle = document.createElement('span');
        handle.className = 'resize-handle';
        f.appendChild(handle);

        canvas.appendChild(f);
        updateFurnLayout(f);
        return f;
    }

    /* ── Adaptive layout: horizontal vs vertical, auto-size icon+text ── */
    function updateFurnLayout(f) {
        const w = f.offsetWidth;
        const h = f.offsetHeight;
        const rot = (parseInt(f.dataset.rotation) || 0) % 360;
        const effectiveW = (rot === 90 || rot === 270) ? h : w;
        const effectiveH = (rot === 90 || rot === 270) ? w : h;
        const inner = f.querySelector('.furn-inner');
        if (!inner) return;

        inner.classList.remove('lay-h', 'lay-v');
        inner.classList.add(effectiveW >= effectiveH ? 'lay-h' : 'lay-v');

        /* Scale icon to fit */
        const iconWrap = inner.querySelector('.furn-icon-wrap');
        const lbl = inner.querySelector('.furn-label');
        const minDim = Math.min(effectiveW, effectiveH);
        const iconSize = Math.max(12, Math.min(minDim - 8, 22));
        const svgEl = iconWrap ? iconWrap.querySelector('svg') : null;
        if (svgEl) {
            svgEl.setAttribute('width', iconSize);
            svgEl.setAttribute('height', iconSize);
        }

        /* Scale label font */
        if (lbl) {
            const maxFont = Math.max(7, Math.min(minDim * 0.3, 12));
            lbl.style.fontSize = maxFont + 'px';
        }
    }

    /* ── Get all desks / furniture ── */
    function getDesks() {
        return Array.from(canvas.querySelectorAll('.desk'));
    }

    function getFurniture() {
        return Array.from(canvas.querySelectorAll('.furniture'));
    }

    function clearCanvas() {
        canvas.querySelectorAll('.desk, .furniture').forEach(el => el.remove());
        deselectAll();
    }

    function clearDesks() {
        canvas.querySelectorAll('.desk').forEach(el => el.remove());
        deselectAll();
    }

    function getCanvasSize() {
        return { w: canvas.offsetWidth, h: canvas.offsetHeight };
    }

    function getCell() {
        return CELL;
    }

    function getCanvas() {
        return canvas;
    }

    return {
        init, snap, snapPos, clamp, selectElement, deselectAll, getSelected,
        createDesk, createFurniture, updateFurnLayout,
        getDesks, getFurniture,
        clearCanvas, clearDesks, getCanvasSize, getCell, getCanvas,
        getCanvasRect
    };
})();
