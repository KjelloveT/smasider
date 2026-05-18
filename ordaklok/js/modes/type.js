/* Ordaklok — modus: skriv svaret */
(function (root) {
  'use strict';

  const State = OrdaklokState;
  const { ICONS, escapeHtml, normalizeAnswer, isAnswerCorrect } = State;

  function build(list, queue, options, callbacks) {
    let pos = 0;
    let peekedThis = false;
    let lockedAfterAnswer = false;
    let mountEl = null;
    let questionStartedAt = 0;

    function render(host) {
      mountEl = document.createElement('div');
      host.appendChild(mountEl);
      next();
    }

    function currentItem() { return queue[pos]; }

    function next() {
      if (pos >= queue.length) {
        callbacks.onFinish && callbacks.onFinish();
        return;
      }
      peekedThis = false;
      lockedAfterAnswer = false;
      questionStartedAt = Date.now();

      const item = currentItem();
      const pair = list.pairs[item.idx];
      const promptText = State.getPrompt(pair, item.direction);
      const promptLabel = State.getPromptLabel(list, item.direction);
      const answerLabel = State.getAnswerLabel(list, item.direction);
      const answer = State.getAnswer(pair, item.direction);

      mountEl.innerHTML = '';

      const box = document.createElement('div');
      box.className = 'box2 prompt-box';

      const lbl = document.createElement('div');
      lbl.className = 'prompt-label';
      lbl.textContent = promptLabel;
      box.appendChild(lbl);

      const text = document.createElement('div');
      text.className = 'prompt-text';
      text.textContent = promptText;
      box.appendChild(text);

      // Letter boxes (boks per teikn) – speglar målsvaret
      let lbContainer = null;
      if (options.boxes) {
        lbContainer = document.createElement('div');
        lbContainer.className = 'letter-boxes';
        renderLetterBoxes(lbContainer, '', answer, options.highlight, false);
        box.appendChild(lbContainer);
      }

      const answerLbl = document.createElement('div');
      answerLbl.className = 'prompt-label';
      answerLbl.style.marginTop = '14px';
      answerLbl.textContent = 'Skriv svaret (' + answerLabel + ')';
      box.appendChild(answerLbl);

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'answer-input';
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.autocorrect = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', 'Skriv svaret');
      box.appendChild(input);

      const feedback = document.createElement('div');
      feedback.className = 'feedback';
      feedback.id = 'typeFeedback';
      box.appendChild(feedback);

      const actions = document.createElement('div');
      actions.className = 'btn-row';
      actions.style.justifyContent = 'center';
      actions.style.marginTop = '12px';

      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'btn btn-primary';
      submitBtn.textContent = 'Sjekk';
      submitBtn.addEventListener('click', tryAnswer);
      actions.appendChild(submitBtn);

      if (options.peek) {
        const peekBtn = document.createElement('button');
        peekBtn.type = 'button';
        peekBtn.className = 'btn';
        peekBtn.innerHTML = ICONS.eye + ' <span>Tjuvtitt</span>';
        peekBtn.addEventListener('click', () => peek(input, lbContainer, answer));
        actions.appendChild(peekBtn);
      }

      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'btn';
      skipBtn.textContent = 'Hopp over';
      skipBtn.addEventListener('click', () => recordAndAdvance(false, false));
      actions.appendChild(skipBtn);

      box.appendChild(actions);
      mountEl.appendChild(box);

      input.focus();

      input.addEventListener('input', () => {
        if (lockedAfterAnswer) return;
        if (lbContainer) {
          renderLetterBoxes(lbContainer, input.value, answer, options.highlight, false);
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          tryAnswer();
        }
      });

      function tryAnswer() {
        if (lockedAfterAnswer) return;
        if (!input.value.trim()) return;
        const correct = isAnswerCorrect(input.value, pair, item.direction);
        lockedAfterAnswer = true;
        if (correct) {
          input.classList.add(peekedThis ? 'peeked' : 'correct');
          feedback.className = 'feedback ' + (peekedThis ? 'peek' : 'ok');
          feedback.textContent = peekedThis ? 'Rett (men du tjuvtitta)' : '✓ Rett!';
          if (lbContainer) renderLetterBoxes(lbContainer, answer, answer, options.highlight, true);
          setTimeout(() => recordAndAdvance(true, peekedThis), 700);
        } else {
          input.classList.add('wrong');
          feedback.className = 'feedback bad';
          feedback.textContent = '✗ Rett svar: ' + answer;
          if (lbContainer) renderLetterBoxes(lbContainer, answer, answer, options.highlight, true);
          setTimeout(() => recordAndAdvance(false, peekedThis), 1500);
        }
      }
    }

    function recordAndAdvance(correct, peeked) {
      const item = currentItem();
      const time = Date.now() - questionStartedAt;
      callbacks.onResult(item.idx, { correct, peeked, time });
      pos++;
      callbacks.onAdvance && callbacks.onAdvance();
      next();
    }

    function peek(input, lbContainer, answer) {
      peekedThis = true;
      // Vis svaret midlertidig under boksene
      const feedback = mountEl.querySelector('#typeFeedback');
      feedback.className = 'feedback peek';
      feedback.textContent = 'Svar: ' + answer;
      if (lbContainer) {
        renderLetterBoxes(lbContainer, input.value, answer, options.highlight, true);
      }
    }

    function renderLetterBoxes(container, typed, target, highlight, allPeeked) {
      container.innerHTML = '';
      const targetNorm = normalizeAnswer(target);
      const typedNorm = normalizeAnswer(typed);
      // Vi bruker original-strengen for visuell layout (mellomrom = gap)
      let typedPos = 0;
      let typedNormPos = 0;
      // Map kvar bokstav i target sin originale form til ein boks. Mellomrom og spesialteikn blir gap.
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        const isLetter = /[\p{L}\p{N}]/u.test(ch);
        const span = document.createElement('span');
        span.className = 'lb';
        if (!isLetter) {
          span.classList.add('gap');
          span.textContent = ch;
          container.appendChild(span);
          continue;
        }
        const expectedNorm = normalizeAnswer(ch);
        const typedChar = typedNorm[typedNormPos] || '';
        if (allPeeked) {
          span.classList.add('peeked');
          span.textContent = ch;
        } else if (typedChar) {
          if (typedChar === expectedNorm) {
            span.classList.add('match');
            span.textContent = highlight ? ch : (typed[typedPos] || ch);
          } else {
            // Vis det brukaren har skrive, men i feil
            span.textContent = highlight ? typedChar : (typed[typedPos] || typedChar);
          }
          typedPos++;
          typedNormPos++;
        } else {
          if (highlight && typedNormPos === typed.length) {
            // Den neste bokstaven brukaren skal skrive — markert som "current"
            // Berre på første tomme boks etter typed
            if (!container.querySelector('.lb.current')) {
              span.classList.add('current');
            }
          }
          span.textContent = '';
        }
        container.appendChild(span);
      }
    }

    return { render };
  }

  root.OrdaklokModeType = {
    id: 'type',
    label: 'Skriv svar',
    description: 'Vis ein side, skriv svaret. Med tjuvtitt og bokstavbokser.',
    icon: OrdaklokState.ICONS.keyboard,
    supportsLeitner: true,
    mount(host, ctx) {
      const m = build(ctx.list, ctx.queue, ctx.options, ctx.callbacks);
      m.render(host);
      this._unmount = () => { host.innerHTML = ''; };
    },
    unmount() { if (this._unmount) this._unmount(); }
  };
})(window);
