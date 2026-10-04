/* Felles appmeny. json/apps.json er framleis den einaste appkatalogen. */
(function (global) {
  'use strict';

  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  const project = new URL('../', scriptUrl);
  const search = document.getElementById('menuSearch');
  const filters = document.getElementById('menuCategories');
  const content = document.getElementById('menuApps');
  const count = document.getElementById('menuCount');
  if (!search || !filters || !content || !count) return;

  const moreLinks = document.createElement('nav');
  moreLinks.className = 'vp-menu-more vp-actions';
  moreLinks.setAttribute('aria-label', 'Meir om Vyrdepil');
  const bragdLink = document.createElement('a');
  bragdLink.href = new URL('merke.html', project).href;
  bragdLink.textContent = 'Sjå alle bragdane dine';
  moreLinks.append(bragdLink);
  content.closest('dialog')?.append(moreLinks);

  const entries = [];
  const groups = [];
  let selectedCategory = 'all';

  function update() {
    const words = search.value.trim().toLocaleLowerCase('nn').split(/\s+/).filter(Boolean);
    let visible = 0;
    entries.forEach(entry => {
      const matches = (selectedCategory === 'all' || entry.category === selectedCategory) &&
        words.every(word => entry.searchText.includes(word));
      entry.link.hidden = !matches;
      if (matches) visible++;
    });
    groups.forEach(group => {
      group.section.hidden = !entries.some(entry => entry.category === group.id && !entry.link.hidden);
    });
    filters.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory));
    });
    count.textContent = visible
      ? `${visible} ${visible === 1 ? 'app' : 'appar'}`
      : 'Ingen treff. Prøv eit anna søkjeord eller vel «Alle».';
  }

  function addFilter(id, label) {
    const button = global.Vy.el('button', 'vp-button vp-button--quiet vp-button--compact', label);
    button.type = 'button';
    button.dataset.category = id;
    button.setAttribute('aria-pressed', String(id === selectedCategory));
    button.addEventListener('click', () => {
      selectedCategory = id;
      update();
    });
    filters.append(button);
  }

  fetch(new URL('json/apps.json', project))
    .then(response => {
      if (!response.ok) throw new Error('Appmanifesten kunne ikkje lastast');
      return response.json();
    })
    .then(async data => {
      const design = await global.VyrdepilDesign.loadRegistry();
      const apps = (data.apps || []).filter(app => !app.hidden && !app.disabled && app.href);
      addFilter('all', 'Alle');
      (data.categories || []).forEach(category => {
        const items = apps.filter(app => app.cat === category.id);
        if (!items.length) return;
        addFilter(category.id, category.menuLabel || category.label);

        const section = global.Vy.el('section', 'vp-menu-category');
        const heading = global.Vy.el('h3', 'vp-heading', category.menuLabel || category.label);
        heading.id = `menu-category-${category.id}`;
        section.setAttribute('aria-labelledby', heading.id);
        const grid = global.Vy.el('div', 'vp-menu-app-grid');

        items.forEach(app => {
          const link = global.Vy.el('a', 'vp-menu-app');
          link.href = new URL(app.href, project).href;
          const image = document.createElement('img');
          image.src = new URL(design.logo.files[app.id] || app.img, project).href;
          image.alt = '';
          image.width = 72;
          image.height = 72;
          image.loading = 'lazy';
          image.decoding = 'async';
          link.append(image, global.Vy.el('strong', '', app.name));
          grid.append(link);
          entries.push({
            link,
            category: category.id,
            searchText: [app.name, ...(app.desc || [])].join(' ').toLocaleLowerCase('nn')
          });
        });

        section.append(heading, grid);
        content.append(section);
        groups.push({ id: category.id, section });
      });
      global.VyrdepilDesign.initSelections(filters);
      update();
    })
    .catch(() => {
      count.textContent = 'Appoversikta kunne ikkje lastast. Last sida på nytt for å prøve igjen.';
    });

  search.addEventListener('input', update);
})(window);
