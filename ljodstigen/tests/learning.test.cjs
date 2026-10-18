'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = path.join(__dirname, '..');
function setup() {
  let stored;
  const c = { window: null, Date, URLSearchParams, console,
    Vy: { shuffle: arr => arr.slice() },
    document: { readyState: 'loading', addEventListener() {} }, addEventListener() {},
    VyrdepilStorage: { getGameState: () => stored, setGameState: (_, s) => { stored = structuredClone(s); } } };
  c.window = c; vm.createContext(c);
  for (const name of ['letters', 'words', 'reading-data', 'adaptive', 'progress', 'learning', 'state', 'main']) {
    vm.runInContext(fs.readFileSync(path.join(app, 'js', name + '.js'), 'utf8'), c);
  }
  c.LjodMerke = { noteAnswer() {} };
  return c;
}
test('treige rette svar gir kunnskapsframgang, utan å blande ulike handlingar', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel');
  c.LjodMain.applyResult(p, { ch: 's', correct: true, latencyMs: 19000 }, 'lydfangst');
  assert.equal(p.adaptive.items.s.box, 1);
  c.LjodMain.applyResult(p, { ch: 's', correct: true, latencyMs: 500 }, 'bokstavropet');
  assert.equal(p.adaptive.items.s.box, 1);
  assert.equal(c.LjodLearning.get(p, 'listen', 's').independent, 1);
  assert.equal(c.LjodLearning.get(p, 'sound', 's').independent, 1);
  c.LjodMain.applyResult(p, { skill: 'build', target: 'sal', correct: true, letters: [{ ch: 's', correct: true }] }, 'ordbyggjar');
  assert.equal(p.adaptive.items.s.box, 1);
  assert.equal(c.LjodLearning.get(p, 'build', 'sal').independent, 1);
  c.LjodMain.applyResult(p, { ch: 's', correct: true, helped: true }, 'lydfangst');
  assert.equal(p.adaptive.items.s.box, 1);
  assert.equal(c.LjodLearning.get(p, 'listen', 's').helped, 1);
});
test('eigenrapport er berre øving; vaksenlytta lesing og seinare gjenkalling blir skilde', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel'), L = c.LjodLearning;
  L.start(p); L.record(p, 'read', 'lam', { correct: true });
  assert.equal(L.get(p, 'read', 'lam').independent, 0);
  L.record(p, 'read', 'lam', { correct: true, adult: true });
  assert.equal(L.get(p, 'read', 'lam').adult, 1);
  L.record(p, 'read', 'lam', { correct: true, adult: true });
  assert.equal(L.get(p, 'read', 'lam').later, 0);
  L.start(p); L.record(p, 'read', 'lam', { correct: true, adult: true });
  assert.equal(L.get(p, 'read', 'lam').later, 1);
  L.record(p, 'read', 'lam', { correct: true, adult: true, helped: true });
  assert.equal(L.get(p, 'read', 'lam').adult, 3);
});
test('migrering er idempotent, bevarer gamle tre og tener ikkje nye bevis frå gamle data', () => {
  const c = setup(), S = c.LjodState;
  const original = { app: 'ljodstigen', version: 2, profiles: [{ id: 'old', avatar: 'firkant', adaptive: { step: 4, items: { s: { box: 3, maxBox: 5, right: 28 } } }, badges: ['spire'] }], lastProfile: 'old' };
  const before = JSON.stringify(original);
  c.VyrdepilStorage.setGameState('ljodstigen', original);
  const next = S.read();
  assert.equal(next.profiles[0].adaptive.items.s.maxBox, 5);
  assert.equal(Object.keys(next.profiles[0].learning.items).length, 0);
  S.write(next); const once = JSON.stringify(S.read()); S.write(S.read());
  assert.equal(JSON.stringify(S.read()), once);
  assert.equal(JSON.stringify(original), before);
});
test('ng opnar etter nødvendige grunnlydar, før dei sjeldne alfabetbokstavane', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel');
  p.adaptive.step = 4;
  c.LjodLetters.upTo(4).forEach(ch => { p.adaptive.items[ch] = { ...c.LjodAdaptive.item(p.adaptive, ch), maxBox: 3 }; });
  assert.equal(c.LjodProgress.available(p, 6), true);
  assert.equal(c.LjodProgress.summary(p).current, 6);
  assert.equal(p.adaptive.items.q, undefined);
  delete p.adaptive.items.r;
  assert.equal(c.LjodProgress.available(p, 6), false);
});
test('ordutvalet går vidare til lengre ord, og nye ord/tulleord er berre for lesing', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel'), L = c.LjodLearning;
  p.adaptive.step = 5;
  c.LjodLetters.ALPHABET.forEach(ch => { p.adaptive.items[ch] = { ...c.LjodAdaptive.item(p.adaptive, ch), maxBox: 3 }; });
  assert.equal(L.words(p, 'build').some(w => w.len === 4), false);
  ['lam', 'sal', 'mas', 'ras'].forEach(w => L.record(p, 'build', w, { correct: true }));
  assert.equal(L.words(p, 'build').some(w => w.len === 4), true);
  assert.equal(L.words(p, 'build').some(w => w.kind === 'nonword'), false);
  assert.equal(L.words(p, 'read').some(w => w.kind === 'nonword'), true);
  assert.equal(L.words(p, 'build').some(w => !w.clean), false);
  const manifest = JSON.parse(fs.readFileSync(path.join(app, 'lyd/manifest.json'))).banks;
  L.PILOT.forEach(text => {
    assert.ok(manifest.ord['o_' + text], text);
    c.LjodWords.byText(text).letters.forEach(ch => assert.ok(manifest.fonem['f_' + ch], ch));
  });
});
test('lagringa er avgrensa og ugyldige nøklar blir ikkje tekne inn', () => {
  const c = setup(), L = c.LjodLearning;
  const raw = { version: 1, session: -10, items: { 'read:<script>': { independent: 100 }, 'listen:s': { attempts: -5, independent: 2, introduced: true } } };
  const s = L.hydrate(raw);
  assert.equal(s.session, 0); assert.equal(Object.keys(s.items).length, 1);
  assert.equal(s.items['listen:s'].attempts, 0);
  const p = c.LjodState.createProfile('sirkel');
  for (let i = 0; i < 450; i++) L.record(p, 'build', 'a' + 'b'.repeat(Math.floor(i / 26)) + String.fromCharCode(97 + i % 26), { correct: false });
  assert.ok(Object.keys(p.learning.items).length <= 400);
});

