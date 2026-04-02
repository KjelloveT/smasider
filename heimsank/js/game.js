// Heimsank - Game Logic Functions

/**
 * Initialize the application
 */
async function init() {
  loadStorage();
  initTrash();
  try {
    S.cats = await fetch('./kort/categories.json').then(r => r.json());
    const g = document.getElementById('catsGrid');
    g.innerHTML = '';
    S.cats.forEach(c => {
      const el = document.createElement('div');
      el.className = 'cat-card';
      el.innerHTML = `<span class="cat-icon">${c.icon}</span><span class="cat-name">${c.label}</span>`;
      el.onclick = () => {
        S.selCat = c;
        document.querySelectorAll('.cat-card').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('startBtn').disabled = false;
      };
      g.appendChild(el);
    });
    document.getElementById('setupLoading').classList.add('hidden');
    document.getElementById('setupContent').classList.remove('hidden');
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
  document.querySelectorAll('[data-level]').forEach(b => b.classList.remove('selected'));
  document.querySelector(`[data-level="${l}"]`).classList.add('selected');
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
    b.classList.remove('selected');
  } else {
    S.ops.push(op);
    b.classList.add('selected');
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
  document.getElementById('setupScreen').classList.add('hidden');
  const gs = document.getElementById('gameScreen');
  gs.classList.remove('hidden');
  gs.style.display = 'flex';
  document.getElementById('menuBtn').style.display = 'block';
  document.getElementById('gameSub').textContent = `${S.selCat.icon} ${S.selCat.label} – `;
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
  gs.style.display = '';
  document.getElementById('setupScreen').classList.remove('hidden');
  document.getElementById('menuBtn').style.display = 'none';
  const btn = document.getElementById('startBtn');
  btn.disabled = false;
  btn.textContent = 'Start spelet →';
}

/**
 * Load cards for a category
 * @param {Object} cat - Category object
 */
async function loadCards(cat) {
  const [csv, rar] = await Promise.all([
    fetch(`./kort/${cat.csv}`).then(r => r.text()),
    fetch(`./kort/${cat.rarity}`).then(r => r.json())
  ]);

  const idF = cat.idField || 'scientist';
  const nameF = cat.nameField || 'scientistLabel';
  const imgF = cat.imageField || 'image';
  const artF = cat.articleField || 'article';
  const statF = cat.statField || 'birthDate';
  const statT = cat.statType || 'year';
  const statLbl = cat.statLabel || '📅';

  S.cards = parseCSV(csv)
    .filter(r => r[imgF] && r[imgF].trim())
    .map(r => {
      const id = r[idF].replace('http://www.wikidata.org/entity/', '');
      let stat = '?';
      if (statT === 'year') {
        stat = r[statF] ? r[statF].slice(0, 4) : '?';
      } else if (statT === 'number') {
        const n = parseInt(r[statF], 10);
        stat = isNaN(n) ? '?' : n.toLocaleString('nb-NO');
      } else {
        stat = r[statF] || '?';
      }
      return {
        id,
        name: r[nameF] || id,
        stat,
        statLabel: statLbl,
        img: r[imgF].replace(/^http:/, 'https:'),
        article: r[artF] || '',
        rarity: rar[id] || 'vanleg',
        catId: cat.id,
        catLabel: cat.label,
        catIcon: cat.icon
      };
    });

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

  S.q = {
    ans,
    txt: `${n1} ${{'+': '+', '-': '−', '*': '×', '/': '÷'}[op]} ${n2}`
  };
  document.getElementById('qBox').textContent = S.q.txt + ' = ?';
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
    setFb('✓ Rett!', 'correct');
    updateProg();
    document.getElementById('ansInput').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    if (S.correct >= QPC) {
      setTimeout(triggerCard, 800);
    } else {
      setTimeout(nextQ, 700);
    }
  } else {
    setFb(`✗ Feil – svaret er ${S.q.ans}`, 'incorrect');
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
  el.className = 'feedback' + (c ? ' ' + c : '');
}

/**
 * Update progress bar
 */
function updateProg() {
  const p = (S.correct / QPC) * 100;
  document.getElementById('progFill').style.width = p + '%';
  document.getElementById('progLabel').textContent = `${S.correct} / ${QPC}`;
}

// Answer input enter key handler
document.getElementById('ansInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAnswer();
});
