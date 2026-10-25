/* Reproduserbar kalender. Minst 15 dagar mellom same ord, også ved bolkskifte. */
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
async function buildSchedule(root, bank) {
  const context = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(await fs.readFile(path.join(root, 'js/vyrdepil-util.js'), 'utf8'), context);
  const Vy = context.window.Vy, start = '2026-10-24', end = '2027-08-01', days = {};
  const levels = ['lett', 'middels', 'krokut'];
  for (const [levelIndex, level] of levels.entries()) {
    const ids = bank.words.filter(word => word.level === level).map(word => word.id);
    if (ids.length !== 150 || new Set(ids).size !== 150) throw new Error(`${level}: treng 150 ulike ord`);
    let used = new Map();
    const seen = new Set(), total = 1 + (Date.parse(end) - Date.parse(start)) / 86400000;
    for (let block = 0; block < total; block += 30) {
      let accepted = false;
      // Bland heile bolken på nytt dersom ein tvungen sluttgruppe liknar eit eldre sett.
      for (let attempt = 0; attempt < 1000 && !accepted; attempt++) {
        const seed = (8713 + levelIndex * 104729 + block * 7919 + Math.imul(attempt, 2654435761)) >>> 0;
        const deck = Vy.shuffle(ids, Vy.rng(seed)), draft = [], nextUsed = new Map(used), signatures = new Set();
        let valid = true;
        for (let day = block; day < Math.min(block + 30, total) && valid; day++) {
          const set = [];
          for (let slot = 0; slot < 5; slot++) {
            const index = deck.findIndex(id => !nextUsed.has(id) || day - nextUsed.get(id) >= 15);
            if (index < 0) { valid = false; break; }
            const [id] = deck.splice(index, 1); nextUsed.set(id, day); set.push(id);
          }
          const signature = set.slice().sort().join(',');
          if (seen.has(signature) || signatures.has(signature)) valid = false;
          signatures.add(signature); draft.push(set);
        }
        if (!valid) continue;
        accepted = true; used = nextUsed; signatures.forEach(signature => seen.add(signature));
        draft.forEach((set, index) => {
          const date = new Date(Date.parse(start) + (block + index) * 86400000).toISOString().slice(0, 10);
          (days[date] ||= {})[level] = set;
        });
      }
      if (!accepted) throw new Error(`Fann ikkje ulike dagssett: ${level}, dag ${block}`);
    }
  }
  const data = { app: 'ordvett', version: 1, bankVersion: bank.bankVersion, start, end, days };
  const entries = Object.entries(days).map(([date, sets]) => `  ${JSON.stringify(date)}: ${JSON.stringify(sets)}`).join(',\n');
  const head = JSON.stringify({ ...data, days: undefined }).slice(0, -1);
  await fs.writeFile(path.join(root, 'uvissaord/data/dagssett.js'),
    `/* 282 dagar, tre nivå, fem ord i kvart sett. Bygd av tools/dagssett.cjs. */\nwindow.OrdvettDays = ${head},"days":{\n${entries}\n}};\n`);
  console.log(`Bygde ${Object.keys(days).length * levels.length} dagssett (${start}–${end}).`);
  return data;
}
module.exports = { buildSchedule };
