/* ══════════════════════════════════════
   NOTES.JS — Plasserbare tekstboksar på skjermen.
   Tre stilar: vanleg boks, huskelapp (post-it med "handskrift")
   og bursdag (festbanner). Posisjon i prosent av vindauget,
   tekst lagra i økt-tilstanden via Store.
   ══════════════════════════════════════ */

const Notes = (() => {
    const $ = (id) => document.getElementById(id);
    const STYLES = [
        { id: 'plain', label: 'Vanleg' },
        { id: 'huskelapp', label: 'Huskelapp' },
        { id: 'bursdag', label: 'Bursdag' }
    ];
    let saveTimer = null;

    function notes() { return App.session().notes; }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => App.saveSession(), 400);
    }

    function addNote() {
        notes().push({
            id: State.uid('n'),
            style: 'plain',
            text: '',
            x: 35 + Math.random() * 10,
            y: 30 + Math.random() * 10
        });
        App.saveSession();
        render();
        const ta = $('notes-layer').querySelector('.dv-note:last-child textarea');
        if (ta) ta.focus();
    }

    function render() {
        const layer = $('notes-layer');
        Dom.clear(layer);
        notes().forEach(note => layer.appendChild(buildNote(note)));
    }

    function buildNote(note) {
        const ta = Dom.el('textarea', {
            class: 'dv-note-text',
            'aria-label': 'Tekst i tekstboksen',
            placeholder: note.style === 'bursdag' ? 'Kven feirar vi?' : 'Skriv her …',
            rows: '3'
        });
        ta.value = note.text;
        if (note.fs) ta.style.fontSize = note.fs + 'rem';
        ta.addEventListener('input', () => { note.text = ta.value; scheduleSave(); });

        const styleBtns = Dom.el('span', { class: 'dv-note-styles' });
        STYLES.forEach(s => {
            styleBtns.appendChild(Dom.el('button', {
                class: 'dv-note-style-btn' + (note.style === s.id ? ' active' : ''),
                'aria-label': 'Stil: ' + s.label,
                title: s.label,
                text: s.id === 'plain' ? 'A' : s.id === 'huskelapp' ? '📌' : '🎉',
                onclick: () => { note.style = s.id; App.saveSession(); render(); }
            }));
        });

        /* tekststorleik opp/ned */
        function bumpFont(delta) {
            note.fs = Math.min(3, Math.max(0.7, (note.fs || 1) + delta));
            ta.style.fontSize = note.fs + 'rem';
            scheduleSave();
        }
        const fontBtns = Dom.el('span', { class: 'dv-note-styles' },
            Dom.el('button', { class: 'dv-note-fs-btn', 'aria-label': 'Mindre tekst', title: 'Mindre tekst',
                text: 'A−', onclick: () => bumpFont(-0.15) }),
            Dom.el('button', { class: 'dv-note-fs-btn', 'aria-label': 'Større tekst', title: 'Større tekst',
                text: 'A+', onclick: () => bumpFont(0.15) }));

        const bar = Dom.el('div', { class: 'dv-note-bar' },
            Icons.create('grip', 14),
            styleBtns,
            fontBtns,
            Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Slett tekstboksen',
                onclick: () => {
                    const idx = notes().findIndex(n => n.id === note.id);
                    if (idx >= 0) { notes().splice(idx, 1); App.saveSession(); render(); }
                }
            }, Icons.create('x', 14)));

        const box = Dom.el('div', { class: 'dv-note dv-note-' + note.style }, bar, ta);
        box.style.left = note.x + '%';
        box.style.top = note.y + '%';
        if (note.w) box.style.width = note.w + 'px';
        if (note.h) box.style.height = note.h + 'px';

        /* resize-handtak nedst til høgre (fungerer med peikar og touch) */
        const grip = Dom.el('div', { class: 'dv-note-resize', 'aria-hidden': 'true' }, Icons.create('grip', 12));
        grip.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const startW = box.offsetWidth, startH = box.offsetHeight;
            const sx = ev.clientX, sy = ev.clientY;
            grip.setPointerCapture(ev.pointerId);
            function move(e) {
                note.w = Math.min(window.innerWidth * 0.9, Math.max(150, startW + e.clientX - sx));
                note.h = Math.min(window.innerHeight * 0.85, Math.max(96, startH + e.clientY - sy));
                box.style.width = note.w + 'px';
                box.style.height = note.h + 'px';
            }
            function up() {
                grip.removeEventListener('pointermove', move);
                grip.removeEventListener('pointerup', up);
                scheduleSave();
            }
            grip.addEventListener('pointermove', move);
            grip.addEventListener('pointerup', up);
        });
        box.appendChild(grip);

        /* dra i topplinja */
        bar.style.touchAction = 'none';
        bar.addEventListener('pointerdown', (ev) => {
            if (ev.target.closest('button')) return;
            ev.preventDefault();
            const rect = box.getBoundingClientRect();
            const dx = ev.clientX - rect.left, dy = ev.clientY - rect.top;
            bar.setPointerCapture(ev.pointerId);
            function move(e) {
                note.x = Math.min(95, Math.max(0, (e.clientX - dx) / window.innerWidth * 100));
                note.y = Math.min(95, Math.max(0, (e.clientY - dy) / window.innerHeight * 100));
                box.style.left = note.x + '%';
                box.style.top = note.y + '%';
            }
            function up() {
                bar.removeEventListener('pointermove', move);
                bar.removeEventListener('pointerup', up);
                scheduleSave();
            }
            bar.addEventListener('pointermove', move);
            bar.addEventListener('pointerup', up);
        });

        return box;
    }

    function init() { render(); }

    return { init, addNote, render };
})();
