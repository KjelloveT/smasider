'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8');

test('stopp under opplåsing startar ikkje eit gammalt klipp etterpå', async () => {
  let resume, oscillators = 0;
  const context = { console, setTimeout, window: null };
  context.window = context;
  context.AudioContext = function () {
    this.state = 'suspended';
    this.resume = () => new Promise(resolve => { resume = resolve; });
    this.createOscillator = () => { oscillators++; throw new Error('Skal ikkje spele'); };
  };
  vm.runInNewContext(source, context);
  const pending = context.LjodAudio.play('f_a');
  context.LjodAudio.stop();
  resume();
  await pending;
  assert.equal(oscillators, 0);
});

test('lydgrupper og setningar finn rett bank, og stoppa lydering held ikkje fram', async () => {
  const played = [];
  const timers = [];
  const maps = { fonem: { f_a: [0, 0.5] }, namn: {}, ord: { o_is: [0, 0.5] }, ros: {}, lydgrupper: { f_ng: [0, 0.5] }, setningar: { s_lesbok: [0, 0.5] } };
  const context = { console, window: null, setTimeout: fn => { timers.push(fn); } };
  context.window = context;
  context.AudioContext = function () {
    this.state = 'running';
    this.destination = {};
    this.decodeAudioData = (bytes, resolve) => resolve({ bank: bytes.bank });
    this.createBufferSource = () => {
      const node = { connect() {}, stop() { if (this.onended) this.onended(); }, start() { played.push(this.buffer.bank); queueMicrotask(() => this.onended && this.onended()); } };
      return node;
    };
  };
  context.fetch = async url => {
    if (url.includes('stemmer.json')) return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ default: 'new', voices: [{ id: 'new' }] }) };
    const bank = url.split('/').pop().split('.')[0];
    return { ok: true, headers: { get: () => '' }, json: async () => ({ clips: maps[bank] }), arrayBuffer: async () => ({ bank }) };
  };
  vm.runInNewContext(source, context);
  const audio = context.LjodAudio;
  assert.equal((await audio.load()).missing.length, 0);
  await audio.play('f_ng');
  await audio.play('s_lesbok');
  assert.deepEqual(played, ['lydgrupper', 'setningar']);
  played.length = 0;
  const pending = audio.soundOut({ letters: ['a'], sound: 'o_is' });
  await new Promise(resolve => setImmediate(resolve));
  audio.stop();
  // Fullfør ventetida som alt var planlagd før avbrotet.
  while (timers.length) timers.shift()();
  await pending;
  assert.deepEqual(played, ['fonem']);
});
