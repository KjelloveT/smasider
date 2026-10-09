/* Tevlingstreet — datamodell og felles reglar. */
(function (root) {
    'use strict';
    const TS = root.TS = root.TS || {};
    const copy = value => JSON.parse(JSON.stringify(value));
    const ref = id => id ? { kind: 'participant', id } : null;
    const formats = {
        cup: { name: 'Cup — vinn og gå vidare', description: 'Vinnaren av kvar kamp går vidare til neste runde. Den som taper, er ute av turneringa. Dette passar når de ønskjer få kampar og ein tydeleg finale, men somme får berre spele éin kamp.' },
        league: { name: 'Alle mot alle', description: 'Alle møter kvar av dei andre éin gong. Siger og uavgjort gjev poeng, og flest poeng vinn. Alle får fleire kampar, men kampmengda veks mykje når det er mange deltakarar.' },
        pools: { name: 'Puljar med sluttspel', description: 'Deltakarane blir delte i mindre puljar, der alle møter kvarandre. Dei beste frå kvar pulje går vidare til eit sluttspel der vinnaren går vidare. Alle får fleire kampar før finalane.' },
        swiss: { name: 'Sveitser — nye motstandarar kvar runde', description: 'Alle er med gjennom eit valt tal rundar. Etter kvar runde møter ein helst nokon med om lag like mange poeng, utan å møte same motstandar på nytt. Neste runde blir sett opp når resultata frå førre runde er klare.' }
    };
    function maxSwiss(n) { return Math.max(1, Math.min(10, n % 2 ? n : n - 1)); }
    function defaults(n) {
        return { format: n >= 6 ? 'pools' : 'cup', win: 3, draw: 1, loss: 0,
            poolCount: Math.max(2, Math.ceil(n / 4)), advance: 2,
            rounds: Math.min(maxSwiss(n), Math.max(1, Math.ceil(Math.log2(n || 2)))), bronze: false, venues: ['Bane 1'] };
    }
    function create(participants, options, title) {
        const n = participants.length;
        if (n < 2 || n > 128) throw new Error('Vel mellom 2 og 128 deltakarar.');
        const settings = Object.assign(defaults(n), options);
        if (!formats[settings.format]) throw new Error('Ukjend turneringsform.');
        for (const key of ['win', 'draw', 'loss']) {
            if (!Number.isFinite(settings[key]) || settings[key] < 0 || settings[key] > 100) throw new Error('Poenga må vere tal mellom 0 og 100.');
        }
        if (!(settings.win > settings.draw && settings.draw >= settings.loss)) throw new Error('Siger må gje meir enn uavgjort, som må gje minst like mykje som tap.');
        if (settings.format === 'swiss' && (!Number.isInteger(settings.rounds) || settings.rounds < 1 || settings.rounds > maxSwiss(n))) throw new Error('Vel eit gyldig rundetal.');
        if (settings.format === 'pools' && (n < 6 || !Number.isInteger(settings.poolCount) || settings.poolCount < Math.max(2, Math.ceil(n / 8)) || settings.poolCount > Math.floor(n / 3) || ![1, 2].includes(settings.advance))) throw new Error('Puljar treng minst seks deltakarar, med 3–8 i kvar pulje.');
        settings.venues = (settings.venues || []).map(s => String(s).trim()).filter(Boolean);
        if (settings.venues.length > 128 || settings.venues.some(s => s.length > 120) || new Set(settings.venues).size !== settings.venues.length) throw new Error('Bruk høgst 128 ulike baner eller bord, med høgst 120 teikn i kvart namn.');
        const ids = new Set(), studentIds = new Set();
        participants.forEach(p => {
            if (typeof p.id !== 'string' || p.id.length > 200 || ids.has(p.id) || !String(p.name || '').trim() || p.name.length > 120) throw new Error('Deltakarane må ha namn og ulike ID-ar.');
            ids.add(p.id);
            (p.members || []).forEach(s => { if (studentIds.has(s.id)) throw new Error('Ein elev kan berre vere på eitt lag.'); studentIds.add(s.id); });
        });
        if (studentIds.size > 2000) throw new Error('Ei turnering kan ha høgst 2 000 lagmedlemmer.');
        const t = { app: 'tevlingstreet', version: 1, id: root.Vy.uuid(), title: String(title || 'Turnering').trim(), revision: 1, setup: 1,
            seed: root.Vy.newSeed(), participants: copy(participants), settings, matches: [], rounds: [], pools: [], qualification: {}, activeWave: 0,
            display: { mode: 'matches', rotate: true, members: false }, frozen: false, started: false, undo: [] };
        t.order = root.Vy.shuffle(participants.map(p => p.id), root.Vy.rng(t.seed));
        return t;
    }
    function participant(t, id) { return t.participants.find(p => p.id === id); }
    function displayName(t, id) {
        const p = participant(t, id);
        if (!p) return 'Ukjend deltakar';
        return p.name + (t.participants.filter(x => x.name === p.name).length > 1 ? ' (nr. ' + (t.order.indexOf(id) + 1) + ')' : '');
    }
    function resolve(t, source, seen) {
        if (!source) return { ready: true, id: null };
        if (source.kind === 'participant') return { ready: true, id: source.id };
        if (source.kind === 'qualifier') return { ready: !!t.qualification[source.pool], id: t.qualification[source.pool]?.[source.place - 1] || null };
        seen = seen || new Set();
        if (seen.has(source.id)) return { ready: false, id: null };
        seen.add(source.id);
        const m = t.matches.find(item => item.id === source.id);
        if (!m) return { ready: false, id: null };
        const a = resolve(t, m.a, new Set(seen)), b = resolve(t, m.b, new Set(seen));
        if (!a.ready || !b.ready) return { ready: false, id: null };
        if (!a.id || !b.id) return { ready: true, id: source.kind === 'loser' ? null : a.id || b.id };
        if (!m.result || m.result === 'draw') return { ready: false, id: null };
        return { ready: true, id: source.kind === 'loser' ? (m.result === 'a' ? b.id : a.id) : (m.result === 'a' ? a.id : b.id) };
    }
    function label(t, source) {
        const value = resolve(t, source);
        if (value.id) return displayName(t, value.id);
        if (!source || value.ready) return 'Friplass';
        if (source.kind === 'qualifier') return source.place + '. plass i pulje ' + source.pool;
        return (source.kind === 'loser' ? 'Taparen' : 'Vinnaren') + ' av kamp ' + source.id;
    }
    function ready(t, m) {
        const a = resolve(t, m.a), b = resolve(t, m.b);
        return a.ready && b.ready && !!a.id && !!b.id;
    }
    function done(t, m) {
        const a = resolve(t, m.a), b = resolve(t, m.b);
        if (!a.ready || !b.ready) return false;
        if (!a.id || !b.id) return true;
        return !!m.result && (!['cup', 'bronze'].includes(m.stage) || m.result !== 'draw');
    }
    function match(t, a, b, stage, round, pool) {
        const m = { id: t.matches.length + 1, a, b, stage, round, pool: pool || null, result: null, wave: null, venue: null };
        t.matches.push(m); return m;
    }
    function standings(t, ids) {
        const rows = (ids || t.participants.map(p => p.id)).map(id => ({ id, name: displayName(t, id), played: 0, win: 0, draw: 0, loss: 0, bye: 0, points: 0 }));
        const byId = new Map(rows.map(r => [r.id, r]));
        t.matches.filter(m => !['cup', 'bronze'].includes(m.stage) && m.result).forEach(m => {
            const a = byId.get(resolve(t, m.a).id), b = byId.get(resolve(t, m.b).id);
            if (!a || !b) return;
            [a, b].forEach((r, i) => { const outcome = m.result === 'draw' ? 'draw' : (m.result === (i ? 'b' : 'a') ? 'win' : 'loss'); r.played++; r[outcome]++; r.points += t.settings[outcome]; });
        });
        t.rounds.filter(r => r.stage === 'swiss').forEach(r => (r.pauses || []).forEach(id => { const row = byId.get(id); if (row) { row.bye++; row.points += t.settings.win; } }));
        rows.sort((a, b) => b.points - a.points || t.order.indexOf(a.id) - t.order.indexOf(b.id));
        rows.forEach((r, i) => { r.place = i && r.points === rows[i - 1].points ? rows[i - 1].place : i + 1; });
        return rows;
    }
    function snapshot(t, ids) { return copy({ results: t.matches.filter(m => (ids || []).includes(m.id)).map(m => [m.id, m.result]), matchCount: t.matches.length, roundCount: t.rounds.length, qualification: t.qualification, activeWave: t.activeWave }); }
    function remember(t, ids) { t.undo.push(snapshot(t, ids)); if (t.undo.length > 20) t.undo.shift(); }
    function undo(t) {
        const state = t.undo.pop();
        if (!state) return false;
        t.matches.length = state.matchCount; t.rounds.length = state.roundCount;
        state.results.forEach(([id, result]) => { t.matches.find(m => m.id === id).result = result; });
        t.qualification = state.qualification; t.activeWave = state.activeWave;
        TS.Engine.waves(t); return true;
    }
    TS.Core = { copy, ref, formats, maxSwiss, defaults, create, participant, displayName, resolve, label, ready, done, match, standings, remember, undo };
})(typeof window === 'undefined' ? globalThis : window);
