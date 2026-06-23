/* ══════════════════════════════════════════════
   VYRDEPIL — Framsida byggjer spel/verktøy-grids
   frå json/apps.json (same kjelde som toppmenyen).
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  function svg(inner, size) {
    return `<svg width="${size}" height="${size}" style="vertical-align:-5px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  }

  function card(app) {
    const el = document.createElement(app.disabled ? 'div' : 'a');
    el.className = 'card' + (app.disabled ? ' disabled' : '');
    if (!app.disabled && app.href) el.href = app.href;

    if (app.img) {
      const img = document.createElement('img');
      img.src = app.img;
      img.alt = app.name;
      el.appendChild(img);
    } else if (app.icon) {
      const span = document.createElement('span');
      span.className = 'card-icon';
      span.innerHTML = svg(app.icon, 48).replace(' style="vertical-align:-5px;"', '');
      el.appendChild(span);
    }

    const h = document.createElement('h2');
    h.className = 'card-title';
    h.textContent = app.name;
    el.appendChild(h);

    (app.desc || []).forEach(d => {
      const p = document.createElement('p');
      p.className = 'card-desc';
      p.textContent = d;
      el.appendChild(p);
    });

    const tag = document.createElement('span');
    if (app.disabled) {
      tag.className = 'coming-tag';
      tag.textContent = app.comingTag || 'Kjem snart';
    } else {
      tag.className = 'card-btn';
      tag.textContent = app.btn || 'Opne →';
    }
    el.appendChild(tag);
    return el;
  }

  fetch('json/apps.json')
    .then(r => r.json())
    .then(data => {
      const host = document.getElementById('appSections');
      if (!host) return;
      (data.categories || []).forEach(cat => {
        const apps = (data.apps || []).filter(a => a.cat === cat.id);
        if (!apps.length) return;
        const h2 = document.createElement('h2');
        h2.className = 'heading2';
        h2.innerHTML = svg(cat.icon, 28) + ' ' + cat.label;
        host.appendChild(h2);
        const grid = document.createElement('div');
        grid.className = 'card-grid';
        apps.forEach(a => grid.appendChild(card(a)));
        host.appendChild(grid);
      });
    })
    .catch(e => console.error('Klarte ikkje laste json/apps.json:', e));
})();
