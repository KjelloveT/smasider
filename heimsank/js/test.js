// Heimsank - Test Page Functions

let currentTestCards = [];

/**
 * Open foil effects test page
 */
async function openFoilTest() {
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('cardTestScreen').classList.remove('hidden');

  const grid = document.getElementById('cardTestGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#555">Lastar foil-effektar…</div>';

  // Define all foil effects
  const foilEffects = [
    { name: 'Cosmos', image: 'cosmos-bottom.png' },
    { name: 'Galaxy', image: 'galaxy-source.png' },
    { name: 'Ancient', image: 'ancient.png' },
    { name: 'Angular', image: 'angular.png' },
    { name: 'Crossover', image: 'crossover.png' },
    { name: 'Geometric', image: 'geometric.png' },
    { name: 'Glitter', image: 'glitter.png' },
    { name: 'Illusion', image: 'illusion.png' },
    { name: 'Metal', image: 'metal.png' },
    { name: 'Stylish', image: 'stylish.png' },
    { name: 'Wave', image: 'wave.png' }
  ];

  // Load first category
  fetch('./kort/categories.json')
    .then(r => r.json())
    .then(cats => {
      const cat = cats[0];
      return Promise.all([
        fetch(`./kort/${cat.csv}`).then(r => r.text()),
        fetch(`./kort/${cat.rarity}`).then(r => r.json()),
        Promise.resolve(cat)
      ]);
    })
    .then(([csv, rarityMap, cat]) => {
      const lines = csv.trim().split('\n');
      const allCards = [];
      const gudeborneCards = [];

      // Simple CSV parser
      function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      }

      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const id = vals[0];
        const rarity = rarityMap[id] || 'vanleg';
        const card = {
          id,
          name: vals[1],
          stat: vals[2],
          img: vals[3],
          article: vals[4],
          rarity,
          catId: cat.id,
          catLabel: cat.label,
          catIcon: cat.icon,
          statLabel: cat.statLabel || ''
        };
        allCards.push(card);
        if (rarity === 'gudebore') {
          gudeborneCards.push(card);
        }
      }

      // Use first gudebore card, or fallback to any card
      const cards = gudeborneCards.length > 0 ? gudeborneCards : allCards.slice(0, 1);

      if (cards.length > 0) {
        const baseCard = cards[0];
        grid.innerHTML = '';

        foilEffects.forEach((foil) => {
          const cardEl = mkCard(baseCard, 'test');
          cardEl.classList.add('test-card-tilt');
          cardEl.classList.add('foil-test-card');
          cardEl.dataset.foilEffect = foil.image;

          // Add foil effect label
          const label = document.createElement('div');
          label.style.cssText = 'position:absolute;top:4px;left:4px;background:rgba(0,0,0,0.8);color:#fff;padding:4px 8px;font-size:0.65rem;font-weight:900;border-radius:4px;z-index:10';
          label.textContent = foil.name;
          cardEl.appendChild(label);

          // Add 3D tilt effect
          cardEl.addEventListener('mousemove', (e) => {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            cardEl.style.setProperty('--rotate-x', `${rotateX}deg`);
            cardEl.style.setProperty('--rotate-y', `${rotateY}deg`);

            // Update foil mask position
            const imgWrap = cardEl.querySelector('.card-img-wrap');
            if (imgWrap) {
              const imgRect = imgWrap.getBoundingClientRect();
              const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
              const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;
              imgWrap.style.setProperty('--mouse-x', `${mouseX}%`);
              imgWrap.style.setProperty('--mouse-y', `${mouseY}%`);
            }
          });

          cardEl.addEventListener('mouseleave', () => {
            cardEl.style.setProperty('--rotate-x', '0deg');
            cardEl.style.setProperty('--rotate-y', '0deg');
          });

          grid.appendChild(cardEl);
        });
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:red">Fann ingen gudebore-kort</div>';
      }
    })
    .catch(e => {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:red">Feil: ${e.message}</div>`;
    });
}

/**
 * Open card design test page
 */
