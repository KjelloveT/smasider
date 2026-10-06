/* Livslina — state.js
 * Spilltilstand, deriverte verdiar og seedbasert RNG.
 * Eksponerer global LL.state (IIFE-modul).
 */
window.LL = window.LL || {};

LL.state = (function () {
  'use strict';

  const SAVE_VERSION = 7;
  const LEGACY_SPENDING_CHOICES = {
    noysam: { eatingOutPerWeek: 0, socialEventsPerMonth: 0, clothingShoppingPerWeek: 0, inGamePurchasesPerWeek: 0 },
    sifo: { eatingOutPerWeek: 1, socialEventsPerMonth: 1, clothingShoppingPerWeek: 100, inGamePurchasesPerWeek: 50 },
    raus: { eatingOutPerWeek: 2, socialEventsPerMonth: 4, clothingShoppingPerWeek: 300, inGamePurchasesPerWeek: 200 }
  };
  const STARTER_ROOM = {
    owned: ['bed-tier-01', 'desk-tier-01', 'chair-tier-01'],
    equipped: {
      bed: 'bed-tier-01', desk: 'desk-tier-01', chair: 'chair-tier-01',
      sofa: null, rug: null, floorItem: null, decor: null
    }
  };
  const ROOM_ITEM_SLOT = Object.create(null);
  ['bed', 'desk', 'chair', 'rug', 'plant', 'poster', 'desk-lamp'].forEach(family => {
    for (let tier = 1; tier <= 5; tier++) {
      const slot = family === 'plant' ? 'floorItem' : ((family === 'poster' || family === 'desk-lamp') ? 'decor' : family);
      ROOM_ITEM_SLOT[family + '-tier-' + String(tier).padStart(2, '0')] = slot;
    }
  });
  ROOM_ITEM_SLOT['sofa-01'] = 'sofa';
  ROOM_ITEM_SLOT['sofa-02'] = 'sofa';

  function legacyCharacter(character) {
    const old = character || {};
    const skinMap = { '#f6d7b0': 0, '#e8b98a': 1, '#b07b4f': 2, '#7c4a2a': 3 };
    const hairMap = { kort: 0, langt: 1, krollete: 6 };
    const clothesMap = { tskjorte: 4, genser: 2, hettegenser: 0 };
    return {
      skin: Object.prototype.hasOwnProperty.call(skinMap, old.skin) ? skinMap[old.skin] : 1,
      face: 0,
      hair: hairMap[old.hair] ?? 0,
      clothes: clothesMap[old.top] ?? 0
    };
  }

  function normalizeRoom(room, oldPossessions) {
    const source = room && typeof room === 'object' ? room : {};
    const old = oldPossessions || {};
    const fallback = JSON.parse(JSON.stringify(STARTER_ROOM));
    if (!Array.isArray(source.owned) || !source.equipped) {
      if (old.bed === 'seng') fallback.equipped.bed = 'bed-tier-02';
      if (old.desk === 'gaming') fallback.equipped.desk = 'desk-tier-04';
      if (old.hobby === 'plante') fallback.equipped.floorItem = 'plant-tier-01';
      fallback.owned = Object.keys(ROOM_ITEM_SLOT).filter(id => Object.values(fallback.equipped).includes(id));
      return fallback;
    }
    const owned = Array.from(new Set(STARTER_ROOM.owned.concat(source.owned.filter(id => ROOM_ITEM_SLOT[id]))));
    const equipped = Object.assign({}, STARTER_ROOM.equipped);
    Object.keys(equipped).forEach(slot => {
      const id = source.equipped[slot];
      if (id == null) {
        if (slot === 'sofa' || slot === 'rug' || slot === 'floorItem' || slot === 'decor') equipped[slot] = null;
      } else if (ROOM_ITEM_SLOT[id] === slot && owned.includes(id)) {
        equipped[slot] = id;
      }
    });
    return { owned, equipped };
  }

  // ── Seedbasert RNG (mulberry32) — deterministisk gjeve seed ──
  let _rngState = 0;
  function seedRng(seed) {
    _rngState = seed >>> 0;
  }
  function rng() {
    _rngState |= 0;
    _rngState = (_rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(_rngState ^ (_rngState >>> 15), 1 | _rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rngInt(min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }
  function rngPick(arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  // ── Rundedefinisjon for fase 1 (6 halvår + 2 somrar) ──
  // kind: 'term' (skulehalvår) | 'summer' (sommar-mellomspel)
  const SCHOOL_ROUNDS = [
    { id: 'vg1h', kind: 'term', schoolYear: 1, period: 'Haust', label: 'VG1 haust', short: 'VG1 · haust', age: 16, months: 6, equipmentGrant: true },
    { id: 'vg1v', kind: 'term', schoolYear: 1, period: 'Vår', label: 'VG1 vår', short: 'VG1 · vår', age: 17, months: 6, equipmentGrant: false },
    { id: 'sum1', kind: 'summer', schoolYear: 1, period: 'Sommar', label: 'Sommaren etter VG1', short: 'Sommar · VG1', age: 17 },
    { id: 'vg2h', kind: 'term', schoolYear: 2, period: 'Haust', label: 'VG2 haust', short: 'VG2 · haust', age: 17, months: 6, equipmentGrant: true },
    { id: 'vg2v', kind: 'term', schoolYear: 2, period: 'Vår', label: 'VG2 vår', short: 'VG2 · vår', age: 18, months: 6, equipmentGrant: false },
    { id: 'sum2', kind: 'summer', schoolYear: 2, period: 'Sommar', label: 'Sommaren etter VG2', short: 'Sommar · VG2', age: 18 },
    { id: 'vg3h', kind: 'term', schoolYear: 3, period: 'Haust', label: 'VG3 haust', short: 'VG3 · haust', age: 18, months: 6, equipmentGrant: true },
    { id: 'vg3v', kind: 'term', schoolYear: 3, period: 'Vår', label: 'VG3 vår', short: 'VG3 · vår', age: 19, months: 6, equipmentGrant: false }
  ];

  const APPRENTICE_ROUNDS = SCHOOL_ROUNDS.slice(0, 6).concat([
    { id: 'laere1h', kind: 'term', schoolYear: 3, period: 'Haust', label: 'Fyrste læreår · haust', short: 'Læreår 1 · haust', age: 18, months: 6, apprenticeHalfYear: 1, apprenticeship: true, yearStart: true },
    { id: 'laere1v', kind: 'term', schoolYear: 3, period: 'Vår', label: 'Fyrste læreår · vår', short: 'Læreår 1 · vår', age: 19, months: 6, apprenticeHalfYear: 2, apprenticeship: true }
  ]);

  let save = null;

  function newGame(opts) {
    const seed = (opts && opts.seed) || (Date.now() >>> 0);
    seedRng(seed);
    save = {
      app: 'livslina',
      version: SAVE_VERSION,
      phase: 1,
      seed: seed,
      created: new Date().toISOString(),
      roundIndex: 0,
      finished: false,
      character: { skin: 1, face: 0, hair: 0, clothes: 0 },
      family: null,       // { id, label, ... } sett i wizard
      program: null,      // { id, name, ... } sett i wizard
      trainingRoute: null, // 'school' | 'apprenticeship' — valt for yrkesfag
      housing: 'heime',   // 'heime' | 'hybel'
      hybelAvailable: false,
      stats: {
        money: 0,
        savings: 0,        // sparekonto / BSU-saldo
        savingsIsBsu: false,
        wellbeing: 60,
        energy: 70,
        grades: 3.5
      },
      plan: null,          // gjeldande halvårsplan frå budsjettkortet
      planPreferences: null, // sist brukte plan, førehandsfylt neste halvår
      possessions: {
        moped: false,
        mopedTrimmed: false,
        phoneInsurance: false
      },
      room: JSON.parse(JSON.stringify(STARTER_ROOM)),
      flags: {},           // once-hendingar, val-spor osb.
      ledger: [],          // { round, month, income, expense, saved, balance, wellbeing, networth }
      decisions: [],       // { round, id, label, delta, note } — vendepunkt
      eventLog: [],        // { round, id, choice }
      badges: [],
      // Sporing for merke og kurver
      minWellbeing: 60,
      minEnergy: 70,
      noysamCount: 0,
      wentNegative: false,
      lowestBalance: null,
      creditRestriction: false,
      totalWage: 0
    };
    return save;
  }

  function load(obj) {
    save = migrateSave(obj);
    seedRng((save.seed || 1) >>> 0);
    // Spol RNG fram forbi allereie brukte trekk, slik at framtidige trekk er stabile
    const draws = (save._rngDraws || 0);
    for (let i = 0; i < draws; i++) rng();
    return save;
  }

  function migratePlan(plan) {
    if (!plan || typeof plan !== 'object') return plan;
    const migrated = Object.assign({}, plan);
    const spendingKeys = ['eatingOutPerWeek', 'socialEventsPerMonth', 'clothingShoppingPerWeek', 'inGamePurchasesPerWeek'];
    const hasNewSpending = spendingKeys.some(key => Object.prototype.hasOwnProperty.call(migrated, key));
    if (!hasNewSpending && LEGACY_SPENDING_CHOICES[migrated.profile]) {
      Object.assign(migrated, LEGACY_SPENDING_CHOICES[migrated.profile]);
    }
    delete migrated.profile;
    if (Array.isArray(migrated.activities)) migrated.activities = migrated.activities.slice();
    return migrated;
  }

  // Versjon 1 lagra sommaren før vårhalvåret. Versjon 3 la til ny karakterform
  // og rominventar; versjon 4 tok vare på planvala; versjon 5 bytte til konkrete
  // forbruksvanar; versjon 6 la til læreveg og saldo-/gjeldssporing; versjon 7
  // oppdaterer utstyrsstipendet for aktive løp og eksporterte lagringar.
  function migrateSave(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sourceVersion = Number(obj.version) || 0;
    if (obj.version <= 1) {
      const oldToNew = [0, 2, 1, 3, 5, 4, 6, 7];
      if (Number.isInteger(obj.roundIndex) && obj.roundIndex >= 0 && obj.roundIndex < oldToNew.length) {
        obj.roundIndex = oldToNew[obj.roundIndex];
      }
      obj.version = 2;
    }
    if (obj.version <= 2) {
      obj.character = legacyCharacter(obj.character);
      obj.room = normalizeRoom(null, obj.possessions);
      obj.version = SAVE_VERSION;
    } else {
      obj.room = normalizeRoom(obj.room, obj.possessions);
      if (!obj.character || typeof obj.character !== 'object') obj.character = { skin: 1, face: 0, hair: 0, clothes: 0 };
      ['skin', 'face', 'hair', 'clothes'].forEach(key => {
        const max = key === 'face' || key === 'hair' ? 19 : (key === 'clothes' ? 29 : 4);
        const n = Number(obj.character[key]);
        obj.character[key] = Number.isInteger(n) && n >= 0 && n <= max ? n : (key === 'skin' ? 1 : 0);
      });
    }
    if (!obj.possessions || typeof obj.possessions !== 'object') {
      obj.possessions = { moped: false, mopedTrimmed: false, phoneInsurance: false };
    }
    if (obj.trainingRoute !== 'apprenticeship' && obj.trainingRoute !== 'school') obj.trainingRoute = 'school';
    if (!Array.isArray(obj.eventLog)) obj.eventLog = [];
    if (!Array.isArray(obj.ledger)) obj.ledger = [];
    const balanceHistory = [Number(obj.stats && obj.stats.money),
      ...obj.ledger.map(entry => Number(entry.balance)),
      ...obj.eventLog.map(entry => Number(entry.moneyAfter))];
    if (typeof obj.lowestBalance === 'number' && Number.isFinite(obj.lowestBalance)) balanceHistory.push(obj.lowestBalance);
    const knownBalances = balanceHistory.filter(Number.isFinite);
    obj.lowestBalance = knownBalances.length ? Math.min(...knownBalances) : 0;
    obj.wentNegative = Boolean(obj.wentNegative) || obj.lowestBalance < 0;
    const cash = Number(obj.stats && obj.stats.money);
    obj.creditRestriction = (Boolean(obj.creditRestriction) && cash <= -5000) || cash <= -10000;
    if (!obj.planPreferences || typeof obj.planPreferences !== 'object') {
      obj.planPreferences = obj.plan && typeof obj.plan === 'object'
        ? Object.assign({}, obj.plan, { activities: Array.isArray(obj.plan.activities) ? obj.plan.activities.slice() : [] })
        : null;
    }
    obj.plan = migratePlan(obj.plan);
    obj.planPreferences = migratePlan(obj.planPreferences);
    if (obj.creditRestriction && !obj.preDebtPlanPreferences) {
      const previousPlan = obj.planPreferences || obj.plan;
      if (previousPlan) obj.preDebtPlanPreferences = JSON.parse(JSON.stringify(previousPlan));
    }
    if (obj.creditRestriction && obj.plan) applyDebtPlan(obj.plan);
    if (sourceVersion < 7) migrateProgramEquipmentGrant(obj);
    if (obj.version !== SAVE_VERSION) {
      obj.version = SAVE_VERSION;
    }
    return obj;
  }

  function migrateProgramEquipmentGrant(obj) {
    const oldProgram = obj.program;
    const data = window.LL && LL.data;
    if (!oldProgram || typeof oldProgram !== 'object' || !data || typeof data.getProgram !== 'function') return;
    const currentProgram = data.getProgram(oldProgram.id);
    if (!currentProgram) return;

    const allowedRates = [currentProgram.equipmentGrantRate]
      .concat((currentProgram.equipmentGrantVariants || []).map(variant => variant.equipmentGrantRate));
    const selectedRate = allowedRates.includes(oldProgram.selectedEquipmentGrantRate)
      ? oldProgram.selectedEquipmentGrantRate
      : currentProgram.equipmentGrantRate;
    obj.program = Object.assign({}, oldProgram, {
      equipmentGrantRate: currentProgram.equipmentGrantRate,
      equipmentGrantVariants: (currentProgram.equipmentGrantVariants || []).map(variant => Object.assign({}, variant)),
      selectedEquipmentGrantRate: selectedRate
    });
  }

  function get() { return save; }
  function stats() { return save.stats; }
  function rounds() {
    return save && save.program && save.program.type === 'yrkesfag' && save.trainingRoute === 'apprenticeship'
      ? APPRENTICE_ROUNDS
      : SCHOOL_ROUNDS;
  }
  function currentRound() { return rounds()[save.roundIndex]; }
  function isLastRound() { return save.roundIndex >= rounds().length - 1; }

  function recordBalance(state) {
    const current = state || save;
    if (!current || !current.stats) return;
    const cash = Number(current.stats.money);
    if (!Number.isFinite(current.lowestBalance)) current.lowestBalance = cash;
    else current.lowestBalance = Math.min(current.lowestBalance, cash);
    if (cash < 0) current.wentNegative = true;
    // Gjeldsgrensa slår inn ved −10 000 kr og slepper først når saldoen kjem
    // over −5 000 kr, så valet ikkje blinkar av og på frå månad til månad.
    const restricted = current.creditRestriction
      ? current.stats.money <= -5000
      : current.stats.money <= -10000;
    if (restricted && !current.creditRestriction && current.planPreferences) {
      current.preDebtPlanPreferences = JSON.parse(JSON.stringify(current.planPreferences));
    }
    if (restricted && !current.creditRestriction && current.plan) applyDebtPlan(current.plan);
    if (!restricted && current.creditRestriction && current.preDebtPlanPreferences) {
      current.planPreferences = current.preDebtPlanPreferences;
      delete current.preDebtPlanPreferences;
    }
    current.creditRestriction = restricted;
  }

  function applyDebtPlan(plan) {
    plan.canteenVisitsPerWeek = 0;
    plan.drinksPerWeek = 0;
    plan.eatingOutPerWeek = 0;
    plan.socialEventsPerMonth = 0;
    plan.clothingShoppingPerWeek = 0;
    plan.inGamePurchasesPerWeek = 0;
    plan.seasonPass = false;
    plan.savings = 0;
    plan.activities = [];
    const mobilePlans = window.LL && LL.data && LL.data.node('recurringSpending.mobilePlans');
    if (Array.isArray(mobilePlans) && mobilePlans.length) {
      plan.mobileDataPlan = mobilePlans.slice().sort((a, b) => a.pricePerMonth - b.pricePerMonth)[0].id;
    }
  }

  function age() {
    const r = currentRound();
    return r ? r.age : 16;
  }
  function isAdult() { return age() >= 18; }

  // Marker at eit RNG-trekk er brukt (for stabil load)
  function markDraw() {
    save._rngDraws = (save._rngDraws || 0) + 1;
  }
  function draw() { markDraw(); return rng(); }
  function drawInt(min, max) { markDraw(); return rngInt(min, max); }
  function drawPick(arr) { markDraw(); return rngPick(arr); }

  return {
    SAVE_VERSION,
    ROUNDS: SCHOOL_ROUNDS,
    newGame, load, get,
    stats, currentRound, rounds, isLastRound, age, isAdult, recordBalance,
    seedRng, rng, rngInt, rngPick,
    draw, drawInt, drawPick
  };
})();
