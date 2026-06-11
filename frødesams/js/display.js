/* Frødesams — display.html-modul (storskjerm/projektor).
 * Reagerer på BroadcastChannel-meldingar frå quiz-master (index.html).
 */
(function (root) {
  'use strict';

  const FS    = root.FS;
  const Store = root.FrodesamsStorage;
  const Sync  = FS.Sync;

  // Lokal tilstand for displayet
  const D = {
    quiz: null,
    teams: [],
    currentTeamIdx: 0,
    currentQuestionIdx: 0,
    strikes: 0,
    revealedAnswers: new Set(),
    sortedAnswers: []    // [{originalIndex, text, points}]
  };

  // ===== DOM-HJELPARAR =====

  function el(id)   { return document.getElementById(id); }
  function show(id) { const e = el(id); if (e) e.classList.remove('hidden'); }
  function hide(id) { const e = el(id); if (e) e.classList.add('hidden'); }

  // ===== SYNC-BINDING =====

  function init() {
    Sync.on('start-game',     onStartGame);
    Sync.on('show-question',  onShowQuestion);
    Sync.on('reveal-answer',  onRevealAnswer);
    Sync.on('confirm-reveal', onConfirmReveal);
    Sync.on('undo-reveal',    onUndoReveal);
    Sync.on('strike',         onStrike);
    Sync.on('next-question',  onNextQuestion);
    Sync.on('show-winner',    onShowWinner);
    Sync.on('sync-state',     onSyncState);

    // Be om tilstand frå quiz-master (viss allereie i gang)
    setTimeout(() => Sync.requestState(), 400);
  }

  // ===== MELDINGSHANDTARAR =====

  function onStartGame(data) {
    D.quiz             = data.quiz;
    D.teams            = data.teams.map(t => Object.assign({}, t));
    D.currentTeamIdx   = 0;
    D.currentQuestionIdx = 0;
    D.strikes          = 0;
    D.revealedAnswers  = new Set();

    renderTeams();
    hide('waiting-screen');
  }

  function onShowQuestion(data) {
    D.currentQuestionIdx = data.questionIdx;
    D.currentTeamIdx     = data.currentTeamIdx;
    D.strikes            = data.strikes || 0;
    D.revealedAnswers    = new Set();
    D.sortedAnswers      = data.sortedAnswers || [];

    const q = D.quiz && D.quiz.questions[D.currentQuestionIdx];
    const qText = (q && q.question) || data.question || '';

    const qtEl = el('question-text');
    if (qtEl) qtEl.textContent = qText;

    const progEl = el('question-progress');
    if (progEl && D.quiz) {
      progEl.textContent = (D.currentQuestionIdx + 1) + ' av ' + D.quiz.questions.length;
    }

    renderTurnIndicator();
    renderStrikeDisplay();
    renderAnswerBoard();

    show('question-display');
  }

  function onRevealAnswer(data) {
    // Brukt berre viss controller sender pre-confirm reveal (ikkje i noverande implementasjon)
    // Handterast av onConfirmReveal
  }

  function onConfirmReveal(data) {
    const { answerIdx, teamIdx, points, scores } = data;
    D.revealedAnswers.add(answerIdx);

    // Oppdater poengtavle
    if (scores && D.teams) {
      D.teams.forEach((t, i) => { if (scores[i] !== undefined) t.score = scores[i]; });
    }

    // Finn svar-tekst
    const sortedItem = D.sortedAnswers.find(a => a.originalIndex === answerIdx);
    const q = D.quiz && D.quiz.questions[D.currentQuestionIdx];
    const rawAnswer = q && q.answers[answerIdx];
    const text   = (sortedItem && sortedItem.text)   || (rawAnswer && rawAnswer.text)   || '';
    const ptsVal = (sortedItem && sortedItem.points) || (rawAnswer && rawAnswer.points) || points || '?';

    // Oppdater svar-item i DOM
    const item = document.querySelector(`.answer-item[data-original-index="${answerIdx}"]`);
    if (item) {
      item.classList.add('revealed', 'flip-in');
      item.querySelector('.answer-text').textContent   = text;
      item.querySelector('.answer-points').textContent = ptsVal;
      setTimeout(() => item.classList.remove('flip-in'), 500);
    }

    renderTeams();
  }

  function onUndoReveal(data) {
    const { answerIdx } = data;
    D.revealedAnswers.delete(answerIdx);

    const item = document.querySelector(`.answer-item[data-original-index="${answerIdx}"]`);
    if (item) {
      item.classList.remove('revealed', 'flip-in');
      item.querySelector('.answer-text').textContent   = '?';
      item.querySelector('.answer-points').textContent = '?';
    }

    renderTeams();
  }

  function onStrike(data) {
    D.strikes        = data.count || 0;
    D.currentTeamIdx = data.currentTeamIdx || 0;
    renderStrikeDisplay();
    renderTurnIndicator();
    renderTeams();
  }

  function onNextQuestion(data) {
    D.currentQuestionIdx = data.questionIdx;
    D.currentTeamIdx     = data.currentTeamIdx;
    D.revealedAnswers    = new Set();
    D.strikes            = 0;
  }

  function onShowWinner(data) {
    const ranked = data.ranked || [...(data.teams || [])].sort((a,b) => b.score - a.score);
    const winner = ranked[0];

    const nameEl  = el('winner-name');
    const scoreEl = el('winner-score');
    const stand   = el('winner-standings');

    if (nameEl)  nameEl.textContent  = winner ? winner.name  : '—';
    if (scoreEl) scoreEl.textContent = winner ? winner.score + ' poeng' : '';

    if (stand) {
      stand.innerHTML = '';
      ranked.forEach((team, i) => {
        const row = document.createElement('div');
        row.className = 'standing-row';

        const place = document.createElement('span');
        place.className = 'standing-place';
        place.textContent = (i + 1) + '.';

        const nm = document.createElement('span');
        nm.className = 'standing-name';
        nm.textContent = team.name;

        const pts = document.createElement('span');
        pts.className = 'standing-points';
        pts.textContent = team.score;

        row.appendChild(place);
        row.appendChild(nm);
        row.appendChild(pts);
        stand.appendChild(row);
      });
    }

    const overlay = el('winner-modal');
    if (overlay) overlay.classList.add('open');
  }

  function onSyncState(data) {
    if (!data.inGame) return;
    D.quiz               = data.quiz;
    D.teams              = (data.teams || []).map(t => Object.assign({}, t));
    D.currentTeamIdx     = data.currentTeamIdx || 0;
    D.currentQuestionIdx = data.currentQuestionIdx || 0;
    D.strikes            = data.strikes || 0;
    D.revealedAnswers    = new Set(data.revealedAnswers || []);
    D.sortedAnswers      = data.sortedAnswers || [];

    hide('waiting-screen');
    renderTeams();

    if (data.question) {
      const qtEl = el('question-text');
      if (qtEl) qtEl.textContent = data.question;

      const progEl = el('question-progress');
      if (progEl && D.quiz) {
        progEl.textContent = (D.currentQuestionIdx + 1) + ' av ' + D.quiz.questions.length;
      }

      renderTurnIndicator();
      renderStrikeDisplay();
      renderAnswerBoard();
      show('question-display');
    }
  }

  // ===== RENDERINGSFUNKSJONAR =====

  function renderTeams() {
    const container = el('teams-score');
    if (!container) return;
    container.innerHTML = '';

    D.teams.forEach((team, i) => {
      const div = document.createElement('div');
      div.className = 'team-score' + (i === D.currentTeamIdx ? ' is-active' : '');
      div.style.borderColor = team.color || '';

      const badge = document.createElement('span');
      badge.className = 'team-badge';
      badge.textContent = team.name;
      badge.style.background = team.color || '';
      badge.style.color = team.color ? FS.textOn(team.color) : '';

      const pts = document.createElement('span');
      pts.className = 'team-points';
      pts.textContent = team.score;

      div.appendChild(badge);
      div.appendChild(pts);
      container.appendChild(div);
    });
  }

  function renderTurnIndicator() {
    const el2 = el('current-team-display');
    if (!el2 || !D.teams.length) return;
    const team = D.teams[D.currentTeamIdx];
    if (!team) return;
    el2.textContent = team.name + ' svarar';
    el2.style.background = team.color || '';
    el2.style.color = team.color ? FS.textOn(team.color) : '';
  }

  function renderStrikeDisplay() {
    const container = el('strike-display');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const x = document.createElement('span');
      x.className = 'strike-mark' + (i < D.strikes ? ' active' : '');
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '✕';
      container.appendChild(x);
    }
  }

  function renderAnswerBoard() {
    const container = el('answer-board');
    if (!container) return;
    container.innerHTML = '';

    const sorted = D.sortedAnswers;
    if (!sorted.length) return;

    sorted.forEach((answer, displayIdx) => {
      const isRevealed = D.revealedAnswers.has(answer.originalIndex);

      const div = document.createElement('div');
      div.className = 'answer-item display-answer' + (isRevealed ? ' revealed' : '');
      div.dataset.originalIndex = answer.originalIndex;

      const numEl = document.createElement('div');
      numEl.className = 'answer-number';
      numEl.textContent = displayIdx + 1;

      const textEl = document.createElement('div');
      textEl.className = 'answer-text';
      textEl.textContent = isRevealed ? (answer.text || '?') : '?';

      const ptsEl = document.createElement('div');
      ptsEl.className = 'answer-points';
      ptsEl.textContent = isRevealed ? (answer.points || '?') : '?';

      div.appendChild(numEl);
      div.appendChild(textEl);
      div.appendChild(ptsEl);
      container.appendChild(div);
    });
  }

  // ===== START =====

  document.addEventListener('DOMContentLoaded', init);

})(window);
