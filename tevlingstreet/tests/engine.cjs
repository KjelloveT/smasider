/* Run with node tevlingstreet/tests/engine.cjs. No dependencies. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const base = path.resolve(__dirname, '../..'), data = {};
const context = vm.createContext({ console, Date, Math, Set, Map, JSON, crypto: require('node:crypto').webcrypto });
context.window = context; context.addEventListener = () => {}; context.document = { addEventListener() {} };
context.VyrdepilStorage = {
    getGameState: game => data[game]?.state || null,
    setGameState: (game, state) => { (data[game] ||= {}).state = structuredClone(state); },
    getList: (game, key) => data[game]?.[key] || [],
    saveListItem: (game, key, item) => ((data[game] ||= {})[key] ||= []).push(structuredClone(item)),
    updateListItem: (game, key, id, item) => { const a = data[game][key]; a[a.findIndex(x => x.id === id)] = structuredClone(item); },
    deleteListItem: (game, key, id) => { data[game][key] = data[game][key].filter(x => x.id !== id); }
};
function load(file) { vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { filename: file }); }
['js/vyrdepil-util.js', 'js/vyrdepil-elevgrupper.js', 'js/vyrdepil-elevlister.js', 'tevlingstreet/js/core.js', 'tevlingstreet/js/engine.js', 'tevlingstreet/js/swiss.js', 'tevlingstreet/js/storage.js'].forEach(load);
const { Core: C, Engine: E, Swiss: S, Store } = context.TS, L = context.VyrdepilElevgrupper;
const people = n => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'Elev ' + (i + 1), members: [] }));
const make = (n, format, extra) => E.generate(C.create(people(n), Object.assign({ format, venues: ['Bane 1', 'Bane 2', 'Bane 3'] }, extra), 'Prøve'));
let checks = 0;
function verify(t) {
    const ids = new Set(t.participants.map(p => p.id));
    assert.equal(new Set(t.matches.map(m => m.id)).size, t.matches.length);
    const waves = new Map();
    for (const m of t.matches) {
        if (!C.ready(t, m)) continue;
        const a = C.resolve(t, m.a).id, b = C.resolve(t, m.b).id;
        assert(ids.has(a) && ids.has(b)); assert.notEqual(a, b);
        const used = waves.get(m.wave) || new Set();
        assert(!used.has(a) && !used.has(b), 'Deltakar dobbelt i spelbolk'); used.add(a); used.add(b); waves.set(m.wave, used);
    }
    checks++;
}
for (const n of [2, 3, 7, 16, 31, 64, 127, 128]) {
    const cup = make(n, 'cup', { bronze: true });
    assert.equal(cup.matches.filter(m => m.stage === 'cup' && C.done(cup, m)).length, 2 ** Math.ceil(Math.log2(n)) - n);
    let played = 0;
    cup.matches.forEach(m => { if (C.ready(cup, m)) { E.setResult(cup, m.id, 'a'); if (m.stage === 'cup') played++; } });
    assert.equal(played, n - 1); assert(cup.matches.every(m => C.done(cup, m))); verify(cup);
    const imported = Store.importData(Store.exportData(cup)); assert.notEqual(imported.id, cup.id); assert.equal(imported.matches.at(-1).result, cup.matches.at(-1).result);
    const league = make(n, 'league');
    assert.equal(league.matches.length, n * (n - 1) / 2);
    assert.equal(new Set(league.matches.map(m => [m.a.id, m.b.id].sort().join('|'))).size, league.matches.length);
    league.rounds.forEach(r => {
        assert.equal(new Set(r.matches.flatMap(id => { const m = league.matches[id - 1]; return [m.a.id, m.b.id]; })).size + r.pauses.length, n);
    }); verify(league);
    const swiss = make(n, 'swiss');
    const byes = new Set();
    for (let r = 1; r <= swiss.settings.rounds; r++) {
        const round = swiss.rounds.at(-1);
        round.pauses.forEach(id => { assert(!byes.has(id)); byes.add(id); });
        round.matches.forEach((id, i) => E.setResult(swiss, id, i % 3 === 0 ? 'draw' : i % 3 === 1 ? 'a' : 'b'));
        if (r < swiss.settings.rounds) S.confirm(swiss, S.propose(swiss));
    }
    assert.equal(swiss.matches.length, Math.floor(n / 2) * swiss.settings.rounds);
    assert.equal(S.history(swiss).size, swiss.matches.length);
    verify(swiss);
    const reload = Store.importData(Store.exportData(swiss)); assert.equal(reload.rounds.length, swiss.rounds.length);
    if (n >= 6) {
        const pools = make(n, 'pools');
        pools.matches.filter(m => m.stage === 'pool').forEach(m => { m.result = 'draw'; });
        pools.pools.forEach(p => { assert(E.qualifiers(pools, p.id).tied); E.qualify(pools, p.id, C.standings(pools, p.ids).slice(0, pools.settings.advance).map(r => r.id)); });
        pools.matches.filter(m => m.stage === 'cup' && m.round === 1 && m.b).forEach(m => assert.notEqual(m.a.pool, m.b.pool));
        pools.matches.filter(m => ['cup', 'bronze'].includes(m.stage)).forEach(m => { if (C.ready(pools, m)) E.setResult(pools, m.id, 'a'); });
        verify(pools); assert(pools.matches.every(m => C.done(pools, m)));
        Store.importData(Store.exportData(pools));
    }
}
// Corrections invalidate descendants, and undo restores participants and results.
const t = make(7, 'cup', { bronze: true });
t.matches.forEach(m => { if (C.ready(t, m)) E.setResult(t, m.id, 'a'); });
const first = t.matches.find(m => m.round === 1 && C.ready(t, m)), before = JSON.stringify(t.matches);
assert(E.impact(t, first.id, 'b').length >= 2); E.setResult(t, first.id, 'b'); C.undo(t); assert.equal(JSON.stringify(t.matches), before);
E.setResult(t, first.id, 'draw'); assert(!C.resolve(t, { kind: 'winner', id: first.id }).ready);
const poolTest = make(12, 'pools');
poolTest.matches.filter(m => m.stage === 'pool').forEach(m => { m.result = 'draw'; });
poolTest.pools.forEach(p => E.qualify(poolTest, p.id, C.standings(poolTest, p.ids).slice(0, 2).map(r => r.id)));
poolTest.matches.filter(m => m.stage === 'cup').forEach(m => { if (C.ready(poolTest, m)) E.setResult(poolTest, m.id, 'a'); });
const pm = poolTest.matches[0]; E.setResult(poolTest, pm.id, 'draw'); assert(poolTest.qualification[pm.pool], 'Same resultat skal halde kvalifisering');
E.setResult(poolTest, pm.id, 'a'); assert(!poolTest.qualification[pm.pool]); C.undo(poolTest); assert(poolTest.qualification[pm.pool]);
const unevenPools = make(12, 'pools', { poolCount: 3 });
const plannedPlaces = JSON.stringify(unevenPools.matches.map(m => [m.id, m.wave, m.venue]));
unevenPools.matches.filter(m => m.stage === 'pool').forEach(m => { m.result = 'draw'; });
unevenPools.pools.forEach(p => E.qualify(unevenPools, p.id, C.standings(unevenPools, p.ids).slice(0, 2).map(r => r.id)));
assert.equal(JSON.stringify(unevenPools.matches.map(m => [m.id, m.wave, m.venue])), plannedPlaces, 'Papir og digital spelstad må halde seg like');
// Swiss correction preserves already published pairings; undo removes a newly published round.
const sw = make(7, 'swiss'); sw.matches.forEach(m => E.setResult(sw, m.id, 'a')); S.confirm(sw, S.propose(sw));
const pairing = JSON.stringify(sw.rounds[1]); E.setResult(sw, 1, 'b'); assert.equal(JSON.stringify(sw.rounds[1]), pairing);
assert.throws(() => S.confirm(sw, S.propose(sw)));
C.undo(sw); C.undo(sw); assert.equal(sw.rounds.length, 1);
assert.throws(() => S.validate(sw, { pairs: [[sw.order[0], sw.order[0]]], bye: sw.order[1] }));
// This graph forces an early tentative pair to be reconsidered.
const back = C.create(people(10), { format: 'swiss', rounds: 1, draw: 0 }); back.order = people(10).map(p => p.id);
const allowed = [[0,5],[0,8],[0,9],[1,2],[1,3],[1,7],[2,4],[3,6],[4,6],[5,8],[5,9],[6,9],[7,8],[7,9],[8,9]];
for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) {
    if (!allowed.some(pair => pair[0] === i && pair[1] === j)) C.match(back, C.ref('p' + i), C.ref('p' + j), 'swiss', 0).result = 'draw';
}
const recovered = S.propose(back); assert(recovered.attempts > 5, 'Paringa må gå tilbake'); S.validate(back, recovered);
const locked = make(4, 'cup'); E.setResult(locked, 1, 'a'); C.undo(locked); assert.throws(() => E.generate(locked));
const noVenues = make(16, 'league', { venues: [] }); verify(noVenues);
assert.equal(new Set(noVenues.matches.map(m => m.wave)).size, 15); assert(noVenues.matches.every(m => m.venue === null));
// Imports reject altered graph references, invalid results, duplicate identities and repeats.
const raw = Store.exportData(make(16, 'cup')); raw.matches.at(-1).a.id = 999; assert.throws(() => Store.importData(raw));
const bad = Store.exportData(make(4, 'league')); bad.matches[0].result = 'goals'; assert.throws(() => Store.importData(bad));
assert.throws(() => C.create(people(129), { format: 'cup' }));
// Roster identities survive equal names, copies, several group sets and old source adapters.
const roster = L.saveRoster('Klasse', ['Ada', 'Ada', 'Bjørn']);
assert.equal(roster.students.length, 3); assert.notEqual(roster.students[0].id, roster.students[1].id);
const groups = roster.students.map((s, i) => ({ name: 'Lag ' + i, members: [s] }));
const one = L.saveGroups('Gym', groups), two = L.saveGroups('Arbeid', groups); assert.notEqual(one.id, two.id);
assert.throws(() => L.saveGroups('Feil', [{ name: 'A', members: [roster.students[0]] }, { name: 'B', members: [roster.students[0]] }]));
const copy = L.clone(roster); roster.students[0].name = 'Rett namn'; L.save(roster); assert.equal(copy.students[0].name, 'Ada');
context.VyrdepilStorage.saveListItem('flokkdeilar', 'lister', { id: 'old', name: 'Gammal', students: [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Ada' }], relations: { a: 'secret' } });
context.VyrdepilStorage.saveListItem('klassekart', 'oppsett', { id: 'old', name: 'Rom', data: { students: ['Liv', 'Liv'], desks: [{ name: 'Liv' }] } });
const old = L.sources().find(s => s.id === 'flokkdeilar:old'); assert.equal(old.students.length, 2); assert(!('relations' in old));
assert.equal(L.sources().find(s => s.id === 'klassekart:old').students.length, 2);
assert.equal(context.VyrdepilElevlister.reinsk(['Ada', 'Ada']).length, 2);
console.log('PASS: ' + checks + ' format-/storleikskontrollar, import, retting, angre, sveitser og elevbibliotek.');
module.exports = { make, C, E, S, Store, L, people };
