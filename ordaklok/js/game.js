/* Ordaklok — game orchestrator
 * Styrer oppsett-skjerm, spel-skjerm, resultat-skjerm.
 * Mode-modular eksponerer: { id, label, description, icon, defaultOptions, supportsLeitner,
 *                            mount(root, ctx), unmount() }
 * ctx = { list, queue, options, callbacks: { onResult(idx, result), onFinish() } }
 * result = { correct, peeked, time }
 */
(function () {
  'use strict';

  const Storage = OrdaklokStorage;
  const State = OrdaklokState;
  const Leitner = OrdaklokLeitner;
  const { ICONS, escapeHtml } = State;

  const MODES = {
    type: window.OrdaklokModeType,
    mc: window.OrdaklokModeMC,
    flashcard: window.OrdaklokModeFlashcard,
    match: window.OrdaklokModeMatch
  };

  // ---- App-state ----
  const params = new URLSearchParams(location.search);
  const listId = params.get('list');
  let list = listId ? Storage.getList(listId) : null;

  if (!list) {
    document.querySelector('main.main-content').innerHTML =
      '<div class="box2"><h2 class="heading4 no-mt">Lista finst ikkje</h2>' +
      '<p>Du kan kome tilbake til biblioteket og velje ei anna liste.</p>' +
      '<a class="btn btn-primary" href="index.html">Tilbake til biblioteket</a></div>';
    return;
  }
  Storage.setLastList(list.id);

  document.getElementById('topListInfo').textContent = list.title;
  document.getElementById('setupListTitle').textContent = list.title;
  const stats = Leitner.masteryStats(Storage.getLeitner(list.id), list.pairs.length);
  document.getElementById('setupListMeta').textContent =
    `${list.pairs.length} par · ${list.labelA} ↔ ${list.labelB} · ${stats.mastered} av ${stats.total} meistra`;

  // ---- Oppsett ----
  const setup = {
    mode: 'type',
    direction: 'AB',     // 'AB', 'BA', 'mix'
    count: Math.min(10, list.pairs.length),
    leitner: true,
    peek: true,
    boxes: true,
    highlight: false
  };

  function renderModeGrid() {
    const grid = document.getElementById('modeGrid');
    grid.innerHTML = '';
    const modeOrder = ['type', 'mc', 'flashcard', 'match'];
    for (const id of modeOrder) {
      const m = MODES[id];
      if (!m) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mode-card' + (setup.mode === id ? ' selected' : '');
      btn.dataset.mode = id;
      btn.innerHTML =
        `<span class="mode-card-title">${m.icon || ''} ${escapeHtml(m.label)}</span>` +
        `<span class="mode-card-desc">${escapeHtml(m.description)}</span>`;
      btn.addEventListener('click', () => {
        setup.mode = id;
        renderModeGrid();
        updateOptionVisibility();
      });
      grid.appendChild(btn);
    }
  }

  function renderRadioGroup(containerId, options, valueProp) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = '';
    options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = containerId;
      radio.value = String(opt.value);
      if (setup[valueProp] === opt.value) radio.checked = true;
      radio.addEventListener('change', () => {
        if (radio.checked) {
          setup[valueProp] = isNaN(Number(opt.value)) ? opt.value : Number(opt.value);
        }
      });
      const span = document.createElement('span');
      span.textContent = opt.label;
      label.appendChild(radio);
      label.appendChild(span);
      wrap.appendChild(label);
    });
  }

  function renderDirection() {
    renderRadioGroup('directionRow', [
      { value: 'AB', label: list.labelA + ' → ' + list.labelB },
      { value: 'BA', label: list.labelB + ' → ' + list.labelA },
      { value: 'mix', label: 'Blanda' }
    ], 'direction');
  }

  function renderCount() {
    const opts = [];
    const max = list.pairs.length;
    for (const v of [5, 10, 15, 20, max]) {
      if (v <= max && !opts.find(o => o.value === v)) {
        opts.push({ value: v, label: v === max ? `Alle (${max})` : String(v) });
      }
    }
    renderRadioGroup('countRow', opts, 'count');
  }

  function updateOptionVisibility() {
    const isType = setup.mode === 'type';
    document.getElementById('peekWrap').style.display = isType ? '' : 'none';
    document.getElementById('boxesWrap').style.display = isType ? '' : 'none';
    document.getElementById('hilightWrap').style.display = isType ? '' : 'none';
    // Match-mode har ikkje meiningsfull retning eller Leitner
    const dirRow = document.getElementById('directionRow');
    dirRow.style.opacity = setup.mode === 'match' ? '0.45' : '';
  }

  document.getElementById('optLeitner').addEventListener('change', e => { setup.leitner = e.target.checked; });
  document.getElementById('optPeek').addEventListener('change', e => { setup.peek = e.target.checked; });
  document.getElementById('optBoxes').addEventListener('change', e => { setup.boxes = e.target.checked; });
  document.getElementById('optHighlight').addEventListener('change', e => { setup.highlight = e.target.checked; });

  // Init checkbox-state
  document.getElementById('optLeitner').checked = setup.leitner;
  document.getElementById('optPeek').checked = setup.peek;
  document.getElementById('optBoxes').checked = setup.boxes;
  document.getElementById('optHighlight').checked = setup.highlight;

  renderModeGrid();
  renderDirection();
  renderCount();
  updateOptionVisibility();

  // ---- Spel-state ----
  let session = null;
  let timerInterval = null;
  let activeMode = null;

  function buildQueue() {
    let pairIndices;
    if (setup.leitner && MODES[setup.mode].supportsLeitner !== false) {
      pairIndices = Leitner.pickDuePairs(Storage.getLeitner(list.id), list.pairs.length, setup.count);
    } else {
      pairIndices = State.pickN(list.pairs.map((_, i) => i), setup.count);
    }
    return pairIndices.map(idx => {
      let dir = setup.direction;
      if (dir === 'mix') dir = Math.random() < 0.5 ? 'AB' : 'BA';
      return { idx, direction: dir };
    });
  }

  function start() {
    const queue = buildQueue();
    if (queue.length === 0) {
      alert('Lista har ingen par å spele med.');
      return;
    }
    session = {
      list,
      queue,
      options: { peek: setup.peek, boxes: setup.boxes, highlight: setup.highlight },
      results: [], // { idx, correct, peeked, time }
      currentIdx: 0,
      score: 0,
      correct: 0,
      wrong: 0,
      peeked: 0,
      bestCombo: 0,
      combo: 0,
      mode: setup.mode,
      direction: setup.direction,
      startedAt: Date.now()
    };

    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('playScreen').style.display = '';

    refreshHUD();
    startTimer();
    mountMode();
  }

  function mountMode() {
    const modeImpl = MODES[session.mode];
    activeMode = modeImpl;
    const root = document.getElementById('modeRoot');
    root.innerHTML = '';
    modeImpl.mount(root, {
      list: session.list,
      queue: session.queue,
      options: session.options,
      callbacks: {
        onResult: handleResult,
        onAdvance: () => refreshHUD(),
        onFinish: handleFinish
      }
    });
  }

  function handleResult(idx, result) {
    // result: { correct, peeked, time }
    session.results.push({ idx, ...result });
    if (result.correct && !result.peeked) {
      session.correct++;
      session.combo++;
      if (session.combo > session.bestCombo) session.bestCombo = session.combo;
      session.score += 100;
      if (session.combo >= 3 && session.combo % 3 === 0) session.score += 50; // combo-bonus
    } else if (result.peeked && result.correct) {
      session.correct++;
      session.peeked++;
      session.score += 40;
      session.combo = 0;
    } else {
      session.wrong++;
      session.combo = 0;
      session.score = Math.max(0, session.score - 25);
    }

    // Leitner-oppdatering (ikkje for matching, som handterer det sjølv)
    if (activeMode.supportsLeitner !== false) {
      const leitnerData = Storage.getLeitner(list.id);
      Leitner.recordResult(leitnerData, idx, !!result.correct && !result.peeked);
      Storage.setLeitner(list.id, leitnerData);
    }

    refreshHUD();
  }

  function handleFinish(extra) {
    // extra (frå match-mode): { totalTime, mistakes }
    stopTimer();
    if (extra) {
      session.matchExtra = extra;
    }
    if (activeMode && typeof activeMode.unmount === 'function') activeMode.unmount();
    showResults();
  }

  function refreshHUD() {
    document.getElementById('hudScore').textContent = session.score + ' p';
    document.getElementById('hudCorrect').textContent = session.correct + ' ✓';
    document.getElementById('hudWrong').textContent = session.wrong + ' ✗';
    const comboEl = document.getElementById('hudCombo');
    if (session.combo >= 2) {
      comboEl.style.display = '';
      comboEl.textContent = '×' + session.combo;
    } else {
      comboEl.style.display = 'none';
    }
    const total = session.queue.length;
    const done = session.results.length;
    document.getElementById('hudProgress').textContent = done + '/' + total;
    document.getElementById('progressFill').style.width = (total > 0 ? (done / total * 100) : 0) + '%';
  }

  function startTimer() {
    const t0 = Date.now();
    const el = document.getElementById('hudTimer');
    timerInterval = setInterval(() => {
      const ms = Date.now() - t0;
      const s = Math.floor(ms / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      el.textContent = mm + ':' + ss;
    }, 250);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function showResults() {
    document.getElementById('playScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = '';

    const totalTime = Math.round((Date.now() - session.startedAt) / 1000);
    const total = session.queue.length;
    const accuracy = total > 0 ? Math.round(session.correct / total * 100) : 0;

    // For matching, vi har eit eige scoring-grunnlag
    let bestUpdated = false;
    if (session.mode === 'match' && session.matchExtra) {
      const t = session.matchExtra.totalTime;
      const m = session.matchExtra.mistakes;
      const matchScore = Math.max(0, 1000 - Math.round(t * 5) - m * 50);
      session.score = matchScore;
    }

    if (session.mode !== 'flashcard') {
      bestUpdated = Storage.saveScore(list.id, session.mode, {
        best: session.score,
        time: totalTime,
        correct: session.correct,
        wrong: session.wrong,
        peeked: session.peeked,
        total: total
      });
    }

    const stats = document.getElementById('resultStats');
    stats.innerHTML = '';
    function addStat(label, value, highlight) {
      const d = document.createElement('div');
      d.className = 'result-stat' + (highlight ? ' highlight' : '');
      const l = document.createElement('div');
      l.className = 'stat-label';
      l.textContent = label;
      const v = document.createElement('div');
      v.className = 'stat-value';
      v.textContent = value;
      d.appendChild(l); d.appendChild(v);
      stats.appendChild(d);
    }
    if (session.mode !== 'flashcard') {
      addStat('Poeng', session.score, bestUpdated);
    }
    addStat('Rette', session.correct + ' / ' + total);
    if (session.mode !== 'flashcard') addStat('Feil', session.wrong);
    if (session.peeked > 0) addStat('Tjuvtitta', session.peeked);
    if (session.mode !== 'flashcard') addStat('Treffsikker', accuracy + ' %');
    if (session.bestCombo >= 3) addStat('Beste kombo', '×' + session.bestCombo);
    addStat('Tid', formatTime(totalTime));

    // Toppscore-info
    if (session.mode !== 'flashcard') {
      const prev = Storage.getScore(list.id, session.mode);
      if (prev) {
        addStat('Toppscore', prev.best + ' p', bestUpdated);
      }
    }

    // Mestrings-info
    const m = Leitner.masteryStats(Storage.getLeitner(list.id), list.pairs.length);
    addStat('Meistring', m.mastered + ' / ' + m.total);

    // Gjennomgang
    const review = document.getElementById('reviewList');
    review.innerHTML = '';
    session.results.forEach(r => {
      const pair = list.pairs[r.idx];
      const div = document.createElement('div');
      div.className = 'review-item ' + (!r.correct ? 'bad' : (r.peeked ? 'peek' : ''));
      const span = document.createElement('span');
      span.className = 'rev-pair';
      span.textContent = pair.a + ' — ' + pair.b;
      div.appendChild(span);
      const tag = document.createElement('span');
      tag.textContent = r.correct ? (r.peeked ? 'tjuvtitta' : 'rett') : 'feil';
      div.appendChild(tag);
      review.appendChild(div);
    });
  }

  function formatTime(s) {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return mm > 0 ? `${mm}m ${ss}s` : `${ss}s`;
  }

  // ---- Knappar ----
  document.getElementById('startBtn').addEventListener('click', start);

  document.getElementById('quitBtn').addEventListener('click', () => {
    if (!confirm('Avbryt økta? Resultatet blir ikkje lagra.')) return;
    stopTimer();
    if (activeMode && typeof activeMode.unmount === 'function') activeMode.unmount();
    document.getElementById('playScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = '';
    session = null;
  });

  document.getElementById('playAgainBtn').addEventListener('click', start);
  document.getElementById('changeSetupBtn').addEventListener('click', () => {
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = '';
    // Oppdater meistrings-tellar
    const stats2 = Leitner.masteryStats(Storage.getLeitner(list.id), list.pairs.length);
    document.getElementById('setupListMeta').textContent =
      `${list.pairs.length} par · ${list.labelA} ↔ ${list.labelB} · ${stats2.mastered} av ${stats2.total} meistra`;
  });

})();
