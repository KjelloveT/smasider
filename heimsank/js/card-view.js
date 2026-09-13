// Éin kortkomponent for vifte, samling, premie og detaljar.
const HeimsankCards = (function () {
  function render(card, entry = null, variant = 'collection') {
    const root = Vy.el('article', 'hs-card' + (entry?.foil ? ' hs-foil' : ''));
    root.dataset.rarity = RO.includes(card.rarity) ? card.rarity : 'vanleg';
    root.dataset.category = card.catId;
    root.dataset.variant = variant;
    root.appendChild(Vy.el('div', 'hs-card-title', card.name));
    const tags = Vy.el('div', 'hs-card-tags');
    tags.appendChild(Vy.el('span', 'hs-card-tag', RL[root.dataset.rarity]));
    if (entry?.foil) tags.appendChild(Vy.el('span', 'hs-card-tag', 'Foil'));
    root.appendChild(tags);
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
    root.appendChild(picture);
    const fact = Vy.el('div', 'hs-card-fact');
    fact.append(HeimsankUI.icon(card.statLabel || 'globe', 14), Vy.el('span', '', card.stat || ''));
    root.appendChild(fact);
    if (variant === 'detail') {
      root.appendChild(Vy.el('div', 'hs-card-meta', card.catLabel));
      if (entry?.difficulty) root.appendChild(Vy.el('div', 'hs-card-meta',
        entry.difficulty + ' · ' + (Array.isArray(entry.operations) ? entry.operations.join(' ') : '')));
      if (card.article && /^https?:\/\//.test(card.article)) {
        const link = Vy.el('a', 'hs-card-link', 'Les om →');
        link.href = card.article; link.target = '_blank'; link.rel = 'noopener noreferrer';
        root.appendChild(link);
      }
      // Valfrie felt frå kategori- og krediteringsarbeidet i PR #66.
      if (card.imgAuthor || card.imgLicense || card.imgPage) {
        const credit = Vy.el('div', 'hs-card-credit');
        if (card.imgAuthor) credit.appendChild(Vy.el('span', '', 'Bilete: ' + card.imgAuthor));
        for (const [url, label] of [[card.imgLicenseUrl, card.imgLicense], [card.imgPage, 'Wikimedia Commons']]) {
          if (!label) continue;
          const part = Vy.el(/^https:\/\//.test(url || '') ? 'a' : 'span', '', label);
          if (part.tagName === 'A') { part.href = url; part.target = '_blank'; part.rel = 'noopener noreferrer'; }
          credit.appendChild(part);
        }
        root.appendChild(credit);
      }
    }
    return root;
  }
  return { render };
})();
function mkCard(card, size, entry = null) {
  return HeimsankCards.render(card, entry, size === 'full' ? 'reveal' : 'collection');
}
