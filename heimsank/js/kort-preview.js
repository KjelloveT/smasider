// Lokal kvalitetsvising. Berre vald kategori blir lasta, aldri alle CSV-filene.
const KortPreview = (function () {
  const BATCH_SIZE = 24;
  let categories = [];
  let cards = [];
  let filtered = [];
  let visible = 0;

  const categorySelect = document.getElementById('previewCategory');
  const searchInput = document.getElementById('previewSearch');
  const status = document.getElementById('previewStatus');
  const grid = document.getElementById('previewGrid');
  const moreButton = document.getElementById('previewMore');

  function selectedId() {
    const hash = decodeURIComponent(location.hash.slice(1));
    return categories.some(cat => cat.id === hash) ? hash : 'sportsbilar';
  }

  function updateStatus() {
    const cat = categories.find(item => item.id === categorySelect.value);
    status.textContent = `${cat?.label || 'Kategori'}: viser ${Math.min(visible, filtered.length)} av ${filtered.length} kort`;
    moreButton.hidden = visible >= filtered.length;
    if (!moreButton.hidden) moreButton.textContent = `Vis ${Math.min(BATCH_SIZE, filtered.length - visible)} fleire kort`;
  }

  function appendBatch() {
    const next = filtered.slice(visible, visible + BATCH_SIZE);
    for (const card of next) grid.appendChild(HeimsankCards.render(card, null, 'collection'));
    visible += next.length;
    updateStatus();
  }

  function applyFilter() {
    const query = searchInput.value.trim().toLocaleLowerCase('nn');
    filtered = query ? cards.filter(card => card.name.toLocaleLowerCase('nn').includes(query)) : [...cards];
    visible = 0;
    grid.replaceChildren();
    if (!filtered.length) {
      grid.appendChild(Vy.el('p', 'box1 hs-preview-empty', 'Ingen kort passar med søket.'));
      updateStatus();
      return;
    }
    appendBatch();
  }

  async function loadCategory(id) {
    const cat = categories.find(item => item.id === id) || categories[0];
    if (!cat) return;
    categorySelect.value = cat.id;
    history.replaceState(null, '', `#${encodeURIComponent(cat.id)}`);
    status.textContent = `Lastar ${cat.label}…`;
    grid.replaceChildren();
    moreButton.hidden = true;
    try {
      cards = await CardData.loadCategoryCards(cat);
      applyFilter();
    } catch {
      cards = [];
      filtered = [];
      status.textContent = `Klarte ikkje å lese kortdata for ${cat.label}.`;
    }
  }

  async function init() {
    try {
      const response = await fetch('./kort/categories.json?v=1.56');
      if (!response.ok) throw new Error('Kategoriar');
      categories = await response.json();
      for (const cat of categories) {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.label;
        categorySelect.appendChild(option);
      }
      categorySelect.addEventListener('change', () => loadCategory(categorySelect.value));
      searchInput.addEventListener('input', applyFilter);
      moreButton.addEventListener('click', appendBatch);
      await loadCategory(selectedId());
    } catch {
      status.textContent = 'Klarte ikkje å lese kategorilista.';
    }
  }

  return { init };
})();

KortPreview.init();
