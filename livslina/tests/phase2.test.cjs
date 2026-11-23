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
  vm.runInContext(fs.readFileSync(path.join(root, 'livslina/js/phase2-paths.js'), 'utf8'), c);
  const phaseData = file => JSON.parse(fs.readFileSync(path.join(root, 'livslina/data/' + file + '.json')));
  const adult = c.LL.phase2Paths.merge(phaseData('fase2'), phaseData('fase2-vegar'), phaseData('fase2-kvardag'));
  const base = JSON.parse(fs.readFileSync(path.join(root, 'livslina/data/grunndata.json')));
  const programs = JSON.parse(fs.readFileSync(path.join(root, 'livslina/data/linjer.json'))).programs;
  const node = key => key.split('.').reduce((entry, part) => entry?.[part], base);
  const shop = phaseData('rombutikk');
  c.LL.data = { getAdult: () => adult, getRoomShop: () => shop, getProgram: id => programs.find(p => p.id === id),
    node, value: (key, variant = 'gameValue') => node(key)?.[variant] ?? 0 };
  for (const file of ['state', 'economy', 'phase2-transport', 'phase2-family', 'phase2-rooms', 'phase2-state', 'phase2-housing', 'phase2-economy', 'phase2-effects', 'phase2-events', 'phase2-sim', 'art-vignettes']) vm.runInContext(fs.readFileSync(path.join(root, 'livslina/js/' + file + '.js'), 'utf8'), c, { filename: file });
  return c.LL;
}
function school(LL, id = 'studiespes', apprenticeship = false) {
  const s = LL.state.newGame({ seed: 12345 });
  s.program = LL.data.getProgram(id); s.trainingRoute = apprenticeship ? 'apprenticeship' : 'school';
  s.family = { id: 'normal' }; s.housing = 'heime'; s.stats.money = 50000; s.stats.savings = 10000;
  s.stats.grades = 5.3;
  s.roundIndex = LL.state.rounds().length; s.finished = true;
  return s;
}
function adult(LL, id, apprenticeship) {
  const s = school(LL, id, apprenticeship);
  if (apprenticeship) LL.phase2State.passTradeExam(s, true);
  LL.phase2State.begin(s); return s;
}
function year(LL, s, overrides = {}, approvals) {
  s.adult.status = 'planning';
  const plan = Object.assign({}, LL.phase2Economy.defaultPlan(s), overrides);
  assert.equal(LL.phase2Sim.begin(s, plan, s.adult.goals, approvals), true);
  let guard = 0;
  while (s.adult.run && guard++ < 30) {
    const e = LL.phase2Events.pending(s);
    if (e) assert.equal(LL.phase2Events.choose(s, e.id, 0), true);
    else LL.phase2Sim.advance(s);
  }
  assert.ok(guard < 30, 'Året skal alltid kunne avsluttast');
  return s.adult.reports.at(-1);
}

test('opptaksdøma bruker snittet frå VGS og les eldre lagringar', () => {
  const LL = environment(), s = school(LL);
  s.stats.grades = 4.276;
  LL.phase2State.begin(s);
  s.stats.grades = 4.92;
  const original = LL.phase2State.schoolGrade(s);
  assert.equal(original.average, 4.28);
  assert.equal(original.points, 42.8);

  delete s.schoolResult;
  const older = LL.phase2State.schoolGrade(s);
  assert.equal(older.average, 4.92);
  assert.equal(older.points, 49.2);
  assert.equal(LL.phase2State.schoolGrade({ stats: { grades: 0 } }), null);
});

