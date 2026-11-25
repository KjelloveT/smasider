/* Frødebrett — delt namespace, speltilstand og små hjelparar.
 * Alle modular heng på window.FB.
 */
(function (root) {
  'use strict';

  const FB = root.FB || (root.FB = {});

  // Felles konstantar
  FB.POINTS = [100, 200, 300, 400, 500, 1000];
  // Mørke spelfargar for kvite lagnamn og kategorioverskrifter.
  FB.TEAM_COLORS = ['#ad2939', '#166a60', '#205c7a', '#20539b', '#924925', '#65349b'];
  FB.CAT_COLORS = ['#ad2429', '#166a60', '#184eab', '#350b8d', '#974604', '#416830'];

  // Speltilstand (delt mellom board/editor/saved/app)
  FB.state = {
    currentScreen: 'game',
    currentQuiz: null,
    teams: [],
    currentQuestion: null,
    dailyDoubleCell: null,
    answeredCells: new Set(),
    finalStage: null,
    finalBets: {},
    activeTeamId: null,      // kven som er på tur (UX6)
    pendingAward: null,      // {teamId, value} venter på stadfesting (UX2)
    editorCategories: [],
    activeTab: 0
  };

  // ---- DOM-hjelparar ----
  FB.el = (id) => document.getElementById(id);
  FB.show = (id) => { const e = FB.el(id); if (e) e.classList.remove('hidden'); };
  FB.hide = (id) => { const e = FB.el(id); if (e) e.classList.add('hidden'); };

  FB.openOverlay = (id) => { const e = FB.el(id); if (e) Vy.openModal(e); };
  FB.closeOverlay = (id) => { const e = FB.el(id); if (e) Vy.closeModal(e); };
  FB.isOverlayOpen = (id) => Vy.modalOpen(FB.el(id));
  FB.escapeHtml = Vy.escapeHtml;
})(window);
