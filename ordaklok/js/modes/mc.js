/* Ordaklok — modus: multiple choice */
(function (root) {
  'use strict';

  const State = OrdaklokState;
  const { escapeHtml } = State;

  function build(list, queue, options, callbacks) {
    let pos = 0;
    let mountEl = null;
    let questionStartedAt = 0;
    let locked = false;

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
      locked = false;
      questionStartedAt = Date.now();

      const item = queue[pos];
      const pair = list.pairs[item.idx];
      const promptText = State.getPrompt(pair, item.direction);
      const promptLabel = State.getPromptLabel(list, item.direction);
      const answerLabel = State.getAnswerLabel(list, item.direction);
      const correctAnswer = State.getAnswer(pair, item.direction);

      // Vel 3 distractors frå same liste (anna par)
      const otherIndices = list.pairs.map((_, i) => i).filter(i => i !== item.idx);
      const picked = State.pickN(otherIndices, Math.min(3, otherIndices.length));
      const distractors = picked
        .map(i => State.getAnswer(list.pairs[i], item.direction))
        .filter(s => State.normalizeAnswer(s) !== State.normalizeAnswer(correctAnswer));
      // Pad opp om alle filtrerte vekk
      while (distractors.length < 3 && otherIndices.length > 0) {
        const ix = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        const cand = State.getAnswer(list.pairs[ix], item.direction);
        if (State.normalizeAnswer(cand) !== State.normalizeAnswer(correctAnswer) && !distractors.includes(cand)) {
          distractors.push(cand);
        } else if (otherIndices.length === 1) break;
      }

      const choices = State.shuffle([correctAnswer].concat(distractors).slice(0, 4));

      mountEl.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'box2 prompt-box';

      const lbl = document.createElement('div');
      lbl.className = 'prompt-label';
      lbl.textContent = promptLabel + ' → ' + answerLabel;
      box.appendChild(lbl);

      const text = document.createElement('div');
      text.className = 'prompt-text';
      text.textContent = promptText;
      box.appendChild(text);

      const opts = document.createElement('div');
      opts.className = 'mc-options';

      choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mc-option';
        btn.textContent = (i + 1) + '. ' + choice;
        btn.dataset.value = choice;
        btn.addEventListener('click', () => pick(btn, choice, opts, correctAnswer));
        opts.appendChild(btn);
      });

      box.appendChild(opts);

      const feedback = document.createElement('div');
      feedback.className = 'feedback';
      feedback.id = 'mcFeedback';
      box.appendChild(feedback);

      mountEl.appendChild(box);

      // Tastatur 1-4
      const keyHandler = (e) => {
        if (locked) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) {
          const btn = opts.children[n - 1];
          if (btn) btn.click();
        }
      };
      document.addEventListener('keydown', keyHandler);
      mountEl._keyHandler = keyHandler;
    }

    function pick(btn, value, optsEl, correctAnswer) {
      if (locked) return;
      locked = true;
      const correct = State.normalizeAnswer(value) === State.normalizeAnswer(correctAnswer);
      const feedback = mountEl.querySelector('#mcFeedback');
      // Markér riktig og evt. feil
      Array.from(optsEl.children).forEach(el => {
        if (State.normalizeAnswer(el.dataset.value) === State.normalizeAnswer(correctAnswer)) {
          el.classList.add('correct');
        } else {
          el.classList.add('dim');
        }
        el.disabled = true;
      });
      if (!correct) btn.classList.add('wrong');
      feedback.className = 'feedback ' + (correct ? 'ok' : 'bad');
      feedback.textContent = correct ? '✓ Rett!' : '✗ Rett svar: ' + correctAnswer;

      const time = Date.now() - questionStartedAt;
      const item = queue[pos];
      setTimeout(() => {
        document.removeEventListener('keydown', mountEl._keyHandler);
        callbacks.onResult(item.idx, { correct, peeked: false, time });
        pos++;
        callbacks.onAdvance && callbacks.onAdvance();
        next();
      }, correct ? 600 : 1300);
    }

    return { render, cleanup() {
      if (mountEl && mountEl._keyHandler) {
        document.removeEventListener('keydown', mountEl._keyHandler);
      }
    } };
  }

  root.OrdaklokModeMC = {
    id: 'mc',
    label: 'Multiple choice',
    description: 'Vel det rette svaret blant fire alternativ. Raskt og leikt.',
    icon: OrdaklokState.ICONS.list,
    supportsLeitner: true,
    mount(host, ctx) {
      const m = build(ctx.list, ctx.queue, ctx.options, ctx.callbacks);
      m.render(host);
      this._unmount = () => { m.cleanup && m.cleanup(); host.innerHTML = ''; };
    },
    unmount() { if (this._unmount) this._unmount(); }
  };
})(window);
