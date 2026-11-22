/* Ei lagra årsrunde: tolv månader, casepausar og idempotent årsoppgjer. */
window.LL = window.LL || {};
LL.phase2Sim = (function () {
  'use strict';
  const MONTHS = ['August', 'September', 'Oktober', 'November', 'Desember', 'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli'];
  const clone = v => JSON.parse(JSON.stringify(v));
  const debt = a => a.studentDebt + a.creditDebt + (a.property?.balance || 0);
  function begin(s, draft, goals) {
    const a = s.adult;
    if (a.run || a.complete) return false;
    const p = LL.phase2Economy.normalizePlan(s, draft);
    const preview = LL.phase2Economy.preview(s, p);
    const move = preview.move;
    if (move.purchase?.requiresJob || move.purchase && preview.firstCash < 0) throw new Error('Bustadkjøpet krev nok eigenkapital og godkjend finansiering. Sjå vilkåra under Bustad.');
    if (preview.firstCash < 0 && move.deposit > move.returned) throw new Error('Du treng dekning for flytting og nytt depositum før året kan starte. Bruk fri buffer eller vel eit rimelegare bustadval.');
    const start = { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: debt(a), bsu: a.bsu, deposit: a.deposit, propertyValue: a.property?.value || 0 };
    const changed = a.routeId && a.routeId !== p.routeId;
    const moved = a.housing !== p.housing;
    const changeCost = changed ? (LL.phase2State.route(p.routeId).kind === 'study' ? LL.data.getAdult().rates.studyChange : LL.data.getAdult().rates.jobChange) : 0;
    s.stats.money = preview.firstCash;
    if (moved) {
      a.deposit = move.deposit;
      a.property = move.purchase?.property || null;
      a.bsu -= move.bsu;
      a.bsuUsed = a.bsuUsed || move.bsu > 0;
      s.stats.savings -= move.savings;
    }
    a.goals = LL.phase2State.normalizeGoals(s, goals);
    a.housing = p.housing;
    a.plan = p;
    a.routeId = p.routeId;
    a.status = 'playing';
    a.run = { year: a.year, month: 0, plan: clone(p), changed: Boolean(changed), start,
      schedule: LL.phase2Events.prepare(s, p, { moved, changed, renting: move.deposit > 0 }),
      resolved: [], modifiers: { monthlyExpense: 0, monthlyWage: 0 },
      totals: { wage: 0, loan: 0, bridge: 0, otherIncome: 0, expense: move.expense + changeCost, tax: 0, saved: 0, bsu: 0, repaid: 0, mortgagePrincipal: 0, caseCash: 0, converted: 0, interest: 0, earnedInterest: 0, capitalizedInterest: 0, grantRefund: 0 },
      study: 0, energyTotal: 0, loanIndexes: [], notes: [], impacts: [] };
    const impact = LL.phase2Effects;
    impact.record(a.run, 'move', 'Bustadvalet · ' + LL.phase2Housing.option(p.housing).label, { money: s.stats.money - start.stats.money + changeCost });
    impact.record(a.run, 'changed-route', 'Byte av retning', { money: -changeCost });
    return true;
  }

  function month(s) {
    const a = s.adult, r = a.run, i = r.month;
    const rates = LL.data.getAdult().rates;
    const before = clone(s.stats);
    const b = LL.phase2Economy.breakdown(s, r.plan, i, r.modifiers);
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
    const workload = b.studying ? r.plan.jobHours / 8 : (r.plan.workPercent >= 1 ? 0.9 : 0.2);
    const recovery = r.plan.leisure === 'quiet' ? 1.4 : r.plan.leisure === 'balanced' ? 0.7 : 0.2;
    const effects = LL.phase2Effects;
    const quiet = r.plan.leisure === 'quiet', social = r.plan.leisure === 'social';
    const leisureLabel = quiet ? 'Du prioriterte kvile' : social ? 'Du sette av tid til vener' : 'Du valde ein balansert kvardag';
    const bare = effects.sparseRoom(s);
    effects.measure(s, 'energy', [['leisure', leisureLabel, recovery], ['workload', b.studying ? 'Deltidsjobb ved sida av studiet' : 'Arbeidsmengda du valde', -workload]]);
    effects.measure(s, 'social', [['leisure', leisureLabel, social ? 0.8 : quiet ? -0.4 : 0.1],
      ['room', 'Færre besøk når rommet er lite innbydande', bare && !social ? rates.room.missedVisitsSocial : 0]]);
    effects.measure(s, 'wellbeing', [['low-energy', 'Lågt overskot i kvardagen', s.stats.energy < 25 ? -0.5 : 0],
      ['low-cash', 'Stram økonomi', s.stats.money < 0 ? -0.7 : 0],
      ['room', 'Færre besøk når rommet er lite innbydande', bare ? rates.room.sparseWellbeing : 0]]);
    r.energyTotal += s.stats.energy;
    if (i === 4) {
      const settled = LL.phase2Economy.closeCalendar(s, calKey);
      r.totals.tax += settled.taxAdjustment; r.totals.expense += settled.taxAdjustment; r.totals.converted += settled.converted;
      r.totals.grantRefund = (r.totals.grantRefund || 0) + (settled.refund || 0);
      r.notes.push('Kalenderåret er gjort opp i desember. Omgjering krev òg bestått utdanning og eventuell grad.');
    }
    const cashRows = [
      ['wage', 'Arbeidsinntekt frå vald retning', b.wage],
      ['student-loan', 'Du valde studentlån', b.loan],
      ['bridge', 'Støtte til påbygg', b.bridge],
      ['expenses', 'Bustad, kvardag og skatt', -b.expense],
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
      borrowed: b.loan, expense: b.expense, saved: saving.saved + saving.bsu, balance: s.stats.money,
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
    if (studying) {
      const effort = 0.85 + r.study - (r.plan.jobHours >= 12 ? 0.25 : 0) - (r.energyTotal / 12 < 35 ? 0.3 : 0);
      const passed = effort >= 0.6 ? 1 : 0.5;
      p.years = Math.min(item.years, p.years + passed);
      p.graduated = p.years >= item.years;
      r.loanIndexes.forEach(index => { a.loanLots[index].passed = passed; });
      if (item.kind === 'bridge' && p.graduated) a.qualifications.study = true;
      progress = p.graduated ? 'Utdanninga er fullført.' : 'Fullført ' + p.years.toLocaleString('nn-NO') + ' av ' + item.years + ' studieår.';
    } else {
      p.workYears++; a.careerYears++;
      progress = item.kind === 'gap' ? 'Friåret er gjennomført. Du vel retning på nytt.' : 'Du har fullført eit arbeidsår og tek erfaringa med vidare.';
    }
    a.progress[item.id] = p;
    const beforeDebt = a.studentDebt;
    const beforeCash = s.stats.money;
    const converted = LL.phase2Economy.convertGrants(s);
    r.totals.converted += converted;
    r.totals.grantRefund = (r.totals.grantRefund || 0) + Math.max(0, converted - beforeDebt);
    LL.phase2Effects.record(r, 'grants', 'Lån gjort om til stipend', { money: s.stats.money - beforeCash });
    const report = { year: a.year, age: a.age, routeId: item.id, housing: r.plan.housing,
      start: r.start, end: { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: debt(a), bsu: a.bsu, deposit: a.deposit, propertyValue: a.property?.value || 0 },
      totals: clone(r.totals), impacts: r.impacts || [], events: r.resolved.slice(), progress, notes: r.notes,
      goals: a.goals.map(g => Object.assign({}, g, { value: LL.phase2State.goalValue(s, g) })) };
    a.reports.push(report);
    a.year++; a.age++; s.age = a.age;
    a.run = null; a.status = 'report'; a.complete = a.age >= 25;
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
