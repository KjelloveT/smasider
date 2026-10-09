/* Felles veljar og redigering for elevlister og gruppesett. */
(function (root) {
    'use strict';
    const L = root.VyrdepilElevgrupper;
    function button(text, action, primary) {
        const b = Vy.el('button', 'vp-button' + (primary ? ' vp-button--primary' : ''), text);
        b.type = 'button'; b.addEventListener('click', action); return b;
    }
    function field(label, node) {
        const wrap = Vy.el('label', 'vp-field'); wrap.append(Vy.el('span', 'vp-label', label), node); return wrap;
    }
    function editor(input, afterSave) {
        const record = L.clone(input || { kind: 'roster', name: '', students: [], groups: [] });
        const dialog = Vy.createDialog(record.id ? 'Endre i elevbiblioteket' : 'Lagre i elevbiblioteket');
        dialog.classList.add('vp-library-dialog');
        dialog.append(Vy.el('p', 'vp-help', 'Appar som alt har henta lista, held på sin eigen kopi. Namn og grupper blir berre lagra i denne nettlesaren.'));
        const name = Vy.el('input', 'vp-input'); name.value = record.name; name.maxLength = 120;
        dialog.append(field('Namn på lista eller gruppesettet', name));
        const groupArea = Vy.el('div', 'vp-stack'), peopleArea = Vy.el('div', 'vp-stack');
        const error = Vy.el('p', 'vp-notice vp-notice--text vp-notice--error'); error.hidden = true; error.setAttribute('role', 'alert');
        const groupFields = new Map(), peopleFields = new Map();
        function draw() {
            groupArea.replaceChildren(); peopleArea.replaceChildren(); groupFields.clear(); peopleFields.clear();
            record.groups.forEach(g => {
                const row = Vy.el('div', 'vp-library-row'), input = Vy.el('input', 'vp-input');
                input.value = g.name; input.maxLength = 120; input.setAttribute('aria-label', 'Gruppenamn');
                input.addEventListener('input', () => {
                    g.name = input.value;
                    peopleArea.querySelectorAll('select').forEach(select => {
                        const option = [...select.options].find(option => option.value === g.id);
                        if (option) option.textContent = g.name || 'Utan namn';
                    });
                });
                groupFields.set(g.id, input);
                row.append(input, button('Fjern gruppe', () => { record.groups = record.groups.filter(x => x.id !== g.id); draw(); })); groupArea.append(row);
            });
            record.students.forEach(s => {
                const row = Vy.el('div', 'vp-library-row'), input = Vy.el('input', 'vp-input');
                input.value = s.name; input.maxLength = 120; input.setAttribute('aria-label', 'Elevnamn');
                input.addEventListener('input', () => { s.name = input.value; });
                const select = Vy.el('select', 'vp-input'); select.setAttribute('aria-label', 'Gruppe for ' + s.name);
                select.append(new Option('Ikkje i ei gruppe', ''));
                record.groups.forEach(g => select.append(new Option(g.name || 'Utan namn', g.id)));
                select.value = record.groups.find(g => g.memberIds.includes(s.id))?.id || '';
                select.addEventListener('change', () => {
                    record.groups.forEach(g => { g.memberIds = g.memberIds.filter(id => id !== s.id); });
                    record.groups.find(g => g.id === select.value)?.memberIds.push(s.id);
                });
                peopleFields.set(s.id, { input, select });
                row.append(input);
                if (record.kind === 'groups') row.append(select);
                row.append(button('Fjern elev', () => { record.students = record.students.filter(x => x.id !== s.id); record.groups.forEach(g => { g.memberIds = g.memberIds.filter(id => id !== s.id); }); draw(); }));
                peopleArea.append(row);
            });
        }
        if (record.kind === 'groups') {
            dialog.append(Vy.el('h3', '', 'Gruppene'), groupArea, button('Legg til gruppe', () => { record.groups.push({ id: Vy.uuid(), name: 'Gruppe ' + (record.groups.length + 1), memberIds: [] }); draw(); }));
        }
        dialog.append(Vy.el('h3', '', 'Elevane'), peopleArea);
        const paste = Vy.el('textarea', 'vp-input'); paste.rows = 3; paste.setAttribute('aria-label', 'Nye elevnamn, eitt per linje');
        dialog.append(field('Legg til elevar — eitt namn per linje', paste), button('Legg til namna', () => {
            const names = paste.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            try {
                if (record.students.length + names.length > 2000) throw new Error('Ei liste kan ha høgst 2 000 elevar.');
                record.students.push(...L.students(names)); paste.value = ''; draw();
            } catch (e) { error.textContent = e.message; error.hidden = false; }
        }));
        dialog.append(error, button('Lagre i biblioteket', () => {
            try {
                record.name = name.value;
                const saved = L.save(record); Vy.closeModal(dialog); Vy.toast('Lagra i elevbiblioteket'); if (afterSave) afterSave(saved);
            } catch (e) { error.textContent = e.message; error.hidden = false; }
        }, true));
        draw(); Vy.openModal(dialog); return dialog;
    }
    function open(options) {
        options = options || {};
        const dialog = Vy.createDialog('Elevbiblioteket'); dialog.classList.add('vp-library-dialog');
        dialog.append(Vy.el('p', 'vp-prose', 'Hent ei elevliste eller eit gruppesett. Du får ein kopi; endringar her endrar ikkje oppsett som alt er i bruk.'));
        const tools = Vy.el('div', 'vp-toolbar-group');
        const area = Vy.el('div', 'vp-stack');
        tools.append(button('Ny elevliste', () => editor(null, draw)), button('Nytt gruppesett', () => editor({ kind: 'groups', name: '', students: [], groups: [] }, draw)));
        dialog.append(tools, area);
        function draw() {
            area.replaceChildren();
            const list = L.sources().filter(item => options.kind !== 'groups' || item.kind === 'groups');
            if (!list.length) area.append(Vy.el('p', 'vp-help', 'Ingen lister funne. Lag ei liste her, eller lagre grupper frå Flokkdeilar eller Klassekart.'));
            list.forEach(item => {
                const card = Vy.el('section', 'vp-panel vp-panel--plain vp-panel--compact');
                card.append(Vy.el('h3', '', item.name), Vy.el('p', 'vp-help', item.source + ' · ' + item.students.length + ' elevar' + (item.kind === 'groups' ? ' · ' + item.groups.length + ' grupper' : '')));
                if (item.groups.length) card.append(Vy.el('p', '', item.groups.map(g => g.name + ' (' + g.memberIds.length + ')').join(', ')));
                const actions = Vy.el('div', 'vp-toolbar-group');
                if (options.onChoose) actions.append(button(item.kind === 'groups' && options.kind !== 'students' ? 'Bruk gruppene' : 'Bruk elevlista', () => { Vy.closeModal(dialog); options.onChoose(L.clone(item)); }, true));
                actions.append(button(item.saved ? 'Endre' : 'Kopier til biblioteket', () => editor(Object.assign(L.clone(item), { id: item.saved ? item.id : undefined }), draw)));
                if (item.saved) actions.append(button('Slett', async () => {
                    if (await Vy.confirmAction('Slett «' + item.name + '» frå biblioteket? Kopiar i verktøya blir verande.', 'Slett frå biblioteket', 'Slett')) { L.remove(item.id); draw(); }
                }));
                card.append(actions); area.append(card);
            });
        }
        draw(); Vy.openModal(dialog); return dialog;
    }
    root.VyrdepilElevgrupperUI = { open, editor, field, button };
})(window);
