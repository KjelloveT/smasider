/* Frødesams — initialisering, navigasjon og wiring.
 * Tilgjengeleg som FS.App.
 */
(function (root) {
  'use strict';

  const FS    = root.FS;
  const Store = root.FrodesamsStorage;

  const App = FS.App = {};

  App.init = function () {
    FS.state.isDisplay = false;

    // Bind alle modular
    FS.Game.bindTeamSetup();
    FS.Game.bindGameControls();
    FS.Game.bindSync();
    FS.Editor.bind();
    FS.Saved.bind();

    App.bindNavigation();
    App.bindKeyboard();
    App.bindOverlayDismiss();

    App.loadSampleQuizzes();
    App.showScreen('game');
  };

  // ===== NAVIGASJON =====

  App.showScreen = function (name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const scr = FS.el(name + '-screen');
    if (scr) scr.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const nb = FS.el('btn-' + (name === 'game' ? 'play' : name));
    if (nb) nb.classList.add('active');

    FS.state.currentScreen = name;

    if (name === 'game') FS.Game.loadQuizList();
    if (name === 'saved') FS.Saved.render();
  };

  App.bindNavigation = function () {
    const map = { 'btn-play': 'game', 'btn-editor': 'editor', 'btn-saved': 'saved' };
    Object.entries(map).forEach(([id, screen]) => {
      const btn = FS.el(id);
      if (btn) btn.addEventListener('click', () => App.showScreen(screen));
    });

    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => App.showScreen(btn.dataset.goto));
    });

    const closeWinner = FS.el('btn-winner-close');
    if (closeWinner) {
      closeWinner.addEventListener('click', () => {
        FS.closeOverlay('winner-modal');
        FS.Game.resetGame();
      });
    }
  };

  App.bindOverlayDismiss = function () {
    const overlay = FS.el('winner-modal');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) {
          FS.closeOverlay('winner-modal');
          FS.Game.resetGame();
        }
      });
    }
  };

  // ===== TASTATUR (UX4) =====

  App.bindKeyboard = function () {
    document.addEventListener('keydown', e => {
      // Escape: lukk vinnar-modal
      if (e.key === 'Escape') {
        if (FS.el('winner-modal')?.classList.contains('open')) {
          FS.closeOverlay('winner-modal');
          FS.Game.resetGame();
          return;
        }
      }

      // Ctrl+S: lagre i editor
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (FS.state.currentScreen === 'editor') {
          e.preventDefault();
          FS.Editor.saveQuiz();
        }
        return;
      }

      // Deleger spel-tastatur
      FS.Game.handleKeyboard(e);
    });
  };

  // ===== EKSEMPELKVISSAR =====

  App.loadSampleQuizzes = function () {
    if (Store.getQuizzes().length > 0) return;

    const files = ['json/skuleliv.json', 'json/norsk-natur.json'];
    files.forEach(file => {
      fetch(file)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.title) {
            Store.saveQuiz(data);
            // Oppdater quizval-lista viss vi er på spelskjermen
            if (FS.state.currentScreen === 'game') FS.Game.loadQuizList();
          }
        })
        .catch(() => {});
    });
  };

  document.addEventListener('DOMContentLoaded', App.init);

})(window);
