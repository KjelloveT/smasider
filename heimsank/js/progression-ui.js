// Heimsank - Progression UI: poeng-display, kategori-forsider, opplåsing,
// merke-galleri og toast-varsel. Brukar Progression + CardData + icons.

const ProgressionUI = (function () {

  // ---- Poeng-display ----
  function renderPoints() {
    const el = document.getElementById('pointsValue');
    if (el) el.textContent = Progression.getPoints();
  }

  // ---- Kontekst for merke-evaluering (kolleksjons-avhengig, async) ----
  // Lastar kort-data berre for fulle samlingar (cacha) for å avgjere
  // «fullt hus» av ein sjeldsemd / foil. Sjeldsemd ligg ikkje i lagra entry.
  async function computeCtx() {
    const cats = S.cats || [];
    const unlockedCount = cats.filter(c => Progression.isUnlocked(c.id)).length;
    let cols = {};
    try { cols = VyrdepilStorage.getAllCollections('heimsank') || {}; } catch (e) { /* best effort */ }

    let fullCategories = 0;
    const fullRarity = { vanleg: false, sjeldgjevt: false, segngjeten: false, gudebore: false };
    let fullFoil = false;

    await Promise.all(cats.map(async cat => {
      const entries = Array.isArray(cols[cat.id]) ? cols[cat.id] : [];
      if (entries.length < 6) return;
      fullCategories++;
      if (entries.every(e => e.foil === true)) fullFoil = true;
      let cards;
      try { cards = await CardData.loadCategoryCards(cat); } catch (e) { return; }
      const byId = {};
      cards.forEach(c => { byId[c.id] = c; });
      const rarities = entries.map(e => (byId[e.cardId] ? byId[e.cardId].rarity : null));
      ['vanleg', 'sjeldgjevt', 'segngjeten', 'gudebore'].forEach(r => {
        if (rarities.length === 6 && rarities.every(x => x === r)) fullRarity[r] = true;
      });
    }));

    return { unlockedCount, fullCategories, totalCats: cats.length, fullRarity, fullFoil };
  }

  // Bygg kontekst, evaluer merke og vis toast for nye. Trygg å kalle ofte.
  function evaluateAndAnnounce() {
    return computeCtx()
      .then(ctx => announceBadges(Progression.evaluate(ctx)))
      .catch(() => {});
  }

  // Kategoriomslag: native knappar, faste fargar og synleg status.
  function selectCategory(cat) {
    S.selCat = cat;
    document.getElementById('selectedCategory').textContent = cat.label;
    document.getElementById('startBtn').disabled = false;
    renderCovers(S.cats);
    initShowcase(cat);
  }
  function renderCovers(cats) {
    const grid = document.getElementById('catsGrid');
    grid.replaceChildren();
    const stored = VyrdepilStorage.getAllCollections('heimsank') || {};
    const points = Progression.getPoints();
    const orderedCats = cats.map((cat, index) => ({
      cat, index,
      unlocked: Progression.isUnlocked(cat.id),
      need: Math.max(0, Progression.getCost(cat) - points)
    })).sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      if (!a.unlocked && a.need !== b.need) return a.need - b.need;
      return a.index - b.index;
    });
    orderedCats.forEach(({ cat, unlocked }) => {
      const selected = S.selCat?.id === cat.id;
      const card = Vy.el('article', 'hs-category');
      HeimsankUI.category(card, cat.id);
      card.dataset.selected = String(selected);
      const visual = Vy.el('div', 'hs-category-visual');
      visual.appendChild(HeimsankUI.icon(HeimsankUI.categoryIcon(cat.id), 38));
      const entries = Array.isArray(stored[cat.id]) ? stored[cat.id] : [];
      if (entries.length) CardData.loadCategoryCards(cat).then(cards => {
        if (!card.isConnected) return;
        const pick = cards.find(c => c.id === entries[0]?.cardId) || CardData.pickCoverCard(cards);
        if (!pick) return;
        const img = document.createElement('img');
        img.src = pick.img; img.alt = ''; img.loading = 'lazy';
        img.addEventListener('load', () => visual.classList.add('has-image'), { once: true });
        img.addEventListener('error', () => img.remove(), { once: true });
        visual.appendChild(img);
      }).catch(() => {});
      const body = Vy.el('div', 'hs-category-body');
      body.appendChild(Vy.el('h3', '', cat.label));
      const count = entries.length;
      const cost = Progression.getCost(cat);
      const need = Math.max(0, cost - Progression.getPoints());
      body.appendChild(Vy.el('span', 'hs-category-status', unlocked
        ? (selected ? '✓ Vald · ' : '') + count + ' av 6 kort'
        : (need ? 'Du treng ' + need + ' poeng til' : 'Klar til å låsast opp')));
      const button = Vy.el('button', 'hs-btn', unlocked ? (selected ? 'Vald' : 'Vel kategori') : 'Lås opp');
      if (unlocked) {
        button.setAttribute('aria-pressed', String(selected));
        button.setAttribute('aria-label', 'Vel ' + cat.label);
        button.addEventListener('click', () => {
          selectCategory(cat);
          grid.querySelector('[data-category="' + cat.id + '"] button')?.focus({ preventScroll: true });
        });
      } else {
        button.prepend(HeimsankUI.icon('lock', 14));
        const price = Vy.el('span', 'hs-cost-bubble');
        price.append(HeimsankUI.icon('coins', 13), document.createTextNode(String(cost)));
        button.appendChild(price);
        button.setAttribute('aria-label', 'Lås opp ' + cat.label + ' for ' + cost + ' poeng');
        button.addEventListener('click', () => handleUnlock(cat));
      }
      body.appendChild(button); card.append(visual, body); grid.appendChild(card);
    });
  }
  function handleUnlock(cat) {
    if (Progression.isUnlocked(cat.id)) return;
    if (!Progression.canAfford(cat)) {
      toast('Du treng ' + (Progression.getCost(cat) - Progression.getPoints()) + ' poeng til for ' + cat.label + '.', 'lock', 'warn');
      return;
    }
    Progression.unlock(cat);
    renderPoints(); renderCovers(S.cats);
    document.querySelector('[data-category="' + cat.id + '"] button')?.focus({ preventScroll: true });
    toast(cat.label + ' er låst opp!', 'key', 'good');
    evaluateAndAnnounce();
  }

  // ---- Merke ----
  function announceBadges(earned) {
    (earned || []).forEach(b => toast(`Nytt merke: ${b.name}`, b.ico, 'badge'));
  }

  function renderBadgeGallery() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Progression.BADGES.forEach(b => {
      const earned = Progression.hasBadge(b.id);
      const cell = document.createElement('div');
      cell.className = `bdg ${b.color}` + (earned ? '' : ' is-locked');

      const medal = document.createElement('div');
      medal.className = 'bdg-medal';
      medal.innerHTML = ICON(b.ico, 30);
      cell.appendChild(medal);

      const name = document.createElement('div');
      name.className = 'bdg-name';
      name.textContent = b.name;
      cell.appendChild(name);

      const hint = document.createElement('div');
      hint.className = 'bdg-hint';
      hint.textContent = b.hint;
      cell.appendChild(hint);

      if (!earned) {
        const lock = document.createElement('div');
        lock.className = 'bdg-lock';
        lock.append(HeimsankUI.icon('lock', 12), Vy.el('span', '', 'Ikkje oppnådd'));
        cell.appendChild(lock);
      }
      if (earned) cell.appendChild(Vy.el('div', 'bdg-lock', '✓ Oppnådd'));
      grid.appendChild(cell);
    });
  }

  function openBadgeGallery() {
    renderBadgeGallery();
    HeimsankUI.open('badgeModal', closeBadgeGallery);
  }
  function closeBadgeGallery() {
    HeimsankUI.close('badgeModal');
  }

  /* Kort melding — sjå Vy.toast() i js/vyrdepil-util.js. Låg tidlegare her i
     eiga utgåve; flytta til fellesmodulen så rettingar treffer alle verktøya,
     og fordi den gamle stilen fylte flata med --accent og fall under
     AA-kravet i dei sju mørke temaa (AGENTS.md §3.2). */
  function toast(msg, icon, kind) {
    return Vy.toast(msg, { icon: icon, kind: kind });
  }

  // ---- Etter ein kort-vinst (kalla frå main.js afterReveal) ----
  // Deler poeng-tildeling (synkront) frå merke-evaluering (async, via
  // evaluateAndAnnounce etter at samlinga er oppdatert).
  function awardCardPoints(card, foil) {
    const pts = Progression.grantCard(card.rarity, foil);
    renderPoints();
    return pts;
  }

  // ---- Synk med andre faner ----
  // Heimsank kan vere open i fleire faner, eller kome att frå bfcache med
  // gamle tal. Les poeng og opplåsingar på nytt når ei anna fane har skrive
  // til lageret, eller når sida blir vist att, og teikn berre om noko er endra.
  function syncFromStorage() {
    const snapshot = () => JSON.stringify([
      Progression.getPoints(),
      (S.cats || []).map(c => Progression.isUnlocked(c.id))
    ]);
    const before = snapshot();
    Progression.reload();
    if (snapshot() === before) return;
    renderPoints();
    if (S.cats && S.cats.length) renderCovers(S.cats);
  }

  window.addEventListener('storage', e => {
    // key er null når ei anna fane tømer heile localStorage
    if (e.key === null || e.key === 'VyrdepilStorage') syncFromStorage();
  });
  window.addEventListener('pageshow', e => {
    if (e.persisted) syncFromStorage();
  });

  return {
    renderPoints, renderCovers, renderBadgeGallery,
    openBadgeGallery, closeBadgeGallery,
    handleUnlock, toast, announceBadges,
    awardCardPoints, evaluateAndAnnounce
  };
})();

if (typeof window !== 'undefined') {
  window.ProgressionUI = ProgressionUI;
  window.openBadgeGallery = ProgressionUI.openBadgeGallery;
  window.closeBadgeGallery = ProgressionUI.closeBadgeGallery;
}
