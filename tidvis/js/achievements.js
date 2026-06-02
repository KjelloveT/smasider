/* achievements.js — merke-definisjonar, opplåsingslogikk og XP/nivå.
   Eit «merke» låsast opp éin gong og lagrast i progress.unlocked.
   XP samlast over økter; playerLevel = floor(xp / XP_PER_LEVEL) + 1. */
(function () {
  'use strict';

  const XP_PER_LEVEL = 200;
  const FAST_MS = 2500;   // terskel for «Lynrask»

  // rekkjefølgje = visingsrekkjefølgje i galleriet
  const BADGES = [
    { id: 'fyrste',   name: 'Fyrste rett',     ico: 'star',   color: 'b-pink',
      hint: 'Svar rett éin gong' },
    { id: 'streak10', name: 'Streak ×10',      ico: 'flame',  color: 'b-yellow',
      hint: '10 rette på rad' },
    { id: 'halvtime', name: 'Halvtimemeister', ico: 'clock',  color: 'b-teal',
      hint: 'Feilfri runde på «Heile & halve»' },
    { id: 'kvart',    name: 'Kvartkongen',     ico: 'crown',  color: 'b-blue',
      hint: 'Feilfri runde på «Kvart»' },
    { id: 'lynrask',  name: 'Lynrask',         ico: 'bolt',   color: 'b-purple',
      hint: 'Svar rett på under 2,5 sekund' },
    { id: 'minutt',   name: 'Minuttmeister',   ico: 'target', color: 'b-pink',
      hint: 'Klar nivå 4 utan feil' },
    { id: 'nattugle', name: 'Nattugle',        ico: 'owl',    color: 'b-teal',
      hint: 'Spel etter klokka 20' },
    { id: 'hundre',   name: 'Hundreklubben',   ico: 'medal',  color: 'b-yellow',
      hint: '100 rette totalt' }
  ];

  function badgeById(id) {
    for (let i = 0; i < BADGES.length; i++) if (BADGES[i].id === id) return BADGES[i];
    return null;
  }

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

    // merke
    const newBadges = [];
    for (let i = 0; i < BADGES.length; i++) {
      const id = BADGES[i].id;
      if (p.unlocked.indexOf(id) !== -1) continue;
      const pred = PREDICATES[id];
      if (pred && pred(p, s, ctx)) {
        p.unlocked.push(id);
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
    BADGES: BADGES,
    badgeById: badgeById,
    evaluate: evaluate,
    playerLevelFor: playerLevelFor,
    levelProgress: levelProgress,
    XP_PER_LEVEL: XP_PER_LEVEL
  };
})();
