// Heimsank - Progression: poeng (valuta), opplåsing av kategoriar, merke
// Tilstand lagrast via VyrdepilStorage.getGameState/setGameState('heimsank'),
// under data.heimsank.state — skilt frå korta i data.heimsank.collections.

const Progression = (function () {
  const GAME_KEY = 'heimsank';
  const STATE_VERSION = 1;

  // Poeng per tent kort, etter sjeldsemd. Foil doblar.
  const POINTS = { vanleg: 1, sjeldgjevt: 4, segngjeten: 12, gudebore: 30 };
  const FOIL_MULTIPLIER = 2;

  // Flatt retro-påslag per kort ein alt har samla (eingongs, ved fyrste oppstart).
  const RETRO_PER_CARD = 3;

  // Kategori som alltid er open frå start.
  const DEFAULT_UNLOCKED = 'land';

  // Merke. ico = Lucide-nøkkel i icons.js, color = .b-*-klasse (Tidvis-stil).
  const BADGES = [
    // Kort-milepælar
    { id: 'fyrstekort',  name: 'Fyrste kort',  ico: 'star',     color: 'b-yellow', hint: 'Få ditt fyrste kort' },
    { id: 'samlar',      name: 'Samlar',       ico: 'layers',   color: 'b-teal',   hint: 'Få 25 kort til saman' },
    { id: 'storsamlar',  name: 'Storsamlar',   ico: 'trophy',   color: 'b-yellow', hint: 'Få 100 kort til saman' },
    { id: 'tusensamlar', name: 'Tusensamlar',  ico: 'trophy',   color: 'b-purple', hint: 'Få 1000 kort til saman' },
    // Sjeldsemd
    { id: 'sjeldsynt',   name: 'Sjeldsynt',    ico: 'gem',      color: 'b-purple', hint: 'Få eit segngjeten-kort' },
    { id: 'gudebore',    name: 'Gudebore',     ico: 'crown',    color: 'b-yellow', hint: 'Få eit gudebore-kort' },
    { id: 'glitrande',   name: 'Glitrande',    ico: 'sparkles', color: 'b-pink',   hint: 'Få eit foil-kort' },
    // Rett svar — totalt
    { id: 'rett10',      name: '10 rette',     ico: 'check',    color: 'b-teal',   hint: 'Svar rett på 10 oppgåver' },
    { id: 'rett20',      name: '20 rette',     ico: 'check',    color: 'b-teal',   hint: 'Svar rett på 20 oppgåver' },
    { id: 'rett30',      name: '30 rette',     ico: 'check',    color: 'b-blue',   hint: 'Svar rett på 30 oppgåver' },
    { id: 'rett40',      name: '40 rette',     ico: 'check',    color: 'b-blue',   hint: 'Svar rett på 40 oppgåver' },
    { id: 'rett50',      name: '50 rette',     ico: 'check',    color: 'b-pink',   hint: 'Svar rett på 50 oppgåver' },
    { id: 'rett75',      name: '75 rette',     ico: 'target',   color: 'b-pink',   hint: 'Svar rett på 75 oppgåver' },
    { id: 'reknemeister',name: 'Reknemeister', ico: 'target',   color: 'b-blue',   hint: 'Svar rett på 100 oppgåver' },
    { id: 'rett200',     name: '200 rette',    ico: 'target',   color: 'b-purple', hint: 'Svar rett på 200 oppgåver' },
    { id: 'reknegud',    name: 'Reknegud',     ico: 'crown',    color: 'b-purple', hint: 'Svar rett på 500 oppgåver' },
    // Rett svar på medium/vanskeleg
    { id: 'vrien100',    name: 'Vrien 100',    ico: 'target',   color: 'b-teal',   hint: 'Svar rett på 100 oppgåver på middels/vanskeleg' },
    { id: 'vrien200',    name: 'Vrien 200',    ico: 'target',   color: 'b-blue',   hint: 'Svar rett på 200 oppgåver på middels/vanskeleg' },
    { id: 'vrien300',    name: 'Vrien 300',    ico: 'target',   color: 'b-pink',   hint: 'Svar rett på 300 oppgåver på middels/vanskeleg' },
    { id: 'vrien400',    name: 'Vrien 400',    ico: 'crown',    color: 'b-yellow', hint: 'Svar rett på 400 oppgåver på middels/vanskeleg' },
    { id: 'vrien500',    name: 'Vrien 500',    ico: 'crown',    color: 'b-purple', hint: 'Svar rett på 500 oppgåver på middels/vanskeleg' },
    // Opplåsing
    { id: 'oppdagar',    name: 'Oppdagar',     ico: 'key',      color: 'b-teal',   hint: 'Ha tre opne kategoriar' },
    { id: 'heile-verda', name: 'Heile verda',  ico: 'globe',    color: 'b-blue',   hint: 'Lås opp alle kategoriane' },
    // Fullt hus
    { id: 'fullhus',         name: 'Fullt hus',          ico: 'check',    color: 'b-yellow', hint: 'Fyll ein kategori (6 av 6)' },
    { id: 'fullhus-vanleg',  name: 'Fullt hus — vanleg', ico: 'layers',   color: 'b-yellow', hint: 'Ein kategori med berre vanlege kort (6 av 6)' },
    { id: 'fullhus-sjeld',   name: 'Fullt hus — sjeldgjevt', ico: 'layers', color: 'b-blue', hint: 'Ein kategori med berre sjeldgjevne kort (6 av 6)' },
    { id: 'fullhus-segn',    name: 'Fullt hus — segngjeten', ico: 'layers', color: 'b-purple', hint: 'Ein kategori med berre segngjetne kort (6 av 6)' },
    { id: 'fullhus-gude',    name: 'Fullt hus — gudebore',   ico: 'crown',  color: 'b-yellow', hint: 'Ein kategori med berre gudeborne kort (6 av 6)' },
    { id: 'fullhus-foil',    name: 'Fullt hus — foil',       ico: 'sparkles', color: 'b-pink', hint: 'Ein kategori med berre foil-kort (6 av 6)' }
  ];

  // Vilkår per merke. ctx = { unlockedCount, fullCategories, totalCats, fullRarity, fullFoil }.
  const mh = (s) => s.stats.correctMidHard || 0;
  const fr = (ctx, key) => !!(ctx.fullRarity && ctx.fullRarity[key]);
  const PREDICATES = {
    fyrstekort:   (s) => s.stats.totalCardsEarned >= 1,
    samlar:       (s) => s.stats.totalCardsEarned >= 25,
    storsamlar:   (s) => s.stats.totalCardsEarned >= 100,
    tusensamlar:  (s) => s.stats.totalCardsEarned >= 1000,
    sjeldsynt:    (s) => s.stats.segngjeten >= 1,
    gudebore:     (s) => s.stats.gudebore >= 1,
    glitrande:    (s) => s.stats.foil >= 1,
    rett10:       (s) => s.stats.totalCorrect >= 10,
    rett20:       (s) => s.stats.totalCorrect >= 20,
    rett30:       (s) => s.stats.totalCorrect >= 30,
    rett40:       (s) => s.stats.totalCorrect >= 40,
    rett50:       (s) => s.stats.totalCorrect >= 50,
    rett75:       (s) => s.stats.totalCorrect >= 75,
    reknemeister: (s) => s.stats.totalCorrect >= 100,
    rett200:      (s) => s.stats.totalCorrect >= 200,
    reknegud:     (s) => s.stats.totalCorrect >= 500,
    vrien100:     (s) => mh(s) >= 100,
    vrien200:     (s) => mh(s) >= 200,
    vrien300:     (s) => mh(s) >= 300,
    vrien400:     (s) => mh(s) >= 400,
    vrien500:     (s) => mh(s) >= 500,
    oppdagar:     (s, ctx) => ctx.unlockedCount >= 3,
    'heile-verda':(s, ctx) => ctx.totalCats > 0 && ctx.unlockedCount >= ctx.totalCats,
    fullhus:      (s, ctx) => ctx.fullCategories >= 1,
    'fullhus-vanleg': (s, ctx) => fr(ctx, 'vanleg'),
    'fullhus-sjeld':  (s, ctx) => fr(ctx, 'sjeldgjevt'),
    'fullhus-segn':   (s, ctx) => fr(ctx, 'segngjeten'),
    'fullhus-gude':   (s, ctx) => fr(ctx, 'gudebore'),
    'fullhus-foil':   (s, ctx) => !!ctx.fullFoil
  };

  let state = null;

  function freshState() {
    return {
      version: STATE_VERSION,
      migratedV1: true,
      points: 0,
      earnedTotal: 0,
      unlocked: [DEFAULT_UNLOCKED],
      badges: [],
      stats: {
        totalCorrect: 0,
        correctMidHard: 0,
        totalCardsEarned: 0,
        vanleg: 0,
        sjeldgjevt: 0,
        segngjeten: 0,
        gudebore: 0,
        foil: 0
      }
    };
  }

  /**
   * Load progression state, running a one-time migration for existing players
   * (retro points + auto-unlock categories that already have collected cards).
   */
  function load() {
    let stored = null;
    try {
      stored = VyrdepilStorage.getGameState(GAME_KEY);
    } catch (e) {
      console.error('Progression load failed:', e);
    }

    if (stored && stored.version) {
      state = stored;
      // Defensiv utfylling om eldre/delvis state
      if (!state.stats) state.stats = freshState().stats;
      if (!Array.isArray(state.unlocked)) state.unlocked = [DEFAULT_UNLOCKED];
      if (!Array.isArray(state.badges)) state.badges = [];
      if (!state.unlocked.includes(DEFAULT_UNLOCKED)) state.unlocked.push(DEFAULT_UNLOCKED);
      return state;
    }

    // Fyrste oppstart: bygg state og gjer eingongs-migrasjon frå samlingane.
    state = freshState();
    try {
      const collections = VyrdepilStorage.getAllCollections(GAME_KEY) || {};
      let cardCount = 0;
      for (const catId in collections) {
        const entries = Array.isArray(collections[catId]) ? collections[catId] : [];
        if (entries.length > 0 && !state.unlocked.includes(catId)) {
          state.unlocked.push(catId);
        }
        cardCount += entries.length;
      }
      if (cardCount > 0) {
        const bonus = cardCount * RETRO_PER_CARD;
        state.points = bonus;
        state.earnedTotal = bonus;
        state.stats.totalCardsEarned = cardCount;
      }
    } catch (e) {
      console.error('Progression migration failed:', e);
    }
    save();
    return state;
  }

  function save() {
    try {
      VyrdepilStorage.setGameState(GAME_KEY, state);
    } catch (e) {
      console.error('Progression save failed:', e);
    }
  }

  function ensure() {
    if (!state) load();
    return state;
  }

  // ---- Poeng / valuta ----

  function getPoints() { return ensure().points; }
  function getEarnedTotal() { return ensure().earnedTotal; }

  /**
   * Award points for winning a card. Currency only ever grows here.
   * @param {string} rarity
   * @param {boolean} foil
   * @returns {number} points granted
   */
  function grantCard(rarity, foil) {
    ensure();
    let pts = POINTS[rarity] || POINTS.vanleg;
    if (foil) pts *= FOIL_MULTIPLIER;
    state.points += pts;
    state.earnedTotal += pts;
    state.stats.totalCardsEarned += 1;
    if (state.stats[rarity] != null) state.stats[rarity] += 1;
    if (foil) state.stats.foil += 1;
    save();
    return pts;
  }

  function recordCorrect(level) {
    ensure();
    state.stats.totalCorrect += 1;
    if (level === 'middels' || level === 'vanskeleg') {
      state.stats.correctMidHard = (state.stats.correctMidHard || 0) + 1;
    }
    // Lagrast ved neste kort-vinst (grantCard) — held skrivingar nede.
  }

  // ---- Opplåsing ----

  function isUnlocked(catId) { return ensure().unlocked.includes(catId); }
  function getCost(cat) { return cat && cat.unlockCost != null ? cat.unlockCost : 0; }
  function canAfford(cat) { return ensure().points >= getCost(cat); }

  /**
   * Spend points to unlock a category.
   * @returns {boolean} true if unlocked now
   */
  function unlock(cat) {
    ensure();
    if (!cat || isUnlocked(cat.id)) return false;
    const cost = getCost(cat);
    if (state.points < cost) return false;
    state.points -= cost;
    state.unlocked.push(cat.id);
    save();
    return true;
  }

  // ---- Merke ----

  function hasBadge(id) { return ensure().badges.includes(id); }

  /**
   * Evaluate all badges; return the list of newly earned badge objects.
   * @param {Object} ctx - { unlockedCount, fullCategories, totalCats }
   */
  function evaluate(ctx) {
    ensure();
    const context = ctx || {};
    if (context.unlockedCount == null) context.unlockedCount = state.unlocked.length;
    const earned = [];
    for (const badge of BADGES) {
      if (state.badges.includes(badge.id)) continue;
      const pred = PREDICATES[badge.id];
      if (pred && pred(state, context)) {
        state.badges.push(badge.id);
        earned.push(badge);
      }
    }
    if (earned.length > 0) save();
    return earned;
  }

  return {
    BADGES,
    POINTS,
    load, save,
    getPoints, getEarnedTotal,
    grantCard, recordCorrect,
    isUnlocked, getCost, canAfford, unlock,
    hasBadge, evaluate
  };
})();

if (typeof window !== 'undefined') window.Progression = Progression;
