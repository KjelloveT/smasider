/* Elevbiblioteket kopierer namn; grupper blir valde uttrykkeleg av læraren. */
(function () {
    'use strict';
    const L = VyrdepilElevgrupper, U = VyrdepilElevgrupperUI, el = Vy.el;
    function pupils() { return App.getStudentList().map(s => ({ id: s.id, name: s.name })); }
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('btn-library-open').addEventListener('click', () => U.open({
            kind: 'students', onChoose: async item => {
                if (pupils().length && !await Vy.confirmAction('Byt elevlista med «' + item.name + '»? Pultar for elevar som ikkje er i den nye lista blir tekne bort. Du kan angre i Klassekart.', 'Hent elevliste', 'Hent lista')) return;
                const state = Storage.captureState();
                const byId = new Map(item.students.map(s => [s.id, s]));
                state.students = item.students.map(s => ({ id: s.id, name: s.name, color: '#ffffff' }));
                state.desks = state.desks.filter(d => byId.has(d.id)).map(d => Object.assign(d, { name: byId.get(d.id).name }));
                Storage.restoreState(state); Vy.toast('Elevlista er henta');
            }
        }));
        document.getElementById('btn-library-save').addEventListener('click', () => U.editor({ kind: 'roster', name: 'Klassekart — elevliste', students: pupils(), groups: [] }));
        document.getElementById('btn-library-groups').addEventListener('click', () => {
            const students = pupils(), groups = [], dialog = Vy.createDialog('Vel elevar til namngjevne grupper');
            dialog.classList.add('vp-library-dialog');
            dialog.append(el('p', '', 'Kryss av elevane som skal vere i ei gruppe. Pultplasseringa avgjer ingen grupper. Kvar elev kan vere i éi gruppe i dette gruppesettet.'));
            const groupName = el('input', 'vp-input'); groupName.maxLength = 120; groupName.value = 'Gruppe 1';
            const choices = el('div'), preview = el('div'), error = el('p'); error.setAttribute('role', 'alert');
            const selected = new Map();
            function draw() {
                choices.replaceChildren(); selected.clear();
                const used = new Set(groups.flatMap(g => g.memberIds));
                students.filter(s => !used.has(s.id)).forEach(s => {
                    const label = el('label', 'vp-choice'), input = el('input'); input.type = 'checkbox';
                    input.addEventListener('change', () => selected.set(s.id, input.checked));
                    label.append(input, el('span', '', s.name)); choices.append(label);
                });
                preview.replaceChildren(...groups.map(g => el('p', '', g.name + ': ' + g.memberIds.map(id => students.find(s => s.id === id).name).join(', '))));
            }
            dialog.append(U.field('Gruppenamn', groupName), choices, U.button('Legg til den valde gruppa', () => {
                const memberIds = [...selected].filter(([, checked]) => checked).map(([id]) => id);
                if (!memberIds.length || !groupName.value.trim()) { error.textContent = 'Skriv eit gruppenamn og vel minst éin elev.'; return; }
                groups.push({ id: Vy.uuid(), name: groupName.value.trim(), memberIds });
                groupName.value = 'Gruppe ' + (groups.length + 1); error.textContent = ''; draw();
            }), preview, error, U.button('Namngje og lagre gruppesettet', () => {
                if (!groups.length) { error.textContent = 'Legg til minst éi gruppe fyrst.'; return; }
                Vy.closeModal(dialog); U.editor({ kind: 'groups', name: 'Klassekart — grupper', students: L.clone(students), groups });
            }, true));
            draw(); Vy.openModal(dialog);
        });
    });
})();