test('nye studium krev poeng i ei aktuell kvote før året kan starte', () => {
  const LL = environment(), s = adult(LL);
  const route = LL.phase2State.route('laerar');
  const plan = { routeId: route.id, housing: 'hybel' };
  s.schoolResult.stats.grades = 3.5;
  assert.equal(LL.phase2State.studyAdmission(s, route).lowest, 36.3);
  assert.equal(LL.phase2Economy.defaultPlan(s).routeId, 'butikk');
  assert.doesNotThrow(() => LL.phase2Economy.preview(s, plan));
  const before = clone(s);
  assert.throws(() => LL.phase2Sim.begin(s, plan, []), /poengkravet/);
  assert.deepEqual(clone(s), before);

  s.schoolResult.stats.grades = 3.63;
  s.adult.age = 21;
  assert.equal(LL.phase2State.studyAdmission(s, route).admitted, true);
  s.adult.age = 22;
  assert.equal(LL.phase2State.studyAdmission(s, route).lowest, 38.9);
  assert.equal(LL.phase2State.studyAdmission(s, route).admitted, false);
  s.schoolResult.stats.grades = s.stats.grades = null;
  assert.equal(LL.phase2State.studyAdmission(s, route).admitted, false);
  s.schoolResult.stats.grades = 3.89;
  assert.equal(LL.phase2Sim.begin(s, plan, []), true);
});

test('ei eldre lagring med lågt snitt kan halde fram med studiet, også etter pause', () => {
  const LL = environment(), s = adult(LL);
  const route = LL.phase2State.route('laerar');
  year(LL, s, { routeId: route.id });
  year(LL, s, { routeId: route.id });
  year(LL, s, { routeId: 'friarbeid' });
  s.schoolResult.stats.grades = s.stats.grades = 3.5;
  const loaded = LL.state.load(clone(s));
  const admission = LL.phase2State.studyAdmission(loaded, route);
  assert.equal(admission.lowest, 38.9);
  assert.equal(admission.continuing, true);
  assert.equal(admission.admitted, true);
  assert.equal(LL.phase2Sim.begin(loaded, { routeId: route.id, housing: 'heime' }, []), true);
  assert.ok(LL.state.load(clone(loaded)).adult.run);
});

test('karrierekatalogen dekkjer fagfelt, eigne roller og reelle vilkår for fagskule', () => {
  const LL = environment(), s = adult(LL, 'bygg-anlegg', true);
  const data = LL.data.getAdult();
  assert.equal(data.routes.length, 39);
  assert.equal(Object.keys(data.fields).length, 12);
  const labels = data.routes.flatMap(item => (item.roles || []).map(role => role.label));
  assert.ok(new Set(labels).size >= 60);
  assert.equal(LL.phase2Paths.tradeRoute(s).id, 'tomrar');
  assert.match(LL.phase2Paths.change(s, LL.phase2State.route('folke-kultur')), /Fagbrevet blir med vidare/);
  assert.equal(LL.phase2State.startIssue(s, LL.phase2State.route('fagskule-bygg')), '');
  assert.match(LL.phase2State.startIssue(s, LL.phase2State.route('fagskule-automasjon')), /relevant fagbrev/);
  year(LL, s, { routeId: 'fagskule-bygg', jobHours: 0, borrow: false });
  year(LL, s, { routeId: 'fagskule-bygg', jobHours: 0, borrow: false });
  const item = LL.phase2State.route('fagskule-bygg');
  assert.ok(LL.phase2Paths.roles(s, item).some(role => role.id === 'bim'));
  assert.ok(!LL.phase2Paths.roles(s, item).some(role => role.id === 'lag'));
  const first = LL.phase2Economy.preview(s, { routeId: item.id, roleId: 'kalk' });
  const second = LL.phase2Economy.preview(s, { routeId: item.id, roleId: 'bim' });
  assert.ok(second.wage > first.wage);
  year(LL, s, { routeId: item.id, roleId: 'bim' });
  assert.ok(LL.phase2Paths.roles(s, item).some(role => role.id === 'lag'));
});

