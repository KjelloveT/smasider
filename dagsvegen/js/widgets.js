/* ══════════════════════════════════════
   WIDGETS.JS — Flytande verktøy: hjørneklokke (gjenbrukar TidvisClock),
   nedteljar med visuell sektor og fargeskift (ingen lyd i v1),
   stoppeklokke, trafikklys, ro-modus og hjernepause.
   ══════════════════════════════════════ */

const Widgets = (() => {
    const $ = (id) => document.getElementById(id);

    /* ---- felles: gjer ein widget dragbar via gripe-lina ---- */
    function makeDraggable(box, handle) {
        handle.style.touchAction = 'none';
        handle.addEventListener('pointerdown', (ev) => {
            if (ev.target.closest('button')) return;
            ev.preventDefault();
            const rect = box.getBoundingClientRect();
            const dx = ev.clientX - rect.left, dy = ev.clientY - rect.top;
            handle.setPointerCapture(ev.pointerId);
            function move(e) {
                const x = Math.min(window.innerWidth - 60, Math.max(0, e.clientX - dx));
                const y = Math.min(window.innerHeight - 40, Math.max(0, e.clientY - dy));
                box.style.left = x + 'px';
                box.style.top = y + 'px';
                box.style.right = 'auto';
                box.style.bottom = 'auto';
            }
            function up() {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
            }
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
        });
    }

    function widgetFrame(id, title, onClose) {
        const box = $(id);
        const bar = Dom.el('div', { class: 'dv-widget-bar' },
            Icons.create('grip', 14),
            Dom.el('span', { class: 'dv-widget-title', text: title }),
            Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Lukk ' + title.toLowerCase(), onclick: onClose },
                Icons.create('x', 16)));
        box.appendChild(bar);
        makeDraggable(box, bar);
        return box;
    }

    /* ════ Hjørneklokke (TidvisClock) ════ */
    let clockApi = null;
    let clockDigital = null;

    function initClock() {
        const box = $('clock-widget');
        box.classList.add('dv-clock');
        clockApi = TidvisClock.analog({ size: 110, draggable: false });
        clockDigital = Dom.el('div', { class: 'dv-clock-digital' });
        box.appendChild(clockApi.el);
        box.appendChild(clockDigital);
        makeDraggable(box, box);
        Engine.onTick((now) => {
            clockApi.setTime(now.getHours() % 12 || 12, now.getMinutes());
            clockDigital.textContent = String(now.getHours()).padStart(2, '0') + ':'
                + String(now.getMinutes()).padStart(2, '0');
        });
        applyClockVisibility();
    }

    function applyClockVisibility() {
        $('clock-widget').classList.toggle('dv-hidden', !App.getSettings().showClock);
    }

    /* ════ Nedteljar ════ */
    const cd = { totalSec: 300, remainingSec: 300, running: false, endMs: 0 };
    let cdCircle = null, cdDigits = null, cdStartBtn = null;

    function initCountdown() {
        const box = widgetFrame('countdown-widget', 'Nedteljar', () => toggle('countdown-widget'));
        cdDigits = Dom.el('div', { class: 'dv-cd-digits', text: '05:00' });
        cdCircle = Dom.el('div', { class: 'dv-cd-circle', 'aria-hidden': 'true' }, cdDigits);

        const presets = Dom.el('div', { class: 'dv-cd-presets' });
        [1, 2, 5, 10, 15].forEach(min => {
            presets.appendChild(Dom.el('button', {
                class: 'btn dv-btn-small', text: min + ' min',
                onclick: () => { cd.totalSec = cd.remainingSec = min * 60; cd.running = false; updateCountdown(); }
            }));
        });
        presets.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small', 'aria-label': 'Legg til eitt minutt',
            onclick: () => {
                cd.totalSec += 60;
                cd.remainingSec += 60;
                if (cd.running) cd.endMs += 60000;
                updateCountdown();
            }
        }, Icons.create('plus', 14), '1 min'));

        cdStartBtn = Dom.el('button', { class: 'btn dv-btn-small', 'aria-label': 'Start eller pause nedteljinga',
            onclick: () => {
                if (cd.running) {
                    cd.remainingSec = Math.max(0, (cd.endMs - Date.now()) / 1000);
                    cd.running = false;
                } else if (cd.remainingSec > 0) {
                    cd.endMs = Date.now() + cd.remainingSec * 1000;
                    cd.running = true;
                }
                updateCountdown();
            }
        }, Icons.create('play', 16));

        const controls = Dom.el('div', { class: 'dv-cd-controls' },
            cdStartBtn,
            Dom.el('button', { class: 'btn dv-btn-small', 'aria-label': 'Nullstill nedteljinga',
                onclick: () => { cd.running = false; cd.remainingSec = cd.totalSec; box.classList.remove('dv-blink'); updateCountdown(); }
            }, Icons.create('rotate-ccw', 16)));

        box.appendChild(cdCircle);
        box.appendChild(controls);
        box.appendChild(presets);

        setInterval(() => { if (cd.running) updateCountdown(); }, 250);
        updateCountdown();
    }

    function updateCountdown() {
        const box = $('countdown-widget');
        if (cd.running) {
            cd.remainingSec = Math.max(0, (cd.endMs - Date.now()) / 1000);
            if (cd.remainingSec <= 0) {
                cd.running = false;
                box.classList.add('dv-blink'); // visuell alarm — ingen lyd
                setTimeout(() => box.classList.remove('dv-blink'), 12000);
            }
        }
        cdDigits.textContent = State.fmtMMSS(cd.remainingSec);
        const frac = cd.totalSec > 0 ? cd.remainingSec / cd.totalSec : 0;
        const color = (frac >= 0.5) ? '#2e9e4f' : (frac >= 0.25 || cd.remainingSec >= 60) ? '#e0a800' : '#d62828';
        cdCircle.style.background =
            'conic-gradient(' + color + ' ' + (frac * 360) + 'deg, var(--bg) ' + (frac * 360) + 'deg)';
        cdCircle.classList.toggle('is-low', frac < 0.25 && cd.remainingSec < 60 && cd.remainingSec > 0);
        Dom.clear(cdStartBtn);
        cdStartBtn.appendChild(Icons.create(cd.running ? 'pause' : 'play', 16));
    }

    /* ════ Stoppeklokke ════ */
    const sw = { running: false, startMs: 0, accMs: 0, laps: [] };
    let swDigits = null, swLaps = null, swStartBtn = null;

    function initStopwatch() {
        const box = widgetFrame('stopwatch-widget', 'Stoppeklokke', () => toggle('stopwatch-widget'));
        swDigits = Dom.el('div', { class: 'dv-sw-digits', text: '00:00' });
        swLaps = Dom.el('ol', { class: 'dv-sw-laps' });
        swStartBtn = Dom.el('button', { class: 'btn dv-btn-small', 'aria-label': 'Start eller stopp stoppeklokka',
            onclick: () => {
                if (sw.running) { sw.accMs += Date.now() - sw.startMs; sw.running = false; }
                else { sw.startMs = Date.now(); sw.running = true; }
                updateStopwatch();
            }
        }, Icons.create('play', 16));

        box.appendChild(swDigits);
        box.appendChild(Dom.el('div', { class: 'dv-cd-controls' },
            swStartBtn,
            Dom.el('button', { class: 'btn dv-btn-small', text: 'Runde', 'aria-label': 'Noter rundetid',
                onclick: () => {
                    if (!sw.running && sw.accMs === 0) return;
                    sw.laps.unshift(currentMs());
                    sw.laps = sw.laps.slice(0, 8);
                    renderLaps();
                }
            }),
            Dom.el('button', { class: 'btn dv-btn-small', 'aria-label': 'Nullstill stoppeklokka',
                onclick: () => { sw.running = false; sw.accMs = 0; sw.laps = []; renderLaps(); updateStopwatch(); }
            }, Icons.create('rotate-ccw', 16))));
        box.appendChild(swLaps);

        setInterval(() => { if (sw.running) updateStopwatch(); }, 250);
    }

    function currentMs() { return sw.accMs + (sw.running ? Date.now() - sw.startMs : 0); }

    function updateStopwatch() {
        swDigits.textContent = State.fmtMMSS(currentMs() / 1000);
        Dom.clear(swStartBtn);
        swStartBtn.appendChild(Icons.create(sw.running ? 'pause' : 'play', 16));
    }

    function renderLaps() {
        Dom.clear(swLaps);
        sw.laps.forEach(ms => swLaps.appendChild(Dom.el('li', { text: State.fmtMMSS(ms / 1000) })));
    }

    /* ════ Trafikklys ════ */
    const LIGHTS = ['green', 'yellow', 'red'];
    const LIGHT_LABELS = { green: 'Grønt: samarbeid er lov', yellow: 'Gult: kviskrestemme', red: 'Raudt: heilt stille' };

    function initTraffic() {
        const box = widgetFrame('traffic-widget', 'Trafikklys', () => toggle('traffic-widget'));
        const lamp = Dom.el('button', { class: 'dv-traffic', 'aria-label': 'Byt trafikklys' },
            Dom.el('span', { class: 'dv-lamp dv-lamp-red' }),
            Dom.el('span', { class: 'dv-lamp dv-lamp-yellow' }),
            Dom.el('span', { class: 'dv-lamp dv-lamp-green' }));
        const label = Dom.el('div', { class: 'dv-traffic-label' });
        lamp.addEventListener('click', () => {
            const cur = App.session().trafficLight;
            const next = LIGHTS[(LIGHTS.indexOf(cur) + 1) % LIGHTS.length];
            App.session().trafficLight = next;
            App.saveSession();
            applyTraffic();
        });
        box.appendChild(lamp);
        box.appendChild(label);
        box._label = label;
        applyTraffic();
    }

    function applyTraffic() {
        const box = $('traffic-widget');
        const state = App.session().trafficLight;
        box.dataset.light = state;
        if (box._label) box._label.textContent = LIGHT_LABELS[state] || '';
    }

    /* ════ Ro-modus ════ */
    function openCalm() { $('calm-overlay').classList.add('open'); }
    function closeCalm() { $('calm-overlay').classList.remove('open'); }
    function calmIsOpen() { return $('calm-overlay').classList.contains('open'); }

    /* ════ Hjernepause ════ */
    function openBrainBreak() {
        rollBrainBreak();
        $('modal-break').classList.add('open');
    }

    function rollBrainBreak() {
        const breaks = Store.getBreaks();
        const text = breaks.length
            ? breaks[Math.floor(Math.random() * breaks.length)].text
            : 'Ingen hjernepausar lagra — legg til i innstillingane.';
        $('break-text').textContent = text;
    }

    /* ---- visning av widgetar ---- */
    function toggle(id) {
        const box = $(id);
        box.classList.toggle('dv-hidden');
        return !box.classList.contains('dv-hidden');
    }

    function init() {
        initClock();
        initCountdown();
        initStopwatch();
        initTraffic();
        $('calm-overlay').addEventListener('click', closeCalm);
        $('btn-break-new').addEventListener('click', rollBrainBreak);
    }

    return { init, toggle, openCalm, closeCalm, calmIsOpen, openBrainBreak, applyClockVisibility, applyTraffic };
})();
