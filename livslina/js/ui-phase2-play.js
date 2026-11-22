/* Årsavspeling: animert månadssteg, val og trygg vidareføring etter reload. */
window.LL = window.LL || {};
LL.uiPhase2Play = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  let moving = false;
  function render(focusNext = false) {
    const s = LL.state.get(), a = s.adult, r = a.run, ui = LL.uiPhase2;
    if (!r) { ui.open(); return; }
    const pending = LL.phase2Events.pending(s);
    const choiceLog = pending ? null : LL.phase2Events.resolvedNow(s);
    const event = pending || (choiceLog && LL.data.getAdult().events.find(item => item.id === choiceLog.id));
    const month = r.month ? LL.phase2Sim.MONTHS[r.month - 1] : 'Året er klart';
    const root = ui.frame(month + ' · ' + a.age + '–' + (a.age + 1) + ' år', LL.phase2State.label(s, r.plan.routeId));
    const visuals = LL.uiPhase2Visuals;
    const stats = el('div', 'll-adult-play-stats');
    stats.append(ui.stats(s));
    const clock = ui.panel(); clock.classList.add('ll-adult-clock'); clock.setAttribute('aria-label', 'Året ditt');
    clock.append(visuals.yearProgress(r));
    root.append(clock, stats);
    ui.recovery(s, root);
    let next;
    if (!pending) {
      const label = r.month === 0 ? 'Start året' : r.month === 12 ? 'Årsoppgjer' : 'Vidare';
      next = ui.button(label, () => advance(next, root, clock, stats), 'primary');
      next.append(visuals.icon('arrowRight'));
    }
    if (event) {
      const p = ui.panel(); p.classList.add('ll-adult-event');
      const vignette = el('div', 'll-adult-vignette'); vignette.append(LL.artVignette.create(event.art));
      const content = el('div', 'll-adult-event-content');
      content.append(el('h2', 'heading3 no-mt', event.title));
      if (pending) {
        LL.phase2Events.story(s, event).forEach(text => content.append(el('p', '', text)));
        const choices = el('div', 'll-adult-choices');
        event.choices.forEach((choice, index) => {
          const b = ui.button('', () => {
            if (!LL.phase2Events.choose(s, event.id, index)) return;
            ui.save();
            render(true);
          });
          b.classList.add('ll-adult-choice');
          b.append(el('strong', '', choice.label), visuals.effects(choice, s));
          choices.append(b);
        });
        content.append(choices);
      } else {
        const choice = event.choices[choiceLog.choice];
        const receipt = el('div', 'll-adult-receipt'); receipt.setAttribute('role', 'status');
        receipt.append(visuals.icon('check', 28), el('strong', '', choiceLog.choiceLabel || choice?.label || 'Valet ditt'));
        if (choice) receipt.append(visuals.effects(choice, null, choiceLog.delta));
        content.append(receipt, next);
      }
      p.append(vignette, content);
      root.append(p);
    } else {
      root.append(next);
    }
    if (focusNext) next?.focus();
    const recent = s.ledger.filter(entry => entry.phase === 2 && entry.round === 'adult-' + r.year);
    if (recent.length) {
      const details = el('details', 'vp-accordion'); details.append(el('summary', '', 'Månadsoversyn'));
      const body = el('div', 'vp-accordion-body');
      recent.forEach(entry => { const row = el('div', 'll-budget-row'); row.append(el('span', '', entry.month), el('strong', '', LL.util.kr(entry.balance) + ' på konto')); body.append(row); });
      details.append(body); root.append(details);
    }
  }
  async function advance(button, root, clock, stats) {
    const s = LL.state.get();
    const run = s.adult.run;
    if (moving || !run || LL.phase2Events.pending(s)) return;
    moving = true;
    button.disabled = true;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const active = () => root.closest('.screen.active') && LL.state.get() === s &&
      s.adult.run === run && clock.isConnected;
    try {
      while (run.month < 12 && !LL.phase2Events.pending(s)) {
        const monthName = LL.phase2Sim.MONTHS[run.month];
        clock.querySelector('.ll-adult-year-status').textContent = monthName + ' · dagane går';
        clock.querySelectorAll('.ll-adult-month')[run.month].classList.add('is-passing');
        const fill = clock.querySelector('.ll-adult-year-fill');
        fill.getBoundingClientRect();
        fill.style.width = ((run.month + 1) * 100 / 12) + '%';
        if (!reduceMotion) await new Promise(resolve => setTimeout(resolve, 510));
        if (!active()) return;
        LL.phase2Sim.month(s);
        LL.uiPhase2.save();
        clock.replaceChildren(LL.uiPhase2Visuals.yearProgress(run));
        stats.replaceChildren(LL.uiPhase2.stats(s));
      }
      if (run.month === 12 && !LL.phase2Events.pending(s)) LL.phase2Sim.finish(s);
      LL.uiPhase2.save();
      LL.uiPhase2.open();
    } finally {
      moving = false;
      button.disabled = false;
    }
  }
  return { render };
})();
