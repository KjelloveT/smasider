/* Livslina — bedroom preview, shop choices and equipped room effects. */
window.LL = window.LL || {};

LL.uiRoom = (function () {
  'use strict';

  let categoryId = 'bed';
  let selectedId = 'bed-tier-01';
  let previewId = null;

  function state() { return LL.state.get(); }
  function categories() { return LL.data.getRoomShop().categories; }
  function activeCategory() { return categories().find(item => item.id === categoryId) || categories()[0]; }
  function activeProduct() { return LL.artRoom.product(selectedId); }

  function details(item) {
    if (!item) return { label: 'Vare', description: '', family: '' };
    if (item.family === 'bed') {
      const bed = window.LivslinaBedPriceLadder.tiers[item.tier - 1];
      return { label: bed.label, description: bed.description, family: item.family };
    }
    if (item.family === 'sofa') {
      return item.variant === 1
        ? { label: 'Brukt tosetar', description: 'Ein enkel sofa med plass til ein ven.', family: item.family }
        : { label: 'Mjuk sofa', description: 'Ei litt større sofa med mjuke puter.', family: item.family };
    }
    const option = window.LivslinaItemCatalog.families[item.family].options[item.tier - 1];
    return { label: option.label, description: option.description, family: item.family };
  }

  function renderScene() {
    const room = state().room;
    const ok = LL.artRoom.render(document.getElementById('roomDiorama'), room, previewId, 'Soverommet ditt');
    LL.artRoom.render(document.getElementById('homeDiorama'), room, null, 'Rommet ditt');
    document.getElementById('homeRoomEffects').textContent = 'Du kan innreie rommet vidare etter kvart som du får råd.';
    if (!ok) document.getElementById('roomShopStatus').textContent = 'Klarte ikkje setje saman rommet. Kontroller at dei lokale romressursane er tilgjengelege.';
  }

  function renderCategories() {
    const wrap = document.getElementById('roomCategories');
    wrap.textContent = '';
    categories().forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vp-button vp-button--compact ll-shop-category';
      button.id = 'room-tab-' + category.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'roomProducts');
      button.setAttribute('aria-selected', String(category.id === categoryId));
      button.textContent = category.label;
      button.addEventListener('click', () => {
        categoryId = category.id;
        const equippedId = state().room.equipped[category.slot];
        selectedId = category.products.some(item => item.id === equippedId) ? equippedId : category.products[0].id;
        previewId = selectedId;
        render();
      });
      wrap.appendChild(button);
    });
  }

  function renderProducts(category) {
    const wrap = document.getElementById('roomProducts');
    wrap.textContent = '';
    wrap.setAttribute('aria-labelledby', 'room-tab-' + category.id);
    category.products.forEach(item => {
      const meta = details(item);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vp-button vp-button--quiet ll-shop-option';
      button.setAttribute('aria-pressed', String(item.id === selectedId));
      const name = document.createElement('strong');
      name.textContent = meta.label;
      const price = document.createElement('span');
      const owned = state().room.owned.includes(item.id);
      price.textContent = owned ? (state().room.equipped[category.slot] === item.id ? 'På rommet' : 'Eigd') : (item.price ? LL.util.kr(item.price) : 'Startmøbel');
      button.append(name, price);
      button.addEventListener('click', () => {
        selectedId = item.id;
        previewId = item.id;
        render();
      });
      wrap.appendChild(button);
    });
  }

  function renderSelected() {
    const item = activeProduct();
    if (!item) return;
    const meta = details(item);
    const current = state();
    const category = activeCategory();
    const isOwned = current.room.owned.includes(item.id);
    const isEquipped = current.room.equipped[category.slot] === item.id;
    document.getElementById('roomSelectedName').textContent = meta.label;
    document.getElementById('roomSelectedDescription').textContent = meta.description;
    document.getElementById('roomSelectedPrice').textContent = isOwned ? (isEquipped ? 'På rommet' : 'Allereie kjøpt') : LL.util.kr(item.price);
    const action = document.getElementById('roomAction');
    action.disabled = isEquipped || (!isOwned && (current.creditRestriction || current.stats.money < item.price));
    action.textContent = isEquipped ? 'Allereie i bruk' : (isOwned ? 'Ta i bruk gratis' : ('Kjøp for ' + LL.util.kr(item.price)));
    action.setAttribute('aria-label', isEquipped ? meta.label + ' er allereie på rommet' :
      (isOwned ? 'Ta i bruk ' + meta.label + ' utan kostnad' : 'Kjøp ' + meta.label + ' for ' + LL.util.kr(item.price)));
    document.getElementById('roomBalance').textContent = LL.util.kr(current.stats.money);
    document.getElementById('roomCategoryHint').textContent = category.hint;
    document.getElementById('roomShopStatus').textContent = isEquipped ? 'Denne vara står på rommet no.' :
      (isOwned ? 'Du eig vara frå før. Det kostar ingenting å byte til henne.' :
        (current.creditRestriction ? 'Nye kjøp er sette på pause medan kontoen er under gjeldsgrensa.' :
          (current.stats.money < item.price ? 'Du manglar ' + LL.util.kr(item.price - current.stats.money) + ' for å kjøpe denne vara.' : 'Kjøpet blir trekt frå brukskontoen din.')));
  }

  function render() {
    const category = activeCategory();
    renderCategories();
    renderProducts(category);
    renderSelected();
    renderScene();
  }

  function buyOrEquip() {
    const item = activeProduct();
    const category = activeCategory();
    const current = state();
    if (!item || current.room.equipped[category.slot] === item.id) return;
    const wasOwned = current.room.owned.includes(item.id);
    if (!wasOwned) {
      if (current.creditRestriction || current.stats.money < item.price) return;
      current.stats.money -= item.price;
      LL.state.recordBalance(current);
      current.room.owned.push(item.id);
    }
    current.room.equipped[category.slot] = item.id;
    previewId = null;
    LL.storage.saveActive(current);
    LL.main.toast(details(item).label + (wasOwned ? ' er no på rommet.' : ' kjøpt.'));
    render();
  }

  function open() {
    const current = state();
    const category = activeCategory();
    const equippedId = current.room.equipped[category.slot];
    selectedId = category.products.some(item => item.id === equippedId) ? equippedId : category.products[0].id;
    previewId = selectedId;
    LL.main.showScreen('screen-room');
    render();
  }

  function init() {
    document.getElementById('btnRoomShop').addEventListener('click', open);
    document.getElementById('btnRoomBack').addEventListener('click', () => LL.main.enterHome());
    document.getElementById('roomAction').addEventListener('click', buyOrEquip);
  }

  return { init, open, render, renderScene };
})();
