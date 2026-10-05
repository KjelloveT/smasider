/* Livslina — ui-playback.js
 * Avspeling av eit halvår, månad for månad. Hendingar (M4) skyt inn mellom
 * månadene via LL.events.checkMonth (om modulen finst).
 */
window.LL = window.LL || {};

LL.uiPlayback = (function () {
  'use strict';

  let ctx = null;
  let monthIdx = 0;
  let timer = null;
  const STEP_MS = 2200;

  function startTerm() {
    const state = LL.state.get();
    state.age = LL.state.currentRound().age;
    ctx = LL.sim.beginTerm(state);
    if (LL.events && LL.events.prepareTerm) LL.events.prepareTerm(state, ctx);
    monthIdx = 0;
    renderShell();
    LL.main.showScreen('screen-playback');
    LL.util.hydrate(document.getElementById('screen-playback'));
    scheduleNext(600);
  }

  function renderShell() {
    const state = LL.state.get();
    document.getElementById('pbRound').textContent = ctx.round.label;
    document.getElementById('pbFigure').replaceChildren(LL.artCharacter.createCanvas(state.character, {
      className: 'll-character-canvas ll-character-canvas--portrait',
      label: 'Figuren din', width: 192, height: 288
    }));
    document.getElementById('pbMonth').textContent = 'Gjer klar…';
    document.getElementById('pbBalance').textContent = LL.util.kr(state.stats.money);
    document.getElementById('pbLedger').textContent = '';
    renderCalendar();
    if (ctx.grant) {
      addLedgerLine('Utstyrsstipend', ctx.grant, false);
    }
  }

  function scheduleNext(ms) {
    timer = setTimeout(tick, ms == null ? STEP_MS : ms);
  }

  function tick() {
    const state = LL.state.get();
    if (monthIdx >= (ctx.round.months || 6)) { finishTerm(); return; }

    const entry = LL.sim.stepMonth(state, ctx, monthIdx);
    document.getElementById('pbMonth').textContent = entry.month;
    document.getElementById('pbMonthProgress').textContent =
      'Månad ' + (monthIdx + 1) + ' av ' + (ctx.round.months || 6) + ' i ' + ctx.round.label + '.';
    animateBalance(entry.balance);
    addLedgerLine(entry.month, entry.income - entry.expense, (entry.income - entry.expense) < 0, true);

    monthIdx++;
    setCalendarMonth(monthIdx - 1);

    // Hendingssjekk (M4). Om ein hending blir vist, ventar vi på resume.
    if (LL.events && LL.events.checkMonth) {
      LL.events.checkMonth(state, ctx, monthIdx, () => scheduleNext());
    } else {
      scheduleNext();
    }
  }

  function finishTerm() {
    const state = LL.state.get();
    completeCalendar();
    const summary = LL.sim.endTerm(state, ctx);
    // Avanser med det same, slik at ein reload på oppgjer-skjermen ikkje kan
    // køyre same halvåret på nytt. Oppgjeret er reint informativt etterpå.
    LL.sim.advance(state);
    LL.storage.saveActive(state);
    LL.uiReport.showHalfyear(summary);
  }

  function renderCalendar() {
    const wrap = document.getElementById('pbCalendarMonths');
    const status = document.getElementById('pbCalendarStatus');
    wrap.replaceChildren();
    status.textContent = 'Ventar på skulestart';
    ctx.monthNames.forEach((name, idx) => {
      const card = document.createElement('div');
      card.className = 'll-calendar-month is-upcoming';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', name + ', kjem seinare');
      const head = document.createElement('div');
      head.className = 'll-calendar-month-head';
      const title = document.createElement('strong');
      title.textContent = name;
      const events = (ctx.eventSchedule && ctx.eventSchedule[idx + 1] || []).length;
      const badge = document.createElement('span');
      badge.textContent = events ? (events === 1 ? '1 hending' : events + ' hendingar') : '';
      head.append(title, badge);
      const days = document.createElement('div');
      days.className = 'll-calendar-days';
      days.setAttribute('aria-hidden', 'true');
      for (let day = 1; day <= 28; day++) {
        const date = document.createElement('span');
        date.textContent = String(day);
        days.appendChild(date);
      }
      card.append(head, days);
      wrap.appendChild(card);
    });
  }

  function setCalendarMonth(index) {
    const wrap = document.getElementById('pbCalendarMonths');
    const status = document.getElementById('pbCalendarStatus');
    Array.from(wrap.children).forEach((card, idx) => {
      card.classList.remove('is-current', 'is-done', 'is-upcoming', 'arriving');
      card.removeAttribute('aria-current');
      if (idx < index) {
        card.classList.add('is-done');
        card.setAttribute('aria-label', ctx.monthNames[idx] + ', gjennomført');
      } else if (idx === index) {
        card.classList.add('is-current');
        card.setAttribute('aria-current', 'step');
        card.setAttribute('aria-label', ctx.monthNames[idx] + ', noverande månad');
      } else {
        card.classList.add('is-upcoming');
        card.setAttribute('aria-label', ctx.monthNames[idx] + ', kjem seinare');
      }
    });
    const current = wrap.children[index];
    if (current) {
      void current.offsetWidth;
      current.classList.add('arriving');
    }
    status.textContent = 'Månad ' + (index + 1) + ' av ' + ctx.monthNames.length + ': ' + ctx.monthNames[index] + '.';
  }

  function completeCalendar() {
    const wrap = document.getElementById('pbCalendarMonths');
    Array.from(wrap.children).forEach((card, idx) => {
      card.classList.remove('is-current', 'is-upcoming', 'arriving');
      card.classList.add('is-done');
      card.removeAttribute('aria-current');
      card.setAttribute('aria-label', ctx.monthNames[idx] + ', gjennomført');
    });
    document.getElementById('pbCalendarStatus').textContent = 'Halvåret er ferdig';
  }

  // ── Visuelle hjelparar ──
  function animateBalance(target) {
    const el = document.getElementById('pbBalance');
    const start = parseNum(el.textContent);
    const t0 = performance.now();
    const dur = 700;
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const v = start + (target - start) * (1 - Math.pow(1 - p, 3));
      el.textContent = LL.util.kr(v);
      el.classList.toggle('neg', v < 0);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function parseNum(s) { return parseInt(s.replace(/[^\d-−]/g, '').replace('−', '-'), 10) || 0; }

  function addLedgerLine(label, delta, neg, isMonth) {
    const wrap = document.getElementById('pbLedger');
    const div = document.createElement('div');
    div.className = 'll-pb-line';
    const l = document.createElement('span'); l.textContent = label;
    const v = document.createElement('strong');
    v.textContent = (delta >= 0 ? '+' : '') + LL.util.kr(delta);
    if (neg) v.classList.add('neg');
    div.append(l, v);
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
  }

  // Kalla av events.js etter at ein hending er handtert, for å halde fram
  function resume() { scheduleNext(400); }

  function init() { /* ingen faste lyttarar */ }

  return { init, startTerm, resume, addLedgerLine };
})();
