(function (root) {
  'use strict';
  function create(context, music, effects) {
    const voices = new Set(), waves = {};
    const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
    function wave(name, partials) {
      const real = new Float32Array(partials.length + 1), imag = new Float32Array(partials.length + 1);
      partials.forEach((value, i) => { imag[i + 1] = value; }); waves[name] = context.createPeriodicWave(real, imag);
    }
    wave('cembalo', [1, .66, .42, .3, .23, .15, .13, .10, .075, .06, .05, .025]);
    wave('organ', [1, .34, .025, .24, .01, .065, .009, .08]);
    const noise = context.createBuffer(1, Math.ceil(context.sampleRate * .35), context.sampleRate);
    const samples = noise.getChannelData(0), random = Vy.rng(47831);
    for (let i = 0; i < samples.length; i++) samples[i] = (random() * 2 - 1) * Math.pow(1 - i / samples.length, 2);
    function voice(bus, start, duration, pan) {
      if (Array.from(voices).filter(value => value.start <= start && value.end > start).length >= 80) return null;
      const gain = context.createGain(), filter = context.createBiquadFilter();
      const stereo = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
      if (stereo.pan) stereo.pan.value = Math.max(-1, Math.min(1, pan || 0));
      filter.type = 'lowpass'; filter.Q.value = .45;
      gain.connect(filter); filter.connect(stereo); stereo.connect(bus);
      const nodes = [gain, filter, stereo], sources = [];
      const value = { gain, filter, nodes, sources, bus, start, end: start + duration }; voices.add(value);
      value.finish = () => { voices.delete(value); nodes.forEach(node => { try { node.disconnect(); } catch (_) {} }); };
      value.launch = () => {
        let remaining = sources.length;
        sources.forEach(source => { source.onended = () => { if (--remaining === 0) value.finish(); }; if (source.buffer) source.start(start, source.offset || 0); else source.start(start); source.stop(value.end + .03); });
      };
      return value;
    }
    function oscillator(v, midi, instrument, detune, level) {
      const source = context.createOscillator(), gain = context.createGain();
      source.setPeriodicWave(waves[instrument]); source.frequency.value = frequency(midi); source.detune.value = detune || 0;
      gain.gain.value = level; source.connect(gain); gain.connect(v.gain); v.nodes.push(source, gain); v.sources.push(source); return source;
    }
    function note(event, start, bus) {
      const instrument = event.instrument, release = instrument === 'cembalo' ? .12 : .16;
      const duration = Math.max(.04, event.duration), v = voice(bus || music, start, duration + release, event.pan); if (!v) return;
      const gain = v.gain.gain, velocity = event.velocity; gain.setValueAtTime(.0001, start);
      if (instrument === 'cembalo') {
        oscillator(v, event.midi, instrument, -1.5, .75); oscillator(v, event.midi + 12, instrument, 1.5, .16);
        gain.exponentialRampToValueAtTime(velocity, start + .004);
        gain.exponentialRampToValueAtTime(Math.max(.0001, velocity * .22), start + Math.min(.24, duration));
        gain.exponentialRampToValueAtTime(.0001, v.end);
        v.filter.frequency.setValueAtTime(5600, start); v.filter.frequency.exponentialRampToValueAtTime(1700, v.end);
      } else {
        const bowed = instrument === 'violin' || instrument === 'cello';
        if (bowed) {
          const sample = root.Fykefuga.Strings.nearest(instrument, event.midi);
          if (!sample) { v.finish(); return; }
          // Three separately timed players per section; PCM carries body resonance and bow friction.
          [-6, 1, 7].forEach((cents, i) => {
            const source = context.createBufferSource(), level = context.createGain(), spread = context.createStereoPanner();
            source.buffer = sample.buffer; source.loop = true; source.loopStart = .3; source.loopEnd = 2.6; source.offset = .04 + i * .137;
            source.playbackRate.value = Math.pow(2, (event.midi - sample.midi) / 12); source.detune.value = cents;
            level.gain.value = [.52, .34, .3][i]; spread.pan.value = (i - 1) * .28;
            source.connect(level); level.connect(spread); spread.connect(v.gain); v.nodes.push(source, level, spread); v.sources.push(source);
          });
        } else oscillator(v, event.midi, instrument, 0, .7);
        gain.exponentialRampToValueAtTime(velocity, start + Math.min(bowed ? .065 : .024, duration / 2));
        gain.setTargetAtTime(velocity * .87, start + .09, .16);
        gain.setValueAtTime(velocity * .87, start + duration); gain.exponentialRampToValueAtTime(.0001, v.end);
        v.filter.frequency.value = instrument === 'violin' ? 6500 : instrument === 'cello' ? 4200 : 4200;
      }
      v.launch();
    }
    function sweep(from, to, duration, velocity, start, kind) {
      const v = voice(effects, start, duration, 0); if (!v) return;
      const source = context.createOscillator(); source.type = kind || 'sine';
      source.frequency.setValueAtTime(from, start); source.frequency.exponentialRampToValueAtTime(to, v.end);
      source.connect(v.gain); v.sources.push(source); v.nodes.push(source); v.filter.frequency.value = 6000;
      v.gain.gain.setValueAtTime(.0001, start); v.gain.gain.exponentialRampToValueAtTime(velocity, start + .004);
      v.gain.gain.exponentialRampToValueAtTime(.0001, v.end); v.launch();
    }
    function rustle(start, duration, velocity, cutoff) {
      const v = voice(effects, start, duration, 0); if (!v) return;
      const source = context.createBufferSource(); source.buffer = noise; source.connect(v.gain); v.sources.push(source); v.nodes.push(source);
      v.filter.frequency.value = cutoff; v.gain.gain.setValueAtTime(.0001, start); v.gain.gain.exponentialRampToValueAtTime(velocity, start + .012); v.gain.gain.exponentialRampToValueAtTime(.0001, v.end); v.launch();
    }
    function impact(start, fundamental, duration, velocity) {
      const v = voice(effects, start, duration, 0); if (!v) return;
      [1, 2.76, 5.4, 8.93].forEach((ratio, i) => {
        const source = context.createOscillator(), level = context.createGain(); source.type = 'sine'; source.frequency.value = fundamental * ratio;
        level.gain.value = 1 / Math.pow(i + 1, 2); source.connect(level); level.connect(v.gain); v.nodes.push(source, level); v.sources.push(source);
      });
      v.filter.frequency.value = 6500; v.gain.gain.setValueAtTime(.0001, start); v.gain.gain.exponentialRampToValueAtTime(velocity, start + .003); v.gain.gain.exponentialRampToValueAtTime(.0001, v.end); v.launch();
    }
    function clear(bus) { voices.forEach(v => { if (bus && v.bus !== bus) return; v.sources.forEach(source => { try { source.stop(); } catch (_) {} }); v.finish(); }); }
    return { note, sweep, rustle, impact, clear, voiceCount: () => voices.size };
  }
  root.Fykefuga.Instruments = { create };
})(window);
