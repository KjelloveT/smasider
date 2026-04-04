// Heimsank - Collection Viewer (All Categories)

/**
 * Open the collection viewer modal showing all cards from all categories
 */
async function openCollectionViewer() {
  const modal = document.getElementById('collectionModal');
  const grid = document.getElementById('collectionGrid');
  
  grid.innerHTML = '<div class="collection-empty"><div class="collection-empty-icon">⏳</div>Lastar samlingane…</div>';
  modal.classList.remove('hidden');
  
  try {
    // Load all categories
    const cats = await fetch('./kort/categories.json').then(r => r.json());
    
    // Load collections and card data for each category
    const allCollections = await Promise.all(cats.map(async (cat) => {
      const storageKey = `heimsank_samling_${cat.id}`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { cat, entries: [], cards: [] };
      
      const entries = JSON.parse(stored);
      if (entries.length === 0) return { cat, entries: [], cards: [] };
      
      // Load card data for this category
      const [csv, rar] = await Promise.all([
        fetch(`./kort/${cat.csv}`).then(r => r.text()),
        fetch(`./kort/${cat.rarity}`).then(r => r.json())
      ]);
      
      const idF = cat.idField || 'scientist';
      const nameF = cat.nameField || 'scientistLabel';
      const imgF = cat.imageField || 'image';
      const statF = cat.statField || 'birthDate';
      const statT = cat.statType || 'year';
      const statLbl = cat.statLabel || '📅';
      
      const allCards = parseCSV(csv)
        .filter(r => r[imgF] && r[imgF].trim())
        .map(r => {
          const id = r[idF].replace('http://www.wikidata.org/entity/', '');
          let stat = '?';
          if (statT === 'year') stat = r[statF] ? r[statF].slice(0, 4) : '?';
          else if (statT === 'number') {
            const n = parseInt(r[statF], 10);
            stat = isNaN(n) ? '?' : n.toLocaleString('nb-NO');
          } else stat = r[statF] || '?';
          return { 
            id, 
            name: r[nameF] || id, 
            stat, 
            statLabel: statLbl, 
            img: r[imgF].replace(/^http:/, 'https:'), 
            rarity: rar[id] || 'vanleg' 
          };
        });
      
      // Match entries with card data
      const cards = entries.map(entry => {
        const card = allCards.find(c => c.id === entry.cardId);
        return card ? { ...card, entry } : null;
      }).filter(Boolean);
      
      return { cat, entries, cards };
    }));
    
    // Filter out empty collections
    const nonEmpty = allCollections.filter(c => c.cards.length > 0);
    
    if (nonEmpty.length === 0) {
      grid.innerHTML = '<div class="collection-empty"><div class="collection-empty-icon">🃏</div><div class="collection-empty-text">Du har ingen kort i samlinga enno.<br>Spel og svar rett for å samle kort!</div></div>';
      return;
    }
    
    // Clear loading message before rendering
    grid.innerHTML = '';
    
    // Render collections as horizontal rows by category
    const container = document.createElement('div');
    container.className = 'collection-categories';
    
    nonEmpty.forEach(({ cat, cards }) => {
      const row = document.createElement('div');
      row.className = 'collection-cat-row';
      
      // Category header with icon and count
      const header = document.createElement('div');
      header.className = 'collection-cat-header';
      header.innerHTML = `
        <span class="collection-cat-icon">${cat.icon}</span>
        <h3 class="collection-cat-title">${cat.label}</h3>
        <span class="collection-cat-count">${cards.length} kort</span>
      `;
      row.appendChild(header);
      
      // Horizontal scrolling card row
      const cardsRow = document.createElement('div');
      cardsRow.className = 'collection-cards-row';
      
      cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `collection-card-mini ${card.rarity}`;
        
        const imgBg = card.rarity === 'sjeldgjevt' ? '#00F5D4'
          : card.rarity === 'segngjeten' ? '#C4A1FF'
          : card.rarity === 'gudebore' ? '#FFBE0B'
          : '#f0f0f0';
        
        cardEl.innerHTML = `
          <div class="mini-header">
            <span class="mini-name">${esc(card.name)}</span>
            <span class="mini-rarity">${RL[card.rarity]}</span>
          </div>
          <div class="mini-img" style="background:${imgBg}">
            <img src="${card.img}" alt="${card.name}" loading="lazy" onerror="this.parentNode.innerHTML='<div style=display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:2rem;opacity:.2>${cat.icon}</div>'">
          </div>
          <div class="mini-footer">${card.statLabel} ${card.stat}</div>
        `;
        
        cardsRow.appendChild(cardEl);
      });
      
      row.appendChild(cardsRow);
      container.appendChild(row);
    });
    
    grid.appendChild(container);
    
  } catch (e) {
    console.error('Collection viewer error:', e);
    grid.innerHTML = '<div class="collection-empty"><div class="collection-empty-icon">⚠️</div><div class="collection-empty-text">Feil ved lasting: ' + e.message + '<br>Prøv igjen seinare.</div></div>';
  }
}

/**
 * Close the collection viewer modal
 */
function closeCollectionModal() {
  document.getElementById('collectionModal').classList.add('hidden');
}

// Export functions for global access
window.openCollectionViewer = openCollectionViewer;
window.closeCollectionModal = closeCollectionModal;
