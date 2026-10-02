/* Felles Vyrdepil-sidefot. Slå han på med data-vp-site-footer på body. */
(function () {
  'use strict';

  const script = document.currentScript;
  if (!script || !document.body) return;
  const project = new URL('../', script.src);

  function makeLink(path, label) {
    const link = document.createElement('a');
    link.href = new URL(path, project).href;
    link.textContent = label;
    return link;
  }

  function mountFooter() {
    const body = document.body;
    if (!body.hasAttribute('data-vp-site-footer')) return;
    const previousFooter = body.querySelector('footer.vp-site-footer');

    const footer = document.createElement('footer');
    footer.className = 'vp-site-footer vp-site-footer--full';
    footer.setAttribute('data-vp-design', '');
    footer.setAttribute('aria-label', 'Informasjon om Vyrdepil');

    const content = document.createElement('div');
    content.className = 'vp-site-footer__inner';

    const description = document.createElement('p');
    description.textContent = 'Laga for grunnskulen — open kjeldekode, ingen sporing. Nettsida er eit hobbyprosjekt laga og drifta av Kjellove Bjørge. Det er ingen garantiar for oppetid, og endringar kan kome utan førehandsvarsel.';

    const links = document.createElement('nav');
    links.className = 'footer-links';
    links.setAttribute('aria-label', 'Nyttige lenkjer');
    const destinations = [
      ['endringar.html', 'Endringar'],
      ['personvern.html', 'Personvernerklæring'],
      ['lisens.html', 'Lisens']
    ];
    destinations.forEach(([path, label], index) => {
      if (index) links.append(document.createTextNode(' · '));
      links.append(makeLink(path, label));
    });

    content.append(description, links);
    footer.append(content);

    const main = document.querySelector('main');
    const pageWrapper = main && main.closest('.page-wrapper');
    if (previousFooter) {
      previousFooter.replaceWith(footer);
      return;
    }
    const anchor = pageWrapper || main;
    if (anchor && anchor.parentElement) anchor.insertAdjacentElement('afterend', footer);
    else body.append(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFooter, { once: true });
  } else {
    mountFooter();
  }
})();