test('privatist endrar ordinær kvote, realfag opnar særkrav og utdanning kan halde fram etter 25', () => {
  const LL = environment(), s = adult(LL);
  s.schoolResult.stats.grades = 3.5;
  const teacher = LL.phase2State.route('laerar');
  const build = LL.phase2State.route('byggingenior');
  assert.match(LL.phase2State.startIssue(s, build), /Matematikk/);
  year(LL, s, { routeId: 'privatist', examHours: 12, workPercent: .5 });
  year(LL, s, { routeId: 'privatist', examHours: 12, workPercent: .5 });
  assert.equal(LL.phase2State.schoolGrade(s).average, 3.5);
  assert.equal(LL.phase2State.studyAdmission(s, teacher).ordinary, 40.6);
  assert.equal(LL.phase2State.studyAdmission(s, teacher).admitted, true);
  year(LL, s, { routeId: 'realfag', examHours: 12, workPercent: .5 });
  assert.equal(LL.phase2State.startIssue(s, build), '');
  while (!s.adult.complete) year(LL, s, { routeId: 'laerar', jobHours: 0 });
  assert.equal(s.adult.age, 25);
  assert.ok(LL.phase2State.continueLife(s));
  assert.equal(LL.phase2State.continueLife(s), false);
  year(LL, s, { routeId: 'laerar', jobHours: 0 });
  assert.equal(s.adult.age, 26);
  assert.equal(LL.state.load(clone(s)).adult.progress.laerar.years, 4);
});

test('folkehøgskule og reise bruker eigne kostnader i månadene som gjeld', () => {
  const LL = environment(), s = adult(LL);
  const folk = LL.phase2Economy.preview(s, { routeId: 'folke-friluft', borrow: true, housing: 'heime' });
  assert.equal(folk.plan.housing, 'internat');
  assert.equal(folk.months.filter(month => month.loan > 0).length, 10);
  assert.equal(folk.firstMonth.expenses.food, 0);
  assert.ok(folk.months[10].expenses.food > 0);
  assert.equal(folk.firstMonth.expenses.housing, 0);
  s.stats.money = 5000;
  const trip = { routeId: 'reise', travelMonths: 4, housing: 'heime' };
  assert.throws(() => LL.phase2Sim.begin(s, trip, []), /buffer/);
  s.stats.money = 150000;
  const estimate = LL.phase2Economy.preview(s, trip);
  assert.equal(estimate.months.filter(month => month.wage === 0).length, 4);
  assert.equal(estimate.months.filter(month => month.expenses.travelBudget > 0).length, 4);
  assert.equal(estimate.firstMonth.expenses.food, 0);
  assert.equal(year(LL, s, trip).totals.loan, 0);
});

test('føraropplæring, eigarskap og sal blir rekna éin gong', () => {
  const LL = environment(), s = adult(LL);
  const drive = { routeId: 'butikk', transport: { area: 'by', mode: 'car', action: 'car' } };
  assert.throws(() => LL.phase2Sim.begin(s, drive, []), /førarkort/);
  const training = { routeId: 'butikk', transport: { area: 'by', mode: 'public', units: 4, privatePractice: true } };
  const trainingReport = year(LL, s, training);
  assert.equal(s.adult.mobility.stage, 4);
  assert.equal(trainingReport.totals.licence, 25350);
  s.stats.money = 150000;
  const before = LL.phase2State.networth(s);
  assert.ok(LL.phase2Sim.begin(s, drive, []));
  assert.equal(s.stats.money, 84000);
  assert.equal(s.adult.mobility.vehicle.value, 66000);
  assert.equal(LL.phase2State.networth(s), before);
  const loaded = LL.state.load(clone(s));
  LL.phase2Sim.month(loaded);
  assert.ok(loaded.adult.mobility.vehicle.value < 66000);
  const expenses = LL.phase2Economy.breakdown(loaded, loaded.adult.run.plan, 1).expenses;
  assert.ok(expenses.vehicleInsurance && expenses.vehicleMaintenance && expenses.vehicleFuel);
});

