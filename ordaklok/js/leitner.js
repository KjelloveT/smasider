/* Ordaklok — Leitner spaced repetition
 * Per liste: { [pairIdx]: { box: 1..5, due: epochMs } }
 * Boks-intervall (millisekund): 0, 1d, 3d, 7d, 14d, 30d
 * Vi bruker økt-baserte intervall ved å sjå på antall dagar i staden — pragmatisk.
 */
(function (root) {
  'use strict';

  const BOX_INTERVALS_MS = [
    0,                               // boks 0 (ny / feil) — alltid forfallen
    1 * 24 * 60 * 60 * 1000,         // boks 1
    3 * 24 * 60 * 60 * 1000,         // boks 2
    7 * 24 * 60 * 60 * 1000,         // boks 3
    14 * 24 * 60 * 60 * 1000,        // boks 4
    30 * 24 * 60 * 60 * 1000         // boks 5
  ];

  function getEntry(state, idx) {
    return state[idx] || { box: 1, due: 0 };
  }

  function isDue(entry, now) {
    return (entry.due || 0) <= now;
  }

  // Ranger par for spel: forfallne først (lav boks først), deretter ikkje-forfallne (lav boks først).
  function pickDuePairs(state, totalPairs, count, now) {
    now = now || Date.now();
    const all = [];
    for (let i = 0; i < totalPairs; i++) {
      const e = getEntry(state, i);
      all.push({ idx: i, box: e.box, due: e.due, isDue: isDue(e, now) });
    }
    all.sort((x, y) => {
      if (x.isDue !== y.isDue) return x.isDue ? -1 : 1;
      if (x.box !== y.box) return x.box - y.box;
      return (x.due || 0) - (y.due || 0);
    });
    const limit = Math.min(count, totalPairs);
    return all.slice(0, limit).map(x => x.idx);
  }

  function recordResult(state, idx, correct) {
    const e = getEntry(state, idx);
    let box;
    if (correct) box = Math.min(5, (e.box || 1) + 1);
    else box = 1;
    const interval = BOX_INTERVALS_MS[box] || 0;
    state[idx] = { box, due: Date.now() + interval };
    return state[idx];
  }

  function masteryStats(state, totalPairs) {
    let mastered = 0; // boks 4 og 5
    let inProgress = 0;
    let untouched = 0;
    for (let i = 0; i < totalPairs; i++) {
      const e = state[i];
      if (!e) { untouched++; continue; }
      if (e.box >= 4) mastered++;
      else inProgress++;
    }
    return { mastered, inProgress, untouched, total: totalPairs };
  }

  root.OrdaklokLeitner = {
    BOX_INTERVALS_MS,
    pickDuePairs,
    recordResult,
    masteryStats,
    isDue,
    getEntry
  };
})(window);
