const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function load(files, extra = {}) {
  const context = { window: {}, document: { addEventListener() {} }, ...extra };
  vm.createContext(context);
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context));
  return context;
}
const context = load(['ordvett/data/ordbank.js', 'ordvett/js/game.js', 'js/vyrdepil-util.js']);
const Game = context.window.OrdvettGame;
const Bank = context.window.OrdvettBank;
const Vy = context.window.Vy;
const word = Bank.words.find(item => item.answer === 'sykkel');
const round = () => Game.createRound([word], () => 0);

test('200 kjeldemerka ord, 20 heile sett på kvart nivå og ingen svar i hinta', () => {
  assert.equal(Bank.words.length, 200);
  assert.equal(new Set(Bank.words.map(item => item.id)).size, 200);
  for (const level of ['lett', 'utfordring']) assert.equal(Bank.words.filter(item => item.level === level).length, 100);
  for (const item of Bank.words) {
    assert.ok(item.grammar && item.inflections.length && Game.POS[item.pos], item.answer);
    assert.ok(Number.isInteger(item.source.articleId) && Number.isInteger(item.source.senseId), item.answer);
    assert.match(item.source.url, /^https:\/\/ordbokene\.no\/nn\/\d+$/);
    assert.equal((item.sentence.match(/___/g) || []).length, 1, item.answer);
    for (const key of ['usage', 'definition', 'sentence']) {
      const tokens = Game.normalize(item[key]).split(/[^\p{L}]+/u);
      for (const form of [item.answer, ...item.alternatives]) assert.ok(!tokens.includes(Game.normalize(form)), `${item.answer}: ${key} røper ${form}`);
    }
  }
});
test('betalte eingongshint blir trekte éin gong og kjøpet blir teke vare på', () => {
  const game = round();
  assert.equal(Game.buyHint(game, 'definition').ok, true);
  assert.equal(Game.current(game).cost, 8);
  assert.equal(Game.buyHint(game, 'definition').ok, false);
  assert.equal(Game.current(game).cost, 8);
  assert.equal(Game.current(game).purchases.length, 1);
});
test('grammatikkhintet gjer ordklassehintet overflødig utan eit nytt trekk', () => {
  const game = round();
  Game.buyHint(game, 'grammar');
  assert.equal(Game.available(game, 'pos'), false);
  Game.buyHint(game, 'pos');
  assert.equal(Game.current(game).cost, 1);
  const verb = Game.createRound([Bank.words.find(item => item.answer === 'lese')]);
  Game.buyHint(verb, 'pos');
  assert.equal(Game.available(verb, 'grammar'), false);
});
test('bokstavkjøp avdekkjer nye ruter og eit ugyldig val kostar ingenting', () => {
  const game = round();
  assert.equal(Game.buyHint(game, 'chosen', -1).ok, false);
  assert.equal(Game.current(game).cost, 0);
  Game.buyHint(game, 'chosen', 2);
  assert.equal(Game.current(game).cost, 5);
  Game.buyHint(game, 'chosen', 2);
  assert.equal(Game.current(game).cost, 5);
  while (Game.available(game, 'random')) Game.buyHint(game, 'random');
  assert.equal(Game.current(game).revealed.size, 6);
  assert.equal(Game.current(game).cost, 15);
  assert.equal(Game.buyHint(game, 'random').ok, false);
  assert.equal(Game.current(game).cost, 15);
});
test('tomme og normaliserte gjentekne svar blir ikkje trekte fleire gonger', () => {
  const game = round();
  Game.guess(game, '  ');
  assert.equal(Game.current(game).cost, 0);
  Game.guess(game, 'FEIL');
  Game.guess(game, ' feil ');
  assert.equal(Game.current(game).cost, 2);
  Game.guess(game, 'anna');
  assert.equal(Game.current(game).cost, 4);
});
test('riktig svar toler store bokstavar og omgjevande mellomrom', () => {
  const game = round();
  assert.equal(Game.guess(game, ' SYKKEL ').ok, true);
  assert.equal(Game.summary(game).solved, 1);
  assert.equal(Game.summary(game).cost, 0);
  assert.equal(Game.buyHint(game, 'usage').ok, false);
  assert.equal(Game.guess(game, 'feil').ok, false);
  assert.equal(Game.summary(game).cost, 0);
});
test('normerte infinitivsvariantar blir godtekne, bokstavhint brukar vald form', () => {
  const verb = Bank.words.find(item => item.answer === 'byggje');
  assert.ok(verb.alternatives.includes('byggja'));
  const game = Game.createRound([verb]);
  assert.equal(Game.guess(game, 'byggja').ok, true);
  const noun = Bank.words.find(item => item.answer === 'båt');
  assert.equal(Game.guess(Game.createRound([noun]), 'ba\u030at').ok, true);
  assert.equal(Game.guess(Game.createRound([noun]), 'bat').ok, false);
});
test('fasit gjev uløyst oppgåve og ein kan ikkje hoppe over eit pågåande ord', () => {
  const game = Game.createRound([word, word]);
  assert.equal(Game.advance(game), false);
  Game.buyHint(game, 'usage');
  Game.reveal(game);
  assert.equal(Game.current(game).outcome, 'revealed');
  assert.equal(Game.advance(game), true);
  Game.guess(game, word.answer);
  const result = Game.summary(game);
  assert.equal(result.complete, true);
  assert.equal(result.solved, 1);
  assert.equal(result.cost, 8);
  assert.equal(Game.advance(game), false);
});
test('dei avtalte hintprisane blir trekte frå same pott', () => {
  const prices = { pos: 1, grammar: 1, theme: 3, length: 2, random: 2, chosen: 5, usage: 8, sentence: 8, definition: 8 };
  for (const hint of Game.HINTS) {
    const game = round();
    const result = Game.buyHint(game, hint.id, hint.id === 'chosen' ? 4 : undefined);
    assert.equal(result.ok, true);
    assert.equal(result.price, prices[hint.id]);
    assert.equal(Game.summary(game).remaining, 40 - prices[hint.id]);
  }
  const game = Game.createRound(Array(5).fill(word));
  for (let i = 0; i < 5; i++) { Game.buyHint(game, 'pos'); Game.guess(game, word.answer); Game.advance(game); }
  assert.equal(Game.summary(game).cost, 5);
  assert.equal(Game.summary(game).solved, 5);
  assert.equal(Game.summary(game).remaining, 35);
});
test('faste sett dekkjer heile banken utan gjentaking og held same rekkje', () => {
  for (const [index, level] of ['lett', 'utfordring'].entries()) {
    const words = Bank.words.filter(item => item.level === level);
    const a = Vy.shuffle(words, Vy.rng(8713 + index)).map(item => item.id);
    const b = Vy.shuffle(words, Vy.rng(8713 + index)).map(item => item.id);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(new Set(a).size, 100);
  }
});
function storage(raw = null) {
  let saved = raw;
  const api = { getGameState: () => saved, setGameState: (name, value) => { assert.equal(name, 'ordvett'); saved = JSON.parse(JSON.stringify(value)); } };
  const result = load(['ordvett/js/storage.js'], { VyrdepilStorage: api });
  return { api: result.window.OrdvettStorage, value: () => saved };
}
test('rekordar føretrekkjer fleire løyste ord før lågare kostnad', () => {
  const store = storage();
  assert.equal(store.api.recordResult('sett', { complete: false, solved: 5, cost: 0 }), false);
  assert.equal(store.api.recordResult('sett', { complete: true, solved: 3, cost: 2 }), true);
  assert.equal(store.api.recordResult('sett', { complete: true, solved: 2, cost: 0 }), false);
  assert.equal(store.api.recordResult('sett', { complete: true, solved: 4, cost: 50 }), true);
  assert.equal(store.api.recordResult('sett', { complete: true, solved: 4, cost: 40 }), true);
  assert.equal(store.api.recordResult('sett', { complete: true, solved: 4, cost: 40 }), false);
});
test('resultatlagringa er avgrensa og forkastar ekstra felt', () => {
  const store = storage();
  for (let i = 0; i < 48; i++) store.api.recordResult('sett-' + i, { complete: true, solved: 5, cost: i, guesses: ['hemmeleg'] });
  const saved = store.value();
  assert.equal(Object.keys(saved.records).length, 40);
  assert.ok(!JSON.stringify(saved).includes('hemmeleg'));
  assert.equal(saved.version, 3);
  assert.equal(store.api.getRecord('sett-0'), null);
});
test('øydelagde lokale appfelt får trygge standardverdiar', () => {
  const store = storage({ version: 1, settings: { level: 'feil', setIndex: -9 }, records: { bad: { solved: 8, cost: -1 } } });
  assert.equal(store.api.getSettings().level, 'lett');
  assert.equal(store.api.getSettings().setIndex, 0);
  assert.equal(store.api.getRecord('bad'), null);
});

