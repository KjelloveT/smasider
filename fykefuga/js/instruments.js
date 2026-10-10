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
    wave('violin', [1, .7, .55, .4, .32, .27, .2, .16, .13, .10, .075, .055]);
    wave('cello', [1, .56, .3, .25, .12, .11, .07, .04]);
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
        sources.forEach(source => { source.onended = () => { if (--remaining === 0) value.finish(); }; source.start(start); source.stop(value.end + .03); });
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
        const source = oscillator(v, event.midi, instrument, bowed ? -4 : 0, bowed ? .52 : .7);
        if (bowed) {
          oscillator(v, event.midi, instrument, 4, .45);
          const vibrato = context.createOscillator(), depth = context.createGain();
          vibrato.frequency.value = instrument === 'cello' ? 4.9 : 5.6; depth.gain.value = 3.2;
          vibrato.connect(depth); depth.connect(source.detune); v.nodes.push(vibrato, depth); v.sources.push(vibrato);
        }
        gain.exponentialRampToValueAtTime(velocity, start + Math.min(bowed ? .055 : .024, duration / 2));
        gain.setValueAtTime(velocity * .85, start + duration); gain.exponentialRampToValueAtTime(.0001, v.end);
        v.filter.frequency.value = instrument === 'violin' ? 3800 : instrument === 'cello' ? 1400 : 4200;
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
      v.filter.frequency.value = cutoff; v.gain.gain.setValueAtTime(velocity, start); v.gain.gain.exponentialRampToValueAtTime(.0001, v.end); v.launch();
    }
    function clear(bus) { voices.forEach(v => { if (bus && v.bus !== bus) return; v.sources.forEach(source => { try { source.stop(); } catch (_) {} }); v.finish(); }); }
    return { note, sweep, rustle, clear, voiceCount: () => voices.size };
  }
  root.Fykefuga.Instruments = { create };
})(window);
