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
    root.append(ui.stats(s));
    const clock = ui.panel('Året ditt');
    const progress = el('progress'); progress.max = 12; progress.value = r.month; progress.setAttribute('aria-label', 'Månader gjennomførte');
    clock.append(progress, el('p', 'll-note', r.month + ' av 12 månader gjennomførte · ' + r.resolved.length + ' av ' + r.schedule.length + ' caseval tekne. Året blir lagra etter kvart steg.'));
    root.append(clock);
    ui.recovery(s, root);
    if (event) {
      const p = ui.panel(event.title);
      p.append(el('p', '', event.text));
      const choices = el('div', 'll-adult-choices');
      event.choices.forEach((choice, index) => {
        const b = ui.button('', () => {
          if (!LL.phase2Events.choose(s, event.id, index)) return;
          ui.save();
          const effect = ui.panel('Valet er registrert');
          effect.append(el('p', '', choice.label), el('p', 'll-note', LL.phase2Events.consequence(choice)));
          choices.replaceChildren(); b.disabled = true; p.replaceChildren(effect);
          root.append(ui.button('Hald fram gjennom året', advance, 'primary'));
        });
        b.classList.add('ll-adult-choice'); b.append(el('strong', '', choice.label), el('small', '', LL.phase2Events.consequence(choice)));
        choices.append(b);
      });
      p.append(choices, el('p', 'll-note', 'Tilbod, kollegastøtte, rettleiing og kvardagsvilkår påverkar trivselen. Yrkesnamnet gir ingen fast bonus.'));
      root.append(p);
    } else root.append(ui.button(r.month === 12 ? 'Sjå årsoppgjeret' : 'Hald fram til neste hending', advance, 'primary'));
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