test('tre kjende bokstavar opnar ikkje ei tom Ordbryggje', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel');
  ['a', 'o', 'r'].forEach(ch => { c.LjodAdaptive.item(p.adaptive, ch).maxBox = 3; });
  assert.equal(c.LjodLearning.words(p, 'build').length, 0);
  assert.equal(c.LjodAdaptive.unlockedModes(p.adaptive).some(m => m.id === 'ordbyggjar'), false);
  ['l', 'm'].forEach(ch => { c.LjodAdaptive.item(p.adaptive, ch).maxBox = 3; });
  assert.equal(c.LjodAdaptive.unlockedModes(p.adaptive).some(m => m.id === 'ordbyggjar'), true);
});

test('fullført lesesteg står ved lag uavhengig av rekkjefølgja', () => {
  const c = setup(), p = c.LjodState.createProfile('sirkel');
  const level = c.LjodReading.LEVELS[1];
  level.items.forEach(item => {
    c.LjodProgress.record(p, level.number, item.id, true);
    c.LjodProgress.record(p, level.number, item.id, true);
  });
  const summary = c.LjodProgress.summary(p);
  assert.equal(summary.completed, 1);
  assert.equal(summary.levels[6].done, true);
  assert.equal(summary.levels[0].done, false);
  assert.equal(c.LjodProgress.available(p, 7), true);
  assert.equal(summary.current, 1);
});
