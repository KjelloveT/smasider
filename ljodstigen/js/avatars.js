/* AVATARS.JS — same figurfamilie i profilval, 2D og 3D

   SVG-ane blir laga i nettlesaren. Dei er små, lokale vektorbilete utan
   eksterne ressursar, og kan brukast direkte som teksturar i Phaser.
*/
(function (root) {
  'use strict';

  const DEFINITIONS = {
    sirkel:   { palette: { body: '#6f9d57', accent: '#e4bd67', skin: '#d6a982' }, accessory: 'leaf',     kind: 'forest' },
    firkant:  { palette: { body: '#4cb7c7', accent: '#ffe071', skin: '#86dfe0' }, accessory: 'antenna',  kind: 'robot' },
    trekant:  { palette: { body: '#b95745', accent: '#f1d18e', skin: '#e7bd9a' }, accessory: 'mushroom', kind: 'forest' },
    rombe:    { palette: { body: '#7356ad', accent: '#f4ca62', skin: '#e2b5d2' }, accessory: 'star',     kind: 'magic' },
    kross:    { palette: { body: '#2693a2', accent: '#f2a85d', skin: '#c98965' }, accessory: 'helmet',   kind: 'robot' },
    boge:     { palette: { body: '#8cb9d8', accent: '#f7f4e8', skin: '#d8c8b8' }, accessory: 'cloud',    kind: 'forest' },
    stjerne:  { palette: { body: '#df705b', accent: '#f5bc67', skin: '#d98d72' }, accessory: 'horns',    kind: 'magic' },
    sekskant: { palette: { body: '#dfa431', accent: '#ee7657', skin: '#c99a70' }, accessory: 'comet',    kind: 'space' },
    birk:     { palette: { body: '#4e8060', accent: '#ca8c58', skin: '#9c6d52' }, accessory: 'fern',     kind: 'forest' },
    krystall: { palette: { body: '#8c7ac7', accent: '#d7c7ff', skin: '#e2b9a0' }, accessory: 'crystal',  kind: 'space' }
  };

  const imagePromises = Object.create(null);
  const imageElements = Object.create(null);

  function loadImage(id) {
    if (!imagePromises[id]) {
      imagePromises[id] = new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function () { imageElements[id] = image; resolve(image); };
        image.onerror = function () { reject(new Error('Fekk ikkje klargjort figuren ' + id)); };
        image.src = dataUrl(id);
      });
    }
    return imagePromises[id];
  }

  function loadAll() {
    return Promise.all(Object.keys(DEFINITIONS).map(loadImage));
  }

  const textureCanvases = Object.create(null);

  function loadedImage(id) {
    if (!imageElements[id]) return null;
    if (!textureCanvases[id]) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      canvas.getContext('2d').drawImage(imageElements[id], 0, 0, 128, 128);
      textureCanvases[id] = canvas;
    }
    return textureCanvases[id];
  }

  function get(id) {
    return DEFINITIONS[id] || DEFINITIONS.sirkel;
  }

  function svgSource(id) {
    const a = get(id);
    const p = a.palette;
    const head = a.kind === 'robot'
      ? '<rect x="42" y="21" width="44" height="45" rx="14" fill="' + p.skin + '" stroke="#29463e" stroke-width="4"/>'
      : '<circle cx="64" cy="44" r="23" fill="' + p.skin + '" stroke="#29463e" stroke-width="4"/>';
    const face = a.kind === 'robot'
      ? '<rect x="49" y="37" width="9" height="9" rx="4" fill="' + p.accent + '"/><rect x="70" y="37" width="9" height="9" rx="4" fill="' + p.accent + '"/><path d="M55 55h18" fill="none" stroke="#29463e" stroke-width="3" stroke-linecap="round"/>'
      : '<ellipse cx="56" cy="43" rx="2.8" ry="4" fill="#29463e"/><ellipse cx="72" cy="43" rx="2.8" ry="4" fill="#29463e"/><path d="M57 54q7 7 14 0" fill="none" stroke="#29463e" stroke-width="3" stroke-linecap="round"/>';
    const extras = {
      leaf: '<path d="M64 24C48 20 47 8 49 6c12-1 17 7 15 18C66 12 75 7 82 8c1 9-5 16-18 16Z" fill="#76a957" stroke="#29463e" stroke-width="3" stroke-linejoin="round"/><path d="M64 24 52 12m12 12 12-11" stroke="#e4bd67" stroke-width="2"/>',
      antenna: '<path d="M64 22V9" stroke="#29463e" stroke-width="4" stroke-linecap="round"/><circle cx="64" cy="8" r="6" fill="' + p.accent + '" stroke="#29463e" stroke-width="3"/><circle cx="42" cy="45" r="4" fill="' + p.accent + '"/><circle cx="86" cy="45" r="4" fill="' + p.accent + '"/>',
      mushroom: '<path d="M37 29c1-15 13-23 27-23s26 8 27 23c-13 5-41 5-54 0Z" fill="#c96c58" stroke="#29463e" stroke-width="4"/><path d="M63 29v4" stroke="#f4dfb4" stroke-width="4" stroke-linecap="round"/><circle cx="51" cy="19" r="3" fill="#f7e7c5"/><circle cx="75" cy="16" r="4" fill="#f7e7c5"/>',
      star: '<path d="m64 2 6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1Z" fill="' + p.accent + '" stroke="#29463e" stroke-width="3" stroke-linejoin="round"/>',
      helmet: '<path d="M39 43a25 25 0 0 1 50 0v13H39Z" fill="#e4ece8" stroke="#29463e" stroke-width="4"/><path d="M42 43q22-13 44 0v11H42Z" fill="#84d6df" stroke="#29463e" stroke-width="3"/><path d="M64 19v-5" stroke="#29463e" stroke-width="3"/><circle cx="64" cy="12" r="4" fill="' + p.accent + '"/>',
      cloud: '<path d="M46 24c-7 0-11-5-11-10 0-7 6-11 13-10 4-8 16-7 19 1 9-2 15 5 14 12-1 5-5 8-11 8Z" fill="#f7f4e8" stroke="#29463e" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="14" r="2" fill="' + p.accent + '"/>',
      horns: '<path d="M48 28 41 8q14 1 18 18m21 2 7-20Q73 9 70 27" fill="#f4d39b" stroke="#29463e" stroke-width="4" stroke-linejoin="round"/>',
      comet: '<path d="M43 14 18 8l20 13-20 4 25 2" fill="none" stroke="#ee7657" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="49" cy="16" r="10" fill="' + p.accent + '" stroke="#29463e" stroke-width="3"/><circle cx="49" cy="16" r="4" fill="#fff4c5"/>',
      fern: '<path d="M64 25V5m0 8q-14-10-18-5 3 9 18 10m0-3q12-12 18-7-3 9-18 12m0-3q-12-8-17-3 3 8 17 9" fill="none" stroke="#29463e" stroke-width="3" stroke-linecap="round"/><path d="M48 9q7 1 16 9m17-4q-8 1-17 12m-16-4q7 0 16 6" fill="none" stroke="#85b967" stroke-width="5" stroke-linecap="round"/>',
      crystal: '<path d="M64 2 81 14l-5 15-12 6-13-7-5-14Z" fill="' + p.accent + '" stroke="#29463e" stroke-width="3" stroke-linejoin="round"/><path d="m64 2 0 33m17-21L64 35 46 14" fill="none" stroke="#f7f4e8" stroke-width="2"/>'
    }[a.accessory];

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
      '<ellipse cx="64" cy="119" rx="26" ry="5" fill="#29463e" opacity=".16"/>' +
      '<g stroke="#29463e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M51 81 47 109m30-28 4 28" fill="none" stroke="#29463e" stroke-width="12"/>' +
        '<path d="M51 81 47 109m30-28 4 28" fill="none" stroke="' + p.body + '" stroke-width="8"/>' +
        '<path d="M41 108h13m22 0h13" stroke="' + p.accent + '" stroke-width="8"/>' +
        '<path d="M47 68 35 82m46-14 12 14" fill="none" stroke="' + p.body + '" stroke-width="13"/>' +
        '<path d="M35 82 31 86m58-4 4 4" fill="none" stroke="' + p.skin + '" stroke-width="8"/>' +
        '<path d="M48 61q16-8 32 0l5 24q-21 11-42 0Z" fill="' + p.body + '"/>' +
        '<path d="M48 78q16 7 32 0l2 10q-18 9-36 0Z" fill="' + p.accent + '" stroke="none"/>' +
        head + face + extras +
      '</g></svg>';
  }

  function dataUrl(id) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSource(id));
  }

  function image(id, size) {
    const img = document.createElement('img');
    img.src = dataUrl(id);
    img.width = size || 56;
    img.height = size || 56;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    return img;
  }

  root.LjodAvatar = { get: get, svgSource: svgSource, dataUrl: dataUrl, image: image, loadAll: loadAll, loadedImage: loadedImage };
})(window);