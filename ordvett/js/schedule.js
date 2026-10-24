/* Same dagssett for alle i norsk tid. Kvart ord kjem éin gong per 20-dagarsbolk. */
window.OrdvettSchedule = (function () {
  'use strict';
  const DAY = 86400000;
  const epoch = Date.UTC(2026, 9, 24) / DAY;
  function dateKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function dateLabel(key) {
    return new Intl.DateTimeFormat('nn-NO', { day: 'numeric', month: 'long', timeZone: 'Europe/Oslo' }).format(new Date(key + 'T12:00:00Z'));
  }
  function daily(level, key = dateKey()) {
    const day = Date.parse(key + 'T00:00:00Z') / DAY - epoch;
    const words = OrdvettBank.words.filter(word => word.level === level);
    const count = Math.floor(words.length / 5);
    const cycle = Math.floor(day / count);
    const slot = ((day % count) + count) % count;
    const seed = (Math.imul(cycle, 2654435761) + (level === 'lett' ? 8713 : 8714)) >>> 0;
    return { date: key, level, mode: 'daily', seed: (seed + slot * 41) >>> 0,
      key: `${OrdvettBank.bankVersion}-r${OrdvettBank.rulesVersion}-d${key}-${level}`,
      words: Vy.shuffle(words, Vy.rng(seed)).slice(slot * 5, slot * 5 + 5) };
  }
  function practice(level, seed = Vy.newSeed()) {
    return { level, mode: 'practice', seed, key: null, words: Vy.shuffle(OrdvettBank.words.filter(word => word.level === level), Vy.rng(seed)).slice(0, 5) };
  }
  return Object.freeze({ dateKey, dateLabel, daily, practice });
})();
