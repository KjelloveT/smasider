/* Tevlingstreet — kontrollerte sveitserparingar med tilbakeprøving. */
(function (root) {
    'use strict';
    const TS = root.TS, C = TS.Core;
    function history(t) {
        const met = new Set();
        t.matches.filter(m => m.stage === 'swiss').forEach(m => {
            const ids = [C.resolve(t, m.a).id, C.resolve(t, m.b).id].sort();
            met.add(ids.join('|'));
        });
        return met;
    }
    function validate(t, proposal) {
        const number = t.rounds.filter(r => r.stage === 'swiss').length + 1;
        if (number > t.settings.rounds) throw new Error('Alle rundane er sette opp.');
        if (!t.matches.every(m => C.done(t, m))) throw new Error('Før inn alle resultata før neste runde.');
        if (!proposal || !Array.isArray(proposal.pairs)) throw new Error('Paringa manglar.');
        const seen = new Set(), met = history(t), usedBye = new Set(t.rounds.flatMap(r => r.pauses || []));
        for (const pair of proposal.pairs) {
            if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1]) throw new Error('Kvar kamp treng to ulike deltakarar.');
            pair.forEach(id => { if (!C.participant(t, id) || seen.has(id)) throw new Error('Ein deltakar er vald meir enn éin gong.'); seen.add(id); });
            if (met.has(pair.slice().sort().join('|'))) throw new Error('Desse deltakarane har møtt kvarandre før.');
        }
        if (proposal.bye) {
            if (seen.has(proposal.bye) || !C.participant(t, proposal.bye) || usedBye.has(proposal.bye)) throw new Error('Frirunden er ikkje gyldig.');
            seen.add(proposal.bye);
        }
        if (seen.size !== t.participants.length || !!proposal.bye !== !!(t.participants.length % 2)) throw new Error('Alle deltakarane må vere med, og berre oddetal får frirunde.');
        return number;
    }
    function propose(t) {
        if (!t.matches.every(m => C.done(t, m))) throw new Error('Før inn alle resultata før neste runde.');
        const rows = C.standings(t), points = new Map(rows.map(r => [r.id, r.points]));
        const usedBye = new Set(t.rounds.flatMap(r => r.pauses || [])), met = history(t);
        const byes = rows.length % 2 ? rows.slice().reverse().filter(r => !usedBye.has(r.id)).map(r => r.id) : [null];
        const deadline = Date.now() + 600;
        let nodes = 0;
        function search(ids) {
            if (!ids.length) return [];
            if (++nodes > 150000 || Date.now() > deadline) return null;
            // Select the participant with fewest possible opponents to avoid greedy dead ends.
            let a = ids[0], degree = Infinity;
            ids.forEach(id => {
                const count = ids.filter(other => id !== other && !met.has([id, other].sort().join('|'))).length;
                if (count < degree) { a = id; degree = count; }
            });
            const candidates = ids.filter(b => b !== a && !met.has([a, b].sort().join('|')));
            candidates.sort((a1, b1) => Math.abs(points.get(a) - points.get(a1)) - Math.abs(points.get(a) - points.get(b1)) || t.order.indexOf(a1) - t.order.indexOf(b1));
            for (const b of candidates) {
                const rest = search(ids.filter(id => id !== a && id !== b));
                if (rest) return [[a, b], ...rest];
            }
            return null;
        }
        for (const bye of byes) {
            const pairs = search(rows.map(r => r.id).filter(id => id !== bye));
            if (pairs) { const proposal = { pairs, bye, attempts: nodes }; validate(t, proposal); return proposal; }
        }
        throw new Error('Lag paringa manuelt. Unngå tidlegare motstandarar og vel éin frirunde ved oddetal.');
    }
    function confirm(t, proposal, remember = true) {
        const number = validate(t, proposal);
        if (remember) C.remember(t);
        const matches = proposal.pairs.map(pair => C.match(t, C.ref(pair[0]), C.ref(pair[1]), 'swiss', number));
        TS.Engine.addRound(t, 'swiss', number, matches, proposal.bye ? [proposal.bye] : []);
        TS.Engine.waves(t);
    }
    TS.Swiss = { history, propose, validate, confirm };
})(typeof window === 'undefined' ? globalThis : window);
