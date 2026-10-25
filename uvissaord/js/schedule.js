/* Publiserte, datofesta oppgåver. Ord og oppsett ligg ferdige lokalt. */
window.OrdvettSchedule = (function () {
  'use strict';
  const DAY = 86400000, START = '2026-10-24', END = '2027-08-01';
  const LEVELS = Object.freeze([
    { id: 'lett', label: 'Lett', image: 'sprout' },
    { id: 'middels', label: 'Middels', image: 'twin-sprouts' },
    { id: 'krokut', label: 'Krokut', image: 'mountain-goat' }
  ]);
  const words = new Map(OrdvettBank.words.map(word => [word.id, word]));
  function dateKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function dateLabel(key) {
    return new Intl.DateTimeFormat('nn-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' }).format(new Date(key + 'T12:00:00Z'));
  }
  function isDate(key) { return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Date.parse(key + 'T12:00:00Z')) && new Date(key + 'T12:00:00Z').toISOString().slice(0, 10) === key; }
  function previousDay(key = dateKey()) { return new Date(Date.parse(key + 'T12:00:00Z') - DAY).toISOString().slice(0, 10); }
  function inRange(key) { return isDate(key) && key >= START && key <= END; }
  function currentDate() { const today = dateKey(); return today < START ? START : today > END ? END : today; }
  function latestArchive(today = dateKey()) { return today <= START ? null : today > END ? END : previousDay(today); }
  function daily(level, key = currentDate()) {
    if (!inRange(key) || !LEVELS.some(item => item.id === level)) throw new Error('Utfordringa finst ikkje i denne ordbanken.');
    const ids = OrdvettDays.days[key]?.[level];
    if (!ids || ids.length !== 5 || ids.some(id => !words.has(id))) throw new Error('Dagssettet manglar ord.');
    const day = (Date.parse(key) - Date.parse(START)) / DAY;
    return { date: key, level, mode: 'daily', seed: (7319 + day * 41 + LEVELS.findIndex(item => item.id === level)) >>> 0,
      key: `${OrdvettBank.bankVersion}-r${OrdvettBank.rulesVersion}-d${key}-${level}`, words: ids.map(id => words.get(id)) };
  }
  function archive(level, key, today = dateKey()) {
    if (!inRange(key) || key >= today) throw new Error('Vel ein tidlegare dag i oppgåveperioden.');
    return { ...daily(level, key), mode: 'archive' };
  }
  return Object.freeze({ START, END, LEVELS, dateKey, dateLabel, isDate, inRange, previousDay, currentDate, latestArchive, daily, archive });
})();
