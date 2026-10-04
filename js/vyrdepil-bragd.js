/* Felles Bragd-vising og eingongsmigrering. Evalueringa av vilkår høyrer til spelet. */
(function (global) {
  'use strict';

  const scriptUrl = document.currentScript && document.currentScript.src;
  const project = scriptUrl ? new URL('../', scriptUrl) : new URL('./', location.href);
  const BASE_MIGRATION_VERSION = 1;
  const MIGRATION_VERSION = 2;
  const storageApi = typeof VyrdepilStorage !== 'undefined' ? VyrdepilStorage : null;
  let cataloguePromise;

  function sumCollectionEntries(collections) {
    let total = 0;
    Object.keys(collections || {}).forEach(key => {
      if (Array.isArray(collections[key])) total += collections[key].length;
    });
    return total;
  }

  function snapshotLegacyProgress(appId, state) {
    if (appId === 'heimsank') state = state && typeof state === 'object' ? state : {};
    else if (!state || typeof state !== 'object') return null;
    const stats = state.stats || {};
    if (appId === 'heimsank') {
      const collections = storageApi.getAllCollections(appId) || {};
      const collectionCards = sumCollectionEntries(collections);
      const totalCards = Math.max(Number(stats.totalCardsEarned) || 0, collectionCards);
      const hasProgress = totalCards > 0 || (Number(state.points) || 0) > 0 || (Number(stats.totalCorrect) || 0) > 0 || (Array.isArray(state.unlocked) && state.unlocked.length > 0);
      if (!hasProgress) return null;
      const retroPoints = collectionCards * 3;
      const unlocked = Array.isArray(state.unlocked) ? state.unlocked.length : 0;
      const collectedCategories = Object.keys(collections).filter(key => Array.isArray(collections[key]) && collections[key].length > 0).length;
      return {
        points: Number.isFinite(state.points) ? state.points : retroPoints,
        earnedPoints: Number.isFinite(state.earnedTotal) ? state.earnedTotal : retroPoints,
        cardsCollected: totalCards,
        categoriesUnlocked: Math.max(unlocked, collectedCategories),
        correctAnswers: Number(stats.totalCorrect) || 0
      };
    }
    if (appId === 'vidfaren') {
      const snapshot = {
        pointsEarned: Number(state.earnedTotal) || 0,
        correctAnswers: Number(stats.totalCorrect) || 0,
        roundsPlayed: Number(stats.roundsPlayed) || 0,
        bestStreak: Number(stats.bestStreak) || 0,
        perfectRounds: Number(stats.perfectRounds) || 0
      };
      return Object.values(snapshot).some(value => value > 0) ? snapshot : null;
    }
    if (appId === 'tidvis') {
      const xp = Number(state.xp) || 0;
      const completions = Array.isArray(state.levelCompletion) ? state.levelCompletion.slice(0, 4).map(value => Number(value) || 0) : [0, 0, 0, 0];
      const hasProgress = xp > 0 || Number(stats.totalCorrect) > 0 || Number(stats.gamesPlayed) > 0 || Number(stats.bestStreak) > 0 || completions.some(value => value > 0);
      if (!hasProgress) return null;
      const snapshot = {
        level: Math.floor(xp / 200) + 1,
        xp,
        xpIntoLevel: xp % 200,
        correctAnswers: Number(stats.totalCorrect) || 0,
        gamesPlayed: Number(stats.gamesPlayed) || 0,
        bestStreak: Number(stats.bestStreak) || 0,
        levelCompletion: completions
      };
      return snapshot;
    }
    return null;
  }

  function migrateBaseLegacyData() {
    if (!storageApi || typeof storageApi.getBragdData !== 'function') return;
    if (storageApi.getBragdData().migrationVersion >= BASE_MIGRATION_VERSION) return;

    const apps = ['heimsank', 'vidfaren', 'tidvis'];
    const badges = {};
    const progress = {};
    apps.forEach(appId => {
      const state = storageApi.getGameState(appId) || (appId === 'heimsank' ? {} : null);
      if (!state || typeof state !== 'object') return;
      const ids = appId === 'tidvis' ? state.unlocked : state.badges;
      if (Array.isArray(ids)) badges[appId] = ids.filter(id => typeof id === 'string');
      const snapshot = snapshotLegacyProgress(appId, state);
      if (snapshot) progress[appId] = snapshot;
    });
    storageApi.importBragdData({ version: BASE_MIGRATION_VERSION, badges, progress });
  }

  function snapshotLegacyLibraryProgress(appId, moduleCatalogue) {
    const modules = (moduleCatalogue.modular || []).filter(module =>
      module.klar !== false && typeof module.id === 'string' && Number(module.talLeksjonar) > 0
    );
    const moduleById = new Map(modules.map(module => [module.id, module]));
    const completed = new Set();
    const perModule = new Map();
    (storageApi.getCollection(appId, 'framgang') || []).forEach(item => {
      if (!item || item.status !== 'ferdig' || typeof item.modul !== 'string' || typeof item.leksjon !== 'string') return;
      if (!moduleById.has(item.modul)) return;
      const key = item.modul + '\u0000' + item.leksjon;
      if (completed.has(key)) return;
      completed.add(key);
      perModule.set(item.modul, (perModule.get(item.modul) || 0) + 1);
    });

    const totalLessons = modules.reduce((sum, module) => sum + Number(module.talLeksjonar), 0);
    const completedLessons = Math.min(totalLessons, completed.size);
    const modulesCompleted = modules.filter(module =>
      (perModule.get(module.id) || 0) >= Number(module.talLeksjonar)
    ).length;
    return {
      completedLessons,
      totalLessons,
      libraryPercent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0,
      modulesCompleted,
      totalModules: modules.length
    };
  }

  async function migrateLibraryProgress() {
    if (!storageApi || storageApi.getBragdData().migrationVersion >= MIGRATION_VERSION) return;
    const appIds = ['bolkestokk', 'ormritaren'];
    const catalogues = await Promise.all(appIds.map(async appId => {
      const response = await fetch(new URL(appId + '/moduler/index.json', project));
      if (!response.ok) throw new Error('Modulkatalogen kunne ikkje lastast: ' + appId);
      return response.json();
    }));
    const progress = {};
    appIds.forEach((appId, index) => {
      progress[appId] = snapshotLegacyLibraryProgress(appId, catalogues[index]);
    });
    storageApi.importBragdData({ version: MIGRATION_VERSION, progress });
  }

  async function migrateLegacyData() {
    migrateBaseLegacyData();
    await migrateLibraryProgress();
  }

  function loadCatalogue() {
    if (!cataloguePromise) {
      cataloguePromise = Promise.all([
        fetch(new URL('json/bragder.json', project)).then(response => {
          if (!response.ok) throw new Error('Bragdkatalogen kunne ikkje lastast');
          return response.json();
        }),
        fetch(new URL('json/apps.json', project)).then(response => {
          if (!response.ok) throw new Error('Appoversikta kunne ikkje lastast');
          return response.json();
        })
      ]).then(([catalogue, appData]) => ({
        catalogue,
        apps: Object.fromEntries((appData.apps || []).map(app => [app.id, app]))
      })).catch(error => { cataloguePromise = null; throw error; });
    }
    return cataloguePromise;
  }

  function iconMarkup(name, size) {
    return typeof global.ICON === 'function' ? global.ICON(name, size) : '';
  }

  function makeBadgeCard(definition, appId, app, earned) {
    const card = document.createElement('article');
    card.className = 'vp-bragd-card' + (earned ? '' : ' vp-bragd-card--locked');
    card.dataset.family = definition.family || 'saerbragd';

    const emblem = document.createElement('div');
    emblem.className = 'vp-bragd-emblem';
    emblem.setAttribute('aria-hidden', 'true');
    emblem.innerHTML = iconMarkup(definition.icon, 30);
    card.appendChild(emblem);

    const name = document.createElement('h3');
    name.className = 'vp-bragd-name';
    name.textContent = definition.name;
    card.appendChild(name);

    const hint = document.createElement('p');
    hint.className = 'vp-bragd-hint';
    hint.textContent = definition.hint;
    card.appendChild(hint);

    const source = document.createElement('div');
    source.className = 'vp-bragd-source';
    if (app && app.img) {
      const logo = document.createElement('img');
      logo.src = new URL(app.img, project).href;
      logo.alt = '';
      logo.width = 28;
      logo.height = 28;
      logo.loading = 'lazy';
      logo.decoding = 'async';
      source.appendChild(logo);
    }
    const appName = document.createElement('span');
    appName.textContent = app ? app.name : appId;
    source.appendChild(appName);
    card.appendChild(source);

    const status = document.createElement('span');
    status.className = 'vp-bragd-status';
    status.textContent = earned ? 'Oppnådd' : 'Ikkje oppnådd';
    card.appendChild(status);
    return card;
  }

  async function renderGameBadges(host, appId, earnedIds, options) {
    if (!host) return;
    const data = await loadCatalogue();
    const app = data.apps[appId];
    const definitions = data.catalogue.apps[appId] ? data.catalogue.apps[appId].badges : [];
    const earned = new Set(Array.isArray(earnedIds) ? earnedIds : []);
    const onlyEarned = options && options.onlyEarned;
    host.replaceChildren();
    definitions.forEach(definition => {
      const isEarned = earned.has(definition.id);
      if (onlyEarned && !isEarned) return;
      host.appendChild(makeBadgeCard(definition, appId, app, isEarned));
    });
    host.removeAttribute('aria-busy');
  }

  async function renderEarnedBadges(host) {
    if (!host || !storageApi) return;
    await migrationPromise;
    const data = await loadCatalogue();
    const earnedByApp = storageApi.getBragdData().badges || {};
    const familyHost = new Map();
    host.replaceChildren();

    (data.catalogue.families || []).forEach(family => {
      const section = document.createElement('section');
      section.className = 'vp-bragd-family';
      const heading = document.createElement('h2');
      heading.className = 'vp-heading';
      heading.textContent = family.name;
      section.appendChild(heading);
      const grid = document.createElement('div');
      grid.className = 'vp-bragd-grid';
      section.appendChild(grid);
      familyHost.set(family.id, grid);
      host.appendChild(section);
    });

    let total = 0;
    Object.keys(earnedByApp).sort().forEach(appId => {
      const app = data.apps[appId];
      const definitions = data.catalogue.apps[appId] ? data.catalogue.apps[appId].badges : [];
      const byId = new Map(definitions.map(definition => [definition.id, definition]));
      Array.from(new Set(earnedByApp[appId] || [])).sort().forEach(badgeId => {
        const definition = byId.get(badgeId);
        if (!definition) return;
        const grid = familyHost.get(definition.family) || familyHost.get('saerbragd');
        if (grid) grid.appendChild(makeBadgeCard(definition, appId, app, true));
        total++;
      });
    });

    host.querySelectorAll('.vp-bragd-family').forEach(section => {
      if (!section.querySelector('.vp-bragd-card')) section.remove();
    });
    return total;
  }

  const PROGRESS_FIELDS = {
    heimsank: [
      ['points', 'Poeng no'], ['earnedPoints', 'Poeng tente'], ['cardsCollected', 'Kort samla'],
      ['categoriesUnlocked', 'Kategoriar opne'], ['correctAnswers', 'Rette svar']
    ],
    vidfaren: [
      ['pointsEarned', 'Poeng tente'], ['correctAnswers', 'Rette svar'], ['roundsPlayed', 'Rundar spela'],
      ['bestStreak', 'Lengste rekkje'], ['perfectRounds', 'Plettfrie rundar']
    ],
    tidvis: [
      ['level', 'Nivå'], ['xp', 'XP totalt'], ['xpIntoLevel', 'XP i nivået'], ['correctAnswers', 'Rette svar'],
      ['gamesPlayed', 'Økter'], ['bestStreak', 'Lengste rekkje']
    ],
    bolkestokk: [],
    ormritaren: []
  };

  async function renderProgress(host) {
    if (!host || !storageApi) return;
    await migrationPromise;
    const data = await loadCatalogue();
    const snapshots = storageApi.getBragdData().progress || {};
    host.replaceChildren();
    ['heimsank', 'vidfaren', 'tidvis', 'bolkestokk', 'ormritaren'].forEach(appId => {
      const app = data.apps[appId];
      const snapshot = snapshots[appId];
      const card = document.createElement('article');
      card.className = 'vp-panel vp-panel--plain vp-bragd-progress-card';

      const header = document.createElement('header');
      header.className = 'vp-bragd-progress-head';
      if (app && app.img) {
        const logo = document.createElement('img');
        logo.src = new URL(app.img, project).href;
        logo.alt = '';
        logo.width = 44;
        logo.height = 44;
        logo.loading = 'lazy';
        header.appendChild(logo);
      }
      const title = document.createElement('h3');
      title.className = 'vp-heading';
      title.textContent = app ? app.name : appId;
      header.appendChild(title);
      card.appendChild(header);

      if (appId === 'bolkestokk' || appId === 'ormritaren') {
        const library = document.createElement('div');
        library.className = 'vp-bragd-library';
        const percent = snapshot ? Math.max(0, Math.min(100, Number(snapshot.libraryPercent) || 0)) : 0;
        const meter = document.createElement('div');
        meter.className = 'vp-bragd-library-meter';
        meter.setAttribute('role', 'progressbar');
        meter.setAttribute('aria-label', app.name + ': framgang i biblioteket');
        meter.setAttribute('aria-valuemin', '0');
        meter.setAttribute('aria-valuemax', '100');
        meter.setAttribute('aria-valuenow', String(percent));
        const fill = document.createElement('span');
        fill.style.width = percent + '%';
        meter.appendChild(fill);
        library.appendChild(meter);

        const text = document.createElement('p');
        text.className = 'vp-bragd-library-text';
        text.textContent = snapshot
          ? percent + '% av biblioteket · ' + snapshot.completedLessons + ' av ' + snapshot.totalLessons + ' leksjonar'
          : 'Biblioteksframgangen kunne ikkje lastast enno.';
        library.appendChild(text);
        card.appendChild(library);
      }

      if (!snapshot) {
        const empty = document.createElement('p');
        empty.textContent = 'Ingen framgang lagra enno.';
        card.appendChild(empty);
      } else {
        const list = document.createElement('dl');
        list.className = 'vp-bragd-progress-list';
        (PROGRESS_FIELDS[appId] || []).forEach(([key, label]) => {
          if (snapshot[key] == null) return;
          const row = document.createElement('div');
          const term = document.createElement('dt');
          term.textContent = label;
          const value = document.createElement('dd');
          value.textContent = String(snapshot[key]);
          row.append(term, value);
          list.appendChild(row);
        });
        if (appId === 'tidvis' && Array.isArray(snapshot.levelCompletion)) {
          const row = document.createElement('div');
          const term = document.createElement('dt');
          term.textContent = 'Nivåframgang';
          const value = document.createElement('dd');
          value.textContent = snapshot.levelCompletion.slice(0, 4).map((count, index) => 'N' + (index + 1) + ' ' + count + '/5').join(' · ');
          row.append(term, value);
          list.appendChild(row);
        }
        card.appendChild(list);
      }
      if (app && app.href) {
        const link = document.createElement('a');
        link.className = 'vp-button vp-button--compact vp-bragd-play-link';
        link.href = new URL(app.href, project).href;
        link.textContent = 'Opne ' + app.name;
        card.appendChild(link);
      }
      host.appendChild(card);
    });
  }

  function recordBadges(appId, badges) {
    if (!storageApi || !Array.isArray(badges)) return;
    badges.forEach(badge => {
      const id = typeof badge === 'string' ? badge : badge && badge.id;
      if (id) storageApi.recordBadge(appId, id);
    });
  }

  const migrationPromise = migrateLegacyData().catch(error => {
    console.error('Bragd-migreringa kunne ikkje fullførast:', error);
  });

  global.VyrdepilBragd = {
    loadCatalogue,
    migrationPromise,
    renderGameBadges,
    renderEarnedBadges,
    renderProgress,
    recordBadges
  };
})(window);
