// Køyr med node --test heimsank/tests/flow.test.cjs. Ingen nettlesar eller lagring vert rørt.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture() {
  const nodes = new Map();
  const makeNode = () => {
    const classes = new Set();
    return {
      textContent: '', value: '', disabled: false, dataset: {}, children: [],
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        toggle(name, force) { const add = force === undefined ? !classes.has(name) : force; add ? classes.add(name) : classes.delete(name); return add; },
        contains(name) { return classes.has(name); }
      },
      append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); return item; },
      replaceChildren(...items) { this.children = items; }, setAttribute() {}, addEventListener() {}, focus() {}
    };
  };
  const node = id => { if (!nodes.has(id)) nodes.set(id, makeNode()); return nodes.get(id); };
  const counters = { awards: 0, saved: 0, correct: 0 };
  const timers = [];
  let closeReveal;
  const context = vm.createContext({
    document: { getElementById: node, querySelector: () => makeNode(), querySelectorAll: () => [],
      addEventListener() {}, activeElement: null },
    Vy: { el: makeNode, anyModalOpen: () => false },
    HeimsankUI: {
      later: fn => timers.push(fn), cancelTimers: () => { timers.length = 0; },
      reducedMotion: () => true, icon: makeNode, category() {},
      open: (_id, onClose) => { closeReveal = onClose; }, close() {}
    },
    HeimsankCards: { render: makeNode, makeClickable: root => root },
    ProgressionUI: { awardCardPoints: () => { counters.awards++; return 3; }, toast() {},
      evaluateAndAnnounce() {}, renderCovers() {} },
    Progression: { recordCorrect: () => counters.correct++ },
    saveStorage: () => counters.saved++, setupDraggable() {}, setupDropTarget() {},
    ri: () => 2, initShowcase() {}, console
  });
  for (const file of ['state.js', 'game.js', 'cards.js', 'main.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(`
    S.selCat = {id:'land', label:'Land'};
    S.phase = 'question'; S.paused = false;
    const testCard = {id:'Q1',catId:'land',rarity:'vanleg',name:'Test',stat:'42'};
    const secondCard = {id:'Q2',catId:'land',rarity:'vanleg',name:'Test 2',stat:'43'};
    S.idx = {Q1:testCard,Q2:secondCard}; S.groups.vanleg = [testCard,secondCard];
    S.q = {ans:6}; S.correct = 5;
  `, context);
  return { context, node, counters, timers, close: () => closeReveal(),
    run: code => vm.runInContext(code, context) };
}
test('Eitt svar tel berre éin gong; Escape tildeler kort og poeng éin gong', () => {
  const f = fixture();
  f.node('ansInput').value = '6';
  f.run('checkAnswer(); checkAnswer();');
  assert.equal(f.counters.correct, 1);
  assert.equal(f.timers.length, 1);
  f.timers.shift()();
  assert.equal(f.run('S.phase'), 'reveal');
  f.close();
  f.run('settleReveal(); afterReveal();');
  assert.equal(f.counters.awards, 1);
  assert.equal(f.run('S.collection.length'), 1);
  assert.equal(f.run('S.phase'), 'question');
});
test('Kortbaksida ventar på fyrste trykk før kortet blir tildelt', () => {
  const f = fixture();
  f.run("S.phase='feedback'; triggerCard(); afterReveal();");
  assert.equal(f.node('flipCard').classList.contains('is-revealed'), true);
  assert.equal(f.counters.awards, 0);
  assert.equal(f.run('S.phase'), 'reveal');
  f.run('afterReveal();');
  assert.equal(f.counters.awards, 1);
  assert.equal(f.run('S.phase'), 'question');
});
test('Samlinga kan vekse forbi seks kort utan å byte ut noko', () => {
  const f = fixture();
  f.run(`
    S.collection = Array.from({length:6}, (_,i) => ({catId:'land',cardId:'Q'+(i+10),earnedAt:i}));
    S.phase='feedback'; triggerCard(); settleReveal();
  `);
  assert.equal(f.run('S.collection.length'), 7);
  assert.equal(f.counters.awards, 1);
  assert.equal(f.run('S.phase'), 'question');
});
test('Eit kort som alt er i samlinga kan ikkje trekkjast på nytt', () => {
  const f = fixture();
  f.run(`
    S.collection = [{catId:'land',cardId:'Q1',earnedAt:1}];
    S.phase='feedback'; triggerCard(); settleReveal(); discardPending();
  `);
  assert.equal(f.run('S.collection.length'), 2);
  assert.equal(f.run('S.collection[1].cardId'), 'Q2');
});
test('Retur til meny avbryt neste oppgåve og held opptente kort urørte', () => {
  const f = fixture();
  f.node('ansInput').value = '0';
  f.run('checkAnswer();');
  assert.equal(f.timers.length, 1);
  f.run('goSetup();');
  assert.equal(f.timers.length, 0);
  assert.equal(f.run('S.phase'), 'setup');
  assert.equal(f.run('S.correct'), 5);
});
test('Desimalsvar blir ikkje avrunda til eit rett heiltal', () => {
  const f = fixture();
  f.node('ansInput').value = '6.9';
  f.run('checkAnswer();');
  assert.equal(f.counters.correct, 0);
  assert.equal(f.run('S.correct'), 5);
});

test('Alle tretten kategoriar lastar med kreditering og uendra kort-ID-ar', async () => {
  const gameDir = path.join(__dirname, '..');
  const context = vm.createContext({
    console,
    fetch: async url => {
      const content = fs.readFileSync(path.join(gameDir, url), 'utf8').replace(/^\uFEFF/, '');
      return { ok: true, text: async () => content, json: async () => JSON.parse(content) };
    }
  });
  for (const file of ['utils.js', 'carddata.js']) {
    vm.runInContext(fs.readFileSync(path.join(gameDir, 'js', file), 'utf8'), context);
  }
  const categories = JSON.parse(fs.readFileSync(path.join(gameDir, 'kort/categories.json'), 'utf8'));
  assert.equal(categories.length, 13);
  assert.ok(!categories.some(cat => cat.id === 'videospill'));
  for (const cat of categories) {
    context.category = cat;
    const cards = await vm.runInContext('CardData.loadCategoryCards(category)', context);
    assert.ok(cards.length > 0, cat.id);
    assert.ok(cards.every(card => card.catId === cat.id && /^Q\d+$/.test(card.id)), cat.id);
    assert.ok(cards.some(card => card.imgAuthor && card.imgLicense && card.imgPage), cat.id);
  }
});
