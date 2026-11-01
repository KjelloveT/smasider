/* Fase 2: konti, årsplan, månadleg likviditet og kalenderårsoppgjer. */
window.LL = window.LL || {};
LL.phase2Economy = (function () {
  'use strict';
  const data = () => LL.data.getAdult();
  const limit = (v, min, max) => LL.util.clamp(Number(v) || 0, min, max);
  const housing = id => data().housing.find(h => h.id === id);
  function normalizePlan(s, draft) {
    const d = draft || {};
    const item = LL.phase2State.route(d.routeId);
    if (!item || !LL.phase2State.available(s, item)) throw new Error('Vel ei retning du har opptaksgrunnlag for.');
    const studying = LL.phase2State.isStudying(s, d);
    let h = housing(d.housing) || housing('heime');
    if (h.studentOnly && !studying) h = housing('kollektiv');
    return { routeId: item.id, housing: h.id, jobHours: studying ? limit(d.jobHours, 0, 12) : 0,
      workPercent: [0.5, 0.8, 1].includes(Number(d.workPercent)) ? Number(d.workPercent) : 1,
      savings: limit(d.savings, 0, 10000), bsu: limit(d.bsu, 0, 2250), extraDebt: limit(d.extraDebt, 0, 5000),
      leisure: ['quiet', 'balanced', 'social'].includes(d.leisure) ? d.leisure : 'balanced',
      summerWeeks: studying ? Math.round(limit(d.summerWeeks, 0, 6)) : 0,
      borrow: studying && item.kind === 'study' && d.borrow !== false };
  }

  function defaultPlan(s) {
    const a = s.adult;
    const fallback = a.qualifications.study ? 'okonomi' : a.qualifications.trade ? (data().routes.find(r => r.program === a.qualifications.trade) || { id: 'eige-fag' }).id : 'butikk';
    const previous = a.plan && LL.phase2State.route(a.plan.routeId);
    const chosen = previous && LL.phase2State.available(s, previous) ? previous.id : fallback;
    return normalizePlan(s, Object.assign({ housing: a.housing, jobHours: 6, workPercent: 1, savings: 500, bsu: 0, leisure: 'balanced', summerWeeks: 4 }, a.plan || {}, { routeId: chosen, borrow: previous && previous.id === chosen ? a.plan.borrow : true }));
  }

  function annualTax(wage, interest, bsuPaid) {
    const r = data().rates.tax;
    const taxable = Math.max(0, wage + interest - Math.min(wage * r.deductionRate, r.deductionMax) - r.allowance);
    let tax = taxable * r.incomeRate + Math.min(wage * r.insuranceRate, Math.max(0, wage - r.insuranceFloor) * r.insuranceCap);
    r.brackets.forEach(([floor, rate], i) => {
      tax += Math.max(0, Math.min(wage, r.brackets[i + 1] ? r.brackets[i + 1][0] : Infinity) - floor) * rate;
    });
    return Math.max(0, tax - Math.min(bsuPaid, data().rates.bsuAnnual) * data().rates.bsuTaxCredit);
  }

  function breakdown(s, plan, month, modifiers) {
    const p = normalizePlan(s, plan), item = LL.phase2State.route(p.routeId);
    const r = data().rates, h = housing(p.housing), studying = LL.phase2State.isStudying(s, p);
    const m = modifiers || { monthlyExpense: 0, monthlyWage: 0 };
    let wage = studying ? p.jobHours * (52 / 12) * r.hourlyWage : (item.annualPay || 0) * p.workPercent / 12;
    if (studying && month >= 10) wage += p.summerWeeks * 37.5 * r.summerHourly / 2;
    wage = Math.max(0, wage + (m.monthlyWage || 0));
    const loan = p.borrow && month !== 11 ? r.studentMonthly : 0;
    const bridge = item.kind === 'bridge' && month !== 11 ? (r.bridgeMonthly || 6000) : 0;
    const expenses = { housing: h.rent, utilities: h.utilities, food: h.food || r.food,
      mobile: r.mobile, insurance: r.insurance, transport: r.transport,
      household: p.housing === 'heime' ? 0 : r.household,
      leisure: r.leisure * (p.leisure === 'social' ? 2 : p.leisure === 'quiet' ? 0.5 : 1),
      materials: studying ? r.materials : 0,
      semester: studying && [0, 5].includes(month) ? r.semester : 0,
      experiences: (item.extraAnnual || 0) / 12,
      adjustments: Math.max(-r.leisure, m.monthlyExpense || 0) };
    const tax = annualTax(wage * 12, 0, 0) / 12;
    expenses.tax = tax;
    const expense = Object.values(expenses).reduce((sum, value) => sum + value, 0);
    return { wage, loan, bridge, expense, expenses, tax, net: wage + loan + bridge - expense, studying };
  }

  function movingCost(s, plan) {
    const a = s.adult;
    if (a.housing === plan.housing) return { deposit: 0, returned: 0, expense: 0 };
    return { deposit: plan.housing === 'heime' ? 0 : housing(plan.housing).rent * data().rates.depositMonths,
      returned: a.deposit, expense: data().rates.moving };
  }

  function preview(s, draft) {
    const p = normalizePlan(s, draft);
    const months = Array.from({ length: 12 }, (_, i) => breakdown(s, p, i));
    const move = movingCost(s, p);
    const change = s.adult.routeId && s.adult.routeId !== p.routeId ? (LL.phase2State.route(p.routeId).kind === 'study' ? data().rates.studyChange : data().rates.jobChange) : 0;
    const result = { wage: 0, loan: 0, bridge: 0, expense: move.expense + change, tax: 0, move, plan: p };
    months.forEach(m => ['wage', 'loan', 'bridge', 'expense', 'tax'].forEach(k => { result[k] += m[k]; }));
    result.net = result.wage + result.loan + result.bridge - result.expense;
    result.available = result.net + move.returned - move.deposit;
    result.saved = (p.savings + p.bsu + p.extraDebt) * 12;
    result.firstCash = s.stats.money + move.returned - move.deposit - move.expense - change;
    return result;
  }

  function calendar(s, key) {
    const a = s.adult;
    if (!a.calendars[key]) a.calendars[key] = { wage: 0, interest: 0, taxPaid: 0, bsuPaid: 0, support: 0, closed: false, wealth: 0 };
    return a.calendars[key];
  }

  function saveMoney(s, plan, cal) {
    const a = s.adult, r = data().rates;
    let free = Math.max(0, s.stats.money - 1000);
    const bsu = Math.min(plan.bsu, free, Math.max(0, r.bsuAnnual - cal.bsuPaid), Math.max(0, r.bsuTotal - a.bsuContributed));
    s.stats.money -= bsu; a.bsu += bsu; a.bsuContributed += bsu; cal.bsuPaid += bsu;
    free -= bsu;
    const saved = Math.min(plan.savings, free);
    s.stats.money -= saved; s.stats.savings += saved;
    return { saved, bsu };
  }

  function convertGrants(s) {
    const a = s.adult, r = data().rates;
    let converted = 0;
    for (const [year, cal] of Object.entries(a.calendars)) {
      if (!cal.closed) continue;
      const lots = a.loanLots.filter(l => String(l.calendar) === year && l.away);
      const borrowed = lots.reduce((sum, l) => sum + l.principal, 0);
      if (!borrowed) continue;
      const incomeLimit = cal.support <= 7 ? r.shortIncomeLimit : r.incomeLimit;
      const reduction = Math.max(0, cal.wage + cal.interest - incomeLimit) * r.incomeReduction * cal.support + Math.max(0, cal.wealth - r.wealthLimit) * r.wealthReduction * cal.support;
      const ratio = Math.max(0, 1 - reduction / (borrowed * (r.passGrant + r.degreeGrant)));
      lots.forEach(l => {
        const passed = Math.max(0, Math.min(1, l.passed || 0));
        const pass = l.principal * r.passGrant * ratio * passed;
        const degree = LL.phase2State.progress(s, l.routeId).graduated ? l.principal * r.degreeGrant * ratio * passed : 0;
        const change = Math.max(0, pass - l.passConverted) + Math.max(0, degree - l.degreeConverted);
        l.passConverted = Math.max(pass, l.passConverted);
        l.degreeConverted = Math.max(degree, l.degreeConverted);
        converted += change;
      });
    }
    const outstanding = a.studentDebt;
    a.studentDebt = Math.max(0, outstanding - converted);
    if (converted > outstanding) s.stats.money += converted - outstanding;
    return converted;
  }

  function closeCalendar(s, key) {
    const cal = calendar(s, key);
    if (cal.closed) return { taxAdjustment: 0, converted: 0 };
    const due = annualTax(cal.wage, cal.interest, cal.bsuPaid);
    const adjustment = due - cal.taxPaid;
    s.stats.money -= adjustment;
    cal.taxPaid = due;
    cal.closed = true;
    cal.wealth = Math.max(0, LL.phase2State.networth(s));
    const before = s.adult.studentDebt;
    const converted = convertGrants(s);
    return { taxAdjustment: adjustment, converted, refund: Math.max(0, converted - before) };
  }

  function repay(s, requested) {
    let amount = Math.min(Math.max(0, requested), Math.max(0, s.stats.money - 500));
    const paid = amount;
    const credit = Math.min(s.adult.creditDebt, amount);
    s.adult.creditDebt -= credit; amount -= credit;
    const student = Math.min(s.adult.studentDebt, amount);
    s.adult.studentDebt -= student;
    s.stats.money -= credit + student;
    return Math.min(paid, credit + student);
  }

  return { normalizePlan, defaultPlan, annualTax, breakdown, preview, movingCost, calendar, saveMoney, closeCalendar, convertGrants, repay };
})();
