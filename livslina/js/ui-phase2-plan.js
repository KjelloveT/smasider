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
    const root = ui.frame('Planlegg året · ' + a.age + '–' + (a.age + 1) + ' år', 'August–juli · inntekt, skatt og hendingar blir rekna månad for månad.');
    const form = el('form', 'll-adult-stack');
    const routePanel = ui.panel('Vel retning og bustad');
    const route = select('adultRoute', d.routes.map(r => [r.id, LL.phase2State.label(s, r.id) + (!LL.phase2State.available(s, r) ? ' · manglar opptaksgrunnlag' : ''), !LL.phase2State.available(s, r)]), initial.routeId);
    const home = select('adultHousing', d.housing.map(h => [h.id, h.label]), initial.housing);
    const routeNote = el('p', 'll-note'), homeNote = el('p', 'll-note');
    routePanel.append(field('Kva vil du gjere dette året?', route), routeNote, field('Kvar vil du bu?', home), homeNote);
    form.append(routePanel);
    const daily = ui.panel('Arbeid og kvardagsrytme');
    const hours = select('adultJobHours', [[0, 'Ingen deltidsjobb'], [6, '6 timar i veka'], [12, '12 timar i veka']], initial.jobHours);
    const percent = select('adultWorkPercent', [[0.5, '50 %'], [0.8, '80 %'], [1, '100 %']], initial.workPercent);
    const summer = select('adultSummer', [[0, 'Ingen sommarjobb'], [2, '2 veker'], [4, '4 veker'], [6, '6 veker']], initial.summerWeeks);
    const leisure = select('adultLeisure', [['quiet', 'Meir kvile og rolege aktivitetar'], ['balanced', 'Balanse mellom kvile og sosialt'], ['social', 'Meir sosial aktivitet']], initial.leisure);
    const hoursWrap = field('Deltidsjobb ved sida av utdanninga', hours, '12 timar tek meir energi og kan påverke studieframdrifta.');
    const percentWrap = field('Stillingsprosent', percent, 'For friår er dette prosent av den avgrensa arbeidsmengda i friårssporet.');
    const summerWrap = field('Sommarjobb', summer, 'Fordelt på juni og juli i tillegg til deltidsjobben.');
    const timeNote = el('p', 'll-note');
    daily.append(hoursWrap, percentWrap, summerWrap, field('Kva vil du prioritere på fritida?', leisure), timeNote); form.append(daily);
    const finance = ui.panel('Sparing og finansiering');
    const borrow = el('input'); borrow.type = 'checkbox'; borrow.id = 'adultBorrow'; borrow.checked = initial.borrow;
    const borrowWrap = field('Ta opp ordinært basislån frå Lånekassen', borrow, 'Dette er gjeld. Eventuell omgjering til stipend krev mellom anna bestått utdanning og vilkår om bustad, inntekt og formue.');
    route.addEventListener('change', () => { if (LL.phase2State.route(route.value).kind === 'study') borrow.checked = true; });
    const savings = number('adultSavings', initial.savings, 10000, 100);
    const bsu = number('adultBsu', initial.bsu, 2250, 50);
    const debt = number('adultDebt', initial.extraDebt || 0, 5000, 100);
    finance.append(borrowWrap, field('Til fri sparing kvar månad · kr', savings), field('Til BSU kvar månad · kr', bsu, 'Bundne bustadpengar. Spelet kontrollerer kalenderårsgrensa og samla innskotsgrense.'), field('Ekstra nedbetaling av gjeld kvar månad · kr', debt));
    form.append(finance);
    const goalPanel = ui.panel('Måla du vil arbeide mot');
    goalPanel.append(el('p', 'll-note', 'Fordel høgst 100 % av fri sparing mellom pengemåla. Bustadmålet kan i tillegg telje BSU. Måla flyttar ingen pengar i seg sjølve.'));
    const previousGoals = a.draft ? a.draft.goals : a.goals;
    const goalFields = [0, 1].map(index => {
      const g = previousGoals[index] || { id: index ? '' : 'buffer', target: index ? 150000 : 30000, deadline: a.age + 3, share: index ? 0 : 100 };
      const row = el('fieldset', 'vp-field ll-adult-goal-editor'); row.append(el('legend', '', index ? 'Mindre mål · valfritt' : 'Hovudmål'));
      const choice = select('adultGoal' + index, [['', 'Ingen mål no'], ...d.goals.map(x => [x.id, x.label])], g.id);
      const target = number('adultGoalTarget' + index, g.target, 1000000, 1); target.min = '1';
      const deadline = number('adultGoalAge' + index, Math.max(a.age + 1, g.deadline), 40); deadline.min = String(a.age + 1);
      const share = number('adultGoalShare' + index, g.share, 100, 5);
      row.append(field('Mål', choice), field('Målsum eller målnivå', target), field('Ønskt alder ved måloppnåing', deadline), field('Del av fri sparing · prosent', share));
      choice.addEventListener('change', () => { const def = d.goals.find(x => x.id === choice.value); if (def) target.value = def.defaultTarget; update(); });
      goalPanel.append(row); return { choice, target, deadline, share, baseline: g.baseline, studyRouteId: g.routeId };
    });
    form.append(goalPanel);
    const preview = ui.panel('Venta økonomi gjennom året'); preview.setAttribute('aria-live', 'polite');
    const error = el('p', 'vp-help'); error.setAttribute('role', 'alert');
    const start = ui.button('Stadfest årsplanen og start året', () => {}, 'primary'); start.type = 'submit';
    form.append(preview, error, start, ui.button('Til oversikta', ui.home, 'quiet'));
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
      routeNote.textContent = item.note + (studying ? ' Fullført frå før: ' + studyYears + ' år. Byte til eit anna studium startar det studiet frå første år; ein pause bevarer framdrifta.' : '') + ' Lønsnivå er eit spelanslag.';
      const studentOption = Array.from(home.options).find(o => o.value === 'hybel'); studentOption.disabled = !studying;
      if (!studying && home.value === 'hybel') { home.value = 'kollektiv'; draft.housing = 'kollektiv'; }
      homeNote.textContent = d.housing.find(h => h.id === home.value).note;
      timeNote.textContent = studying ? 'Utdanning er hovudaktiviteten. Jobb kjem i tillegg; kvile og sosial kontakt påverkar overskotet.' : 'Arbeidstid og fritid verkar saman. Større stilling gir høgare inntekt og mindre rom for kvile.';
      preview.replaceChildren(el('h2', 'heading4 no-mt', 'Venta økonomi gjennom året'));
      try {
        const estimate = LL.phase2Economy.preview(s, draft);
        const values = [['Brutto arbeidsinntekt', estimate.wage], ['Studentlån · aukar gjelda', estimate.loan], ['Støtte til påbygg · spelanslag', estimate.bridge],
          ['Utgifter med venta skatt', estimate.expense], ['Disponibelt etter flytting og depositum, før sparing og nedbetaling', estimate.available], ['Ønskt sparing og ekstra nedbetaling', estimate.saved], ['Konto rett etter flytting og byte', estimate.firstCash]];
        values.forEach(([label, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', label), el('strong', '', LL.util.kr(value))); preview.append(row); });
        preview.append(el('p', 'll-note', 'Hendingar, renter, ordinær gjeldsbetaling og endeleg kalenderårsskatt kan endre utfallet. Sparing skjer berre når det er dekning.'));
        const selected = readGoals();
        const share = selected.reduce((sum, g) => sum + (d.goals.find(x => x.id === g.id).kind === 'money' ? g.share : 0), 0);
        const duplicate = selected.length > 1 && selected[0].id === selected[1].id;
        const needsDeposit = estimate.firstCash < 0 && estimate.move.deposit > estimate.move.returned;
        error.textContent = duplicate ? 'Vel to ulike mål.' : share > 100 ? 'Fordelinga av fri sparing kan høgst vere 100 %.' : needsDeposit ? 'Flytting krev meir pengar no. Hent fri buffer frå oversikta eller vel eit rimelegare bustadval.' : '';
        start.disabled = Boolean(error.textContent);
        if (estimate.firstCash < 0) preview.append(ui.button('Til kontoen og fri buffer', ui.home));
        a.draft = { plan: estimate.plan, goals: selected }; ui.save();
      } catch (e) { error.textContent = e.message; start.disabled = true; }
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
