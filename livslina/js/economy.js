/* Livslina — economy.js
 * Datadriven månadsberekning: inntekter, utgifter, skatt, sparing.
 * Alle kronebeløp kjem frå grunndata.json via LL.data.
 */
window.LL = window.LL || {};

LL.economy = (function () {
  'use strict';

  const WEEKS_PER_MONTH = 4.33;
  const LOW_SPENDING_LIMIT = 600;
  const HIGH_SPENDING_LIMIT = 2200;

  // Fritidsaktivitetar (månadsutgift + trivsel/mnd)
  function activities() {
    return [
      { id: 'gym', label: 'Treningssenter', monthly: LL.data.value('leisure.gymYouthPerMonth'), wellbeing: 2.4, energy: 0.4 },
      { id: 'sport', label: 'Idrettslag', monthly: LL.data.value('leisure.sportsClubPerYear') / 12, wellbeing: 3.0, energy: 0.5 },
      { id: 'kultur', label: 'Kulturskule/korps', monthly: LL.data.value('leisure.cultureSchoolPerYear') / 12, wellbeing: 2.6, energy: 0.1 },
      { id: 'gaming', label: 'Gaming', monthly: LL.data.value('leisure.gamingPerMonth'), wellbeing: 0.7, energy: -0.3 }
    ];
  }

  function jobOptions() {
    return [
      { hours: 0, label: 'Ingen jobb' },
      { hours: 6, label: 'Laurdagsjobb (6 t/veke)' },
      { hours: 12, label: 'Mykje jobb (12 t/veke)' }
    ];
  }

  function savingsOptions() { return [0, 250, 500, 1000]; }

  function canteenOptions() {
    return LL.data.node('recurringSpending.canteen.options').map(option => ({ val: option.visits, label: option.label }));
  }
  function drinkOptions() {
    return LL.data.node('recurringSpending.drinks.options').map(option => ({ val: option.perWeek, label: option.label }));
  }
  function eatingOutOptions() {
    return LL.data.node('recurringSpending.eatingOut.options').map(option => ({ val: option.visitsPerWeek, label: option.label }));
  }
  function socialEventOptions() {
    return LL.data.node('recurringSpending.socialEvents.options').map(option => ({ val: option.eventsPerMonth, label: option.label }));
  }
  function weeklyBudgetOptions(path) {
    return LL.data.node('recurringSpending.' + path + '.options').map(option => ({ val: option.perWeek, label: option.label }));
  }
  function mobileDataOptions() {
    return LL.data.node('recurringSpending.mobilePlans').map(option => ({ val: option.id, label: option.label }));
  }
  function seasonPassOptions() {
    return [
      { val: false, label: 'Nei, eg kjøper det ikkje' },
      { val: true, label: 'Ja, eg kjøper sesongpass' }
    ];
  }

  function hourlyWage(state) {
    return state.age >= 18
      ? LL.data.value('work.hourlyWage18plus')
      : LL.data.value('work.hourlyWageUnder18');
  }

  // Aldersvariant for SIFO-postar
  function ageVariant(age) { return age >= 18 ? 'gameValue18plus' : 'gameValue14_17'; }

  function defaultPlan() {
    return {
      jobHours: 0, activities: [],
      canteenVisitsPerWeek: 1, drinksPerWeek: 1,
      eatingOutPerWeek: 1, socialEventsPerMonth: 1,
      clothingShoppingPerWeek: 100, inGamePurchasesPerWeek: 50,
      mobileDataPlan: 'mobile-10gb', seasonPass: false, savings: 0
    };
  }

  function selectedSpending(plan) {
    const spending = LL.data.node('recurringSpending');
    return {
      canteen: (Number(plan.canteenVisitsPerWeek) || 0) * spending.canteen.pricePerVisit * WEEKS_PER_MONTH,
      drinks: (Number(plan.drinksPerWeek) || 0) * spending.drinks.pricePerItem * WEEKS_PER_MONTH,
      eatingOut: (Number(plan.eatingOutPerWeek) || 0) * spending.eatingOut.pricePerVisit * WEEKS_PER_MONTH,
      socialEvents: (Number(plan.socialEventsPerMonth) || 0) * spending.socialEvents.pricePerEvent,
      clothingShopping: (Number(plan.clothingShoppingPerWeek) || 0) * WEEKS_PER_MONTH,
      inGamePurchases: (Number(plan.inGamePurchasesPerWeek) || 0) * WEEKS_PER_MONTH,
      seasonPass: plan.seasonPass ? spending.seasonPass.pricePerSeason / spending.seasonPass.monthsPerSeason : 0
    };
  }

  function activityCost(plan) {
    const acts = activities();
    return (plan.activities || []).reduce((total, id) => {
      const activity = acts.find(item => item.id === id);
      return total + (activity ? activity.monthly : 0);
    }, 0);
  }

  function spendingStyle(plan) {
    const choices = plan || defaultPlan();
    const selected = selectedSpending(choices);
    const total = Object.values(selected).reduce((sum, amount) => sum + amount, 0) + activityCost(choices);
    if (total <= LOW_SPENDING_LIMIT) return 'noysam';
    if (total >= HIGH_SPENDING_LIMIT) return 'raus';
    return 'sifo';
  }

  // Full månadsoppstilling gjeve state + plan. Returnerer breakdown-objekt.
  function monthlyBreakdown(state) {
    const plan = state.plan || defaultPlan();
    const age = state.age;
    const wageVar = ageVariant(age);
    const hybel = state.housing === 'hybel';
    const f = state.family;

    const income = {};
    const expense = {};

    // ── Inntekter ──
    const wage = plan.jobHours * WEEKS_PER_MONTH * hourlyWage(state);
    if (wage > 0) income.wage = wage;

    if (hybel) {
      if (f.parentContributionHybelPerMonth) income.parents = f.parentContributionHybelPerMonth;
      income.housingGrant = LL.data.value('grants.housingGrantPerMonth');
    } else if (f.allowancePerMonth) {
      income.allowance = f.allowancePerMonth;
    }
    if (f.incomeDependentGrant && f.incomeDependentGrant !== 'none') {
      const g = LL.data.node('grants.incomeDependentGrantPerMonth');
      const rate = g ? (g[f.incomeDependentGrant] || g.rateFull) : 0;
      if (rate) income.studyGrant = rate;
    }

    // ── Utgifter ──
    // Felles for begge busituasjonar: mobil og transport.
    const optional = LL.data.node('recurringSpending');
    const mobilePlan = optional.mobilePlans.find(option => option.id === plan.mobileDataPlan) ||
      optional.mobilePlans.find(option => option.id === 'mobile-10gb') || optional.mobilePlans[0];
    expense.mobile = mobilePlan.pricePerMonth;
    const spending = selectedSpending(plan);
    ['canteen', 'drinks', 'eatingOut', 'socialEvents', 'seasonPass'].forEach(key => {
      if (spending[key] > 0) expense[key] = spending[key];
    });
    if (state.possessions.moped) {
      expense.transport = LL.data.value('transport.mopedFuelPerMonth');
      expense.mopedInsurance = LL.data.value('transport.mopedInsurancePerYear') / 12;
    } else {
      expense.transport = LL.data.value('monthlyCosts.publicTransportYouth', 'gameValue14_17');
    }
    if (state.possessions.phoneInsurance) {
      expense.phoneInsurance = LL.data.value('events.phoneInsurancePerMonth');
    }

    // Fritidsaktivitetar (vald i budsjettkortet)
    const actCost = activityCost(plan);
    if (actCost > 0) expense.activities = actCost;

    if (hybel) {
      // Full sjølvhushaldning — spelaren ber alt sjølv.
      const basicClothing = LL.data.value('monthlyCosts.clothing', wageVar);
      const remainingClothing = Math.max(0, basicClothing - spending.clothingShopping);
      if (remainingClothing > 0) expense.clothing = remainingClothing;
      if (spending.clothingShopping > 0) expense.clothingShopping = spending.clothingShopping;
      expense.personalCare = LL.data.value('monthlyCosts.personalCare', wageVar);
      const basicPlayAndMedia = LL.data.value('monthlyCosts.playAndMedia', wageVar);
      const remainingPlayAndMedia = Math.max(0, basicPlayAndMedia - spending.inGamePurchases);
      if (remainingPlayAndMedia > 0) expense.playAndMedia = remainingPlayAndMedia;
      if (spending.inGamePurchases > 0) expense.inGamePurchases = spending.inGamePurchases;
      expense.rent = LL.data.value('housing.hybelRent');
      expense.food = LL.data.value('monthlyCosts.food', 'gameValue14_17');
      const h = LL.data.node('householdCostsSinglePerson');
      expense.household = (h.otherGroceries + h.householdItems + h.furniture + h.mediaAndLeisure);
    } else {
      // Bur heime: foreldra dekkjer nødvendige klede, mat, pleie og dei faste
      // medieutgiftene. Spelaren sine eigne val kjem fram som eigne budsjettlinjer.
      if (spending.clothingShopping > 0) expense.clothingShopping = spending.clothingShopping;
      if (spending.inGamePurchases > 0) expense.inGamePurchases = spending.inGamePurchases;
    }

    // Russebuss-andel (fordelt over halvåra fram til russetida)
    if (state.flags.russBuss) {
      expense.russBus = LL.data.value('leisure.russBus') / 24; // fordelt over ~24 mnd
    }

    const incomeTotal = sum(income);
    const expenseTotal = sum(expense);

    return {
      income, expense, incomeTotal, expenseTotal,
      net: incomeTotal - expenseTotal,
      savings: plan.savings || 0,
      wellbeingPerMonth: activityWellbeing(plan),
      energyPerMonth: jobEnergy(plan) + activityEnergy(plan)
    };
  }

  function activityWellbeing(plan) {
    const acts = activities();
    let w = 0;
    (plan.activities || []).forEach(id => { const a = acts.find(x => x.id === id); if (a) w += a.wellbeing; });
    return w;
  }
  function activityEnergy(plan) {
    const acts = activities();
    let e = 0;
    (plan.activities || []).forEach(id => { const a = acts.find(x => x.id === id); if (a) e += a.energy; });
    return e;
  }
  function jobEnergy(plan) {
    if (plan.jobHours >= 12) return -2;
    if (plan.jobHours >= 6) return -1;
    return 1; // roleg halvår gjev overskot
  }

  // Skatt: gjeve årsakkumulert løn og kor mykje som alt er skattlagt,
  // returner ny skatt for denne perioden.
  function taxOnWage(prevYearWage, newWage) {
    const limit = LL.data.value('tax.taxFreeCardLimit');
    const rate = 0.25;
    const before = Math.max(0, prevYearWage - limit) * rate;
    const after = Math.max(0, (prevYearWage + newWage) - limit) * rate;
    return Math.max(0, after - before);
  }

  function sum(obj) { let t = 0; for (const k in obj) t += obj[k]; return t; }

  // Etikettar for kategori-nøklar (norsk)
  const LABELS = {
    wage: 'Løn', parents: 'Foreldrebidrag', housingGrant: 'Bortebuarstipend',
    allowance: 'Lommepengar', studyGrant: 'Inntektsavh. stipend', grant: 'Utstyrsstipend',
    tax: 'Skatt',
    clothing: 'Klede og sko', clothingShopping: 'Klesshopping', personalCare: 'Personleg pleie', playAndMedia: 'Fritid og medium',
    mobile: 'Mobil og mobildata', canteen: 'Kjøp i skulekantina', drinks: 'Brus og energidrikk',
    eatingOut: 'Mat ute', socialEvents: 'Fest og sosiale arrangement',
    inGamePurchases: 'Kjøp inne i spel', seasonPass: 'Sesongpass i spel', transport: 'Transport', mopedInsurance: 'Mopedforsikring',
    phoneInsurance: 'Mobilforsikring', activities: 'Fritidsaktivitetar',
    rent: 'Husleige', food: 'Mat', household: 'Hushald', russBus: 'Russebuss',
    events: 'Uventa hendingar'
  };
  function label(key) { return LABELS[key] || key; }

  return {
    WEEKS_PER_MONTH,
    activities, jobOptions, savingsOptions, canteenOptions, drinkOptions, eatingOutOptions, socialEventOptions, weeklyBudgetOptions, mobileDataOptions, seasonPassOptions, hourlyWage, defaultPlan,
    selectedSpending, spendingStyle, monthlyBreakdown, taxOnWage, label, ageVariant, sum
  };
})();
