/* Felles skal for migrerte Vyrdepil-appar. Katalogen og designregisteret er framleis kjeldene. */
(function (global) {
  'use strict';
  const script = document.currentScript;
  if (!script || !document.body) return;
  const project = new URL('../', script.src);
  const body = document.body;
  const appId = body.dataset.vpApp;
  const isHome = body.dataset.vpHome === 'true';
  if (!appId && !isHome) return;

  const protectedApps = new Set(['heimsank', 'bolkestokk']);
  const preserveDesign = protectedApps.has(appId);
  if (isHome) body.classList.add('vp-home-page');
  else body.classList.add('vp-migrated-page');
  if (preserveDesign) body.setAttribute('data-vp-preserve', '');
  if (!preserveDesign) {
    body.classList.add('vp-page');
    body.setAttribute('data-vp-design', '');
    body.removeAttribute('data-theme');
    body.removeAttribute('data-light-theme');
    body.removeAttribute('data-dark-theme');
  }
  document.querySelectorAll('neo-header').forEach(node => node.remove());

  const header = document.createElement('header');
  header.className = 'vp-header vp-header--sky vp-migrated-header';
  header.setAttribute('data-vp-design', '');
  header.innerHTML = '<div class="vp-shell vp-shell--wide vp-header-row">' +
    '<a class="vp-brand" href="' + new URL('index.html', project).href + '">' +
    '<img src="' + new URL('_resources/vyrdepil-design/vyrde.png', project).href + '" width="48" height="46" alt="">Vyrdepil</a>' +
    '<button class="vp-button vp-menu-trigger" id="vpMenuTrigger" type="button" data-vp-menu="siteMenu" aria-haspopup="dialog" aria-expanded="false" aria-controls="siteMenu">' +
    '<span data-icon="menu" aria-hidden="true"></span>Meny</button></div>';
  const menu = document.createElement('dialog');
  menu.className = 'vp-dialog vp-site-menu vp-migrated-menu';
  menu.setAttribute('data-vp-design', '');
  menu.id = 'siteMenu';
  menu.setAttribute('aria-labelledby', 'siteMenuTitle');
  menu.innerHTML = '<div class="vp-dialog-head"><div class="vp-menu-heading">' +
    '<img src="' + new URL('_resources/vyrdepil-design/vyrde.png', project).href + '" width="112" height="107" alt="">' +
    '<h2 class="vp-heading" id="siteMenuTitle">Vyrdepil</h2></div>' +
    '<form method="dialog"><button class="vp-button vp-button--icon vp-button--quiet" aria-label="Lukk menyen"><span data-icon="x" aria-hidden="true"></span></button></form></div>' +
    '<p class="vp-small">Spel, verktøy og skaparglede</p>' +
    '<label class="vp-field vp-menu-search"><span class="vp-label">Finn eit spel eller verktøy</span>' +
    '<input class="vp-input" id="menuSearch" type="search" placeholder="Søk etter namn eller innhald" aria-controls="menuApps"></label>' +
    '<div class="vp-actions vp-menu-filters" id="menuCategories" role="group" aria-label="Appkategori"></div>' +
    '<p class="vp-small vp-menu-count" id="menuCount" aria-live="polite">Lastar appoversikta …</p>' +
    '<nav id="menuApps" aria-label="Spel og verktøy"></nav>';
  body.insertBefore(menu, body.firstChild);
  body.insertBefore(header, body.firstChild);
  header.querySelector('.vp-brand img').dataset.vpMascot = '';
  menu.querySelector('.vp-menu-heading img').dataset.vpMascot = '';

  const semanticMain = document.querySelector('main');
  const main = semanticMain || document.getElementById('main');
  if (main) {
    if (!main.id) main.id = 'main';
    if (isHome) main.classList.add('vp-home-main');
    else main.classList.add('vp-migrated-main');
    if (body.dataset.vpLayout === 'expanded') main.classList.add('vp-migrated-main--wide');
    if (body.dataset.vpLayout === 'canvas') main.classList.add('vp-migrated-main--canvas');
    const skip = document.createElement('a');
    skip.className = 'vp-skip';
    skip.href = '#' + main.id;
    skip.textContent = 'Hopp til innhaldet';
    body.insertBefore(skip, menu);
  }

  if (isHome) {
    (async () => {
      try {
        const registry = global.VyrdepilDesign && await global.VyrdepilDesign.loadRegistry();
        const backgroundId = registry && registry.home && registry.home.backgroundId;
        const background = registry && registry.backgrounds.find(item => item.id === backgroundId);
        if (background) body.style.setProperty('--vp-landscape', `url("${new URL(background.file, project).href}")`);
      } catch (error) {
        console.error('Klarte ikkje laste landskapet til framsida:', error);
      }
      if (global.VyrdepilIcons && global.VyrdepilIcons.hydrateIcons) global.VyrdepilIcons.hydrateIcons(document);
    })();
    return;
  }

  function isVisible(element) {
    return !!element && !element.hidden && !element.closest('[hidden], .dv-hidden, .is-hidden');
  }
  function findHero(root) {
    // Canvas-spel har ofte ein startmeny med val og knappar inne i sjølve
    // spelruta. Han skal ikkje flyttast inn i intro-skiltet.
    if (body.dataset.vpLayout === 'canvas') return null;
    const heading = Array.from(root.querySelectorAll('h1')).find(isVisible);
    if (!heading) return null;
    const hero = heading.closest('.hero-box, .hero, .hb-hero, .bf-hero, .lk-hero, .menu-card, #start-screen');
    return hero || null;
  }
  function addAppIntro(app, logoPath) {
    if (protectedApps.has(appId)) return;
    const root = main || document.body;
    const hero = findHero(root);
    const stage = document.createElement('div');
    stage.className = 'vp-migrated-intro';
    const board = document.createElement('section');
    board.className = 'vp-app-intro-board vp-panel vp-panel--plain vp-migrated-intro-board';
    if (hero) {
      const existingLogo = hero.querySelector('img');
      if (existingLogo) {
        hero.classList.add('vp-migrated-hero--has-logo');
        existingLogo.dataset.vpAppLogo = '';
        existingLogo.classList.add('vp-migrated-logo');
      } else {
        hero.classList.add('vp-migrated-hero--copy');
        const logo = document.createElement('img');
        logo.className = 'vp-app-logo vp-migrated-logo';
        logo.dataset.vpAppLogo = '';
        logo.alt = '';
        logo.width = 384;
        logo.height = 384;
        logo.src = new URL(logoPath || app.img, project).href;
        board.append(logo);
      }
      hero.classList.add('vp-migrated-hero');
      board.append(hero);
    } else {
      const logo = document.createElement('img');
      logo.className = 'vp-app-logo vp-migrated-logo';
      logo.dataset.vpAppLogo = '';
      logo.alt = '';
      logo.width = 384;
      logo.height = 384;
      logo.src = new URL(logoPath || app.img, project).href;
      const copy = document.createElement('div');
      copy.className = 'vp-app-intro-copy';
      const title = document.createElement('h1');
      title.className = 'vp-title';
      title.textContent = app.name;
      const summary = document.createElement('p');
      summary.className = 'vp-prose';
      summary.textContent = (app.desc || [])[0] || 'Spel og skaparglede.';
      copy.append(title, summary);
      board.append(logo, copy);
    }
    const mascot = document.createElement('img');
    mascot.className = 'vp-app-intro-mascot vp-migrated-mascot';
    mascot.dataset.vpMascot = '';
    mascot.src = new URL('_resources/vyrdepil-design/vyrde.png', project).href;
    mascot.alt = '';
    mascot.width = 192;
    mascot.height = 192;
    mascot.decoding = 'async';
    stage.append(board, mascot);
    if (semanticMain) semanticMain.insertBefore(stage, semanticMain.firstChild);
    else if (main) {
      const toolbar = main.parentElement && main.parentElement.querySelector('#toolbar');
      const anchor = toolbar && toolbar.parentElement === main.parentElement ? toolbar : main;
      main.parentElement.insertBefore(stage, anchor);
    } else body.insertBefore(stage, menu);
  }

  fetch(new URL('json/apps.json', project)).then(response => response.json()).then(async data => {
    const app = (data.apps || []).find(item => item.id === appId);
    if (!app) return;
    const registry = global.VyrdepilDesign ? await global.VyrdepilDesign.loadRegistry() : null;
    const logo = registry && registry.logo && registry.logo.files[appId];
    addAppIntro(app, logo);
    if (global.VyrdepilDesign) {
      await global.VyrdepilDesign.applyIdentity(appId, body);
      global.VyrdepilDesign.decorate(body);
    }
    if (global.VyrdepilIcons && global.VyrdepilIcons.hydrateIcons) global.VyrdepilIcons.hydrateIcons(document);
  }).catch(error => console.error('Klarte ikkje laste den felles appidentiteten:', error));
})(window);