test('barn krev samtykke og stadfesting, og omsorg følgjer med over årsskifte og brot', () => {
  const LL = environment(), s = adult(LL);
  const action = { routeId: 'kafe', family: { meet: true, time: 'household' } };
  year(LL, s, action);
  assert.ok(s.adult.household.partner);
  assert.equal(s.adult.household.pregnancy, null);
  year(LL, s, { routeId: 'kafe', family: { talk: true, time: 'household' } });
  assert.ok(s.adult.household.cohabitConsent && s.adult.household.childConsent);
  assert.equal(s.adult.household.pregnancy, null);
  const childPlan = { routeId: 'kafe', housing: 'leilegheit',
    family: { action: 'join', child: 'plan', startMonth: 6, time: 'household' } };
  const original = clone(s);
  assert.throws(() => LL.phase2Sim.begin(s, childPlan, []), /Stadfest/);
  assert.deepEqual(clone(s), original);
  const estimate = LL.phase2Economy.preview(s, childPlan);
  assert.equal(estimate.firstMonth.expenses.housing, 5895);
  assert.equal(estimate.move.deposit, 17685);
  year(LL, s, childPlan, { child: true });
  assert.equal(s.adult.household.child, null);
  assert.equal(s.adult.household.pregnancy.due, 39);
  const loaded = LL.state.load(clone(s));
  const report = year(LL, loaded, { routeId: 'kafe', family: { time: 'household', leave: 3 } });
  assert.equal(loaded.adult.household.pregnancy, null);
  assert.equal(loaded.adult.household.child.due, 39);
  assert.ok(report.totals.familyBenefit > 0 && report.totals.care > 0);
  const post = year(LL, loaded, { routeId: 'kafe', family: { action: 'end', care: 'player' } });
  assert.equal(loaded.adult.household.partner, null);
  assert.equal(loaded.adult.household.lease, false);
  assert.equal(loaded.adult.household.child.due, 39);
  assert.ok(post.totals.care > report.totals.care);
});

test('familieillustrasjonar varierer per scene og held seg etter ny innlasting', () => {
  const LL = environment(), variant = LL.artVignette.familyVariant;
  const p = { seed: 51002, year: 3, occurrence: 'familie-plan-barn' };
  assert.equal(variant('adultFamilyPlan', p), variant('adultFamilyPlan', clone(p)));
  assert.equal(new Set(Array.from({ length: 50 }, (_, seed) =>
    variant('adultFamilyPlan', { ...p, seed }))).size, 3);
});

test('møblar følgjer flytting, lager og sal utan dobbel plassering eller betaling', () => {
  const LL = environment(), s = adult(LL);
  const model = LL.phase2Rooms;
  const crib = { ...LL.data.getRoomShop().categories.find(category => category.id === 'crib').products[0], slot: 'crib' };
  s.adult.housing = 'stor-leilegheit';
  model.migrate(s);
  const cash = s.stats.money;
  assert.ok(model.buy(s, crib, 'extra'));
  assert.equal(s.stats.money, cash - crib.price);
  assert.equal(model.location(s, crib), 'extra');
  assert.ok(model.buy(s, crib, 'bedroom'));
  assert.equal(s.stats.money, cash - crib.price);
  assert.equal(s.room.placements.extra.crib, undefined);
  assert.ok(model.buy(s, crib, 'extra'));
  assert.ok(LL.phase2Sim.begin(s, { routeId: 'butikk', housing: 'heime' }, []));
  const loaded = LL.state.load(clone(s));
  assert.equal(model.location(loaded, crib), undefined);
  assert.ok(model.stock(loaded).some(item => item.id === crib.id));
  const before = loaded.stats.money;
  assert.ok(model.sell(loaded, crib));
  assert.equal(model.sell(loaded, crib), false);
  assert.equal(loaded.stats.money, before + model.sale(crib));
});

