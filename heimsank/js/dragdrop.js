// Heimsank - Drag and Drop Functions

/**
 * Initialize trash zone drop target
 */
function initTrash() {
  const trash = document.getElementById('trashZone');
  setupDropTarget(trash, ds => {
    if (ds.type === 'coll') {
      // Remove from collection
      S.collection.splice(ds.idx, 1);
      // Add pending card if collection has room
      if (S.pending && S.collection.length < 6) {
        // Use pendingEntry if available (with foil status)
        const entry = S.pendingEntry || {
          catId: S.pending.catId,
          cardId: S.pending.id,
          difficulty: S.level ? (S.level === 'lett' ? 'Lett' : S.level === 'middels' ? 'Middels' : 'Vanskeleg') : 'Middels',
          operations: S.ops && S.ops.length > 0
            ? S.ops.map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op)
            : ['+', '-'],
          foil: false,
          earnedAt: Date.now()
        };

        S.collection.push(entry);
        S.pending = null;
        S.pendingEntry = null;
      }
      saveStorage();
      renderColl();
      resumeIfDone();
    } else if (ds.type === 'pending') {
      // Discard pending card
      S.pending = null;
      S.pendingEntry = null; // Clear pending entry
      renderColl();
      resumeIfDone();
    }
  });
}

/**
 * Make an element draggable
 * @param {HTMLElement} el - Element to make draggable
 * @param {string} type - 'coll' or 'pending'
 * @param {number} idx - Index in collection
 */
function setupDraggable(el, type, idx) {
  el.draggable = true;
  el.addEventListener('dragstart', e => {
    DS = { type, idx };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
}

/**
 * Setup drop target on an element
 * @param {HTMLElement} el - Element to setup as drop target
 * @param {Function} onDrop - Callback when item is dropped
 */
function setupDropTarget(el, onDrop) {
  el.addEventListener('dragover', e => {
    if (DS) {
      e.preventDefault();
      el.classList.add('drag-over');
    }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (DS) {
      onDrop(DS);
      DS = null;
    }
  });
}
