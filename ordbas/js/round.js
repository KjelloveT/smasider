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
    return [...grouped.values()].filter(pair => pair.length === 2 && Math.max(...pair.map(q => q.level)) === settings.level && pair[0].target.text.toLowerCase() === pair[1].target.text.toLowerCase() && pair[0].wordClass !== pair[1].wordClass).flat();
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
  // Keep offsets: a repeated spelling elsewhere in the sentence is a different choice.
  function words(question) {
    const text = question.target.before + question.target.text + question.target.after;
    return [...text.matchAll(/[\p{L}\p{M}]+(?:[-’'][\p{L}\p{M}]+)*/gu)].map((match,index) => ({ text:match[0], start:match.index, end:match.index + match[0].length, index, target:match.index === question.target.before.length && match[0].length === question.target.text.length }));
  }
  function create(questions, settings, random = Math.random) {
    const chosen = select(questions, settings, random);
    if (!chosen.length) throw new Error('Ingen oppgåver passar til vala');
    const paired = settings.mode === 'pairs', helper = settings.mode === 'helper';
    function item(question, retry = false) { return { question, retry, wrong: [], meaning: settings.showMeaning, locked: false }; }
    const state = { settings, queue: chosen.map(q => item(q)), index: 0, selected: 0, phase: 'answering', answers: [], retries: 0, points: 0, streak: 0, bestStreak: 0, lastPoints: 0, lastOutcome: null };
    function board() { return state.queue.slice(state.index,state.index + (paired ? 2 : 1)); }
    function current() { return state.queue[paired ? state.selected : state.index] || null; }
    function record(active) {
      const result = { id: active.question.id, wordClass: active.question.wordClass, level: active.question.level, firstTry: active.wrong.length === 0, retry: active.retry, meaningUsed: active.meaning, points: 0 };
      if (!active.retry) {
        state.streak = result.firstTry ? state.streak + 1 : 0;
        state.bestStreak = Math.max(state.bestStreak,state.streak);
        result.points = (result.firstTry ? 10 : 5) + (result.firstTry && state.streak % 3 === 0 ? 5 : 0);
        state.points += result.points;
      }
      state.answers.push(result); active.locked = true;
      return result;
    }
    function submit(choice, correct) {
      const active = current();
      if (state.phase !== 'answering' || !active || active.locked || active.wrong.includes(choice)) return { accepted:false };
      state.lastOutcome = { correct, question:active.question };
      if (!correct) { active.wrong.push(choice); state.streak = 0; return { accepted:true, correct:false }; }
      const result = record(active); state.lastPoints = result.points;
      if (paired) {
        const remaining = board().find(item => !item.locked);
        if (remaining) state.selected = state.queue.indexOf(remaining);
        else state.phase = 'feedback';
      } else state.phase = 'feedback';
      if (!active.retry && active.wrong.length && state.retries < 2 && state.queue.length - state.index - 1 >= 3 && settings.mode === 'sort') {
        state.queue.splice(state.index + 4,0,item(active.question,true)); state.retries++;
      }
      return { accepted:true, correct:true, result };
    }
    function answer(wordClass) {
      if (helper || !settings.classes.includes(wordClass) || !current()) return { accepted:false };
      return submit(wordClass,wordClass === current().question.wordClass);
    }
    function chooseWord(index) {
      if (!helper || !Number.isInteger(index) || !current()) return { accepted:false };
      const word = words(current().question)[index];
      return word ? submit(index,word.target) : { accepted:false };
    }
    function selectCard(index) {
      if (!paired || state.phase !== 'answering' || !Number.isInteger(index) || index < state.index || index >= Math.min(state.index + 2,state.queue.length) || state.queue[index].locked) return false;
      state.selected = index; state.lastOutcome = null; return true;
    }
    function next() {
      if (state.phase !== 'feedback') return false;
      state.index += paired ? 2 : 1; state.selected = state.index; state.lastOutcome = null; state.lastPoints = 0;
      state.phase = state.index >= state.queue.length ? 'complete' : 'answering'; return true;
    }
    function summary() {
      const primary = state.answers.filter(a => !a.retry);
      return { total: chosen.length, firstTry:primary.filter(a => a.firstTry).length, retried:state.answers.filter(a => a.retry).length, practiceIds:primary.filter(a => !a.firstTry).map(a => a.id), answers:primary, points:state.points, bestStreak:state.bestStreak };
    }
    return { state, current, board, answer, chooseWord, next, summary, selectCard, revealMeaning() { if (current()) current().meaning = true; } };
  }
  O.Round = { pool, select, create, words };
})(window);
