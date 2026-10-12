(function () {
  'use strict';
  const F = window.Fykefuga;
  const slider = document.getElementById('position'), label = document.getElementById('status');
  const game = F.Engine.create(F.builtins[0], { level: 'retray-probe', seed: 1, previewRoute: true });
  const render = F.Render.create(document.getElementById('canvas'));
  const hud = F.ReTrayHud.create(document.getElementById('preview-stage'));
  slider.max = F.ReTray.END_X;
  const config = { skin: 'gold', reduced: false };
  const route = [];
  const jumps = [370, 800, 990, 1240], used = new Set();
  const flips = [5330, 5780, 6070], flipped = new Set();
  let lastUfoPress = -100, tick = 0, frame;
  function target(section, x) {
    const upcoming = section.obstacles.filter(item => item.kind === 'column' && item.x > x - 20);
    if (upcoming.length < 2) return (section.top + section.bottom) / 2;
    const first = upcoming[0], pair = upcoming.find(item => item !== first && item.x === first.x);
    return pair ? ((first.y + first.h) + pair.y) / 2 : (section.top + section.bottom) / 2;
  }
  function control() {
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
    const goal = target(section, x + (p.mode === 'ship' ? 175 : p.mode === 'wave' ? -40 : -30));
    if (p.mode === 'ship') return { held: p.y + p.velocity * .12 > goal, pressed: false };
    if (p.mode === 'wave') return { held: p.y > goal, pressed: false };
    if (p.mode === 'ufo') {
      const pressed = p.y > goal + 32 && p.velocity > 0 && tick - lastUfoPress > 22;
      if (pressed) lastUfoPress = tick;
      return { held: pressed, pressed };
    }
    return { held: false, pressed: false };
  }
  while (game.state.status === 'running' && tick < 10000) {
    const state = game.state;
    route.push({ time: state.time, x: state.x, segment: state.segment, status: state.status,
      player: { ...state.player } });
    game.step(control()); tick++;
  }
  const state = game.state;
  route.push({ time: state.time, x: state.x, segment: state.segment, status: state.status,
    player: { ...state.player } });
  const preview = { world: game.world, get state() { return frame; }, activeChoice: () => F.ReTrayQuestions.active(game.world, frame) };
  const playButton = document.getElementById('play');
  let playback = 0, startedAt = 0, startedTime = 0;
  function stop() {
    if (playback) cancelAnimationFrame(playback);
    playback = 0; playButton.textContent = 'Spel av frå her';
  }
  function show() {
    const x = Number(slider.value);
    let low = 0, high = route.length - 1;
    while (low < high) { const mid = (low + high) >> 1; if (route[mid].x < x) low = mid + 1; else high = mid; }
    frame = route[low]; render.snap(frame); render.draw(preview, config); hud.update(preview.activeChoice(), render.screen);
    const section = game.world.at(frame.time), view = game.world.viewAt(frame.x);
    label.textContent = 'x = ' + Math.round(frame.x) + ' · ' + section.title + ' · ' + frame.time.toFixed(1) +
      ' s · fart ' + section.speed + ' · kamera ' + view.zoom.toFixed(2) + '× · ' +
      (game.state.status === 'complete' ? 'Full rute testa' : 'Ruta stoppa ved krasj');
  }
  function portal(direction) {
    stop();
    const x = Number(slider.value);
    const stops = [0, ...F.ReTray.sections.slice(1).map(section => section.from - 180), F.ReTray.END_X - 300];
    slider.value = direction > 0 ? stops.find(value => value > x + 5) ?? stops.at(-1) : stops.findLast(value => value < x - 5) ?? 0;
    show();
  }
  document.getElementById('previous').addEventListener('click', () => portal(-1));
  document.getElementById('next').addEventListener('click', () => portal(1));
  playButton.addEventListener('click', () => {
    if (playback) { stop(); return; }
    if (frame.time >= game.world.end) slider.value = 0;
    show(); startedTime = frame.time; startedAt = performance.now();
    playButton.textContent = 'Stogg avspelinga';
    function advance(now) {
      const time = Math.min(game.world.end, startedTime + (now - startedAt) / 1000);
      slider.value = Math.round(game.world.xAt(time)); show();
      if (time < game.world.end) playback = requestAnimationFrame(advance); else stop();
    }
    playback = requestAnimationFrame(advance);
  });
  slider.addEventListener('input', () => { stop(); show(); });
  F.Assets.load().then(() => { render.reset(config, route[0]); show(); }).catch(error => { label.textContent = error.message; });
})();
