module.exports = function testRetray(F, check, pack) {
  const world = F.ReTray.create();
  check(world.demo && world.duration > 60 && world.duration < 62, 'Banestudien skal vare kring eitt minutt');
  check(world.count === 12 && world.segment(0).mode === 'cube' && world.segment(11).mode === 'ufo', 'Modusrekkja er ufullstendig');
  check(world.segment(8).mode === 'wave' && world.segment(9).auto && world.segment(10).auto, 'Bølgja og dei automatiske delane manglar');
  check(F.ReTray.END_X === 18345 && F.ReTray.PORTAL_X === 1729, 'Portalane har feil banekoordinatar');
  check(world.viewAt(11000).zoom > world.viewAt(5500).zoom + .3, 'Kameraet kjem ikkje tettare på i låge gangar');
  check(world.viewAt(11000).bottom - world.viewAt(11000).top < world.viewAt(5500).bottom - world.viewAt(5500).top, 'Den låge korridoren manglar');
  const platforms = F.ReTray.obstacles.filter(item => item.kind === 'platform');
  check(platforms.length >= 3 && platforms.every(item => Number.isFinite(item.x) && item.w > 0 && item.w < 400), 'Plattformene har ikkje endelege lengder');
  check(F.ReTray.obstacles.length >= 60, 'Banestudien har for få hinder');
  check(world.segment(0).obstacles.filter(item => item.kind === 'spike').map(item => item.x).join(',') === '480,910', 'Piggane i opninga flytta seg');

  function play() {
    const game = F.Engine.create(pack, { level: 'retray-probe', reading: 4, difficulty: 0, seed: 7, offset: 0 });
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
  check(a.game.state.status === 'complete' && a.tick > 7200 && a.tick < 7300, 'Heile bana kan ikkje spelast frå start til mål');
  check(a.visited.size === world.count && a.used.size === 4 && a.flipped.size === 3, 'Ei rørsleform eller ein portal vart hoppa over');
  check(a.events.filter(type => type === 'portal').length === world.count - 1, 'Portaleffekt manglar ved modusskifte');
  check(a.events.filter(type => type === 'pace').length >= 3, 'Fartsendringane vart ikkje varsla');
  check(a.game.state.correct === 0 && a.game.activeChoice() === null, 'Banestudien skal enno ikkje ha spørsmål');
  const b = play();
  check(b.game.state.status === 'complete' && b.tick === a.tick, 'Banestudien er ikkje deterministisk');
  const idle = F.Engine.create(pack, { level: 'retray-probe', seed: 7 });
  for (let i = 0; i < 350 && idle.state.status === 'running'; i++) idle.step({ held: false, pressed: false });
  check(idle.state.status === 'dead', 'Fyrste pigg skal vere ein reell utfordring');
};
