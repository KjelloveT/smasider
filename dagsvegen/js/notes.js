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
    function notesInFlow() { return window.matchMedia('(max-width: 900px)').matches; }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => App.saveSession(), 400);
    }

    function topLimit() {
        const header = document.querySelector('.vp-migrated-header');
        const intro = document.querySelector('.vp-migrated-intro');
        const topbar = $('topbar');
        const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
        const introBottom = intro ? intro.getBoundingClientRect().bottom : 0;
        const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : 0;
        return Math.max(12, headerBottom + 12, introBottom + 16, topbarBottom + 12);
    }

    function noteSize() {
        const width = window.innerWidth <= 480
            ? Math.min(280, window.innerWidth - 24)
            : Math.min(280, Math.max(180, window.innerWidth * 0.22));
        return { width, height: width < 258 ? 188 : 154 };
    }

    function findNotePosition() {
        const margin = 12;
        const gap = 16;
        const { width, height } = noteSize();
        const maxTop = Math.max(margin, window.innerHeight - height - margin);
        const top = Math.min(topLimit(), maxTop);
        const cols = Math.max(1, Math.floor((window.innerWidth - margin * 2 + gap) / (width + gap)));
        const rows = Math.max(1, Math.floor((maxTop - top + gap) / (height + gap)));
        const slots = cols * rows;
        const existing = Array.from($('notes-layer').querySelectorAll('.dv-note'))
            .map(box => box.getBoundingClientRect());

        for (let offset = 0; offset < slots; offset++) {
            const index = (notes().length + offset) % slots;
            const left = margin + (index % cols) * (width + gap);
            const y = top + Math.floor(index / cols) * (height + gap);
            const free = existing.every(rect =>
                left + width + gap <= rect.left || left >= rect.right + gap ||
                y + height + gap <= rect.top || y >= rect.bottom + gap);
            if (free) {
                return { x: left / window.innerWidth * 100, y: y / window.innerHeight * 100 };
            }
        }

        const left = Math.max(margin, window.innerWidth - width - margin);
        const y = Math.max(top, window.innerHeight - height - margin);
        return { x: left / window.innerWidth * 100, y: y / window.innerHeight * 100 };
    }

    function fitNote(note, box) {
        if (notesInFlow()) return false;
        const margin = 12;
        const maxWidth = Math.max(150, window.innerWidth - margin * 2);
        const maxHeight = Math.max(96, window.innerHeight - topLimit() - margin);
        if (note.w) {
            note.w = Math.min(note.w, maxWidth);
            box.style.width = note.w + 'px';
        }
        if (note.h) {
            note.h = Math.min(note.h, maxHeight);
            box.style.height = note.h + 'px';
        }
        const rect = box.getBoundingClientRect();
        const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - rect.width - margin));
        const minTop = Math.min(topLimit(), Math.max(margin, window.innerHeight - rect.height - margin));
        const y = Math.min(Math.max(minTop, rect.top), Math.max(minTop, window.innerHeight - rect.height - margin));
        const xPercent = Number((left / window.innerWidth * 100).toFixed(2));
        const yPercent = Number((y / window.innerHeight * 100).toFixed(2));
        const changed = note.x !== xPercent || note.y !== yPercent;
        note.x = xPercent;
        note.y = yPercent;
        box.style.left = xPercent + '%';
        box.style.top = yPercent + '%';
        return changed;
    }

    function addNote() {
        const pos = notesInFlow()
            ? { x: 12, y: 12 + notes().length * ((noteSize().height + 16) / window.innerHeight * 100) }
            : findNotePosition();
        notes().push({
            id: State.uid('n'),
            style: 'plain',
            text: '',
            x: pos.x,
            y: pos.y
        });
        App.saveSession();
        render();
        const ta = $('notes-layer').querySelector('.dv-note:last-child textarea');
        if (ta) ta.focus();
    }

    function render() {
        const layer = $('notes-layer');
        Dom.clear(layer);
        let changed = false;
        notes().forEach(note => {
            const box = buildNote(note);
            layer.appendChild(box);
            changed = fitNote(note, box) || changed;
        });
        if (changed) scheduleSave();
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

        const box = Dom.el('div', { class: 'dv-note dv-note-' + note.style, 'data-note-id': note.id }, bar, ta);
        box.style.left = note.x + '%';
        box.style.top = note.y + '%';
        if (note.w) box.style.width = note.w + 'px';
        if (note.h) box.style.height = note.h + 'px';

        /* resize-handtak nedst til høgre (fungerer med peikar og touch) */
        const grip = Dom.el('div', { class: 'dv-note-resize', 'aria-hidden': 'true' }, Icons.create('grip', 12));
        grip.addEventListener('pointerdown', (ev) => {
            if (notesInFlow()) return;
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
        bar.style.touchAction = notesInFlow() ? 'auto' : 'none';
        bar.addEventListener('pointerdown', (ev) => {
            if (notesInFlow()) return;
            if (ev.target.closest('button')) return;
            ev.preventDefault();
            const rect = box.getBoundingClientRect();
            const dx = ev.clientX - rect.left, dy = ev.clientY - rect.top;
            bar.setPointerCapture(ev.pointerId);
            function move(e) {
                const margin = 12;
                const left = Math.min(Math.max(margin, e.clientX - dx), Math.max(margin, window.innerWidth - box.offsetWidth - margin));
                const minTop = Math.min(topLimit(), Math.max(margin, window.innerHeight - box.offsetHeight - margin));
                const top = Math.min(Math.max(minTop, e.clientY - dy), Math.max(minTop, window.innerHeight - box.offsetHeight - margin));
                note.x = Number((left / window.innerWidth * 100).toFixed(2));
                note.y = Number((top / window.innerHeight * 100).toFixed(2));
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

    function init() {
        render();
        window.addEventListener('resize', () => {
            const boxes = Array.from($('notes-layer').querySelectorAll('.dv-note'));
            const inFlow = notesInFlow();
            boxes.forEach(box => {
                const bar = box.querySelector('.dv-note-bar');
                if (bar) bar.style.touchAction = inFlow ? 'auto' : 'none';
            });
            if (inFlow) return;
            let changed = false;
            notes().forEach(note => {
                const box = boxes.find(element => element.dataset.noteId === note.id);
                if (box) changed = fitNote(note, box) || changed;
            });
            if (changed) scheduleSave();
        });
    }

    return { init, addNote, render };
})();
