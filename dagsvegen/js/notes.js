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

        const bar = Dom.el('div', { class: 'dv-note-bar' },
            Icons.create('grip', 14),
            styleBtns,
            Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Slett tekstboksen',
                onclick: () => {
                    const idx = notes().findIndex(n => n.id === note.id);
                    if (idx >= 0) { notes().splice(idx, 1); App.saveSession(); render(); }
                }
            }, Icons.create('x', 14)));

        const box = Dom.el('div', { class: 'dv-note dv-note-' + note.style }, bar, ta);
        box.style.left = note.x + '%';
        box.style.top = note.y + '%';

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
