(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const count = document.getElementById('bragdCount');
    const earnedHost = document.getElementById('bragdGrid');
    const empty = document.getElementById('bragdEmpty');
    const progressHost = document.getElementById('bragdProgress');
    try {
      const total = await VyrdepilBragd.renderEarnedBadges(earnedHost);
      await VyrdepilBragd.renderProgress(progressHost);
      count.textContent = total === 1 ? '1 oppnådd bragd' : total + ' oppnådde bragder';
      empty.hidden = total > 0;
      earnedHost.setAttribute('aria-busy', 'false');
      progressHost.setAttribute('aria-busy', 'false');
    } catch (error) {
      count.textContent = 'Samlinga kunne ikkje lastast. Last sida på nytt for å prøve igjen.';
      earnedHost.removeAttribute('aria-busy');
      progressHost.removeAttribute('aria-busy');
      console.error('Bragd-sida kunne ikkje byggjast:', error);
    }
  });
})();
