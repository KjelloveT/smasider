/* Frødebrett — oppstart, skjermnavigasjon, tastatur og standardfrøder. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const S = FB.state;

  const App = {};

  App.init = function () {
    App.bindNavigation();
    FB.Board.bind();
    FB.Editor.bind();
    FB.Export.bindHelp();
    FB.Saved.bind();
    FB.StandardQuizzes.bind();
    App.bindKeyboard();
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

  App.playFromEditor = function (quiz) {
    FB.Board.selectQuiz(quiz, {
      beforeStart: () => App.showScreen('game'),
      afterFinish: () => {
        App.showScreen('editor');
        FB.el('btn-editor-start').focus();
      }
    });
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
