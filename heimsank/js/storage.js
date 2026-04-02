// Heimsank - Storage Functions

/**
 * Save collection to localStorage
 */
function saveStorage() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(S.collection.slice(0, 6)));
  } catch {}
}

/**
 * Load collection from localStorage
 */
function loadStorage() {
  try {
    const r = localStorage.getItem(getStorageKey());
    if (r) {
      S.collection = JSON.parse(r).slice(0, 6);
    } else {
      S.collection = [];
    }
  } catch {
    S.collection = [];
  }
}

/**
 * Clear all cards from collection
 */
function confirmClearAll() {
  if (S.collection.length === 0) return;
  if (confirm('Er du sikker på at du vil tømme samlinga for ' + S.selCat.label + '? Alle kort vert fjerna.')) {
    S.collection = [];
    S.pending = null;
    saveStorage();
    renderColl();
    resumeIfDone();
  }
}
