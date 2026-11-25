/* Frødebrett — delt namespace, speltilstand og små hjelparar.
 * Alle modular heng på window.FB.
 */
(function (root) {
  'use strict';

  const FB = root.FB || (root.FB = {});

  // Felles konstantar
  FB.POINTS = [100, 200, 300, 400, 500, 1000];
  // Vivide lagfargar — tekstfarge vert rekna ut frå luminans (sjå textOn).
  FB.TEAM_COLORS = ['#e63946', '#2a9d8f', '#2980b9', '#3a86ff', '#f4a261', '#9b5de5'];
  // Kategorifargar (vivide, fungerer i både lyst og mørkt tema).
  FB.CAT_COLORS = ['#d62828', '#2a9d8f', '#1d6efa', '#3a0ca3', '#e07a00', '#6a994e'];

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

  // Svart eller kvit tekst som gjev best kontrast mot ein hex-bakgrunn.
  FB.textOn = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#000000';
    const n = parseInt(m[1], 16);
    const linear = channel => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const r = linear((n >> 16) & 255), g = linear((n >> 8) & 255), b = linear(n & 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.179 ? '#000000' : '#ffffff';
  };
})(window);
