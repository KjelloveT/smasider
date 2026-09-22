// Heimsank - Game Logic Functions

/**
 * Initialize the application
 */
async function init() {
  loadStorage();
  initTrash();
  Progression.load();
  try {
    S.cats = await fetch('./kort/categories.json?v=1.56').then(r => { if (!r.ok) throw new Error('Kategoriar'); return r.json(); });
    ProgressionUI.renderPoints();
    document.getElementById('categoryCount').textContent = S.cats.length + ' kategoriar';
    ProgressionUI.renderCovers(S.cats);
    // Etterhandsam merke (t.d. for spelarar som alt hadde kort før systemet kom)
    ProgressionUI.evaluateAndAnnounce();
    document.getElementById('setupLoading').classList.add('hidden');
    document.getElementById('setupContent').classList.remove('hidden');
    // Start showcase fan display
    initShowcase();
  } catch (e) {
    document.getElementById('setupLoading').textContent = 'Kategoriane kunne ikkje lastast. Last sida på nytt for å prøve igjen.';
  }
}

/**
 * Select difficulty level
 * @param {string} l - Level: 'lett', 'middels', 'vanskeleg'
 */
function selLevel(l) {
  S.level = l;
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === l)));
}

/**
 * Toggle operation
 * @param {string} op - Operation: '+', '-', '*', '/'
 */
function togOp(op) {
  const b = document.querySelector(`[data-op="${op}"]`);
  const i = S.ops.indexOf(op);
  if (i >= 0) {
    if (S.ops.length === 1) return; // Keep at least one operation
    S.ops.splice(i, 1);
    b.setAttribute('aria-pressed', 'false');
  } else {
    S.ops.push(op);
    b.setAttribute('aria-pressed', 'true');
  }
}

/**
 * Start the game
 */
async function startGame() {
  if (!S.selCat || S.phase !== 'setup') return;
  S.phase = 'loading';
  HeimsankUI.cancelTimers();
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = 'Lastar…';
  try {
    await loadCards(S.selCat);
  } catch (e) {
    S.phase = 'setup';
    Vy.toast('Korta kunne ikkje lastast. Prøv igjen.', { kind: 'warn' });
    btn.disabled = false;
    btn.textContent = 'Start spelet →';
    return;
  }
  stopShowcase();
  document.getElementById('setupScreen').classList.add('hidden');
  const gs = document.getElementById('gameScreen');
  gs.classList.remove('hidden');
  document.getElementById('setupScreen').classList.add('hidden');
  const sub = document.getElementById('gameSub');
  sub.textContent = S.selCat.label;
  HeimsankUI.category(sub, S.selCat.id);
  document.getElementById('gameDiff').textContent = { lett: 'Lett', middels: 'Middels', vanskeleg: 'Vanskeleg' }[S.level];
  setCollectionExpanded(false);
  S.correct = 0;
  S.paused = false;
  loadStorage();
  updateProg();
  renderColl();
  nextQ();
}

/**
 * Return to setup screen
 */
function goSetup() {
  // Prevent going to setup if there's a pending card
  if (S.pending) {
    alert('Du må plassere det nye kortet før du kan bytte kategori!');
    return;
  }
  HeimsankUI.cancelTimers();
  S.phase = 'setup'; S.paused = true;
  ProgressionUI.renderCovers(S.cats);
  initShowcase(S.selCat);
  const gs = document.getElementById('gameScreen');
  gs.classList.add('hidden');
  document.getElementById('setupScreen').classList.remove('hidden');
  const btn = document.getElementById('startBtn');
  btn.disabled = false;
  btn.textContent = 'Start spelet →';
}

/**
 * Load cards for a category
 * @param {Object} cat - Category object
 */
async function loadCards(cat) {
  S.cards = await CardData.loadCategoryCards(cat);
  if (!S.cards.length) throw new Error('Ingen kort');

  S.idx = {};
  S.groups = { vanleg: [], sjeldgjevt: [], segngjeten: [], gudebore: [] };
  S.cards.forEach(c => {
    S.idx[c.id] = c;
    (S.groups[c.rarity] || S.groups.vanleg).push(c);
  });
}

