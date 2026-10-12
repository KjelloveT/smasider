(function (root) {
  'use strict';
  const F = root.Fykefuga, base = new URL('../assets/audio/', document.currentScript.src);
  const encoded = new Map(), contexts = new WeakMap();
  let manifest, loading;
  function sceneIndex(scene) { return Number.isInteger(scene) && scene >= 0 && scene < 7 ? scene : 0; }
  function load() {
    if (!loading) loading = (async () => {
      const response = await fetch(new URL('music-v1.json', base));
      if (!response.ok) throw new Error('Musikkoversikta kunne ikkje lastast. Prøv på nytt.');
      manifest = await response.json();
      await Promise.all(manifest.tracks.map(async track => {
        const file = await fetch(new URL(track.file, base));
        if (!file.ok) throw new Error('Banemusikken kunne ikkje lastast. Prøv på nytt.');
        encoded.set(track.scene, await file.arrayBuffer());
      }));
    })().catch(error => { loading = null; encoded.clear(); throw error; });
    return loading;
  }
  // Match a small waveform reference. Browsers differ in whether MP3 priming is
  // removed before decodeAudioData resamples the audio; duration alone is ambiguous.
  function align(buffer, track) {
    const frames = Math.round(track.frames * buffer.sampleRate / track.sampleRate);
    const extra = buffer.length - frames;
    if (extra < -2 || extra > buffer.sampleRate * .15) throw new Error('Musikken fekk feil lengd ved innlasting.');
    const data = buffer.getChannelData(0), reference = track.alignment.samples;
    const positions = reference.map((_, i) => (track.alignment.startFrame + i * track.alignment.step) * buffer.sampleRate / track.sampleRate);
    const energy = reference.reduce((sum, value) => sum + value * value, 0);
    function score(offset) {
      let dot = 0, power = 0;
      for (let i = 0; i < reference.length; i++) {
        const at = positions[i] + offset, index = Math.floor(at), part = at - index;
        const value = data[index] * (1 - part) + data[index + 1] * part;
        dot += value * reference[i]; power += value * value;
      }
      return dot / Math.sqrt(Math.max(1e-20, power * energy));
    }
    const limit = Math.max(0, extra), expected = Math.round(track.encoderDelayFrames * buffer.sampleRate / track.sampleRate);
    let offset = 0, similarity = score(0);
    const tryOffset = candidate => {
      if (candidate < 0 || candidate > limit) return;
      const value = score(candidate);
      if (value > similarity) { similarity = value; offset = candidate; }
    };
    for (let i = -2; i <= 2; i++) tryOffset(expected + i);
    if (similarity < .92) for (let i = 0; i <= limit; i++) tryOffset(i);
    if (!Number.isFinite(similarity) || similarity < .8) throw new Error('Musikksløyfa kunne ikkje klargjerast. Prøv på nytt.');
    return { buffer, track, loopStart: offset / buffer.sampleRate,
      loopEnd: Math.min(buffer.length, offset + frames) / buffer.sampleRate, similarity };
  }
  async function prepare(context, scene) {
    await load(); scene = sceneIndex(scene);
    let cache = contexts.get(context);
    if (!cache) { cache = new Map(); contexts.set(context, cache); }
    if (cache.has(scene)) {
      const entry = cache.get(scene); cache.delete(scene); cache.set(scene, entry); return entry;
    }
    const entry = context.decodeAudioData(encoded.get(scene).slice(0)).then(buffer => align(buffer, manifest.tracks[scene]));
    cache.set(scene, entry);
    try {
      const result = await entry;
      // Two decoded themes suffice for a transition. All compressed files remain
      // in memory, so later themes can also be prepared after the network is gone.
      while (cache.size > 2) cache.delete(cache.keys().next().value);
      return result;
    } catch (error) { if (cache.get(scene) === entry) cache.delete(scene); throw error; }
  }
  function create(context, bus) {
    const voices = new Set();
    let voice, desired = 0, generation = 0, playing = false, saved = 0, savedScene = 0;
    function position(value) {
      if (!value) return saved;
      const duration = value.entry.loopEnd - value.entry.loopStart;
      const elapsed = value.offset + Math.max(0, context.currentTime - value.at);
      return value.entry.track.loop === false ? Math.min(duration, elapsed) : elapsed % duration;
    }
    function fadeOut(value, at, duration) {
      const gain = value.gain.gain;
      if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(at);
      else { gain.cancelScheduledValues(at); gain.setValueAtTime(gain.value, at); }
      gain.linearRampToValueAtTime(0, at + duration);
      value.source.stop(at + duration + .002);
    }
    function halt(remember) {
      if (remember && voice) { saved = position(voice); savedScene = voice.scene; }
      if (!remember) saved = 0;
      generation++; playing = false;
      voices.forEach(value => fadeOut(value, context.currentTime, .012)); voice = null;
    }
    function begin(entry, scene, offset, transition) {
      const now = context.currentTime;
      // A rapidly replaced scene may have a source queued at a future bar line.
      // Cancel it and keep the currently audible source until its replacement.
      if (voice && voice.at > now && transition) {
        voice.source.stop(now); voices.delete(voice); voice.source.disconnect(); voice.gain.disconnect();
        voice = Array.from(voices).filter(value => value.at <= now).sort((a, b) => b.at - a.at)[0];
      }
      let at = now + .008;
      if (transition && voice) {
        const bar = 60 * voice.entry.track.beats / voice.entry.track.bpm;
        at = now + Math.max(.008, bar - position(voice) % bar);
      }
      const fade = transition ? .18 : .012, source = context.createBufferSource(), gain = context.createGain();
      source.buffer = entry.buffer; source.loop = entry.track.loop !== false;
      if (source.loop) { source.loopStart = entry.loopStart; source.loopEnd = entry.loopEnd; }
      gain.gain.setValueAtTime(0, now); gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(1, at + fade);
      source.connect(gain); gain.connect(bus);
      if (voice) fadeOut(voice, at, fade);
      const duration = entry.loopEnd - entry.loopStart;
      const value = { entry, source, gain, scene,
        offset: source.loop ? offset % duration : Math.min(Math.max(0, offset), duration - .001), at };
      voices.add(value); voice = value;
      source.onended = () => { voices.delete(value); source.disconnect(); gain.disconnect(); };
      source.start(at, entry.loopStart + value.offset);
    }
    async function request(scene, offset, transition) {
      desired = sceneIndex(scene); playing = true;
      const token = ++generation, target = desired;
      const entry = await prepare(context, target);
      if (generation === token && playing) begin(entry, target, offset, transition);
    }
    return {
      start(scene) { halt(false); savedScene = sceneIndex(scene); return request(scene, 0, false); },
      resume(scene) { return request(scene, savedScene === sceneIndex(scene) ? saved : 0, false); },
      pause() { halt(true); }, stop() { halt(false); }, rewind() { saved = 0; },
      setScene(scene) {
        if (sceneIndex(scene) === desired || !playing) return Promise.resolve();
        return request(scene, 0, true);
      },
      status() { return { playing, scene: voice ? voice.scene : savedScene, requestedScene: desired,
        position: position(voice), voices: voices.size, title: voice ? voice.entry.track.title : '',
        loopStart: voice ? voice.entry.loopStart : 0, loopEnd: voice ? voice.entry.loopEnd : 0,
        cachedThemes: (contexts.get(context) || new Map()).size }; }
    };
  }
  F.Music = { load, prepare, align, create, track(scene) { return manifest && manifest.tracks[sceneIndex(scene)]; } };
})(window);
