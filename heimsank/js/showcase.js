// Kortvifta følgjer kategorivalet. Ingen automatisk rotasjon eller bakgrunnslasting.
let showcaseRequest = 0;
async function initShowcase(cat = S.cats.find(c => c.id === 'land')) {
  if (!cat) return;
  const request = ++showcaseRequest;
  document.getElementById('fanCatLabel').textContent = cat.label + ' · kva finn du neste gong?';
  try {
    const cards = await CardData.loadCategoryCards(cat);
    if (request !== showcaseRequest) return;
    const chosen = [];
    for (const rarity of ['sjeldgjevt', 'gudebore', 'segngjeten']) {
      const card = cards.find(c => c.rarity === rarity);
      if (card) chosen.push(card);
    }
    for (const card of cards) {
      if (chosen.length >= 3) break;
      if (!chosen.includes(card)) chosen.push(card);
    }
    document.getElementById('fanContainer').replaceChildren(
      ...chosen.map(card => HeimsankCards.render(card, null, 'showcase')));
  } catch {
    if (request === showcaseRequest) document.getElementById('fanContainer').replaceChildren(HeimsankUI.icon('layers', 64));
  }
}
function stopShowcase() { showcaseRequest++; }
