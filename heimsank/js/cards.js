// Samlinga i den aktive kategorien. All kortplassering går gjennom same handling.
function renderColl() {
  const row = document.getElementById('collRow');
  document.getElementById('collCount').textContent = S.collection.length;
  const dots = document.getElementById('collMiniDots');
  row.replaceChildren(); dots.replaceChildren();
  S.collection.forEach((entry, index) => {
    const card = S.idx[entry.cardId];
    const dot = Vy.el('span', 'hs-mini-dot');
    dot.dataset.rarity = card?.rarity || 'vanleg';
    dots.appendChild(dot);
    if (!card) {
      row.appendChild(Vy.el('div', 'hs-card-empty', 'Kortdata manglar'));
      return;
    }
    const el = HeimsankCards.makeClickable(
      HeimsankCards.render(card, entry), card, () => openCardModal(index));
    setupDraggable(el, 'coll', index);
    setupDropTarget(el, source => {
      if (source.type === 'pending') replacePending(index);
      else if (source.type === 'coll' && source.idx !== index) {
        [S.collection[index], S.collection[source.idx]] = [S.collection[source.idx], S.collection[index]];
        saveStorage(); renderColl();
      }
    });
    if (S.pending && S.phase === 'pending') {
      const actions = Vy.el('div', 'hs-card-actions');
      const swap = Vy.el('button', 'hs-btn hs-primary', 'Byt dette');
      swap.setAttribute('aria-label', 'Byt ut ' + card.name + ' med det nye kortet');
      swap.addEventListener('click', () => replacePending(index));
      actions.appendChild(swap); el.appendChild(actions);
    }
    row.appendChild(el);
  });
  for (let i = S.collection.length; i < 6; i++) {
    dots.appendChild(Vy.el('span', 'hs-mini-dot'));
    const empty = Vy.el('div', 'hs-card-empty');
    empty.append(HeimsankUI.icon('layers', 26), Vy.el('span', '', 'Di neste oppdaging'));
    row.appendChild(empty);
  }
  document.getElementById('clearAllBtn').disabled = !S.collection.length || !!S.pending;
}
function replacePending(index) {
  if (S.phase !== 'pending' || !S.pendingEntry || !S.collection[index]) return;
  S.collection[index] = S.pendingEntry;
  finishPending();
}
function discardPending() {
  if (S.phase !== 'pending') return;
  finishPending();
}
function finishPending() {
  S.pending = null; S.pendingEntry = null;
  saveStorage(); renderColl();
  ProgressionUI.evaluateAndAnnounce();
  resumeIfDone();
}
function resumeIfDone() {
  if (S.pending || S.phase === 'setup') return;
  S.paused = false;
  document.getElementById('pendingArea').classList.add('hidden');
  document.getElementById('dragInstruction').classList.add('hidden');
  nextQ();
}
function expandCollForSwap() {
  setCollectionExpanded(true);
  document.getElementById('dragInstruction').classList.remove('hidden');
  document.querySelector('#collRow .hs-card-actions button')?.focus();
}
function setCollectionExpanded(expanded) {
  document.getElementById('collBarInner').classList.toggle('hidden', !expanded);
  document.getElementById('collToggleRow').setAttribute('aria-expanded', String(expanded));
  document.getElementById('collToggleLabel').textContent = expanded ? 'Skjul kort' : 'Vis kort';
}
function toggleCollBar() {
  setCollectionExpanded(document.getElementById('collBarInner').classList.contains('hidden'));
}
