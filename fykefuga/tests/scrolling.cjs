module.exports = function (F, check, context) {
  for (const rate of [30, 60, 120, 144]) {
    const clock = F.Physics.accumulator(), motion = F.Motion.create();
    const state = { time: 0, x: 0, status: 'running', player: F.Physics.player('wave') };
    motion.reset(state);
    let maxError = 0, maxPlayerError = 0, mutated = false, lastX;
    for (let frame = 1; frame <= rate * 2; frame++) {
      const timing = clock.advance(1 / rate, () => {
        state.time += F.Physics.STEP; state.x = state.time * 500; state.player.y += 340 * F.Physics.STEP; motion.update(state);
      });
      const before = JSON.stringify(state), view = motion.sample(state, timing.alpha);
      mutated ||= JSON.stringify(state) !== before;
      maxError = Math.max(maxError, Math.abs(view.x - Math.max(0, frame / rate - F.Physics.STEP) * 500));
      if (lastX !== undefined && (frame - 1) / rate >= F.Physics.STEP) maxError = Math.max(maxError, Math.abs(view.x - lastX - 500 / rate));
      maxPlayerError = Math.max(maxPlayerError, Math.abs(view.player.y - (320 + view.time * 340))); lastX = view.x;
    }
    check(!mutated, 'Visingsinterpolering endrar fysikken');
    check(maxPlayerError < 1e-7, 'Figur og kamera bruker ulike tidspunkt');
    check(maxError < 1e-7, 'Rulling rykkjer ved ' + rate + ' Hz');
  }
  const motion = F.Motion.create(), state = { time: 30, x: 15000, status: 'running', player: F.Physics.player('ball') };
  motion.reset(state); state.time += F.Physics.STEP; state.x += 500 * F.Physics.STEP; motion.update(state);
  const beforeTurn = motion.sample(state).player.angle;
  state.time += F.Physics.STEP; state.x += 500 * F.Physics.STEP; state.player.gravity = -1; motion.update(state);
  check(Math.abs(motion.sample(state).player.angle - beforeTurn) < .2, 'Kula snur med eit stort vinkelhopp');
  const frozen = motion.sample(state).player.angle; state.status = 'dead'; motion.update(state);
  check(motion.sample(state, .2).player.angle === frozen, 'Kula hoppar i rotasjon ved krasj');
  motion.snap(state); check(motion.sample(state).player.angle === frozen, 'Pause nullstiller rotasjonen');
  state.status = 'running'; state.time = 0; state.x = 0; state.player = F.Physics.player('spider'); motion.reset(state);
  state.time += F.Physics.STEP; state.x += 500 * F.Physics.STEP; state.player.y = F.Physics.TOP; state.player.gravity = -1; motion.update(state);
  check(motion.sample(state, .5).player.y === F.Physics.TOP, 'Spinneverket flyg gjennom bana under teletransport');
  check(Math.abs(motion.sample(state, .5).x - state.x / 2) < 1e-9, 'Teletransport rykkjer kameraet');
  motion.reset(state); check(motion.sample(state, .1).x === state.x, 'Omstart bruker den førre runden sitt kamera');
  const allocations = [], calls = [];
  context.document.createElement = () => {
    const canvas = { width: 0, height: 0, getContext() { return new Proxy({}, { get: () => (...args) => calls.push(args), set: () => true }); } };
    allocations.push(canvas); return canvas;
  };
  F.Assets = { get(name) { return name.endsWith('.jpg') ? {width:1536,height:1024} : name === 'floor.png' ? {width:256,height:83} : {width:129,height:385}; } };
  const scenery = F.Scenery.create(); scenery.prepare(); const count = allocations.length;
  const drawCalls = [], clips = [], ctx = new Proxy({}, { get(_, name) { return (...args) => { if (name === 'drawImage') drawCalls.push(args); if (name === 'rect') clips.push(args); }; }, set: () => true });
  for (const x of [0, 1012 / .08 - .01, 1012 / .08 + .01, 2024 / .08 - .01, 2024 / .08 + .01, 80000]) {
    scenery.prepare(); scenery.background(ctx, 0, x, false); scenery.surface(ctx, x, 476, 64);
  }
  check(allocations.length === count && count === 9 && scenery.cacheCount === 9, 'Ressursar blir laga på nytt når bakgrunnen går rundt');
  check(Math.abs(allocations[1].width / allocations[1].height - 129 / 385) < .005, 'Dekor blir strekt ut av proporsjon');
  drawCalls.length = 0;
  scenery.surface(ctx, 1000, 350, 8, -100, 900); scenery.surface(ctx, 1005, 350, 8, -105, 895);
  check(drawCalls.every(args => args.length === 3), 'Svarhylla skalerer teksturen ved rulling');
  const halves = drawCalls.length / 2;
  check(Math.abs(drawCalls[halves][1] - drawCalls[0][1] + 5) < 1e-9, 'Svarhylla rullar i annan fart enn hindera');
  check(clips.at(-1).join(',') === '0,350,895,8', 'Svarhylla klipper ikkje ved skjermkanten');
  for (const width of [246, 2024]) {
    const a = F.Scenery.positions(width - .01, width), b = F.Scenery.positions(width + .01, width);
    check(b.some(x => Math.abs(x - (a.at(-1) - .02)) < 1e-8), 'Teksturskøyten flyttar seg ved kamerarundgang');
  }
};
