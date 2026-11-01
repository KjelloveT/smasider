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
  function frame(title, subtitle) {
    const root = document.getElementById('adultContent'); root.replaceChildren();
    const head = el('div', 'vp-panel vp-panel--plain ll-adult-panel ll-adult-heading');
    const copy = el('div');
    const h = el('h1', 'heading2 no-mt', title); h.tabIndex = -1;
    copy.append(h, el('p', 'll-note', subtitle));
    const actions = el('div', 'll-adult-actions');
    actions.append(button('Eksporter livsline', () => LL.storage.exportSave(LL.state.get())),
      button('Om tala og forskinga', () => { research(); }),
      button('Til startsida', () => { LL.uiSetup.renderStart(); LL.main.showScreen('screen-start'); }, 'quiet'));
    const menu = el('details', 'vp-accordion ll-adult-menu');
    menu.append(el('summary', '', 'Val og hjelp'));
    const menuBody = el('div', 'vp-accordion-body'); menuBody.append(actions); menu.append(menuBody);
    if (window.matchMedia('(min-width: 741px)').matches) menu.open = true;
    head.append(copy, menu); root.append(head);
    LL.main.showScreen('screen-adult'); h.focus(); return root;
  }
  function stats(s) {
    const a = s.adult;
    const wrap = el('div', 'll-adult-stack');
    const grid = el('div', 'll-adult-stats');
    const finances = el('div', 'll-adult-stats');
    const values = [['Brukskonto', kr(s.stats.money)], ['Fri sparing', kr(s.stats.savings)], ['BSU', kr(a.bsu)],
      ['Depositum', kr(a.deposit)], ['Studiegjeld', kr(a.studentDebt)], ['Kredittgjeld', kr(a.creditDebt)],
      ['Nettoformue', kr(LL.phase2State.networth(s))], ['Energi', Math.round(s.stats.energy) + '/100'],
      ['Trivsel', Math.round(s.stats.wellbeing) + '/100'], ['Sosialt', Math.round(s.stats.social) + '/100']];
    values.forEach(([label, value], index) => { const box = panel(); box.append(el('div', 'll-note', label), el('strong', 'll-adult-stat', value)); (index === 0 || index >= 7 ? grid : finances).append(box); });
    const details = el('details', 'vp-accordion'); details.append(el('summary', '', 'Sparing, depositum og gjeld'));
    const body = el('div', 'vp-accordion-body'); body.append(finances); details.append(body); wrap.append(grid, details);
    return wrap;
  }
  function goals(s, parent) {
    const a = s.adult, p = panel('Måla dine');
    if (!a.goals.length) p.append(el('p', 'll-note', 'Vel eit hovudmål og eventuelt eit mindre mål i årsplanen.'));
    a.goals.forEach(g => {
      const definition = LL.data.getAdult().goals.find(d => d.id === g.id);
      const value = LL.phase2State.goalValue(s, g);
      const line = el('div', 'll-adult-goal');
      line.append(el('strong', '', definition.label + (g.id === 'utdanning' ? ' · ' + LL.phase2State.route(g.routeId).label : '')));
      const meter = el('progress'); meter.max = g.target; meter.value = Math.max(0, value); meter.setAttribute('aria-label', definition.label);
      const money = definition.kind === 'money' || definition.kind === 'debt';
      line.append(meter, el('span', '', (money ? kr(value) + ' av ' + kr(g.target) : value.toLocaleString('nn-NO', { maximumFractionDigits: 1 }) + ' av ' + g.target) + ' · mål ved ' + g.deadline + ' år'));
      if (definition.kind === 'money') line.append(el('small', 'll-note', g.share + ' % av fri sparing' + (g.id === 'bustad' ? ' og BSU' : '') + '. Pengane er fordelte mellom måla.'));
      if (s.adult.age >= g.deadline && value < g.target) line.append(el('p', 'll-note', 'Tidsfristen er nådd. Du kan justere målet i neste årsplan.'));
      p.append(line);
    });
    parent.append(p);
  }
  function recovery(s, parent, needed) {
    const a = s.adult;
    if (s.stats.money >= (needed || 0)) return;
    const p = panel('Få oversikt over kontoen');
    p.append(el('p', 'll-note', 'Fri sparing kan brukast. BSU og depositum er bundne. Kreditt er eit lån med 18 % årsrente i spelanslaget.'));
    if (s.stats.savings > 0) p.append(button('Bruk fri buffer', () => {
      const amount = Math.min(s.stats.savings, Math.max(1000, (needed || 0) - s.stats.money + 1000));
      s.stats.savings -= amount; s.stats.money += amount; save(); open();
    }));
    if (a.creditDebt < 20000) p.append(button('Lån 5 000 kr på kreditt', () => {
      const amount = Math.min(5000, 20000 - a.creditDebt);
      a.creditDebt += amount; s.stats.money += amount; save(); open();
    }));
    p.append(el('p', 'll-note', 'Du kan òg velje rimelegare bustad eller endre neste årsplan. Nedbetaling kjem fram i oppgjeret.'));
    parent.append(p);
  }
  function open() {
    const s = LL.state.get(), a = s.adult;
    if (a.run) { LL.uiPhase2Play.render(); return; }
    if (a.status === 'report' && a.reports.length) { report(); return; }
    home();
  }
  function home() {
    const s = LL.state.get(), a = s.adult;
    const root = frame(a.complete ? 'Neste steg i livslina' : 'Studium og arbeid', a.age + ' år · ' + (a.complete ? 'Fase 2 er fullført' : 'Planlegg eitt år om gongen, frå august til juli'));
    if (!a.complete) root.append(button('Planlegg neste år', () => LL.uiPhase2Plan.open(), 'primary'));
    root.append(stats(s));
    const layout = el('div', 'll-adult-layout'), left = el('div', 'll-adult-stack'), right = el('div', 'll-adult-stack');
    const current = panel(a.complete ? 'Dette tek du med vidare' : 'Kvar står du no?');
    current.append(el('p', '', a.routeId ? LL.phase2State.label(s, a.routeId) : 'Du er ferdig med vidaregåande og skal velje vegen vidare.'));
    current.append(el('p', 'll-note', a.qualifications.trade ? 'Fagbrev: ' + s.program.name : a.qualifications.study ? 'Du har studiekompetanse.' : 'Påbygg er ein mogleg veg til studiekompetanse.'));
    if (a.complete) {
      const pending = Object.entries(a.progress).filter(([id, p]) => LL.phase2State.route(id).kind === 'study' && !p.graduated && p.years > 0);
      pending.forEach(([id, p]) => current.append(el('p', '', LL.phase2State.route(id).label + ': ' + p.years + ' av ' + LL.phase2State.route(id).years + ' år. Framdrifta blir bevart til neste livsfase.')));
      current.append(el('p', 'll-note', 'Arbeid og bustad frå 25 år er neste utviklingsfase. Lagringa bevarer heile personen, måla og pågåande utdanning.'));
    }
    if (a.reports.length) current.append(button('Sjå siste årsoppgjer', report));
    left.append(current); goals(s, left); recovery(s, left);
    const figure = panel('Same person, nye val');
    const portrait = LL.artCharacter.createCanvas(s.character, { className: 'll-character-canvas ll-character-canvas--portrait', label: 'Figuren din', width: 160, height: 240 });
    figure.append(portrait, el('p', 'll-note', a.narrative)); right.append(figure);
    const room = panel('Rommet og tinga dine');
    const scene = el('div', 'll-adult-room'); room.append(scene);
    LL.artRoom.render(scene, s.room, null, 'Rominventaret du tek med frå vidaregåande');
    room.append(el('p', 'll-note', 'Rominventaret blir med deg ved flytting. Same eigedel blir ikkje kjøpt ein gong til.')); right.append(room);
    layout.append(left, right); root.append(layout);
  }
  function transition() {
    const s = LL.state.get();
    if (s.phase === 2) { open(); return; }
    if (!s.finished) { LL.main.enterHome(); return; }
    const exam = s.trainingRoute === 'apprenticeship' && !s.flags.fagprovePass;
    const root = frame(exam ? 'Avslutt læretida' : 'Dette tek du med deg vidare', exam ? 'Begge læreåra er gjennomførte. Fagprøva høyrer til vidaregåandedelen.' : 'Same figur, pengar, kompetanse og historie følgjer deg inn i neste livsfase.');
    const box = panel(exam ? 'Fagprøva' : 'Utgangspunktet ditt');
    if (exam) {
      box.append(el('p', '', 'Fagprøva er ei forenkla avslutning i prøveutgåva. Du fullfører med fagbrev; du kan velje ekstra rettleiing før avslutninga. Ingen tilfeldig terning avgjer utfallet.'));
      box.append(button('Eg er klar – fullfør fagprøva', () => { LL.phase2State.passTradeExam(s, false); save(); LL.uiReport.showFinal(); }, 'primary'));
      box.append(button('Få rettleiing og fullfør · −2 energi', () => { LL.phase2State.passTradeExam(s, true); save(); LL.uiReport.showFinal(); }));
    } else {
      LL.phase2State.completeSchool(s);
      const values = [['Alder', s.trainingRoute === 'apprenticeship' ? '20 år' : '19 år'], ['Utdanning', s.program.name],
        ['Kompetanse', s.qualifications.trade ? 'Fagbrev i vald fagretning' : s.qualifications.study ? 'Studiekompetanse' : 'Yrkesfagleg skuleløp; påbygg eller arbeid er mogleg'],
        ['Brukskonto', kr(s.stats.money)], [s.stats.savingsIsBsu ? 'BSU, bunde' : 'Fri sparing', kr(s.stats.savings)],
        ['Betalt depositum', kr(s.flags.depositumBetalt ? 6000 : 0)], ['Trivsel / energi / sosialt', [s.stats.wellbeing, s.stats.energy, s.stats.social].map(Math.round).join(' / ')]];
      values.forEach(([key, value]) => box.append(el('p', '', key + ': ' + value)));
      box.append(el('p', 'll-note', 'God buffer gir rom ved flytting. BSU og depositum er bundne pengar. Familieprofilen og tidlegare val blir bevarte, medan lommepengar og VGS-stipend tek slutt.'));
      box.append(button('Hald fram til studium og arbeid', () => { LL.phase2State.begin(s); save(); home(); }, 'primary'));
    }
    root.append(box);
  }
  function report() {
    const s = LL.state.get(), a = s.adult, r = a.reports[a.reports.length - 1];
    const root = frame('Årsoppgjer · ' + r.age + '–' + (r.age + 1) + ' år', LL.phase2State.label(s, r.routeId) + ' · august–juli');
    root.append(stats(s));
    const p = panel('Slik gjekk året');
    p.append(el('p', '', r.progress));
    const values = [['Brutto arbeidsinntekt', r.totals.wage], ['Utbetalt studentlån', r.totals.loan], ['Støtte til påbygg · spelanslag', r.totals.bridge],
      ['Utgifter, inkludert skatt og flytting', r.totals.expense], ['Skatt i utgiftene', r.totals.tax], ['Nedbetaling av gjeld', r.totals.repaid],
      ['Flytta til fri sparing', r.totals.saved], ['Flytta til BSU', r.totals.bsu], ['Lån gjort om til stipend', r.totals.converted], ['Renter lagde til gjelda', r.totals.capitalizedInterest || 0], ['Sparerenter', r.totals.earnedInterest || 0], ['Kontoutslag frå case · med i tala ovanfor', r.totals.caseCash]];
    values.forEach(([key, value]) => { const row = el('div', 'll-budget-row'); row.append(el('span', '', key), el('strong', '', kr(value))); p.append(row); });
    p.append(el('p', '', 'Nettoformue: ' + kr(r.start.networth) + ' → ' + kr(r.end.networth)));
    ['wellbeing', 'energy', 'social'].forEach((key, i) => p.append(el('p', 'll-note', ['Trivsel', 'Energi', 'Sosialt'][i] + ': ' + Math.round(r.start.stats[key]) + ' → ' + Math.round(r.end.stats[key]))));
    p.append(el('p', 'll-note', 'Studentlån er gjeld, og sparing er flytting av eigne pengar. Omgjering for eit uavslutta kalenderår står framleis som lån.'));
    root.append(p); goals(s, root);
    const history = panel('Val gjennom året');
    r.events.forEach(id => { const event = LL.data.getAdult().events.find(e => e.id === id); const logged = s.eventLog.find(e => e.phase === 2 && e.year === r.year && e.id === id); if (event && logged) history.append(el('p', '', event.title + ' — ' + event.choices[logged.choice].label)); });
    root.append(history);
    root.append(button(a.complete ? 'Sjå neste steg i livslina' : 'Til neste årsval', () => { a.status = 'planning'; save(); home(); }, 'primary'));
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
