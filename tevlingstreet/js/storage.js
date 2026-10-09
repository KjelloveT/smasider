/* Tevlingstreet — lagring og avgrensa, validerte JSON-importar. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core;
    const GAME = 'tevlingstreet', KEY = 'turneringar';
    function all() { return VyrdepilStorage.getList(GAME, KEY); }
    function get(id) { return all().find(t => t.id === id) || null; }
    function save(t) {
        t.revision++;
        if (get(t.id)) VyrdepilStorage.updateListItem(GAME, KEY, t.id, t);
        else VyrdepilStorage.saveListItem(GAME, KEY, t);
        VyrdepilStorage.setGameState(GAME, { lastId: t.id });
    }
    function remove(id) { VyrdepilStorage.deleteListItem(GAME, KEY, id); }
    function exportData(t) { const data = C.copy(t); delete data.undo; return data; }
    function importData(raw) {
        if (!raw || raw.app !== GAME || raw.version !== 1 || !Array.isArray(raw.participants) || !raw.settings || !Array.isArray(raw.matches) || raw.matches.length > 8192 || !Array.isArray(raw.rounds) || raw.rounds.length > 2000) throw new Error('Dette er ikkje ei gyldig Tevlingstreet-fil i versjon 1.');
        const people = raw.participants.map(p => {
            if (!p || typeof p.id !== 'string' || p.id.length > 200 || typeof p.name !== 'string' || p.name.length > 120 || (p.members && !Array.isArray(p.members))) throw new Error('Ugyldig deltakar.');
            return { id: p.id, name: p.name, members: VyrdepilElevgrupper.students(p.members || []) };
        });
        const t = C.create(people, {
            format: raw.settings.format, win: raw.settings.win, draw: raw.settings.draw, loss: raw.settings.loss,
            poolCount: raw.settings.poolCount, advance: raw.settings.advance, rounds: raw.settings.rounds,
            bronze: !!raw.settings.bronze, venues: raw.settings.venues
        }, String(raw.title || 'Importert turnering').slice(0, 120));
        if (!Array.isArray(raw.order) || raw.order.length !== people.length || new Set(raw.order).size !== people.length || raw.order.some(id => !C.participant(t, id))) throw new Error('Trekninga er ugyldig.');
        t.order = raw.order.slice(); t.seed = Number.isInteger(raw.seed) ? raw.seed : t.seed;
        t.setup = Number.isInteger(raw.setup) && raw.setup > 0 ? raw.setup : 1;
        function sameRef(a, b) {
            if (!a || !b) return a === b;
            return a.kind === b.kind && (a.kind === 'qualifier' ? a.pool === b.pool && a.place === b.place : a.id === b.id);
        }
        function results(expected) {
            expected.forEach(m => {
                const source = raw.matches[m.id - 1];
                if (!source || source.id !== m.id || source.stage !== m.stage || source.round !== m.round || source.pool !== m.pool || !sameRef(source.a, m.a) || !sameRef(source.b, m.b) || ![null, 'a', 'b', 'draw'].includes(source.result)) throw new Error('Kampoppsettet stemmer ikkje med turneringsreglane.');
                if (source.result && !C.ready(t, m)) throw new Error('Ein kamp har resultat før motstandarane er klare.');
                m.result = source.result;
            });
        }
        if (t.settings.format === 'swiss') {
            if (!raw.rounds.length || raw.rounds.length > t.settings.rounds) throw new Error('Fila har eit ugyldig rundetal.');
            raw.rounds.forEach(r => {
                if (r.stage !== 'swiss' || !Array.isArray(r.matches) || !Array.isArray(r.pauses) || r.pauses.length > 1) throw new Error('Ugyldig sveitserrunde.');
                const pairs = r.matches.map(id => {
                    const m = raw.matches[id - 1];
                    if (!m || m.a?.kind !== 'participant' || m.b?.kind !== 'participant') throw new Error('Ugyldig motstandar.');
                    return [m.a.id, m.b.id];
                });
                const before = t.matches.length;
                TS.Swiss.confirm(t, { pairs, bye: r.pauses[0] || null }, false);
                results(t.matches.slice(before));
            });
        } else {
            TS.Engine.generate(t);
            results(t.matches.filter(m => !['cup', 'bronze'].includes(m.stage)));
            if (t.settings.format === 'pools') {
                if (raw.qualification && typeof raw.qualification !== 'object') throw new Error('Ugyldig kvalifisering.');
                t.pools.forEach(p => { if (raw.qualification?.[p.id]) TS.Engine.qualify(t, p.id, raw.qualification[p.id]); });
            }
            results(t.matches.filter(m => ['cup', 'bronze'].includes(m.stage)));
        }
        if (t.matches.length !== raw.matches.length) throw new Error('Kampmengda stemmer ikkje.');
        t.undo = []; TS.Engine.waves(t);
        t.started = raw.started === true || t.matches.some(m => m.result);
        t.activeWave = Number.isInteger(raw.activeWave) && t.matches.some(m => m.wave === raw.activeWave) ? raw.activeWave : 0;
        t.display = { mode: ['matches', 'tree', 'table'].includes(raw.display?.mode) ? raw.display.mode : 'matches', rotate: raw.display?.rotate !== false, members: raw.display?.members === true };
        return t;
    }
    TS.Store = { all, get, save, remove, exportData, importData };
})(window);
