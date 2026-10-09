/* Felles elevbibliotek. Bibliotek og appane brukar sjølvstendige kopiar.
 * Lagrar aldri relasjonar, PIN-kodar eller sitjeplassering. */
(function (root) {
    'use strict';
    const GAME = 'elevbibliotek', VERSION = 1;
    const clone = value => JSON.parse(JSON.stringify(value));
    function students(list, prefix) {
        if (!Array.isArray(list) || list.length > 2000) throw new Error('Elevlista kan ha høgst 2 000 elevar.');
        const seen = new Set();
        return list.map((raw, i) => {
            const id = String(raw?.id || (prefix ? prefix + ':' + i : Vy.uuid()));
            const name = String(typeof raw === 'string' ? raw : raw?.name || '').trim();
            if (!name || name.length > 120 || id.length > 200 || seen.has(id)) throw new Error('Kvar elev må ha namn og ein eigen ID. Namnet kan ha høgst 120 teikn.');
            seen.add(id); return { id, name };
        });
    }
    function validate(input) {
        if (!input || !['roster', 'groups'].includes(input.kind)) throw new Error('Vel elevliste eller gruppesett.');
        const name = String(input.name || '').trim();
        if (!name || name.length > 120) throw new Error('Gje lista eit namn på høgst 120 teikn.');
        const people = students(input.students || []);
        const allowed = new Set(people.map(p => p.id)), used = new Set(), groupIds = new Set();
        if ((input.groups || []).length > 128) throw new Error('Gruppesettet kan ha høgst 128 grupper.');
        const groups = input.kind === 'groups' ? (input.groups || []).map(g => {
            const id = String(g.id || Vy.uuid()), label = String(g.name || '').trim();
            if (!label || label.length > 120 || groupIds.has(id)) throw new Error('Kvar gruppe må ha eit namn og ein eigen ID.');
            groupIds.add(id);
            if (!Array.isArray(g.memberIds) || !g.memberIds.length) throw new Error('Kvar gruppe må ha minst éin elev.');
            const memberIds = g.memberIds.map(String);
            memberIds.forEach(id => { if (!allowed.has(id) || used.has(id)) throw new Error('Ein elev kan berre vere i éi gruppe i same gruppesett.'); used.add(id); });
            return { id, name: label, memberIds };
        }) : [];
        if (input.kind === 'groups' && !groups.length) throw new Error('Legg til minst éi gruppe.');
        return { app: GAME, version: VERSION, id: String(input.id || Vy.uuid()), revision: Number.isInteger(input.revision) ? input.revision : 0, kind: input.kind, name, students: people, groups };
    }
    function getAll() {
        const state = VyrdepilStorage.getGameState(GAME);
        if (!state || state.version !== VERSION || !Array.isArray(state.items)) return [];
        return state.items.flatMap(item => { try { return [validate(item)]; } catch (e) { return []; } });
    }
    function save(input) {
        const entry = validate(input), all = getAll(), index = all.findIndex(item => item.id === entry.id);
        entry.revision = index >= 0 ? all[index].revision + 1 : 1;
        if (index >= 0) all[index] = entry; else all.push(entry);
        VyrdepilStorage.setGameState(GAME, { version: VERSION, items: all });
        return clone(entry);
    }
    function saveRoster(name, list, id) { return save({ id, kind: 'roster', name, students: students(list) }); }
    function saveGroups(name, groups, id) {
        const all = new Map(), entries = groups.map(group => {
            const members = students(group.members || []);
            members.forEach(s => all.set(s.id, s));
            return { id: group.id || Vy.uuid(), name: group.name, memberIds: members.map(s => s.id) };
        });
        return save({ id, kind: 'groups', name, students: [...all.values()], groups: entries });
    }
    function remove(id) {
        VyrdepilStorage.setGameState(GAME, { version: VERSION, items: getAll().filter(item => item.id !== id) });
    }
    function sources() {
        const entries = getAll().map(item => Object.assign(item, { source: 'Elevbiblioteket', saved: true }));
        function legacy(name, people, id, source) {
            try {
                const entry = validate({ id, kind: 'roster', name: name || 'Utan namn', students: students(people || [], id) });
                if (entry.students.length) entries.push(Object.assign(entry, { source, saved: false }));
            } catch (e) { /* Ei skadd gammal liste skal ikkje sperre biblioteket. */ }
        }
        VyrdepilStorage.getList('flokkdeilar', 'lister').forEach(item => legacy(item.name, item.students, 'flokkdeilar:' + item.id, 'Flokkdeilar'));
        VyrdepilStorage.getList('klassekart', 'oppsett').forEach(item => legacy(item.name, item.data?.students, 'klassekart:' + item.id, 'Klassekart'));
        const state = VyrdepilStorage.getGameState('klassekart');
        (state?.tabs || []).forEach((tab, i) => legacy(tab.name, tab.data?.students, 'klassekart:fane:' + (tab.id || i), 'Klassekart — open fane'));
        return clone(entries);
    }
    root.VyrdepilElevgrupper = { students, validate, getAll, sources, save, saveRoster, saveGroups, remove, clone };
})(window);
