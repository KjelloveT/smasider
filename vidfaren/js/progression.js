/* ══════════════════════════════════════════════
   VIDFAREN — Progresjon: poeng, statistikk og merke
   Tilstand via VyrdepilStorage.getGameState/setGameState('vidfaren').
   Beste runde-skår via VyrdepilStorage.saveHighScore('vidfaren').
   Mønster lånt frå heimsank/js/progression.js.
   ══════════════════════════════════════════════ */

const Progression = (function () {
  const GAME_KEY = 'vidfaren';
  const STATE_VERSION = 1;


  const rc = (s, r) => (s.stats.regionCorrect && s.stats.regionCorrect[r]) || 0;
  const PREDICATES = {
    rett10:  s => s.stats.totalCorrect >= 10,
    rett50:  s => s.stats.totalCorrect >= 50,
    rett100: s => s.stats.totalCorrect >= 100,
    rett250: s => s.stats.totalCorrect >= 250,
    rett500: s => s.stats.totalCorrect >= 500,
    hovudstadmeister: s => s.stats.capitalCorrect >= 100,
    fjellgeit:        s => s.stats.peakCorrect >= 50,
    innsjokjennar:    s => s.stats.lakeCorrect >= 50,
    silhuettsjaa:     s => s.stats.outlineCorrect >= 50,
    kartlos:          s => s.stats.pinCorrect >= 50,
    flaggkjennar:     s => s.stats.flagCorrect >= 50,
    flaggmeister:     s => s.stats.flagCorrect >= 150,
    streak10: s => s.stats.bestStreak >= 10,
    streak25: s => s.stats.bestStreak >= 25,
    plettfri:   s => s.stats.perfectRounds >= 1,
    plettfri10: s => s.stats.perfectRounds >= 10,
    vrien100: s => s.stats.correctHard >= 100,
    vrien250: s => s.stats.correctHard >= 250,
    europa:  s => rc(s, 'Europa') >= 25,
    afrika:  s => rc(s, 'Afrika') >= 25,
    asia:    s => rc(s, 'Asia') >= 25,
    amerika: s => rc(s, 'Amerika') >= 25,
    oseania: s => rc(s, 'Oseania') >= 15,
    verdsborgar: s => rc(s, 'Europa') >= 25 && rc(s, 'Afrika') >= 25 && rc(s, 'Asia') >= 25
      && rc(s, 'Amerika') >= 25 && rc(s, 'Oseania') >= 15,
    ihuga: s => s.stats.roundsPlayed >= 25
  };

  let state = null;

  function freshState() {
    return {
      version: STATE_VERSION,
      earnedTotal: 0,
      badges: [],
      stats: {
        totalCorrect: 0,
        correctHard: 0,
        capitalCorrect: 0,
        peakCorrect: 0,
        lakeCorrect: 0,
        outlineCorrect: 0,
        pinCorrect: 0,
        flagCorrect: 0,
        bestStreak: 0,
        perfectRounds: 0,
        roundsPlayed: 0,
        regionCorrect: {}
      }
    };
  }

  function load() {
    let stored = null;
    try { stored = VyrdepilStorage.getGameState(GAME_KEY); }
    catch (e) { console.error('Progression load feila:', e); }

    if (stored && stored.version) {
      state = stored;
      const fresh = freshState();
      if (!state.stats) state.stats = fresh.stats;
      // Defensiv utfylling av nye felt
      for (const k in fresh.stats) {
        if (state.stats[k] == null) state.stats[k] = fresh.stats[k];
      }
      if (!state.stats.regionCorrect) state.stats.regionCorrect = {};
      if (!Array.isArray(state.badges)) state.badges = [];
      return state;
    }
    state = freshState();
    save();
    return state;
  }

  function save() {
    try {
      VyrdepilStorage.setGameState(GAME_KEY, state);
      VyrdepilStorage.updateBragdProgress(GAME_KEY, {
        pointsEarned: state.earnedTotal,
        correctAnswers: state.stats.totalCorrect,
        roundsPlayed: state.stats.roundsPlayed,
        bestStreak: state.stats.bestStreak,
        perfectRounds: state.stats.perfectRounds
      });
    }
    catch (e) { console.error('Progression save feila:', e); }
  }

  function ensure() { if (!state) load(); return state; }

  // ---- Poeng ----
  function getEarnedTotal() { return ensure().earnedTotal; }
  function getHighScore() {
    try { return VyrdepilStorage.getHighScore(GAME_KEY) || 0; } catch (e) { return 0; }
  }

  // ---- Registrering ----
  const MODE_STAT = {
    hovudstad: 'capitalCorrect', fjell: 'peakCorrect', innsjo: 'lakeCorrect',
    omriss: 'outlineCorrect', pin: 'pinCorrect', flagg: 'flagCorrect'
  };

  /** Registrer eitt rett svar. Lagrar ikkje (vent til runde-slutt). */
  function recordCorrect({ mode, level, region }) {
    ensure();
    state.stats.totalCorrect += 1;
    if (level === 'middels' || level === 'vanskeleg') state.stats.correctHard += 1;
    const key = MODE_STAT[mode];
    if (key) state.stats[key] += 1;
    if (region) {
      state.stats.regionCorrect[region] = (state.stats.regionCorrect[region] || 0) + 1;
    }
  }

  function noteStreak(streak) {
    ensure();
    if (streak > state.stats.bestStreak) state.stats.bestStreak = streak;
  }

  /** Avslutt ein runde: legg til skår, tel runde, lagre høgaste. */
  function finishRound({ score, correct, total }) {
    ensure();
    state.stats.roundsPlayed += 1;
    if (total > 0 && correct === total) state.stats.perfectRounds += 1;
    state.earnedTotal += score;
    let record = false;
    try { record = VyrdepilStorage.saveHighScore(GAME_KEY, score); } catch (e) {}
    save();
    return { record };
  }

  // ---- Merke ----
  function getEarnedBadges() {
    const legacy = Array.isArray(ensure().badges) ? state.badges : [];
    try {
      const shared = VyrdepilStorage.getBragdData().badges[GAME_KEY] || [];
      return new Set(legacy.concat(shared));
    } catch (error) {
      return new Set(legacy);
    }
  }

  function hasBadge(id) { return getEarnedBadges().has(id); }

  /** Evaluer alle merke; returner nye som vart oppnådde. */
  function evaluate() {
    ensure();
    const earned = [];
    const alreadyEarned = getEarnedBadges();
    for (const id of Object.keys(PREDICATES)) {
      if (alreadyEarned.has(id)) continue;
      const pred = PREDICATES[id];
      if (pred && pred(state)) {
        earned.push(id);
      }
    }
    return earned;
  }

  function getStats() { return ensure().stats; }

  return {
    load, save,
    getEarnedTotal, getHighScore, getStats,
    recordCorrect, noteStreak, finishRound,
    hasBadge, evaluate
  };
})();

if (typeof window !== 'undefined') window.Progression = Progression;
