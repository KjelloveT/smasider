/* Fase 2: overgang, heimeskjerm, årsoppgjer og felles spelkomponentar. */
window.LL = window.LL || {};
LL.uiPhase2 = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  const kr = n => LL.util.kr(n);
  const save = () => LL.storage.saveActive(LL.state.get());
  function button(text, action, role) {
    const b = el('button', 'vp-button vp-button--' + (role || 'tool'), text);
    b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function panel(title) {
    const p = el('section', 'vp-panel vp-panel--plain ll-adult-panel');
    if (title) p.append(el('h2', 'heading4 no-mt', title));
    return p;
  }
  function frame(title, subtitle, navigation) {
    const root = document.getElementById('adultContent'); root.replaceChildren();
    const head = el('div', 'vp-panel vp-panel--plain ll-adult-panel ll-adult-heading');
    const copy = el('div');
    const h = el('h1', 'heading2 no-mt', title); h.tabIndex = -1;
    copy.append(h);
    if (subtitle) copy.append(el('p', 'll-note', subtitle));
    const actions = el('div', 'll-adult-actions');
    actions.append(button('Eksporter livsline', () => LL.storage.exportSave(LL.state.get())),
      button('Om tala og forskinga', () => { research(); }),
      button('Til startsida', () => { LL.uiSetup.renderStart(); LL.main.showScreen('screen-start'); }, 'quiet'));
    const menu = el('details', 'vp-accordion ll-adult-menu');
    menu.append(el('summary', '', 'Val og hjelp'));
    const menuBody = el('div', 'vp-accordion-body'); menuBody.append(actions); menu.append(menuBody);
    head.append(copy, menu);
    if (navigation) head.append(navigation);
    root.append(head);
    LL.main.showScreen('screen-adult'); h.focus(); return root;
  }
  function stats(s) {
    const a = s.adult;
    const wrap = el('div', 'll-adult-stack');
    const grid = el('div', 'll-adult-stats');
    const finances = el('div', 'll-adult-stats');
    const v = LL.uiPhase2Visuals;
    const previous = a.reports.at(-1)?.start.stats;
    const deltas = a.run ? a.run.trends : previous && LL.phase2Effects.changes(previous, s.stats);
    const values = [['Konto', kr(s.stats.money), 'coins'], ['Fri sparing', kr(s.stats.savings), 'coins'], ['BSU', kr(a.bsu), 'home'],
      ['Depositum', kr(a.deposit)], ['Studiegjeld', kr(a.studentDebt)], ['Kredittgjeld', kr(a.creditDebt)],
      ['Nettoformue', kr(LL.phase2State.networth(s))]];
    if (a.property) values.push(['Bustadverdi', kr(a.property.value), 'home'], ['Bustadlån', kr(a.property.balance)]);
    Object.entries(v.METERS).forEach(([key, [name, icon]]) => values.push([name, Math.round(s.stats[key]), icon, key]));
    values.forEach(([label, value, symbol, key], index) => {
      const box = panel(), heading = el('div', 'll-stat-lbl');
      if (symbol) heading.append(v.icon(symbol, 18)); heading.append(el('span', '', label));
      const reading = el('div', 'll-adult-stat-reading');
      reading.append(el('strong', 'll-adult-stat', String(value)));
      const delta = deltas?.[key];
      if (Number.isFinite(delta) && Math.abs(delta) >= .05) reading.append(v.trend(delta));
      box.append(heading, reading);
      if (key) box.append(v.meter(key, s.stats[key], delta));
      (index === 0 || key ? grid : finances).append(box);
    });
    const details = el('details', 'vp-accordion'); details.append(el('summary', '', 'Sparing, depositum og gjeld'));
    const body = el('div', 'vp-accordion-body'); body.append(finances); details.append(body); wrap.append(grid, details);
    return wrap;
  }
  function goals(s, parent) {
    const a = s.adult, p = panel('Måla dine');
    if (!a.goals.length) p.append(button('Vel eit mål', () => LL.uiPhase2Plan.open()));
    a.goals.forEach(g => {
      const definition = LL.data.getAdult().goals.find(d => d.id === g.id);
      const value = LL.phase2State.goalValue(s, g);
      const line = el('div', 'll-adult-goal');
      const heading = el('div', 'll-adult-token'); heading.append(LL.uiPhase2Visuals.icon('target'), el('strong', '', definition.label + (g.id === 'utdanning' ? ' · ' + LL.phase2State.route(g.routeId).label : ''))); line.append(heading);
      const meter = el('progress'); meter.max = g.target; meter.value = Math.max(0, value); meter.setAttribute('aria-label', definition.label);
      const money = definition.kind === 'money' || definition.kind === 'debt';
      line.append(meter, el('span', '', (money ? kr(value) + ' / ' + kr(g.target) : value.toLocaleString('nn-NO', { maximumFractionDigits: 1 }) + ' / ' + g.target) + ' · ' + g.deadline + ' år'));
      if (definition.kind === 'money') line.append(el('small', 'll-note', g.share + ' % av fri sparing' + (g.id === 'bustad' ? ' + BSU' : '')));
      if (s.adult.age >= g.deadline && value < g.target) line.append(el('small', 'll-note', 'Fristen er nådd. Juster årsplanen.'));
      p.append(line);
    });
    parent.append(p);
  }
  function recovery(s, parent, needed) {
    const a = s.adult;
    if (s.stats.money >= (needed || 0)) return;
    const p = panel('Kontoen treng påfyll');
    if (s.stats.savings > 0) p.append(button('Bruk fri buffer', () => {
      const amount = Math.min(s.stats.savings, Math.max(1000, (needed || 0) - s.stats.money + 1000));
      s.stats.savings -= amount; s.stats.money += amount; save(); open();
    }));
    if (a.creditDebt < 20000) p.append(button('Lån 5 000 kr · 18 % årsrente', () => {
      const amount = Math.min(5000, 20000 - a.creditDebt);
      a.creditDebt += amount; s.stats.money += amount; save(); open();
    }));
    parent.append(p);
  }
  function open() {
    const s = LL.state.get(), a = s.adult;
    if (a.run) { LL.uiPhase2Play.render(); return; }
    if (a.status === 'report' && a.reports.length) { report(); return; }
    home();
  }
  function roomPanel(s) {
    const panelView = panel('Bustad og eigedelar');
    const model = LL.phase2Rooms, rooms = model.rooms(s);
    const labels = Object.fromEntries(rooms.map(id => [id, model.label(s, id)]));
    const scene = el('div', 'll-adult-room');
    const picker = el('div', 'vp-actions');
    picker.setAttribute('role', 'group'); picker.setAttribute('aria-label', 'Rom i bustaden');
    function show(id) {
      LL.artRoom.render(scene, model.view(s, id), null, labels[id] + ' i bustaden din', id);
      Array.from(picker.children).forEach(tab => tab.setAttribute('aria-pressed', String(tab.textContent === labels[id])));
    }
    if (rooms.length > 1) {
      rooms.forEach(id => picker.append(button(labels[id], () => show(id), 'quiet')));
      panelView.append(picker);
    }
    panelView.append(scene);
    show(rooms[0]);
    if (LL.phase2Effects.sparseRoom(s)) {
      const warning = el('p', 'll-note', 'Du har få gode plassar for besøk. Vener vel oftare å møtast ein annan stad, og færre besøk kan trekkje ned trivselen. Ein sofa, eit matbord eller teppe og pynt kan hjelpe.');
      warning.setAttribute('role', 'status');
      panelView.append(warning);
    }
    const actions = el('div', 'vp-actions');
    actions.append(button('Opne rombutikken', LL.uiRoom.open));
    if (!s.adult.complete) actions.append(button('Planlegg transport', () => LL.uiPhase2Plan.open('adultPlanTransport'), 'quiet'));
    panelView.append(actions);
    const stock = model.stock(s);
    if (stock.length) panelView.append(el('p', 'll-note', stock.length + (stock.length === 1 ? ' ting ligg på lager.' : ' ting ligg på lager.')));
    return panelView;
  }

  function familyPanel(s) {
    const f = LL.phase2Family.current(s);
    const view = panel('Hushald og relasjonar');
    const values = el('ul', 'll-life-list');
    LL.uiPhase2Life.familyStatus(s).forEach(text => values.append(el('li', '', text)));
    const card = el('div', 'll-adult-life-card');
    const scene = f.child ? 'adultFamilyReading' : f.pregnancy ? 'adultFamilyPlan' : f.partner ? 'adultFamilyTalk' : 'adultFamilyTea';
    card.append(LL.artVignette.create(scene, { seed: s.seed, year: s.adult.year, occurrence: 'hushald-' + scene }), values);
    view.append(card);
    if (f.last) view.append(el('p', 'll-note', f.last));
    if (!s.adult.complete) view.append(button('Planlegg hushaldet', () => LL.uiPhase2Plan.open('adultPlanFamily'), 'quiet'));
    return view;
  }
  function home() {
    const s = LL.state.get(), a = s.adult;
    const root = frame(a.complete ? 'Neste steg i livslina' : 'Studium og arbeid', a.age + ' år' + (a.complete ? ' · Fase 2 fullført' : ' · August–juli'));
    if (!a.complete) root.append(button('Planlegg neste år', () => LL.uiPhase2Plan.open(), 'primary'));
    else if (a.age === 25) root.append(button('Hald fram etter 25', () => {
      if (LL.phase2State.continueLife(s)) { save(); LL.uiPhase2Plan.open(); }
    }, 'primary'));
    root.append(stats(s));
    const layout = el('div', 'll-adult-layout'), left = el('div', 'll-adult-stack'), right = el('div', 'll-adult-stack');
    const current = panel(a.complete ? 'Vidare i livet' : 'Vegen din');
    if (a.routeId) {
      const item = LL.phase2State.route(a.routeId);
      current.append(el('p', '', LL.phase2State.label(s, a.routeId, a.plan?.roleId)));
      if (item.years) current.append(LL.uiPhase2Visuals.studySteps(s, item));
    }
    const qualification = a.qualifications.trade ? 'Fagbrev' : a.qualifications.study ? 'Studiekompetanse' : 'Yrkesfag';
    current.append(LL.uiPhase2Visuals.token('graduationCap', qualification, qualification + ' · ' + s.program.name));
    if (a.complete) {
      const pending = Object.entries(a.progress).filter(([id, p]) => LL.phase2State.route(id).kind === 'study' && !p.graduated && p.years > 0);
      pending.forEach(([id]) => { if (id !== a.routeId) current.append(el('p', '', LL.phase2State.route(id).label), LL.uiPhase2Visuals.studySteps(s, LL.phase2State.route(id))); });
      current.append(el('p', 'll-note', a.age === 25 ? 'Du kan halde fram med årsplanar. Studium, arbeid, hushald og eigedelar blir med vidare.' : 'Studium, arbeid og dei andre vala dine er lagra.'));
    }
    if (a.reports.length) current.append(button('Sjå siste årsoppgjer', report));
    left.append(current, familyPanel(s)); goals(s, left); recovery(s, left);
    const figure = panel('Figuren din');
    const portrait = LL.artCharacter.createCanvas(s.character, { className: 'll-character-canvas ll-character-canvas--portrait', label: 'Figuren din', width: 160, height: 240 });
    figure.append(portrait); right.append(figure);
    right.append(roomPanel(s));
    layout.append(left, right); root.append(layout);
  }
  function transition() {
    const s = LL.state.get();
    if (s.phase === 2) { open(); return; }
    if (!s.finished) { LL.main.enterHome(); return; }
    const exam = s.trainingRoute === 'apprenticeship' && !s.flags.fagprovePass;
    const root = frame(exam ? 'Avslutt læretida' : 'Studium og arbeid', exam ? 'To læreår fullførte' : 'Vidare frå vidaregåande');
    const box = panel(exam ? 'Fagprøva' : 'Utgangspunktet ditt');
    if (exam) {
      box.append(el('p', '', 'Forenkla fagprøve: båe vala gir fagbrev.'));
      box.append(button('Eg er klar – fullfør fagprøva', () => { LL.phase2State.passTradeExam(s, false); save(); LL.uiReport.showFinal(); }, 'primary'));
      box.append(button('Få rettleiing og fullfør · −2 energi', () => { LL.phase2State.passTradeExam(s, true); save(); LL.uiReport.showFinal(); }));
    } else {
      LL.phase2State.completeSchool(s);
      const values = [['Alder', s.trainingRoute === 'apprenticeship' ? '20 år' : '19 år'], ['Utdanning', s.program.name],
        ['Kompetanse', s.qualifications.trade ? 'Fagbrev i vald fagretning' : s.qualifications.study ? 'Studiekompetanse' : 'Yrkesfagleg skuleløp; påbygg eller arbeid er mogleg'],
        ['Brukskonto', kr(s.stats.money)], [s.stats.savingsIsBsu ? 'BSU, bunde' : 'Fri sparing', kr(s.stats.savings)],
        ['Betalt depositum', kr(s.flags.depositumBetalt ? 6000 : 0)]];
      const path = el('div', 'll-adult-transition'); path.append(LL.uiPhase2Visuals.icon('graduationCap', 40), LL.uiPhase2Visuals.icon('arrowRight', 32), LL.uiPhase2Visuals.icon('compass', 40)); box.append(path);
      values.forEach(([key, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', key), el('strong', '', value)); box.append(row); });
      box.append(el('p', 'll-note', 'Lommepengar og VGS-stipend tek slutt.'));
      box.append(button('Vel vegen vidare', () => { LL.phase2State.begin(s); save(); home(); }, 'primary'));
    }
    root.append(box);
  }
  function report() {
    const s = LL.state.get(), a = s.adult, r = a.reports[a.reports.length - 1];
    const root = frame('Årsoppgjer · ' + r.age + '–' + (r.age + 1) + ' år', LL.phase2State.label(s, r.routeId, r.roleId) + ' · august–juli');
    root.append(stats(s));
    const p = panel('Slik gjekk året');
    const item = LL.phase2State.route(r.routeId), v = LL.uiPhase2Visuals;
    if (item.years) p.append(v.studySteps(s, item));
    else p.append(el('p', '', r.progress));
    const parental = r.totals.parentalBenefit || 0;
    p.append(v.moneyFlow([['Arbeidsinntekt', r.totals.wage - parental], ['Foreldrepengar · spelanslag', parental, 'users'],
      ['Studentlån', r.totals.loan, 'bookOpen'], ['Påbyggstøtte', r.totals.bridge, 'bookOpen'],
      ['Anna støtte til familien', r.totals.familyBenefit, 'users'], ['Utgifter og skatt', r.totals.expense]]));
    const worth = el('div', 'll-budget-row'); worth.append(el('span', '', 'Nettoformue'), el('strong', '', kr(r.start.networth) + ' → ' + kr(r.end.networth))); p.append(worth);
    p.append(button('Sjå målingane', () => LL.uiPhase2Report.open(r)));
    const details = el('details', 'vp-accordion'); details.append(el('summary', '', 'Heile rekneskapen'));
    const accounts = el('div', 'vp-accordion-body');
    const values = [['Brutto arbeidsinntekt', r.totals.wage - parental], ['Foreldrepengar · spelanslag', parental], ['Utbetalt studentlån', r.totals.loan], ['Støtte til påbygg · spelanslag', r.totals.bridge],
      ['Støtte til familien', r.totals.familyBenefit], ['Omsorg i utgiftene', r.totals.care], ['Føraropplæring i utgiftene', r.totals.licence],
      ['Kjøp av transportmiddel', r.totals.vehiclePurchase], ['Sal av transportmiddel', r.totals.vehicleSale],
      ['Verditap på transportmiddel', r.totals.vehicleDepreciation],
      ['Utgifter, inkludert skatt og flytting', r.totals.expense], ['Skatt i utgiftene', r.totals.tax], ['Nedbetaling av student- og kredittgjeld', r.totals.repaid], ['Avdrag på bustadlånet', r.totals.mortgagePrincipal],
      ['Flytta til fri sparing', r.totals.saved], ['Flytta til BSU', r.totals.bsu], ['Lån gjort om til stipend', r.totals.converted], ['Renter lagde til gjelda', r.totals.capitalizedInterest || 0], ['Sparerenter', r.totals.earnedInterest || 0], ['Kontoutslag frå case · med i tala ovanfor', r.totals.caseCash]];
    values.filter(row => row[1]).forEach(([key, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', key), el('strong', '', kr(value))); accounts.append(row); });
    accounts.append(el('p', 'll-note', 'Lån er gjeld. Sparing flyttar eigne pengar. Omgjering til stipend blir rekna per kalenderår.'));
    details.append(accounts); p.append(details);
    root.append(p); goals(s, root);
    const history = el('details', 'vp-accordion'); history.append(el('summary', '', 'Vala dine'));
    const historyBody = el('div', 'vp-accordion-body');
    r.events.forEach(id => {
      const event = LL.data.getAdult().events.find(e => e.id === id);
      const logged = s.eventLog.find(e => e.phase === 2 && e.year === r.year && e.id === id);
      if (event && logged) historyBody.append(el('p', '', event.title + ' — ' + (logged.choiceLabel || event.choices[logged.choice]?.label || 'Val registrert')));
    });
    history.append(historyBody);
    root.append(history);
    root.append(button(a.complete ? 'Sjå neste steg i livslina' : 'Til neste årsval', () => { a.status = 'planning'; save(); home(); }, 'primary'));
    LL.uiPhase2Report.open(r);
  }
  function research() {
    const body = document.getElementById('infoModalBody'); body.replaceChildren();
    const d = LL.data.getAdult();
    body.append(el('p', '', d.note), el('p', '', d.research.note));
    body.append(el('p', 'll-note', 'Løn, leige, rente og casekostnader er spelanslag. Skatt bruker vanlege 2026-satsar utan alle særfrådrag. Første kalenderår omfattar berre inntekta i fase 2. Stipend blir gjort opp etter kalenderåret, med forenkla tidspunkt. Påbyggstøtte er eit separat anslag.'));
    for (const profile of [d.research.study, d.research.work]) body.append(el('p', '', profile.measure + ' · ' + profile.year + '. ' + profile.population + '. ' + profile.scope + '. ' + profile.sampleNote + ' Direkte årseffekt: 0 poeng.'));
    d.sources.forEach(source => { const p = el('p'); const link = el('a', '', source.label); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; p.append(link); body.append(p); });
    LL.main.openModal('infoModal');
  }
  return { open, home, transition, report, research, frame, panel, button, stats, recovery, save };
})();
