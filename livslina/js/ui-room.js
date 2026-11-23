/* Livslina — bedroom preview, shop choices and equipped room effects. */
window.LL = window.LL || {};

LL.uiRoom = (function () {
  'use strict';

  let categoryId = 'bed';
  let selectedId = 'bed-tier-01';
  let previewId = null;
  let roomId = 'bedroom';
  let condition = '';
  let destination = '';

  function state() { return LL.state.get(); }
  function adult() { return state().phase === 2; }
  function conditionOf(item) {
    return item.condition || (item.variant === 1 || item.tier <= 2 ? 'used' : 'new');
  }
  function categories() {
    const all = LL.data.getRoomShop().categories;
    if (!adult()) return all.filter(category => !category.adultOnly);
    const s = state(), model = LL.phase2Rooms;
    const stored = roomId === 'storage' ? new Set(model.stock(s).map(item => item.id)) : null;
    return all.map(category => ({ ...category, products: category.products.filter(item =>
      (!condition || conditionOf(item) === condition) && (stored ? stored.has(item.id) : model.matches(s, { ...item, slot: category.slot }, roomId))) }))
      .filter(category => category.products.length);
  }
  function activeCategory() { return categories().find(item => item.id === categoryId) || categories()[0]; }
  function activeProduct() { return LL.artRoom.product(selectedId); }

  function details(item) {
    if (!item) return { label: 'Vare', description: '', family: '' };
    if (item.label) return item;
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
    const stage = document.getElementById('roomDiorama');
    if (adult()) {
      stage.hidden = roomId === 'storage';
      if (!stage.hidden) {
        const item = activeProduct();
        const preview = previewId && item && !LL.phase2Rooms.issue(state(), item, roomId) ? previewId : null;
        LL.artRoom.render(stage, LL.phase2Rooms.view(state(), roomId), preview, LL.phase2Rooms.label(state(), roomId), roomId);
      }
      return;
    }
    stage.hidden = false;
    const ok = LL.artRoom.render(stage, room, previewId, 'Soverommet ditt');
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
        const equippedId = adult() ? LL.phase2Rooms.view(state(), roomId).equipped[category.slot] : state().room.equipped[category.slot];
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
      const current = state();
      const owned = current.room.owned.includes(item.id);
      const location = adult() && owned ? LL.phase2Rooms.location(current, { ...item, slot: category.slot }) : '';
      price.textContent = adult() && owned ? (location ? LL.phase2Rooms.label(current, location) : 'På lager') :
        owned ? (current.room.equipped[category.slot] === item.id ? 'På rommet' : 'Eigd') :
        (item.price ? LL.util.kr(item.price) + (adult() ? (conditionOf(item) === 'new' ? ' · ny' : ' · brukt') : '') : 'Startmøbel');
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
    if (adult()) { renderAdultSelected(current, item, meta); return; }
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

  function optionSelect(id, label, choices, value, change) {
    const wrap = Vy.el('label', 'vp-field');
    const control = Vy.el('select', 'vp-input');
    control.id = id;
    choices.forEach(([key, text]) => {
      const option = Vy.el('option', '', text); option.value = key; control.append(option);
    });
    control.value = value;
    control.addEventListener('change', () => change(control.value));
    wrap.append(Vy.el('span', '', label), control);
    return wrap;
  }

  function renderAdultControls() {
    const wrap = document.getElementById('roomAdultControls');
    wrap.hidden = !adult();
    wrap.replaceChildren();
    document.getElementById('roomTitle').textContent = adult() ? 'Bustad og eigedelar' : 'Soverom og butikk';
    if (!adult()) return;
    const s = state(), model = LL.phase2Rooms;
    const choices = [...model.rooms(s).map(id => [id, model.label(s, id)]), ['storage', 'På lager']];
    const transport = LL.uiPhase2.button('Planlegg transport', () => LL.uiPhase2Plan.open('adultPlanTransport'), 'quiet');
    transport.hidden = Boolean(s.adult.run || s.adult.complete);
    wrap.append(optionSelect('roomViewSelect', 'Rom eller lager', choices, roomId, value => {
      roomId = value; condition = ''; previewId = null; render();
    }), optionSelect('roomCondition', 'Vis varer', [['', 'Alle'], ['used', 'Brukte'], ['new', 'Nye']], condition, value => {
      condition = value; render();
    }), transport);
  }

  function dimensions(item) {
    const model = window.LivslinaRoomPlan;
    const fixture = model.roomFixtures[item.family];
    if (fixture) return [fixture.w, fixture.d, fixture.h];
    if (item.family === 'bed' || item.family === 'sofa') {
      const size = model.variants[item.family][item.variant === 2 ? 1 : 0];
      return [size.w, size.d, size.h];
    }
    return window.LivslinaItemCatalog.families[item.family]?.options[item.tier - 1].dimensions;
  }

  function renderAdultSelected(s, item, meta) {
    const model = LL.phase2Rooms;
    const targets = model.rooms(s).filter(id => model.matches(s, item, id));
    const targetPanel = document.getElementById('roomDestination');
    targetPanel.replaceChildren();
    targetPanel.hidden = roomId !== 'storage';
    if (roomId === 'storage') {
      destination = targets.includes(destination) ? destination : targets[0] || '';
      if (targets.length) targetPanel.append(optionSelect('roomDestinationSelect', 'Plasser i', targets.map(id => [id, model.label(s, id)]), destination, value => {
        destination = value; renderSelected();
      }));
    }
    const target = roomId === 'storage' ? destination : roomId;
    const owned = s.room.owned.includes(item.id), location = model.location(s, item), fitted = location === target;
    const issue = model.issue(s, item, target);
    const unavailable = s.adult.run || (!owned && (s.creditRestriction || s.stats.money < item.price));
    const action = document.getElementById('roomAction');
    action.disabled = Boolean(unavailable || issue || fitted);
    action.textContent = fitted ? 'På plass' : owned ? 'Plasser utan kostnad' : 'Kjøp for ' + LL.util.kr(item.price);
    action.removeAttribute('aria-label');
    document.getElementById('roomSelectedName').textContent = meta.label;
    const size = dimensions(item);
    document.getElementById('roomSelectedDescription').textContent = meta.description + (size ? ' · ' + size.join(' × ') + ' cm' : '');
    document.getElementById('roomSelectedPrice').textContent = owned ? (location ? model.label(s, location) : 'På lager') : LL.util.kr(item.price);
    const tools = document.getElementById('roomInventoryActions');
    tools.hidden = !owned || Boolean(s.adult.run);
    tools.replaceChildren();
    const save = () => { previewId = null; LL.storage.saveActive(s); render(); };
    if (owned && location) tools.append(LL.uiPhase2.button('Set på lager', () => { model.store(s, item); save(); }, 'quiet'));
    if (owned && !model.starter(item.id)) tools.append(LL.uiPhase2.button('Sel for ' + LL.util.kr(model.sale(item)), () => { model.sell(s, item); save(); }, 'quiet'));
    document.getElementById('roomShopStatus').textContent = issue || (unavailable ? 'Kjøp og plassering krev dekning og eit avslutta speleår.' :
      (owned ? 'Du eig vara. Ho kan stå på éin stad om gongen.' : 'Kjøpet blir trekt éin gong frå kontoen.'));
    document.getElementById('roomBalance').textContent = LL.util.kr(s.stats.money);
    document.getElementById('roomCategoryHint').textContent = activeCategory().hint;
  }

  function render() {
    const category = activeCategory();
    renderAdultControls();
    renderCategories();
    document.getElementById('roomSelectedProduct').hidden = !category;
    if (!category) {
      document.getElementById('roomProducts').replaceChildren();
      document.getElementById('roomCategoryHint').textContent = '';
      document.getElementById('roomShopStatus').textContent = roomId === 'storage' ? 'Ingen varer på lager med dette filteret.' : 'Ingen varer passar med dette filteret.';
      renderScene();
      return;
    }
    categoryId = category.id;
    if (!category.products.some(item => item.id === selectedId)) selectedId = category.products[0].id;
    if (previewId && previewId !== selectedId) previewId = null;
    if (!adult()) {
      document.getElementById('roomDestination').hidden = true;
      document.getElementById('roomInventoryActions').hidden = true;
    }
    renderProducts(category);
    renderSelected();
    renderScene();
  }

  function buyOrEquip() {
    const item = activeProduct();
    const category = activeCategory();
    const current = state();
    if (adult()) {
      if (item && !current.adult.run && LL.phase2Rooms.buy(current, item, roomId === 'storage' ? destination : roomId)) {
        previewId = null;
        LL.storage.saveActive(current);
        render();
      }
      return;
    }
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
    roomId = 'bedroom'; condition = ''; destination = '';
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
