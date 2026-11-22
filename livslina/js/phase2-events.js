/* Fase 2-case: relevante vilkår, frøstyrt utval og daterte konsekvensar. */
window.LL = window.LL || {};
LL.phase2Events = (function () {
  'use strict';
  function eligible(s, event, plan, context = {}) {
    const item = LL.phase2State.route(plan.routeId);
    const studying = LL.phase2State.isStudying(s, plan);
    if (event.id === 'overgang-pabygggruppe') return item.kind === 'bridge';
    if (event.id === 'overgang-fagveg' && !s.adult.qualifications.trade) return false;
    if (event.id === 'overgang-forstejobb') return !studying && s.adult.careerYears === 0;
    if (event.id === 'overgang-nyby' && (!context.moved || plan.housing === 'heime')) return false;
    if (event.id === 'overgang-leigekontrakt' && (!context.moved || !context.renting)) return false;
    if (event.id === 'overgang-byteplan' && !context.changed) return false;
    if (event.group === 'goal' && !s.adult.goals.length) return false;
    return ['common', 'goal', 'transition'].includes(event.group) ||
      event.group === 'study' && studying || event.group === 'gap' && item.kind === 'gap' ||
      event.group === item.id && (item.kind !== 'study' || studying);
  }

  function prepare(s, plan, context) {
    const all = LL.data.getAdult().events;
    const recent = new Set(s.adult.reports.slice(-2).flatMap(r => r.events || []));
    const pool = all.filter(e => eligible(s, e, plan, context));
    const shuffled = Vy.shuffle(pool.filter(e => !recent.has(e.id)), LL.state.draw);
    const specific = shuffled.find(e => e.group === plan.routeId || e.group === (LL.phase2State.isStudying(s, plan) ? 'study' : LL.phase2State.route(plan.routeId).kind));
    const chosen = specific ? [specific] : [];
    const continuation = shuffled.find(event => !chosen.includes(event) && recall(s, event));
    if (continuation) chosen.push(continuation);
    for (const event of shuffled.concat(Vy.shuffle(pool, LL.state.draw))) {
      if (chosen.length >= 6) break;
      if (!chosen.includes(event)) chosen.push(event);
    }
    return chosen.map((event, i) => ({ id: event.id, month: 2 + i * 2 }));
  }

  function pending(s) {
    const r = s.adult.run;
    if (!r) return null;
    const scheduled = r.schedule.find(e => e.month <= r.month && !r.resolved.includes(e.id));
    return scheduled ? LL.data.getAdult().events.find(e => e.id === scheduled.id) : null;
  }

  function choose(s, eventId, index) {
    const event = pending(s), r = s.adult.run;
    if (!event || event.id !== eventId || !Number.isInteger(index) || !event.choices[index]) return false;
    const selected = event.choices[index];
    const effects = selected.effects;
    const before = { ...s.stats };
    const calKey = r.year + (r.month > 5 ? 1 : 0);
    const cal = LL.phase2Economy.calendar(s, calKey);
    const cash = (effects.cash || 0) + (effects.wage || 0);
    s.stats.money += cash;
    r.totals.caseCash += cash;
    r.totals.expense += Math.max(0, -(effects.cash || 0));
    r.totals.otherIncome = (r.totals.otherIncome || 0) + Math.max(0, effects.cash || 0);
    if (effects.wage) { cal.wage += effects.wage; r.totals.wage += effects.wage; s.totalWage += effects.wage; }
    ['energy', 'social'].forEach(k => { s.stats[k] = LL.util.clamp(s.stats[k] + (effects[k] || 0), 0, 100); });
    LL.state.adjustWellbeing(s, effects.wellbeing || 0);
    ['monthlyExpense', 'monthlyWage'].forEach(k => { r.modifiers[k] += effects[k] || 0; });
    r.study += effects.study || 0;
    if (effects.flag) s.flags['adult_' + effects.flag] = true;
    r.resolved.push(event.id);
    const delta = LL.phase2Effects.changes(before, s.stats);
    LL.phase2Effects.record(r, 'event-' + event.id, event.title + ' · ' + selected.label, delta);
    r.trends = delta;
    const log = { phase: 2, year: r.year, month: r.month, id: event.id, choice: index, label: event.title, choiceLabel: selected.label, delta, moneyAfter: s.stats.money };
    s.eventLog.push(log);
    s.decisions.push({ round: 'adult-' + r.year, id: event.id, label: event.title, delta: cash, note: event.choices[index].label });
    return true;
  }

  function recall(s, event) {
    return (event.recall || []).find(entry => {
      const previous = s.eventLog.findLast(log => log.phase === 2 && log.id === entry.id);
      return previous && (entry.choice === undefined || entry.choice === previous.choice);
    });
  }

  function story(s, event) {
    return [recall(s, event)?.text, event.text].filter(Boolean);
  }

  function resolvedNow(s) {
    const r = s.adult.run;
    return r && s.eventLog.findLast(log => log.phase === 2 && log.year === r.year && log.month === r.month);
  }

  function consequence(choice) {
    const e = choice.effects;
    const parts = [];
    if (e.cash || e.wage) parts.push(LL.util.kr((e.cash || 0) + (e.wage || 0)) + ' no');
    if (e.monthlyExpense) parts.push('Utgifter ' + (e.monthlyExpense > 0 ? '+' : '') + LL.util.kr(e.monthlyExpense) + '/mnd resten av året');
    if (e.monthlyWage) parts.push('Bruttoløn ' + (e.monthlyWage > 0 ? '+' : '') + LL.util.kr(e.monthlyWage) + '/mnd resten av året');
    const names = { energy: 'energi', wellbeing: 'trivsel', social: 'sosialt' };
    Object.keys(names).forEach(k => { if (e[k]) { const value = k === 'wellbeing' ? LL.state.scaledWellbeingDelta(e[k]) : e[k]; parts.push((value > 0 ? '+' : '') + value.toLocaleString('nn-NO', { maximumFractionDigits: 1 }) + ' ' + names[k]); } });
    if (e.study) parts.push(e.study > 0 ? 'Støttar studieframdrifta' : 'Mindre rom for studiearbeid');
    return parts.join(' · ');
  }
  return { eligible, prepare, pending, choose, consequence, story, resolvedNow };
})();
