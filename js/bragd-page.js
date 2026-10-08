(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const count = document.getElementById('bragdCount');
    const catalogueHost = document.getElementById('bragdGrid');
    const empty = document.getElementById('bragdEmpty');
    const progressHost = document.getElementById('bragdProgress');
    const dialog = document.getElementById('bragdDialog');
    const closeButton = document.getElementById('bragdDialogClose');
    const dialogTitle = document.getElementById('bragdDialogTitle');
    const dialogHint = document.getElementById('bragdDialogHint');
    const dialogArt = document.getElementById('bragdDialogArt');
    const dialogSource = document.getElementById('bragdDialogSource');
    const dialogStatus = document.getElementById('bragdDialogStatus');

    catalogueHost.addEventListener('click', function (event) {
      const card = event.target.closest('.vp-bragd-card--compact');
      if (!card || !catalogueHost.contains(card) || !dialog) return;

      dialogTitle.textContent = card.dataset.bragdName || '';
      dialogHint.textContent = card.dataset.bragdHint || '';
      dialogArt.replaceChildren(card.querySelector('.vp-bragd-emblem').cloneNode(true));
      dialogSource.replaceChildren();
      if (card.dataset.appImg) {
        const logo = document.createElement('img');
        logo.src = new URL(card.dataset.appImg, document.baseURI).href;
        logo.alt = '';
        logo.width = 36;
        logo.height = 36;
        logo.decoding = 'async';
        dialogSource.appendChild(logo);
      }
      const appName = document.createElement('span');
      appName.textContent = card.dataset.appName || card.dataset.appId || '';
      dialogSource.appendChild(appName);
      const earned = card.dataset.earned === 'true';
      dialogArt.classList.toggle('vp-bragd-dialog-art--locked', !earned);
      dialogStatus.textContent = earned ? 'Oppnådd' : 'Ikkje oppnådd enno';
      dialogStatus.classList.toggle('vp-bragd-dialog-status--earned', earned);
      Vy.openModal(dialog);
    });

    closeButton.addEventListener('click', function () { Vy.closeModal(dialog); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) Vy.closeModal(dialog);
    });

    try {
      const totals = await VyrdepilBragd.renderBadgeCatalogue(catalogueHost);
      await VyrdepilBragd.renderProgress(progressHost);
      count.textContent = 'Du har oppnådd ' + totals.earned + ' av ' + totals.total + ' bragder.';
      empty.hidden = totals.earned > 0;
      catalogueHost.setAttribute('aria-busy', 'false');
      progressHost.setAttribute('aria-busy', 'false');
    } catch (error) {
      count.textContent = 'Bragdlista kunne ikkje lastast. Last sida på nytt for å prøve igjen.';
      catalogueHost.removeAttribute('aria-busy');
      progressHost.removeAttribute('aria-busy');
      console.error('Bragd-sida kunne ikkje byggjast:', error);
    }
  });
})();
