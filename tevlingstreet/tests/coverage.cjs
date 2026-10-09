/* Fifty complete tournaments with an independent result/advancement oracle.
 * Run: node tevlingstreet/tests/coverage.cjs. No browser dependencies. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { C, E, S, Store, people } = require('./engine.cjs');
const folder = path.resolve(__dirname, '../../_kjelder/tevlingstreet-audit');
fs.mkdirSync(folder, { recursive: true });
const plain = value => JSON.parse(JSON.stringify(value));
function oracle(t) {
    const matches = new Map(t.matches.map(m => [m.id, m]));
    function resolve(s) {
        if (!s) return { ready: true, id: null };
        if (s.kind === 'participant') return { ready: true, id: s.id };
        if (s.kind === 'qualifier') return { ready: !!t.qualification[s.pool], id: t.qualification[s.pool]?.[s.place - 1] || null };
        const m = matches.get(s.id), a = resolve(m.a), b = resolve(m.b);
        if (!a.ready || !b.ready) return { ready: false, id: null };
        if (!a.id || !b.id) return { ready: true, id: s.kind === 'loser' ? null : a.id || b.id };
        if (!['a', 'b'].includes(m.result)) return { ready: false, id: null };
        const winner = m.result === 'a' ? a.id : b.id;
        return { ready: true, id: s.kind === 'loser' ? (winner === a.id ? b.id : a.id) : winner };
    }
    function scores(ids = t.participants.map(p => p.id)) {
        const rows = new Map(ids.map(id => [id, { id, played: 0, win: 0, draw: 0, loss: 0, bye: 0, points: 0 }]));
        for (const m of t.matches) {
            if (!m.result || !['league', 'pool', 'swiss'].includes(m.stage)) continue;
            const a = rows.get(m.a.id), b = rows.get(m.b.id);
            if (!a || !b) continue;
            a.played++; b.played++;
            if (m.result === 'draw') { a.draw++; b.draw++; a.points += t.settings.draw; b.points += t.settings.draw; }
            else {
                const winner = m.result === 'a' ? a : b, loser = winner === a ? b : a;
                winner.win++; loser.loss++; winner.points += t.settings.win; loser.points += t.settings.loss;
            }
        }
        for (const r of t.rounds.filter(r => r.stage === 'swiss')) for (const id of r.pauses) {
            const row = rows.get(id); if (row) { row.bye++; row.points += t.settings.win; }
        }
        const sorted = [...rows.values()].sort((a, b) => b.points - a.points || t.order.indexOf(a.id) - t.order.indexOf(b.id));
        sorted.forEach((row, i) => { row.place = sorted.findIndex(x => x.points === row.points) + 1; });
        return sorted;
    }
    return { resolve, scores };
}
function audit(t) {
    const o = oracle(t), rows = plain(C.standings(t));
    assert.deepEqual(rows.map(({ name, ...row }) => row), o.scores(), 'Poeng, spelte kampar og delt plass');
    const waves = new Map(), pairCounts = new Map(), usedByes = new Set();
    for (const m of t.matches) {
        const a = o.resolve(m.a), b = o.resolve(m.b);
        assert.deepEqual(plain(C.resolve(t, m.a)), a); assert.deepEqual(plain(C.resolve(t, m.b)), b);
        if (m.result) assert(a.ready && b.ready && a.id && b.id, 'Ingen gamle resultat med uavklarte motstandarar');
        if (a.id && b.id) {
            assert.notEqual(a.id, b.id);
            const used = waves.get(m.wave) || new Set();
            assert(!used.has(a.id) && !used.has(b.id), 'Ingen doble deltakarar i ein bolk');
            used.add(a.id); used.add(b.id); waves.set(m.wave, used);
            if (['league', 'pool', 'swiss'].includes(m.stage)) {
                const key = [a.id, b.id].sort().join('|'); assert(!pairCounts.has(key), 'Ingen gjentekne møte'); pairCounts.set(key, true);
            }
        }
    }
    for (const r of t.rounds) {
        const ids = r.matches.flatMap(id => { const m = t.matches[id - 1]; return [o.resolve(m.a).id, o.resolve(m.b).id].filter(Boolean); });
        assert.equal(new Set(ids).size, ids.length, 'Høgst éin kamp per deltakar i kvar runde');
        if (r.stage === 'swiss') {
            for (const id of r.pauses) { assert(!usedByes.has(id), 'Frirunde høgst éin gong'); usedByes.add(id); }
            assert.equal(new Set([...ids, ...r.pauses]).size, t.participants.length);
        }
    }
}
function play(t, list, index) {
    let count = 0;
    for (const m of list) {
        const o = oracle(t), a = o.resolve(m.a), b = o.resolve(m.b);
        if (!a.ready || !b.ready || !a.id || !b.id) continue;
        const knockout = ['cup', 'bronze'].includes(m.stage);
        if (knockout && m.id % 7 === index % 7) {
            E.setResult(t, m.id, 'draw');
            assert(!C.done(t, m)); assert(!C.resolve(t, { kind: 'winner', id: m.id }).ready, 'Uavgjort går aldri vidare');
        }
        const outcome = (m.id * 17 + index * 13) % (knockout ? 2 : 3);
        const result = outcome === 0 ? 'a' : outcome === 1 ? 'b' : 'draw';
        E.setResult(t, m.id, result); count++;
        if (knockout) {
            assert.equal(C.resolve(t, { kind: 'winner', id: m.id }).id, result === 'a' ? a.id : b.id);
            assert.equal(C.resolve(t, { kind: 'loser', id: m.id }).id, result === 'a' ? b.id : a.id);
        }
    }
    return count;
}
function finish(t, index) {
    let played = 0;
    if (t.settings.format === 'swiss') {
        for (;;) {
            played += play(t, t.matches.filter(m => !m.result), index);
            audit(t);
            if (t.rounds.length === t.settings.rounds) break;
            const proposal = S.propose(t), rows = oracle(t).scores();
            if (proposal.bye) {
                const used = new Set(t.rounds.flatMap(r => r.pauses));
                const least = Math.min(...rows.filter(r => !used.has(r.id)).map(r => r.points));
                assert.equal(rows.find(r => r.id === proposal.bye).points, least, 'Frirunde til låg poengsum');
            }
            S.confirm(t, proposal);
        }
    } else {
        played += play(t, t.matches.filter(m => !['cup', 'bronze'].includes(m.stage) && !m.result), index);
        if (t.pools.length) for (const pool of t.pools) {
            const rows = oracle(t).scores(pool.ids), ids = rows.slice(0, t.settings.advance).map(r => r.id);
            E.qualify(t, pool.id, ids); assert.deepEqual(plain(t.qualification[pool.id]), ids);
        }
        played += play(t, t.matches.filter(m => ['cup', 'bronze'].includes(m.stage) && !m.result), index);
    }
    audit(t); assert(t.matches.every(m => C.done(t, m))); return played;
}
function correction(t, index) {
    const before = JSON.stringify(Store.exportData(t)), m = t.matches.find(m => m.result && (t.settings.format !== 'pools' || m.stage === 'pool'));
    const newResult = m.result === 'a' ? 'b' : 'a';
    const published = JSON.stringify(t.rounds);
    E.setResult(t, m.id, newResult); audit(t);
    if (t.settings.format === 'swiss') assert.equal(JSON.stringify(t.rounds), published, 'Spelte sveitserparingar blir ståande');
    if (t.settings.format === 'pools') assert(!t.qualification[m.pool]);
    C.undo(t); assert.equal(JSON.stringify(Store.exportData(t)), before, 'Angre gjenopprettar heile resultatet');
    E.setResult(t, m.id, newResult); finish(t, index + 1);
    const imported = Store.importData(Store.exportData(t)); audit(imported);
    assert.deepEqual(plain(imported.matches), plain(t.matches), 'Import held på resultat, koplingar og spelstader');
}
// Regression: an altered semifinal also invalidates the final when its former winner
// came from the other branch. Check both result correction and pool reselection.
const regression = E.generate(C.create(people(8), { format: 'cup', bronze: true }));
regression.matches.forEach(m => { if (C.ready(regression, m)) E.setResult(regression, m.id, m.round === 2 ? 'b' : 'a'); });
E.setResult(regression, 1, 'b'); audit(regression); assert.equal(regression.matches.find(m => m.round === 3 && m.stage === 'cup').result, null);
const requalify = E.generate(C.create(people(16), { format: 'pools', poolCount: 4, advance: 2, bronze: true }));
requalify.matches.filter(m => m.stage === 'pool').forEach(m => E.setResult(requalify, m.id, 'draw'));
requalify.pools.forEach(p => E.qualify(requalify, p.id, p.ids.slice(0, 2)));
requalify.matches.filter(m => m.stage !== 'pool').forEach(m => { if (C.ready(requalify, m)) E.setResult(requalify, m.id, m.round === 2 ? 'b' : 'a'); });
const p = requalify.pools[0]; E.qualify(requalify, p.id, p.ids.slice(2, 4)); audit(requalify);
const results = [];
for (let index = 0; index < 50; index++) {
    const n = 2 + Math.round(index * 126 / 49), format = ['cup', 'league', 'pools', 'swiss'][index % 4];
    const options = { format, bronze: index % 3 === 0, venues: index % 5 === 0 ? [] : Array.from({ length: 1 + index % 8 }, (_, i) => 'Bane ' + (i + 1)),
        win: index % 3 ? 3 : 5, draw: index % 3 ? 1 : 2, loss: index % 3 ? 0 : .5,
        poolCount: Math.max(2, Math.ceil(n / 5)), advance: index % 3 === 2 ? 1 : 2,
        rounds: Math.min(C.maxSwiss(n), index % 3 ? Math.ceil(Math.log2(n)) : 10) };
    const participants = people(n);
    if (index % 2) participants.forEach(p => { p.members = Array.from({ length: 3 }, (_, j) => ({ id: p.id + '-s' + j, name: 'Elev ' + j })); p.name = 'Lag ' + p.id.slice(1); });
    if (index % 7 === 0) participants[1].name = participants[0].name;
    const t = C.create(participants, options, 'Kontroll ' + (index + 1));
    t.seed = 20261009 + index; t.order = participants.map(p => p.id); if (index % 2) t.order.reverse();
    E.generate(t);
    fs.writeFileSync(path.join(folder, 'initial-' + (index + 1) + '.json'), JSON.stringify(Store.exportData(t)));
    const start = Date.now(), played = finish(t, index);
    if (format === 'league') assert.equal(played, n * (n - 1) / 2);
    if (format === 'cup') assert.equal(played, n - 1 + Number(options.bronze && n > 2));
    if (format === 'swiss') assert.equal(played, Math.floor(n / 2) * options.rounds);
    if (format === 'pools') {
        const expected = t.pools.reduce((sum, p) => sum + p.ids.length * (p.ids.length - 1) / 2, 0) + t.pools.length * options.advance - 1 + Number(options.bronze);
        assert.equal(played, expected);
        for (const m of t.matches.filter(m => m.stage === 'cup' && m.round === 1 && m.b)) assert.notEqual(m.a.pool, m.b.pool);
    }
    correction(t, index);
    const data = Store.exportData(t); fs.writeFileSync(path.join(folder, 'complete-' + (index + 1) + '.json'), JSON.stringify(data));
    const item = { number: index + 1, participants: n, format, teams: !!(index % 2), played, rounds: t.rounds.length, corrections: true, milliseconds: Date.now() - start };
    results.push(item); console.log('PASS ' + item.number + '/50: ' + n + ' ' + format + ', ' + played + ' kampar');
}
const report = { date: '2026-10-09', total: results.length, matches: results.reduce((sum, r) => sum + r.played, 0), results };
fs.writeFileSync(path.join(folder, 'tournaments.json'), JSON.stringify(report, null, 2));
console.log('PASS: 50 heile turneringar, ' + report.matches + ' kampar, uavhengige poeng- og avansementskontrollar, retting, angre og import.');
