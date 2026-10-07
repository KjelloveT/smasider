/* Livslina — ui-budget.js
 * Budsjettkortet: planlegg halvåret (jobb, forbruksvanar, aktivitetar, sparing)
 * med live månadsoppstilling.
 */
window.LL = window.LL || {};

LL.uiBudget = (function () {
  'use strict';

  let draft = null;

  function open() {
    const state = LL.state.get();
    const round = LL.state.currentRound();
    state.age = round.age;
    document.getElementById('budgetRound').textContent = 'Planlegg ' + round.label.toLowerCase();
    draft = Object.assign(LL.economy.defaultPlan(), state.plan || state.planPreferences || {});
    draft.activities = (draft.activities || []).slice();
    draft.weekdayHours = Object.assign({}, draft.weekdayHours || {});
    LL.economy.fitWeekdayHours(draft);
    if (state.creditRestriction) applyDebtPlan();
    const debtMessage = document.getElementById('budgetDebtMessage');
    debtMessage.hidden = !state.creditRestriction;
    debtMessage.textContent = state.creditRestriction
      ? 'Gjeldsgrensa er nådd. Frie innkjøp, romkjøp, sesongpass, aktivitetar og fast sparing er sette på pause til saldoen kjem over −5 000 kr. Restriksjonane slår inn ved −10 000 kr.'
      : '';
    renderControls();
    recompute();
    LL.main.showScreen('screen-budget');
    LL.util.hydrate(document.getElementById('screen-budget'));
  }

  function renderControls() {
    const restricted = LL.state.get().creditRestriction;
    // Jobb
    btnGroup('budgetJob', LL.economy.jobOptions().map(o => ({ val: o.hours, label: o.label })),
      draft.jobHours, v => {
        draft.jobHours = v;
        LL.economy.fitWeekdayHours(draft);
        renderWeekdayControls();
        recompute();
      });
    renderWeekdayControls();
    btnGroup('budgetCanteen', LL.economy.canteenOptions(),
      draft.canteenVisitsPerWeek, v => { draft.canteenVisitsPerWeek = v; recompute(); }, restricted);
    btnGroup('budgetDrinks', LL.economy.drinkOptions(),
      draft.drinksPerWeek, v => { draft.drinksPerWeek = v; recompute(); }, restricted);
    btnGroup('budgetEatingOut', LL.economy.eatingOutOptions(),
      draft.eatingOutPerWeek, v => { draft.eatingOutPerWeek = v; recompute(); }, restricted);
    btnGroup('budgetSocialEvents', LL.economy.socialEventOptions(),
      draft.socialEventsPerMonth, v => { draft.socialEventsPerMonth = v; recompute(); }, restricted);
    btnGroup('budgetClothingShopping', LL.economy.weeklyBudgetOptions('clothingShopping'),
      draft.clothingShoppingPerWeek, v => { draft.clothingShoppingPerWeek = v; recompute(); }, restricted);
    btnGroup('budgetInGamePurchases', LL.economy.weeklyBudgetOptions('inGamePurchases'),
      draft.inGamePurchasesPerWeek, v => { draft.inGamePurchasesPerWeek = v; recompute(); }, restricted);
    btnGroup('budgetMobile', LL.economy.mobileDataOptions(),
      draft.mobileDataPlan, v => { draft.mobileDataPlan = v; recompute(); }, restricted);
    btnGroup('budgetSeasonPass', LL.economy.seasonPassOptions(),
      draft.seasonPass, v => { draft.seasonPass = v; recompute(); }, restricted);
    // Sparing
    btnGroup('budgetSavings', LL.economy.savingsOptions().map(v => ({ val: v, label: v === 0 ? 'Ingen' : LL.util.kr(v) + '/mnd' })),
      draft.savings, v => { draft.savings = v; recompute(); }, restricted);
    // Aktivitetar (fleirval)
    const wrap = document.getElementById('budgetActivities');
    wrap.textContent = '';
    LL.economy.activities().forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vp-button vp-button--tool';
      b.textContent = a.label + ' (' + LL.util.kr(a.monthly) + ')';
      const on = draft.activities.includes(a.id);
      b.setAttribute('aria-pressed', String(on));
      b.disabled = restricted;
      b.addEventListener('click', () => {
        const i = draft.activities.indexOf(a.id);
        if (i === -1) draft.activities.push(a.id); else draft.activities.splice(i, 1);
        b.setAttribute('aria-pressed', String(draft.activities.includes(a.id)));
        recompute();
      });
      wrap.appendChild(b);
    });
  }

  function renderWeekdayControls() {
    const wrap = document.getElementById('budgetWeekdayControls');
    wrap.textContent = '';
    LL.economy.weekdayChoices().forEach(choice => {
      const row = document.createElement('div');
      row.className = 'll-time-row';

      const name = document.createElement('label');
      name.htmlFor = 'budgetTime-' + choice.key;
      name.textContent = choice.label;
      const labelWrap = document.createElement('div');
      labelWrap.className = 'll-time-label';
      labelWrap.appendChild(name);
      let helpText = null;
      if (choice.key === 'selfStudy') {
        const helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.className = 'vp-button vp-button--icon vp-button--quiet ll-time-help-button';
        helpButton.setAttribute('aria-label', 'Forklaring på eigenstudium');
        helpButton.setAttribute('aria-expanded', 'false');
        helpButton.setAttribute('aria-controls', 'budgetSelfStudyHelp');
        const icon = document.createElement('span');
        icon.dataset.icon = 'helpCircle';
        icon.dataset.iconSize = '16';
        icon.setAttribute('aria-hidden', 'true');
        helpButton.appendChild(icon);
        helpText = document.createElement('p');
        helpText.id = 'budgetSelfStudyHelp';
        helpText.className = 'll-note ll-time-help';
        helpText.hidden = true;
        helpText.textContent = 'Du får gjort lekser og skulearbeid innan dei 8 timane som er sette av. Dette er tid til ekstra innsats, øving til prøve og anna skulearbeid som krev meir innsats.';
        helpButton.addEventListener('click', () => {
          const isOpen = !helpText.hidden;
          helpText.hidden = isOpen;
          helpButton.setAttribute('aria-expanded', String(!isOpen));
        });
        labelWrap.appendChild(helpButton);
      }
      const select = document.createElement('select');
      select.className = 'vp-input ll-time-select';
      select.id = 'budgetTime-' + choice.key;
      select.setAttribute('aria-label', choice.label + ' per kvardag');
      for (let halfHours = 0; halfHours <= 16; halfHours++) {
        const hours = halfHours / 2;
        const option = document.createElement('option');
        option.value = String(hours);
        option.textContent = hours.toLocaleString('nn-NO', { maximumFractionDigits: 1 }) + ' t';
        select.appendChild(option);
      }
      select.value = String(draft.weekdayHours[choice.key] || 0);
      select.addEventListener('change', () => {
        draft.weekdayHours[choice.key] = Number(select.value);
        updateWeekdayControls();
        recompute();
      });
      row.append(labelWrap, select);
      wrap.appendChild(row);
      if (helpText) wrap.appendChild(helpText);
    });
    updateWeekdayControls();
    LL.util.hydrate(wrap);
  }

  function updateWeekdayControls() {
    const choices = LL.economy.weekdayChoices();
    const selected = draft.weekdayHours;
    const total = choices.reduce((sum, choice) => sum + (Number(selected[choice.key]) || 0), 0);
    const available = LL.economy.weekdayTimeLimit(draft.jobHours);
    choices.forEach(choice => {
      const select = document.getElementById('budgetTime-' + choice.key);
      if (!select) return;
      const others = total - (Number(selected[choice.key]) || 0);
      Array.from(select.options).forEach(option => {
        option.disabled = Number(option.value) > available - others + 0.001;
      });
    });
    const remaining = document.getElementById('budgetFreeTime');
    const format = value => value.toLocaleString('nn-NO', { maximumFractionDigits: 1 });
    const jobImpact = document.getElementById('budgetJobTimeImpact');
    if (jobImpact) {
      const workHours = LL.economy.weekdayWorkHours(draft.jobHours);
      if (workHours > 0) {
        jobImpact.textContent = 'Mykje jobb (12 t/veke) er rekna som ' + format(workHours) + ' timar kvar kvardag i denne planen.';
      } else if (Number(draft.jobHours) >= 6) {
        jobImpact.textContent = 'Laurdagsjobben kjem utanom kvardagen og tek ikkje tid frå denne planen.';
      } else {
        jobImpact.textContent = 'Ingen jobb tek tid frå denne kvardagen.';
      }
    }
    if (remaining) {
      const timeLeft = LL.economy.weekdayEffects(draft).freeHours;
      remaining.textContent = 'Du har ' + format(timeLeft) + ' av ' + format(available) + ' timar att til eigne val denne kvardagen.';
    }
  }

  function btnGroup(id, opts, current, onPick, disabled) {
    const row = document.getElementById(id);
    row.textContent = '';
    opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vp-button vp-button--tool';
      b.textContent = o.label;
      b.disabled = Boolean(disabled);
      b.setAttribute('aria-pressed', String(o.val === current));
      b.addEventListener('click', () => {
        row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        onPick(o.val);
      });
      row.appendChild(b);
    });
  }

  function applyDebtPlan() {
    const first = options => options.length ? options[0].val : null;
    draft.canteenVisitsPerWeek = first(LL.economy.canteenOptions());
    draft.drinksPerWeek = first(LL.economy.drinkOptions());
    draft.eatingOutPerWeek = first(LL.economy.eatingOutOptions());
    draft.socialEventsPerMonth = first(LL.economy.socialEventOptions());
    draft.clothingShoppingPerWeek = first(LL.economy.weeklyBudgetOptions('clothingShopping'));
    draft.inGamePurchasesPerWeek = first(LL.economy.weeklyBudgetOptions('inGamePurchases'));
    draft.mobileDataPlan = LL.data.node('recurringSpending.mobilePlans')
      .slice().sort((a, b) => a.pricePerMonth - b.pricePerMonth)[0].id;
    draft.seasonPass = false;
    draft.savings = 0;
    draft.activities = [];
  }

  function recompute() {
    const state = LL.state.get();
    const preview = Object.assign({}, state, { plan: draft, age: LL.state.currentRound().age });
    const b = LL.economy.monthlyBreakdown(preview);
    updateWeekdayControls();

    // Oppstilling
    const inc = document.getElementById('budgetIncome');
    const exp = document.getElementById('budgetExpense');
    inc.innerHTML = ''; exp.innerHTML = '';
    for (const k in b.income) inc.appendChild(row(LL.economy.label(k), b.income[k], false));
    for (const k in b.expense) exp.appendChild(row(LL.economy.label(k), b.expense[k], true));

    const displayedIncome = displayedTotal(b.income);
    const displayedExpense = displayedTotal(b.expense);
    document.getElementById('budgetIncomeTotal').textContent = LL.util.kr(displayedIncome);
    document.getElementById('budgetExpenseTotal').textContent = LL.util.kr(displayedExpense);
    const net = document.getElementById('budgetNet');
    const displayedNet = displayedIncome - displayedExpense;
    net.textContent = (displayedNet >= 0 ? '+' : '') + LL.util.kr(displayedNet) + '/mnd';
    net.className = 'll-stat-val' + (displayedNet < 0 ? ' neg' : '');

    const savLine = document.getElementById('budgetSavingsLine');
    savLine.textContent = b.savings > 0
      ? 'Sparetrekk: ' + LL.util.kr(b.savings) + '/mnd → sparekonto'
      : 'Ingen fast sparing denne perioden.';

    // Frikort-projeksjon
    const wageMonth = b.wageTotal || 0;
    const yearWage = (state._yearWage || 0) + wageMonth * (LL.state.currentRound().months || 6);
    const limit = LL.data.value('tax.taxFreeCardLimit');
    const warn = document.getElementById('budgetFrikort');
    if (wageMonth > 0) {
      warn.hidden = false;
      if (yearWage > limit) {
        warn.textContent = '⚠ Med denne jobbinga passerer du frikortgrensa (' + LL.util.kr(limit) + ') i år — då blir det trekt skatt på det overskytande.';
      } else {
        warn.textContent = 'Estimert årsløn: ' + LL.util.kr(yearWage) + ' — under frikortgrensa (' + LL.util.kr(limit) + '), så du slepp skatt.';
      }
    } else {
      warn.hidden = true;
    }
  }

  function row(label, val, isExpense) {
    const div = document.createElement('div');
    div.className = 'll-budget-row';
    const l = document.createElement('span'); l.textContent = label;
    const v = document.createElement('strong'); v.textContent = (isExpense ? '−' : '+') + LL.util.kr(val);
    div.append(l, v);
    return div;
  }

  function displayedTotal(rows) {
    return Object.values(rows).reduce((total, value) => total + Math.round(value || 0), 0);
  }

  function confirm() {
    const state = LL.state.get();
    state.plan = Object.assign({}, draft, { activities: draft.activities.slice() });
    if (!state.creditRestriction) {
      state.planPreferences = Object.assign({}, state.plan, { activities: state.plan.activities.slice() });
    }
    if (LL.economy.spendingStyle(draft) === 'noysam') state.noysamCount = (state.noysamCount || 0) + 1;
    // Hjørne-slot i dioramaet følgjer fritidsvalet
    if (draft.activities.includes('sport') || draft.activities.includes('gym')) state.possessions.hobby = 'trening';
    else if (draft.activities.includes('kultur')) state.possessions.hobby = 'gitar';
    else state.possessions.hobby = 'plante';
    LL.storage.saveActive(state);
    LL.uiPlayback.startTerm();
  }

  function init() {
    document.getElementById('budgetRun').addEventListener('click', confirm);
    document.getElementById('budgetBack').addEventListener('click', () => LL.main.enterHome());
  }

  return { init, open };
})();
