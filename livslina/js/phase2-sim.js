/* Ei lagra årsrunde: tolv månader, casepausar og idempotent årsoppgjer. */
window.LL = window.LL || {};
LL.phase2Sim = (function () {
  'use strict';
  const MONTHS = ['August', 'September', 'Oktober', 'November', 'Desember', 'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli'];
  const clone = v => JSON.parse(JSON.stringify(v));
  function begin(s, draft, goals) {
    const a = s.adult;
    if (a.run || a.complete) return false;
    const p = LL.phase2Economy.normalizePlan(s, draft);
    const preview = LL.phase2Economy.preview(s, p);
    if (preview.firstCash < 0 && preview.move.deposit > preview.move.returned) throw new Error('Du treng dekning for flytting og nytt depositum før året kan starte. Bruk fri buffer eller vel eit rimelegare bustadval.');
    const start = { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: a.studentDebt + a.creditDebt, bsu: a.bsu, deposit: a.deposit };
    s.stats.money += preview.move.returned - preview.move.deposit - preview.move.expense;
    const changed = a.routeId && a.routeId !== p.routeId;
    const changeCost = changed ? (LL.phase2State.route(p.routeId).kind === 'study' ? LL.data.getAdult().rates.studyChange : LL.data.getAdult().rates.jobChange) : 0;
    s.stats.money -= changeCost;
    if (a.housing !== p.housing) a.deposit = preview.move.deposit;
    a.goals = LL.phase2State.normalizeGoals(s, goals);
    a.housing = p.housing;
    a.plan = p;
    a.routeId = p.routeId;
    a.status = 'playing';
    a.run = { year: a.year, month: 0, plan: clone(p), changed: Boolean(changed), start,
      schedule: LL.phase2Events.prepare(s, p), resolved: [], modifiers: { monthlyExpense: 0, monthlyWage: 0 },
      totals: { wage: 0, loan: 0, bridge: 0, otherIncome: 0, expense: preview.move.expense + changeCost, tax: 0, saved: 0, bsu: 0, repaid: 0, caseCash: 0, converted: 0, interest: 0, earnedInterest: 0, capitalizedInterest: 0, grantRefund: 0 },
      study: 0, energyTotal: 0, loanIndexes: [], notes: [] };
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
    if (!b.studying) {
      const debtInterest = a.studentDebt * rates.loanRate / 12;
      a.studentDebt += debtInterest;
      r.totals.capitalizedInterest = (r.totals.capitalizedInterest || 0) + debtInterest;
      const amount = LL.phase2Economy.repay(s, rates.repayment + r.plan.extraDebt);
      r.totals.repaid += amount;
    } else r.totals.repaid += LL.phase2Economy.repay(s, r.plan.extraDebt);
    const creditInterest = a.creditDebt * rates.creditRate / 12;
    const overdraftInterest = Math.max(0, -s.stats.money) * rates.creditRate / 12;
    a.creditDebt += creditInterest;
    s.stats.money -= overdraftInterest;
    r.totals.capitalizedInterest = (r.totals.capitalizedInterest || 0) + creditInterest;
    r.totals.expense += overdraftInterest;
    r.totals.interest += creditInterest + overdraftInterest;
    const workload = b.studying ? r.plan.jobHours / 8 : (r.plan.workPercent >= 1 ? 0.9 : 0.2);
    const recovery = r.plan.leisure === 'quiet' ? 1.4 : r.plan.leisure === 'balanced' ? 0.7 : 0.2;
    s.stats.energy = LL.util.clamp(s.stats.energy + recovery - workload, 0, 100);
    s.stats.social = LL.util.clamp(s.stats.social + (r.plan.leisure === 'social' ? 0.8 : r.plan.leisure === 'quiet' ? -0.4 : 0.1), 0, 100);
    s.stats.wellbeing = LL.util.clamp(s.stats.wellbeing + (s.stats.energy < 25 ? -0.5 : 0) + (s.stats.money < 0 ? -0.7 : 0), 0, 100);
    r.energyTotal += s.stats.energy;
    if (i === 4) {
      const settled = LL.phase2Economy.closeCalendar(s, calKey);
      r.totals.tax += settled.taxAdjustment; r.totals.expense += settled.taxAdjustment; r.totals.converted += settled.converted;
      r.totals.grantRefund = (r.totals.grantRefund || 0) + (settled.refund || 0);
      r.notes.push('Kalenderåret er gjort opp i desember. Omgjering krev òg bestått utdanning og eventuell grad.');
    }
    const entry = { phase: 2, round: 'adult-' + r.year, month: MONTHS[i], income: b.wage + b.bridge,
      borrowed: b.loan, expense: b.expense, saved: saving.saved + saving.bsu, balance: s.stats.money,
      savings: s.stats.savings, bsu: a.bsu, debt: a.studentDebt + a.creditDebt, networth: LL.phase2State.networth(s),
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
    const converted = LL.phase2Economy.convertGrants(s);
    r.totals.converted += converted;
    r.totals.grantRefund = (r.totals.grantRefund || 0) + Math.max(0, converted - beforeDebt);
    const report = { year: a.year, age: a.age, routeId: item.id, housing: r.plan.housing,
      start: r.start, end: { stats: clone(s.stats), networth: LL.phase2State.networth(s), debt: a.studentDebt + a.creditDebt, bsu: a.bsu, deposit: a.deposit },
      totals: clone(r.totals), events: r.resolved.slice(), progress, notes: r.notes,
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
