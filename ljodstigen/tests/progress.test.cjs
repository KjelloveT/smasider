'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL, fileURLToPath } = require('node:url');
const app = path.join(__dirname, '..');
const context = { window: null, Vy: { shuffle: list => list.slice() }, Date, URLSearchParams };
context.window = context;
let stored = null;
context.VyrdepilStorage = { getGameState: () => stored, setGameState: (_, value) => { stored = value; } };
vm.createContext(context);
for (const name of ['letters', 'reading-data', 'adaptive', 'progress', 'state']) {
  vm.runInContext(fs.readFileSync(path.join(app, 'js', name + '.js'), 'utf8'), context);
}
const { LjodLetters: L, LjodReading: D, LjodProgress: P, LjodState: S, LjodAdaptive: A } = context;
function profile() { return { id: 'test', adaptive: A.newState(), reading: P.hydrate(null) }; }
function lettersDone(p) {
  p.adaptive.step = 5;
  L.ALPHABET.forEach(ch => { p.adaptive.items[ch] = { ...A.item(p.adaptive, ch), box: 3, maxBox: 3 }; });
}

test('ny profil, gamle profilar og idempotent lagring', () => {
  assert.equal(P.summary(profile()).percent, 0);
  const old = { id: 'old', avatar: 'sirkel', adaptive: { step: 4, items: { s: { box: 4, maxBox: 5, right: 12 } } }, badges: ['spire'], counters: { wordsBuilt: 10 } };
  stored = { version: 1, profiles: [old], lastProfile: 'old', voice: 'vyrde' };
  const hydrated = S.read();
  assert.equal(hydrated.profiles[0].adaptive.items.s.maxBox, 5);
  assert.equal(hydrated.profiles[0].counters.wordsBuilt, 10);
  assert.equal(hydrated.profiles[0].badges[0], 'spire');
  assert.equal(P.summary(hydrated.profiles[0]).completed, 3);
  S.write(hydrated);
  const once = JSON.stringify(S.read());
  S.write(S.read());
  assert.equal(JSON.stringify(S.read()), once);
  assert.equal(stored.version, 3);
});

test('Mose er standard éin gong, medan eit tidlegare figurval og framsteg blir verande', () => {
  stored = null;
  const mose = S.currentProfile();
  assert.equal(mose.avatar, 'sirkel');
  assert.equal(S.currentProfile().id, mose.id);
  assert.equal(S.read().profiles.length, 1);
  assert.equal(S.read().lastProfile, mose.id);

  stored = { profiles: [
    { id: 'mose', avatar: 'sirkel' },
    { id: 'glimt', avatar: 'firkant', adaptive: { step: 4, items: { s: { maxBox: 5, right: 12 } } } }
  ], lastProfile: 'glimt', font: 'system' };
  const chosen = S.currentProfile();
  assert.equal(chosen.id, 'glimt');
  assert.equal(chosen.adaptive.step, 4);
  assert.equal(chosen.adaptive.items.s.right, 12);
  assert.equal(S.read().font, 'lesefont');
  S.write({ ...S.read(), font: 'system' });
  assert.equal(stored.font, 'lesefont');
  assert.equal(S.currentProfile().id, 'glimt');
});

test('øving på eit valt bokstavsteg held alle alternativa i steget utan å flytte nivået', () => {
  const state = A.newState();
  const pool = L.STEPS[4];
  for (let i = 0; i < 30; i++) {
    const question = A.pick(state, { pool, guarantee: i % 2 === 0 });
    assert.ok(pool.includes(question.ch));
    assert.ok(question.options.includes(question.ch));
    assert.ok(question.options.every(ch => pool.includes(ch)));
  }
  assert.equal(state.step, 1);
});

test('øvingslenkjer vel rett modus og legg profil og steg i fragmentet', () => {
  vm.runInContext(fs.readFileSync(path.join(app, 'js/progress-ui.js'), 'utf8'), context);
  for (let step = 1; step <= 10; step++) {
    const url = context.LjodProgressUI.practiceUrl({ id: 'ein profil' }, step);
    assert.equal(url.includes('?'), false);
    const params = new URLSearchParams(url.split('#')[1]);
    assert.equal(params.get('p'), 'ein profil');
    assert.equal(params.get('level'), String(step));
    assert.equal(params.get('m'), step <= 5 ? 'lydfangst' : 'lesestigen');
  }
});

test('alle ti steg, og 100 prosent berre når alle måla er ferdige', () => {
  const p = profile();
  lettersDone(p);
  assert.equal(P.summary(p).completed, 5);
  assert.equal(P.summary(p).percent, 50);
  assert.ok(A.unlockedModes(p.adaptive).some(m => m.id === 'lesestigen'));
  for (const level of D.LEVELS) {
    assert.equal(P.summary(p).current, level.number);
    level.items.forEach(target => P.record(p, level.number, target.id, true));
    assert.equal(P.summary(p).current, level.number);
    level.items.forEach(target => P.record(p, level.number, target.id, true));
    assert.equal(P.summary(p).completed, level.number);
  }
  assert.equal(P.summary(p).percent, 100);
  assert.equal(P.summary(p).done, true);
  assert.equal(P.summary(p).remaining, 0);
});

