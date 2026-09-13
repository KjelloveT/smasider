// Musebasert dra-og-slepp er eit tillegg til dei synlege knappane.
function initTrash() {
  setupDropTarget(document.getElementById('trashZone'), source => {
    if (source.type === 'pending') { discardPending(); return; }
    if (source.type !== 'coll' || !S.collection[source.idx]) return;
    S.collection.splice(source.idx, 1);
    if (S.phase === 'pending' && S.pendingEntry) {
      S.collection.push(S.pendingEntry); finishPending();
    } else { saveStorage(); renderColl(); }
  });
}
function setupDraggable(el, type, idx) {
  el.draggable = true;
  el.addEventListener('dragstart', event => {
    if (event.target.closest('button,a')) { event.preventDefault(); return; }
    DS = { type, idx };
    el.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(idx));
  });
  el.addEventListener('dragend', () => {
    DS = null; el.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(node => node.classList.remove('drag-over'));
  });
}
function setupDropTarget(el, onDrop) {
  el.addEventListener('dragover', event => {
    if (DS) { event.preventDefault(); el.classList.add('drag-over'); }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', event => {
    event.preventDefault(); el.classList.remove('drag-over');
    const source = DS; DS = null;
    if (source) onDrop(source);
  });
}
