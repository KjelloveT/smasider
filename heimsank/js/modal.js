// Heimsank - Card Modal Functions

let currentModalIndex = 0;

/**
 * Open card modal for collection cards
 * @param {number} index - Index in collection
 * @param {number} direction - Animation direction: -1 (prev), 0 (open), 1 (next)
 */
function openCardModal(index, direction = 0) {
  currentModalIndex = index;
  const modal = document.getElementById('cardModal');
  const modalCard = document.getElementById('modalCard');
  const container = document.querySelector('.modal-card-container');

  const entry = S.collection[index];
  const card = S.idx[entry.cardId];
  if (!card) return;

  // Function to update card content
  const updateCardContent = () => {
    const cardContent = document.createElement('div');
    cardContent.className = `modal-card-content collect-card ${card.rarity}`;

    cardContent.innerHTML = `
      <div class="modal-card-header">
        <div class="modal-card-name">${esc(card.name)}${entry.foil ? ' ' + ICON('sparkles', 18) : ''}</div>
        <div class="card-header-meta">
          <span class="modal-rarity-badge">${RL[card.rarity]}</span>
          ${entry.difficulty ? `<span class="diff-badge">${entry.difficulty} ${entry.operations ? entry.operations.join(' ') : ''}${entry.foil ? ' ' + ICON('sparkles', 12) : ''}</span>` : ''}
        </div>
      </div>
      <div class="modal-card-img-wrap">
        <img class="modal-card-img" src="${card.img}" alt="${card.name}">
      </div>
      <div class="modal-card-footer">
        <div class="modal-card-stat" style="display:inline-flex;align-items:center;gap:6px">${card.statLabel ? CAT_ICON(card.statLabel, 16) : ''}<span>${card.stat || ''}</span></div>
        <div class="modal-card-category" style="display:inline-flex;align-items:center;gap:6px">${CAT_ICON(card.catIcon, 14)}<span>${card.catLabel || ''}</span></div>
        ${card.article ? `<a href="${card.article}" target="_blank" class="les-om-link" style="font-size:0.9rem;margin-top:8px;display:inline-block">Les om →</a>` : ''}
      </div>
    `;

    const img = cardContent.querySelector('.modal-card-img');
    img.onerror = function () {
      this.parentNode.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;opacity:.25">${CAT_ICON(card.catIcon || 'microscope', 64)}</div>`;
    };

    modalCard.innerHTML = '';
    modalCard.appendChild(cardContent);

    // Add cosmos mouse tracking for modal card (rAF-throttla: éin layout-les + stil-skriv per frame)
    const imgWrap = modalCard.querySelector('.modal-card-img-wrap');
    if (imgWrap) {
      let lastX = 0, lastY = 0, ticking = false;
      imgWrap.addEventListener('mousemove', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const rect = imgWrap.getBoundingClientRect();
          const mouseX = ((lastX - rect.left) / rect.width) * 100;
          const mouseY = ((lastY - rect.top) / rect.height) * 100;
          imgWrap.style.setProperty('--mouse-x', `${mouseX}%`);
          imgWrap.style.setProperty('--mouse-y', `${mouseY}%`);
        });
      });
    }
  };

  // Remove all animation classes
  container.classList.remove('slide-in', 'slide-out', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

  // Force reflow to restart animation
  void container.offsetWidth;

  // Add appropriate animation class
  if (direction === 0) {
    // Initial open
    updateCardContent();
    container.classList.add('slide-in');
  } else if (direction > 0) {
    // Next card - slide out right, then slide in from left
    container.classList.add('slide-out-right');
    setTimeout(() => {
      updateCardContent();
      container.classList.remove('slide-out-right');
      void container.offsetWidth;
      container.classList.add('slide-in-left');
    }, 500);
  } else {
    // Previous card - slide out left, then slide in from right
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
  // Add rarity class to modal card for holofoil effect
  document.querySelector('.modal-card').className = `modal-card ${card.rarity}`;
  updateNavigationButtons();
}

/**
 * Close card modal
 */
function closeCardModal() {
  const modal = document.getElementById('cardModal');
  const container = document.querySelector('.modal-card-container');

  // Add closing animations
  modal.classList.add('closing');
  container.classList.remove('slide-in', 'slide-out', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
  void container.offsetWidth;
  container.classList.add('slide-out');

  // Remove active class after animation
  setTimeout(() => {
    modal.classList.remove('active', 'closing');
    container.classList.remove('slide-out');
  }, 500);
}

/**
 * Navigate to next/previous card
 * @param {number} direction - -1 (previous) or 1 (next)
 */
function navigateCard(direction) {
  const newIndex = currentModalIndex + direction;
  if (newIndex >= 0 && newIndex < S.collection.length) {
    openCardModal(newIndex, direction);
  }
}

/**
 * Update navigation button states
 */
function updateNavigationButtons() {
  const prevBtn = document.querySelector('.card-nav.prev');
  const nextBtn = document.querySelector('.card-nav.next');

  prevBtn.classList.toggle('disabled', currentModalIndex === 0);
  nextBtn.classList.toggle('disabled', currentModalIndex === S.collection.length - 1);
}

// Add click handlers to collection cards
function addCardClickHandlers() {
  const row = document.getElementById('collRow');
  row.addEventListener('click', (e) => {
    const card = e.target.closest('.bar-card');
    if (card) {
      const idx = Array.from(row.children).indexOf(card);
      if (idx >= 0) {
        openCardModal(idx);
      }
    }
  });
}
