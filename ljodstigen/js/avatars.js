/* Måla rasterfigurar. Dei stabile profil-ID-ane og 3D-palettane står fast. */
(function (root) {
  'use strict';
  const SCRIPT_URL = document.currentScript.src;
  const FILES = { sirkel: 'mose', firkant: 'glimt', trekant: 'knopp', rombe: 'tindra', kross: 'nova',
    boge: 'bris', stjerne: 'rusk', sekskant: 'komet', birk: 'birk', krystall: 'krystall' };
  const DEFINITIONS = {
    sirkel: { palette: { body: '#6f9d57', accent: '#e4bd67', skin: '#d6a982' }, accessory: 'leaf', kind: 'forest' },
    firkant: { palette: { body: '#4cb7c7', accent: '#ffe071', skin: '#86dfe0' }, accessory: 'antenna', kind: 'robot' },
    trekant: { palette: { body: '#b95745', accent: '#f1d18e', skin: '#e7bd9a' }, accessory: 'mushroom', kind: 'forest' },
    rombe: { palette: { body: '#7356ad', accent: '#f4ca62', skin: '#e2b5d2' }, accessory: 'star', kind: 'magic' },
    kross: { palette: { body: '#2693a2', accent: '#f2a85d', skin: '#c98965' }, accessory: 'helmet', kind: 'robot' },
    boge: { palette: { body: '#8cb9d8', accent: '#f7f4e8', skin: '#d8c8b8' }, accessory: 'cloud', kind: 'forest' },
    stjerne: { palette: { body: '#df705b', accent: '#f5bc67', skin: '#d98d72' }, accessory: 'horns', kind: 'magic' },
    sekskant: { palette: { body: '#dfa431', accent: '#ee7657', skin: '#c99a70' }, accessory: 'comet', kind: 'space' },
    birk: { palette: { body: '#4e8060', accent: '#ca8c58', skin: '#9c6d52' }, accessory: 'fern', kind: 'forest' },
    krystall: { palette: { body: '#8c7ac7', accent: '#d7c7ff', skin: '#e2b9a0' }, accessory: 'crystal', kind: 'space' }
  };
  const promises = Object.create(null), images = Object.create(null), canvases = Object.create(null);
  function get(id) { return DEFINITIONS[id] || DEFINITIONS.sirkel; }
  function assetUrl(id) { return new URL('../resources/figurar/' + (FILES[id] || FILES.sirkel) + '.png', SCRIPT_URL).href; }
  function loadImage(id) {
    if (!promises[id]) promises[id] = new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () { images[id] = image; resolve(image); };
      image.onerror = function () { reject(new Error('Fekk ikkje klargjort figuren ' + id)); };
      image.src = assetUrl(id);
    });
    return promises[id];
  }
  function loadedImage(id) {
    if (!images[id]) return null;
    if (!canvases[id]) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      canvas.getContext('2d').drawImage(images[id], 0, 0, 128, 128);
      canvases[id] = canvas;
    }
    return canvases[id];
  }
  function image(id, size) {
    const img = document.createElement('img');
    img.src = assetUrl(id);
    img.width = img.height = size || 56;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    return img;
  }
  root.LjodAvatar = { get: get, url: assetUrl, dataUrl: assetUrl, image: image,
    loadAll: function () { return Promise.all(Object.keys(FILES).map(loadImage)); }, loadedImage: loadedImage };
})(window);
