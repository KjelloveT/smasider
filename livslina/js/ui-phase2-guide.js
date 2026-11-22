/* Korte elevforklaringar, opptaksdøme og løpande budsjett i årsplanen. */
window.LL = window.LL || {};
LL.uiPhase2Guide = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  const kr = value => LL.util.kr(value);
  const number = (value, digits) => value.toLocaleString('nn-NO', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  function routeType(s, route) {
    if (route.kind === 'study' && LL.phase2State.progress(s, route.id).graduated) return 'Arbeid etter fullført grad';
    if (route.kind === 'study') return 'Høgskule / universitet · ' + route.years + ' år';
    if (route.kind === 'bridge') return 'Vidaregåande · påbygg';
    if (route.kind === 'gap') return 'Friår';
    return route.program ? 'Arbeid · fagbrev' : 'Arbeid';
  }

  function routeSelect(s, routes, selected) {
    const input = el('select', 'vp-input');
    input.id = 'adultRoute';
    const groups = { study: 'Høgskule og universitet', job: 'Arbeid', bridge: 'Påbygg', gap: 'Friår' };
    for (const [kind, label] of Object.entries(groups)) {
      const group = el('optgroup');
      group.label = label;
      for (const route of routes) {
        const effectiveKind = route.kind === 'study' && LL.phase2State.progress(s, route.id).graduated ? 'job' : route.kind;
        if (effectiveKind !== kind) continue;
        const enabled = LL.phase2State.available(s, route);
        const admission = enabled ? LL.phase2State.studyAdmission(s, route) : null;
        const reason = !enabled ? ' · manglar opptaksgrunnlag' : admission?.admitted === false ? ' · sjå poengkravet' : '';
        const option = el('option', '', LL.phase2State.label(s, route.id) + reason);
        option.value = route.id;
        option.disabled = !enabled;
        group.append(option);
      }
      if (group.children.length) input.append(group);
    }
    input.value = selected;
    return input;
  }

  function admissionLine(label, limit, grade, ageLimit) {
    const row = el('div');
    const heading = el('dt', '', label);
    const reading = el('dd', '', number(limit, 1) + ' poeng');
    if (ageLimit !== undefined) {
      reading.append(' · du er over aldersgrensa på ' + ageLimit + ' år i dette dømet');
    } else if (grade) {
      const gap = Math.round((grade.points - limit) * 10) / 10;
      reading.append(' · ' + (gap === 0 ? 'på grensa' : number(Math.abs(gap), 1) + ' poeng ' + (gap > 0 ? 'over' : 'under')));
    }
    row.append(heading, reading);
    return row;
  }

  function admissions(admission, expanded) {
    if (!admission) return [];
    const { examples, grade, lowest, admitted, continuing } = admission;
    const profile = el('div', 'vp-panel vp-panel--soft vp-panel--compact ll-adult-admission-profile');
    if (grade) {
      const figures = el('dl', 'll-adult-admission-grades');
      for (const [label, value] of [['Snitt frå VGS', number(grade.average, 2)], ['Karakterpoeng før tillegg', number(grade.points, 1)]]) {
        const row = el('div'); row.append(el('dt', '', label), el('dd', '', value)); figures.append(row);
      }
      profile.append(figures);
    }
    const status = continuing ? 'Du er alt teken opp og kan halde fram med studiet.' : admitted ?
      'Du oppfyller opptakskrava for å starte dette studiet i Livslina.' : grade ?
        'Du treng minst ' + number(lowest, 1) + ' poeng for å starte dette studiet i Livslina.' :
        'Spelet treng karaktersnittet ditt frå VGS for å vurdere eit nytt opptak.';
    const message = el('p');
    message.append(el('strong', '', status));
    profile.append(message);

    const details = el('details', 'vp-accordion');
    details.open = Boolean(expanded);
    details.append(el('summary', '', 'Opptakskrav og poenggrenser'));
    const body = el('div', 'vp-accordion-body');
    body.append(el('p', '', 'For nye opptak brukar spelet den lågaste av grensene i dei kvotane du kan søkje i. Karaktersnittet gonga med ti gir karakterpoenga dine i spelet. Lærestadene kan ha eigne fagkrav, og tilleggspoeng og konkurranse kan endre utfallet i eit verkeleg opptak.'));
    const list = el('ul', 'll-adult-admission-list');
    for (const example of examples) {
      const item = el('li');
      const source = el('a', '', example.institution);
      source.href = example.url; source.target = '_blank'; source.rel = 'noopener noreferrer';
      const quotas = el('dl');
      quotas.append(admissionLine('Førstegongsvitnemål', example.first, grade, example.excludedFirstQuotaAge),
        admissionLine('Ordinær kvote', example.ordinary, grade));
      item.append(source, ', ' + example.campus + ' (' + example.year + ')', quotas);
      list.append(item);
    }
    body.append(list);
    if (grade && !admitted) {
      const lowestOrdinary = Math.min(...examples.map(example => example.ordinary));
      body.append(el('p', '', 'Du manglar ' + number(lowest - grade.points, 1) + ' poeng. I eit verkeleg opptak kan du undersøkje andre studiestader eller ta opp fag som privatist. Utan tilleggspoeng svarar den lågaste ordinære grensa her til eit snitt på ' + number(lowestOrdinary / 10, 2) + '.'));
    }
    const retake = el('a', '', 'Samordna opptak om å ta opp fag');
    retake.href = 'https://www.samordnaopptak.no/universitet-og-hogskole/poengberegning/forbedringer-og-nye-fag/';
    retake.target = '_blank'; retake.rel = 'noopener noreferrer';
    body.append(el('p', '', 'Betre karakterar frå privatisteksamen etter VGS tel i ordinær kvote. I kvoten for førstegongsvitnemål er det det opphavlege vitnemålet som tel.'), retake);
    details.append(body);
    return [profile, details];
  }

  function homeNote(home, estimate, target) {
    const move = estimate.move;
    const mortgage = estimate.firstMonth.mortgage;
    const total = home.rent + home.utilities + (home.ownerCosts || 0) + mortgage.interest + mortgage.principal;
    target.replaceChildren(el('p', '', home.note), el('p', 'll-note', kr(total) + '/mnd til ' + (home.price ? 'bustad, straum og lån.' : 'bustad og straum.')));
    if (!move.purchase) return;

    const rules = LL.data.getAdult().rates.mortgage;
    const purchase = move.purchase;
    const list = el('ul');
    list.append(
      el('li', '', 'Kjøpesum ' + kr(home.price) + '. Minst ' + kr(purchase.minimumDown) + ' i eigenkapital før omkostningar.'),
      el('li', '', 'Med inntekta, gjelda og budsjettet ditt kan du låne ' + kr(purchase.property.balance) + '. Du må stille med ' + kr(move.down + move.expense) + ' sjølv, medrekna dokumentavgift og flytting.'),
      el('li', '', 'Spelet krev eitt fullført arbeidsår i same retning og minst ' + Math.round(rules.minimumWorkPercent * 100) + ' % stilling for å få lånet.'),
      el('li', '', 'Samla gjeld kan vere høgst fem gonger brutto årsinntekt. Budsjettet må tole minst 7 % rente eller 3 prosentpoeng auke dersom det er høgare.')
    );
    if (move.bsu) list.append(el('li', '', kr(move.bsu) + ' frå BSU går til kjøpet.'));
    if (move.sale) list.append(el('li', '', kr(move.sale) + ' blir frigjort ved sal av førre bustad, etter at det gamle lånet er betalt.'));
    target.append(list);
    if (purchase.requiresJob) target.append(el('p', 'vp-help', 'Arbeidet ditt oppfyller enno ikkje spelkravet.'));
    if (estimate.firstCash < 0) target.append(el('p', 'vp-help', 'Du manglar ' + kr(-estimate.firstCash) + ' til kjøpet og oppstarten.'));
  }

  function liveBudget(estimate) {
    const purchase = estimate.move.purchase;
    const totalIncome = (estimate.wage + estimate.loan + estimate.bridge) / 12;
    const routineExpense = (estimate.expense - estimate.move.expense - (estimate.changeCost || 0) + estimate.mortgagePrincipal) / 12;
    const saving = estimate.saved / 12;
    const numbers = el('dl', 'll-adult-budget-numbers');
    for (const [label, amount] of [['Inn', totalIncome], ['Ut', routineExpense], ['Att før sparing', totalIncome - routineExpense]]) {
      const row = el('div'); row.append(el('dt', '', label), el('dd', '', kr(amount))); numbers.append(row);
    }
    const lines = [numbers];
    if (saving) lines.push(el('p', 'll-note ll-adult-budget-detail', 'Planlagt sparing og ekstra nedbetaling ' + kr(saving) + '/mnd.'));
    if (purchase || estimate.move.deposit) lines.push(el('p', 'll-note ll-adult-budget-detail', 'Sjå Bustad for kostnaden ved å flytte.'));
    return lines;
  }

  return { routeType, routeSelect, admissions, homeNote, liveBudget };
})();
