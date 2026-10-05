/* Livslina — adapt the validated layered character art for game screens. */
window.LL = window.LL || {};

LL.artCharacter = (function () {
  'use strict';

  const art = window.LivslinaCharacterArt;
  const model = window.LivslinaCharacterModel;

  function createCanvas(character, options) {
    const opts = options || {};
    const canvas = document.createElement('canvas');
    canvas.width = opts.width || 256;
    canvas.height = opts.height || 384;
    canvas.className = opts.className || 'll-character-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opts.label || 'Figuren din');
    canvas.style.imageRendering = 'pixelated';
    drawInto(canvas, character, opts);
    return canvas;
  }

  function drawInto(canvas, character, options) {
    if (!art || !art.ready || !canvas) return false;
    const selection = character || { skin: 1, face: 0, hair: 0, clothes: 0 };
    return art.draw(canvas.getContext('2d'), selection, options || {});
  }

  function summary(character) {
    const c = character || {};
    return [
      'Hud: ' + (art.labels.skin[c.skin] || art.labels.skin[1]),
      'andlet: ' + (art.labels.face[c.face] || art.labels.face[0]),
      'hår: ' + (art.labels.hair[c.hair] || art.labels.hair[0]),
      'klede: ' + (art.labels.clothes[c.clothes] || art.labels.clothes[0])
    ].join(' · ');
  }

  return {
    labels: art ? art.labels : {},
    ready: () => !!(art && art.ready),
    whenReady: art ? art.whenReady : Promise.resolve(false),
    createCanvas,
    drawInto,
    summary,
    dimensions: model ? { width: model.assetWidth, height: model.assetHeight } : null
  };
})();