const scheduleContext = load(['ordvett/js/schedule.js'], { OrdvettBank: Bank, Vy });
const Schedule = scheduleContext.window.OrdvettSchedule;
const dateAfter = offset => new Date(Date.UTC(2026, 9, 24 + offset)).toISOString().slice(0, 10);

test('dagssett skiftar ved norsk midnatt og toler skifte til vintertid', () => {
  assert.equal(Schedule.dateKey(new Date('2026-10-24T21:59:59Z')), '2026-10-24');
  assert.equal(Schedule.dateKey(new Date('2026-10-24T22:00:00Z')), '2026-10-25');
  assert.equal(Schedule.dateKey(new Date('2026-10-25T22:59:59Z')), '2026-10-25');
  assert.equal(Schedule.dateKey(new Date('2026-10-25T23:00:00Z')), '2026-10-26');
});
test('alle får same dagssett, utan gjentaking i ein 20-dagarsbolk', () => {
  for (const level of ['lett', 'utfordring']) {
    const ids = [];
    for (let index = 0; index < 20; index++) {
      const a = Schedule.daily(level, dateAfter(index));
      const b = Schedule.daily(level, dateAfter(index));
      assert.equal(a.words.length, 5);
      assert.equal(JSON.stringify(a), JSON.stringify(b));
      ids.push(...a.words.map(word => word.id));
    }
    assert.equal(new Set(ids).size, 100);
    assert.notEqual(JSON.stringify(Schedule.daily(level, dateAfter(0)).words), JSON.stringify(Schedule.daily(level, dateAfter(20)).words));
  }
  assert.notEqual(Schedule.daily('lett', dateAfter(0)).key, Schedule.daily('lett', dateAfter(1)).key);
  assert.notEqual(Schedule.daily('lett', dateAfter(0)).key, Schedule.daily('utfordring', dateAfter(0)).key);
});
test('fri øving trekkjer fem ulike ord frå rett nivå', () => {
  const a = Schedule.practice('lett', 100), b = Schedule.practice('lett', 101);
  assert.equal(new Set(a.words.map(word => word.id)).size, 5);
  assert.ok(a.words.every(word => word.level === 'lett'));
  assert.equal(a.key, null);
  assert.notEqual(JSON.stringify(a.words), JSON.stringify(b.words));
});
test('dagsframgang gjenopprettar kjøp, ruter, kostnad og gjentekne feil utan svartekst', () => {
  const words = Bank.words.filter(word => word.level === 'lett').slice(0, 5);
  const game = Game.createRound(words, Vy.rng(18));
  Game.buyHint(game, 'random'); Game.buyHint(game, 'definition');
  Game.guess(game, 'eit hemmeleg feilord'); Game.guess(game, words[0].answer); Game.advance(game);
  Game.buyHint(game, 'chosen', 1); Game.guess(game, 'eit anna feilord');
  const snapshot = JSON.parse(JSON.stringify(Game.pack(game)));
  assert.ok(!JSON.stringify(snapshot).includes('feilord'));
  assert.ok(!JSON.stringify(snapshot).includes(words[0].definition));
  const restored = Game.restore(words, snapshot, Vy.rng(18));
  assert.ok(restored);
  assert.equal(JSON.stringify(Game.summary(restored)), JSON.stringify(Game.summary(game)));
  assert.equal(restored.index, 1);
  assert.equal(JSON.stringify([...restored.questions[0].revealed]), JSON.stringify([...game.questions[0].revealed]));
  assert.equal(Game.guess(restored, ' EIT ANNA FEILORD ').status, 'repeat');
  assert.equal(Game.summary(restored).cost, Game.summary(game).cost);
  const freshRandom = Game.buyHint(game, 'random'), restoredRandom = Game.buyHint(restored, 'random');
  assert.equal(restoredRandom.position, freshRandom.position);
});
test('ugyldige dagsdata blir avviste utan å hoppe over ord eller betale for same rute', () => {
  const words = Bank.words.slice(0, 5);
  const valid = Game.pack(Game.createRound(words));
  for (const edit of [
    data => { data.index = 9; },
    data => { data.questions[0].wordId = 'anna'; },
    data => { data.questions[2].outcome = 'solved'; },
    data => { data.questions[0].guesses = ['rå svartekst']; },
    data => { data.questions[0].purchases = [{ id: 'chosen', position: 0 }, { id: 'chosen', position: 0 }]; }
  ]) {
    const data = JSON.parse(JSON.stringify(valid)); edit(data);
    assert.equal(Game.restore(words, data), null);
  }
});
test('fullført dagsrunde blir ståande, medan 40 rundar og 40 resultat blir lagra', () => {
  const store = storage(), words = Bank.words.slice(0, 5);
  const completed = Game.createRound(words);
  for (const word of words) { Game.guess(completed, word.answer); Game.advance(completed); }
  store.api.saveDaily('dag-0', Game.pack(completed), Game.summary(completed));
  const first = JSON.stringify(store.api.getDaily('dag-0'));
  const fresh = Game.createRound(words);
  store.api.saveDaily('dag-0', Game.pack(fresh), Game.summary(fresh));
  assert.equal(JSON.stringify(store.api.getDaily('dag-0')), first);
  for (let index = 1; index < 48; index++) store.api.saveDaily('dag-' + index, Game.pack(fresh), Game.summary(fresh));
  assert.equal(Object.keys(store.value().daily).length, 40);
  assert.equal(store.api.getDaily('dag-0'), null);
  assert.equal(store.api.getRecord('dag-0').solved, 5);
});
test('versjon 1 blir oppgradert idempotent utan å endre kjeldedata eller miste resultat', () => {
  const legacy = { version: 1, settings: { level: 'utfordring', setIndex: 8 }, records: { gammalt: { solved: 4, cost: 12 } } };
  const before = JSON.stringify(legacy), store = storage(legacy);
  assert.equal(store.api.getSettings().mode, 'daily');
  store.api.setSettings(store.api.getSettings());
  const migrated = JSON.stringify(store.value());
  assert.equal(store.value().version, 3);
  assert.equal(store.api.getRecord('gammalt').cost, 12);
  store.api.setSettings(store.api.getSettings());
  assert.equal(JSON.stringify(store.value()), migrated);
  assert.equal(JSON.stringify(legacy), before);
});

