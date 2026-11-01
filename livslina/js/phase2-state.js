/* Faseovergang, kvalifikasjonar og versjonert vidareføring av same livsline. */
window.LL = window.LL || {};
LL.phase2State = (function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const number = value => Number.isFinite(value) ? value : 0;
  const route = id => LL.data.getAdult().routes.find(item => item.id === id) || null;

  function migrate(s, oldVersion) {
    if (s.phase === 2) {
      validate(s);
      return;
    }
    s.phase = 1;
    // Den eldre avslutninga låg etter første læreår, før dei to nye halvåra.
    if (oldVersion < 10 && s.trainingRoute === 'apprenticeship' && s.program && s.program.type === 'yrkesfag' && s.roundIndex >= 8) {
      s.roundIndex = 8;
      s.finished = false;
      s.age = 19;
    }
  }

  function completeSchool(s) {
    if (!s.finished || s.phase === 2 || s.roundIndex < LL.state.rounds().length) return false;
    s.qualifications = {
      study: s.program.type === 'studieforberedande',
      trade: s.trainingRoute === 'apprenticeship' && s.flags.fagprovePass ? s.program.id : null
    };
    return s.trainingRoute !== 'apprenticeship' || Boolean(s.qualifications.trade);
  }

  function passTradeExam(s, preparation) {
    if (!s.finished || s.phase !== 1 || s.trainingRoute !== 'apprenticeship' || s.roundIndex < LL.state.rounds().length) return false;
    if (!s.flags.fagprovePass) {
      if (preparation) { s.stats.energy = Math.max(0, s.stats.energy - 2); s.flags.fagprovePrepared = true; }
      s.flags.fagprovePass = true;
    }
    completeSchool(s);
    return true;
  }

  function begin(s) {
    if (s.phase === 2) return s.adult;
    if (!completeSchool(s)) throw new Error('Fullfør vidaregåandeløpet og fagprøva fyrst.');
    const age = s.trainingRoute === 'apprenticeship' ? 20 : 19;
    const wasBsu = Boolean(s.stats.savingsIsBsu);
    const saved = Math.max(0, number(s.stats.savings));
    s.schoolResult = { age, program: s.program.id, trainingRoute: s.trainingRoute,
      stats: clone(s.stats), qualifications: clone(s.qualifications) };
    s.adult = {
      version: 1, entryAge: age, age, year: 0, routeId: null, complete: false,
      status: 'planning', qualifications: clone(s.qualifications), progress: {},
      bsu: wasBsu ? saved : 0, bsuContributed: wasBsu ? Math.min(saved, 300000) : 0,
      deposit: s.flags.depositumBetalt ? 6000 : 0,
      studentDebt: 0, creditDebt: 0, loanLots: [], calendars: {},
      housing: s.housing === 'hybel' ? 'kollektiv' : 'heime',
      goals: [], reports: [], plan: null, run: null, careerYears: 0,
      narrative: s.stats.money < 0 ? 'Du tek med ein stram konto frå vidaregåande.' : 'Pengane og vala frå vidaregåande blir med deg vidare.'
    };
    if (wasBsu) s.stats.savings = 0;
    s.stats.savingsIsBsu = false;
    s.age = age;
    s.phase = 2;
    s.finished = false;
    return s.adult;
  }

  function available(s, item) {
    const a = s.adult;
    if (item.kind === 'study') return a.qualifications.study;
    if (item.kind === 'bridge') return !a.qualifications.study;
    if (item.program === 'other') return Boolean(a.qualifications.trade) && !LL.data.getAdult().routes.some(r => r.program === a.qualifications.trade);
    return !item.program || item.program === a.qualifications.trade;
  }

  function progress(s, id) {
    return s.adult.progress[id] || { years: 0, graduated: false, workYears: 0 };
  }

  function isStudying(s, plan) {
    const item = route(plan.routeId);
    return item && (item.kind === 'bridge' || item.kind === 'study' && !progress(s, item.id).graduated);
  }

  function label(s, id) {
    const item = route(id);
    if (!item) return 'Vel retning';
    if (item.kind === 'study' && progress(s, id).graduated) return item.graduate + ' · arbeid etter fullført grad';
    if (item.id === 'eige-fag') return item.label + ' · ' + s.program.name;
    return item.label;
  }

  function networth(s) {
    const a = s.adult;
    return s.stats.money + s.stats.savings + a.bsu + a.deposit - a.studentDebt - a.creditDebt;
  }

  function goalValue(s, goal) {
    if (goal.id === 'utdanning') return progress(s, goal.routeId).years;
    if (goal.id === 'overskot') return s.stats.energy;
    if (goal.id === 'gjeld') return Math.max(0, goal.baseline - s.adult.studentDebt - s.adult.creditDebt);
    return s.stats.savings * (goal.share / 100) + (goal.id === 'bustad' ? s.adult.bsu : 0);
  }

  function normalizeGoals(s, goals) {
    const definitions = LL.data.getAdult().goals;
    const seen = new Set();
    let allocation = 0;
    return (Array.isArray(goals) ? goals : []).slice(0, 2).filter(g => {
      const valid = g && definitions.some(d => d.id === g.id) && !seen.has(g.id);
      if (valid) seen.add(g.id);
      return valid;
    }).map(g => {
      const definition = definitions.find(d => d.id === g.id);
      const selectedStudy = route(g.routeId || s.adult.routeId);
      const goalStudy = selectedStudy && selectedStudy.years ? selectedStudy : route(s.adult.qualifications.study ? 'okonomi' : 'pabygg');
      const share = definition.kind === 'money' ? Math.max(0, Math.min(100 - allocation, Math.round(Number(g.share) || 0))) : 0;
      allocation += share;
      return { id: g.id, routeId: g.id === 'utdanning' ? goalStudy.id : null,
        target: g.id === 'utdanning' ? goalStudy.years : Math.max(1, Math.min(g.id === 'overskot' ? 100 : 1000000, Number(g.target) || definition.defaultTarget)),
        deadline: Math.max(s.adult.entryAge + 1, Math.min(40, Number(g.deadline) || s.adult.age + 3)), share,
        baseline: g.id === 'gjeld' ? (Number.isFinite(g.baseline) ? g.baseline : s.adult.studentDebt + s.adult.creditDebt) : 0 };
    });
  }

  function validate(s) {
    const a = s.adult;
    if (!a || a.version !== 1 || !Number.isInteger(a.year) || a.year < 0 || a.year > 15 || !Number.isInteger(a.age) || a.age < 19 || a.age > 40 || !a.qualifications || !a.progress || !a.calendars || !Array.isArray(a.reports) || !Array.isArray(a.loanLots) || !Array.isArray(a.goals)) throw new Error('Fase 2-lagringa har eit ukjent format.');
    for (const key of ['bsu', 'bsuContributed', 'deposit', 'studentDebt', 'creditDebt']) {
      if (!Number.isFinite(a[key]) || a[key] < 0 || a[key] > 100000000) throw new Error('Ugyldig kontoverdi i fase 2-lagringa.');
    }
    if (a.routeId && !route(a.routeId)) throw new Error('Lagringa viser til ei ukjend retning.');
    if (!['planning', 'playing', 'report'].includes(a.status) || !Number.isInteger(a.entryAge) || a.entryAge < 19 || a.entryAge > 20 || typeof a.qualifications.study !== 'boolean') throw new Error('Ugyldig fasestatus.');
    if (!['money', 'savings', 'energy', 'wellbeing', 'social'].every(k => Number.isFinite(s.stats[k]))) throw new Error('Ugyldige målarar i lagringa.');
    if (a.draft && (!a.draft.plan || !Array.isArray(a.draft.goals))) delete a.draft;
    if (a.reports.some(r => !r || !route(r.routeId) || !r.start || !r.start.stats || !r.end || !r.end.stats || !r.totals || !Array.isArray(r.events))) throw new Error('Ugyldig årsoppgjer i lagringa.');
    for (const [id, p] of Object.entries(a.progress)) {
      if (!route(id) || !p || !Number.isFinite(p.years) || p.years < 0 || p.years > 6) throw new Error('Ugyldig studieframdrift.');
    }
    for (const calendar of Object.values(a.calendars)) {
      if (!calendar || !['wage', 'interest', 'taxPaid', 'bsuPaid', 'support'].every(k => Number.isFinite(calendar[k]) && calendar[k] >= 0)) throw new Error('Ugyldig årsrekneskap.');
    }
    for (const lot of a.loanLots) {
      if (!lot || !route(lot.routeId) || !['principal', 'passConverted', 'degreeConverted'].every(k => Number.isFinite(lot[k]) && lot[k] >= 0)) throw new Error('Ugyldig lånshistorikk.');
    }
    a.goals = normalizeGoals(s, a.goals);
    if (a.run) {
      const r = a.run;
      if (!Number.isInteger(r.month) || r.month < 0 || r.month > 12 || r.year !== a.year || !r.plan || !route(r.plan.routeId) || !available(s, route(r.plan.routeId)) || !Array.isArray(r.schedule) || !Array.isArray(r.resolved) || !r.totals || !r.start || !r.modifiers) throw new Error('Det pågåande året kan ikkje lesast.');
      const events = LL.data.getAdult().events;
      if (r.schedule.some(e => !e || !events.some(d => d.id === e.id) || !Number.isInteger(e.month) || e.month < 1 || e.month > 12)) throw new Error('Ugyldig hendingsplan.');
      if (!['wage', 'loan', 'bridge', 'expense', 'tax', 'saved', 'bsu', 'repaid', 'caseCash', 'converted', 'interest'].every(k => Number.isFinite(r.totals[k])) || !['monthlyExpense', 'monthlyWage'].every(k => Number.isFinite(r.modifiers[k])) || !Number.isFinite(r.study) || !Number.isFinite(r.energyTotal) || !Array.isArray(r.loanIndexes) || r.loanIndexes.some(i => !Number.isInteger(i) || !a.loanLots[i])) throw new Error('Ugyldige tal i det pågåande året.');
      if (r.resolved.some(id => !r.schedule.some(e => e.id === id))) throw new Error('Ugyldige hendingsval.');
    }
  }
  return { migrate, completeSchool, passTradeExam, begin, route, available, progress, isStudying, label, networth, goalValue, normalizeGoals, validate };
})();
