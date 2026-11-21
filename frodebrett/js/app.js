/* Frødebrett — oppstart, skjermnavigasjon, tastatur og standardfrøder. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const S = FB.state;
  const Store = root.FrodebrettStorage;

  const App = {};

  App.init = function () {
    App.bindNavigation();
    FB.Board.bind();
    FB.Editor.bind();
    FB.Saved.bind();
    App.bindKeyboard();
    App.loadSampleQuizzes();
    App.showScreen('game');
  };

  App.bindNavigation = function () {
    FB.el('btn-editor').addEventListener('click', () => FB.Editor.newQuiz());
    FB.el('btn-editor-back').addEventListener('click', () => {
      if (!FB.Editor.canLeave()) return;
      App.showScreen('game');
      FB.el('library-heading').focus();
    });
  };

  App.showScreen = function (name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const screen = FB.el(name + '-screen');
    if (screen) screen.classList.remove('hidden');
    S.currentScreen = name;

    if (name === 'game') FB.Saved.render();
  };

  // ===== STANDARDFRØDER =====

  // Standardfrødene blir lagde til éin gong. Lagre og slett verkar òg på desse.
  const SEED_VERSION = 2;

  App.loadSampleQuizzes = function () {
    if (Store.getSeedVersion() >= SEED_VERSION) return;

    Promise.all([
      fetch('json/frodebrett_Blanda_drops.json').then(r => r.json()),
      fetch('json/frodebrett_Småtrinn.json').then(r => r.json())
    ]).then(files => {
      const existing = new Set(Store.getQuizzes().map(q => q.id));
      for (const { quiz } of files) {
        if (quiz && !existing.has(quiz.id)) Store.saveQuiz(quiz);
      }
      Store.setSeedVersion(SEED_VERSION);
      if (S.currentScreen === 'game') FB.Saved.render();
    }).catch(err => console.error('Klarte ikkje laste standardfrøder:', err));
  };

  // ===== TASTATUR =====

  App.bindKeyboard = function () {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 's' && S.currentScreen === 'editor') { e.preventDefault(); FB.Editor.saveQuiz(); }
        return;
      }
      if (S.currentScreen === 'game') FB.Board.handleGameKeyboard(e);
    });
  };

  FB.App = App;

  document.addEventListener('DOMContentLoaded', () => App.init());
})(window);
