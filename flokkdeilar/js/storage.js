/* ══════════════════════════════════════
   STORAGE.JS — VyrdepilStorage-wrapper for Flokkdeilar
   ══════════════════════════════════════ */

const FStorage = (() => {
    const GAME     = 'flokkdeilar';
    const LIST_KEY = 'lister';

    function getAll() {
        return VyrdepilStorage.getList(GAME, LIST_KEY);
    }

    function getById(id) {
        return getAll().find(l => l.id === id) || null;
    }

    function create(name, students, pinHash, pinSalt, extended) {
        const obj = {
            id:        crypto.randomUUID(),
            app:       'flokkdeilar',
            version:   1,
            name,
            date:      new Date().toISOString(),
            pinHash:   pinHash  || null,
            pinSalt:   pinSalt  || null,
            extended:  !!extended,
            students,
            relations: {}
        };
        VyrdepilStorage.saveListItem(GAME, LIST_KEY, obj);
        return obj;
    }

    function remove(id) {
        VyrdepilStorage.deleteListItem(GAME, LIST_KEY, id);
    }

    function update(id, changes) {
        return VyrdepilStorage.updateListItem(GAME, LIST_KEY, id, changes);
    }

    function setRelation(listId, idA, idB, value) {
        const list = getById(listId);
        if (!list) return;
        const key = [idA, idB].sort().join('|');
        const relations = { ...list.relations };
        if (value === 'ja') {
            delete relations[key];
        } else {
            relations[key] = value;
        }
        update(listId, { relations });
    }

    function getRelation(list, idA, idB) {
        const key = [idA, idB].sort().join('|');
        return list.relations[key] || 'ja';
    }

    /* Brukt av ui-index.js ved import av heil JSON */
    function importFull(obj) {
        const all = getAll();
        const existing = all.findIndex(l => l.id === obj.id);
        if (existing !== -1) {
            VyrdepilStorage.setList(GAME, LIST_KEY,
                all.map((l, i) => i === existing ? obj : l));
        } else {
            VyrdepilStorage.saveListItem(GAME, LIST_KEY, obj);
        }
    }

    return { getAll, getById, create, remove, update, setRelation, getRelation, importFull };
})();
