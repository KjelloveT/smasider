/* Læringsmål for heile Ljodstigen. Framgangen måler fullførte mål,
   ikkje treffprosent eller ei fagleg vurdering. Gamle bokstavdata står urørte. */
(function (root) {
  'use strict';

  const REQUIRED = 2;

  function hydrate(raw) {
    const out = { version: 1, items: {} };
    if (!raw || !raw.items) return out;
    LjodReading.LEVELS.forEach(function (level) {
      level.items.forEach(function (target) {
        const value = raw.items[target.id];
        if (!value || typeof value !== 'object') return;
        out.items[target.id] = {
          right: Math.min(REQUIRED, Math.max(0, Math.floor(Number(value.right) || 0))),
          wrong: Math.min(1000000, Math.max(0, Math.floor(Number(value.wrong) || 0)))
        };
      });
    });
    return out;
  }

  function resultFor(p, id) {
    return p.reading && p.reading.items[id] || { right: 0, wrong: 0 };
  }

  function levels(p) {
    const a = p.adaptive;
    const letterLevels = LjodLetters.STEPS.map(function (letters, index) {
      const solid = letters.filter(function (ch) {
        return a.items[ch] && a.items[ch].maxBox >= 3;
      }).length;
      const needed = letters.length - 1;
      const done = a.step > index + 1 || solid >= needed;
      return {
        number: index + 1, title: 'Bokstavsteg ' + (index + 1),
        detail: letters.join(' · ').toUpperCase(),
        done: done, fraction: done ? 1 : solid / needed,
        status: solid + ' av ' + letters.length + ' bokstavar sit godt',
        goal: 'Minst ' + needed + ' av ' + letters.length + ' bokstavar på vekststeg 3. Éin vanskeleg bokstav kan øvast vidare på.'
      };
    });
    return letterLevels.concat(LjodReading.LEVELS.map(function (level) {
      const points = level.items.reduce(function (sum, target) {
        return sum + Math.min(REQUIRED, resultFor(p, target.id).right);
      }, 0);
      const total = level.items.length * REQUIRED;
      const mastered = level.items.filter(function (target) {
        return resultFor(p, target.id).right >= REQUIRED;
      }).length;
      return {
        number: level.number, title: level.title, detail: level.detail,
        done: points >= total, fraction: points / total,
        status: mastered + ' av ' + level.items.length + ' lesemål ferdige',
        goal: 'Kjenn att kvart ord og kvar setning rett to gonger utan fasithjelp. Du kan bruke den tida du treng.'
      };
    }));
  }

  function summary(p) {
    const list = levels(p);
    const next = list.find(function (level) { return !level.done; });
    // Vis berre den samanhengande fullførte stigen som fullførte steg.
    const completed = next ? next.number - 1 : list.length;
    const fraction = (completed + (next ? next.fraction : 0)) / list.length;
    return {
      levels: list, completed: completed, total: list.length,
      remaining: list.length - completed, current: next ? next.number : list.length,
      percent: completed === list.length ? 100 : Math.min(99, Math.floor(fraction * 100)),
      done: !next
    };
  }

  function record(p, levelNumber, id, correct) {
    const level = LjodReading.LEVELS.find(function (l) { return l.number === levelNumber; });
    if (!level || !level.items.some(function (target) { return target.id === id; })) return;
    if (!p.reading) p.reading = hydrate(null);
    const previous = resultFor(p, id);
    p.reading.items[id] = {
      right: Math.min(REQUIRED, previous.right + (correct ? 1 : 0)),
      wrong: previous.wrong + (correct ? 0 : 1)
    };
  }

  function pick(p, levelNumber, lastId) {
    const level = LjodReading.LEVELS.find(function (l) { return l.number === levelNumber; });
    if (!level) return null;
    const pool = Vy.shuffle(level.items.slice());
    pool.sort(function (a, b) {
      const x = resultFor(p, a.id), y = resultFor(p, b.id);
      return x.right - y.right || Number(a.id === lastId) - Number(b.id === lastId) || x.wrong - y.wrong;
    });
    return pool[0];
  }

  root.LjodProgress = { REQUIRED: REQUIRED, hydrate: hydrate, levels: levels,
    summary: summary, record: record, pick: pick, resultFor: resultFor };
})(window);
