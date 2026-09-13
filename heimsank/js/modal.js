// Kortdetaljar deler vising mellom aktiv samling og album.
let detailCards = [];
let currentModalIndex = 0;
function openCardModal(index, cards = null) {
  detailCards = cards || S.collection.map(entry => ({ card: S.idx[entry.cardId], entry })).filter(item => item.card);
  currentModalIndex = index;
  if (!detailCards[index]) return;
  renderCardDetail();
  HeimsankUI.open('cardModal', closeCardModal);
}
function renderCardDetail() {
  const item = detailCards[currentModalIndex];
  document.getElementById('modalCard').replaceChildren(HeimsankCards.render(item.card, item.entry, 'detail'));
  document.getElementById('cardPrev').disabled = currentModalIndex === 0;
  document.getElementById('cardNext').disabled = currentModalIndex === detailCards.length - 1;
  document.getElementById('cardPosition').textContent = (currentModalIndex + 1) + ' av ' + detailCards.length;
}
function closeCardModal() { HeimsankUI.close('cardModal'); }
function navigateCard(direction) {
  const next = currentModalIndex + direction;
  if (next < 0 || next >= detailCards.length) return;
  currentModalIndex = next; renderCardDetail();
}