/**
 * Generate next question
 */
function nextQ() {
  if (S.paused || S.phase === 'setup') return;
  S.phase = 'question';
  const op = S.ops[Math.floor(Math.random() * S.ops.length)];
  const r = {
    lett: [20, 20, 10, 10],
    middels: [50, 50, 12, 12],
    vanskeleg: [100, 100, 20, 20]
  }[S.level];

  let n1, n2, ans;
  if (op === '+') {
    n1 = ri(r[0]);
    n2 = ri(r[0]);
    ans = n1 + n2;
  } else if (op === '-') {
    n1 = ri(r[1]) + Math.ceil(r[1] / 2);
    n2 = ri(n1 - 1) + 1;
    ans = n1 - n2;
  } else if (op === '*') {
    n1 = ri(r[2]) + 1;
    n2 = ri(r[2]) + 1;
    ans = n1 * n2;
  } else {
    n2 = ri(r[3]) + 1;
    ans = ri(r[3]) + 1;
    n1 = n2 * ans;
  }

  const sym = {'+': '+', '-': '−', '*': '×', '/': '÷'}[op];
  S.q = { ans, n1, n2, sym, txt: `${n1} ${sym} ${n2}` };
  const qBox = document.getElementById('qBox');
  qBox.innerHTML =
    `<span class="num">${n1}</span>` +
    `<span class="op">${sym}</span>` +
    `<span class="num">${n2}</span>` +
    `<span class="eq">=</span>` +
    `<span class="qmark">?</span>`;
  const inp = document.getElementById('ansInput');
  inp.value = '';
  inp.disabled = false;
  if (!Vy.anyModalOpen()) inp.focus({ preventScroll: true });
  document.getElementById('checkBtn').disabled = false;
  setFb('', '');
}

/**
 * Check user's answer
 */
function checkAnswer() {
  if (S.paused || !S.q || S.phase !== 'question' || Vy.anyModalOpen()) return;
  const raw = document.getElementById('ansInput').value;
  const v = Number(raw);
  if (!raw.trim() || !Number.isFinite(v)) {
    setFb('Skriv inn eit tal!', 'incorrect');
    return;
  }
  S.phase = 'feedback';
  document.getElementById('ansInput').disabled = true;
  document.getElementById('checkBtn').disabled = true;
  if (v === S.q.ans) {
    S.correct++;
    Progression.recordCorrect(S.level);
    setFb('Rett!', 'correct');
    updateProg();
    document.getElementById('ansInput').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    if (S.correct >= QPC) {
      HeimsankUI.later(triggerCard, 800);
    } else {
      HeimsankUI.later(nextQ, 700);
    }
  } else {
    setFb(`Svaret er ${S.q.ans}.`, 'incorrect');
    HeimsankUI.later(nextQ, 1400);
  }
}

/**
 * Set feedback text
 * @param {string} m - Message
 * @param {string} c - CSS class: 'correct', 'incorrect', or ''
 */
function setFb(m, c) {
  const el = document.getElementById('feedback');
  el.replaceChildren();
  el.dataset.kind = c;
  if (m) el.append(HeimsankUI.icon(c === 'correct' ? 'check' : 'x', 18), Vy.el('span', '', m));
}

/**
 * Update progress bar
 */
function updateProg() {
  document.getElementById('progLabel').textContent = S.correct + ' av ' + QPC + ' rette';
  const pips = document.getElementById('progPips');
  pips.setAttribute('aria-valuenow', String(S.correct));
  pips.replaceChildren(...Array.from({ length: QPC }, (_, i) => Vy.el('span', 'hs-pip' + (i < S.correct ? ' is-lit' : ''))));
}

document.getElementById('answerForm').addEventListener('submit', event => {
  event.preventDefault(); checkAnswer();
});
