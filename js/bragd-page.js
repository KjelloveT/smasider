(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const count = document.getElementById('bragdCount');
    const catalogueHost = document.getElementById('bragdGrid');
    const empty = document.getElementById('bragdEmpty');
    const progressHost = document.getElementById('bragdProgress');
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
