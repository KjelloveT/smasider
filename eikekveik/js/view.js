// Eikekveik — View (zoom og panorering)
//
// Lerretet er eit vindauge inn i ei flate utan kantar. Nodane har koordinatar
// i flata («verda»), og vindauget viser eit utsnitt av henne med ein
// transform. Zoom rører difor aldri koordinatane i kartet: eit kart som vart
// laga før zoomen fanst, ser likt ut som før ved 100 %.

Eikekveik.View = (function () {
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 3;
    const STEP = 1.25;
    const GRID = 24;

    const view = { x: 0, y: 0, k: 1 };
    const pointers = new Map();
    let gesture = null;
    let suppressClick = false;

    function init() {
        const el = Eikekveik.el;
        el.zoomIn.addEventListener('click', () => zoomBy(STEP));
        el.zoomOut.addEventListener('click', () => zoomBy(1 / STEP));
        el.zoomReset.addEventListener('click', () => zoomTo(1));
        el.zoomFit.addEventListener('click', () => showAll());

        const canvas = el.canvas;
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        apply();
    }

    const clamp = k => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
    const rect = () => Eikekveik.el.canvas.getBoundingClientRect();

    function apply() {
        const el = Eikekveik.el;
        el.world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;

        // Rutenettet følgjer med, elles ser det ut som nodane glid over eit
        // fast underlag i staden for at heile flata flyttar seg.
        const g = GRID * view.k;
        el.canvas.style.backgroundSize = `${g}px ${g}px`;
        el.canvas.style.backgroundPosition = `${view.x + g / 2}px ${view.y + g / 2}px`;
        el.canvas.classList.toggle('grid-off', g < 10);

        const pct = Math.round(view.k * 100);
        el.zoomReset.textContent = pct + ' %';
        el.zoomReset.setAttribute('aria-label', `Zoom ${pct} %. Klikk for 100 %`);
        el.zoomIn.disabled = view.k >= MAX_ZOOM - 1e-6;
        el.zoomOut.disabled = view.k <= MIN_ZOOM + 1e-6;
    }

    function toWorld(clientX, clientY) {
        const r = rect();
        return {
            x: (clientX - r.left - view.x) / view.k,
            y: (clientY - r.top - view.y) / view.k
        };
    }

    // Zoom slik at punktet under peikaren står stille.
    function zoomAt(k, clientX, clientY) {
        const r = rect();
        const px = clientX - r.left;
        const py = clientY - r.top;
        const wx = (px - view.x) / view.k;
        const wy = (py - view.y) / view.k;
        view.k = clamp(k);
        view.x = px - wx * view.k;
        view.y = py - wy * view.k;
        apply();
    }

    function zoomTo(k) {
        const r = rect();
        zoomAt(k, r.left + r.width / 2, r.top + r.height / 2);
    }

    function zoomBy(factor) {
        zoomTo(view.k * factor);
    }

    function contentBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Eikekveik.el.world.querySelectorAll('.node').forEach(nodeEl => {
            const n = Eikekveik.State.findNode(parseInt(nodeEl.dataset.id, 10));
            if (!n) return;
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + nodeEl.offsetWidth);
            maxY = Math.max(maxY, n.y + nodeEl.offsetHeight);
        });
        return minX === Infinity ? null : { minX, minY, maxX, maxY };
    }

    // Vis heile kartet. Med onlyIfNeeded blir 100 % ståande dersom kartet
    // alt får plass der — då ser eit opna kart ut slik det vart laga.
    function showAll(opts = {}) {
        const b = contentBounds();
        const r = rect();
        // Eit lerret som ikkje er teikna (skjult fane, førehandsvising) har
        // storleik 0, og då ville kartet bli krympa til minste zoom.
        if (!b || !r.width || !r.height) return;

        if (opts.onlyIfNeeded && b.minX >= 0 && b.minY >= 0 && b.maxX <= r.width && b.maxY <= r.height) {
            set({ x: 0, y: 0, k: 1 });
            return;
        }

        const pad = 40;
        const bw = Math.max(1, b.maxX - b.minX);
        const bh = Math.max(1, b.maxY - b.minY);
        const k = clamp(Math.min((r.width - 2 * pad) / bw, (r.height - 2 * pad) / bh, 1));
        set({
            k,
            x: (r.width - bw * k) / 2 - b.minX * k,
            y: (r.height - bh * k) / 2 - b.minY * k
        });
    }

    function get() { return { ...view }; }

    // Utan grenser på zoomen: utskrifta treng å kunne krympe eit stort kart
    // meir enn knappane tillèt.
    function set(v) {
        view.x = v.x;
        view.y = v.y;
        view.k = v.k;
        apply();
    }

    function reset() { set({ x: 0, y: 0, k: 1 }); }

    // ── Ctrl + hjul (og knip på styreplate, som kjem som Ctrl + hjul) ──
    // Hjulet åleine rullar sida som før. Lerretet tek mesteparten av
    // skjermen, og ei side som sluttar å rulle når peikaren står over
    // lerretet, er ei side ein ikkje kjem seg ut av.
    function onWheel(e) {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        zoomAt(view.k * Math.exp(-delta * 0.0015), e.clientX, e.clientY);
    }

    // ── Dra i tom flate for å flytte, knip med to fingrar for å zoome ──
    function isBackground(target) {
        return target === Eikekveik.el.canvas || target === Eikekveik.el.world;
    }

    function onPointerDown(e) {
        if (!isBackground(e.target)) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (!pointers.size) suppressClick = false;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        Eikekveik.el.canvas.setPointerCapture(e.pointerId);
        startGesture();
    }

    function startGesture() {
        const pts = [...pointers.values()];
        if (pts.length >= 2) {
            const [a, b] = pts;
            gesture = {
                type: 'pinch',
                dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                k: view.k,
                anchor: toWorld((a.x + b.x) / 2, (a.y + b.y) / 2)
            };
            suppressClick = true;
        } else if (pts.length === 1) {
            gesture = { type: 'pan', startX: pts[0].x, startY: pts[0].y, viewX: view.x, viewY: view.y, moved: false };
        } else {
            gesture = null;
        }
        Eikekveik.el.canvas.classList.toggle('panning', !!gesture);
    }

    function onPointerMove(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (!gesture) return;

        if (gesture.type === 'pan') {
            const p = pointers.values().next().value;
            const dx = p.x - gesture.startX;
            const dy = p.y - gesture.startY;
            if (!gesture.moved && Math.hypot(dx, dy) < 3) return;
            gesture.moved = true;
            suppressClick = true;
            view.x = gesture.viewX + dx;
            view.y = gesture.viewY + dy;
            apply();
            return;
        }

        const [a, b] = [...pointers.values()];
        const r = rect();
        view.k = clamp(gesture.k * Math.hypot(a.x - b.x, a.y - b.y) / gesture.dist);
        view.x = (a.x + b.x) / 2 - r.left - gesture.anchor.x * view.k;
        view.y = (a.y + b.y) / 2 - r.top - gesture.anchor.y * view.k;
        apply();
    }

    function onPointerUp(e) {
        if (!pointers.delete(e.pointerId)) return;
        // Frå to fingrar til éin: start ei ny panorering frå der fingeren
        // står no, elles hoppar kartet til der panoreringa byrja.
        startGesture();
    }

    // Eit klikk som avsluttar ei panorering skal ikkje fjerne valet.
    function consumeClick() {
        const s = suppressClick;
        suppressClick = false;
        return s;
    }

    return {
        init, toWorld, zoomBy, zoomTo, showAll, contentBounds,
        get, set, reset, consumeClick
    };
})();
