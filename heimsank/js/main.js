// Kortpremie: pending vert oppretta før dialogen opnar; fasevernet gjev éi tildeling.
function drawCard() {
  let random = Math.random() * RW.reduce((a, b) => a + b, 0);
  let rarity = RO[0];
  for (let i = 0; i < RO.length; i++) { random -= RW[i]; if (random <= 0) { rarity = RO[i]; break; } }
  const group = S.groups[rarity]?.length ? S.groups[rarity] : RO.map(r => S.groups[r]).find(g => g?.length);
  return group?.[Math.floor(Math.random() * group.length)] || null;
}
function shouldHaveFoil() { return Math.random() < 0.05; }
function triggerCard() {
  if (S.phase !== 'feedback') return;
  const card = drawCard();
  if (!card) { S.correct = 0; updateProg(); nextQ(); return; }
  S.phase = 'reveal'; S.paused = true; S.pending = card;
  S.pendingEntry = {
    catId: card.catId, cardId: card.id,
    difficulty: { lett: 'Lett', middels: 'Middels', vanskeleg: 'Vanskeleg' }[S.level],
    operations: S.ops.map(op => ({ '*': '×', '/': '÷', '-': '−', '+': '+' })[op]),
    foil: shouldHaveFoil(), earnedAt: Date.now()
  };
  const flip = document.getElementById('flipCard');
  flip.className = 'hs-reveal-card';
  document.getElementById('revealFront').replaceChildren(HeimsankCards.render(card, S.pendingEntry, 'reveal'));
  document.getElementById('revealSub').textContent = 'Kva skjuler seg på den andre sida?';
  document.getElementById('revealBtn').textContent = 'Vis kortet';
  HeimsankUI.open('revealModal', settleReveal);
}
function showRevealedCard() {
  if (S.phase !== 'reveal') return;
  const flip = document.getElementById('flipCard');
  flip.classList.add('is-revealed');
  flip.classList.toggle('is-rare', ['segngjeten', 'gudebore'].includes(S.pending.rarity));
  document.getElementById('revealSub').textContent = RL[S.pending.rarity] + (S.pendingEntry.foil ? ' · Foil' : '');
  document.getElementById('revealBtn').textContent = 'Hald fram';
}
function afterReveal() {
  if (S.phase !== 'reveal' || !S.pending || !S.pendingEntry) return;
  // Fyrste trykk snur kortet; Escape skal alltid fullføre overgangen.
  if (!document.getElementById('flipCard').classList.contains('is-revealed')) {
    showRevealedCard(); return;
  }
  settleReveal();
}
function settleReveal() {
  if (S.phase !== 'reveal' || !S.pendingEntry) return;
  HeimsankUI.cancelTimers();
  S.phase = 'pending';
  HeimsankUI.close('revealModal');
  S.correct = 0; updateProg();
  const points = ProgressionUI.awardCardPoints(S.pending, S.pendingEntry.foil);
  ProgressionUI.toast('Kortet gav ' + points + ' poeng!', 'coins', 'good');
  if (S.collection.length < 6) {
    S.collection.push(S.pendingEntry);
    finishPending();
  } else {
    document.getElementById('pendingSlotMain').replaceChildren(HeimsankCards.render(S.pending, S.pendingEntry));
    setupDraggable(document.querySelector('#pendingSlotMain .hs-card'), 'pending', 0);
    document.getElementById('pendingCardName').textContent = S.pending.name;
    document.getElementById('pendingRarityLabel').textContent = RL[S.pending.rarity];
    document.getElementById('pendingArea').classList.remove('hidden');
    renderColl(); ProgressionUI.evaluateAndAnnounce();
    document.getElementById('pendingSwap').focus();
  }
}
document.addEventListener('DOMContentLoaded', init);
