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
  function arrow(icon, label) {
    const button = el('button', 'vp-button vp-button--icon vp-button--compact');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.append(LL.uiPhase2Visuals.icon(icon, 18));
    return button;
  }
  function addStep(tabs, box, id, label, panel) {
    const tab = el('button', 'vp-button vp-button--tool vp-button--compact');
    tab.type = 'button';
    tab.id = id + 'Tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', id);
    const mark = LL.uiPhase2Visuals.icon('check', 18);
    mark.classList.add('vp-selection-mark');
    tab.append(mark, label);
    panel.id = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tabs.append(tab);
    box.append(panel);
  }
  function open() {
    const s = LL.state.get(), a = s.adult, d = LL.data.getAdult(), ui = LL.uiPhase2, guide = LL.uiPhase2Guide;
    if (a.run || a.complete) { ui.open(); return; }
    let initial;
    try { initial = LL.phase2Economy.normalizePlan(s, a.draft ? a.draft.plan : a.plan || LL.phase2Economy.defaultPlan(s)); }
    catch (_) { initial = LL.phase2Economy.defaultPlan(s); }
    const tabs = el('div', 'll-plan-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Delar av årsplanen');
    const root = ui.frame('Årsplan', a.age + '–' + (a.age + 1) + ' år · August–juli', tabs);
    const form = el('form', 'll-adult-stack');
    form.noValidate = true;
    const box = ui.panel();
    const category = el('h2', 'heading4', 'Retning');
    category.tabIndex = -1;
    category.setAttribute('aria-live', 'polite');
    const previous = arrow('arrowLeft', 'Førre del av planen');
    const next = arrow('arrowRight', 'Neste del av planen');
    const bar = el('div', 'll-plan-step-bar');
    bar.append(previous, category, next);
    box.append(bar);

    const routePanel = el('div');
    const housingPanel = el('div');
    const route = guide.routeSelect(s, d.routes, initial.routeId);
    const home = select('adultHousing', d.housing.map(h => [h.id, h.label]), initial.housing);
    const routeNote = el('div', 'll-adult-route-preview'), homeNote = el('div');
    const routeType = el('div');
    const routeFields = el('div', 'll-adult-route-fields');
    routeFields.append(field('Retning', route), routeType);
    const routeDescription = el('p', 'll-note');
    const admission = el('div');
    routePanel.append(routeFields, routeDescription, routeNote, guide.comparison(s, d.routes), admission);
    housingPanel.append(field('Bustad', home), homeNote);
    const daily = el('div');
    const hours = select('adultJobHours', [[0, 'Ingen deltidsjobb'], [6, '6 timar i veka'], [12, '12 timar i veka']], initial.jobHours);
    const percent = select('adultWorkPercent', [[0.5, '50 %'], [0.8, '80 %'], [1, '100 %']], initial.workPercent);
    const summer = select('adultSummer', [[0, 'Ingen sommarjobb'], [2, '2 veker'], [4, '4 veker'], [6, '6 veker']], initial.summerWeeks);
    const leisure = select('adultLeisure', [['quiet', 'Kvile'], ['balanced', 'Balanse'], ['social', 'Sosialt']], initial.leisure);
    const hoursWrap = field('Deltidsjobb', hours, '12 timar gir mindre rom for studiet.');
    const percentWrap = field('Stillingsprosent', percent);
    const summerWrap = field('Sommarjobb · juni–juli', summer);
    const timeNote = el('p', 'll-note');
    daily.append(hoursWrap, percentWrap, summerWrap, field('Fritid', leisure), timeNote);
    const finance = el('div');
    const borrow = el('input'); borrow.type = 'checkbox'; borrow.id = 'adultBorrow'; borrow.checked = initial.borrow;
    const borrowWrap = field('Studentlån frå Lånekassen', borrow, 'Lån aukar gjelda. Stipend krev oppfylte vilkår.');
    route.addEventListener('change', () => { if (LL.phase2State.route(route.value).kind === 'study') borrow.checked = true; });
    const savings = number('adultSavings', initial.savings, 10000, 100);
    const bsu = number('adultBsu', initial.bsu, 2250, 50);
    const debt = number('adultDebt', initial.extraDebt || 0, 5000, 100);
    const bsuNote = el('p', 'll-note');
    finance.append(borrowWrap, field('Fri sparing · kr/mnd', savings, 'Desse pengane kan du bruke som buffer til uventa utgifter.'),
      field('BSU · kr/mnd', bsu, 'Bustadsparing for ungdom. Pengane er bundne til eigen bustad og kan til dømes bli eigenkapital når du kjøper.'), bsuNote,
      field('Ekstra nedbetaling · kr/mnd', debt, 'Går til kredittgjeld og studielån.'));
    const terms = el('details', 'vp-accordion'); terms.append(el('summary', '', 'Vilkår for lån og BSU'));
    const termsBody = el('div', 'vp-accordion-body');
    const rates = d.rates;
    const bsuSource = el('a', '', 'Les om BSU hos Skatteetaten');
    bsuSource.href = d.sources.find(source => source.id === 'bsu').url;
    bsuSource.target = '_blank'; bsuSource.rel = 'noopener noreferrer';
    termsBody.append(
      el('p', '', 'Stipend krev bestått utdanning og vilkår om bustad, inntekt og formue.'),
      el('p', '', 'Du kan setje inn ' + LL.util.kr(rates.bsuAnnual) + ' per kalenderår og ' + LL.util.kr(rates.bsuTotal) +
        ' totalt. Innbetaling kan gi 10 % skattefrådrag dersom du har skatt å trekkje frå i og ikkje eig bustad ved årsskiftet. Eit innskot på 6 000 kr kan gi opptil 600 kr mindre i skatt.'),
      bsuSource
    );
    terms.append(termsBody); finance.append(terms);
    const goalPanel = el('div', 'll-adult-stack');
    goalPanel.append(el('p', 'll-note', 'Vel noko du vil oppnå og alderen du vil prøve å nå det innan. Ein buffer er pengar du legg til side for uventa rekningar.'),
      el('p', 'll-note', 'Vel kor stor del av dei frie sparepengane som skal telje mot kvart pengemål. Med 500 kr i månadleg sparing tel 60 % som 300 kr til målet. Summen kan vere høgst 100 %.'));
    const previousGoals = a.draft ? a.draft.goals : a.goals;
    const goalFields = [0, 1].map(index => {
      const g = previousGoals[index] || { id: index ? '' : 'buffer', target: index ? 150000 : 30000, deadline: a.age + 3, share: index ? 0 : 100 };
      const row = el('fieldset', 'vp-field ll-adult-goal-editor');
      if (index) row.setAttribute('aria-label', 'Mindre mål');
      else row.append(el('legend', '', 'Hovudmål'));
      const choice = select('adultGoal' + index, [['', 'Ingen mål no'], ...d.goals.map(x => [x.id, x.label])], g.id);
      const target = number('adultGoalTarget' + index, g.target, 1000000, 1); target.min = '1';
      const deadline = number('adultGoalAge' + index, Math.max(a.age + 1, g.deadline), 40); deadline.min = String(a.age + 1);
      const share = number('adultGoalShare' + index, g.share, 100, 5);
      const targetField = field('Målsum · kr', target);
      row.append(field('Mål', choice), targetField, field('Alder ved målet', deadline), field('Del av fri sparing · %', share));
      choice.addEventListener('change', () => { const def = d.goals.find(x => x.id === choice.value); if (def) target.value = def.defaultTarget; update(); });
      if (index) {
        const optional = el('details', 'vp-accordion');
        optional.open = Boolean(g.id);
        const body = el('div', 'vp-accordion-body');
        body.append(row);
        optional.append(el('summary', '', 'Mindre mål · valfritt'), body);
        goalPanel.append(optional);
      } else {
        goalPanel.append(row);
      }
      return { choice, target, targetLabel: targetField.firstElementChild, deadline, share, baseline: g.baseline, studyRouteId: g.routeId };
    });
    const budgetPanel = el('div', 'll-adult-stack');
    const preview = el('div'); preview.setAttribute('aria-live', 'polite');
    const expenses = el('details', 'vp-accordion');
    const expenseRows = el('div', 'vp-accordion-body');
    expenses.append(el('summary', '', 'Utgifter i august'), expenseRows);
    const error = el('p', 'vp-help'); error.setAttribute('role', 'alert');
    const start = el('button', 'vp-button vp-button--primary', 'Start året');
    start.type = 'submit';
    start.append(LL.uiPhase2Visuals.icon('arrowRight'));
    const startActions = el('div', 'vp-actions'); startActions.append(start);
    budgetPanel.append(preview, expenses, error, startActions);
    addStep(tabs, box, 'adultPlanRoute', 'Retning', routePanel);
    addStep(tabs, box, 'adultPlanHousing', 'Bustad', housingPanel);
    addStep(tabs, box, 'adultPlanDaily', 'Arbeid og kvardag', daily);
    addStep(tabs, box, 'adultPlanFinance', 'Sparing og lån', finance);
    addStep(tabs, box, 'adultPlanGoals', 'Mål', goalPanel);
    addStep(tabs, box, 'adultPlanBudget', 'Budsjett', budgetPanel);
    const exitActions = el('div', 'vp-actions');
    exitActions.append(ui.button('Til oversikta', ui.home, 'quiet'));
    const layout = el('div', 'll-adult-plan-layout');
    const liveBudget = ui.panel();
    liveBudget.classList.add('ll-adult-plan-budget');
    const liveRows = el('div'); liveRows.setAttribute('aria-live', 'polite');
    liveBudget.append(el('h2', 'vp-heading--small no-mt', 'Budsjett per månad'), liveRows);
    layout.append(box, liveBudget);
    form.append(layout, exitActions);
    root.append(form);
    const steps = LL.uiPlanSteps.connect(tabs, category, previous, next);

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
        g.targetLabel.textContent = g.choice.value === 'utdanning' ? 'Studieår som skal fullførast' :
          g.choice.value === 'overskot' ? 'Ønskt energi · 1–100' : 'Målsum · kr';
        g.target.max = g.choice.value === 'overskot' ? '100' : '1000000';
        if (g.choice.value === 'utdanning') g.target.value = item.years || (LL.phase2State.route(g.studyRouteId) || {}).years || (a.qualifications.study ? 3 : 1);
        g.share.disabled = !['buffer', 'bustad', 'flytting'].includes(g.choice.value);
      });
      routeType.replaceChildren(el('strong', '', 'Type løp'), el('div', '', guide.routeType(s, item)));
      routeDescription.textContent = item.note;
      const wasExpanded = admission.firstElementChild?.open;
      const admissionDetails = guide.admissions(s, item);
      if (admissionDetails) admissionDetails.open = Boolean(wasExpanded);
      admission.replaceChildren(...(admissionDetails ? [admissionDetails] : []));
      routeNote.replaceChildren();
      const vignette = el('div', 'll-adult-route-art'); vignette.append(LL.artVignette.create(item.art)); routeNote.append(vignette);
      if (studying) routeNote.append(LL.uiPhase2Visuals.studySteps(s, item));
      if (a.routeId && a.routeId !== item.id && studying) routeNote.append(el('p', 'll-note', studyYears ? 'Du held fram der du slapp.' : 'Nytt studium startar på år 1. Tidlegare framdrift er lagra.'));
      const studentOption = Array.from(home.options).find(o => o.value === 'hybel'); studentOption.disabled = !studying;
      if (!studying && home.value === 'hybel') { home.value = 'kollektiv'; draft.housing = 'kollektiv'; }
      const housing = d.housing.find(h => h.id === home.value);
      bsu.disabled = !LL.phase2Housing.canSaveBsu(s, draft);
      bsuNote.hidden = !bsu.disabled;
      bsuNote.textContent = 'BSU-innbetaling er stengd i spelet når du vel eigd bustad eller har brukt BSU til kjøp.';
      timeNote.hidden = item.kind !== 'gap';
      timeNote.textContent = 'Stillingsprosenten gjeld arbeidsmengda i friårssporet.';
      preview.replaceChildren();
      try {
        const estimate = LL.phase2Economy.preview(s, draft);
        guide.homeNote(housing, estimate, homeNote);
        liveRows.replaceChildren(...guide.liveBudget(estimate));
        preview.append(LL.uiPhase2Visuals.moneyFlow([['Arbeidsinntekt', estimate.wage], ['Studentlån', estimate.loan, 'bookOpen'], ['Påbyggstøtte', estimate.bridge, 'bookOpen'], ['Utgifter og skatt', estimate.expense]]));
        const values = [['Til overs før sparing og nedbetaling', estimate.available], ['Sparing og ekstra nedbetaling', estimate.saved], ['Konto etter flytting og byte', estimate.firstCash]];
        values.forEach(([label, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', label), el('strong', '', LL.util.kr(value))); preview.append(row); });
        if (estimate.move.deposit) {
          const deposit = LL.util.kr(estimate.move.deposit) + ' depositum';
          preview.append(LL.uiPhase2Visuals.token('lock', deposit, deposit + ' bunde ved flytting'));
        }
        const firstMonth = estimate.firstMonth;
        expenseRows.replaceChildren(...Object.entries({ ...firstMonth.expenses, mortgagePrincipal: firstMonth.mortgage.principal }).filter(([, value]) => value).map(([key, value]) => {
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
        const blockedPurchase = estimate.move.purchase && (estimate.move.purchase.requiresJob || estimate.firstCash < 0);
        error.textContent = duplicate ? 'Vel to ulike mål.' : share > 100 ? 'Fordelinga av fri sparing kan høgst vere 100 %.' :
          blockedPurchase ? 'Bustadkjøpet krev finansiering. Opne Bustad for å sjå kva som manglar.' :
          needsDeposit ? 'Flytting krev meir pengar no. Hent fri buffer frå oversikta eller vel eit rimelegare bustadval.' : '';
        start.disabled = Boolean(error.textContent);
        error.hidden = !error.textContent;
        if (estimate.firstCash < 0) preview.append(ui.button('Til kontoen og fri buffer', ui.home));
        a.draft = { plan: estimate.plan, goals: selected }; ui.save();
      } catch (e) {
        error.textContent = e.message;
        error.hidden = false;
        expenses.hidden = true;
        start.disabled = true;
      }
    }
    form.addEventListener('change', update);
    form.addEventListener('input', event => { if (event.target.type === 'number') update(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (budgetPanel.hidden || start.disabled) return;
      const invalid = Array.from(form.elements).find(control => control.willValidate && !control.validity.valid);
      if (invalid) {
        steps.reveal(invalid);
        const details = invalid.closest('details');
        if (details) details.open = true;
        invalid.reportValidity();
        return;
      }
      LL.uiPlanSteps.confirmStart(steps, 'Vil du starte året no?', 'Start året likevel', () => {
        try {
          LL.phase2Sim.begin(s, read(), readGoals()); delete a.draft; ui.save(); LL.uiPhase2Play.render();
        } catch (e) {
          error.textContent = e.message;
          error.hidden = false;
        }
      });
    });
    update();
  }
  return { open };
})();
