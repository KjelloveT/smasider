module.exports = function testRetray(F, check, pack) {
  const world = F.ReTray.create();
  check(world.demo && world.duration > 60 && world.duration < 70, 'Banestudien skal vare kring eitt minutt');
  check(world.count === 12 && world.segment(0).mode === 'cube' && world.segment(11).mode === 'ufo', 'Modusrekkja er ufullstendig');
  check(world.segment(8).mode === 'wave' && world.segment(9).auto && world.segment(10).auto, 'Bølgja og dei automatiske delane manglar');
  check(F.ReTray.END_X > 18345 && F.ReTray.PORTAL_X === 1729, 'Avgjerdsromma manglar ved tette portalar');
  check(world.viewAt(world.segment(8).from + 1300).zoom > world.viewAt(5500).zoom + .3, 'Kameraet kjem ikkje tettare på i låge gangar');
  check(world.viewAt(world.segment(8).from + 1300).bottom - world.viewAt(world.segment(8).from + 1300).top < world.viewAt(5500).bottom - world.viewAt(5500).top, 'Den låge korridoren manglar');
  const platforms = F.ReTray.obstacles.filter(item => item.kind === 'platform');
  check(platforms.length >= 3 && platforms.every(item => Number.isFinite(item.x) && item.w > 0 && item.w < 400), 'Plattformene har ikkje endelege lengder');
  check(F.ReTray.obstacles.length >= 40, 'Banestudien har for få hinder');
  check(world.segment(0).obstacles.filter(item => item.kind === 'spike').map(item => item.x).join(',') === '480,910', 'Piggane i opninga flytta seg');
  for (let index = 1; index < world.count; index++) {
    check(world.segment(index).start - world.segment(index - 1).start >= 2.25 - 1e-8,
      'Ein port kjem før eleven får to sekund til gangestykket');
  }
  const questions = world.quiz;
  check(questions.count === 11, 'Alle modusportane skal ha eit gangestykke');
  const prompts = new Set();
  for (let index = 0; index < questions.count; index++) {
    const choice = questions.get(index), factors = choice.item.prompt.split(' × ').map(Number);
    check(factors.every(value => value >= 6 && value <= 13), 'Gangestykke utanfor 6–13');
    check(Number(choice.item.correct) === factors[0] * factors[1], 'Feil fasit i gangestykket');
    check([2, 3, 4].includes(Math.abs(Number(choice.wrong) - Number(choice.item.correct))), 'Feilalternativet ligg for langt frå fasiten');
    check(choice[choice.correctSide] === choice.item.correct, 'Rett svar står ikkje i rett port');
    prompts.add(choice.item.prompt);
  }
  check(prompts.size === questions.count, 'Same gangestykke vart delt ut to gonger');
  const quizGame = F.Engine.create(pack, { level: 'retray-probe', seed: 7 });
  const firstPortal = quizGame.world.segment(1), initial = quizGame.world.quiz.get(0);
  const initialPrompt = initial.item.prompt, initialWrong = initial.wrong, initialSide = initial.correctSide;
  quizGame.state.time = firstPortal.start - 2 - F.Physics.STEP;
  quizGame.state.x = quizGame.world.xAt(quizGame.state.time);
  check(quizGame.activeChoice() === null, 'Spørsmålet kjem for tidleg');
  quizGame.state.time = firstPortal.start - 2;
  check(quizGame.activeChoice()?.item.prompt === initialPrompt, 'Spørsmålet kjem ikkje to sekund før porten');
  quizGame.state.time = firstPortal.start - F.Physics.STEP / 2;
  quizGame.state.x = firstPortal.from - 2;
  quizGame.state.player.y = initial.correctSide === 'upper' ? F.ReTray.lanes(firstPortal).lower : F.ReTray.lanes(firstPortal).upper;
  quizGame.step({ held: false, pressed: false });
  check(quizGame.state.status === 'dead' && quizGame.state.events.some(event => event.reason === 'answer'), 'Feil port må starte bana på nytt');
  quizGame.reset();
  check(quizGame.world.quiz.get(0).item.prompt === initialPrompt && quizGame.world.quiz.get(0).wrong !== initialWrong && quizGame.world.quiz.get(0).correctSide !== initialSide,
    'Omstart skal halde på gangestykket, men byte feilalternativ');
  const fresh = F.Engine.create(pack, { level: 'retray-probe', seed: 1822 });
  check(Array.from({ length: 11 }, (_, index) => fresh.world.quiz.get(index).item.prompt).join(',') !==
    Array.from({ length: 11 }, (_, index) => quizGame.world.quiz.get(index).item.prompt).join(','),
    'Ei ny banestart skal trekkje nye gangestykke');
  for (let index = 1; index < world.count; index++) {
    const game = F.Engine.create(pack, { level: 'retray-probe', seed: 7 });
    const portal = game.world.segment(index), answer = game.world.quiz.get(index - 1);
    game.state.time = portal.start - F.Physics.STEP / 2;
    game.state.x = portal.from - 2;
    game.state.segment = index - 1;
    game.state.player = F.Physics.player(game.world.segment(index - 1).mode);
    game.state.player.y = F.ReTray.lanes(portal)[answer.correctSide];
    game.state.player.previousY = game.state.player.y;
    game.step({ held: false, pressed: false });
    check(game.state.status === 'running' && game.state.correct === 1 && game.state.segment === index,
      'Rett port må telje som rett svar og skifte banedel');
  }
  for (const side of ['upper', 'lower']) {
    let seed = 1;
    while (F.ReTray.create({ seed }).quiz.get(0).correctSide !== side) seed++;
    const game = F.Engine.create(pack, { level: 'retray-probe', seed });
    game.state.time = 1600 / 300;
    game.state.x = 1600;
    game.state.player.y = 402;
    game.state.player.previousY = 402;
    game.state.player.grounded = true;
    let jumped = false;
    while (game.state.status === 'running' && game.state.segment === 0) {
      const pressed = side === 'upper' && !jumped && game.state.x >= 1635 && game.state.player.grounded;
      if (pressed) jumped = true;
      game.step({ held: pressed, pressed });
    }
    check(game.state.status === 'running' && game.state.segment === 1 && game.state.correct === 1,
      'Både øvre og nedre svarport må kunne nåast med terningen');
  }

  function play() {
    const game = F.Engine.create(pack, { level: 'retray-probe', reading: 4, difficulty: 0, seed: 7, offset: 0, previewRoute: true });
    const jumps = [370, 800, 990, 1240], used = new Set();
    const flips = [5330, 5780, 6070], flipped = new Set();
    const visited = new Set([0]), events = [];
    let lastUfoPress = -100, tick = 0;
    function goal(section, x) {
      const upcoming = section.obstacles.filter(item => item.kind === 'column' && item.x > x - 20);
      if (upcoming.length < 2) return (section.top + section.bottom) / 2;
      const first = upcoming[0], pair = upcoming.find(item => item !== first && item.x === first.x);
      return pair ? ((first.y + first.h) + pair.y) / 2 : (section.top + section.bottom) / 2;
    }
    function input() {
      const state = game.state, p = state.player, section = game.world.at(state.time), x = state.x;
      if (section.auto) return { held: false, pressed: false };
      if (p.mode === 'cube') {
        const next = jumps.find(value => x >= value && !used.has(value));
        const pressed = !!next && p.grounded;
        if (pressed) used.add(next);
        return { held: pressed, pressed };
      }
      if (p.mode === 'ball') {
        const next = flips.find(value => x >= value && !flipped.has(value));
        const pressed = !!next && p.grounded;
        if (pressed) flipped.add(next);
        return { held: pressed, pressed };
      }
      const target = goal(section, x + (p.mode === 'ship' ? 175 : p.mode === 'wave' ? -40 : -30));
      if (p.mode === 'ship') return { held: p.y + p.velocity * .12 > target, pressed: false };
      if (p.mode === 'wave') return { held: p.y > target, pressed: false };
      if (p.mode === 'ufo') {
        const pressed = p.y > target + 32 && p.velocity > 0 && tick - lastUfoPress > 22;
        if (pressed) lastUfoPress = tick;
        return { held: pressed, pressed };
      }
      return { held: false, pressed: false };
    }
    while (game.state.status === 'running' && tick < 10000) {
      game.step(input()); tick++;
      visited.add(game.state.segment);
      events.push(...game.drain().map(item => item.type));
    }
    return { game, tick, visited, events, used, flipped };
  }
  const a = play();
  check(a.game.state.status === 'complete' && a.tick > 7200 && a.tick < 8500, 'Heile bana kan ikkje spelast frå start til mål');
  check(a.visited.size === world.count && a.used.size === 4 && a.flipped.size === 3, 'Ei rørsleform eller ein portal vart hoppa over');
  check(a.events.filter(type => type === 'portal').length === world.count - 1, 'Portaleffekt manglar ved modusskifte');
  check(a.events.filter(type => type === 'pace').length >= 3, 'Fartsendringane vart ikkje varsla');
  check(a.game.world.quiz.count === world.count - 1, 'Det må vere eitt gangestykke ved kvar port');
  const b = play();
  check(b.game.state.status === 'complete' && b.tick === a.tick, 'Banestudien er ikkje deterministisk');
  const idle = F.Engine.create(pack, { level: 'retray-probe', seed: 7 });
  for (let i = 0; i < 350 && idle.state.status === 'running'; i++) idle.step({ held: false, pressed: false });
  check(idle.state.status === 'dead', 'Fyrste pigg skal vere ein reell utfordring');
};