test('bustadkjøp krev finansiering og bind eigenkapital utan å telje avdrag som forbruk', () => {
  const LL = environment(), s = adult(LL);
  const plan = { routeId: 'kafe', housing: 'eigd-leilegheit', workPercent: 1, bsu: 500 };
  s.stats.money = 550000;
  s.stats.savings = 100000;
  s.adult.bsu = 50000;
  const noJob = LL.phase2Economy.preview(s, plan);
  assert.equal(noJob.move.purchase.requiresJob, true);
  assert.throws(() => LL.phase2Sim.begin(s, plan, []), /finansiering/);
  assert.equal(s.adult.property, null);
  assert.equal(s.stats.money, 550000);

  s.adult.routeId = 'kafe';
  s.adult.progress.kafe = { years: 0, graduated: false, workYears: 1 };
  s.adult.studentDebt = 600000;
  const quote = LL.phase2Economy.preview(s, plan);
  const value = quote.move.purchase.property.value;
  const mortgage = quote.move.purchase.property.balance;
  assert.equal(quote.move.purchase.requiresJob, false);
  assert.ok(mortgage <= value * .9 && mortgage + s.adult.studentDebt <= quote.wage * 5);
  assert.ok(quote.move.down > quote.move.purchase.minimumDown);
  assert.ok(quote.firstCash >= 0);
  const before = LL.phase2State.networth(s);
  assert.equal(LL.phase2Sim.begin(s, plan, []), true);
  assert.equal(s.adult.bsu, 0);
  assert.equal(s.adult.bsuUsed, true);
  assert.equal(s.adult.run.plan.bsu, 0);
  assert.equal(s.stats.money, quote.firstCash);
  assert.ok(Math.abs(LL.phase2State.networth(s) - before + quote.move.expense) < .001);
  LL.phase2Sim.month(s);
  assert.ok(s.adult.property.balance < mortgage);
  assert.ok(s.adult.run.totals.mortgagePrincipal > 0);
  const loaded = LL.state.load(clone(s));
  assert.equal(loaded.adult.property.balance, s.adult.property.balance);
  const sale = LL.phase2Economy.preview(loaded, { ...plan, housing: 'leilegheit' });
  assert.equal(sale.move.sale, value - loaded.adult.property.balance);
  assert.equal(sale.move.deposit, 11790 * 3);
});

test('årsoppgjeret summerer faktiske utslag og eit innbydande rom unngår romtrekket', () => {
  const LL = environment(), s = adult(LL);
  const report = year(LL, s, { routeId: 'kafe', housing: 'heime' });
  for (const key of ['money', 'wellbeing', 'energy', 'social']) {
    const sum = report.impacts.reduce((total, item) => total + (item.deltas[key] || 0), 0);
    assert.ok(Math.abs(sum - (report.end.stats[key] - report.start.stats[key])) < .0001, key);
  }
  assert.ok(report.impacts.find(item => item.id === 'room').deltas.wellbeing < 0);
  assert.ok(s.eventLog.some(event => event.phase === 2 && event.choiceLabel && event.delta));
  assert.equal(LL.phase2Rooms.buy(s, { id: 'sofa-01', slot: 'sofa', family: 'sofa', price: 500 }, 'bedroom'), true);
  const next = year(LL, s, { routeId: 'kafe', housing: 'heime' });
  assert.equal(next.impacts.some(item => item.id === 'room'), false);
  const story = LL.data.getAdult().events.find(event => event.id === 'maal-justering');
  s.eventLog.push({ phase: 2, id: 'maal-buffer', choice: 0 });
  assert.match(LL.phase2Events.story(s, story)[0], /sparepengane stå/);
  s.eventLog.push({ phase: 2, id: 'maal-buffer', choice: 1 });
  assert.match(LL.phase2Events.story(s, story)[0], /unna deg/);
  const returning = adult(LL);
  returning.eventLog.push({ phase: 2, id: 'vener', choice: 0 });
  const schedule = LL.phase2Events.prepare(returning, LL.phase2Economy.defaultPlan(returning));
  assert.ok(schedule.some(event => event.id === 'vennekveld'));
});

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

