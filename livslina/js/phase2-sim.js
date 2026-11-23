/* Ei lagra årsrunde: tolv månader, casepausar og idempotent årsoppgjer. */
window.LL = window.LL || {};
LL.phase2Sim = (function () {
  'use strict';
  const MONTHS = ['August', 'September', 'Oktober', 'November', 'Desember', 'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli'];
  const clone = v => JSON.parse(JSON.stringify(v));
  const debt = a => a.studentDebt + a.creditDebt + (a.property?.balance || 0);
  function begin(s, draft, goals, approvals = {}) {
    const a = s.adult;
    if (a.run || a.complete) return false;
    const p = LL.phase2Economy.normalizePlan(s, draft);
    const route = LL.phase2State.route(p.routeId);
    const admission = LL.phase2State.startIssue(s, route);
    if (admission) throw new Error(admission);
    if (p.family.child === 'plan' && approvals.child !== true) throw new Error('Stadfest planen om barn før året kan starte.');
    const preview = LL.phase2Economy.preview(s, p);
    const issue = LL.phase2Economy.planIssue(s, preview);
    if (issue) throw new Error(issue);
    const move = preview.move;
    if (move.purchase?.requiresJob || move.purchase && preview.firstCash < 0) throw new Error('Bustadkjøpet krev nok eigenkapital og godkjend finansiering. Sjå vilkåra under Bustad.');
    if (preview.firstCash < 0 && move.deposit > move.returned) throw new Error('Du treng dekning for flytting og nytt depositum før året kan starte. Bruk fri buffer eller vel eit rimelegare bustadval.');
    const start = { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: debt(a), bsu: a.bsu, deposit: a.deposit,
      propertyValue: a.property?.value || 0, vehicleValue: a.mobility?.vehicle?.value || 0 };
    const changed = a.routeId && a.routeId !== p.routeId;
    const moved = a.housing !== p.housing;
    const changeCost = preview.changeCost;
    s.stats.money = preview.firstCash;
    if (moved || move.returned || move.deposit) a.deposit = move.deposit;
    if (moved) {
      a.property = move.purchase?.property || null;
      a.bsu -= move.bsu;
      a.bsuUsed = a.bsuUsed || move.bsu > 0;
      s.stats.savings -= move.savings;
    }
    a.goals = LL.phase2State.normalizeGoals(s, goals);
    const transportStart = LL.phase2Transport.start(s, p, preview.transport);
    LL.phase2Family.start(s, p);
    a.housing = p.housing;
    if (moved) LL.phase2Rooms.migrate(s);
    a.plan = p;
    a.routeId = p.routeId;
    a.status = 'playing';
    a.run = { year: a.year, month: 0, plan: clone(p), changed: Boolean(changed), start, transportStart,
      schedule: LL.phase2Events.prepare(s, p, { moved, changed, renting: move.deposit > 0 }),
      resolved: [], modifiers: { monthlyExpense: 0, monthlyWage: 0 },
      totals: { wage: 0, loan: 0, bridge: 0, otherIncome: 0, expense: move.expense + changeCost, tax: 0, saved: 0, bsu: 0, repaid: 0, mortgagePrincipal: 0, caseCash: 0, converted: 0, interest: 0, earnedInterest: 0, capitalizedInterest: 0, grantRefund: 0,
        familyBenefit: 0, parentalBenefit: 0, vehiclePurchase: preview.transport.price, vehicleSale: preview.transport.sale, licence: 0, care: 0 },
      study: 0, energyTotal: 0, loanIndexes: [], notes: [], impacts: [] };
    const impact = LL.phase2Effects;
    const transportCash = preview.transport.sale - preview.transport.price;
    impact.record(a.run, 'move', 'Bustadvalet · ' + LL.phase2Housing.option(p.housing).label, { money: s.stats.money - start.stats.money + changeCost - transportCash });
    impact.record(a.run, 'vehicle', 'Kjøp eller sal av transportmiddel', { money: transportCash });
    impact.record(a.run, 'changed-route', 'Byte av retning', { money: -changeCost });
    return true;
  }

  function month(s) {
    const a = s.adult, r = a.run, i = r.month;
    const rates = LL.data.getAdult().rates;
    const before = clone(s.stats);
    const b = LL.phase2Economy.breakdown(s, r.plan, i, r.modifiers);
    const plannedFee = b.expenses.licence;
    const fee = LL.phase2Transport.advance(s, b.travel.lesson, s.stats.money + b.net);
    b.expense += fee - plannedFee;
    b.net += plannedFee - fee;
    LL.phase2Family.advance(s, r.plan, i);
    const calKey = r.year + (i >= 5 ? 1 : 0);
    const cal = LL.phase2Economy.calendar(s, calKey);
    s.stats.money += b.net;
    if (a.property) a.property.balance -= b.mortgage.principal;
    r.totals.mortgagePrincipal = (r.totals.mortgagePrincipal || 0) + b.mortgage.principal;
    a.studentDebt += b.loan;
    cal.wage += b.wage; cal.taxPaid += b.tax;
    if (b.loan) {
      cal.support++;
      r.loanIndexes.push(a.loanLots.length);
      a.loanLots.push({ calendar: calKey, routeId: r.plan.routeId, principal: b.loan, away: r.plan.housing !== 'heime', passed: 0, passConverted: 0, degreeConverted: 0 });
    }
    for (const k of ['wage', 'loan', 'bridge', 'expense', 'tax']) r.totals[k] += b[k];
    r.totals.otherIncome = (r.totals.otherIncome || 0) + b.benefit;
    r.totals.familyBenefit = (r.totals.familyBenefit || 0) + b.benefit;
    const parental = b.family.parental || 0;
    r.totals.parentalBenefit = (r.totals.parentalBenefit || 0) + parental;
    r.totals.licence = (r.totals.licence || 0) + fee;
    r.totals.care = (r.totals.care || 0) + b.family.childCost;
    r.totals.vehicleDepreciation = (r.totals.vehicleDepreciation || 0) + LL.phase2Transport.depreciate(s);
    s.totalWage = (s.totalWage || 0) + b.wage;
    const saving = LL.phase2Economy.saveMoney(s, r.plan, cal);
    r.totals.saved += saving.saved; r.totals.bsu += saving.bsu;
    const interest = s.stats.savings * rates.savingsRate / 12;
    const bsuInterest = a.bsu * rates.bsuRate / 12;
    s.stats.savings += interest; a.bsu += bsuInterest;
    cal.interest += interest + bsuInterest;
    r.totals.earnedInterest = (r.totals.earnedInterest || 0) + interest + bsuInterest;
    let repaid;
    if (!b.studying) {
      const debtInterest = a.studentDebt * rates.loanRate / 12;
      a.studentDebt += debtInterest;
      r.totals.capitalizedInterest = (r.totals.capitalizedInterest || 0) + debtInterest;
      repaid = LL.phase2Economy.repay(s, rates.repayment + r.plan.extraDebt);
    } else repaid = LL.phase2Economy.repay(s, r.plan.extraDebt);
    r.totals.repaid += repaid;
    const creditInterest = a.creditDebt * rates.creditRate / 12;
    const overdraftInterest = Math.max(0, -s.stats.money) * rates.creditRate / 12;
    a.creditDebt += creditInterest;
    s.stats.money -= overdraftInterest;
    r.totals.capitalizedInterest = (r.totals.capitalizedInterest || 0) + creditInterest;
    r.totals.expense += overdraftInterest;
    r.totals.interest += creditInterest + overdraftInterest;
    const workload = b.studying ? r.plan.jobHours / 8 : (r.plan.workPercent >= 1 ? (b.work ? LL.phase2Paths.rhythm(b.work).load : .9) : .2);
    const recovery = r.plan.leisure === 'quiet' ? 1.4 : r.plan.leisure === 'balanced' ? 0.7 : 0.2;
    const effects = LL.phase2Effects;
    const quiet = r.plan.leisure === 'quiet', social = r.plan.leisure === 'social';
    const leisureLabel = quiet ? 'Du prioriterte kvile' : social ? 'Du sette av tid til vener' : 'Du valde ein balansert kvardag';
    const bare = effects.sparseRoom(s);
    const room = LL.phase2Rooms.comfort(s);
    effects.measure(s, 'energy', [['leisure', leisureLabel, recovery], ['workload', b.studying ? 'Deltidsjobb ved sida av studiet' : 'Arbeidsmengda du valde', b.travelling || b.family.takesLeave ? 0 : -workload],
      ['commute', 'Reisetida i kvardagen', -b.travel.minutes / 160], ['driving', 'Tid til føraropplæring', fee ? -b.travel.lesson.hours / 30 : 0], ['care', 'Tid og overskot til omsorg', -b.family.effort],
      ['room-energy', 'Praktisk utstyr i bustaden', room.energy]]);
    const familyTime = r.plan.family?.time;
    effects.measure(s, 'social', [['leisure', leisureLabel, social ? 0.8 : quiet ? -0.4 : 0.1],
      ['relationships', 'Tid saman med dei du har nær deg', familyTime === 'friends' || familyTime === 'household' && a.household.partner ? .28 : 0],
      ['room', 'Færre besøk når rommet er lite innbydande', bare && !social ? rates.room.missedVisitsSocial : 0]]);
    effects.measure(s, 'wellbeing', [['low-energy', 'Lågt overskot i kvardagen', s.stats.energy < 25 ? -0.5 : 0],
      ['low-cash', 'Stram økonomi', s.stats.money < 0 ? -0.7 : 0],
      ['room', 'Færre besøk når rommet er lite innbydande', bare ? rates.room.sparseWellbeing : 0],
      ['room-comfort', 'Eigne møteplassar og praktisk inventar', room.wellbeing]]);
    r.energyTotal += s.stats.energy;
    if (i === 4) {
      const settled = LL.phase2Economy.closeCalendar(s, calKey);
      r.totals.tax += settled.taxAdjustment; r.totals.expense += settled.taxAdjustment; r.totals.converted += settled.converted;
      r.totals.grantRefund = (r.totals.grantRefund || 0) + (settled.refund || 0);
      r.notes.push('Kalenderåret er gjort opp i desember. Omgjering krev òg bestått utdanning og eventuell grad.');
    }
    const cashRows = [
      ['wage', 'Arbeidsinntekt frå vald retning', b.wage - parental],
      ['parental', 'Foreldrepengar under permisjon', parental],
      ['student-loan', 'Du valde studentlån', b.loan],
      ['bridge', 'Støtte til påbygg', b.bridge],
      ['family-support', 'Støtte til familien', b.benefit],
      ['driving-cost', 'Føraropplæring', -fee],
      ['child-cost', 'Utgifter til barnet', -b.family.childCost],
      ['expenses', 'Bustad, kvardag og skatt', -b.expense + fee + b.family.childCost],
      ['mortgage-principal', 'Avdrag på bustadlånet', -b.mortgage.principal],
      ['saving', 'Overført til sparing og BSU', -saving.saved - saving.bsu],
      ['repayment', 'Nedbetaling av student- og kredittgjeld', -repaid]
    ];
    cashRows.forEach(([id, label, amount]) => effects.record(r, id, label, { money: amount }));
    const delta = effects.changes(before, s.stats);
    const accounted = cashRows.reduce((sum, row) => sum + row[2], 0);
    effects.record(r, 'calendar', 'Renter og kalenderoppgjer', { money: delta.money - accounted });
    r.trends = delta;
    const entry = { phase: 2, round: 'adult-' + r.year, month: MONTHS[i], income: b.wage + b.bridge,
      borrowed: b.loan, expense: b.expense, saved: saving.saved + saving.bsu, balance: s.stats.money, transport: b.travel.fare + fee,
      familySupport: b.benefit, childCost: b.family.childCost,
      savings: s.stats.savings, bsu: a.bsu, debt: debt(a), networth: LL.phase2State.networth(s),
      wellbeing: s.stats.wellbeing, energy: s.stats.energy, social: s.stats.social };
    s.ledger.push(entry);
    r.month++;
    if (s.stats.money < 0) s.wentNegative = true;
    s.lowestBalance = Math.min(Number.isFinite(s.lowestBalance) ? s.lowestBalance : 0, s.stats.money);
    LL.state.recordStatChanges(before, s.stats);
  }

  function finish(s) {
    const a = s.adult, r = a.run;
    if (!r || r.month !== 12 || LL.phase2Events.pending(s)) return false;
    const item = LL.phase2State.route(r.plan.routeId);
    const studying = LL.phase2State.isStudying(s, r.plan);
    const p = Object.assign({ years: 0, graduated: false, workYears: 0 }, a.progress[item.id]);
    let progress = '';
    if (item.experience === 'folk') {
      p.years = 1;
      p.graduated = true;
      r.loanIndexes.forEach(index => { a.loanLots[index].passed = 1; });
      progress = 'Folkehøgskuleåret er fullført. Du kan velje eit nytt løp.';
    } else if (studying) {
      const effort = 0.85 + r.study - (r.plan.jobHours >= 12 ? 0.25 : 0) - (r.energyTotal / 12 < 35 ? 0.3 : 0);
      const passed = effort >= 0.6 ? 1 : 0.5;
      p.years = Math.min(item.years, p.years + passed);
      p.graduated = p.years >= item.years;
      r.loanIndexes.forEach(index => { a.loanLots[index].passed = passed; });
      if (item.kind === 'bridge' && p.graduated) a.qualifications.study = true;
      progress = p.graduated ? 'Utdanninga er fullført.' : 'Fullført ' + p.years.toLocaleString('nn-NO') + ' av ' + item.years + ' studieår.';
    } else if (item.experience === 'retake' || item.experience === 'science') {
      const hours = r.plan.examHours || 8;
      const workload = r.plan.workPercent === 1 ? .17 : 0;
      const tired = r.energyTotal / 12 < 35 ? .18 : 0;
      const passed = .25 + hours * .055 + r.study - workload - tired >= .6;
      if (passed && item.experience === 'science') a.qualifications.science = true;
      if (passed && item.experience === 'retake') {
        const before = a.ordinaryGrade ?? LL.phase2State.schoolGrade(s)?.average ?? 3.5;
        a.ordinaryGrade = Math.min(6, Math.round((before + LL.data.getAdult().extraYears.retake.improvement) * 100) / 100);
      }
      progress = passed ? (item.experience === 'science' ? 'Realfagsløpet er bestått. Du kan søkje studium med realfagskrav.' :
        'Privatistresultatet tel i ordinær kvote. Snittet der er ' + a.ordinaryGrade.toLocaleString('nn-NO', { minimumFractionDigits: 2 }) + '.') :
        'Eksamen gav inga ny kompetanse denne gongen. Du kan setje av meir tid og prøve att.';
    } else if (item.experience === 'travel') {
      progress = 'Du reiste i ' + r.plan.travelMonths + ' månader og hadde arbeid i resten av året.';
    } else {
      p.workYears++; a.careerYears++;
      progress = item.kind === 'gap' ? 'Friåret er gjennomført. Du vel retning på nytt.' : 'Du har fullført eit arbeidsår og tek erfaringa med vidare.';
    }
    a.progress[item.id] = p;
    LL.phase2Family.finish(s, r.plan);
    const beforeDebt = a.studentDebt;
    const beforeCash = s.stats.money;
    const converted = LL.phase2Economy.convertGrants(s);
    r.totals.converted += converted;
    r.totals.grantRefund = (r.totals.grantRefund || 0) + Math.max(0, converted - beforeDebt);
    LL.phase2Effects.record(r, 'grants', 'Lån gjort om til stipend', { money: s.stats.money - beforeCash });
    const report = { year: a.year, age: a.age, routeId: item.id, roleId: r.plan.roleId, housing: r.plan.housing,
      start: r.start, end: { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: debt(a), bsu: a.bsu, deposit: a.deposit,
        propertyValue: a.property?.value || 0, vehicleValue: a.mobility?.vehicle?.value || 0 },
      totals: clone(r.totals), impacts: r.impacts || [], events: r.resolved.slice(), progress, notes: r.notes,
      goals: a.goals.map(g => Object.assign({}, g, { value: LL.phase2State.goalValue(s, g) })) };
    a.reports.push(report);
    a.year++; a.age++; s.age = a.age;
    a.run = null; a.status = 'report'; a.complete = a.age >= (a.extended ? 35 : 25);
    return report;
  }

  function advance(s) {
    if (!s.adult.run) return null;
    if (LL.phase2Events.pending(s)) return 'event';
    while (s.adult.run.month < 12) {
      month(s);
      if (LL.phase2Events.pending(s)) return 'event';
    }
    finish(s);
    return 'report';
  }
  return { MONTHS, begin, month, finish, advance };
})();
