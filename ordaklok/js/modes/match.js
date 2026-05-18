/* Ordaklok — modus: matching (par opp ord) */
(function (root) {
  'use strict';

  const State = OrdaklokState;
  const Storage = OrdaklokStorage;
  const Leitner = OrdaklokLeitner;

  function build(list, queue, options, callbacks) {
    let mountEl = null;
    let started = 0;
    let mistakes = 0;
    let matched = 0;
    let selectedA = null; // { btn, pairIdx }
    let selectedB = null;
    let busy = false;
    let pairsForRound = [];

    function render(host) {
      mountEl = document.createElement('div');
      host.appendChild(mountEl);

      // Bruk queue.length pair (allereie filtrert til ønskt count)
      pairsForRound = queue.map(q => ({ idx: q.idx }));
      started = Date.now();

      const wrap = document.createElement('div');
      wrap.className = 'box2';

      const intro = document.createElement('p');
      intro.className = 'muted center';
      intro.textContent = `Klikk eitt ord frå ${list.labelA} og det tilhøyrande ordet frå ${list.labelB}.`;
      wrap.appendChild(intro);

      const grid = document.createElement('div');
      grid.className = 'match-grid';

      const colA = document.createElement('div');
      colA.className = 'match-col';
      const colB = document.createElement('div');
      colB.className = 'match-col';

      const aHeader = document.createElement('div');
      aHeader.className = 'prompt-label center';
      aHeader.textContent = list.labelA;
      colA.appendChild(aHeader);

      const bHeader = document.createElement('div');
      bHeader.className = 'prompt-label center';
      bHeader.textContent = list.labelB;
      colB.appendChild(bHeader);

      const shuffledA = State.shuffle(pairsForRound);
      const shuffledB = State.shuffle(pairsForRound);

      shuffledA.forEach(p => {
        const btn = makeCard(list.pairs[p.idx].a, p.idx, 'A');
        colA.appendChild(btn);
      });
      shuffledB.forEach(p => {
        const btn = makeCard(list.pairs[p.idx].b, p.idx, 'B');
        colB.appendChild(btn);
      });

      grid.appendChild(colA);
      grid.appendChild(colB);
      wrap.appendChild(grid);

      mountEl.appendChild(wrap);
    }

    function makeCard(text, pairIdx, side) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'match-card';
      btn.textContent = text;
      btn.dataset.pairIdx = pairIdx;
      btn.dataset.side = side;
      btn.addEventListener('click', () => clickCard(btn, pairIdx, side));
      return btn;
    }

    function clickCard(btn, pairIdx, side) {
      if (busy) return;
      if (btn.classList.contains('matched')) return;
      if (side === 'A') {
        if (selectedA) selectedA.btn.classList.remove('selected');
        selectedA = { btn, pairIdx };
      } else {
        if (selectedB) selectedB.btn.classList.remove('selected');
        selectedB = { btn, pairIdx };
      }
      btn.classList.add('selected');

      if (selectedA && selectedB) {
        attemptMatch();
      }
    }

    function attemptMatch() {
      const a = selectedA, b = selectedB;
      const correct = a.pairIdx === b.pairIdx;
      busy = true;
      if (correct) {
        a.btn.classList.remove('selected'); b.btn.classList.remove('selected');
        a.btn.classList.add('matched'); b.btn.classList.add('matched');
        matched++;
        // Leitner: rett (manuelt for match-mode)
        const leitnerData = Storage.getLeitner(list.id);
        Leitner.recordResult(leitnerData, a.pairIdx, true);
        Storage.setLeitner(list.id, leitnerData);
        // Gje også beskjed til game-orchestrator (men den hopper over Leitner-oppdatering for match)
        callbacks.onResult(a.pairIdx, { correct: true, peeked: false, time: 0 });
        selectedA = null; selectedB = null;
        busy = false;
        callbacks.onAdvance && callbacks.onAdvance();
        if (matched === pairsForRound.length) {
          const totalTime = Math.round((Date.now() - started) / 1000);
          callbacks.onFinish && callbacks.onFinish({ totalTime, mistakes });
        }
      } else {
        mistakes++;
        // Leitner: feil for begge involverte
        const leitnerData = Storage.getLeitner(list.id);
        Leitner.recordResult(leitnerData, a.pairIdx, false);
        if (a.pairIdx !== b.pairIdx) Leitner.recordResult(leitnerData, b.pairIdx, false);
        Storage.setLeitner(list.id, leitnerData);
        callbacks.onResult(a.pairIdx, { correct: false, peeked: false, time: 0 });
        a.btn.classList.add('flash-wrong'); b.btn.classList.add('flash-wrong');
        setTimeout(() => {
          a.btn.classList.remove('flash-wrong', 'selected');
          b.btn.classList.remove('flash-wrong', 'selected');
          selectedA = null; selectedB = null;
          busy = false;
        }, 600);
      }
    }

    return { render };
  }

  root.OrdaklokModeMatch = {
    id: 'match',
    label: 'Matching',
    description: 'Par opp ord frå begge sider mot klokka. Færre feil og kortare tid gjev høgare score.',
    icon: OrdaklokState.ICONS.grid,
    supportsLeitner: false, // vi gjer Leitner sjølv her, sidan det er fleire klikk per "spørsmål"
    mount(host, ctx) {
      const m = build(ctx.list, ctx.queue, ctx.options, ctx.callbacks);
      m.render(host);
      this._unmount = () => { host.innerHTML = ''; };
    },
    unmount() { if (this._unmount) this._unmount(); }
  };
})(window);
