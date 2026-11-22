/* Frødebrett — lagringslag (wrapper rundt VyrdepilStorage)
 * All state ligg under VyrdepilStorage.frodebrett.state = {
 *   quizzes: [ {id, title, categories:[{name, questions:[{points,question,answer}]}], final, created} ],
 *   teams:   [ {name} ]   // siste lagoppsett, valfritt
 * }
 */
(function (root) {
  'use strict';

  const GAME = 'frodebrett';
  // Fingeravtrykk av dei to opphavlege døma, før eventuell redigering.
  const retiredExamples = new Map([
    ['quiz_1775584820677_kcjoxdpit', 'd263a64ff470456d25682f092e570d41d6b7efaa83fbc1448d2165ec7fdf39ae'],
    ['quiz_1775591268761_cdzw99bu8', '15aaf2ffd41326a638483c29492440d5466c2c25c698e20dc1f7a17ba9ca8419']
  ]);

  function defaultState() {
    return { quizzes: [], teams: [], seedVersion: 0 };
  }

  function readState() {
    const s = VyrdepilStorage.getGameState(GAME);
    if (!s || typeof s !== 'object') return defaultState();
    return {
      quizzes: Array.isArray(s.quizzes) ? s.quizzes : [],
      teams: Array.isArray(s.teams) ? s.teams : [],
      seedVersion: typeof s.seedVersion === 'number' ? s.seedVersion : 0
    };
  }

  function writeState(state) {
    VyrdepilStorage.setGameState(GAME, state);
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  // ---- Frøde-CRUD ----

  function getQuizzes() {
    return readState().quizzes;
  }

  function saveQuiz(quiz) {
    const state = readState();
    const idx = state.quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      state.quizzes[idx] = quiz;
    } else {
      if (!quiz.id) quiz.id = generateId('quiz');
      if (!quiz.created) quiz.created = new Date().toISOString();
      state.quizzes.push(quiz);
    }
    writeState(state);
    return VyrdepilStorage.getStatus().mode === 'persistent';
  }

  function deleteQuiz(quizId) {
    const state = readState();
    state.quizzes = state.quizzes.filter(q => q.id !== quizId);
    writeState(state);
    return true;
  }

  async function retireExamples() {
    if (!root.crypto?.subtle) return false;
    const originals = new Map();
    for (const quiz of getQuizzes()) {
      const expected = retiredExamples.get(quiz?.id);
      if (!expected) continue;
      const serialized = JSON.stringify(quiz);
      const digest = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (hash === expected) originals.set(quiz.id, serialized);
    }
    if (!originals.size) return false;
    const state = readState();
    const remaining = state.quizzes.filter(quiz => !originals.has(quiz?.id) || originals.get(quiz.id) !== JSON.stringify(quiz));
    if (remaining.length === state.quizzes.length) return false;
    state.quizzes = remaining;
    writeState(state);
    return true;
  }

  // ---- Lag (valfritt, siste oppsett) ----

  function getTeams() {
    return readState().teams;
  }

  function saveTeams(teams) {
    const state = readState();
    state.teams = teams;
    writeState(state);
    return true;
  }

  // ---- Eksport / import ----

  function exportData() {
    return {
      app: 'frodebrett',
      version: 1,
      quizzes: getQuizzes(),
      exported: new Date().toISOString()
    };
  }

  function importData(data) {
    if (data && Array.isArray(data.quizzes)) {
      const state = readState();
      state.quizzes = data.quizzes;
      writeState(state);
      return true;
    }
    return false;
  }

  function clearAll() {
    VyrdepilStorage.clearGame(GAME);
    return true;
  }

  root.FrodebrettStorage = {
    GAME,
    readState,
    writeState,
    generateId,
    getQuizzes,
    saveQuiz,
    deleteQuiz,
    retireExamples,
    getTeams,
    saveTeams,
    exportData,
    importData,
    clearAll
  };
})(window);
