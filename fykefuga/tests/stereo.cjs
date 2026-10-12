module.exports = function testStereo(F, check, pack) {
  const world = F.Stereo.create({ seed: 19 });
  check(world.duration === 72 && world.musicScene === 5, 'Villrina i Gyllengarden må fylgje heile den nye musikken');
  check(world.count === 23 && world.quiz.count === 22, 'Tjueto gangestykke må høyre til kvar sin svarportal');
  check(world.segment(0).mode === 'cube' && world.segment(6).mode === 'ship' &&
    world.segment(12).mode === 'cube' && world.segment(18).mode === 'ship', 'Dei fire delane må fylgje terning–skip–terning–skip');
  check(world.segment(0).obstacles.length < world.segment(8).obstacles.length, 'Bana skal byggje seg opp frå ei enkel opning');
  check(world.at(18).scene === 1 && world.at(36).scene === 2 && world.at(54).scene === 3,
    'Kulisseskifta må fylgje musikken sine fire delar');
  check(world.viewAt(1200).zoom > world.viewAt(7000).zoom + .2 &&
    300 + (476 - world.viewAt(1200).focusY) * world.viewAt(1200).zoom < 480,
    'Terningkameraet må kome nær utan å klippe golvet');
  for (let index = 0; index < world.count - 1; index++) {
    const section = world.segment(index);
    check(section.obstacles.every(obstacle => obstacle.x + obstacle.w < section.to - 2 * section.speed),
      'Hinder i lesestrekninga');
  }
  const questions = Array.from({ length: world.quiz.count }, (_, index) => world.quiz.get(index));
  check(new Set(questions.map(question => question.item.prompt)).size === 22,
    'Eit gangestykke vart trekt fleire gonger');
  for (const question of questions) {
    const [first, second] = question.item.prompt.split(' × ').map(Number);
    check(first >= 2 && second <= 9 && first * second === Number(question.item.correct),
      'Gangestykke utanfor 2–9');
    check([2, 3, 4].includes(Math.abs(Number(question.wrong) - Number(question.item.correct))),
      'Feilalternativet må vere 2, 3 eller 4 unna fasiten');
  }
  const game = F.Engine.create(pack, { level: 'stereo-study', seed: 19 });
  const first = world.segment(1), original = game.world.quiz.get(0);
  const originalPrompt = original.item.prompt, originalWrong = original.wrong, originalSide = original.correctSide;
  game.state.time = first.start - 2;
  check(game.activeChoice()?.item.prompt === original.item.prompt, 'Gangestykket må kome to sekund før porten');
  game.state.time = first.start - F.Physics.STEP / 2;
  game.state.x = first.from - 2;
  game.state.player.y = F.Stereo.lanes(first)[original.correctSide === 'upper' ? 'lower' : 'upper'];
  game.step({ held: false, pressed: false });
  check(game.state.status === 'dead', 'Feil svar må gje ny start');
  game.reset();
  check(game.world.quiz.get(0).item.prompt === originalPrompt &&
    game.world.quiz.get(0).wrong !== originalWrong &&
    game.world.quiz.get(0).correctSide !== originalSide,
  'Spørsmålet må stå, medan feilalternativet og sida byter plass');
  const fresh = F.Stereo.create({ seed: 201 });
  check(Array.from({ length: 22 }, (_, index) => fresh.quiz.get(index).item.prompt).join() !==
    questions.map(question => question.item.prompt).join(), 'Ny banestart må trekkje nye gangestykke');
  const stationary = F.Physics.player('cube');
  for (let tick = 0; tick < 60; tick++) F.Physics.update(stationary, { held: false, pressed: false });
  check(stationary.grounded && stationary.angle === 0, 'Rulle-effekten skal ikkje endre treffområdet eller grunnstillinga');

  function play(seed) {
    const run = F.Engine.create(pack, { level: 'stereo-study', seed });
    const used = new Set();
    let ticks = 0;
    while (run.state.status === 'running' && ticks < 9000) {
      const state = run.state, section = run.world.segment(state.segment);
      const next = state.segment < run.world.count - 1 ? run.world.segment(state.segment + 1) : null;
      const answer = next ? run.world.quiz.get(next.index - 1) : null;
      let held = false, pressed = false;
      if (state.player.mode === 'cube') {
        const spike = section.obstacles.find(item => item.kind === 'spike' &&
          item.x > state.x && item.x - state.x < 110 && !used.has(item.x));
        if (spike && state.player.grounded) { pressed = true; used.add(spike.x); }
        if (!pressed && next && answer.correctSide === 'upper' &&
            state.x >= next.from - 102 && state.x < next.from - 80 && state.player.grounded) pressed = true;
        held = pressed;
      } else {
        const gate = section.obstacles.find(item => item.kind === 'column' && item.x > state.x - 20);
        const pair = gate && section.obstacles.find(item => item.kind === 'column' && item !== gate && item.x === gate.x);
        let target = gate && pair ? (gate.y + gate.h + pair.y) / 2 : 310;
        if (next && next.from - state.x < 620) target = run.world.lanes(next)[answer.correctSide];
        held = state.player.y + state.player.velocity * .14 > target;
      }
      run.step({ held, pressed }); ticks++;
    }
    return { run, ticks };
  }
  for (const seed of [19, 20, 21, 22, 23, 24]) {
    const { run, ticks } = play(seed);
    check(run.state.status === 'complete' && run.state.correct === 22 && ticks === 72 * 120,
      'Heile Villrina i Gyllengarden må vere spelbar med spørsmåla: ' + seed + ', ' +
      run.state.status + ', x=' + Math.round(run.state.x) + ', del=' + run.state.segment +
      ', grunn=' + (run.state.events.find(item => item.type === 'dead')?.reason || 'ingen'));
  }
};
