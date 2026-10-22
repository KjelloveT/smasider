(function (root) {
  'use strict';
  const O = root.Ordbas;
  function pool(questions, settings) {
    const selected = questions.filter(q => settings.classes.includes(q.wordClass) && (settings.review || q.level === settings.level));
    if (settings.mode !== 'pairs') return selected;
    const grouped = new Map();
    questions.filter(q => q.pairId && q.level <= settings.level && settings.classes.includes(q.wordClass)).forEach(q => {
      if (!grouped.has(q.pairId)) grouped.set(q.pairId, []);
      grouped.get(q.pairId).push(q);
    });
    return [...grouped.values()].filter(pair => pair.length === 2 && pair[0].target.text.toLowerCase() === pair[1].target.text.toLowerCase() && pair[0].wordClass !== pair[1].wordClass).flat();
  }
  function select(questions, settings, random) {
    const available = pool(questions, settings);
    if (settings.mode === 'pairs') {
      const pairs = [...new Set(available.map(q => q.pairId))];
      return root.Vy.shuffle(pairs, random).slice(0, Math.floor(settings.count / 2)).flatMap(id => root.Vy.shuffle(available.filter(q => q.pairId === id), random));
    }
    const groups = root.Vy.shuffle(settings.classes, random).map(id => root.Vy.shuffle(available.filter(q => q.wordClass === id), random));
    const result = [];
    while (result.length < Math.min(settings.count, available.length)) {
      for (const group of groups) {
        if (group.length && result.length < settings.count) result.push(group.pop());
      }
    }
    return result;
  }
  function create(questions, settings, random = Math.random) {
    const chosen = select(questions, settings, random);
    if (!chosen.length) throw new Error('Ingen oppgåver passar til vala');
    function item(question, retry = false) {
      const other = settings.classes.filter(c => c !== question.wordClass);
      const proposal = random() < .25 ? question.wordClass : root.Vy.shuffle(other, random)[0];
      return { question, retry, wrong: [], meaning: settings.showMeaning, proposal };
    }
    const state = { settings, queue: chosen.map(q => item(q)), index: 0, phase: 'answering', answers: [], retries: 0 };
    function current() { return state.queue[state.index] || null; }
    function answer(wordClass) {
      const active = current();
      if (state.phase !== 'answering' || !active || !settings.classes.includes(wordClass) || active.wrong.includes(wordClass)) return { accepted: false };
      if (wordClass !== active.question.wordClass) { active.wrong.push(wordClass); return { accepted: true, correct: false }; }
      const result = { id: active.question.id, wordClass, level: active.question.level, firstTry: active.wrong.length === 0, retry: active.retry, meaningUsed: active.meaning };
      state.answers.push(result); state.phase = 'feedback';
      if (!active.retry && active.wrong.length && state.retries < 2 && state.queue.length - state.index - 1 >= 3 && settings.mode !== 'pairs') {
        state.queue.splice(state.index + 4, 0, item(active.question, true)); state.retries++;
      }
      return { accepted: true, correct: true, result };
    }
    function next() {
      if (state.phase !== 'feedback') return false;
      state.index++;
      state.phase = state.index >= state.queue.length ? 'complete' : 'answering';
      return true;
    }
    function summary() {
      const primary = state.answers.filter(a => !a.retry);
      return { total: chosen.length, firstTry: primary.filter(a => a.firstTry).length, retried: state.answers.filter(a => a.retry).length, practiceIds: primary.filter(a => !a.firstTry).map(a => a.id), answers: primary };
    }
    return { state, current, answer, next, summary, revealMeaning() { if (current()) current().meaning = true; } };
  }
  O.Round = { pool, select, create };
})(window);
