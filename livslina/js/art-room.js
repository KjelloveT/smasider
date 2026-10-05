/* Livslina — compose the measured room scene from stable product IDs. */
window.LL = window.LL || {};

LL.artRoom = (function () {
  'use strict';

  const roomModel = window.LivslinaRoomPlan;
  const ASSET_ROOT = 'assets/prototype/resources-v5/items';

  function products() {
    const shop = LL.data.getRoomShop();
    return shop ? shop.categories.flatMap(category => category.products.map(item =>
      Object.assign({ slot: category.slot, categoryId: category.id }, item))) : [];
  }

  function product(id) {
    return products().find(item => item.id === id) || null;
  }

  function selectionFor(room, previewId) {
    const equipped = Object.assign({}, room && room.equipped);
    const preview = previewId ? product(previewId) : null;
    if (preview) equipped[preview.slot] = preview.id;
    const bed = product(equipped.bed) || product('bed-tier-01');
    const desk = product(equipped.desk) || product('desk-tier-01');
    const chair = product(equipped.chair) || product('chair-tier-01');
    const sofa = product(equipped.sofa);
    const rug = product(equipped.rug);
    const floorItem = product(equipped.floorItem);
    const decor = product(equipped.decor);
    return {
      gameRoomMode: true,
      bed: String(bed.tier).padStart(2, '0'),
      bedTier: bed.tier,
      desk: String(desk.tier),
      chair: String(chair.tier),
      sofaPresent: !!sofa,
      sofa: sofa ? String(sofa.variant).padStart(2, '0') : '01',
      sofaSize: sofa ? String(sofa.variant).padStart(2, '0') : '01',
      rugPresent: !!rug,
      rug: rug ? String(rug.tier) : '01',
      'tv-benchPresent': false,
      tvPresent: false,
      pcPresent: false,
      floorItem: floorItem ? floorItem.family : 'none',
      floorVariant: floorItem ? String(floorItem.tier) : '01',
      decorKind: decor ? decor.family : 'none',
      decorTier: decor ? String(decor.tier) : '01',
      leftWall: 'none',
      rightWall: 'none'
    };
  }

  function render(target, room, previewId, label) {
    if (!target || !roomModel || !LL.data.getRoomShop()) return false;
    const scene = selectionFor(room, previewId);
    const markup = '<svg xmlns="http://www.w3.org/2000/svg" class="ll-room-svg" viewBox="0 0 480 360" role="img" aria-label="' +
      (label || 'Soverommet ditt') + '">' + roomModel.build(scene, false, ASSET_ROOT) + '</svg>';
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (parsed.querySelector('parsererror')) return false;
    target.replaceChildren(document.importNode(parsed.documentElement, true));
    return true;
  }

  function effects(room) {
    const result = { energyPerMonth: 0, wellbeingPerMonth: 0 };
    const equipped = room && room.equipped || {};
    Object.values(equipped).forEach(id => {
      const item = product(id);
      if (!item) return;
      result.energyPerMonth += Number(item.energyPerMonth) || 0;
      result.wellbeingPerMonth += Number(item.wellbeingPerMonth) || 0;
    });
    return result;
  }

  return { products, product, render, effects };
})();
