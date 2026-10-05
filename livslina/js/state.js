/* Livslina — state.js
 * Spilltilstand, deriverte verdiar og seedbasert RNG.
 * Eksponerer global LL.state (IIFE-modul).
 */
window.LL = window.LL || {};

LL.state = (function () {
  'use strict';

  const SAVE_VERSION = 2;

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
  const ROUNDS = [
    { id: 'vg1h', kind: 'term', schoolYear: 1, period: 'Haust', label: 'VG1 haust', short: 'VG1 · haust', age: 16, months: 6, equipmentGrant: true },
    { id: 'vg1v', kind: 'term', schoolYear: 1, period: 'Vår', label: 'VG1 vår', short: 'VG1 · vår', age: 17, months: 6, equipmentGrant: false },
    { id: 'sum1', kind: 'summer', schoolYear: 1, period: 'Sommar', label: 'Sommaren etter VG1', short: 'Sommar · VG1', age: 17 },
    { id: 'vg2h', kind: 'term', schoolYear: 2, period: 'Haust', label: 'VG2 haust', short: 'VG2 · haust', age: 17, months: 6, equipmentGrant: true },
    { id: 'vg2v', kind: 'term', schoolYear: 2, period: 'Vår', label: 'VG2 vår', short: 'VG2 · vår', age: 18, months: 6, equipmentGrant: false },
    { id: 'sum2', kind: 'summer', schoolYear: 2, period: 'Sommar', label: 'Sommaren etter VG2', short: 'Sommar · VG2', age: 18 },
    { id: 'vg3h', kind: 'term', schoolYear: 3, period: 'Haust', label: 'VG3 haust', short: 'VG3 · haust', age: 18, months: 6, equipmentGrant: true },
    { id: 'vg3v', kind: 'term', schoolYear: 3, period: 'Vår', label: 'VG3 vår', short: 'VG3 · vår', age: 19, months: 6, equipmentGrant: false }
  ];

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
      character: {
        skin: '#e8b98a',
        hair: 'kort',
        hairColor: '#26201c',
        top: 'tskjorte',
        topColor: '#e63946'
      },
      family: null,       // { id, label, ... } sett i wizard
      program: null,      // { id, name, ... } sett i wizard
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
      possessions: {       // koplar til diorama-slots
        bed: 'madrass',
        desk: 'enkel',
        hobby: 'plante',
        moped: false,
        mopedTrimmed: false,
        phoneInsurance: false
      },
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

  // Versjon 1 lagra sommaren før vårhalvåret. Behald aktiv speleframdrift,
  // men flytt dei gamle rundenumra til den kronologiske rekkjefølgja.
  function migrateSave(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (obj.version === 1) {
      const oldToNew = [0, 2, 1, 3, 5, 4, 6, 7];
      if (Number.isInteger(obj.roundIndex) && obj.roundIndex >= 0 && obj.roundIndex < oldToNew.length) {
        obj.roundIndex = oldToNew[obj.roundIndex];
      }
      obj.version = SAVE_VERSION;
    }
    return obj;
  }

  function get() { return save; }
  function stats() { return save.stats; }
  function currentRound() { return ROUNDS[save.roundIndex]; }
  function rounds() { return ROUNDS; }
  function isLastRound() { return save.roundIndex >= ROUNDS.length - 1; }

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
    ROUNDS,
    newGame, load, get,
    stats, currentRound, rounds, isLastRound, age, isAdult,
    seedRng, rng, rngInt, rngPick,
    draw, drawInt, drawPick
  };
})();
