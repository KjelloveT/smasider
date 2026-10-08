/* achievements.js — bragdvilkår, opplåsingslogikk og XP/nivå.
   Bragdane blir registrerte i den felles VyrdepilStorage-samlinga.
   XP samlast over økter; playerLevel = floor(xp / XP_PER_LEVEL) + 1. */
(function () {
  'use strict';

  const XP_PER_LEVEL = 200;
  const FAST_MS = 2500;   // terskel for «Lynrask»

  function playerLevelFor(xp) {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
  }

  // framdrift mot neste nivå: { level, into, need, frac }
  function levelProgress(xp) {
    const level = playerLevelFor(xp);
    const into = xp - (level - 1) * XP_PER_LEVEL;
    return { level: level, into: into, need: XP_PER_LEVEL, frac: into / XP_PER_LEVEL };
  }

  // predikatar — får (progress etter oppdatert statistikk, session, ctx)
  const PREDICATES = {
    fyrste:   function (p) { return p.stats.totalCorrect >= 1; },
    streak10: function (p) { return p.stats.bestStreak >= 10; },
    halvtime: function (p, s, c) { return c.clean && s.level === 0; },
    kvart:    function (p, s, c) { return c.clean && s.level === 1; },
    lynrask:  function (p, s) { return s.fastest != null && s.fastest < FAST_MS; },
    minutt:   function (p) { return p.stats.level4Clean === true; },
    nattugle: function (p, s, c) { return c.hour >= 20 || c.hour < 5; },
    hundre:   function (p) { return p.stats.totalCorrect >= 100; }
  };

  // Oppdater progress med resultatet av ei fullført økt.
  // Muterer ikkje argumentet; returnerer { progress, newBadges, leveledUp, fromLevel, toLevel }.
  function evaluate(progress, session) {
    const p = JSON.parse(JSON.stringify(progress));
    const s = session;

    const clean = s.answeredCount > 0 && s.correctCount === s.answeredCount;
    const ctx = { clean: clean, hour: new Date().getHours() };

    // statistikk
    p.stats.totalCorrect += s.correctCount;
    p.stats.totalAnswered += s.answeredCount;
    p.stats.gamesPlayed += 1;
    if (s.bestStreak > p.stats.bestStreak) p.stats.bestStreak = s.bestStreak;
    if (s.fastest != null && (p.stats.fastest == null || s.fastest < p.stats.fastest)) {
      p.stats.fastest = s.fastest;
    }
    if (clean && s.level === 3) p.stats.level4Clean = true;

    // XP / nivå
    const fromLevel = playerLevelFor(p.xp);
    p.xp += s.xp;
    const toLevel = playerLevelFor(p.xp);

    // Bragder
    const newBadges = [];
    const alreadyEarned = new Set(Array.isArray(progress.unlocked) ? progress.unlocked : []);
    try {
      const stored = VyrdepilStorage.getBragdData().badges.tidvis || [];
      stored.forEach(function (id) { alreadyEarned.add(id); });
    } catch (error) {
      // Legacy-lista held evalueringa trygg dersom felleslagringa ikkje er tilgjengeleg.
    }
    for (const id of Object.keys(PREDICATES)) {
      if (alreadyEarned.has(id)) continue;
      const pred = PREDICATES[id];
      if (pred && pred(p, s, ctx)) {
        newBadges.push(id);
      }
    }

    return {
      progress: p,
      newBadges: newBadges,
      leveledUp: toLevel > fromLevel,
      fromLevel: fromLevel,
      toLevel: toLevel
    };
  }

  window.TidvisAchievements = {
    evaluate: evaluate,
    playerLevelFor: playerLevelFor,
    levelProgress: levelProgress,
    XP_PER_LEVEL: XP_PER_LEVEL
  };
})();
