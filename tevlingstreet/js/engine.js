/* Tevlingstreet — cup, rundespel, puljar, avvikling og rettingar. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core;
    function addRound(t, stage, number, matches, pauses, pool) {
        t.rounds.push({ stage, number, matches: matches.map(m => m.id), pauses: pauses || [], pool: pool || null });
    }
    function league(t, ids, stage, pool) {
        const ring = ids.slice();
        if (ring.length % 2) ring.push(null);
        for (let r = 1; r < ring.length; r++) {
            const matches = [], pauses = [];
            for (let i = 0; i < ring.length / 2; i++) {
                const a = ring[i], b = ring[ring.length - 1 - i];
                if (!a || !b) pauses.push(a || b);
                else matches.push(C.match(t, C.ref(a), C.ref(b), stage, r, pool));
            }
            addRound(t, stage, r, matches, pauses, pool);
            ring.splice(1, 0, ring.pop());
        }
    }
    function pairQualifiers(list) {
        if (!list.length) return [];
        const a = list[0];
        const candidates = list.map((_, i) => i).slice(1).sort((i, j) => Number(list[i].place === a.place) - Number(list[j].place === a.place));
        for (const i of candidates) {
            if (a.pool && a.pool === list[i].pool) continue;
            const rest = pairQualifiers(list.filter((_, j) => j !== 0 && j !== i));
            if (rest) return [[a, list[i]], ...rest];
        }
        return null;
    }
    function cup(t, sources) {
        let size = 2;
        while (size < sources.length) size *= 2;
        const byeCount = size - sources.length;
        const ranked = sources.slice().sort((a, b) => (a.place || 1) - (b.place || 1));
        const byes = ranked.slice(0, byeCount), rest = ranked.slice(byeCount);
        const pairs = pairQualifiers(rest);
        if (!pairs) throw new Error('Klarte ikkje å krysse puljane. Endre puljetalet.');
        const first = [], byePositions = new Set();
        for (let i = 0; i < byeCount; i++) byePositions.add(Math.floor(i * (size / 2) / byeCount));
        for (let i = 0; i < size / 2; i++) {
            const pair = byePositions.has(i) ? [byes.shift(), null] : pairs.shift();
            first.push(C.match(t, pair[0], pair[1], 'cup', 1));
        }
        addRound(t, 'cup', 1, first);
        let previous = first, r = 2;
        while (previous.length > 1) {
            const next = [];
            for (let i = 0; i < previous.length; i += 2) next.push(C.match(t, { kind: 'winner', id: previous[i].id }, { kind: 'winner', id: previous[i + 1].id }, 'cup', r));
            addRound(t, 'cup', r++, next); previous = next;
        }
        if (t.settings.bronze && size >= 4) {
            const semi = t.matches.filter(m => m.stage === 'cup' && m.round === r - 2);
            addRound(t, 'bronze', r - 1, [C.match(t, { kind: 'loser', id: semi[0].id }, { kind: 'loser', id: semi[1].id }, 'bronze', r - 1)]);
        }
    }
    function waves(t) {
        let wave = 1;
        const capacity = t.settings.venues.length || Math.floor(t.participants.length / 2);
        const stages = ['league', 'pool', 'swiss', 'cup', 'bronze'];
        for (const stage of stages) {
            const rounds = t.rounds.filter(r => r.stage === stage);
            const numbers = [...new Set(rounds.map(r => r.number))].sort((a, b) => a - b);
            for (const number of numbers) {
                const group = rounds.filter(r => r.number === number).flatMap(r => r.matches.map(id => t.matches.find(m => m.id === id)));
                const playable = group.filter(m => {
                    const empty = source => !source || source.kind === 'loser' && (() => {
                        const previous = t.matches.find(x => x.id === source.id);
                        return previous && (!previous.a || !previous.b);
                    })();
                    if (empty(m.a) || empty(m.b)) return false;
                    const a = C.resolve(t, m.a), b = C.resolve(t, m.b);
                    return !(a.ready && b.ready && (!a.id || !b.id));
                });
                group.forEach(m => { m.wave = null; m.venue = null; });
                playable.forEach((m, i) => { m.wave = wave + Math.floor(i / capacity); m.venue = t.settings.venues[i % capacity] || null; });
                wave += Math.ceil(playable.length / capacity);
            }
        }
        return wave - 1;
    }
    function generate(t) {
        if (t.started || t.matches.some(m => m.result)) throw new Error('Oppsettet er låst etter første resultat.');
        t.matches = []; t.rounds = []; t.pools = []; t.qualification = {}; t.undo = []; t.activeWave = 0;
        if (t.settings.format === 'league') league(t, t.order, 'league');
        if (t.settings.format === 'cup') cup(t, t.order.map(C.ref));
        if (t.settings.format === 'pools') {
            for (let i = 0; i < t.settings.poolCount; i++) t.pools.push({ id: i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26), ids: [] });
            t.order.forEach((id, i) => t.pools[i % t.pools.length].ids.push(id));
            t.pools.forEach(p => league(t, p.ids, 'pool', p.id));
            const qualifiers = [];
            for (let place = 1; place <= t.settings.advance; place++) t.pools.forEach(p => qualifiers.push({ kind: 'qualifier', pool: p.id, place }));
            cup(t, qualifiers);
        }
        if (t.settings.format === 'swiss') TS.Swiss.confirm(t, TS.Swiss.propose(t), false);
        waves(t); return t;
    }
    function changedMatches(t, altered) {
        const affected = [];
        // Clear each changed match before resolving its descendants. Even an unchanged
        // finalist must wait for a semifinal whose result has just been cleared.
        t.matches.filter(m => ['cup', 'bronze'].includes(m.stage) && m.result).forEach(m => {
            if (C.resolve(t, m.a).id !== C.resolve(altered, m.a).id || C.resolve(t, m.b).id !== C.resolve(altered, m.b).id) {
                affected.push(m.id);
                altered.matches.find(x => x.id === m.id).result = null;
            }
        });
        return affected;
    }
    function impact(t, id, result) {
        const m = t.matches.find(m => m.id === id);
        if (!m || m.result === result) return [];
        if (!t.matches.some(x => ['cup', 'bronze'].includes(x.stage) && x.result)) return [];
        if (['league', 'swiss'].includes(m.stage)) return [];
        const altered = C.copy(t);
        altered.matches.find(m => m.id === id).result = result;
        if (m.stage === 'pool') delete altered.qualification[m.pool];
        return changedMatches(t, altered);
    }
    function setResult(t, id, result) {
        const m = t.matches.find(m => m.id === id);
        if (!m || !C.ready(t, m) || ![null, 'a', 'b', 'draw'].includes(result)) throw new Error('Kampen er ikkje klar for resultat.');
        if (m.result === result) return [];
        const affected = impact(t, id, result);
        C.remember(t, [id, ...affected]); m.result = result;
        if (result) t.started = true;
        if (m.stage === 'pool') delete t.qualification[m.pool];
        affected.forEach(id => { t.matches.find(m => m.id === id).result = null; });
        return affected;
    }
    function qualifiers(t, poolId) {
        const pool = t.pools.find(p => p.id === poolId);
        const matches = t.matches.filter(m => m.pool === poolId);
        if (!pool || !matches.every(m => C.done(t, m))) throw new Error('Fullfør alle kampane i pulja fyrst.');
        const rows = C.standings(t, pool.ids), count = t.settings.advance;
        return { rows, count, tied: rows.some((r, i) => i < count && rows.some(x => x.id !== r.id && x.points === r.points)) };
    }
    function qualify(t, poolId, ids) {
        const info = qualifiers(t, poolId);
        if (ids.length !== info.count || new Set(ids).size !== ids.length || ids.some(id => !info.rows.some(r => r.id === id))) throw new Error('Vel ulike deltakarar frå pulja.');
        // A teacher may choose among ties, never advance a lower score past a higher one.
        const available = info.rows.slice();
        ids.forEach(id => {
            const selected = available.find(r => r.id === id);
            if (selected.points !== Math.max(...available.map(r => r.points))) throw new Error('Ein deltakar med fleire poeng må gå vidare fyrst.');
            available.splice(available.indexOf(selected), 1);
        });
        const altered = C.copy(t); altered.qualification[poolId] = ids.slice();
        const affected = changedMatches(t, altered);
        C.remember(t, affected); t.qualification[poolId] = ids.slice();
        affected.forEach(id => { t.matches.find(m => m.id === id).result = null; });
        waves(t);
    }
    function nextWave(t) {
        return Math.min(...t.matches.filter(m => m.wave && !C.done(t, m)).map(m => m.wave), Infinity);
    }
    function startWave(t) {
        const number = nextWave(t);
        if (!Number.isFinite(number)) return false;
        const list = t.matches.filter(m => m.wave === number);
        if (!list.every(m => C.ready(t, m) || C.done(t, m))) throw new Error('Motstandarane er ikkje klare. Avgjer tidlegare kampar eller stadfest puljevinnarane.');
        t.activeWave = number; return true;
    }
    function next(t, id) {
        const readyMatch = t.matches.find(m => !C.done(t, m) && [C.resolve(t, m.a).id, C.resolve(t, m.b).id].includes(id));
        if (readyMatch) {
            const side = C.resolve(t, readyMatch.a).id === id ? readyMatch.b : readyMatch.a;
            return 'Kamp ' + readyMatch.id + ': møter ' + C.label(t, side) + (readyMatch.venue ? ' på ' + readyMatch.venue : '') + '.';
        }
        if (t.settings.format === 'pools') {
            const pool = t.pools.find(p => p.ids.includes(id));
            if (pool && !t.qualification[pool.id]) return 'Læraren må stadfeste kven som går vidare frå pulje ' + pool.id + '.';
        }
        const current = t.rounds.filter(r => r.stage === 'swiss').at(-1);
        if (current?.pauses.includes(id)) return 'Frirunde i runde ' + current.number + ': ' + t.settings.win + ' poeng.' + (current.number < t.settings.rounds ? ' Neste motstandar blir klar etter denne runden.' : '');
        if (t.settings.format === 'swiss' && t.rounds.length < t.settings.rounds) return 'Neste motstandar blir klar etter denne runden.';
        const pending = t.matches.find(m => ['cup', 'bronze'].includes(m.stage) && !C.done(t, m) &&
            [m.a, m.b].some(s => s?.kind === 'winner' && C.resolve(t, { kind: 'winner', id: s.id }).id === id));
        return pending ? 'Vent på neste motstandar.' : 'Ingen fleire kampar er klare for deg.';
    }
    TS.Engine = { generate, league, cup, waves, impact, setResult, qualifiers, qualify, nextWave, startWave, next, addRound };
})(typeof window === 'undefined' ? globalThis : window);
