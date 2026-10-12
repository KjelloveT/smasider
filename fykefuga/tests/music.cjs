const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
const manifest = { tracks: [0, 1, 2, 3, 4, 5].map(scene => ({ scene, title: 'tema-' + scene,
  file: 'theme-' + scene + '.mp3', frames: 44100, sampleRate: 44100,
  loop: scene === 5 ? false : true,
  encoderDelayFrames: 1105, bpm: 160 + scene * 8, beats: scene === 2 ? 3 : 4,
  alignment: { startFrame: 256, step: 4, samples: Array.from({ length: 64 }, (_, i) =>
    Math.round(signal((256 + i * 4) / 44100, scene) * 32767)) } })) };
function signal(seconds, scene) { return Math.sin(seconds * (437 + scene * 53) * Math.PI * 2) * .3 + Math.sin(seconds * 1373 * Math.PI * 2) * .13; }
function buffer(scene, rate, padding) {
  const delay = padding ? Math.round(1105 * rate / 44100) : 0;
  const values = new Float32Array(rate + (padding ? Math.round(2304 * rate / 44100) : 0));
  for (let i = delay; i < values.length; i++) values[i] = signal((i - delay) / rate, scene);
  return { sampleRate: rate, length: values.length, duration: values.length / rate, getChannelData: () => values };
}
function param() {
  return { value: 1, setValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; }, cancelAndHoldAtTime() {}, cancelScheduledValues() {} };
}
function audioContext(rate, padding) {
  const context = { sampleRate: rate, currentTime: 0, state: 'running', sources: [], decodes: 0,
    resume() { this.state = 'running'; return Promise.resolve(); },
    suspend() { this.state = 'suspended'; return Promise.resolve(); },
    decodeAudioData(bytes) { this.decodes++; return Promise.resolve(buffer(new Uint8Array(bytes)[0], rate, padding)); },
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; },
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start(at, offset) { this.at = at; this.offset = offset;
        if (!this.loop) this.end = at + this.buffer.duration - offset; },
        stop(at = context.currentTime) { this.end = at; } };
      this.sources.push(source); return source;
    },
    advance(seconds) {
      this.currentTime += seconds;
      for (const source of this.sources) if (!source.finished && source.end <= this.currentTime) {
        source.finished = true; if (source.onended) source.onended();
      }
    } };
  return context;
}
let fail = false, offline = false, fetches = 0, mixes = 0, effects = 0;
const context = vm.createContext({ URL, console, setTimeout, clearTimeout, setInterval, clearInterval,
  document: { currentScript: { src: 'http://localhost/fykefuga/js/music.js' } },
  Vy: { toast(message) { throw new Error('Unexpected toast: ' + message); } },
  fetch: async url => {
    fetches++; if (offline) throw new Error('offline');
    if (String(url).endsWith('music-v1.json')) return { ok: true, json: async () => manifest };
    const scene = Number(String(url).match(/theme-(\d)/)[1]);
    return { ok: !(fail && scene === 2), arrayBuffer: async () => new Uint8Array([scene]).buffer };
  }, Fykefuga: {} });
context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, 'fykefuga/js/music.js'), 'utf8'), context);
const F = context.Fykefuga;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
(async () => {
  fail = true; await assert.rejects(F.Music.load(), /Banemusikken/); fail = false;
  await Promise.all([F.Music.load(), F.Music.load()]);
  for (const rate of [44100, 48000]) for (const padding of [false, true]) {
    const audio = audioContext(rate, padding);
    for (let scene = 0; scene < 6; scene++) {
      const entry = await F.Music.prepare(audio, scene);
      check(entry.similarity > .99, 'Wrong MP3 alignment');
      check(Math.abs(entry.loopEnd - entry.loopStart - 1) < 1 / rate, 'Wrong loop duration');
      check(Math.abs(entry.loopStart - (padding ? Math.round(1105 * rate / 44100) / rate : 0)) < 1 / rate, 'Priming mismatch');
    }
  }
  const audio = audioContext(48000, false), bus = audio.createGain(), player = F.Music.create(audio, bus);
  await player.start(0); audio.advance(.32);
  const before = player.status().position; player.pause(); audio.advance(.04);
  check(!player.status().playing && player.status().voices === 0, 'Pause leaves voices');
  check(Math.abs(player.status().position - before) < .0001, 'Pause loses position');
  await player.resume(0); audio.advance(.06);
  check(player.status().position >= before, 'Resume rewinds music');
  await player.setScene(1); await player.setScene(3);
  await player.start(0); audio.advance(.04);
  check(player.status().scene === 0 && player.status().voices === 1, 'Restart overlaps a queued scene');
  check(player.status().position < .06, 'Restart is late');
  const pending = player.setScene(2); player.pause(); await pending; audio.advance(.05);
  check(!player.status().playing && player.status().voices === 0, 'Decode starts after pause');
  offline = true; const downloads = fetches;
  await player.start(3); audio.advance(.02);
  check(player.status().scene === 3 && fetches === downloads, 'Offline scene needs a download');
  check(player.status().cachedThemes <= 2, 'Unbounded decode cache');
  player.stop(); audio.advance(.03);
  check(player.status().voices === 0, 'Stop leaks sources');
  await player.start(5); audio.advance(.4);
  check(audio.sources.at(-1).loop === false && player.status().position > .3,
    'Den heile Stereo-satsen må starte utan sløyfe');
  audio.advance(1.1);
  check(player.status().voices === 0 && player.status().position === 1,
    'Den heile Stereo-satsen skal stogge ved avslutninga');
  player.stop(); audio.advance(.03);
  const real = audioContext(44100, false);
  context.AudioContext = function () { return real; };
  F.Mixer = { create() { mixes++; return { master: real.createGain(), music: real.createGain(), effects: real.createGain(),
    instruments: { clear() {}, note() { effects++; }, impact() { effects++; }, rustle() { effects++; } } }; } };
  vm.runInContext(fs.readFileSync(path.join(root, 'fykefuga/js/audio.js'), 'utf8'), context);
  await Promise.all([F.Audio.init(0), F.Audio.init(0)]);
  check(mixes === 1, 'Concurrent init creates duplicate mixer');
  F.Audio.setMuted(false); F.Audio.setVolumes(0, 80); F.Audio.start(0); await wait(1);
  F.Audio.effect('jump'); check(effects > 0, 'Music zero also mutes game effects');
  const previous = effects; F.Audio.setVolumes(65, 0); F.Audio.effect('jump');
  check(effects === previous, 'Effects zero does not mute effects');
  F.Audio.setVolumes(65, 80); F.Audio.setMuted(true); F.Audio.effect('answer');
  check(effects === previous, 'Mute still makes effects');
  F.Audio.pause(); real.advance(.04); await wait(25);
  check(F.Audio.status().context === 'suspended', 'Pause does not suspend audio');
  await F.Audio.init(0); F.Audio.resume(0); await wait(1);
  check(F.Audio.status().active && F.Audio.status().context === 'running', 'Resume fails');
  F.Audio.stop(); real.advance(.04); await wait(25);
  check(!F.Audio.status().active && F.Audio.status().context === 'suspended', 'Stop fails');
  console.log(checks + ' musikkontrollar består.');
})().catch(error => { if (F.Audio) F.Audio.stop(); console.error(error); process.exitCode = 1; });
