/* Faktiske utslag frå årsplanen og hendingsvala. */
window.LL = window.LL || {};
LL.phase2Effects = (function () {
  'use strict';
  const keys = ['money', 'energy', 'wellbeing', 'social'];

  function changes(before, after) {
    return Object.fromEntries(keys.map(key => [key, after[key] - before[key]]));
  }

  function record(run, id, label, deltas) {
    const values = keys.filter(key => Math.abs(deltas[key]) > 0.000001);
    if (!values.length) return;
    run.impacts ??= [];
    let entry = run.impacts.find(item => item.id === id);
    if (!entry) {
      entry = { id, label, deltas: {} };
      run.impacts.push(entry);
    }
    values.forEach(key => { entry.deltas[key] = (entry.deltas[key] || 0) + deltas[key]; });
  }

  function measure(s, key, contributions) {
    const before = s.stats[key];
    const net = contributions.reduce((sum, entry) => sum + entry[2], 0);
    const after = LL.util.clamp(before + net, 0, 100);
    s.stats[key] = after;
    const excess = net - (after - before);
    const matching = contributions.filter(entry => Math.sign(entry[2]) === Math.sign(excess));
    const total = matching.reduce((sum, entry) => sum + entry[2], 0);
    for (const entry of contributions) {
      const [id, label, amount] = entry;
      const attributed = total && matching.includes(entry) ? amount - excess * amount / total : amount;
      record(s.adult.run, id, label, { [key]: attributed });
    }
  }

  function sparseRoom(s) {
    const room = s.room?.equipped || {};
    return !room.sofa && !(room.rug && room.decor);
  }

  return { changes, record, measure, sparseRoom };
})();
