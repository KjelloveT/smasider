(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create(settings, save) {
    const $ = id => document.getElementById(id);
    let preview = false, timer;
    const clamp = (value, fallback) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
    $('music-volume').value = clamp(settings.musicVolume, 65); $('effects-volume').value = clamp(settings.effectsVolume, 80);
    function values() { return { musicVolume: Number($('music-volume').value), effectsVolume: Number($('effects-volume').value) }; }
    function update() {
      const volume = values();
      $('music-volume-value').textContent = volume.musicVolume + ' %'; $('effects-volume-value').textContent = volume.effectsVolume + ' %';
      F.Audio.setVolumes(volume.musicVolume, volume.effectsVolume);
    }
    function stopPreview() {
      clearTimeout(timer); $('preview-music').textContent = 'Prøv musikken';
      if (preview) { preview = false; F.Audio.stop(); }
    }
    async function prepare() {
      $('preview-music').disabled = $('preview-effect').disabled = true;
      try { await F.Audio.init(); return true; }
      catch (error) { Vy.toast(error.message); return false; }
      finally { $('preview-music').disabled = $('preview-effect').disabled = false; }
    }
    ['music-volume', 'effects-volume'].forEach(id => $(id).addEventListener('input', () => { update(); save(); }));
    $('preview-music').addEventListener('click', async () => {
      if (preview) { stopPreview(); return; }
      if (!await prepare()) return; $('sound-input').checked = true; F.Audio.setMuted(false); update(); save();
      preview = true; F.Audio.start(Number($('preview-theme').value)); $('preview-music').textContent = 'Stopp musikken'; timer = setTimeout(stopPreview, 30000);
    });
    $('preview-theme').addEventListener('change', () => { if (preview) F.Audio.setScene(Number($('preview-theme').value)); });
    $('preview-effect').addEventListener('click', async () => { if (!await prepare()) return; $('sound-input').checked = true; F.Audio.setMuted(false); update(); save(); F.Audio.effect({ type: 'answer' }); if (!preview) { clearTimeout(timer); timer = setTimeout(() => F.Audio.stop(), 900); } });
    $('sound-input').addEventListener('change', () => { F.Audio.setMuted(!$('sound-input').checked); save(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPreview(); F.Audio.stop(); } });
    update(); return { values, stopPreview };
  }
  F.SoundControls = { create };
})(window);