test('ein bokstavplass som ikkje finst kostar 5, utan å røpe den rette lengda', () => {
  const short = Bank.words.find(word => word.answer === 'båt'), game = Game.createRound([short]);
  assert.equal(Game.known(game, 'length'), false);
  const result = Game.buyHint(game, 'chosen', 4);
  assert.equal(result.ok, true); assert.equal(result.price, 5);
  assert.match(result.message, /ingen bokstav på plass 5/);
  assert.equal(Game.current(game).misses.has(4), true);
  assert.equal(Game.current(game).revealed.size, 0);
  assert.equal(Game.known(game, 'length'), false);
  assert.equal(Game.buyHint(game, 'chosen', 4).ok, false);
  assert.equal(Game.summary(game).cost, 5);
  const restored = Game.restore([short], JSON.parse(JSON.stringify(Game.pack(game))));
  assert.equal(restored.questions[0].misses.has(4), true);
  assert.equal(Game.summary(restored).cost, 5);
});
test('tema og ordlengd er eigne eingongskjøp', () => {
  const game = round();
  assert.equal(Game.known(game, 'theme'), false);
  assert.equal(Game.known(game, 'length'), false);
  Game.buyHint(game, 'theme'); Game.buyHint(game, 'length');
  assert.equal(Game.known(game, 'theme'), true);
  assert.equal(Game.known(game, 'length'), true);
  assert.equal(Game.current(game).purchases[1].text, '6 bokstavar');
  assert.equal(Game.buyHint(game, 'length').ok, false);
  assert.equal(Game.summary(game).cost, 5);
});
test('hint og feil svar kan aldri trekkje meir enn 40 myntar over fem ord', () => {
  const game = Game.createRound(Array(5).fill(word));
  Game.buyHint(game, 'usage'); Game.buyHint(game, 'sentence'); Game.buyHint(game, 'definition');
  Game.buyHint(game, 'chosen', 29); Game.buyHint(game, 'pos');
  for (let i = 0; i < 5; i++) Game.guess(game, 'nytt-feil-' + i);
  assert.equal(Game.summary(game).cost, 40);
  assert.equal(Game.available(game, 'random'), false);
  assert.equal(Game.buyHint(game, 'random').status, 'funds');
  assert.equal(Game.guess(game, word.answer).status, 'funds');
  for (let i = 0; i < 5; i++) { Game.reveal(game); Game.advance(game); }
  assert.equal(Game.summary(game).cost, 40);
  assert.equal(Game.summary(game).complete, true);
  assert.ok(Game.restore(Array(5).fill(word), JSON.parse(JSON.stringify(Game.pack(game)))));
  const wrong = round();
  for (let i = 0; i < 25; i++) Game.guess(wrong, 'feil-' + i);
  assert.equal(Game.summary(wrong).cost, 40);
  assert.equal(Game.current(wrong).guesses.size, 20);
});

