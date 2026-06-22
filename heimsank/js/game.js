// Heimsank - Game Logic Functions

/**
 * Initialize the application
 */
async function init() {
  loadStorage();
  initTrash();
  Progression.load();
  try {
    S.cats = await fetch('./kort/categories.json').then(r => r.json());
    ProgressionUI.renderPoints();
    ProgressionUI.renderCovers(S.cats);
    // Etterhandsam merke (t.d. for spelarar som alt hadde kort før systemet kom)
    ProgressionUI.evaluateAndAnnounce();
    document.getElementById('setupLoading').classList.add('hidden');
    document.getElementById('setupContent').classList.remove('hidden');
    // Start showcase fan display
    initShowcase();
  } catch (e) {
    document.getElementById('setupLoading').textContent = 'Feil: køyr serve.ps1 fyrst.';
  }
}

/**
 * Select difficulty level
 * @param {string} l - Level: 'lett', 'middels', 'vanskeleg'
 */
function selLevel(l) {
  S.level = l;
  document.querySelectorAll('[data-level]').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-level="${l}"]`).classList.add('active');
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
    b.classList.remove('active');
  } else {
    S.ops.push(op);
    b.classList.add('active');
  }
}

/**
 * Start the game
 */
async function startGame() {
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = 'Lastar…';
  try {
    await loadCards(S.selCat);
  } catch (e) {
    alert('Feil ved lasting. Køyr serve.ps1 fyrst.');
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
  sub.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-bottom:5px;color:var(--muted)';
  sub.innerHTML = `${CAT_ICON(S.selCat.icon, 14)}<span>${S.selCat.label} – </span>`;
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
  if (S.paused) return;
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
  inp.focus();
  document.getElementById('checkBtn').disabled = false;
  setFb('', '');
}

/**
 * Check user's answer
 */
function checkAnswer() {
  if (S.paused || !S.q) return;
  const v = parseInt(document.getElementById('ansInput').value, 10);
  if (isNaN(v)) {
    setFb('Skriv inn eit tal!', 'incorrect');
    return;
  }
  if (v === S.q.ans) {
    S.correct++;
    Progression.recordCorrect(S.level);
    setFb('RETT!', 'correct');
    updateProg();
    document.getElementById('ansInput').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    if (S.correct >= QPC) {
      setTimeout(triggerCard, 800);
    } else {
      setTimeout(nextQ, 700);
    }
  } else {
    setFb(`Feil! (${S.q.ans})`, 'incorrect');
    setTimeout(nextQ, 1400);
  }
}

/**
 * Set feedback text
 * @param {string} m - Message
 * @param {string} c - CSS class: 'correct', 'incorrect', or ''
 */
function setFb(m, c) {
  const el = document.getElementById('feedback');
  el.textContent = m;
  // Map legacy class names to feedback-stamp classes
  const cls = c === 'correct' ? 'rett' : c === 'incorrect' ? 'feil' : '';
  el.className = 'feedback-stamp' + (cls ? ' ' + cls + ' show' : '');
}

/**
 * Update progress bar
 */
function updateProg() {
  const p = (S.correct / QPC) * 100;
  document.getElementById('progFill').style.width = p + '%';
  document.getElementById('progLabel').textContent = `${S.correct} / ${QPC}`;
  const pipsEl = document.getElementById('progPips');
  if (pipsEl) {
    pipsEl.innerHTML = Array.from({length: QPC}, (_, i) =>
      `<span class="pip${i < S.correct ? ' lit' : ''}"></span>`
    ).join('');
  }
}

// Answer input enter key handler
document.getElementById('ansInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAnswer();
});
