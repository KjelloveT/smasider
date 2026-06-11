/* ══════════════════════════════════════
   DRAW.JS — Fullskjerms teiknelag for touch/penn på tavla.
   Flyktig: teikningane blir aldri lagra, og lerretet blir tømt
   ved endring av vindaugsstorleik (dokumentert avgrensing).
   ══════════════════════════════════════ */

const Draw = (() => {
    const $ = (id) => document.getElementById(id);
    const WIDTHS = [3, 7, 14];
    let canvas = null, ctx = null;
    let active = false;
    let erasing = false;
    let color = '#d62828';
    let width = WIDTHS[1];
    let drawing = false;
    let lastX = 0, lastY = 0;

    function themeColors() {
        const cs = getComputedStyle(document.body);
        const vars = ['--accent', '--accent2', '--accent4', '--accent5'];
        const cols = vars.map(v => cs.getPropertyValue(v).trim()).filter(Boolean);
        return ['#d62828', '#1a1a1a'].concat(cols);
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function buildToolbar() {
        const bar = $('draw-toolbar');
        Dom.clear(bar);

        themeColors().forEach(col => {
            const btn = Dom.el('button', {
                class: 'dv-draw-color' + (col === color ? ' active' : ''),
                'aria-label': 'Pennefarge ' + col,
                onclick: () => { color = col; erasing = false; buildToolbar(); }
            });
            btn.style.background = col;
            bar.appendChild(btn);
        });

        bar.appendChild(Dom.el('span', { class: 'dv-draw-sep' }));

        WIDTHS.forEach(w => {
            const dot = Dom.el('span', { class: 'dv-draw-dot' });
            dot.style.width = dot.style.height = (w + 4) + 'px';
            bar.appendChild(Dom.el('button', {
                class: 'dv-draw-width' + (w === width && !erasing ? ' active' : ''),
                'aria-label': 'Pennetjukkleik ' + w,
                onclick: () => { width = w; erasing = false; buildToolbar(); }
            }, dot));
        });

        bar.appendChild(Dom.el('span', { class: 'dv-draw-sep' }));

        bar.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small' + (erasing ? ' active' : ''),
            'aria-label': 'Viskelêr',
            onclick: () => { erasing = !erasing; buildToolbar(); }
        }, Icons.create('eraser', 16)));

        bar.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small', 'aria-label': 'Tøm alle teikningar',
            onclick: clear
        }, Icons.create('trash-2', 16)));

        bar.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small', 'aria-label': 'Avslutt teiknemodus',
            onclick: () => setActive(false)
        }, Icons.create('x', 16), 'Ferdig'));
    }

    function clear() {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function setActive(on) {
        active = on;
        canvas.classList.toggle('dv-hidden', !on);
        $('draw-toolbar').classList.toggle('dv-hidden', !on);
        document.getElementById('btn-draw').classList.toggle('active', on);
        if (on) buildToolbar();
    }

    function isActive() { return active; }

    function pos(ev) {
        return { x: ev.clientX, y: ev.clientY };
    }

    function init() {
        canvas = $('draw-canvas');
        resize();
        window.addEventListener('resize', () => { resize(); }); // tømmer lerretet — medvite val

        canvas.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            canvas.setPointerCapture(ev.pointerId);
            drawing = true;
            const p = pos(ev);
            lastX = p.x; lastY = p.y;
            drawSegment(p.x, p.y); // prikk ved enkelt-trykk
        });
        canvas.addEventListener('pointermove', (ev) => {
            if (!drawing) return;
            const p = pos(ev);
            drawSegment(p.x, p.y);
        });
        const stop = () => { drawing = false; };
        canvas.addEventListener('pointerup', stop);
        canvas.addEventListener('pointercancel', stop);
    }

    function drawSegment(x, y) {
        ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = erasing ? width * 4 : width;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x; lastY = y;
    }

    return { init, setActive, isActive, clear };
})();
