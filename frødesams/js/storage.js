/* Frødesams — lagring via VyrdepilStorage.
 * Tilgjengeleg som window.FrodesamsStorage.
 */
(function (root) {
  'use strict';

  const GAME = 'frodesams';

  function readState() {
    const s = root.VyrdepilStorage.getGameState(GAME);
    return Object.assign({ quizzes: [], teams: [] }, s || {});
  }

  function writeState(s) {
    root.VyrdepilStorage.setGameState(GAME, s);
  }

  const Store = root.FrodesamsStorage = {

    generateId() {
      return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // --- Kvissar ---
    getQuizzes() {
      return readState().quizzes || [];
    },

    saveQuiz(quiz) {
      const s = readState();
      const quizzes = s.quizzes || [];
      const idx = quizzes.findIndex(q => q.id === quiz.id);
      if (idx >= 0) {
        quizzes[idx] = quiz;
      } else {
        if (!quiz.id) quiz.id = Store.generateId();
        if (!quiz.created) quiz.created = new Date().toISOString();
        quizzes.push(quiz);
      }
      writeState(Object.assign({}, s, { quizzes }));
      return true;
    },

    deleteQuiz(id) {
      const s = readState();
      writeState(Object.assign({}, s, {
        quizzes: (s.quizzes || []).filter(q => q.id !== id)
      }));
    },

    // --- Lag (siste lagnamn) ---
    getTeams() {
      return readState().teams || [];
    },

    saveTeams(teams) {
      const s = readState();
      writeState(Object.assign({}, s, { teams }));
    },

    // --- Eksport / Import ---
    exportData() {
      const { quizzes } = readState();
      return {
        app: 'frodesams',
        version: 1,
        quizzes: quizzes || [],
        exported: new Date().toISOString()
      };
    },

    importData(data) {
      try {
        let incoming = [];
        if (Array.isArray(data.quizzes) && data.quizzes.length > 0) {
          incoming = data.quizzes;
        } else if (data.quiz && data.quiz.title) {
          incoming = [data.quiz];
        } else {
          return 0;
        }
        const s = readState();
        const existing = s.quizzes || [];
        incoming.forEach(q => {
          if (!q.id) q.id = Store.generateId();
          const idx = existing.findIndex(e => e.id === q.id);
          if (idx >= 0) existing[idx] = q;
          else existing.push(q);
        });
        writeState(Object.assign({}, s, { quizzes: existing }));
        return incoming.length;
      } catch (e) {
        return false;
      }
    },

    clearAll() {
      root.VyrdepilStorage.clearGame(GAME);
    }
  };

  // Shortcut for game modules
  root.FS = root.FS || {};
  root.FS.Store = Store;

})(window);
