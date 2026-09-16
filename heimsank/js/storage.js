// Heimsank - Storage Functions (via VyrdepilStorage)

const HEIMSANK_GAME_KEY = 'heimsank';

/**
 * Save collection for current category via VyrdepilStorage
 */
function saveStorage() {
  if (!S.selCat) return;
  try {
    const seen = new Set();
    S.collection = S.collection.filter(entry => entry && entry.cardId && !seen.has(entry.cardId) && seen.add(entry.cardId));
    VyrdepilStorage.setCollection(HEIMSANK_GAME_KEY, S.selCat.id, S.collection);
  } catch (e) {
    console.error('Failed to save collection:', e);
  }
}

/**
 * Load collection for current category from VyrdepilStorage
 */
function loadStorage() {
  if (!S.selCat) {
    S.collection = [];
    return;
  }
  try {
    const stored = VyrdepilStorage.getCollection(HEIMSANK_GAME_KEY, S.selCat.id);
    const seen = new Set();
    S.collection = (Array.isArray(stored) ? stored : []).filter(entry =>
      entry && entry.cardId && !seen.has(entry.cardId) && seen.add(entry.cardId) &&
      (!Object.keys(S.idx).length || S.idx[entry.cardId])
    );
    if (Array.isArray(stored) && S.collection.length !== stored.length) saveStorage();
  } catch (e) {
    console.error('Failed to load collection:', e);
    S.collection = [];
  }
}

/**
 * Clear all cards from current category's collection
 */
function confirmClearAll() {
  if (S.pending) return;
  if (S.collection.length === 0) return;
  if (confirm('Er du viss på at du vil tøme samlinga for ' + S.selCat.label + '? Alle kort vert fjerna.')) {
    S.collection = [];
    S.pending = null;
    VyrdepilStorage.clearCollection(HEIMSANK_GAME_KEY, S.selCat.id);
    renderColl();
  }
}