async function openCardTest() {
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('cardTestScreen').classList.remove('hidden');

  const grid = document.getElementById('cardTestGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#555">Lastar kort…</div>';

  try {
    // Load all categories
    const cats = await fetch('./kort/categories.json').then(r => r.json());
    const testCards = [];

    // Get 1 card from each rarity per category
    for (const cat of cats) {
      const [csv, rar] = await Promise.all([
        fetch(`./kort/${cat.csv}`).then(r => r.text()),
        fetch(`./kort/${cat.rarity}`).then(r => r.json())
      ]);

      const idF = cat.idField || 'scientist';
      const nameF = cat.nameField || 'scientistLabel';
      const imgF = cat.imageField || 'image';
      const artF = cat.articleField || 'article';
      const statF = cat.statField || 'birthDate';
      const statT = cat.statType || 'year';
      const statLbl = cat.statLabel || '📅';

      const cards = parseCSV(csv)
        .filter(r => r[imgF] && r[imgF].trim())
        .map(r => {
          const id = r[idF].replace('http://www.wikidata.org/entity/', '');
          let stat = '?';
          if (statT === 'year') {
            stat = r[statF] ? r[statF].slice(0, 4) : '?';
          } else if (statT === 'number') {
            const n = parseInt(r[statF], 10);
            stat = isNaN(n) ? '?' : n.toLocaleString('nb-NO');
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

      // Find 1 card from each rarity
      const rarities = ['vanleg', 'sjeldgjevt', 'segngjeten', 'gudebore'];
      for (const rarity of rarities) {
        const card = cards.find(c => c.rarity === rarity);
        if (card) testCards.push(card);
      }
    }

    currentTestCards = testCards;

    // Render cards with tilt effect
    grid.innerHTML = '';
    testCards.forEach((card, index) => {
      const cardEl = mkCard(card, 'test');
      cardEl.classList.add('test-card-tilt');

      // Add foil effect only to first 4 cards (first row)
      const hasFoilEffect = index < 4;
      if (hasFoilEffect) {
        cardEl.classList.add('has-foil');
      }

      // Add 3D tilt effect and foil mouse tracking
      cardEl.addEventListener('mousemove', (e) => {
        const rect = cardEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        cardEl.style.setProperty('--rotate-x', `${rotateX}deg`);
        cardEl.style.setProperty('--rotate-y', `${rotateY}deg`);

        // Update foil mask position for cards with foil effect
        if (hasFoilEffect) {
          const imgWrap = cardEl.querySelector('.card-img-wrap');
          if (imgWrap) {
            const imgRect = imgWrap.getBoundingClientRect();
            const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
            const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;
            imgWrap.style.setProperty('--mouse-x', `${mouseX}%`);
            imgWrap.style.setProperty('--mouse-y', `${mouseY}%`);
          }
        }
      });

      cardEl.addEventListener('mouseleave', () => {
        cardEl.style.setProperty('--rotate-x', '0deg');
        cardEl.style.setProperty('--rotate-y', '0deg');
      });

      // Add click handler
      cardEl.addEventListener('click', () => {
        openTestCardModal(index);
      });

      grid.appendChild(cardEl);
    });

  } catch (e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:red">Feil: ${e.message}</div>`;
  }
}

/**
 * Open modal for test cards
 * @param {number} index - Index in test cards
 * @param {number} direction - Animation direction
 */
function openTestCardModal(index, direction = 0) {
  currentModalIndex = index;
  const modal = document.getElementById('cardModal');
  const modalCard = document.getElementById('modalCard');
  const container = document.querySelector('.modal-card-container');

  const card = currentTestCards[index];
  if (!card) return;

  // Function to update card content
  const updateCardContent = () => {
    const cardContent = document.createElement('div');
    cardContent.className = `modal-card-content collect-card ${card.rarity}`;

    cardContent.innerHTML = `
      <div class="modal-card-header">
        <div class="modal-card-name">${esc(card.name)}</div>
        <span class="modal-rarity-badge">${RL[card.rarity]}</span>
      </div>
      <div class="modal-card-img-wrap">
        <img class="modal-card-img" src="${card.img}" alt="${card.name}">
      </div>
      <div class="modal-card-footer">
        <div class="modal-card-stat">${card.stat ? `${card.statLabel} ${card.stat}` : card.statLabel || ''}</div>
        <div class="modal-card-category">${card.catIcon} ${card.catLabel}</div>
        ${card.article ? `<a href="${card.article}" target="_blank" class="les-om-link" style="font-size:0.9rem">Les om →</a>` : ''}
      </div>
    `;

    const img = cardContent.querySelector('.modal-card-img');
    img.onerror = function () {
      this.parentNode.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:4rem;opacity:.2">${card.catIcon || '🔬'}</div>`;
    };

    modalCard.innerHTML = '';
    modalCard.appendChild(cardContent);

    // Add cosmos mouse tracking for modal card
    const imgWrap = modalCard.querySelector('.modal-card-img-wrap');
    if (imgWrap) {
      imgWrap.addEventListener('mousemove', (e) => {
        const rect = imgWrap.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        imgWrap.style.setProperty('--mouse-x', `${mouseX}%`);
        imgWrap.style.setProperty('--mouse-y', `${mouseY}%`);
      });
    }
  };

  // Remove all animation classes
  container.classList.remove('slide-in', 'slide-out', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

  // Force reflow to restart animation
  void container.offsetWidth;

  // Add appropriate animation class
  if (direction === 0) {
    updateCardContent();
    container.classList.add('slide-in');
  } else if (direction > 0) {
    container.classList.add('slide-out-right');
    setTimeout(() => {
      updateCardContent();
      container.classList.remove('slide-out-right');
      void container.offsetWidth;
      container.classList.add('slide-in-left');
    }, 500);
  } else {
    container.classList.add('slide-out-left');
    setTimeout(() => {
      updateCardContent();
      container.classList.remove('slide-out-left');
      void container.offsetWidth;
      container.classList.add('slide-in-right');
    }, 500);
  }

  modal.classList.add('active');
  modal.classList.remove('closing');
  document.querySelector('.modal-card').className = `modal-card ${card.rarity}`;

  // Update navigation buttons
  const prevBtn = document.querySelector('.card-nav.prev');
  const nextBtn = document.querySelector('.card-nav.next');
  prevBtn.classList.toggle('disabled', index === 0);
  nextBtn.classList.toggle('disabled', index === currentTestCards.length - 1);
}

/**
 * Navigate test cards
 * @param {number} direction - -1 (prev) or 1 (next)
 */
function navigateTestCard(direction) {
  const newIndex = currentModalIndex + direction;
  if (newIndex >= 0 && newIndex < currentTestCards.length) {
    openTestCardModal(newIndex, direction);
  }
}

/**
 * Close card test screen
 */
function closeCardTest() {
  document.getElementById('cardTestScreen').classList.add('hidden');
}
