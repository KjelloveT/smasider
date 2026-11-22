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
  const ADULT_CELLS = {
    adultCommunity: [0, 0], adultKitchen: [1, 0], adultBills: [2, 0], adultTravel: [3, 0],
    adultStudy: [0, 1], adultGuidance: [1, 1], adultNursing: [2, 1], adultTeaching: [3, 1],
    adultCarpentry: [0, 2], adultIt: [1, 2], adultRetail: [2, 2], adultWarehouse: [3, 2],
    adultCafe: [0, 3], adultRest: [1, 3], adultMoving: [2, 3], adultGoals: [3, 3]
  };
  const STORY_CELLS = {
    adultSchedule: [0, 0], adultBudgetChoice: [1, 0], adultMilestone: [2, 0],
    adultFriendsTalk: [0, 1], adultBoxes: [1, 1], adultRainBus: [2, 1],
    adultShift: [0, 2], adultWard: [1, 2], adultPhoneRepair: [2, 2]
  };

  function create(key) {
    const story = STORY_CELLS[key];
    const adult = Boolean(story || ADULT_CELLS[key]);
    const [column, row] = story || ADULT_CELLS[key] || CELLS[key] || CELLS.study;
    const steps = story ? 2 : 3;
    const sprite = document.createElement('span');
    sprite.className = 'll-event-sprite' + (adult ? ' ll-event-sprite--adult' : '');
    if (story) sprite.classList.add('ll-event-sprite--story');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.setProperty('--sprite-x', (column * 100 / steps) + '%');
    sprite.style.setProperty('--sprite-y', (row * 100 / steps) + '%');
    return sprite;
  }

  return { create };
})();
