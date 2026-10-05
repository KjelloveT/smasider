/* Livslina — art-vignettes.js
 * Isometriske pikselminiscener til hendingskorta.
 * LL.artVignette.create(key) → dekorativt sprite-element frå eit 4 × 4-ark.
 */
window.LL = window.LL || {};

LL.artVignette = (function () {
  'use strict';

  const CELLS = {
    phone: [0, 0], phoneShop: [1, 0], canteen: [2, 0], party: [3, 0],
    drinks: [0, 1], clothes: [1, 1], gaming: [2, 1], mobileData: [3, 1],
    laptop: [0, 2], bus: [1, 2], bike: [2, 2], apprentice: [3, 2],
    debt: [0, 3], sport: [1, 3], dentist: [2, 3], study: [3, 3],
    shield: [1, 0], warning: [0, 3], coins: [0, 3], gift: [0, 3],
    star: [3, 0], home: [0, 3], book: [3, 3]
  };

  function create(key) {
    const [column, row] = CELLS[key] || CELLS.study;
    const sprite = document.createElement('span');
    sprite.className = 'll-event-sprite';
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.setProperty('--sprite-x', (column * 100 / 3) + '%');
    sprite.style.setProperty('--sprite-y', (row * 100 / 3) + '%');
    return sprite;
  }

  return { create };
})();
