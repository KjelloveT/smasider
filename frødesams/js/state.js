/* Frødesams — delt namespace, speltilstand og hjelparar.
 * Alle modular heng på window.FS.
 */
(function (root) {
  'use strict';

  const FS = root.FS || (root.FS = {});

  FS.TEAM_COLORS = ['#e63946', '#2a9d8f', '#2980b9', '#3a86ff', '#f4a261', '#9b5de5'];

  // Speltilstand
  FS.state = {
    isDisplay: false,       // true berre på display.html
    currentQuiz: null,
    teams: [],              // [{id, name, score, color}]
    currentTeamIdx: 0,
    currentQuestionIdx: 0,
    strikes: 0,
    revealedAnswers: new Set(), // set av originalIndex-verdiar
    lastReveal: null,       // {answerIdx, teamIdx, points} — for angre-siste (UX2)
    inGame: false
  };

  // ---- DOM-hjelparar ----
  FS.el   = id => document.getElementById(id);
  FS.show = id => { const e = FS.el(id); if (e) e.classList.remove('hidden'); };
  FS.hide = id => { const e = FS.el(id); if (e) e.classList.add('hidden'); };

  FS.openOverlay  = id => { const e = FS.el(id); if (e) e.classList.add('open'); };
  FS.closeOverlay = id => { const e = FS.el(id); if (e) e.classList.remove('open'); };

  FS.escapeHtml = str => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Svart eller kvit tekst som gjev best kontrast (§3.2)
  FS.textOn = hex => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#1a1a1a';
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? '#1a1a1a' : '#ffffff';
  };
})(window);
