module.exports = function testCapitals(F, check, pack) {
  const world = F.BackOnTrack.create({ seed: 31 });
  check(world.duration === 84 && world.musicScene === 6 && world.count === 24,
    'Hovudstadsporet må fylgje den nye orkestersatsen');
  check(world.quiz.count === 23 && world.readingSeconds === 2.5,
    'Kvart av dei 23 portpara må ha eit kort hovudstadsspørsmål');
  check(world.segment(0).mode === 'cube' && world.segment(12).mode === 'ship' &&
    world.segment(16).mode === 'cube', 'Bana må ha eitt luftskipstrekk om lag midtvegs');
  check(world.at(28).scene === 1 && world.at(42).scene === 2 && world.at(56).scene === 3,
    'Kulissane må fylgje dei fire musikalske delane');
  check(F.BackOnTrack.obstacles.filter(item => item.kind === 'pad').length >= 6,
    'Sprettplatene må vere ein viktig del av bana');
  for (const section of F.BackOnTrack.sections) for (const pad of section.obstacles.filter(item => item.kind === 'pad')) {
    check(pad.w >= 120 && pad.h >= 44 && pad.y + pad.h * .89 >= section.bottom + F.Physics.SIZE / 2,
      'Den måla botnen på sprettplata må stå nede på golvkanten');
  }
  for (let i = 0; i < 23; i++) {
    const section = world.segment(i);
    check(section.obstacles.every(item => item.x + item.w < section.to - 2.5 * section.speed),
      'Hinder i lesestrekninga');
  }
  const answers = Array.from({ length: 23 }, (_, i) => world.quiz.get(i));
  const catalog = F.CapitalQuestions.capitals;
  check(new Set(answers.map(item => item.item.prompt)).size === 23, 'Land vart gjentekne i ei runde');
  for (const item of answers) {
    const country = item.item.prompt;
    check(!/[→?]/.test(country), 'Landnamnet må stå utan pil og spørsmålsteikn');
    check(catalog.some(([name, capital]) => name === country && capital === item.item.correct),
      'Land og hovudstad høyrer ikkje saman');
    check(catalog.some(([, capital]) => capital === item.wrong) && item.wrong !== item.item.correct,
      'Feilalternativet må vere ei anna europeisk hovudstad');
  }
  const game = F.Engine.create(pack, { level: 'back-on-track-study', seed: 31 });
  const first = game.world.segment(1), original = game.world.quiz.get(0);
  const prompt = original.item.prompt, wrong = original.wrong, side = original.correctSide;
  game.state.time = first.start - 2.5;
  check(game.activeChoice()?.item.prompt === original.item.prompt,
    'Hovudstaden må kome 2,5 sekund før portalen');
  game.state.time = first.start - F.Physics.STEP / 2;
  game.state.x = first.from - 2;
  game.state.player.y = game.world.lanes(first)[original.correctSide === 'upper' ? 'lower' : 'upper'];
  game.step({ held: false, pressed: false });
  check(game.state.status === 'dead', 'Feil hovudstad må gje ny start');
  game.reset();
  check(game.world.quiz.get(0).item.prompt === prompt &&
    game.world.quiz.get(0).wrong !== wrong &&
    game.world.quiz.get(0).correctSide !== side,
    'Omstart må halde landet, men byte feil hovudstad og svarside');

  function play(seed) {
    const run = F.Engine.create(pack, { level: 'back-on-track-study', seed });
    const used = new Set();
    let ticks = 0;
    while (run.state.status === 'running' && ticks < 11000) {
      const state = run.state, section = run.world.segment(state.segment);
      const next = state.segment < run.world.count - 1 ? run.world.segment(state.segment + 1) : null;
      const answer = next ? run.world.quiz.get(next.index - 1) : null;
      let held = false, pressed = false;
      if (state.player.mode === 'cube') {
        const spike = section.obstacles.find(item => item.kind === 'spike' &&
          item.x > state.x && item.x - state.x < 85 && !used.has(item.x));
        const pendingPad = section.obstacles.some(item => item.kind === 'pad' &&
          item.x > state.x - 95 && item.x < state.x + 125);
        if (spike && !pendingPad && state.player.grounded) { pressed = true; used.add(spike.x); }
        if (!pressed && next && answer.correctSide === 'upper' &&
            state.x >= next.from - 102 && state.x < next.from - 80 && state.player.grounded) pressed = true;
        held = pressed;
      } else {
        const gate = section.obstacles.find(item => item.kind === 'column' && item.x > state.x - 20);
        const pair = gate && section.obstacles.find(item => item.kind === 'column' && item !== gate && item.x === gate.x);
        let target = gate && pair ? (gate.y + gate.h + pair.y) / 2 : 310;
        if (next && next.from - state.x < 640) target = run.world.lanes(next)[answer.correctSide];
        held = state.player.y + state.player.velocity * .14 > target;
      }
      run.step({ held, pressed }); ticks++;
    }
    return { run, ticks };
  }
  for (const seed of [31, 32, 33, 34, 35, 36]) {
    const { run, ticks } = play(seed);
    check(run.state.events.filter(event => event.pad && Number.isFinite(event.padX)).length >= 6,
      'Sprettplatene må utløyse eigne hendingar i eit fullt spel');
    check(run.state.status === 'complete' && run.state.correct === 23 && ticks === 84 * 120,
      'Heile Hovudstadsporet må vere spelbart: ' + seed + ', ' + run.state.status +
      ', x=' + Math.round(run.state.x) + ', del=' + run.state.segment +
      ', y=' + Math.round(run.state.player.y) + ', fart=' + Math.round(run.state.player.velocity) +
      ', sprett=' + run.state.events.filter(event => event.pad).length);
  }
};
