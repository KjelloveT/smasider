module.exports = function testPolargeist(F, check, pack) {
  const world = F.Polargeist.create({ seed: 51 });
  const source = F.PolargeistSource;
  check(world.duration === 92 && world.musicScene === 7 && F.Polargeist.BPM === 90,
    'Flaggbana og det heile orkesterstykket må vare like lenge');
  check(source.pits.length === 470 && source.spikes.length === 184 &&
    source.rings.length === 29 && source.ledges.length === 64,
    'Banekartet må byggje på dei dekoda originalposisjonane');
  check(world.questionCount === 8 && world.quiz.count === 8 && world.count === 11,
    'Åtte flaggval og to eigne modusskifte må vere på plass');
  check(world.at(F.Polargeist.mapX(9645) / world.speed - .01).mode === 'cube' &&
    world.at(F.Polargeist.mapX(9645) / world.speed + .01).mode === 'ship' &&
    world.at(F.Polargeist.mapX(13305) / world.speed + .01).mode === 'cube',
    'Terning–skip–terning må skifte ved dei opphavlege portalplasseringane');
  check(F.Polargeist.obstacles.filter(item => item.kind === 'ring').length === 29 &&
    F.Polargeist.obstacles.filter(item => item.kind === 'spike').length >= 160 &&
    F.Polargeist.obstacles.some(item => item.kind === 'pit' && item.w > 900),
    'Hoppringar, piggar og lange piggehav må vere att i bana');
  check(F.Polargeist.obstacles.some(item => item.kind === 'platform' &&
    item.y < 420 && item.h === 16), 'Hengjeplattformene må liggje over piggehavet');
  for (const gate of F.Polargeist.gates) {
    const boundary = F.Polargeist.mapX(gate);
    const previous = world.at((boundary - 1) / world.speed);
    const following = world.at((boundary + 1) / world.speed);
    check(previous.obstacles.filter(item => !['chain', 'ring'].includes(item.kind))
      .every(item => item.x + item.w < boundary - 580),
      'Svarstrekninga har eit hinder ved x=' + gate);
    check(following.obstacles.filter(item => ['spike', 'pit', 'platform'].includes(item.kind))
      .every(item => item.x >= boundary + 180),
      'Utgangen frå svarportalen har eit hinder ved x=' + gate);
  }
  check(F.FlagQuestions.codes.length === 51, 'Flaggatlaset må framleis ha alle europeiske flagga');
  const choices = Array.from({ length: world.quiz.count }, (_, index) => world.quiz.get(index));
  check(new Set(choices.map(item => item.item.prompt)).size === choices.length,
    'Land vart gjentekne i same flaggrunde');
  const prompt = choices[0].item.prompt, wrong = choices[0].wrong;
  world.quiz.reroll();
  check(world.quiz.get(0).item.prompt === prompt && world.quiz.get(0).wrong !== wrong,
    'Nytt forsøk skal halde land, men byte feilflagg');
  const game = F.Engine.create(pack, { level: 'polargeist-study', seed: 51 });
  const ring = game.world.segment(0).obstacles.find(item => item.kind === 'ring');
  game.state.x = ring.x + ring.w / 2 - 2;
  game.state.time = game.state.x / game.world.speed;
  game.state.player.y = ring.y + ring.h / 2;
  game.state.player.previousY = game.state.player.y;
  game.state.player.velocity = 0;
  game.state.player.grounded = false;
  game.step({ held: true, pressed: true });
  check(game.state.player.velocity === -1000 && game.state.events.some(event => event.ring),
    'Eit nytt trykk gjennom ein faktisk plassert hoppring må gje løft');
  const firstGate = world.segment(1);
  check(F.ReTrayQuestions.active(world, { status: 'running', segment: 0,
    time: firstGate.start - 1 })?.item.kind === 'flag',
    'Flaggspørsmålet må kome i den trygge strekninga før portalen');
};
