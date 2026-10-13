module.exports = function testPolargeist(F, check, pack) {
  const world = F.Polargeist.create({ seed: 51 });
  check(world.duration === 88 && world.count === 22 && world.musicScene === 7,
    'Flaggbana må fylgje den heile orkestersatsen');
  check(world.segment(0).mode === 'cube' && world.segment(8).mode === 'ship' &&
    world.segment(12).mode === 'cube', 'Flaggbana må ha terning–skip–terning');
  check(world.quiz.count === 21 && F.FlagQuestions.codes.length === 51,
    'Alle europeiske flagg må vere i PNG-arket og 21 portpar må få spørsmål');
  check(F.Polargeist.obstacles.filter(item => item.kind === 'ring').length >= 5,
    'Hoppringane manglar');
  for (const section of F.Polargeist.sections) {
    check(section.scene === 4, 'Den nye kulissa må brukast i heile flaggbana');
    check(section.obstacles.every(item => item.x + item.w < section.to - world.readingSeconds * world.speed),
      'Hinder ligg i flaggvalet');
  }
  const choices = Array.from({ length: world.quiz.count }, (_, index) => world.quiz.get(index));
  check(new Set(choices.map(item => item.item.prompt)).size === choices.length,
    'Land vart gjentekne i same flaggrunde');
  for (const choice of choices) {
    check(choice.item.kind === 'flag' && choice.upper !== choice.lower &&
      [choice.upper, choice.lower].includes(choice.item.code) &&
      F.FlagQuestions.codes.includes(choice.wrong), 'Ugyldig flaggval');
  }
  const prompt = choices[0].item.prompt, wrong = choices[0].wrong, side = choices[0].correctSide;
  world.quiz.reroll();
  check(world.quiz.get(0).item.prompt === prompt && world.quiz.get(0).wrong !== wrong &&
    world.quiz.get(0).correctSide !== side, 'Nytt forsøk skal halde land, men byte feilflagg og svarside');
  const game = F.Engine.create(pack, { level: 'polargeist-study', seed: 51 });
  const ring = game.world.segment(2).obstacles.find(item => item.kind === 'ring');
  game.state.segment = 2;
  game.state.x = ring.x + ring.w / 2 - 2;
  game.state.time = game.state.x / game.world.speed;
  game.state.player.y = ring.y + ring.h / 2;
  game.state.player.previousY = game.state.player.y;
  game.state.player.velocity = 0;
  game.state.player.grounded = false;
  game.step({ held: true, pressed: true });
  check(game.state.player.velocity === -1000 && game.state.events.some(event => event.ring),
    'Eit nytt trykk gjennom hoppringen må gje løft og hending');
  check(F.ReTrayQuestions.active(world, { status: 'running', segment: 0, time: 2 })?.item.kind === 'flag',
    'Flaggspørsmålet må kome to sekund før portalen');

  function play(seed) {
    const run = F.Engine.create(pack, { level: 'polargeist-study', seed });
    const jumped = new Set();
    let ticks = 0;
    while (run.state.status === 'running' && ticks < 11000) {
      const state = run.state, section = run.world.segment(state.segment);
      const next = state.segment < run.world.count - 1 ? run.world.segment(state.segment + 1) : null;
      const answer = next ? run.world.quiz.get(next.index - 1) : null;
      let held = false, pressed = false;
      if (state.player.mode === 'cube') {
        const ring = section.obstacles.find(item => item.kind === 'ring');
        const ringDistance = ring ? ring.x + ring.w / 2 - state.x : Infinity;
        if (ring && !state.ringsUsed.has(ring.x)) {
          if (state.player.grounded && ringDistance > 75 && ringDistance < 100) pressed = true;
          else if (!state.player.grounded && Math.abs(ringDistance) < 38 &&
              Math.abs(state.player.y - ring.y - ring.h / 2) < 60) pressed = true;
        }
        const spike = section.obstacles.find(item => item.kind === 'spike' &&
          item.x > state.x && item.x - state.x < 85 && !jumped.has(item.x));
        if (!pressed && spike && state.player.grounded) { pressed = true; jumped.add(spike.x); }
        if (!pressed && next && answer.correctSide === 'upper' &&
            state.x >= next.from - 102 && state.x < next.from - 80 && state.player.grounded) pressed = true;
        held = pressed;
      } else {
        let target = 310;
        if (next && next.from - state.x < 640) target = run.world.lanes(next)[answer.correctSide];
        held = state.player.y + state.player.velocity * .14 > target;
      }
      run.step({ held, pressed }); ticks++;
    }
    return { run, ticks };
  }
  for (const seed of [51, 52, 53]) {
    const { run, ticks } = play(seed);
    check(run.state.status === 'complete' && run.state.correct === 21 && ticks === 88 * 120 &&
      run.state.events.filter(event => event.ring).length >= 5,
      'Heile Polargeist må vere spelbar: ' + seed + ', ' + run.state.status +
      ', del=' + run.state.segment + ', x=' + Math.round(run.state.x) +
      ', y=' + Math.round(run.state.player.y) + ', ring=' + run.state.events.filter(event => event.ring).length +
      ', brukt=' + run.state.ringsUsed.size);
  }
};
