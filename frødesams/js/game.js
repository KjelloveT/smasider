/* Frødesams — spellogikk: lag-oppsett, quizval, spørsmål, avsløring, poeng, vinnar.
 * Tilgjengeleg som FS.Game.
 */
(function (root) {
  'use strict';

  const FS    = root.FS;
  const S     = FS.state;
  const Store = root.FrodesamsStorage;
  const Sync  = FS.Sync;

  const Game = FS.Game = {};

  // ===== LAG-OPPSETT =====

  Game.bindTeamSetup = function () {
    const container = FS.el('teams-container');
    const addBtn    = FS.el('btn-add-team');
    if (!container) return;

    container.querySelectorAll('.btn-remove-team').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.team-input').remove();
        Game.updateRemoveButtons();
      });
    });

    container.querySelectorAll('.team-name').forEach(input => {
      input.addEventListener('input', () => Game.syncTeamInputs());
    });

    if (addBtn) {
      addBtn.addEventListener('click', Game.addTeamInput);
    }

    Game.updateRemoveButtons();
    Game.restoreTeamNames();
  };

  Game.addTeamInput = function () {
    const container = FS.el('teams-container');
    if (!container) return;
    const count = container.querySelectorAll('.team-input').length;
    if (count >= 4) return;

    const div = document.createElement('div');
    div.className = 'team-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input team-name';
    input.placeholder = 'Lag ' + (count + 1);
    input.maxLength = 20;
    input.addEventListener('input', () => Game.syncTeamInputs());

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-icon btn-danger btn-remove-team';
    btn.setAttribute('aria-label', 'Fjern lag');
    btn.textContent = '×';
    btn.addEventListener('click', () => {
      div.remove();
      Game.updateRemoveButtons();
    });

    div.appendChild(input);
    div.appendChild(btn);
    container.appendChild(div);
    Game.updateRemoveButtons();
  };

  Game.updateRemoveButtons = function () {
    const inputs = document.querySelectorAll('.team-input');
    inputs.forEach(inp => {
      const btn = inp.querySelector('.btn-remove-team');
      if (btn) btn.style.display = inputs.length > 2 ? '' : 'none';
    });
    const addBtn = FS.el('btn-add-team');
    if (addBtn) addBtn.disabled = inputs.length >= 4;
  };

  Game.syncTeamInputs = function () {
    // Called on every keypress — nothing persisted until game starts
  };

  Game.restoreTeamNames = function () {
    const saved = Store.getTeams();
    if (!saved.length) return;
    const inputs = document.querySelectorAll('.team-name');
    inputs.forEach((inp, i) => {
      if (saved[i] && saved[i].name) inp.value = saved[i].name;
    });
  };

  // ===== QUIZVAL =====

  Game.loadQuizList = function () {
    const container = FS.el('quiz-list');
    if (!container) return;
    const quizzes = Store.getQuizzes();

    container.innerHTML = '';
    if (!quizzes.length) {
      const p = document.createElement('p');
      p.textContent = 'Ingen frødesamsar tilgjengeleg. Lag ein ny i editoren.';
      p.style.padding = '20px';
      container.appendChild(p);
      return;
    }

    quizzes.forEach(quiz => {
      const card = document.createElement('div');
      card.className = 'quiz-card';

      const title = document.createElement('h3');
      title.textContent = quiz.title;

      const meta = document.createElement('p');
      meta.textContent = quiz.questions.length + ' spørsmål';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-small btn-accent mt-8';
      btn.textContent = 'Start';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        Game.startGame(quiz);
      });

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(btn);
      container.appendChild(card);
    });
  };

  // ===== SPELSTART =====

  Game.startGame = function (quiz) {
    S.currentQuiz = quiz;
    S.currentQuestionIdx = 0;
    S.strikes = 0;
    S.revealedAnswers = new Set();
    S.lastReveal = null;
    S.inGame = true;

    // Bygg lag frå input
    const inputs = document.querySelectorAll('.team-name');
    S.teams = [];
    inputs.forEach((inp, i) => {
      const name = inp.value.trim() || ('Lag ' + (i + 1));
      S.teams.push({
        id: i,
        name,
        score: 0,
        color: FS.TEAM_COLORS[i % FS.TEAM_COLORS.length]
      });
    });
    S.currentTeamIdx = 0;

    Store.saveTeams(S.teams.map(t => ({ name: t.name })));

    // Skjul oppsett, vis brett
    FS.hide('team-setup');
    FS.hide('quiz-selection');
    FS.show('game-board');

    // Skjul hero/instruksjonar
    const hero = FS.el('hero-section');
    if (hero) hero.classList.add('hidden');

    Game.renderTeamsScore();
    Game.showQuestion();

    // Sync til storskjerm
    Sync.startGame(quiz, S.teams);
  };

  // ===== POENGTAVLE =====

  Game.renderTeamsScore = function () {
    const container = FS.el('teams-score');
    if (!container) return;
    container.innerHTML = '';

    S.teams.forEach((team, i) => {
      const div = document.createElement('div');
      div.className = 'team-score' + (i === S.currentTeamIdx ? ' is-active' : '');
      div.style.borderColor = team.color;

      const badge = document.createElement('span');
      badge.className = 'team-badge';
      badge.textContent = team.name;
      badge.style.background = team.color;
      badge.style.color = FS.textOn(team.color);

      const pts = document.createElement('span');
      pts.className = 'team-points';
      pts.textContent = team.score;

      div.appendChild(badge);
      div.appendChild(pts);
      container.appendChild(div);
    });
  };

  // ===== SPØRSMÅL =====

  // Sorter svar etter poeng (høgst først), behald originalIndex
  Game.sortedAnswers = function (question) {
    return question.answers
      .map((a, idx) => Object.assign({}, a, { originalIndex: idx }))
      .sort((a, b) => b.points - a.points);
  };

  Game.showQuestion = function () {
    if (S.currentQuestionIdx >= S.currentQuiz.questions.length) {
      Game.showWinner();
      return;
    }

    const q = S.currentQuiz.questions[S.currentQuestionIdx];
    S.strikes = 0;
    S.revealedAnswers = new Set();
    S.lastReveal = null;

    // Vis spørsmålspanel
    const qd = FS.el('question-display');
    if (qd) qd.classList.remove('hidden');

    // Fyll inn tekst
    const qtEl = FS.el('question-text');
    if (qtEl) qtEl.textContent = q.question;

    const progEl = FS.el('question-progress');
    if (progEl) progEl.textContent = (S.currentQuestionIdx + 1) + ' av ' + S.currentQuiz.questions.length;

    Game.renderTurnIndicator();
    Game.renderStrikeDisplay();
    Game.renderAnswerBoard(q);
    FS.hide('undo-controls');

    // Sync
    Sync.showQuestion({
      questionIdx: S.currentQuestionIdx,
      question: q.question,
      sortedAnswers: Game.sortedAnswers(q).map(a => ({ originalIndex: a.originalIndex, points: a.points })),
      currentTeamIdx: S.currentTeamIdx,
      strikes: 0
    });
  };

  Game.renderTurnIndicator = function () {
    const el = FS.el('current-team-display');
    if (!el || !S.teams.length) return;
    const team = S.teams[S.currentTeamIdx];
    el.textContent = team.name + ' svarar';
    el.style.background = team.color;
    el.style.color = FS.textOn(team.color);
  };

  Game.renderStrikeDisplay = function () {
    const el = FS.el('strike-display');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const x = document.createElement('span');
      x.className = 'strike-mark' + (i < S.strikes ? ' active' : '');
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '✕';
      el.appendChild(x);
    }
  };

  Game.renderAnswerBoard = function (question) {
    const container = FS.el('answer-board');
    if (!container) return;
    container.innerHTML = '';

    const sorted = Game.sortedAnswers(question);
    sorted.forEach((answer, displayIdx) => {
      const div = document.createElement('div');
      div.className = 'answer-item' + (S.revealedAnswers.has(answer.originalIndex) ? ' revealed' : '');
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.dataset.originalIndex = answer.originalIndex;

      const numEl = document.createElement('div');
      numEl.className = 'answer-number';
      numEl.textContent = displayIdx + 1;

      const textEl = document.createElement('div');
      textEl.className = 'answer-text';
      textEl.textContent = S.revealedAnswers.has(answer.originalIndex) ? answer.text : '?';

      const ptsEl = document.createElement('div');
      ptsEl.className = 'answer-points';
      ptsEl.textContent = S.revealedAnswers.has(answer.originalIndex) ? answer.points : '?';

      div.appendChild(numEl);
      div.appendChild(textEl);
      div.appendChild(ptsEl);

      if (!S.revealedAnswers.has(answer.originalIndex)) {
        const clickReveal = () => Game.revealAnswer(answer.originalIndex);
        div.addEventListener('click', clickReveal);
        div.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickReveal(); }
        });
      }

      container.appendChild(div);
    });
  };

  // ===== AVSLØRING (UX2: avslør + angre) =====

  Game.revealAnswer = function (originalIndex) {
    if (S.revealedAnswers.has(originalIndex)) return;
    if (!S.currentQuiz) return;

    const q = S.currentQuiz.questions[S.currentQuestionIdx];
    const answer = q.answers[originalIndex];
    if (!answer) return;

    // Bruk punkt direkte på noverande lag
    const teamIdx = S.currentTeamIdx;
    S.teams[teamIdx].score += answer.points;
    S.revealedAnswers.add(originalIndex);

    // Lagre for angre
    S.lastReveal = { answerIdx: originalIndex, teamIdx, points: answer.points };

    // Oppdater DOM (flip-animasjon)
    const item = document.querySelector(`.answer-item[data-original-index="${originalIndex}"]`);
    if (item) {
      item.classList.add('revealed', 'flip-in');
      item.querySelector('.answer-text').textContent = answer.text;
      item.querySelector('.answer-points').textContent = answer.points;
      item.style.pointerEvents = 'none';
      item.removeAttribute('tabindex');
      setTimeout(() => item.classList.remove('flip-in'), 500);
    }

    Game.renderTeamsScore();
    FS.show('undo-controls');

    const undoBtn = FS.el('btn-undo-reveal');
    if (undoBtn) {
      undoBtn.textContent = 'Angre (−' + answer.points + ')';
    }

    // Sync: avslør til storskjerm (med poeng og oppdaterte scores)
    Sync.confirmReveal(originalIndex, teamIdx, answer.points, S.teams.map(t => t.score));

    // Sjekk om alle svar er avslørte
    const total = q.answers.length;
    if (S.revealedAnswers.size >= total) {
      FS.hide('undo-controls');
      S.lastReveal = null;
    }
  };

  Game.undoReveal = function () {
    if (!S.lastReveal) return;
    const { answerIdx, teamIdx, points } = S.lastReveal;

    // Tilbakefør poeng
    S.teams[teamIdx].score -= points;
    S.revealedAnswers.delete(answerIdx);
    S.lastReveal = null;

    // Oppdater DOM
    const item = document.querySelector(`.answer-item[data-original-index="${answerIdx}"]`);
    if (item) {
      item.classList.remove('revealed', 'flip-in');
      item.querySelector('.answer-text').textContent = '?';
      item.querySelector('.answer-points').textContent = '?';
      item.style.pointerEvents = '';
      item.setAttribute('tabindex', '0');
      const q = S.currentQuiz.questions[S.currentQuestionIdx];
      const answer = q.answers[answerIdx];
      const clickReveal = () => Game.revealAnswer(answerIdx);
      item.addEventListener('click', clickReveal);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickReveal(); }
      });
    }

    Game.renderTeamsScore();
    FS.hide('undo-controls');

    // Sync
    Sync.undoReveal(answerIdx);
  };

  // ===== STRYK (UX1) =====

  Game.handleStrike = function () {
    S.strikes = Math.min(S.strikes + 1, 3);
    Game.renderStrikeDisplay();

    // Byt lag
    S.currentTeamIdx = (S.currentTeamIdx + 1) % S.teams.length;
    // Nullstill angre ved lagbytte
    S.lastReveal = null;
    FS.hide('undo-controls');

    Game.renderTurnIndicator();
    Game.renderTeamsScore();

    // Sync
    Sync.strike(S.strikes, S.currentTeamIdx);
  };

  // ===== NESTE SPØRSMÅL =====

  Game.nextQuestion = function () {
    S.lastReveal = null;
    FS.hide('undo-controls');
    S.currentQuestionIdx++;
    S.currentTeamIdx = S.currentTeamIdx % S.teams.length;

    const qd = FS.el('question-display');
    if (qd) qd.classList.add('hidden');
    FS.show('game-controls');

    if (S.currentQuestionIdx >= S.currentQuiz.questions.length) {
      Game.showWinner();
      return;
    }

    Game.showQuestion();
    Sync.nextQuestion({ questionIdx: S.currentQuestionIdx, currentTeamIdx: S.currentTeamIdx });
  };

  // ===== KONTROLL =====

  Game.bindGameControls = function () {
    const strikeBtn = FS.el('btn-strike');
    const nextBtn   = FS.el('btn-next-question');
    const endBtn    = FS.el('btn-end-game');
    const undoBtn   = FS.el('btn-undo-reveal');
    const openDisp  = FS.el('btn-open-display');

    if (strikeBtn) strikeBtn.addEventListener('click', Game.handleStrike);
    if (nextBtn)   nextBtn.addEventListener('click',   Game.nextQuestion);
    if (endBtn)    endBtn.addEventListener('click',    Game.endGame);
    if (undoBtn)   undoBtn.addEventListener('click',   Game.undoReveal);
    if (openDisp)  openDisp.addEventListener('click',  () => {
      window.open('display.html', 'frodesams-display', 'width=1280,height=800');
    });
  };

  Game.endGame = function () {
    S.lastReveal = null;
    const ranked = [...S.teams].sort((a, b) => b.score - a.score);
    Sync.showWinner(S.teams, ranked);
    Game.showWinner();
  };

  Game.showWinner = function () {
    const ranked = [...S.teams].sort((a, b) => b.score - a.score);
    const winner = ranked[0];

    const nameEl  = FS.el('winner-name');
    const scoreEl = FS.el('winner-score');
    const stand   = FS.el('winner-standings');

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

    FS.openOverlay('winner-modal');
  };

  Game.resetGame = function () {
    S.currentQuiz   = null;
    S.teams         = [];
    S.currentTeamIdx = 0;
    S.currentQuestionIdx = 0;
    S.strikes       = 0;
    S.revealedAnswers = new Set();
    S.lastReveal    = null;
    S.inGame        = false;

    FS.hide('game-board');
    FS.show('team-setup');
    FS.show('quiz-selection');
    FS.hide('undo-controls');

    const qd = FS.el('question-display');
    if (qd) qd.classList.add('hidden');

    // Vis hero igjen
    const hero = FS.el('hero-section');
    if (hero) hero.classList.remove('hidden');

    Game.loadQuizList();
  };

  // ===== SYNC-BINDING (controller) =====

  Game.bindSync = function () {
    // Svar på state-førespurnad frå storskjerm
    Sync.on('request-state', () => {
      if (!S.inGame) return;
      const q = S.currentQuiz ? S.currentQuiz.questions[S.currentQuestionIdx] : null;
      Sync.syncState({
        quiz: S.currentQuiz,
        teams: S.teams,
        currentTeamIdx: S.currentTeamIdx,
        currentQuestionIdx: S.currentQuestionIdx,
        strikes: S.strikes,
        revealedAnswers: Array.from(S.revealedAnswers),
        question: q ? q.question : null,
        sortedAnswers: q ? Game.sortedAnswers(q).map(a => ({
          originalIndex: a.originalIndex, text: a.text, points: a.points
        })) : [],
        inGame: S.inGame
      });
    });
  };

  // ===== TASTATUR (UX4) =====

  Game.handleKeyboard = function (e) {
    if (!S.inGame) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Taltastar 1–9 → avslør svar N
    if (e.key >= '1' && e.key <= '9') {
      const n = parseInt(e.key) - 1;
      const q = S.currentQuiz && S.currentQuiz.questions[S.currentQuestionIdx];
      if (!q) return;
      const sorted = Game.sortedAnswers(q);
      if (sorted[n]) {
        e.preventDefault();
        Game.revealAnswer(sorted[n].originalIndex);
      }
      return;
    }

    // Mellomrom → neste spørsmål
    if (e.key === ' ' || e.code === 'Space') {
      const qd = FS.el('question-display');
      if (qd && !qd.classList.contains('hidden')) {
        e.preventDefault();
        Game.nextQuestion();
      }
    }

    // Escape → neste (alternativ)
    // (Escape for modal handterast i app.js)
  };

})(window);
