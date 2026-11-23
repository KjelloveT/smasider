/* Reiseveg, kontantkjøp av transportmiddel og føraropplæring. */
window.LL = window.LL || {};
LL.phase2Transport = (function () {
  'use strict';
  const modes = { legacy: 'Vanleg kollektivbudsjett', walk: 'Gå', bike: 'Sykle', public: 'Buss eller tog', carpool: 'Samkøyre', car: 'Køyre eigen bil' };
  const data = () => LL.data.getAdult().transport;
  const empty = () => ({ stage: 0, area: 'tettstad', mode: 'legacy', vehicle: null });
  const current = s => s.adult.mobility || empty();

  function normalize(s, draft) {
    const saved = current(s), input = draft || {};
    return {
      area: Object.hasOwn(data().areas, input.area) ? input.area : saved.area,
      mode: Object.hasOwn(modes, input.mode) ? input.mode : saved.mode,
      action: ['keep', 'bike', 'car', 'sell'].includes(input.action) ? input.action : 'keep',
      units: Math.max(0, Math.min(data().steps.length, Math.trunc(Number(input.units) || 0))),
      privatePractice: input.privatePractice === true
    };
  }

  function quote(s, plan) {
    const kept = current(s).vehicle;
    const action = plan.transport.action;
    if (action === 'keep' || action === kept?.kind) return { vehicle: kept, price: 0, sale: 0 };
    const definition = data().vehicles[action];
    return {
      vehicle: definition ? { kind: action, value: definition.price } : null,
      price: definition?.price || 0,
      sale: kept ? Math.round(kept.value) : 0
    };
  }

  function training(s, plan, start = s.adult.run?.transportStart ?? current(s).stage) {
    const steps = data().steps;
    const travelMonths = plan.travelMonths || 0;
    return steps.slice(start, start + plan.transport.units).map((step, i) => ({
      index: start + i, label: step.label, month: travelMonths + steps[i].month,
      cost: plan.transport.privatePractice && step.privateCost || step.cost,
      hours: plan.transport.privatePractice && step.privateHours || step.hours
    }));
  }

  function issue(s, plan, purchase) {
    const t = plan.transport, saved = current(s), actions = training(s, plan, saved.stage);
    if ((t.mode === 'car' || t.action === 'car') && saved.stage < data().steps.length) return 'Ta førarkort før du vel å kjøpe og bruke eigen bil.';
    if (t.mode === 'car' && purchase.vehicle?.kind !== 'car') return 'Vel samkøyring eller ei anna reiseform, eller planlegg kjøp av bil.';
    if (t.mode === 'bike' && purchase.vehicle?.kind !== 'bike') return 'For å sykle treng du ein sykkel i planen.';
    if (t.units > actions.length) return 'Vel berre dei nummererte stega som står att i føraropplæringa.';
    if (actions.some(step => step.month >= 12)) return 'Legg færre førarkortsteg til dette året så du rekk dei etter reisa.';
    return '';
  }

  function monthly(s, plan, index, studying, travelling, vehicle = current(s).vehicle) {
    const { area, mode } = plan.transport;
    const [fare, minutes] = data().areas[area][mode] || [LL.economy.transportCost(s.adult.age, studying), 0];
    const car = vehicle?.kind === 'car' ? data().vehicles.car : null;
    return {
      fare: travelling ? 0 : fare,
      minutes: travelling ? 0 : minutes,
      insurance: car?.insurance || 0,
      maintenance: car?.maintenance || 0,
      fuel: !travelling && mode === 'car' && car ? car.fuel : 0,
      lesson: training(s, plan).find(step => step.month === index) || null
    };
  }

  function start(s, plan, purchase) {
    const saved = current(s);
    s.adult.mobility = { stage: saved.stage, area: plan.transport.area, mode: plan.transport.mode, vehicle: purchase.vehicle };
    return saved.stage;
  }

  function advance(s, lesson, moneyAfter) {
    if (!lesson) return 0;
    const r = s.adult.run, saved = s.adult.mobility;
    if (lesson.index !== saved.stage) return 0;
    if (moneyAfter < 0) {
      r.notes.push(lesson.label + ' vart utsett fordi kontoen var for låg. Du kan setje det inn i neste årsplan.');
      return 0;
    }
    if (lesson.index >= 2 && s.stats.energy < 22) {
      r.notes.push(lesson.label + ' vart ikkje bestått. Du kan setje av meir tid og prøve på nytt neste år.');
    } else {
      saved.stage++;
      r.notes.push(lesson.label + ' er fullført.');
    }
    return lesson.cost;
  }

  function depreciate(s) {
    const vehicle = current(s).vehicle;
    if (!vehicle) return 0;
    const previous = vehicle.value;
    vehicle.value *= data().vehicles[vehicle.kind].retention;
    return previous - vehicle.value;
  }

  function migrate(s) {
    const saved = current(s);
    const max = data().steps.length;
    if (!Number.isInteger(saved.stage) || saved.stage < 0 || saved.stage > max) throw new Error('Ugyldig føraropplæring i lagringa.');
    if (!Object.hasOwn(modes, saved.mode) || !Object.hasOwn(data().areas, saved.area)) throw new Error('Ukjend transport i lagringa.');
    if (saved.vehicle && (!data().vehicles[saved.vehicle.kind] || !Number.isFinite(saved.vehicle.value) || saved.vehicle.value < 0 || saved.vehicle.value > data().vehicles[saved.vehicle.kind].price)) throw new Error('Ugyldig transportmiddel i lagringa.');
    s.adult.mobility = saved;
  }

  return { modes, current, normalize, quote, training, issue, monthly, start, advance, depreciate, migrate };
})();