test('skuleelev får stipend i ti månader, og halvårsbudsjettet viser snittet', () => {
  const LL = environment();
  const s = school(LL);
  s.finished = false;
  s.family = { incomeDependentGrant: 'rateFull' };
  s.housing = 'hybel';
  s.roundIndex = 0;
  const autumn = Array.from({ length: 6 }, (_, month) => LL.economy.monthlyBreakdown(s, month).income.housingGrant || 0);
  s.roundIndex = 1;
  const spring = Array.from({ length: 6 }, (_, month) => LL.economy.monthlyBreakdown(s, month).income);
  assert.deepEqual(spring.map(income => income.housingGrant || 0), [7015, 7015, 7015, 7015, 0, 0]);
  assert.equal(autumn.concat(spring.map(income => income.housingGrant || 0)).reduce((a, b) => a + b, 0), 70150);
  assert.equal(spring[3].studyGrant, 4071);
  assert.equal(spring[4].studyGrant, undefined);
  assert.equal(Math.round(LL.economy.monthlyBreakdown(s).income.housingGrant * 6), 28060);
});

test('lærlingløn blir prøvd mot begge tilskota og lærlingen kan få støtte i juni', () => {
  const LL = environment();
  const s = school(LL, 'bygg-anlegg', true);
  s.finished = false;
  s.age = 18;
  s.family = { incomeDependentGrant: 'rateFull' };
  s.housing = 'hybel';
  s.roundIndex = 7;
  s.plan = { ...LL.economy.defaultPlan(), jobHours: 12 };
  const june = LL.economy.monthlyBreakdown(s, 4);
  assert.equal(june.income.studyGrant, undefined);
  assert.equal(june.income.housingGrant, 7015);
  assert.equal(LL.economy.monthlyBreakdown(s, 5).income.housingGrant, undefined);
  s.roundIndex = 8;
  assert.equal(LL.economy.monthlyBreakdown(s, 0).income.housingGrant, 6339);
  s.roundIndex = 9;
  assert.equal(LL.economy.monthlyBreakdown(s, 0).income.housingGrant, undefined);
});

test('heimebuande lærling betaler sin del av kvardagen gjennom læretida', () => {
  const LL = environment();
  const s = school(LL, 'bygg-anlegg', true);
  s.age = 18;
  s.family = { allowancePerMonth: 500 };
  s.plan = { ...LL.economy.defaultPlan(), clothingShoppingPerWeek: 100 };
  s.roundIndex = 0;
  const pupil = LL.economy.monthlyBreakdown(s, 0);
  assert.equal(pupil.income.allowance, 500);
  assert.equal(pupil.expense.homeContribution, undefined);
  s.roundIndex = 6;
  const apprentice = LL.economy.monthlyBreakdown(s, 0);
  assert.equal(apprentice.income.allowance, undefined);
  assert.equal(apprentice.expense.homeContribution, 2000);
  assert.equal(apprentice.expense.food, 1600);
  assert.equal(apprentice.expense.personalCare, 920);
  assert.equal(apprentice.expense.clothing + apprentice.expense.clothingShopping, 1105);
});

test('vaksne betaler basisutgifter med mat, transport og hushald tilpassa bustad og retning', () => {
  const LL = environment(), s = adult(LL);
  s.adult.age = 20;
  const home = LL.phase2Economy.breakdown(s, { routeId: 'butikk', housing: 'heime' }, 0).expenses;
  const shared = LL.phase2Economy.breakdown(s, { routeId: 'butikk', housing: 'kollektiv' }, 0).expenses;
  const student = LL.phase2Economy.breakdown(s, { routeId: 'sjukepleie', housing: 'hybel' }, 0).expenses;
  assert.equal(home.food, 1800);
  assert.equal(home.household, 0);
  assert.equal(home.clothing + home.personalCare + home.equipment, 2425);
  assert.equal(home.transport, 1019);
  assert.equal(shared.household, 885);
  assert.equal(student.food, 4695);
  assert.equal(student.household, 1540);
  assert.equal(student.transport, 612);
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
    const id = item.program === 'other' ? 'handverk-design' : item.program || item.programs?.[0];
    const s = adult(LL, id || 'studiespes', Boolean(id));
    if (item.kind === 'bridge') s.adult.qualifications.study = false;
    if (item.science) s.adult.qualifications.science = true;
    s.schoolResult.stats.grades = 6;
    if (item.experience === 'travel') s.stats.money = 130000;
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
