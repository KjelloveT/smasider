(function () {
  'use strict';
  const F = window.Fykefuga, button = document.getElementById('run-audio');
  const status = document.getElementById('audio-status'), results = document.getElementById('audio-results');
  const wait = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));
  function assert(value, label) { if (!value) throw new Error(label); }
  function stats(buffer) {
    let peak = 0, sum = 0, bad = 0;
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (const value of data) {
        if (!Number.isFinite(value)) bad++;
        peak = Math.max(peak, Math.abs(value)); sum += value * value;
      }
    }
    return { peak, rms: Math.sqrt(sum / (buffer.length * 2)), bad };
  }
  button.addEventListener('click', async () => {
    button.disabled = true; results.replaceChildren();
    try {
      await F.Music.load();
      const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      for (const rate of [44100, 48000]) for (let scene = 0; scene < 7; scene++) {
        const track = F.Music.track(scene);
        status.textContent = 'Kontrollerer ' + track.title + ' ved ' + rate + ' Hz …';
        const context = new Offline(2, rate * 2, rate), entry = await F.Music.prepare(context, scene);
        const measurement = stats(entry.buffer);
        assert(measurement.bad === 0 && measurement.peak < 1 && measurement.rms > .01, 'Ugyldig lyd: ' + track.title);
        const duration = entry.loopEnd - entry.loopStart;
        assert(Math.abs(duration - track.frames / track.sampleRate) < 2 / rate, 'Feil sløyfelengd');
        let jump = null;
        if (track.loop !== false) {
          const source = context.createBufferSource(); source.buffer = entry.buffer;
          source.loop = true; source.loopStart = entry.loopStart; source.loopEnd = entry.loopEnd;
          source.connect(context.destination); source.start(0, entry.loopEnd - 1);
          const loop = await context.startRendering(), data = loop.getChannelData(0);
          jump = Math.abs(data[rate] - data[rate - 1]); const steps = [];
          for (let i = rate - 4410; i < rate + 4410; i++) steps.push(Math.abs(data[i] - data[i - 1]));
          steps.sort((a, b) => a - b);
          assert(jump < Math.max(.06, steps[Math.floor(steps.length * .99)] * 1.8), 'Brått brot i musikksløyfa');
          for (const start of [rate - Math.round(rate * .05), rate]) {
            let sum = 0;
            for (let i = start; i < start + Math.round(rate * .05); i++) sum += data[i] ** 2;
            assert(Math.sqrt(sum / Math.round(rate * .05)) > .005, 'Stille hol ved sløyfeskøyt');
          }
        }
        const row = document.createElement('p');
        row.textContent = track.title + ' · ' + rate + ' Hz · ' + duration.toFixed(3) + ' s · start ' +
          entry.loopStart.toFixed(5) + ' s · samsvar ' + entry.similarity.toFixed(4) + ' · topp ' +
          measurement.peak.toFixed(3) + (jump === null ? ' · heil sats utan sløyfe' : ' · skøyt ' + jump.toFixed(4)) + ' · BESTÅTT';
        results.append(row);
      }
      status.textContent = 'Prøver pause, omstart, volum og raske temabyte …';
      await F.Audio.init(0); F.Audio.setMuted(true); F.Audio.start(0); await wait(.12);
      assert(F.Audio.status().music.title === 'Marmorfuga', 'Feil starttema');
      F.Audio.setVolumes(0, 80); assert(F.Audio.status().musicVolume === 0, 'Musikk av feila');
      F.Audio.setVolumes(65, 0); assert(F.Audio.status().effectsVolume === 0, 'Spel-ljod av feila');
      const before = F.Audio.status().music.position; F.Audio.pause(); await wait(.06);
      const paused = F.Audio.status();
      assert(!paused.music.playing && paused.context === 'suspended', 'Pause held fram med lyd');
      assert(Math.abs(paused.music.position - before) < .08, 'Pause mistar musikkposisjon');
      await F.Audio.init(0); F.Audio.resume(0); await wait(.05);
      assert(F.Audio.status().music.position >= before, 'Vidareføring startar musikken på nytt');
      F.Audio.start(0); await wait(.03);
      assert(F.Audio.status().music.position < .08, 'Omstart nullstiller ikkje musikken');
      F.Audio.setScene(3); F.Audio.setScene(1); F.Audio.pause(); await wait(.3);
      assert(!F.Audio.status().music.playing, 'Sein dekoding startar lyd etter pause');
      await F.Audio.init(2); F.Audio.start(2); await wait(.05);
      assert(F.Audio.status().music.title === 'Spegelmenuett' && F.Audio.status().music.cachedThemes <= 2, 'Feil tema eller ubunde minnebruk');
      F.Audio.stop(); await wait(.05);
      assert(F.Audio.status().context === 'suspended', 'Avslutt held fram med lyd');
      const row = document.createElement('p'); row.textContent = 'Pause, vidareføring, omstart, lyd av, volum og avbrotne temabyte: BESTÅTT.'; results.append(row);
      status.textContent = 'Alle fjorten dekodingsprøvene og lydstyringa består.';
    } catch (error) { F.Audio.stop(); status.textContent = 'Prøva feila: ' + error.message; }
    finally { button.disabled = false; }
  });
})();
