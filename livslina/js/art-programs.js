/* Livslina — art-programs.js
 * Isometriske pikselminiscener til utdanningsprogramma.
 * LL.artProgram.create(programId) → dekorativt utsnitt frå eit 4 × 4-ark.
 */
window.LL = window.LL || {};

LL.artProgram = (function () {
  'use strict';

  const CELLS = {
    studiespes: [0, 0],
    idrettsfag: [1, 0],
    'musikk-dans-drama': [2, 0],
    'kunst-design-arkitektur': [3, 0],
    'medier-kommunikasjon': [0, 1],
    'bygg-anlegg': [1, 1],
    elektro: [2, 1],
    'teknologi-industri': [3, 1],
    'helse-oppvekst': [0, 2],
    'restaurant-mat': [1, 2],
    naturbruk: [2, 2],
    'salg-service-reiseliv': [3, 2],
    'frisor-blomster-interior': [0, 3],
    'handverk-design': [1, 3],
    'it-medieproduksjon': [2, 3]
  };

  function create(programId) {
    const [column, row] = CELLS[programId] || [0, 0];
    const sprite = document.createElement('span');
    sprite.className = 'll-program-sprite';
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.setProperty('--sprite-x', (column * 100 / 3) + '%');
    sprite.style.setProperty('--sprite-y', (row * 100 / 3) + '%');
    return sprite;
  }

  return { create };
})();
