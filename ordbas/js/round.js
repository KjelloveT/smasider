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
      for (const group of groups) if (group.length && result.length < settings.count) result.push(group.pop());
    }
    return result;
  }
  function create(questions, settings, random = Math.random) {
    const chosen = select(questions, settings, random);
    if (!chosen.length) throw new Error('Ingen oppgåver passar til vala');
    const helper = settings.mode === 'helper';
    function item(question, retry = false) { return { question, retry, wrong: [], meaning: settings.showMeaning, placement: question.wordClass, locked: false, checkedWrong: false }; }
    const state = { settings, queue: chosen.map(q => item(q)), index: 0, selected: 0, phase: 'answering', answers: [], retries: 0, points: 0, streak: 0, bestStreak: 0, lastPoints: 0, lastCheck: null };
    if (helper) {
      for (let start = 0; start < state.queue.length; start += 4) {
        const batch = state.queue.slice(start, start + 4);
        const mixed = root.Vy.shuffle(batch, random).slice(0, Math.max(1, Math.floor(batch.length / 2)));
        mixed.forEach(active => { active.placement = root.Vy.shuffle(settings.classes.filter(c => c !== active.question.wordClass), random)[0]; });
      }
    }
    function board() { return state.queue.slice(state.index, state.index + 4); }
    function current() { return state.queue[helper ? state.selected : state.index] || null; }
    function record(active) {
      const result = { id: active.question.id, wordClass: active.question.wordClass, level: active.question.level, firstTry: active.wrong.length === 0, retry: active.retry, meaningUsed: active.meaning };
      result.points = 0;
      if (!active.retry) {
        state.streak = result.firstTry ? state.streak + 1 : 0;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        result.points = (result.firstTry ? 10 : 5) + (result.firstTry && state.streak % 3 === 0 ? 5 : 0);
        state.points += result.points;
      }
      state.answers.push(result); active.locked = true;
      return result;
    }
    function answer(wordClass) {
      if (helper) return move(wordClass);
      const active = current();
      if (state.phase !== 'answering' || !active || !settings.classes.includes(wordClass) || active.wrong.includes(wordClass)) return { accepted: false };
      if (wordClass !== active.question.wordClass) { active.wrong.push(wordClass); state.streak = 0; return { accepted: true, correct: false }; }
      const result = record(active); state.phase = 'feedback'; state.lastPoints = result.points;
      if (!active.retry && active.wrong.length && state.retries < 2 && state.queue.length - state.index - 1 >= 3 && settings.mode !== 'pairs') {
        state.queue.splice(state.index + 4, 0, item(active.question, true)); state.retries++;
      }
      return { accepted: true, correct: true, result };
    }
    function selectCard(index) {
      if (!helper || !Number.isInteger(index) || index < state.index || index >= Math.min(state.index + 4, state.queue.length)) return false;
      state.selected = index; return true;
    }
    function move(wordClass) {
      const active = current();
      if (!helper || state.phase !== 'answering' || !active || active.locked || !settings.classes.includes(wordClass) || active.placement === wordClass) return { accepted: false };
      active.placement = wordClass; active.checkedWrong = false; state.lastCheck = null;
      return { accepted: true, moved: true };
    }
    function check() {
      if (!helper || state.phase !== 'answering') return { accepted: false };
      const results = [], wrongIds = [];
      board().filter(active => !active.locked).forEach(active => {
        if (active.placement === active.question.wordClass) results.push(record(active));
        else {
          if (!active.wrong.includes(active.placement)) active.wrong.push(active.placement);
          active.checkedWrong = true; wrongIds.push(active.question.id); state.streak = 0;
        }
      });
      state.lastPoints = results.reduce((n, result) => n + result.points, 0);
      state.lastCheck = { wrong: wrongIds.length, correct: board().filter(active => active.locked).length };
      state.phase = wrongIds.length ? 'answering' : 'feedback';
      const selected = board().find(active => !active.locked);
      if (selected) state.selected = state.queue.indexOf(selected);
      return { accepted: true, correct: !wrongIds.length, results, wrongIds };
    }
    function next() {
      if (state.phase !== 'feedback') return false;
      state.index += helper ? board().length : 1; state.selected = state.index;
      state.lastCheck = null; state.lastPoints = 0;
      state.phase = state.index >= state.queue.length ? 'complete' : 'answering'; return true;
    }
    function summary() {
      const primary = state.answers.filter(a => !a.retry);
      return { total: chosen.length, firstTry: primary.filter(a => a.firstTry).length, retried: state.answers.filter(a => a.retry).length, practiceIds: primary.filter(a => !a.firstTry).map(a => a.id), answers: primary, points: state.points, bestStreak: state.bestStreak };
    }
    return { state, current, board, answer, next, summary, selectCard, move, check, revealMeaning() { if (current()) current().meaning = true; } };
  }
  O.Round = { pool, select, create };
})(window);
