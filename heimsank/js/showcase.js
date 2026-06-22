// Heimsank - Showcase Fan Display

let showcaseData = []; // [{cat, picks, imagesReady}]
let currentFanIndex = 0;
let fanInterval = null;

/**
 * Preload an array of image URLs, resolves when all are loaded (or failed)
 * @param {string[]} urls
 * @returns {Promise}
 */
function preloadImages(urls) {
  return Promise.all(urls.map(url => new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // don't block on broken images
    img.src = url;
  })));
}

/**
 * Load sample cards for all categories and start the fan showcase
 */
async function initShowcase() {
  try {
    const cats = await fetch('./kort/categories.json').then(r => r.json());

    // Load all categories in parallel
    const results = await Promise.all(cats.map(async (cat) => {
      const allCards = await CardData.loadCategoryCards(cat);

      // Pick one card per rarity (prefer ones with images)
      const picks = [];
      for (const rarity of ['vanleg', 'sjeldgjevt', 'segngjeten', 'gudebore']) {
        const pool = allCards.filter(c => c.rarity === rarity);
        if (pool.length > 0) {
          picks.push(pool[Math.floor(Math.random() * pool.length)]);
        }
      }

      return { cat, picks };
    }));

    showcaseData = results.filter(r => r.picks.length >= 3);
    if (showcaseData.length > 0) {
      currentFanIndex = 0;
      // Preload first category images before showing
      await preloadImages(showcaseData[0].picks.map(c => c.img));
      renderFan(showcaseData[currentFanIndex], true);
      // Start preloading all remaining images in background
      preloadAllShowcaseImages();
      // Auto-cycle every 7 seconds
      fanInterval = setInterval(cycleFan, 7000);
    }
  } catch (e) {
    // Silently fail - showcase is non-critical
    console.log('Showcase load failed:', e);
  }
}

/**
 * Preload images for all categories in background
 */
function preloadAllShowcaseImages() {
  const allUrls = showcaseData.flatMap(d => d.picks.map(c => c.img));
  preloadImages(allUrls);
}

/**
 * Cycle to the next category fan
 */
function cycleFan() {
  if (showcaseData.length <= 1) return;
  currentFanIndex = (currentFanIndex + 1) % showcaseData.length;
  renderFan(showcaseData[currentFanIndex], false);
}

/**
 * Render a fan of cards for a category
 * @param {Object} data - {cat, picks}
 * @param {boolean} instant - Skip exit animation
 */
function renderFan(data, instant) {
  const container = document.getElementById('fanContainer');
  const label = document.getElementById('fanCatLabel');
  if (!container || !label) return;

  // Exit animation for old cards
  const oldCards = container.querySelectorAll('.fan-card');
  if (!instant && oldCards.length > 0) {
    oldCards.forEach(c => c.classList.add('fan-exit'));
    label.style.opacity = '0';
    setTimeout(() => buildFan(container, label, data), 550);
  } else {
    buildFan(container, label, data);
  }
}

/**
 * Build fan card elements
 */
function buildFan(container, label, data) {
  container.innerHTML = '';
  label.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;opacity:1';
  label.innerHTML = `${CAT_ICON(data.cat.icon, 16)}<span>${data.cat.label}</span>`;

  data.picks.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = `fan-card ${card.rarity}`;

    const imgBg = card.rarity === 'sjeldgjevt' ? '#87CEEB'
      : card.rarity === 'segngjeten' ? '#C4A1FF'
      : card.rarity === 'gudebore' ? '#FFDB58'
      : '#f0f0f0';

    el.innerHTML = `
      <div class="fan-card-header">
        <span class="fan-card-name">${esc(card.name)}</span>
        <span class="fan-rarity-badge">${RL[card.rarity]}</span>
      </div>
      <div class="fan-card-img" style="background:${imgBg}">
        <img src="${card.img}" alt="${esc(card.name)}">
      </div>
      <div class="fan-card-footer">${CAT_ICON(card.statLabel, 10)}<span>${esc(String(card.stat))}</span></div>
    `;
    const fanImg = el.querySelector('.fan-card-img img');
    if (fanImg) {
      fanImg.onerror = function () {
        this.parentNode.innerHTML = `<div class="fan-card-img-fallback">${CAT_ICON(data.cat.icon, 28)}</div>`;
      };
    }

    // Stagger entrance animation
    el.classList.add('fan-enter');
    el.style.animationDelay = `${i * 0.08}s`;
    // Remove fan-enter after animation so it doesn't block exit transitions
    el.addEventListener('animationend', () => el.classList.remove('fan-enter'), { once: true });

    container.appendChild(el);
  });
}

/**
 * Stop showcase cycling (when game starts)
 */
function stopShowcase() {
  if (fanInterval) {
    clearInterval(fanInterval);
    fanInterval = null;
  }
}
