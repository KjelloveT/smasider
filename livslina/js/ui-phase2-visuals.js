/* Visuelle spelteikn: same symbol i målarar, val, årsplan og oppgjer. */
window.LL = window.LL || {};
LL.uiPhase2Visuals = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  const METERS = { energy: ['Energi', 'zap'], wellbeing: ['Trivsel', 'heart'], social: ['Sosialt', 'users'] };
  function icon(name, size) {
    const node = el('span'); node.setAttribute('aria-hidden', 'true');
    node.innerHTML = LL.util.icon(name, size || 22); return node;
  }
  function sign(value, money) {
    return (value > 0 ? '+' : '') + (money ? LL.util.kr(value) : value.toLocaleString('nn-NO', { maximumFractionDigits: 1 }).replace('-', '−'));
  }
  function token(name, value, description) {
    const node = el('span', 'll-adult-token');
    node.setAttribute('role', 'img'); node.setAttribute('aria-label', description); node.title = description;
    const text = el('span', '', value); text.setAttribute('aria-hidden', 'true');
    node.append(icon(name), text); return node;
  }
  function meter(key, value) {
    const bar = el('div', 'll-meter'), fill = el('div', 'll-meter-fill');
    bar.setAttribute('role', 'meter'); bar.setAttribute('aria-label', METERS[key][0]);
    bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', Math.round(value));
    fill.style.width = LL.util.clamp(value, 0, 100) + '%';
    if (key !== 'social' && value < 35) fill.classList.add('warn');
    bar.append(fill); return bar;
  }
  function effects(choice, s) {
    const e = choice.effects, items = [];
    const cash = (e.cash || 0) + (e.wage || 0);
    if (cash) items.push(['coins', sign(cash, true), sign(cash, true) + ' på konto no' + (e.wage ? ', før endeleg skatt' : '')]);
    if (e.monthlyExpense) items.push(['coins', sign(-e.monthlyExpense, true) + '/mnd', 'Utgifter ' + sign(e.monthlyExpense, true) + ' kvar månad resten av året']);
    if (e.monthlyWage) items.push(['coins', sign(e.monthlyWage, true) + '/mnd før skatt', 'Bruttoløn ' + sign(e.monthlyWage, true) + ' kvar månad resten av året']);
    Object.entries(METERS).forEach(([key, [name, symbol]]) => {
      if (!e[key]) return;
      let delta = key === 'wellbeing' ? LL.state.scaledWellbeingDelta(e[key]) : e[key];
      if (s) delta = LL.util.clamp(s.stats[key] + delta, 0, 100) - s.stats[key];
      items.push([symbol, sign(delta), name + ' ' + sign(delta)]);
    });
    if (e.study) items.push(['bookOpen', e.study > 0 ? '↑' : '↓', e.study > 0 ? 'Meir rom for studiearbeid' : 'Mindre rom for studiearbeid']);
    const wrap = el('span', 'll-adult-effects'); items.forEach(item => wrap.append(token(...item))); return wrap;
  }
  function year(run) {
    const list = el('ol', 'll-adult-year'); list.setAttribute('aria-label', 'August til juli');
    list.setAttribute('role', 'list');
    LL.phase2Sim.MONTHS.forEach((name, index) => {
      const month = index + 1, scheduled = run.schedule.find(e => e.month === month);
      const resolved = scheduled && run.resolved.includes(scheduled.id), current = month === run.month;
      const passed = month <= run.month && (!scheduled || resolved);
      const cell = el('li', 'vp-panel vp-panel--soft ll-adult-month');
      cell.style.setProperty('--vp-panel-fill', current ? 'var(--vp-honey)' : passed ? 'var(--vp-moss)' : 'var(--vp-paper)');
      const status = current && scheduled && !resolved ? 'Vel no' : passed ? 'Ferdig' : scheduled ? 'Eit val ventar' : 'Kjem seinare';
      cell.setAttribute('aria-label', name + ': ' + status); cell.title = name + ': ' + status;
      if (current) cell.setAttribute('aria-current', 'step');
      const label = el('span', '', name.slice(0, 3)); label.setAttribute('aria-hidden', 'true');
      cell.append(label, icon(passed ? 'check' : scheduled ? 'mapPin' : 'minus', 19)); list.append(cell);
    });
    return list;
  }
  function studySteps(s, item) {
    const wrap = el('div', 'll-adult-study-years');
    const done = LL.phase2State.progress(s, item.id).years;
    const completed = done.toLocaleString('nn-NO');
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', completed + ' av ' + item.years + ' studieår fullførte');
    for (let year = 1; year <= item.years; year++) {
      const step = el('span', 'vp-panel vp-panel--soft ll-adult-study-step');
      const complete = done >= year;
      const partial = done > year - 1 && !complete;
      step.style.setProperty('--vp-panel-fill', complete ? 'var(--vp-moss)' : partial ? 'var(--vp-honey)' : 'var(--vp-paper)');
      step.append(icon(complete ? 'check' : partial ? 'clock' : 'bookOpen', 20), el('span', '', String(year)));
      wrap.append(step);
    }
    if (!Number.isInteger(done)) wrap.append(el('span', 'll-note', completed + ' / ' + item.years + ' år'));
    return wrap;
  }
  function moneyFlow(rows) {
    const wrap = el('div', 'll-adult-cashflow'), max = Math.max(1, ...rows.map(row => Math.abs(row[1])));
    rows.filter(row => row[1]).forEach(([label, value, symbol]) => {
      const row = el('div', 'll-adult-cash-row'), reading = el('div', 'll-budget-row');
      const title = el('span', 'll-adult-token'); title.append(icon(symbol || 'coins', 20), el('span', '', label));
      reading.append(title, el('strong', '', LL.util.kr(value)));
      const bar = el('progress'); bar.max = max; bar.value = Math.abs(value); bar.setAttribute('aria-hidden', 'true');
      row.append(reading, bar); wrap.append(row);
    });
    return wrap;
  }
  return { METERS, icon, token, meter, effects, year, studySteps, moneyFlow };
})();
