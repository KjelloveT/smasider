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
  assert.equal(Game.current(game).cost, 4);
  assert.equal(Game.buyHint(game, 'definition').ok, false);
  assert.equal(Game.current(game).cost, 4);
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
  assert.equal(Game.current(game).cost, 4);
  Game.buyHint(game, 'chosen', 2);
  assert.equal(Game.current(game).cost, 4);
  while (Game.available(game, 'random')) Game.buyHint(game, 'random');
  assert.equal(Game.current(game).revealed.size, 6);
  assert.equal(Game.current(game).cost, 19);
  assert.equal(Game.buyHint(game, 'random').ok, false);
  assert.equal(Game.current(game).cost, 19);
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
  assert.equal(result.cost, 2);
  assert.equal(Game.advance(game), false);
});
test('kvar pris og det samla femordsresultatet er rett', () => {
  const game = Game.createRound(Array(5).fill(word), () => 0);
  for (let index = 0; index < 5; index++) {
    for (const hint of Game.HINTS) {
      if (!Game.available(game, hint.id)) continue;
      const before = Game.current(game).cost;
      assert.equal(Game.buyHint(game, hint.id, 5).ok, true);
      assert.equal(Game.current(game).cost - before, hint.price);
    }
    Game.guess(game, word.answer);
    Game.advance(game);
  }
  assert.equal(Game.summary(game).solved, 5);
  assert.equal(Game.summary(game).complete, true);
  assert.equal(Game.summary(game).cost, 5 * 18);
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
test('lagringa er avgrensa og inneheld berre oppsett og resultat', () => {
  const store = storage();
  for (let i = 0; i < 48; i++) store.api.recordResult('sett-' + i, { complete: true, solved: 5, cost: i, guesses: ['hemmeleg'] });
  const saved = store.value();
  assert.equal(Object.keys(saved.records).length, 40);
  assert.ok(!JSON.stringify(saved).includes('hemmeleg'));
  assert.equal(saved.version, 1);
  assert.equal(store.api.getRecord('sett-0'), null);
});
test('øydelagde lokale appfelt får trygge standardverdiar', () => {
  const store = storage({ version: 1, settings: { level: 'feil', setIndex: -9 }, records: { bad: { solved: 8, cost: -1 } } });
  assert.equal(store.api.getSettings().level, 'lett');
  assert.equal(store.api.getSettings().setIndex, 0);
  assert.equal(store.api.getRecord('bad'), null);
});
