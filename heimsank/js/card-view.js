// Éin kortkomponent for vifte, samling, premie og detaljar.
const HeimsankCards = (function () {
  function render(card, entry = null, variant = 'collection') {
    const root = Vy.el('article', 'hs-card' + (entry?.foil ? ' hs-foil' : ''));
    root.dataset.rarity = RO.includes(card.rarity) ? card.rarity : 'vanleg';
    root.dataset.category = card.catId;
    root.dataset.variant = variant;
    // Kortflata er identisk i alle visingar; knappar og kjelder høyrer utanfor.
    const face = Vy.el('div', 'hs-card-face');
    const title = Vy.el('div', 'hs-card-title', card.name);
    title.dataset.length = card.name.length > 42 ? 'long' : card.name.length > 25 ? 'medium' : 'short';
    face.appendChild(title);
    const tags = Vy.el('div', 'hs-card-tags');
    tags.appendChild(Vy.el('span', 'hs-card-tag', RL[root.dataset.rarity]));
    if (entry?.foil) tags.appendChild(Vy.el('span', 'hs-card-tag', 'Foil'));
    face.appendChild(tags);
    const picture = Vy.el('div', 'hs-card-image');
    // Fallback ligg under biletet og verkar òg medan det lastar.
    const fallback = HeimsankUI.icon(HeimsankUI.categoryIcon(card.catId), 40);
    fallback.setAttribute('aria-hidden', 'true');
    picture.appendChild(fallback);
    const img = document.createElement('img');
    img.src = card.img;
    img.alt = card.name;
    img.loading = variant === 'showcase' || variant === 'reveal' ? 'eager' : 'lazy';
    img.addEventListener('error', () => {
      img.remove();
      picture.setAttribute('role', 'img');
      picture.setAttribute('aria-label', 'Bilete ikkje tilgjengeleg: ' + card.name);
    }, { once: true });
    picture.appendChild(img);
    face.appendChild(picture);
    const fact = Vy.el('div', 'hs-card-fact');
    fact.append(HeimsankUI.icon(card.statLabel || 'globe', 14), Vy.el('span', '', card.stat || ''));
    face.appendChild(fact);
    const category = Vy.el('div', 'hs-card-category');
    category.append(HeimsankUI.icon(HeimsankUI.categoryIcon(card.catId), 16), Vy.el('span', '', card.catLabel));
    face.appendChild(category);
    const meta = Vy.el('div', 'hs-card-meta');
    meta.appendChild(Vy.el('span', 'hs-card-level', entry?.difficulty || (entry ? 'Ukjend nivå' : 'Ikkje opptent')));
    meta.appendChild(Vy.el('span', 'hs-card-operations', Array.isArray(entry?.operations) ? entry.operations.join(' ') : '—'));
    face.appendChild(meta);
    root.appendChild(face);
    if (variant !== 'collection' && ['segngjeten', 'gudebore'].includes(root.dataset.rarity)) {
      HeimsankFlames.attach(face, root.dataset.rarity);
    }
    return root;
  }
  function details(card) {
    const extra = Vy.el('div', 'hs-card-details');
      if (card.article && /^https?:\/\//.test(card.article)) {
        const link = Vy.el('a', 'hs-card-link', 'Les om →');
        link.href = card.article; link.target = '_blank'; link.rel = 'noopener noreferrer';
        extra.appendChild(link);
      }
      // Kreditering frå kortdata, bygd med DOM slik at namn er rein tekst.
      if (card.imgAuthor || card.imgLicense || card.imgPage) {
        const credit = Vy.el('div', 'hs-card-credit');
        if (card.imgAuthor) credit.appendChild(Vy.el('span', '', 'Bilete: ' + card.imgAuthor));
        for (const [url, label] of [[card.imgLicenseUrl, card.imgLicense], [card.imgPage, 'Wikimedia Commons']]) {
          if (!label) continue;
          const part = Vy.el(/^https:\/\//.test(url || '') ? 'a' : 'span', '', label);
          if (part.tagName === 'A') { part.href = url; part.target = '_blank'; part.rel = 'noopener noreferrer'; }
          credit.appendChild(part);
        }
        extra.appendChild(credit);
      }
    return extra;
  }
  function makeClickable(root, card, onOpen) {
    const face = root.querySelector('.hs-card-face');
    if (!face) return root;
    face.classList.add('hs-card-clickable');
    face.tabIndex = 0;
    face.setAttribute('role', 'button');
    face.setAttribute('aria-label', 'Sjå ' + card.name);
    face.addEventListener('click', onOpen);
    face.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); onOpen();
    });
    return root;
  }
  return { render, details, makeClickable };
})();
function mkCard(card, size, entry = null) {
  return HeimsankCards.render(card, entry, size === 'full' ? 'reveal' : 'collection');
}
