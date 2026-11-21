/* Manuell årsavspeling: val, konsekvensar og trygg vidareføring etter reload. */
window.LL = window.LL || {};
LL.uiPhase2Play = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  function render() {
    const s = LL.state.get(), a = s.adult, r = a.run, ui = LL.uiPhase2;
    if (!r) { ui.open(); return; }
    const event = LL.phase2Events.pending(s);
    const month = r.month ? LL.phase2Sim.MONTHS[r.month - 1] : 'Året er klart';
    const root = ui.frame(month + ' · ' + a.age + '–' + (a.age + 1) + ' år', LL.phase2State.label(s, r.plan.routeId));
    const visuals = LL.uiPhase2Visuals;
    const stats = el('div');
    stats.append(ui.stats(s));
    root.append(stats);
    const clock = ui.panel(); clock.setAttribute('aria-label', 'Året ditt');
    clock.append(visuals.year(r));
    root.append(clock);
    ui.recovery(s, root);
    if (event) {
      const p = ui.panel(); p.classList.add('ll-adult-event');
      const vignette = el('div', 'll-adult-vignette'); vignette.append(LL.artVignette.create(event.art));
      const content = el('div', 'll-adult-event-content');
      content.append(el('h2', 'heading3 no-mt', event.title));
      if (event.text) content.append(el('p', '', event.text));
      const choices = el('div', 'll-adult-choices');
      event.choices.forEach((choice, index) => {
        const signals = visuals.effects(choice, s);
        const b = ui.button('', () => {
          if (!LL.phase2Events.choose(s, event.id, index)) return;
          ui.save();
          const receipt = el('div', 'll-adult-receipt'); receipt.setAttribute('role', 'status');
          receipt.append(visuals.icon('check', 28), el('strong', '', choice.label), signals);
          const next = ui.button('Vidare', advance, 'primary'); next.append(visuals.icon('arrowRight'));
          content.replaceChildren(el('h2', 'heading3 no-mt', event.title), receipt, next);
          stats.replaceChildren(ui.stats(s)); clock.replaceChildren(visuals.year(r)); next.focus();
        });
        b.classList.add('ll-adult-choice'); b.append(el('strong', '', choice.label), signals);
        choices.append(b);
      });
      content.append(choices); p.append(vignette, content);
      root.append(p);
    } else {
      let label = 'Vidare';
      if (r.month === 0) label = 'Start året';
      if (r.month === 12) label = 'Årsoppgjer';
      const next = ui.button(label, advance, 'primary');
      next.append(visuals.icon('arrowRight'));
      root.append(next);
    }
    const recent = s.ledger.filter(entry => entry.phase === 2 && entry.round === 'adult-' + r.year);
    if (recent.length) {
      const details = el('details', 'vp-accordion'); details.append(el('summary', '', 'Månadsoversyn'));
      const body = el('div', 'vp-accordion-body');
      recent.forEach(entry => { const row = el('div', 'll-budget-row'); row.append(el('span', '', entry.month), el('strong', '', LL.util.kr(entry.balance) + ' på konto')); body.append(row); });
      details.append(body); root.append(details);
    }
  }
  function advance() {
    const s = LL.state.get();
    LL.phase2Sim.advance(s); LL.uiPhase2.save(); LL.uiPhase2.open();
  }
  return { render, advance };
})();
