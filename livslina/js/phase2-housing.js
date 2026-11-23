/* Bustadbyte, finansieringskrav og månadlege avdrag. */
window.LL = window.LL || {};
LL.phase2Housing = (function () {
  'use strict';
  const data = () => LL.data.getAdult();
  const option = id => data().housing.find(item => item.id === id);
  const rules = () => data().rates.mortgage;

  function annuityFactor(annualRate) {
    const monthly = annualRate / 12;
    const months = rules().years * 12;
    return (1 - (1 + monthly) ** -months) / monthly;
  }

  function equity(property) {
    return property ? property.value - property.balance : 0;
  }

  function payment(property) {
    if (!property) return { interest: 0, principal: 0 };
    const interest = property.balance * rules().rate / 12;
    return { interest, principal: Math.min(property.balance, Math.max(0, property.payment - interest)) };
  }

  function transition(s, plan, baseline) {
    const a = s.adult;
    const home = option(plan.housing);
    const move = { deposit: 0, returned: 0, expense: 0, sale: 0, down: 0, bsu: 0, savings: 0, purchase: null };
    const sharing = LL.phase2Family.sharing(s, plan);
    const deposit = home.id === 'heime' || home.price ? 0 : Math.round(home.rent * data().rates.depositMonths * (sharing ? .5 : 1));
    if (a.housing === plan.housing) {
      if (home.shareable && Boolean(a.household?.lease) !== sharing) {
        move.returned = a.deposit;
        move.deposit = deposit;
      }
      return move;
    }

    move.returned = a.deposit;
    move.sale = equity(a.property);
    move.expense = data().rates.moving;
    if (!home.price) {
      move.deposit = deposit;
      return move;
    }

    const r = rules();
    const debt = a.studentDebt + a.creditDebt;
    const stress = Math.max(r.minStressRate, r.rate + r.stressIncrease);
    const debtService = debt ? Math.max(data().rates.repayment, debt * stress / 12) : 0;
    const incomeCap = baseline.wage * 12 * r.incomeMultiple - debt;
    const budgetCap = Math.max(0, baseline.wage - baseline.expense - debtService) * annuityFactor(stress);
    const loan = Math.floor(Math.max(0, Math.min(home.price * r.loanShare, incomeCap, budgetCap)));

    const workYears = LL.phase2State.progress(s, plan.routeId).workYears || 0;
    const stable = a.routeId === plan.routeId && !baseline.studying &&
      LL.phase2Paths.category(s, LL.phase2State.route(plan.routeId)) === 'work' && workYears >= r.stableWorkYears &&
      plan.workPercent >= r.minimumWorkPercent;
    move.expense += Math.round(home.price * r.deedTax);
    move.down = home.price - loan;
    move.bsu = Math.min(move.down, a.bsu);
    move.savings = Math.min(Math.max(0, s.stats.savings), move.down + move.expense - move.bsu);
    const liquid = s.stats.money + move.returned + move.sale + move.bsu + move.savings;
    move.purchase = {
      property: { id: home.id, value: home.price, balance: loan, payment: loan / annuityFactor(r.rate) },
      stable, requiresJob: loan > 0 && !stable,
      minimumDown: Math.round(home.price * (1 - r.loanShare)),
      missing: Math.max(0, move.down + move.expense - liquid)
    };
    return move;
  }

  function canSaveBsu(s, plan) {
    return !s.adult.bsuUsed && !option(plan.housing).price;
  }

  return { option, transition, equity, payment, canSaveBsu };
})();
