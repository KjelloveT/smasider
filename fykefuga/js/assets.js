(function (root) {
  'use strict';
  const images = new Map();
  const files = ['marmor.jpg', 'urverk.jpg', 'spegel.jpg', 'orgel.jpg', 'spike.png', 'column.png', 'gate.png', 'floor.png', 'ornament.png', 'mid-0.png', 'mid-1.png', 'mid-2.png', 'mid-3.png'];
  root.Fykefuga.skins.forEach(skin => root.Fykefuga.modes.forEach(mode => files.push(skin.id + '-' + mode.id + '.png')));
  let pending;
  function load() {
    if (!pending) pending = Promise.all(files.map(file => new Promise((resolve, reject) => {
      const picture = new Image();
      picture.onload = () => { images.set(file, picture); resolve(); };
      picture.onerror = () => reject(new Error('Ressursen «' + file + '» kunne ikkje lastast. Last sida på nytt.'));
      picture.src = 'assets/' + file;
    }))).catch(error => { pending = null; throw error; });
    return pending;
  }
  root.Fykefuga.Assets = { load, get: name => images.get(name) };
})(window);
