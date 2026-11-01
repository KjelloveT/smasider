/* Køyr med node --test livslina/tests/phase2.test.cjs. Ingen nye avhengnader. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const clone = obj => JSON.parse(JSON.stringify(obj));
function environment() {
  const c = { console, Date, Set, Map, Math, JSON, Number, Object, Array, Error,
    document: { addEventListener() {} } };
  c.window = c; vm.createContext(c);
  for (const file of ['js/vyrdepil-util.js', 'livslina/js/util.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c, { filename: file });
  const adult = JSON.parse(fs.readFileSync(path.join(root, 'livslina/data/fase2.json')));
  const programs = JSON.parse(fs.readFileSync(path.join(root, 'livslina/data/linjer.json'))).programs;
  c.LL.data = { getAdult: () => adult, getProgram: id => programs.find(p => p.id === id) };
  for (const file of ['state', 'phase2-state', 'phase2-economy', 'phase2-events', 'phase2-sim']) vm.runInContext(fs.readFileSync(path.join(root, 'livslina/js/' + file + '.js'), 'utf8'), c, { filename: file });
  return c.LL;
}
function school(LL, id = 'studiespes', apprenticeship = false) {
  const s = LL.state.newGame({ seed: 12345 });
  s.program = LL.data.getProgram(id); s.trainingRoute = apprenticeship ? 'apprenticeship' : 'school';
  s.family = { id: 'normal' }; s.housing = 'heime'; s.stats.money = 50000; s.stats.savings = 10000;
  s.roundIndex = LL.state.rounds().length; s.finished = true;
  return s;
}
function adult(LL, id, apprenticeship) {
  const s = school(LL, id, apprenticeship);
  if (apprenticeship) LL.phase2State.passTradeExam(s, true);
  LL.phase2State.begin(s); return s;
}
function year(LL, s, overrides = {}) {
  s.adult.status = 'planning';
  const plan = Object.assign({}, LL.phase2Economy.defaultPlan(s), overrides);
  assert.equal(LL.phase2Sim.begin(s, plan, s.adult.goals), true);
  let guard = 0;
  while (s.adult.run && guard++ < 30) {
    const e = LL.phase2Events.pending(s);
    if (e) assert.equal(LL.phase2Events.choose(s, e.id, 0), true);
    else LL.phase2Sim.advance(s);
  }
  assert.ok(guard < 30, 'Året skal alltid kunne avsluttast');
  return s.adult.reports.at(-1);
}

test('eldre lærlingavslutning får att siste læreår utan å miste pengar eller historikk', () => {
  const LL = environment(), s = school(LL, 'bygg-anlegg', true);
  s.version = 9; s.roundIndex = 8; s.finished = true; s.eventLog = [{ id: 'gammalt' }];
  s._runSaved = true;
  const loaded = LL.state.load(clone(s));
  assert.equal(loaded.finished, false); assert.equal(loaded.roundIndex, 8);
  assert.equal(LL.state.currentRound().id, 'laere2h');
  assert.equal(loaded.stats.money, 50000); assert.equal(loaded.eventLog.length, 1);
  const twice = LL.state.load(clone(loaded));
  assert.equal(twice.roundIndex, 8); assert.equal(twice.stats.money, 50000);
});
test('lærlingen må avslutte fagprøva før overgangen, og får rett fagbrev', () => {
  const LL = environment(), s = school(LL, 'helse-oppvekst', true);
  assert.throws(() => LL.phase2State.begin(s), /fagprøva/);
  assert.equal(LL.phase2State.passTradeExam(s, true), true);
  const energy = s.stats.energy;
  LL.phase2State.passTradeExam(s, true); assert.equal(s.stats.energy, energy);
  LL.phase2State.begin(s); assert.equal(s.adult.age, 20);
  assert.equal(s.adult.qualifications.trade, 'helse-oppvekst');
  assert.equal(s.adult.qualifications.study, false);
  assert.equal(LL.phase2State.available(s, LL.phase2State.route('helsefag')), true);
  assert.equal(LL.phase2State.available(s, LL.phase2State.route('tomrar')), false);
});
test('overgangen bevarer figur, BSU og betalt depositum og er idempotent', () => {
  const LL = environment(), s = school(LL);
  s.stats.savingsIsBsu = true; s.flags.depositumBetalt = true;
  const figure = clone(s.character);
  LL.phase2State.begin(s);
  assert.equal(s.adult.bsu, 10000); assert.equal(s.stats.savings, 0);
  assert.equal(s.adult.deposit, 6000); assert.equal(s.stats.money, 50000);
  LL.phase2State.begin(s); assert.equal(s.adult.bsu, 10000);
  assert.equal(s.adult.deposit, 6000); assert.deepEqual(clone(s.character), figure);
});
test('depositum bind kapital medan berre flyttekostnaden reduserer nettoformuen', () => {
  const LL = environment(), s = adult(LL);
  const worth = LL.phase2State.networth(s), move = LL.data.getAdult().rates.moving;
  LL.phase2Sim.begin(s, { routeId: 'okonomi', housing: 'hybel' }, []);
  assert.equal(s.adult.deposit, 6200 * 3);
  assert.equal(LL.phase2State.networth(s), worth - move);
});
test('mål fordeler dei same pengane og BSU kan berre telje i bustadmålet', () => {
  const LL = environment(), s = adult(LL);
  s.adult.bsu = 5000;
  const goals = LL.phase2State.normalizeGoals(s, [{ id: 'buffer', share: 30 }, { id: 'bustad', share: 70 }]);
  assert.equal(LL.phase2State.goalValue(s, goals[0]), 3000);
  assert.equal(LL.phase2State.goalValue(s, goals[1]), 12000);
  assert.equal(goals.reduce((sum, g) => sum + LL.phase2State.goalValue(s, g), 0), 15000);
});
test('årsrunda har tolv månader, seks ulike relevante case og kan ikkje avsluttast to gonger', () => {
  const LL = environment(), s = adult(LL);
  const r = year(LL, s, { routeId: 'okonomi', housing: 'heime' });
  assert.equal(s.ledger.filter(e => e.phase === 2).length, 12);
  assert.equal(new Set(r.events).size, 6); assert.equal(s.adult.age, 20);
  assert.equal(s.adult.progress.okonomi.years, 1);
  LL.phase2Sim.advance(s); LL.phase2Sim.finish(s);
  assert.equal(s.adult.reports.length, 1);
});
test('reload midt i eit år bevarer val, case og pengesummar utan dobbel verknad', () => {
  const LL = environment(), s = adult(LL);
  LL.phase2Sim.begin(s, { routeId: 'butikk', housing: 'heime' }, []);
  LL.phase2Sim.advance(s); const e = LL.phase2Events.pending(s);
  LL.phase2Events.choose(s, e.id, 0);
  assert.equal(LL.phase2Events.choose(s, e.id, 0), false);
  const serialized = clone(s), cash = s.stats.money;
  const loaded = LL.state.load(serialized);
  assert.equal(loaded.stats.money, cash);
  assert.equal(loaded.adult.run.resolved.length, 1);
  assert.equal(LL.phase2Events.pending(loaded), null);
  while (loaded.adult.run) {
    const pending = LL.phase2Events.pending(loaded);
    if (pending) LL.phase2Events.choose(loaded, pending.id, 0);
    else LL.phase2Sim.advance(loaded);
  }
  assert.equal(loaded.ledger.filter(e => e.phase === 2).length, 12);
});
test('fullført bachelor går over til første arbeidsår utan nytt studentlån', () => {
  const LL = environment(), s = adult(LL);
  for (let i = 0; i < 3; i++) year(LL, s, { routeId: 'okonomi', housing: 'heime', jobHours: 0 });
  assert.equal(s.adult.progress.okonomi.graduated, true);
  const r = year(LL, s, { routeId: 'okonomi', housing: 'heime' });
  assert.equal(r.totals.loan, 0); assert.ok(r.totals.wage > 400000);
  assert.equal(s.adult.progress.okonomi.workYears, 1);
});
test('påbygg opnar studium, pause og byte bevarer framdrifta', () => {
  const LL = environment(), s = adult(LL, 'bygg-anlegg', true);
  assert.throws(() => LL.phase2Economy.normalizePlan(s, { routeId: 'laerar' }));
  year(LL, s, { routeId: 'pabygg', housing: 'heime', jobHours: 0 });
  assert.equal(s.adult.qualifications.study, true);
  assert.doesNotThrow(() => LL.phase2Economy.defaultPlan(s));
  year(LL, s, { routeId: 'laerar', housing: 'heime', jobHours: 0 });
  year(LL, s, { routeId: 'friarbeid', housing: 'heime' });
  year(LL, s, { routeId: 'laerar', housing: 'heime', jobHours: 0 });
  assert.equal(s.adult.progress.laerar.years, 2);
});
test('stipend krev bortebuing og bestått utdanning; gradomgjering skjer éin gong', () => {
  const LL = environment(), s = adult(LL);
  s.adult.studentDebt = 10000;
  s.adult.calendars[0] = { wage: 0, interest: 0, taxPaid: 0, bsuPaid: 0, support: 11, closed: true, wealth: 0 };
  s.adult.loanLots = [{ calendar: 0, routeId: 'okonomi', principal: 10000, away: true, passed: 1, passConverted: 0, degreeConverted: 0 }];
  assert.equal(LL.phase2Economy.convertGrants(s), 1500);
  assert.equal(LL.phase2Economy.convertGrants(s), 0);
  s.adult.progress.okonomi = { years: 3, graduated: true, workYears: 0 };
  assert.equal(LL.phase2Economy.convertGrants(s), 2500);
  assert.equal(s.adult.studentDebt, 6000);
  assert.equal(LL.phase2Economy.convertGrants(s), 0);
});
test('alle retningar kan spelast og halvferdig lang utdanning blir bevart ved 25 år', () => {
  const LL = environment();
  for (const item of LL.data.getAdult().routes) {
    const id = item.program === 'other' ? 'elektro' : item.program;
    const s = adult(LL, id || 'studiespes', Boolean(id));
    if (item.kind === 'bridge') s.adult.qualifications.study = false;
    year(LL, s, { routeId: item.id, housing: 'heime', jobHours: 0 });
    assert.ok(Number.isFinite(LL.phase2State.networth(s)), item.id);
  }
  const s = adult(LL, 'elektro', true);
  year(LL, s, { routeId: 'pabygg', housing: 'heime' });
  while (!s.adult.complete) year(LL, s, { routeId: 'laerar', housing: 'heime', jobHours: 0 });
  assert.equal(s.adult.age, 25); assert.equal(s.adult.progress.laerar.years, 4);
  assert.equal(s.adult.progress.laerar.graduated, false);
});
test('ukjend nyare lagring og ugyldig pågåande år blir avviste', () => {
  const LL = environment(), s = adult(LL);
  assert.throws(() => LL.state.load(Object.assign(clone(s), { version: 99 })), /nyare/);
  const current = clone(s); current.adult.age = 200;
  assert.throws(() => LL.state.load(current), /format/);
});
test('årsoppgjeret forklarer kontantstraum og nettoformue med case, gjeld og depositum', () => {
  const LL = environment(), s = adult(LL);
  s.adult.studentDebt = 70000; s.adult.creditDebt = 3000;
  const r = year(LL, s, { routeId: 'butikk', housing: 'kollektiv', savings: 1000, bsu: 500 });
  const t = r.totals;
  const cashChange = t.wage + t.loan + t.bridge + t.otherIncome + t.grantRefund - t.expense - t.saved - t.bsu - t.repaid - (r.end.deposit - r.start.deposit);
  const wealthChange = t.wage + t.bridge + t.otherIncome - t.expense - t.capitalizedInterest + t.earnedInterest + t.converted;
  assert.ok(Math.abs(r.end.stats.money - r.start.stats.money - cashChange) < 0.00001);
  assert.ok(Math.abs(r.end.networth - r.start.networth - wealthChange) < 0.00001);
});
test('ein konto i minus stengjer ikkje vegen til eit nytt arbeidsår utan nytt depositum', () => {
  const LL = environment(), s = adult(LL);
  s.stats.money = -2000;
  assert.equal(LL.phase2Sim.begin(s, { routeId: 'butikk', housing: 'heime' }, []), true);
  LL.phase2Sim.advance(s);
  assert.ok(s.stats.money > 0);
});
test('månadlege caseendringar gjeld berre attståande månader og BSU følgjer kalenderåret', () => {
  const LL = environment(), s = adult(LL);
  const p = { routeId: 'butikk', housing: 'heime', bsu: 2250 };
  LL.phase2Sim.begin(s, p, []);
  LL.phase2Sim.advance(s);
  const before = clone(s.ledger);
  s.adult.run.modifiers.monthlyExpense = 300;
  assert.deepEqual(clone(s.ledger), before);
  while (s.adult.run) {
    const event = LL.phase2Events.pending(s);
    if (event) LL.phase2Events.choose(s, event.id, 0);
    else LL.phase2Sim.advance(s);
  }
  assert.ok(Object.values(s.adult.calendars).every(c => c.bsuPaid <= 27500));
  assert.equal(s.ledger.filter(e => e.phase === 2).length, 12);
});
test('utdanningsmålet følgjer vald grad og blir ikkje fullført av eit anna studium', () => {
  const LL = environment(), s = adult(LL);
  s.adult.progress = { okonomi: { years: 3, graduated: true }, laerar: { years: 2, graduated: false } };
  const goal = LL.phase2State.normalizeGoals(s, [{ id: 'utdanning', routeId: 'laerar', target: 1 }])[0];
  assert.equal(goal.target, 5);
  assert.equal(LL.phase2State.goalValue(s, goal), 2);
  s.adult.routeId = 'butikk';
  assert.equal(LL.phase2State.normalizeGoals(s, [goal])[0].routeId, 'laerar');
});
