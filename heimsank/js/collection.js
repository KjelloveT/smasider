// Samlingsalbum — same kortkomponent og detaljvising som i spelet.
let albumRequest = 0;
async function openCollectionViewer() {
  const request = ++albumRequest;
  const grid = document.getElementById('collectionGrid');
  grid.replaceChildren(Vy.el('p', 'hs-empty', 'Lastar samlingane…'));
  HeimsankUI.open('collectionModal', closeCollectionModal);
  try {
    const stored = VyrdepilStorage.getAllCollections('heimsank') || {};
    const collections = await Promise.all(S.cats.map(async cat => {
      const entries = Array.isArray(stored[cat.id]) ? stored[cat.id] : [];
      if (!entries.length) return null;
      const data = await CardData.loadCategoryCards(cat);
      return { cat, items: entries.map(entry => ({ entry, card: data.find(card => card.id === entry.cardId) })).filter(item => item.card) };
    }));
    if (request !== albumRequest) return;
    grid.replaceChildren();
    collections.filter(group => group?.items.length).forEach(({ cat, items }) => {
      const section = Vy.el('section', 'hs-album-section');
      HeimsankUI.category(section, cat.id);
      const header = Vy.el('div', 'hs-album-heading');
      header.append(Vy.el('h3', '', cat.label), Vy.el('span', '', items.length + ' av 6 kort'));
      const row = Vy.el('div', 'hs-album-cards');
      items.forEach(({ card, entry }, index) => {
        const el = HeimsankCards.makeClickable(
          HeimsankCards.render(card, entry), card, () => openCardModal(index, items));
        row.appendChild(el);
      });
      section.append(header, row); grid.appendChild(section);
    });
    if (!grid.childElementCount) grid.appendChild(Vy.el('p', 'hs-empty', 'Samlinga di byrjar med eitt kort. Svar rett seks gonger for å finne det!'));
  } catch {
    if (request === albumRequest) grid.replaceChildren(Vy.el('p', 'hs-empty', 'Samlingane kunne ikkje lastast. Lukk og prøv på nytt.'));
  }
}
function closeCollectionModal() { albumRequest++; HeimsankUI.close('collectionModal'); }
