// Heimsank - Shared card-data loading + cover selection
// Samlar CSV+rarity -> kort-mapping som tidlegare var duplisert i
// game.js (loadCards), collection.js og showcase.js.

const CardData = (function () {
  // Rarest -> commonest, for deterministisk val av forside-kort
  const RARITY_RARE_FIRST = ['gudebore', 'segngjeten', 'sjeldgjevt', 'vanleg'];

  // Cache per kategori-id slik at CSV-ane berre lastast éin gong
  // (showcase, forsider og spelstart deler same data).
  const cache = {};

  function _load(cat) {
    return Promise.all([
      fetch(`./kort/${cat.csv}`).then(r => r.text()),
      fetch(`./kort/${cat.rarity}`).then(r => r.json())
    ]).then(([csv, rar]) => {
      const idF = cat.idField || 'scientist';
      const nameF = cat.nameField || 'scientistLabel';
      const imgF = cat.imageField || 'image';
      const artF = cat.articleField || 'article';
      const statF = cat.statField || 'birthDate';
      const statT = cat.statType || 'year';
      const statLbl = cat.statLabel || 'calendar';

      return parseCSV(csv)
        .filter(r => r[imgF] && r[imgF].trim())
        .map(r => {
          const id = r[idF].replace('http://www.wikidata.org/entity/', '');
          let stat = '?';
          if (statT === 'year') {
            stat = r[statF] ? r[statF].slice(0, 4) : '?';
          } else if (statT === 'number') {
            const n = parseInt(r[statF], 10);
            stat = isNaN(n) ? '?' : n.toLocaleString('nn-NO');
          } else {
            stat = r[statF] || '?';
          }
          return {
            id,
            name: r[nameF] || id,
            stat,
            statLabel: statLbl,
            img: r[imgF].replace(/^http:/, 'https:'),
            article: r[artF] || '',
            rarity: rar[id] || 'vanleg',
            catId: cat.id,
            catLabel: cat.label,
            catIcon: cat.icon
          };
        });
    });
  }

  /**
   * Load (and cache) the card array for a category.
   * @param {Object} cat - category object from categories.json
   * @returns {Promise<Array>} cards
   */
  function loadCategoryCards(cat) {
    if (!cache[cat.id]) cache[cat.id] = _load(cat);
    return cache[cat.id];
  }

  /**
   * Pick a deterministic representative card for a category cover:
   * rarest non-empty tier, then the stable first card by id.
   * @param {Array} cards
   * @returns {Object|null}
   */
  function pickCoverCard(cards) {
    if (!cards || cards.length === 0) return null;
    for (const rarity of RARITY_RARE_FIRST) {
      const pool = cards.filter(c => c.rarity === rarity);
      if (pool.length > 0) {
        pool.sort((a, b) => a.id.localeCompare(b.id));
        return pool[0];
      }
    }
    return cards[0];
  }

  return { loadCategoryCards, pickCoverCard };
})();

if (typeof window !== 'undefined') window.CardData = CardData;
