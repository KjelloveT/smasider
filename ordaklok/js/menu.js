/* Ordaklok — meny / index.html
 * Viser liste-kort, importer JSON, importer delelenkje, last inn dømeliste.
 */
(function () {
  'use strict';

  const { escapeHtml, ICONS } = OrdaklokState;
  const Storage = OrdaklokStorage;

  const listsContainer = document.getElementById('listsContainer');
  const emptyHelp = document.getElementById('emptyHelp');

  function modeLabel(mode) {
    return ({
      type: 'Skriv svar',
      mc: 'Multiple choice',
      flashcard: 'Flashcard',
      match: 'Matching'
    })[mode] || mode;
  }

  function bestScoreSummary(listId) {
    const scores = Storage.getScoresForList(listId);
    let best = null;
    for (const m of Object.keys(scores)) {
      const s = scores[m];
      if (typeof s.best === 'number' && (!best || s.best > best.best)) {
        best = { mode: m, best: s.best };
      }
    }
    return best;
  }

  function renderList() {
    const lists = Storage.getLists();
    listsContainer.innerHTML = '';
    if (!lists.length) {
      emptyHelp.style.display = '';
      return;
    }
    emptyHelp.style.display = 'none';

    // Sorter etter sist oppdatert (nyaste først)
    const sorted = lists.slice().sort((a, b) =>
      String(b.updated || '').localeCompare(String(a.updated || ''))
    );

    for (const list of sorted) {
      const card = document.createElement('div');
      card.className = 'box2 list-card';

      const title = document.createElement('h3');
      title.className = 'list-card-title';
      title.textContent = list.title;
      card.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'list-card-meta';
      meta.textContent = `${list.pairs.length} par · ${list.labelA} ↔ ${list.labelB}`;
      card.appendChild(meta);

      // Mestrings-pille
      const stats = OrdaklokLeitner.masteryStats(Storage.getLeitner(list.id), list.pairs.length);
      if (stats.mastered > 0) {
        const pill = document.createElement('span');
        pill.className = 'mastery-pill';
        pill.textContent = `${stats.mastered} av ${stats.total} meistra`;
        card.appendChild(pill);
      }

      // Toppscore-pille
      const best = bestScoreSummary(list.id);
      if (best) {
        const pill = document.createElement('span');
        pill.className = 'best-pill';
        pill.textContent = `Best: ${best.best} p (${modeLabel(best.mode)})`;
        card.appendChild(pill);
      }

      if (list.description) {
        const desc = document.createElement('p');
        desc.className = 'list-card-desc';
        desc.textContent = list.description;
        card.appendChild(desc);
      }

      const actions = document.createElement('div');
      actions.className = 'list-card-actions';

      const playBtn = document.createElement('a');
      playBtn.className = 'btn btn-primary btn-small';
      playBtn.href = 'play.html?list=' + encodeURIComponent(list.id);
      playBtn.innerHTML = ICONS.play + '<span> Spel</span>';
      actions.appendChild(playBtn);

      const editBtn = document.createElement('a');
      editBtn.className = 'btn btn-small';
      editBtn.href = 'editor.html?list=' + encodeURIComponent(list.id);
      editBtn.setAttribute('aria-label', 'Rediger ' + list.title);
      editBtn.innerHTML = ICONS.edit + '<span> Rediger</span>';
      actions.appendChild(editBtn);

      const dupBtn = document.createElement('button');
      dupBtn.type = 'button';
      dupBtn.className = 'btn btn-small';
      dupBtn.setAttribute('aria-label', 'Dupliser ' + list.title);
      dupBtn.innerHTML = ICONS.copy;
      dupBtn.addEventListener('click', () => {
        Storage.duplicateList(list.id);
        renderList();
      });
      actions.appendChild(dupBtn);

      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'btn btn-small';
      exportBtn.setAttribute('aria-label', 'Eksporter ' + list.title);
      exportBtn.innerHTML = ICONS.download;
      exportBtn.addEventListener('click', () => exportList(list));
      actions.appendChild(exportBtn);

      const shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'btn btn-small';
      shareBtn.setAttribute('aria-label', 'Lag delelenkje for ' + list.title);
      shareBtn.innerHTML = ICONS.share;
      shareBtn.addEventListener('click', () => showShareLink(list));
      actions.appendChild(shareBtn);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-small btn-danger';
      delBtn.setAttribute('aria-label', 'Slett ' + list.title);
      delBtn.innerHTML = ICONS.trash;
      delBtn.addEventListener('click', () => {
        if (confirm(`Vil du slette lista «${list.title}»? Dette kan ikkje angrast.`)) {
          Storage.deleteList(list.id);
          renderList();
        }
      });
      actions.appendChild(delBtn);

      card.appendChild(actions);
      listsContainer.appendChild(card);
    }
  }

  function exportList(list) {
    // Fjern tomme felt for renare eksport
    const out = {
      app: 'ordaklok',
      version: 1,
      id: list.id,
      title: list.title,
      labelA: list.labelA,
      labelB: list.labelB,
      description: list.description || '',
      pairs: list.pairs,
      created: list.created,
      updated: list.updated
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(list.title) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function sanitizeFilename(s) {
    return String(s || 'liste').replace(/[^a-zA-Z0-9æøåÆØÅ_\- ]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'liste';
  }

  // ---- Share link modal ----
  const shareLinkOverlay = document.getElementById('shareLinkOverlay');
  const shareLinkInput = document.getElementById('shareLinkInput');
  const shareLinkInfo = document.getElementById('shareLinkInfo');
  const shareLinkClose = document.getElementById('shareLinkClose');
  const shareLinkCopy = document.getElementById('shareLinkCopy');
  const shareLinkOpen = document.getElementById('shareLinkOpen');

  let currentShareUrl = '';

  async function showShareLink(list) {
    shareLinkInput.value = 'Lagar lenkje…';
    shareLinkInfo.textContent = '';
    shareLinkOverlay.classList.add('open');
    try {
      const url = await OrdaklokShare.buildShareUrl(list);
      currentShareUrl = url;
      shareLinkInput.value = url;
      shareLinkInfo.textContent = `Lenkje-lengd: ${url.length} teikn. ${url.length > 8000 ? 'NB: Lange lenkjer kan ikkje fungere i alle e-postklientar.' : ''}`;
    } catch (e) {
      shareLinkInput.value = 'Klarte ikkje å lage lenkje: ' + e.message;
    }
  }

  function closeShareLink() {
    shareLinkOverlay.classList.remove('open');
  }

  shareLinkClose.addEventListener('click', closeShareLink);
  shareLinkOverlay.addEventListener('click', (e) => {
    if (e.target === shareLinkOverlay) closeShareLink();
  });
  shareLinkCopy.addEventListener('click', async () => {
    if (!currentShareUrl) return;
    try {
      await navigator.clipboard.writeText(currentShareUrl);
      shareLinkInfo.textContent = 'Kopiert til utklippstavla!';
    } catch {
      shareLinkInput.select();
      document.execCommand('copy');
      shareLinkInfo.textContent = 'Kopiert (med fallback).';
    }
  });
  shareLinkOpen.addEventListener('click', () => {
    if (currentShareUrl) window.open(currentShareUrl, '_blank', 'noopener');
  });

  // ---- Share import modal (når URL inneheld d/dz) ----
  const shareImportOverlay = document.getElementById('shareImportOverlay');
  const shareImportPreview = document.getElementById('shareImportPreview');
  const shareImportClose = document.getElementById('shareImportClose');
  const shareImportAccept = document.getElementById('shareImportAccept');
  const shareImportCancel = document.getElementById('shareImportCancel');

  let pendingImportList = null;

  function closeShareImport() {
    shareImportOverlay.classList.remove('open');
    // Fjern d/dz frå URL utan å reloade
    const url = new URL(location.href);
    url.searchParams.delete('d');
    url.searchParams.delete('dz');
    history.replaceState({}, '', url.toString());
  }

  shareImportClose.addEventListener('click', closeShareImport);
  shareImportCancel.addEventListener('click', closeShareImport);
  shareImportOverlay.addEventListener('click', (e) => {
    if (e.target === shareImportOverlay) closeShareImport();
  });

  shareImportAccept.addEventListener('click', () => {
    if (!pendingImportList) return;
    const v = OrdaklokState.validateList(pendingImportList);
    if (!v.ok) { alert('Klarte ikkje å lagre: ' + v.error); return; }
    // Gje ny id slik at det ikkje overskriv eksisterande
    v.list.id = 'list_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    Storage.saveList(v.list);
    closeShareImport();
    renderList();
  });

  async function checkShareImport() {
    const params = new URLSearchParams(location.search);
    if (!params.has('d') && !params.has('dz')) return;
    try {
      const obj = await OrdaklokShare.decodeFromParams(params);
      if (!obj) return;
      const v = OrdaklokState.validateList(obj);
      if (!v.ok) {
        shareImportPreview.textContent = 'Lenkja inneheld ikkje ei gyldig liste: ' + v.error;
        shareImportAccept.disabled = true;
        shareImportOverlay.classList.add('open');
        return;
      }
      pendingImportList = v.list;
      shareImportAccept.disabled = false;
      // Render preview
      shareImportPreview.innerHTML = '';
      const t = document.createElement('h3');
      t.className = 'heading4 no-mt';
      t.textContent = v.list.title;
      shareImportPreview.appendChild(t);
      const m = document.createElement('p');
      m.className = 'muted';
      m.textContent = `${v.list.pairs.length} par · ${v.list.labelA} ↔ ${v.list.labelB}`;
      shareImportPreview.appendChild(m);
      // Vis dei første 5 para
      const preview = document.createElement('ul');
      preview.style.margin = '8px 0 0';
      preview.style.paddingLeft = '20px';
      v.list.pairs.slice(0, 5).forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.a} – ${p.b}`;
        preview.appendChild(li);
      });
      if (v.list.pairs.length > 5) {
        const li = document.createElement('li');
        li.className = 'muted';
        li.textContent = `…og ${v.list.pairs.length - 5} til`;
        preview.appendChild(li);
      }
      shareImportPreview.appendChild(preview);
      shareImportOverlay.classList.add('open');
    } catch (e) {
      console.warn('Klarte ikkje å lese delelenkje:', e);
    }
  }

  // ---- Importer JSON ----
  const importJsonBtn = document.getElementById('importJsonBtn');
  const importJsonFile = document.getElementById('importJsonFile');
  importJsonBtn.addEventListener('click', () => importJsonFile.click());
  importJsonFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const v = OrdaklokState.validateList(obj);
      if (!v.ok) { alert('Klarte ikkje å importere: ' + v.error); return; }
      // Sjekk om id allereie finst
      const existing = Storage.getList(v.list.id);
      if (existing) {
        if (!confirm(`Lista «${existing.title}» finst allereie. Vil du overskrive ho?`)) {
          v.list.id = 'list_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        }
      }
      Storage.saveList(v.list);
      renderList();
    } catch (err) {
      alert('Ugyldig JSON-fil: ' + err.message);
    } finally {
      importJsonFile.value = '';
    }
  });

  // ---- Last inn dømeliste ----
  document.getElementById('loadSampleBtn').addEventListener('click', () => {
    const sample = JSON.parse(JSON.stringify(OrdaklokSample.SAMPLE_LIST));
    // Sjekk om allereie finst
    if (Storage.getList(sample.id)) {
      if (!confirm('Dømelista er allereie lagra. Vil du overskrive ho?')) return;
    }
    Storage.saveList(sample);
    renderList();
  });

  // Esc lukkar overlays
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shareLinkOverlay.classList.contains('open')) closeShareLink();
      if (shareImportOverlay.classList.contains('open')) closeShareImport();
    }
  });

  // Init
  renderList();
  checkShareImport();
})();
