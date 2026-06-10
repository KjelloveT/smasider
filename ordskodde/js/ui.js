/* ui.js — DOM-rendering for Ordskodde. All brukartekst blir sett med
   textContent/createElement (AGENTS §5.3 — aldri innerHTML med dynamiske strengar). */
(function (root) {
  'use strict';

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function btn(opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = opts.className || 'btn';
    if (opts.label) b.appendChild(document.createTextNode(opts.label));
    if (opts.icon) b.insertBefore(OrdskoddeIcons.el(opts.icon, { size: '1.1em' }), b.firstChild);
    if (opts.ariaLabel) b.setAttribute('aria-label', opts.ariaLabel);
    if (opts.title) b.title = opts.title;
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    return b;
  }

  // ---- Tema-swatchar ----

  function renderThemeSwatches(container, currentId, onPick) {
    clear(container);
    for (const theme of OrdskoddeThemes.THEMES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'os-swatch' + (theme.id === currentId ? ' active' : '');
      b.setAttribute('aria-label', 'Tema: ' + theme.name);
      b.setAttribute('aria-pressed', theme.id === currentId ? 'true' : 'false');
      b.title = theme.name;
      b.style.background = theme.background;
      const dots = document.createElement('span');
      dots.className = 'os-swatch-dots';
      for (const c of theme.colors.slice(0, 4)) {
        const dot = document.createElement('span');
        dot.className = 'os-swatch-dot';
        dot.style.background = c;
        dots.appendChild(dot);
      }
      const name = document.createElement('span');
      name.className = 'os-swatch-name';
      name.textContent = theme.name;
      name.style.color = theme.colors[0];
      b.appendChild(dots);
      b.appendChild(name);
      b.addEventListener('click', () => onPick(theme.id));
      container.appendChild(b);
    }
  }

  // ---- Form-knappar ----

  function renderShapeButtons(container, currentShape, onPick) {
    clear(container);
    for (const key of Object.keys(OrdskoddeThemes.SHAPES)) {
      const shape = OrdskoddeThemes.SHAPES[key];
      const b = btn({
        className: 'btn os-shape-btn' + (key === currentShape ? ' active' : ''),
        icon: shape.icon,
        ariaLabel: 'Form: ' + shape.name,
        title: shape.name,
        onClick: () => onPick(key)
      });
      b.setAttribute('aria-pressed', key === currentShape ? 'true' : 'false');
      container.appendChild(b);
    }
  }

  // ---- Skrifttype-select ----

  function fillFontSelect(select, currentFontId) {
    clear(select);
    for (const font of OrdskoddeThemes.FONTS) {
      const opt = document.createElement('option');
      opt.value = font.id;
      opt.textContent = font.label;
      opt.style.fontFamily = font.stack;
      if (font.id === currentFontId) opt.selected = true;
      select.appendChild(opt);
    }
  }

  // ---- Fargeveljarar ----

  function renderColorInputs(container, colors, onChange) {
    clear(container);
    colors.forEach((color, i) => {
      const input = document.createElement('input');
      input.type = 'color';
      input.value = color;
      input.className = 'os-color-input';
      input.setAttribute('aria-label', 'Ordfarge ' + (i + 1));
      input.addEventListener('input', () => onChange(i, input.value));
      container.appendChild(input);
    });
  }

  // ---- Ordliste ----

  function renderWordList(container, words, filterStr, onToggle) {
    clear(container);
    const filter = (filterStr || '').trim().toLowerCase();
    let shown = 0;
    // Vis meiningsberande ord først, stoppord til slutt (begge etter frekvens)
    const ordered = words.map((entry, idx) => ({ entry, idx }));
    ordered.sort((a, b) => (a.entry.stopword === b.entry.stopword) ? 0 : (a.entry.stopword ? 1 : -1));
    ordered.forEach(({ entry, idx }) => {
      if (filter && !entry.word.includes(filter)) return;
      shown++;
      const row = document.createElement('label');
      row.className = 'os-word-row' + (entry.enabled ? '' : ' disabled');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = entry.enabled;
      cb.addEventListener('change', () => onToggle(idx, cb.checked));
      const word = document.createElement('span');
      word.className = 'os-word';
      word.textContent = entry.word;
      const count = document.createElement('span');
      count.className = 'os-word-count';
      count.textContent = entry.count;
      row.appendChild(cb);
      row.appendChild(word);
      if (entry.stopword) {
        const badge = document.createElement('span');
        badge.className = 'os-stopword-badge';
        badge.textContent = 'stoppord';
        row.appendChild(badge);
      }
      row.appendChild(count);
      container.appendChild(row);
    });
    if (!shown) {
      const p = document.createElement('p');
      p.className = 'os-muted';
      p.textContent = filter ? 'Ingen ord passar til søket.' : 'Ingen ord funne i teksten.';
      container.appendChild(p);
    }
  }

  // ---- Lagra skyer ----

  function renderSavedList(container, emptyEl, clouds, handlers) {
    clear(container);
    emptyEl.hidden = clouds.length > 0;
    const sorted = clouds.slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    for (const cloud of sorted) {
      const row = document.createElement('div');
      row.className = 'os-saved-row';
      const info = document.createElement('div');
      info.className = 'os-saved-info';
      const title = document.createElement('strong');
      title.textContent = cloud.title;
      const meta = document.createElement('span');
      meta.className = 'os-muted';
      const d = new Date(cloud.updated || cloud.created);
      meta.textContent = isNaN(d) ? '' : 'Sist endra ' + d.toLocaleDateString('nn-NO', { day: 'numeric', month: 'short', year: 'numeric' });
      info.appendChild(title);
      info.appendChild(meta);
      const actions = document.createElement('div');
      actions.className = 'os-saved-actions';
      actions.appendChild(btn({ className: 'btn os-icon-btn', icon: 'folder', ariaLabel: 'Opne «' + cloud.title + '»', title: 'Opne', onClick: () => handlers.onOpen(cloud.id) }));
      actions.appendChild(btn({ className: 'btn os-icon-btn', icon: 'pencil', ariaLabel: 'Endre namn på «' + cloud.title + '»', title: 'Endre namn', onClick: () => handlers.onRename(cloud.id) }));
      actions.appendChild(btn({ className: 'btn os-icon-btn', icon: 'copy', ariaLabel: 'Dupliser «' + cloud.title + '»', title: 'Dupliser', onClick: () => handlers.onDuplicate(cloud.id) }));
      actions.appendChild(btn({ className: 'btn os-icon-btn', icon: 'fileJson', ariaLabel: 'Eksporter «' + cloud.title + '» som JSON', title: 'Eksporter JSON', onClick: () => handlers.onExport(cloud.id) }));
      actions.appendChild(btn({ className: 'btn os-icon-btn os-danger', icon: 'trash', ariaLabel: 'Slett «' + cloud.title + '»', title: 'Slett', onClick: () => handlers.onDelete(cloud.id) }));
      row.appendChild(info);
      row.appendChild(actions);
      container.appendChild(row);
    }
  }

  // ---- Modal (Escape lukkar — AGENTS §5.4) ----

  function wireModal(overlay, closeBtn) {
    function close() { overlay.classList.remove('open'); }
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
    return { open: () => overlay.classList.add('open'), close };
  }

  root.OrdskoddeUI = {
    clear, btn,
    renderThemeSwatches, renderShapeButtons, fillFontSelect,
    renderColorInputs, renderWordList, renderSavedList, wireModal
  };
})(window);
