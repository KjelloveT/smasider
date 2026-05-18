/* Ordaklok — modus: flashcard (sjølv-vurdering) */
(function (root) {
  'use strict';

  const State = OrdaklokState;

  function build(list, queue, options, callbacks) {
    let pos = 0;
    let mountEl = null;
    let questionStartedAt = 0;
    let flipped = false;
    let cardEl = null;

    function render(host) {
      mountEl = document.createElement('div');
      host.appendChild(mountEl);
      next();
    }

    function next() {
      if (pos >= queue.length) {
        callbacks.onFinish && callbacks.onFinish();
        return;
      }
      flipped = false;
      questionStartedAt = Date.now();

      const item = queue[pos];
      const pair = list.pairs[item.idx];
      const promptText = State.getPrompt(pair, item.direction);
      const promptLabel = State.getPromptLabel(list, item.direction);
      const answerText = State.getAnswer(pair, item.direction);
      const answerLabel = State.getAnswerLabel(list, item.direction);

      mountEl.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'box2';
      wrap.style.padding = '20px';

      const card = document.createElement('div');
      card.className = 'flashcard';
      cardEl = card;
      card.innerHTML =
        '<div class="flashcard-inner">' +
          '<div class="flashcard-face front">' +
            '<div class="face-label">' + State.escapeHtml(promptLabel) + '</div>' +
            '<div class="face-text"></div>' +
          '</div>' +
          '<div class="flashcard-face back">' +
            '<div class="face-label">' + State.escapeHtml(answerLabel) + '</div>' +
            '<div class="face-text"></div>' +
          '</div>' +
        '</div>';
      card.querySelector('.flashcard-face.front .face-text').textContent = promptText;
      card.querySelector('.flashcard-face.back .face-text').textContent = answerText;
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Snu kortet');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', flip);
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      });
      wrap.appendChild(card);

      const flipHint = document.createElement('p');
      flipHint.className = 'muted center';
      flipHint.id = 'flipHint';
      flipHint.style.marginTop = '12px';
      flipHint.textContent = 'Klikk på kortet eller trykk mellomrom for å snu';
      wrap.appendChild(flipHint);

      const rate = document.createElement('div');
      rate.className = 'self-rate-row';
      rate.id = 'selfRate';
      rate.style.display = 'none';
      rate.innerHTML =
        '<button class="self-rate-btn" data-rating="hard">Visste ikkje</button>' +
        '<button class="self-rate-btn" data-rating="ok">Måtte tenkje</button>' +
        '<button class="self-rate-btn" data-rating="easy">Kunne det</button>';
      rate.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-rating]');
        if (btn) submitRating(btn.dataset.rating);
      });
      wrap.appendChild(rate);

      mountEl.appendChild(wrap);

      // Tastatur: 1=hard, 2=ok, 3=easy
      const keyHandler = (e) => {
        if (!flipped) return;
        if (e.key === '1') submitRating('hard');
        else if (e.key === '2') submitRating('ok');
        else if (e.key === '3') submitRating('easy');
      };
      document.addEventListener('keydown', keyHandler);
      mountEl._keyHandler = keyHandler;
    }

    function flip() {
      if (flipped) return;
      flipped = true;
      cardEl.classList.add('flipped');
      document.getElementById('selfRate').style.display = '';
      document.getElementById('flipHint').textContent = 'Korleis gjekk det?';
    }

    function submitRating(rating) {
      const item = queue[pos];
      const time = Date.now() - questionStartedAt;
      // hard = feil, ok = rett (med litt strev), easy = rett
      const correct = rating !== 'hard';
      callbacks.onResult(item.idx, { correct, peeked: false, time, rating });
      document.removeEventListener('keydown', mountEl._keyHandler);
      pos++;
      callbacks.onAdvance && callbacks.onAdvance();
      next();
    }

    return { render, cleanup() {
      if (mountEl && mountEl._keyHandler) document.removeEventListener('keydown', mountEl._keyHandler);
    } };
  }

  root.OrdaklokModeFlashcard = {
    id: 'flashcard',
    label: 'Flashcard',
    description: 'Vis spørsmål, snu kortet for svar, vurder sjølv. God for læring.',
    icon: OrdaklokState.ICONS.layers,
    supportsLeitner: true,
    mount(host, ctx) {
      const m = build(ctx.list, ctx.queue, ctx.options, ctx.callbacks);
      m.render(host);
      this._unmount = () => { m.cleanup && m.cleanup(); host.innerHTML = ''; };
    },
    unmount() { if (this._unmount) this._unmount(); }
  };
})(window);
