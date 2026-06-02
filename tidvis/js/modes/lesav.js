/* modes/lesav.js — «Les av»: kjeldeforma blir vist, eleven vel rett svar
   blant fire alternativ (3 lærerike distraktorar + fasiten). Brukt òg av
   Snøggstart (game.js set då retning='mix' og timer). */
(function () {
  'use strict';

  window.TidvisModes = window.TidvisModes || {};

  const KEYS = ['A', 'B', 'C', 'D'];

  function el(cls, tag) {
    const e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    return e;
  }

  function promptFor(dst) {
    if (dst === 'digital')   return 'Kva er den digitale tida?';
    if (dst === 'digital24') return 'Kva er klokka (24-timarsformat)?';
    if (dst === 'analog')    return 'Kva urskive passar?';
    return 'Kva er klokka?';
  }

  function answerContent(dst, time) {
    if (dst === 'analog') {
      return TidvisGame.renderRepr('analog', time, { size: 122 });
    }
    if (dst === 'digital' || dst === 'digital24') {
      const span = el('mono', 'span');
      span.textContent = TidvisTime.toDigital(time);
      return span;
    }
    const span = el('', 'span');
    span.textContent = TidvisTime.toText(time);
    return span;
  }

  function sourceNode(src, time) {
    if (src === 'analog')   return TidvisGame.renderRepr('analog',   time, { size: 220 });
    if (src === 'digital')  return TidvisGame.renderRepr('digital',  time, { label: 'DIGITAL' });
    if (src === 'digital24') return TidvisGame.renderRepr('digital24', time, { label: 'DIGITAL' });
    return TidvisGame.renderRepr('text', time, { accent: 'pink' });
  }

  function startRound(container, session, api) {
    const dir = api.resolveDir(session.direction);
    const use24 = dir.src === 'digital24' || dir.dst === 'digital24';
    const time = use24
      ? TidvisTime.randomTime24(session.level)
      : TidvisTime.randomTime(session.level);
    const distract = TidvisTime.distractorTimes(time, session.level, 3);
    const options = TidvisTime.shuffle([time].concat(distract));
    session.currentQuestion = { time: time, src: dir.src, dst: dir.dst };

    const grid = el('tv-game-grid');

    // kjeldekort
    const stage = el('tv-clockstage');
    const card = el('card');
    card.style.padding = 'clamp(14px,2.5vw,24px)';
    card.appendChild(sourceNode(dir.src, time));
    stage.appendChild(card);
    grid.appendChild(stage);

    // svarkolonne
    const col = el('tv-qcol');
    const q = el('tv-q');
    q.textContent = promptFor(dir.dst);
    col.appendChild(q);

    const answers = el('answers');
    const buttons = [];
    let answered = false;

    function lockAll() {
      buttons.forEach(function (b) { b.disabled = true; });
    }

    options.forEach(function (opt, i) {
      const btn = el('ans' + (dir.dst === 'analog' ? ' ans--clock' : ''), 'button');
      btn.type = 'button';
      if (dir.dst !== 'analog') {
        const key = el('ans__key', 'span');
        key.textContent = KEYS[i];
        btn.appendChild(key);
      }
      btn.appendChild(answerContent(dir.dst, opt));
      btn.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        lockAll();
        const correct = TidvisTime.equals(opt, time);
        btn.classList.add(correct ? 'is-correct' : 'is-wrong');
        if (!correct) {
          for (let j = 0; j < options.length; j++) {
            if (TidvisTime.equals(options[j], time)) {
              buttons[j].classList.add('is-correct');
              break;
            }
          }
        }
        api.submit(correct, {});
        setTimeout(function () { api.next(); }, correct ? 700 : 1150);
      });
      buttons.push(btn);
      answers.appendChild(btn);
    });
    col.appendChild(answers);

    // hopp over
    const skip = el('btn btn--ghost', 'button');
    skip.type = 'button';
    skip.style.alignSelf = 'flex-start';
    skip.textContent = 'Hopp over';
    skip.addEventListener('click', function () {
      if (answered) return;
      answered = true;
      lockAll();
      api.submit(false, {});
      setTimeout(function () { api.next(); }, 250);
    });
    col.appendChild(skip);

    grid.appendChild(col);
    container.appendChild(grid);
  }

  window.TidvisModes.les = {
    flow: 'round',
    needsDirection: true,
    startRound: startRound
  };
})();
