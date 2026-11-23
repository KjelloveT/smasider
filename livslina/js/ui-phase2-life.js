/* Transport og hushald i årsplanen og på oversikta. */
window.LL = window.LL || {};
LL.uiPhase2Life = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  const kr = value => LL.util.kr(value);
  const months = () => LL.phase2Sim.MONTHS;
  function checkbox(value) {
    const control = el('input');
    control.type = 'checkbox';
    control.checked = value;
    return control;
  }

  function transport(s, initial, { field, select }) {
    const data = LL.data.getAdult().transport, chosen = initial.transport;
    const saved = LL.phase2Transport.current(s);
    const area = select('adultTransitArea', Object.entries(data.areas).map(([id, item]) => [id, item.label]), chosen.area);
    const mode = select('adultTransitMode', Object.entries(LL.phase2Transport.modes), chosen.mode);
    const purchase = select('adultVehicle', [
      ['keep', 'Hald det eg har'], ...Object.entries(data.vehicles).map(([id, item]) => [id, 'Kjøp ' + item.label.toLocaleLowerCase('nn-NO') + ' · ' + kr(item.price)]),
      ['sell', 'Sel transportmiddelet mitt', !saved.vehicle]
    ], chosen.action);
    const stages = data.steps.slice(saved.stage);
    const units = select('adultLicenceUnits', [[0, 'Ingen nye steg'], ...stages.map((step, i) => [i + 1, 'Til og med ' + step.label.toLocaleLowerCase('nn-NO')])], chosen.units);
    const practice = checkbox(chosen.privatePractice);
    const panel = el('div', 'll-adult-stack');
    const overview = el('div', 'vp-panel vp-panel--soft vp-panel--compact ll-adult-stack');
    const progress = el('ol', 'll-licence-steps');
    data.steps.forEach((step, i) => progress.append(el('li', '', step.label + (i < saved.stage ? ' · fullført' : ''))));
    const card = el('div', 'll-adult-life-card');
    card.append(LL.artVignette.create(saved.stage === data.steps.length ? 'adultDrivingTest' : 'adultDrivingLesson'),
      el('p', '', saved.stage === data.steps.length ? 'Du har førarkort klasse B.' : 'Førarkort klasse B · ' + saved.stage + ' av ' + data.steps.length + ' steg fullførte.'));
    panel.append(field('Reisemiljø', area, 'Vel eit oppdikta miljø med reiseveg som passar spelet.'), field('Vanleg reiseform', mode),
      field('Kjøp eller sal', purchase),
      card, progress);
    if (stages.length) panel.append(field('Steg i år', units), field('Kombiner med privat øvingskøyring', practice, 'Kan spare nokre betalte køyretimar i spelet.'));
    panel.append(overview);
    function read() { return { area: area.value, mode: mode.value, action: purchase.value, units: Number(units.value), privatePractice: practice.checked }; }
    function update(estimate) {
      const b = estimate.firstMonth.travel, q = estimate.transport;
      const lessons = LL.phase2Transport.training(s, estimate.plan);
      const period = estimate.months.find(month => !month.travelling) || estimate.firstMonth;
      overview.replaceChildren(el('p', '', 'Vanleg reiseveg · ' + (period.travel.minutes ? period.travel.minutes + ' min éin veg' : 'standardbudsjett') +
        ' · ' + kr(period.travel.fare) + '/mnd.'));
      if (q.vehicle) overview.append(el('p', '', q.vehicle.kind === 'car' ? 'Bil per månad utanom reisevegen · ' +
        kr(b.insurance) + ' forsikring, ' + kr(b.maintenance) + ' vedlikehald og ' + kr(period.travel.fuel) + ' drivstoff.' : 'Sykkelen ligg i eigedelane dine.'));
      if (q.vehicle) {
        const loss = q.vehicle.value * (1 - data.vehicles[q.vehicle.kind].retention ** 12);
        overview.append(el('p', '', 'Venta verditap i år · ' + kr(loss) + '.'));
      }
      if (q.price || q.sale) overview.append(el('p', '', 'Kjøp ' + kr(q.price) + ' · sal ' + kr(q.sale) + ' ved årsstart.'));
      if (lessons.length) {
        const rows = el('ul', 'll-life-list');
        lessons.forEach(lesson => rows.append(el('li', '', (months()[lesson.month] || 'Seinare enn juli') + ' · ' + lesson.label + ' · ' + kr(lesson.cost) + ' · ' + lesson.hours + ' timar')));
        overview.append(rows);
      }
    }
    return { panel, read, update };
  }

  function familyStatus(s) {
    const f = LL.phase2Family.current(s), tags = [];
    if (f.partner) tags.push((f.lease ? 'Bur saman med ' : 'I forhold med ') + LL.phase2Family.name(f.partner));
    else tags.push(f.lease ? 'Leigeavtalen blir delt ut avtaleåret' : ({ heime: 'Bur heime', kollektiv: 'Bur i kollektiv', internat: 'Bur på internat' }[s.adult.housing] || 'Eige hushald'));
    if (f.friend) tags.push('Maja · ven frå vidaregåande');
    if (f.child) {
      const age = Math.max(0, LL.phase2Family.monthKey(s, s.adult.run?.month || 0) - f.child.due);
      tags.push('Barn · ' + (age >= 12 ? Math.floor(age / 12) + ' år' : age + (age === 1 ? ' månad' : ' månader')));
    } else if (f.pregnancy) {
      tags.push('Barn venta i ' + months()[f.pregnancy.due % 12].toLocaleLowerCase('nn-NO'));
    }
    return tags;
  }

  function family(s, initial, { field, select }) {
    const chosen = initial.family, f = LL.phase2Family.current(s);
    const panel = el('div', 'll-adult-stack');
    const summary = el('div', 'vp-panel vp-panel--soft vp-panel--compact');
    summary.append(el('p', '', familyStatus(s).join(' · ')));
    if (f.last) summary.append(el('p', 'll-note', f.last));
    const time = select('adultFamilyTime', [['own', 'Tid til eigen kvardag'], ['friends', 'Set av tid til vener'], ['household', 'Set av tid til familien']], chosen.time);
    const meet = checkbox(chosen.meet);
    const talk = checkbox(chosen.talk);
    const actions = [['keep', 'Hald noverande avtale']];
    if (f.partner && !f.lease) actions.push(['join', 'Planlegg delt leige', !f.cohabitConsent]);
    if (f.lease) actions.push(['separate', 'Planlegg å bu kvar for dykk']);
    if (f.partner) actions.push(['end', 'Avslutt forholdet']);
    const action = select('adultFamilyAction', actions, chosen.action);
    const childChoices = [['keep', f.pregnancy || f.child ? 'Hald på planen' : 'Ingen plan om barn']];
    if (f.partner && !f.child && !f.pregnancy) childChoices.push(['plan', 'Planlegg barn', !f.childConsent]);
    if (f.pregnancy && f.pregnancy.start >= LL.phase2Family.monthKey(s)) childChoices.push(['wait', 'Vent med planen om barn']);
    const child = select('adultFamilyChild', childChoices, chosen.child);
    const startMonth = select('adultFamilyMonth', months().map((label, i) => [i, label]), chosen.startMonth);
    const leave = select('adultFamilyLeave', [[0, 'Ingen permisjon'], [3, '3 månader'], [6, '6 månader']], chosen.leave);
    const care = select('adultFamilyCare', [['shared', 'Del omsorga'], ['player', 'Mest omsorg hjå meg'], ['other', 'Mest omsorg hjå den andre']], chosen.care);
    const childcare = checkbox(chosen.childcare);
    const timing = field('Når vil de setje planen i gang?', startMonth);
    const carePlan = el('div');
    carePlan.append(field('Permisjon frå arbeid eller studium', leave), field('Omsorg', care), field('Planlegg barnehage når barnet er stort nok', childcare));
    const details = el('div', 'vp-panel vp-panel--soft vp-panel--compact ll-adult-stack');
    panel.append(summary, field('Kven vil du setje av tid til?', time));
    if (!f.partner && f.invited.length < 2) panel.append(field('Opne for å bli betre kjend med nokon', meet));
    if (actions.length > 1) panel.append(field('Bustad og forhold', action,
      f.partner && !f.cohabitConsent ? 'Ein samtale om å dele leige kan kome i løpet av året.' : undefined));
    if (f.partner || f.pregnancy || f.child) {
      if (!f.childConsent && !f.pregnancy && !f.child && f.partner) panel.append(field('Ta ein samtale om barn', talk));
      panel.append(field('Plan om barn', child, 'Ei endring krev ei avtale og uttrykkeleg stadfesting.'), timing, carePlan);
    } else {
      timing.hidden = carePlan.hidden = true;
    }
    panel.append(details);

    function read() {
      return { time: time.value, meet: !f.partner && meet.checked, action: action.value, talk: talk.checked, child: child.value,
        startMonth: Number(startMonth.value), leave: Number(leave.value), care: care.value, childcare: childcare.checked };
    }
    function update(estimate) {
      const p = estimate.plan, defined = LL.phase2Family.timeline(s, p);
      timing.hidden = p.family.child !== 'plan';
      carePlan.hidden = !defined;
      details.replaceChildren();
      const issues = LL.phase2Family.issue(s, p);
      if (issues) details.append(el('p', 'vp-help', issues));
      if (estimate.firstMonth.family.share) {
        details.append(el('p', '', 'Du betaler ' + kr(estimate.firstMonth.expenses.housing) + ' av leiga per månad. Ditt depositum er ' +
          kr(estimate.move.deposit || s.adult.deposit) + '. Kvar betaler frå sin konto.'));
      }
      if (defined) {
        const due = months()[defined.due % 12].toLocaleLowerCase('nn-NO');
        const careCost = estimate.months.reduce((sum, month) => sum + month.family.childCost, 0);
        if (!defined.born) details.append(el('p', '', 'Barn venta i ' + due + (defined.due >= (s.adult.year + 1) * 12 ? ' neste speleår.' : ' i dette speleåret.')));
        details.append(el('p', '', kr(careCost) + ' til utstyr og omsorg dette året. ' + kr(estimate.benefit) + ' i støtte etter spelreglane.'));
        if (estimate.parental) details.append(el('p', '', kr(estimate.parental) + ' i foreldrepengar i staden for løn i permisjonen. Spelet anslår retten ut frå tidlegare arbeidsinntekt.'));
      }
      details.hidden = !details.childElementCount;
    }
    return { panel, read, update };
  }

  function confirm(s, plan, start) {
    const messages = [];
    const change = LL.phase2Paths.change(s, LL.phase2State.route(plan.routeId));
    if (change) messages.push(change);
    const action = plan.family.action;
    if (action === 'join') messages.push('De startar året med delt leige og kvar dykkar del av depositumet.');
    if (action === 'end') messages.push('Du avsluttar forholdet. Omsorgsavtalane de har frå før, blir med vidare.');
    if (action === 'separate') messages.push('Du legg opp året med kvar dykkar bustad og nytt budsjett.');
    const child = plan.family.child === 'plan';
    if (child) messages.push('Du og partnaren har valt å planleggje barn. Planen startar i ' + months()[plan.family.startMonth].toLocaleLowerCase('nn-NO') + '.');
    if (!messages.length) { start({}); return; }
    const dialog = Vy.createDialog(child ? 'Stadfest planen om barn' : 'Stadfest endringane');
    const body = el('div', 'll-adult-stack');
    body.append(...messages.map(line => el('p', '', line)));
    const actions = el('div', 'vp-actions');
    const cancel = el('button', 'vp-button vp-button--quiet', 'Tilbake til planen');
    const proceed = el('button', 'vp-button vp-button--primary', 'Stadfest og start året');
    cancel.type = proceed.type = 'button';
    actions.append(cancel, proceed);
    dialog.append(body, actions);
    let accepted = false;
    cancel.addEventListener('click', () => Vy.closeModal(dialog));
    proceed.addEventListener('click', () => { accepted = true; Vy.closeModal(dialog); });
    dialog.addEventListener('close', () => { dialog.remove(); if (accepted) start({ child }); }, { once: true });
    Vy.openModal(dialog);
  }

  return { transport, family, familyStatus, confirm };
})();