test('læraroversikta peikar ut kvar attståande bokstav, også etter at steget er fullført', () => {
  const p = profile();
  const letters = L.STEPS[0];
  p.adaptive.step = 2;
  letters.slice(1).forEach(ch => { p.adaptive.items[ch] = { ...A.item(p.adaptive, ch), maxBox: 3 }; });
  const before = JSON.stringify(p);
  const first = P.levels(p)[0];
  assert.equal(first.done, true);
  assert.deepEqual(Array.from(first.practice), [letters[0]]);
  assert.deepEqual(Array.from(P.levels(p)[2].practice), Array.from(L.STEPS[2]));
  assert.equal(JSON.stringify(p), before);
  p.adaptive.items[letters[0]] = { ...A.item(p.adaptive, letters[0]), maxBox: 3 };
  assert.equal(P.levels(p)[0].practice.length, 0);
});

test('feil tek ikkje bort ferdige mål, og førehandsøving hoppar ikkje over steg', () => {
  const p = profile();
  const target = D.LEVELS[4].items[0];
  P.record(p, 10, target.id, true);
  P.record(p, 10, target.id, true);
  P.record(p, 10, target.id, false);
  assert.equal(P.resultFor(p, target.id).right, 2);
  assert.equal(P.summary(p).current, 1);
  assert.equal(P.summary(p).percent, 0);
  P.record(p, 6, target.id, true);
  assert.equal(P.resultFor(p, target.id).right, 2);
  assert.equal(A.unlockedModes(p.adaptive).some(m => m.id === 'lesestigen'), false);
});

test('alle nye mål har eit ekte klipp og eit eintydig steg', () => {
  const voice = JSON.parse(fs.readFileSync(path.join(app, 'lyd/stemmer.json'))).default;
  assert.notEqual(voice, 'vyrde');
  const manifest = JSON.parse(fs.readFileSync(path.join(app, 'lyd/manifest.json'))).banks;
  let count = 0;
  for (const [bank, entries] of Object.entries(manifest)) {
    const map = JSON.parse(fs.readFileSync(path.join(app, 'lyd', voice, bank + '.json')));
    assert.equal(map.preservesSource, true);
    assert.ok(map.leadMs >= 80 && map.tailMs >= 140);
    assert.deepEqual(Object.keys(map.clips).sort(), Object.keys(entries).sort());
    count += Object.keys(entries).length;
    let end = 0;
    for (const [start, duration] of Object.values(map.clips)) {
      assert.ok(start >= end && duration > 0.22);
      end = start + duration;
    }
  }
  assert.equal(count, 213);
  const ids = new Set();
  for (const level of D.LEVELS) {
    for (const target of level.items) {
      assert.equal(ids.has(target.id), false);
      ids.add(target.id);
      assert.ok(manifest[target.kind === 'sentence' ? 'setningar' : 'ord'][target.id]);
      assert.ok(level.items.filter(item => item.kind === target.kind).length >= 3);
      if (target.pair) assert.ok(level.items.some(item => item.text === target.pair));
    }
    level.groups.forEach(group => assert.ok(manifest.lydgrupper[group.id]));
  }
});

test('kvar figur har fem eigne lokale spelbilete med stabile profil-ID-ar', () => {
  const avatars = { window: null, URL, document: { currentScript: { src: pathToFileURL(path.join(app, 'js/avatars.js')).href } } };
  avatars.window = avatars;
  vm.createContext(avatars);
  vm.runInContext(fs.readFileSync(path.join(app, 'js/avatars.js'), 'utf8'), avatars);
  const urls = new Set();
  for (const avatar of S.AVATARS) {
    for (const mode of A.MODES) {
      const url = avatars.LjodAvatar.thumbnailUrl(avatar.id, mode.id);
      assert.equal(urls.has(url), false, avatar.id + ': ' + mode.id);
      urls.add(url);
      const file = fileURLToPath(url);
      assert.ok(fs.existsSync(file), file);
      assert.ok(fs.statSync(file).size < 500000, file);
    }
  }
  assert.equal(urls.size, 50);
  assert.equal(avatars.LjodAvatar.thumbnailUrl('ukjend', 'lydfangst'), avatars.LjodAvatar.thumbnailUrl('sirkel', 'lydfangst'));
});

test('alle inngangssider lastar ny profilmodell og alle lokale ressursar finst', () => {
  for (const name of fs.readdirSync(app).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(app, name), 'utf8');
    if (html.includes('js/state.js')) assert.ok(html.includes('js/progress.js'), name);
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      const url = match[1].split(/[?#]/)[0];
      if (/^(?:https?:|data:)/.test(url)) continue;
      const file = url.startsWith('/') ? path.join(app, '..', url) : path.resolve(app, url);
      assert.ok(fs.existsSync(file), name + ': ' + url);
    }
  }
});
