/* modes/para.js — «Para»: eit rutenett der eleven parar saman like tider
   på tvers av representasjonar (analog ↔ digital ↔ tekst). To kolonnar:
   venstre i éi form, høgre dei same tidene i ei anna form, stokka.
   Representasjonane vert vald av brukaren i menyen (session.paraReprs). */
(function () {
  'use strict';

  window.TidvisModes = window.TidvisModes || {};

  function el(cls, tag) {
    const e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    return e;
  }

  function pairCount(level) { return level >= 2 ? 5 : 4; }

  function distinctTimes(level, n, use24) {
    const out = [];
    const seen = {};
    let guard = 0;
    while (out.length < n && guard < 300) {
      guard++;
      const t = use24 ? TidvisTime.randomTime24(level) : TidvisTime.randomTime(level);
      const k = TidvisTime.key(t);
      if (!seen[k]) { seen[k] = true; out.push(t); }
    }
    return out;
  }

  function cardContent(repr, time) {
    if (repr === 'analog') return TidvisGame.renderRepr('analog', time, { size: 94 });
    if (repr === 'digital' || repr === 'digital24') {
      const span = el('mono', 'span');
      span.textContent = TidvisTime.toDigital(time);
      return span;
    }
    const span = el('', 'span');
    span.textContent = TidvisTime.toText(time);
    return span;
  }

  // Vel to representasjonar frå session.paraReprs
  // Unngår kombinasjonen digital ↔ digital24 (same visuell form)
  function pickReprs(paraReprs) {
    const pool = paraReprs && paraReprs.length >= 2 ? paraReprs : ['analog', 'text'];

    if (pool.length === 2) {
      // Berre to vald — bruk dei, men handter digital+digital24-konflikten
      const a = pool[0], b = pool[1];
      if ((a === 'digital' && b === 'digital24') || (a === 'digital24' && b === 'digital')) {
        // Ugyldig par — fall attende til analog + det eine av dei
        return ['analog', a === 'digital24' ? 'digital24' : 'digital'];
      }
      return [a, b];
    }

    // 3–4 vald: stokk og vel to (unngå digital+digital24)
    const shuffled = TidvisTime.shuffle(pool.slice());
    let li = 0, ri = 1;
    // Finn eit gyldig par
    outer: for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const a = shuffled[i], b = shuffled[j];
        if (!((a === 'digital' && b === 'digital24') || (a === 'digital24' && b === 'digital'))) {
          li = i; ri = j;
          break outer;
        }
      }
    }
    return [shuffled[li], shuffled[ri]];
  }

  function startBoard(container, session, api) {
    const n = pairCount(session.level);
    session.total = n;

    const reprs = pickReprs(session.paraReprs);
    const leftRepr = reprs[0], rightRepr = reprs[1];
    const use24 = leftRepr === 'digital24' || rightRepr === 'digital24';
    const times = distinctTimes(session.level, n, use24);

    const leftTimes = times.slice();
    const rightTimes = TidvisTime.shuffle(times.slice());

    const wrap = el('tv-para');
    const colL = el('tv-para__col');
    const colR = el('tv-para__col');

    let selected = null;       // { card, time }
    let busy = false;
    let matched = 0;

    function makeCard(time, repr) {
      const card = el('matchcard', 'button');
      card.type = 'button';
      card.appendChild(cardContent(repr, time));
      card.addEventListener('click', function () {
        if (busy || card.classList.contains('is-matched')) return;
        if (selected && selected.card === card) {
          card.classList.remove('is-selected');
          selected = null;
          return;
        }
        if (!selected) {
          card.classList.add('is-selected');
          selected = { card: card, time: time };
          return;
        }
        // andre kort valt — samanlikn
        const a = selected;
        const correct = TidvisTime.equals(a.time, time);
        if (correct) {
          a.card.classList.remove('is-selected');
          a.card.classList.add('is-matched');
          card.classList.add('is-matched');
          selected = null;
          matched++;
          api.submit(true, {});
          api.advance();
          if (matched >= n) {
            setTimeout(function () { api.finish(); }, 500);
          }
        } else {
          busy = true;
          card.classList.add('is-bad');
          a.card.classList.remove('is-selected');
          a.card.classList.add('is-bad');
          api.submit(false, {});
          setTimeout(function () {
            card.classList.remove('is-bad');
            a.card.classList.remove('is-bad');
            selected = null;
            busy = false;
          }, 650);
        }
      });
      return card;
    }

    for (let i = 0; i < n; i++) {
      colL.appendChild(makeCard(leftTimes[i], leftRepr));
      colR.appendChild(makeCard(rightTimes[i], rightRepr));
    }

    wrap.appendChild(colL);
    wrap.appendChild(colR);
    container.appendChild(wrap);
  }

  window.TidvisModes.para = {
    flow: 'board',
    needsDirection: false,
    startBoard: startBoard
  };
})();
