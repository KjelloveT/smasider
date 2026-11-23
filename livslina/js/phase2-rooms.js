/* Ei eigd vare har høgst éin plass. Uplasserte varer ligg på lager. */
window.LL = window.LL || {};
LL.phase2Rooms = (function () {
  'use strict';
  const labels = { bedroom: 'Soverom', living: 'Stove', kitchen: 'Kjøkenkrok', workroom: 'Arbeidsrom', extra: 'Ekstra soverom' };
  const storageKeys = Object.keys(labels);
  const rooms = s => LL.phase2Housing.option(s.adult.housing).rooms || ['bedroom'];
  const label = (s, id) => id === 'extra' && s.adult.household?.child ? 'Barnerom' : labels[id];
  const starter = id => ['bed-tier-01', 'desk-tier-01', 'chair-tier-01'].includes(id);

  function matches(s, item, id) {
    if (!rooms(s).includes(id)) return false;
    if (item.rooms) return item.rooms.includes(id);
    if (item.slot === 'bed') return id === 'bedroom' || id === 'extra';
    if (item.slot === 'sofa') return rooms(s).includes('living') ? id === 'living' : id === 'bedroom';
    if (item.slot === 'rug') return id !== 'kitchen';
    if (item.slot === 'floorItem') return ['bedroom', 'living', 'extra'].includes(id);
    return id === 'bedroom' || id === 'workroom';
  }

  function catalogue() {
    return (LL.data.getRoomShop?.()?.categories || []).flatMap(category => category.products.map(item => ({ ...item, slot: category.slot })));
  }
  function view(s, id) {
    return { equipped: s.room.placements?.[id] || {}, adultRoom: true };
  }

  function migrate(s) {
    const products = catalogue();
    const live = s.room;
    if (!live.placements) {
      live.placements = {};
      for (const key of Object.values(live.equipped).filter(Boolean)) {
        const item = products.find(p => p.id === key);
        if (!item) continue;
        const first = item.slot === 'sofa' || item.slot === 'rug' ? 'living' :
          ['desk', 'chair', 'decor'].includes(item.slot) ? 'workroom' : 'bedroom';
        const target = [first, ...rooms(s)].find(id => matches(s, item, id));
        if (target) (live.placements[target] ||= {})[item.slot] = key;
      }
    }
    const used = new Set();
    const clean = {};
    for (const id of storageKeys) {
      for (const [slot, key] of Object.entries(live.placements[id] || {})) {
        const item = products.find(p => p.id === key && p.slot === slot);
        if (!item || !matches(s, item, id) || !live.owned.includes(key) || used.has(key)) continue;
        (clean[id] ||= {})[slot] = key;
        used.add(key);
      }
      const installed = clean[id];
      if (installed && !installed['tv-bench']) delete installed.tv;
      if (installed && !installed.desk) {
        delete installed.pc;
        const decor = products.find(p => p.id === installed.decor);
        if (decor?.family === 'desk-lamp') delete installed.decor;
      }
    }
    live.placements = clean;
  }

  function location(s, item) {
    return Object.keys(s.room.placements || {}).find(id => s.room.placements[id][item.slot] === item.id);
  }

  function issue(s, item, id) {
    if (!matches(s, item, id)) return 'Denne vara har ikkje ein eigna plass i dette rommet.';
    const equipment = view(s, id).equipped;
    if (item.slot === 'tv' && !equipment['tv-bench']) return 'Set inn ein TV-benk fyrst.';
    if ((item.slot === 'pc' || item.family === 'desk-lamp') && !equipment.desk) return 'Set inn eit arbeidsbord fyrst.';
    return '';
  }

  function store(s, item) {
    const id = location(s, item);
    if (!id) return false;
    const items = s.room.placements[id];
    delete items[item.slot];
    if (item.slot === 'tv-bench') delete items.tv;
    if (item.slot === 'desk') {
      delete items.pc;
      if (items.decor?.startsWith('desk-lamp-')) delete items.decor;
    }
    return true;
  }

  function buy(s, item, id) {
    if (issue(s, item, id)) return false;
    if (!s.room.owned.includes(item.id)) {
      if (s.creditRestriction || s.stats.money < item.price) return false;
      s.stats.money -= item.price;
      LL.state.recordBalance(s);
      s.room.owned.push(item.id);
    }
    if (location(s, item) !== id) {
      store(s, item);
      (s.room.placements[id] ||= {})[item.slot] = item.id;
    }
    return true;
  }

  function sale(item) { return Math.floor(item.price * .55 / 10) * 10; }

  function sell(s, item) {
    const index = s.room.owned.indexOf(item.id);
    if (index < 0 || starter(item.id)) return false;
    store(s, item);
    s.room.owned.splice(index, 1);
    s.stats.money += sale(item);
    LL.state.recordBalance(s);
    return true;
  }

  function stock(s) {
    const owned = new Set(s.room.owned);
    return catalogue().filter(item => owned.has(item.id) && !location(s, item));
  }

  function comfort(s) {
    const placed = new Set(Object.values(s.room.placements || {}).flatMap(room => Object.values(room)));
    const installed = catalogue().filter(item => placed.has(item.id) && (item.rooms || item.family === 'desk-lamp'));
    return {
      energy: Math.min(.35, installed.reduce((sum, item) => sum + (item.energyPerMonth || 0), 0)),
      wellbeing: Math.min(.15, installed.reduce((sum, item) => sum + (item.wellbeingPerMonth || 0) * .15, 0))
    };
  }

  return { rooms, label, starter, matches, migrate, view, location, issue, buy, store, sale, sell, stock, comfort };
})();
