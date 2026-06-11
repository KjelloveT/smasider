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
    finalBets: {},
    activeTeamId: null,      // kven som er på tur (UX6)
    pendingAward: null,      // {teamId, value} venter på stadfesting (UX2)
    editorCategories: [],
    activeTab: 0,
    editingQuizId: null
  };

  // ---- DOM-hjelparar ----
  FB.el = (id) => document.getElementById(id);
  FB.show = (id) => { const e = FB.el(id); if (e) e.classList.remove('hidden'); };
  FB.hide = (id) => { const e = FB.el(id); if (e) e.classList.add('hidden'); };

  // Modal-overlay (neobrutalisme: .modal-overlay.open -> display:flex)
  FB.openOverlay = (id) => { const e = FB.el(id); if (e) e.classList.add('open'); };
  FB.closeOverlay = (id) => { const e = FB.el(id); if (e) e.classList.remove('open'); };
  FB.isOverlayOpen = (id) => { const e = FB.el(id); return !!e && e.classList.contains('open'); };

  FB.escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Svart eller kvit tekst som gjev best kontrast mot ein hex-bakgrunn (§3.2).
  FB.textOn = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#1a1a1a';
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? '#1a1a1a' : '#ffffff';
  };
})(window);
