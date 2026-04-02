// Heimsank - Main Initialization

// Card draw functions (depends on game state)

/**
 * Draw a random card based on rarity weights with 5% foil chance
 * @returns {Object} Selected card
 */
function drawCard() {
  const totalWeight = RW.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedRarity = 'vanleg';

  for (let i = 0; i < RO.length; i++) {
    random -= RW[i];
    if (random <= 0) {
      selectedRarity = RO[i];
      break;
    }
  }

  const group = S.groups[selectedRarity];
  if (!group || group.length === 0) {
    // Fallback: try to find any card
    for (const r of RO) {
      if (S.groups[r] && S.groups[r].length > 0) {
        return S.groups[r][Math.floor(Math.random() * S.groups[r].length)];
      }
    }
    return null;
  }

  return group[Math.floor(Math.random() * group.length)];
}

/**
 * Check if a new card should have foil effect (5% chance)
 * @returns {boolean} True if foil
 */
function shouldHaveFoil() {
  return Math.random() < 0.05; // 5% chance
}

/**
 * Trigger card win sequence
 */
function triggerCard() {
  const card = drawCard();
  if (!card) {
    alert('Ingen kort tilgjengeleg!');
    S.correct = 0;
    updateProg();
    return;
  }

  // Determine if this card should have foil effect
  const hasFoil = shouldHaveFoil();

  // Pause game
  S.paused = true;
  document.getElementById('ansInput').disabled = true;
  document.getElementById('checkBtn').disabled = true;

  // Show reveal modal
  const modal = document.getElementById('revealModal');
  const fc = document.getElementById('flipCard');
  const fb = document.querySelector('.flip-back-logo');

  fb.textContent = S.selCat.icon;
  fc.classList.remove('flipped');
  document.getElementById('revealBtn').classList.add('hidden');
  document.getElementById('revealSub').textContent = hasFoil ? '✨ Sjeldant foil-kort! ✨' : 'Nytt kort! Velg ein kategori...';
  modal.classList.remove('hidden');

  // Wait then flip
  setTimeout(() => {
    S.pending = card;
    S.pendingFoil = hasFoil; // Store foil status temporarily

    // Create card preview
    const cardPreview = mkCard(card, 'full');
    const flipFront = document.querySelector('.flip-front');
    flipFront.innerHTML = '';
    flipFront.appendChild(cardPreview);

    fc.classList.add('flipped');
    document.getElementById('revealSub').textContent = `${RL[card.rarity]}${hasFoil ? ' ✨' : ''} – ${card.name}`;
    setTimeout(() => document.getElementById('revealBtn').classList.remove('hidden'), 700);
  }, 1100);
}

/**
 * Handle after reveal (add to collection or show pending)
 */
function afterReveal() {
  document.getElementById('revealModal').classList.add('hidden');
  S.correct = 0;
  updateProg();

  // Get foil status from pending
  const hasFoil = S.pendingFoil || false;
  delete S.pendingFoil;

  if (S.collection.length < 6) {
    // Add directly to collection
    const operations = S.ops && S.ops.length > 0
      ? S.ops.map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op)
      : ['+', '-'];
    const difficulty = S.level
      ? (S.level === 'lett' ? 'Lett' : S.level === 'middels' ? 'Middels' : 'Vanskeleg')
      : 'Middels';

    S.collection.push({
      catId: S.pending.catId,
      cardId: S.pending.id,
      difficulty: difficulty,
      operations: operations,
      foil: hasFoil, // Save foil status
      earnedAt: Date.now()
    });
    S.pending = null;
    S.pendingFoil = null;
    saveStorage();
    renderColl();
    
    // Reset game state and continue
    S.paused = false;
    document.getElementById('ansInput').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    nextQ();
  } else {
    // Pause game, show pending card in main area
    S.paused = true;
    document.getElementById('ansInput').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    
    // Create pending entry with foil status
    const operations = S.ops && S.ops.length > 0
      ? S.ops.map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op)
      : ['+', '-'];
    const difficulty = S.level
      ? (S.level === 'lett' ? 'Lett' : S.level === 'middels' ? 'Middels' : 'Vanskeleg')
      : 'Middels';
    
    S.pendingEntry = {
      catId: S.pending.catId,
      cardId: S.pending.id,
      difficulty: difficulty,
      operations: operations,
      foil: hasFoil,
      earnedAt: Date.now()
    };
    
    // Show pending card in main area
    renderPendingCardMain();
    document.getElementById('pendingArea').classList.remove('hidden');
    
    // Update collection swap buttons
    renderColl();

    // Show drag instruction
    setTimeout(() => {
      document.getElementById('dragInstruction').classList.remove('hidden');
    }, 500);
  }
}

/**
 * Render pending card in main pending area
 */
function renderPendingCardMain() {
  const slot = document.getElementById('pendingSlotMain');
  slot.innerHTML = '';
  if (S.pending) {
    const entry = S.pendingEntry || {
      catId: S.pending.catId,
      cardId: S.pending.id,
      difficulty: S.difficulty,
      operations: S.ops.filter(op => S[op]).map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : '÷'),
      foil: false,
      earnedAt: Date.now()
    };
    const el = mkCard(S.pending, 'bar', entry);
    // Make pending card draggable
    setupDraggable(el, 'pending', 0);
    slot.appendChild(el);
  }
}

/**
 * Discard pending card
 */
function discardPending() {
  S.pending = null;
  S.pendingEntry = null;
  document.getElementById('pendingArea').classList.add('hidden');
  document.getElementById('dragInstruction').classList.add('hidden');
  renderColl();
  resumeIfDone();
}

// Make functions available globally for onclick handlers
window.selLevel = selLevel;
window.togOp = togOp;
window.startGame = startGame;
window.goSetup = goSetup;
window.checkAnswer = checkAnswer;
window.afterReveal = afterReveal;
window.confirmClearAll = confirmClearAll;
window.openCardTest = openCardTest;
window.openFoilTest = openFoilTest;
window.closeCardTest = closeCardTest;
window.closeCardModal = closeCardModal;
window.navigateCard = navigateCard;
window.navigateTestCard = navigateTestCard;
window.discardPending = discardPending;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
