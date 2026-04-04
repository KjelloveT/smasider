// Heimsank - Card Rendering Functions

/**
 * Build a card element
 * @param {Object} card - Card data
 * @param {string} sz - Size: 'bar', 'full', 'test'
 * @param {Object} entry - Optional collection entry with difficulty/operations/foil
 * @returns {HTMLElement} Card element
 */
function mkCard(card, sz, entry = null) {
  const el = document.createElement('div');
  const isTest = sz === 'test';
  const isBar = sz === 'bar';
  
  // Check if card has foil effect
  const hasFoil = entry && entry.foil === true;
  
  el.className = `collect-card ${card.rarity} ${isTest ? 'test-card' : isBar ? 'bar-card tilt' : sz === 'full' ? 'full-card' : ''} ${hasFoil ? 'has-foil' : ''}`;

  // Header with name, rarity badge, and difficulty/operations
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  let hdrHtml = `<span class="card-name">${esc(card.name)}</span><div class="card-header-meta"><span class="rarity-badge">${RL[card.rarity]}</span>`;
  if (entry && entry.difficulty) {
    hdrHtml += `<span class="diff-badge">${entry.difficulty} ${entry.operations ? entry.operations.join(' ') : ''}${hasFoil ? ' ✨' : ''}</span>`;
  }
  hdrHtml += `</div>`;
  hdr.innerHTML = hdrHtml;
  el.appendChild(hdr);

  // Image wrapper
  const iw = document.createElement('div');
  iw.className = 'card-img-wrap';
  const img = document.createElement('img');
  img.alt = card.name;
  img.src = card.img;
  img.loading = 'lazy';
  img.onerror = function () {
    this.parentNode.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f5f5f5"><img src="Logo - no text.png" alt="Heimsank" style="height:40%;width:auto;opacity:0.3"></div>`;
  };
  iw.appendChild(img);
  el.appendChild(iw);

  // Add 3D tilt and foil mouse tracking for bar cards
  if (isBar) {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;
      
      el.style.setProperty('--rotate-x', `${rotateX}deg`);
      el.style.setProperty('--rotate-y', `${rotateY}deg`);
      
      // Update foil mask position for cards with foil effect
      if (hasFoil) {
        const imgRect = iw.getBoundingClientRect();
        const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
        const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;
        iw.style.setProperty('--mouse-x', `${mouseX}%`);
        iw.style.setProperty('--mouse-y', `${mouseY}%`);
      }
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--rotate-x', '0deg');
      el.style.setProperty('--rotate-y', '0deg');
    });
  }

  // Footer with stats and info
  const ft = document.createElement('div');
  ft.className = 'card-footer';
  const yr = document.createElement('span');
  yr.textContent = card.stat ? `${card.statLabel} ${card.stat}` : card.statLabel || '';
  ft.appendChild(yr);

  // Article link
  if (card.article) {
    const a = document.createElement('a');
    a.href = card.article;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'les-om-link';
    a.textContent = 'Les om →';
    a.addEventListener('mousedown', e => e.stopPropagation());
    a.addEventListener('dragstart', e => e.stopPropagation());
    ft.appendChild(a);
  }

  // Add category info for test cards
  if (isTest) {
    const catInfo = document.createElement('div');
    catInfo.style.cssText = 'font-size:0.6rem;font-weight:900;text-transform:uppercase;margin-top:2px;opacity:0.7';
    catInfo.textContent = `${card.catIcon} ${card.catLabel}`;
    ft.appendChild(catInfo);
  }

  // Add swap button for collection cards when there's a pending card
  // Only show on collection cards (not on the pending card itself)
  if (isBar && entry && S.pending && entry.cardId !== S.pending?.id) {
    const swapBtn = document.createElement('button');
    swapBtn.className = 'card-action-btn swap-btn';
    swapBtn.innerHTML = '🔄';
    swapBtn.title = 'Bytt med nytt kort';
    swapBtn.onclick = (e) => {
      e.stopPropagation();
      // Replace this card with pending
      const pendingEntry = S.pendingEntry || {
        catId: S.pending.catId,
        cardId: S.pending.id,
        difficulty: S.level ? (S.level === 'lett' ? 'Lett' : S.level === 'middels' ? 'Middels' : 'Vanskeleg') : 'Middels',
        operations: S.ops && S.ops.length > 0
          ? S.ops.map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op)
          : ['+', '-'],
        foil: false,
        earnedAt: Date.now()
      };
      // Find index of this card in collection
      const idx = S.collection.findIndex(e => e.cardId === entry.cardId && e.earnedAt === entry.earnedAt);
      if (idx >= 0) {
        S.collection[idx] = pendingEntry;
        S.pending = null;
        S.pendingEntry = null;
        saveStorage();
        renderColl();
        document.getElementById('pendingArea').classList.add('hidden');
        resumeIfDone();
      }
    };
    ft.appendChild(swapBtn);
  }

  el.appendChild(ft);
  return el;
}

/**
 * Render the collection grid
 */
function renderColl() {
  const row = document.getElementById('collRow');
  document.getElementById('collCount').textContent = S.collection.length;
  row.innerHTML = '';

  if (S.collection.length === 0) {
    row.innerHTML = '<div class="empty-coll">Svar rett 6 gonger for å vinna eit kort!</div>';
  } else {
    S.collection.forEach((entry, idx) => {
      const card = S.idx[entry.cardId];
      if (!card) return;
      const el = mkCard(card, 'bar', entry);
      setupDraggable(el, 'coll', idx);
      setupDropTarget(el, ds => {
        if (ds.type === 'coll' && ds.idx !== idx) {
          // Swap positions
          const a = S.collection[ds.idx];
          S.collection[ds.idx] = S.collection[idx];
          S.collection[idx] = a;
          saveStorage();
          renderColl();
        } else if (ds.type === 'pending') {
          // Replace with pending card - use pendingEntry if available
          const pendingEntry = S.pendingEntry || {
            catId: S.pending.catId,
            cardId: S.pending.id,
            difficulty: S.level ? (S.level === 'lett' ? 'Lett' : S.level === 'middels' ? 'Middels' : 'Vanskeleg') : 'Middels',
            operations: S.ops && S.ops.length > 0
              ? S.ops.map(op => op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op)
              : ['+', '-'],
            foil: false,
            earnedAt: Date.now()
          };

          S.collection[idx] = pendingEntry;
          S.pending = null;
          S.pendingEntry = null;
          saveStorage();
          renderColl();
          resumeIfDone();
        }
      });
      row.appendChild(el);
    });
  }
}

/**
 * Resume game if no pending card
 */
function resumeIfDone() {
  if (!S.pending) {
    S.paused = false;
    S.pendingEntry = null;
    document.getElementById('ansInput').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('pendingArea').classList.add('hidden');
    document.getElementById('dragInstruction').classList.add('hidden');
    nextQ();
  }
}
