/* Årsplan med retning, bustad, tidsbruk, konti og to fordelte mål. */
window.LL = window.LL || {};
LL.uiPhase2Plan = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  function field(label, control, help) {
    const wrap = el('label', 'vp-field ll-adult-field');
    wrap.append(el('span', '', label), control);
    if (help) wrap.append(el('small', 'vp-help', help));
    return wrap;
  }
  function select(id, options, value) {
    const input = el('select', 'vp-input'); input.id = id;
    options.forEach(([key, text, disabled]) => { const option = el('option', '', text); option.value = key; option.disabled = Boolean(disabled); input.append(option); });
    input.value = String(value); return input;
  }
  function number(id, value, max, step) {
    const input = el('input', 'vp-input'); input.type = 'number'; input.id = id;
    input.min = '0'; input.max = String(max); input.step = String(step || 1); input.value = String(value); input.required = true; return input;
  }
  function open() {
    const s = LL.state.get(), a = s.adult, d = LL.data.getAdult(), ui = LL.uiPhase2;
    if (a.run || a.complete) { ui.open(); return; }
    let initial;
    try { initial = LL.phase2Economy.normalizePlan(s, a.draft ? a.draft.plan : a.plan || LL.phase2Economy.defaultPlan(s)); }
    catch (_) { initial = LL.phase2Economy.defaultPlan(s); }
    const root = ui.frame('Årsplan · ' + a.age + '–' + (a.age + 1) + ' år', 'August–juli');
    const form = el('form', 'll-adult-stack');
    const routePanel = ui.panel('Vel retning og bustad');
    const route = select('adultRoute', d.routes.map(r => [r.id, LL.phase2State.label(s, r.id) + (!LL.phase2State.available(s, r) ? ' · manglar opptaksgrunnlag' : ''), !LL.phase2State.available(s, r)]), initial.routeId);
    const home = select('adultHousing', d.housing.map(h => [h.id, h.label]), initial.housing);
    const routeNote = el('div', 'll-adult-route-preview'), homeNote = el('p', 'll-note');
    routePanel.append(field('Retning', route), routeNote, field('Bustad', home), homeNote);
    form.append(routePanel);
    const daily = ui.panel('Arbeid og kvardagsrytme');
    const hours = select('adultJobHours', [[0, 'Ingen deltidsjobb'], [6, '6 timar i veka'], [12, '12 timar i veka']], initial.jobHours);
    const percent = select('adultWorkPercent', [[0.5, '50 %'], [0.8, '80 %'], [1, '100 %']], initial.workPercent);
    const summer = select('adultSummer', [[0, 'Ingen sommarjobb'], [2, '2 veker'], [4, '4 veker'], [6, '6 veker']], initial.summerWeeks);
    const leisure = select('adultLeisure', [['quiet', 'Kvile'], ['balanced', 'Balanse'], ['social', 'Sosialt']], initial.leisure);
    const hoursWrap = field('Deltidsjobb', hours, '12 timar gir mindre rom for studiet.');
    const percentWrap = field('Stillingsprosent', percent);
    const summerWrap = field('Sommarjobb · juni–juli', summer);
    const timeNote = el('p', 'll-note');
    daily.append(hoursWrap, percentWrap, summerWrap, field('Fritid', leisure), timeNote); form.append(daily);
    const finance = ui.panel('Sparing og finansiering');
    const borrow = el('input'); borrow.type = 'checkbox'; borrow.id = 'adultBorrow'; borrow.checked = initial.borrow;
    const borrowWrap = field('Studentlån frå Lånekassen', borrow, 'Lån aukar gjelda. Stipend krev oppfylte vilkår.');
    route.addEventListener('change', () => { if (LL.phase2State.route(route.value).kind === 'study') borrow.checked = true; });
    const savings = number('adultSavings', initial.savings, 10000, 100);
    const bsu = number('adultBsu', initial.bsu, 2250, 50);
    const debt = number('adultDebt', initial.extraDebt || 0, 5000, 100);
    finance.append(borrowWrap, field('Fri sparing · kr/mnd', savings), field('BSU · kr/mnd', bsu, 'Bundne bustadpengar.'), field('Ekstra nedbetaling · kr/mnd', debt));
    const terms = el('details', 'vp-accordion'); terms.append(el('summary', '', 'Lån og sparing: vilkår'));
    const termsBody = el('div', 'vp-accordion-body'); termsBody.append(el('p', '', 'Stipend krev bestått utdanning og vilkår om bustad, inntekt og formue. BSU har grenser per kalenderår og totalt. Sparing skjer berre når kontoen har dekning.'));
    terms.append(termsBody); finance.append(terms);
    form.append(finance);
    const goalPanel = ui.panel('Måla du vil arbeide mot');
    goalPanel.append(el('p', 'll-note', 'Fordel sparinga mellom måla · maks 100 %.'));
    const previousGoals = a.draft ? a.draft.goals : a.goals;
    const goalFields = [0, 1].map(index => {
      const g = previousGoals[index] || { id: index ? '' : 'buffer', target: index ? 150000 : 30000, deadline: a.age + 3, share: index ? 0 : 100 };
      const row = el('fieldset', 'vp-field ll-adult-goal-editor'); row.append(el('legend', '', index ? 'Mindre mål · valfritt' : 'Hovudmål'));
      const choice = select('adultGoal' + index, [['', 'Ingen mål no'], ...d.goals.map(x => [x.id, x.label])], g.id);
      const target = number('adultGoalTarget' + index, g.target, 1000000, 1); target.min = '1';
      const deadline = number('adultGoalAge' + index, Math.max(a.age + 1, g.deadline), 40); deadline.min = String(a.age + 1);
      const share = number('adultGoalShare' + index, g.share, 100, 5);
      row.append(field('Mål', choice), field('Sum / nivå', target), field('Alder ved målet', deadline), field('Del av fri sparing · %', share));
      choice.addEventListener('change', () => { const def = d.goals.find(x => x.id === choice.value); if (def) target.value = def.defaultTarget; update(); });
      goalPanel.append(row); return { choice, target, deadline, share, baseline: g.baseline, studyRouteId: g.routeId };
    });
    form.append(goalPanel);
    const preview = ui.panel('Venta økonomi gjennom året'); preview.setAttribute('aria-live', 'polite');
    const expenses = el('details', 'vp-accordion');
    const expenseRows = el('div', 'vp-accordion-body');
    expenses.append(el('summary', '', 'Utgifter i august'), expenseRows);
    const error = el('p', 'vp-help'); error.setAttribute('role', 'alert');
    const start = ui.button('Start året', () => {}, 'primary'); start.type = 'submit'; start.append(LL.uiPhase2Visuals.icon('arrowRight'));
    form.append(preview, expenses, error, start, ui.button('Til oversikta', ui.home, 'quiet'));
    root.append(form);
    function read() {
      return { routeId: route.value, housing: home.value, jobHours: Number(hours.value), workPercent: Number(percent.value), summerWeeks: Number(summer.value), leisure: leisure.value,
        borrow: borrow.checked, savings: Number(savings.value), bsu: Number(bsu.value), extraDebt: Number(debt.value) };
    }
    function readGoals() {
      const current = LL.phase2State.route(route.value);
      return goalFields.filter(g => g.choice.value).map(g => ({ id: g.choice.value, routeId: g.choice.value === 'utdanning' ? (current.years ? current.id : g.studyRouteId) : null, target: Number(g.target.value), deadline: Number(g.deadline.value), share: Number(g.share.value), baseline: g.baseline }));
    }
    function update() {
      const draft = read();
      const item = LL.phase2State.route(draft.routeId);
      const studying = LL.phase2State.isStudying(s, draft);
      hoursWrap.hidden = !studying; summerWrap.hidden = !studying; percentWrap.hidden = studying;
      borrowWrap.hidden = !studying || item.kind === 'bridge';
      const studyYears = LL.phase2State.progress(s, item.id).years;
      goalFields.forEach(g => {
        g.target.disabled = g.choice.value === 'utdanning';
        if (g.choice.value === 'utdanning') g.target.value = item.years || (LL.phase2State.route(g.studyRouteId) || {}).years || (a.qualifications.study ? 3 : 1);
        g.share.disabled = !['buffer', 'bustad', 'flytting'].includes(g.choice.value);
      });
      routeNote.replaceChildren();
      const vignette = el('div', 'll-adult-route-art'); vignette.append(LL.artVignette.create(item.art)); routeNote.append(vignette);
      if (studying) routeNote.append(LL.uiPhase2Visuals.studySteps(s, item));
      if (a.routeId && a.routeId !== item.id && studying) routeNote.append(el('p', 'll-note', studyYears ? 'Du held fram der du slapp.' : 'Nytt studium startar på år 1. Tidlegare framdrift er lagra.'));
      const studentOption = Array.from(home.options).find(o => o.value === 'hybel'); studentOption.disabled = !studying;
      if (!studying && home.value === 'hybel') { home.value = 'kollektiv'; draft.housing = 'kollektiv'; }
      const housing = d.housing.find(h => h.id === home.value);
      homeNote.textContent = LL.util.kr(housing.rent + housing.utilities) + '/mnd · ' + (home.value === 'heime' ? 'bustadbidrag. Familien dekkjer fellesutgiftene og delar av maten.' : 'leige og straum');
      timeNote.hidden = item.kind !== 'gap';
      timeNote.textContent = 'Stillingsprosenten gjeld arbeidsmengda i friårssporet.';
      preview.replaceChildren(el('h2', 'heading4 no-mt', 'Venta økonomi gjennom året'));
      try {
        const estimate = LL.phase2Economy.preview(s, draft);
        preview.append(LL.uiPhase2Visuals.moneyFlow([['Arbeidsinntekt', estimate.wage], ['Studentlån', estimate.loan, 'bookOpen'], ['Påbyggstøtte', estimate.bridge, 'bookOpen'], ['Utgifter og skatt', estimate.expense]]));
        const values = [['Til overs før sparing og nedbetaling', estimate.available], ['Sparing og ekstra nedbetaling', estimate.saved], ['Konto etter flytting og byte', estimate.firstCash]];
        values.forEach(([label, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', label), el('strong', '', LL.util.kr(value))); preview.append(row); });
        if (estimate.move.deposit) {
          const deposit = LL.util.kr(estimate.move.deposit) + ' depositum';
          preview.append(LL.uiPhase2Visuals.token('lock', deposit, deposit + ' bunde ved flytting'));
        }
        const firstMonth = LL.phase2Economy.breakdown(s, estimate.plan, 0);
        expenseRows.replaceChildren(...Object.entries(firstMonth.expenses).filter(([, value]) => value).map(([key, value]) => {
          const row = el('div', 'll-budget-row');
          row.append(el('span', '', LL.economy.label(key)), el('strong', '', LL.util.kr(value)));
          return row;
        }));
        expenses.hidden = false;
        preview.append(el('p', 'll-note', 'Spelanslag · hendingar, renter og endeleg skatt kan endre tala.'));
        const selected = readGoals();
        const share = selected.reduce((sum, g) => sum + (d.goals.find(x => x.id === g.id).kind === 'money' ? g.share : 0), 0);
        const duplicate = selected.length > 1 && selected[0].id === selected[1].id;
        const needsDeposit = estimate.firstCash < 0 && estimate.move.deposit > estimate.move.returned;
        error.textContent = duplicate ? 'Vel to ulike mål.' : share > 100 ? 'Fordelinga av fri sparing kan høgst vere 100 %.' : needsDeposit ? 'Flytting krev meir pengar no. Hent fri buffer frå oversikta eller vel eit rimelegare bustadval.' : '';
        start.disabled = Boolean(error.textContent);
        if (estimate.firstCash < 0) preview.append(ui.button('Til kontoen og fri buffer', ui.home));
        a.draft = { plan: estimate.plan, goals: selected }; ui.save();
      } catch (e) {
        error.textContent = e.message;
        expenses.hidden = true;
        start.disabled = true;
      }
    }
    form.addEventListener('change', update);
    form.addEventListener('input', event => { if (event.target.type === 'number') update(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      try {
        if (start.disabled || !form.reportValidity()) return;
        LL.phase2Sim.begin(s, read(), readGoals()); delete a.draft; ui.save(); LL.uiPhase2Play.render();
      } catch (e) { error.textContent = e.message; }
    });
    update();
  }
  return { open };
})();
