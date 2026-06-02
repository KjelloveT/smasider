/* modes/still.js — «Still visarane»: ei måltid blir gjeven, eleven dreg
   dei analoge visarane på plass og trykkjer «Sjekk svaret».
   Målformatet (tekst / digital 12t / digital 24t) vel brukaren i menyen. */
(function () {
  'use strict';

  window.TidvisModes = window.TidvisModes || {};

  function el(cls, tag) {
    const e = document.createElement(tag || 'div');
    if (cls) e.className = cls;
    return e;
  }

  function startRound(container, session, api) {
    const targetFmt = session.stillTarget || 'text';
    const use24 = targetFmt === 'digital24';

    // Generer tid i rett domene
    const target = use24
      ? TidvisTime.randomTime24(session.level)
      : TidvisTime.randomTime(session.level);
    session.currentQuestion = { time: target, src: targetFmt, dst: 'analog' };

    const grid = el('tv-game-grid tv-game-grid--still');

    // dragbar urskive
    const stage = el('tv-clockstage');
    const card = el('card');
    card.style.padding = 'clamp(14px,2.5vw,24px)';
    const clock = TidvisClock.analog({
      h: 12, m: 0,
      size: 250,
      draggable: true,
      accent: 'pink',
      snapStep: TidvisTime.snapStep(session.level)
    });
    card.appendChild(clock.el);
    stage.appendChild(card);

    const hint = el('tv-lead');
    hint.style.textAlign = 'center';
    hint.style.fontSize = '13px';
    hint.textContent = 'Dra dei runde knottane til rett stilling.';
    stage.appendChild(hint);
    grid.appendChild(stage);

    // måltid + sjekk
    const col = el('tv-qcol');
    const eyebrow = el('tv-eyebrow muted');
    eyebrow.textContent = 'Still visarane til';
    col.appendChild(eyebrow);

    // Målkort basert på valt format
    if (targetFmt === 'text') {
      // Tekst-plakat med digital hint nedst
      const poster = el('poster');
      poster.style.background = 'var(--teal)';
      const big = el('poster__big');
      big.textContent = TidvisTime.toText(target);
      const sub = el('poster__sub mono');
      sub.textContent = TidvisTime.toDigital(target);
      poster.appendChild(big);
      poster.appendChild(sub);
      col.appendChild(poster);
    } else {
      // Digital 12t eller 24t — berre LCD-display
      const lcdLabel = use24 ? '24T' : '12T';
      col.appendChild(TidvisGame.renderRepr(
        use24 ? 'digital24' : 'digital',
        target,
        { label: lcdLabel }
      ));
    }

    let answered = false;
    const check = el('btn btn--teal btn--lg', 'button');
    check.type = 'button';
    check.appendChild(TidvisIcons.el('check', { size: '1.2em' }));
    check.appendChild(document.createTextNode('Sjekk svaret'));
    check.addEventListener('click', function () {
      if (answered) return;
      answered = true;
      check.disabled = true;
      clock.lock && clock.lock();
      const guess = clock.getTime();
      const correct = TidvisTime.equals(guess, target);
      if (!correct) clock.setTime(target.h % 12 || 12, target.m);
      api.submit(correct, {});
      setTimeout(function () { api.next(); }, correct ? 750 : 1250);
    });
    col.appendChild(check);

    grid.appendChild(col);
    container.appendChild(grid);
  }

  window.TidvisModes.still = {
    flow: 'round',
    needsDirection: false,
    startRound: startRound
  };
})();
