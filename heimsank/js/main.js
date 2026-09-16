// Kortpremie: pending vert oppretta før dialogen opnar; fasevernet gjev éi tildeling.
function drawCard() {
  const owned = new Set(S.collection.map(entry => entry.cardId));
  const available = RO.map((rarity, index) => ({
    rarity,
    weight: RW[index],
    cards: (S.groups[rarity] || []).filter(card => !owned.has(card.id))
  })).filter(group => group.cards.length);
  if (!available.length) return null;
  let random = Math.random() * available.reduce((sum, group) => sum + group.weight, 0);
  let picked = available[0];
  for (const group of available) {
    random -= group.weight;
    if (random <= 0) { picked = group; break; }
  }
  return picked.cards[Math.floor(Math.random() * picked.cards.length)] || null;
}
function shouldHaveFoil() { return Math.random() < 0.05; }
function triggerCard() {
  if (S.phase !== 'feedback') return;
  const card = drawCard();
  if (!card) {
    S.correct = 0; updateProg();
    ProgressionUI.toast('Du har funne alle korta i denne kategorien!', 'trophy', 'good');
    nextQ(); return;
  }
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
  S.collection.push(S.pendingEntry);
  finishPending();
}
document.addEventListener('DOMContentLoaded', init);
