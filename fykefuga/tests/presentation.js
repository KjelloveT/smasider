(function () {
  'use strict';
  const F = window.Fykefuga, button = document.getElementById('run-audio'), results = document.getElementById('audio-results');
  const urls = [];
  function wav(buffer) {
    const frames = buffer.length, bytes = new ArrayBuffer(44 + frames * 4), view = new DataView(bytes);
    const word = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    word(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 4, true);
    view.setUint16(32, 4, true); view.setUint16(34, 16, true); word(36, 'data'); view.setUint32(40, frames * 4, true);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < frames; i++) view.setInt16(44 + i * 4 + channel * 2, Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), true);
    }
    return new Blob([bytes], { type: 'audio/wav' });
  }
  button.addEventListener('click', async () => {
    button.disabled = true; urls.forEach(URL.revokeObjectURL); urls.length = 0; results.replaceChildren();
    try {
      const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      for (let scene = 0; scene < 4; scene++) {
        const score = F.Score.scores[scene], steps = F.Score.stepsPerBar(scene) * 16;
        document.getElementById('audio-status').textContent = 'Gjer ' + score.name + ' …';
        const seconds = steps * F.Score.quaver(scene) + 2, context = new Offline(2, Math.ceil(seconds * 32000), 32000);
        const mix = F.Mixer.create(context);
        for (let step = 0; step < steps; step++) {
          const at = .04 + step * F.Score.quaver(scene);
          F.Score.eventsAt(scene, step).forEach(note => mix.instruments.note(note, at + note.delay));
        }
        const buffer = await context.startRendering(), left = buffer.getChannelData(0), right = buffer.getChannelData(1);
        let peak = 0, squares = 0, clipped = 0, invalid = 0, stereo = 0;
        for (let i = 0; i < buffer.length; i++) {
          for (const value of [left[i], right[i]]) { if (!Number.isFinite(value)) invalid++; peak = Math.max(peak, Math.abs(value)); squares += value * value; if (Math.abs(value) >= .999) clipped++; }
          stereo += Math.abs(left[i] - right[i]);
        }
        const rms = Math.sqrt(squares / (buffer.length * 2)), passed = !clipped && !invalid && rms > .01 && stereo > 1;
        const section = Vy.el('section', 'vp-panel vp-panel--inset'); section.append(Vy.el('h2', '', score.name), Vy.el('p', '', (passed ? 'BESTÅTT' : 'FEIL') + ' · topp ' + peak.toFixed(3) + ' · RMS ' + rms.toFixed(3) + ' · klipte verdiar ' + clipped + ' · ugyldige verdiar ' + invalid + ' · stereo ' + (stereo / buffer.length).toFixed(4)));
        const url = URL.createObjectURL(wav(buffer)); urls.push(url);
        const audio = document.createElement('audio'); audio.controls = true; audio.src = url; audio.setAttribute('aria-label', 'Prøvelytt til ' + score.name);
        const link = Vy.el('a', 'vp-button vp-button--compact', 'Last ned ' + score.name); link.href = url; link.download = 'fykefuga-' + scene + '.wav'; section.append(audio, link); results.append(section);
      }
      document.getElementById('audio-status').textContent = 'Alle fire ljodprøvene er ferdige.';
    } catch (error) { document.getElementById('audio-status').textContent = 'Prøva feila: ' + error.message; }
    finally { button.disabled = false; }
  });
})();