test('arkivet validerer datoar og brukar det same datofesta settet som dagsrunden', () => {
  assert.equal(Schedule.isDate('2026-02-30'), false);
  assert.equal(Schedule.isDate('2024-02-29'), true);
  assert.equal(Schedule.previousDay('2026-03-01'), '2026-02-28');
  assert.equal(Schedule.previousDay('2024-03-01'), '2024-02-29');
  const archived = Schedule.archive('lett', '2026-10-23', '2026-10-24');
  assert.equal(archived.mode, 'archive');
  assert.equal(JSON.stringify(archived.words), JSON.stringify(Schedule.daily('lett', '2026-10-23').words));
  assert.throws(() => Schedule.archive('lett', '2026-10-24', '2026-10-24'));
  assert.throws(() => Schedule.archive('lett', '2026-10-25', '2026-10-24'));
  assert.throws(() => Schedule.archive('lett', '2026-02-30', '2026-10-24'));
});
test('arkivdato, kalenderstatus og påbyrja 30-myntsdata blir førte trygt vidare', () => {
  const words = Bank.words.slice(0, 5), game = Game.createRound(words);
  Game.buyHint(game, 'definition'); Game.guess(game, 'feil');
  const snapshot = JSON.parse(JSON.stringify(Game.pack(game)));
  const old = { app: 'ordvett', version: 2, settings: { level: 'lett', mode: 'practice' }, records: {}, daily: { 'bank-r3-d2026-10-23-lett': snapshot } };
  const before = JSON.stringify(old), store = storage(old);
  assert.equal(store.api.getSettings().mode, 'daily');
  const carried = store.api.getDaily('bank-r4-d2026-10-23-lett');
  assert.equal(JSON.stringify(carried), JSON.stringify(snapshot));
  const restored = Game.restore(words, carried);
  assert.equal(Game.summary(restored).remaining, 30);
  store.api.setSettings({ level: 'lett', mode: 'archive', archiveDate: '2026-10-23' });
  store.api.saveDaily('bank-r4-d2026-10-23-lett', snapshot, Game.summary(restored));
  assert.equal(store.value().version, 3);
  assert.equal(store.api.getSettings().archiveDate, '2026-10-23');
  assert.equal(store.api.dayStatuses(['bank-r4-d2026-10-23-lett'])['bank-r4-d2026-10-23-lett'], 'started');
  assert.equal(JSON.stringify(old), before);
});
test('alle 20 feil kan gjenopprettast når 40-myntpotten er brukt opp', () => {
  const game = round();
  for (let i = 0; i < 20; i++) Game.guess(game, 'feil-' + i);
  const restored = Game.restore([word], JSON.parse(JSON.stringify(Game.pack(game))));
  assert.ok(restored); assert.equal(Game.summary(restored).remaining, 0);
  assert.equal(Game.guess(restored, 'ny feil').status, 'funds');
});