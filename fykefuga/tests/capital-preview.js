(function () {
  'use strict';
  const F = window.Fykefuga;
  const slider = document.getElementById('position'), label = document.getElementById('status');
  const game = F.Engine.create(F.builtins[0], { level: 'back-on-track-study', seed: 31, previewRoute: true });
  const render = F.Render.create(document.getElementById('canvas'));
  const hud = F.ReTrayHud.create(document.getElementById('preview-stage'));
  const config = { skin: 'gold', reduced: false };
  const route = [], used = new Set();
  let tick = 0, frame, playback = 0, startedAt = 0, startedTime = 0;
  slider.max = F.BackOnTrack.END_X;
  function control() {
    const state = game.state, section = game.world.segment(state.segment);
    const next = state.segment < game.world.count - 1 ? game.world.segment(state.segment + 1) : null;
    const answer = next ? game.world.quiz.get(next.index - 1) : null;
    let held = false, pressed = false;
    if (state.player.mode === 'cube') {
      const spike = section.obstacles.find(item => item.kind === 'spike' &&
        item.x > state.x && item.x - state.x < 85 && !used.has(item.x));
      const pad = section.obstacles.some(item => item.kind === 'pad' &&
        item.x > state.x - 95 && item.x < state.x + 125);
      if (spike && !pad && state.player.grounded) { pressed = true; used.add(spike.x); }
      if (!pressed && next && answer.correctSide === 'upper' &&
        state.x >= next.from - 102 && state.x < next.from - 80 && state.player.grounded) pressed = true;
      held = pressed;
    } else {
      const gate = section.obstacles.find(item => item.kind === 'column' && item.x > state.x - 20);
      const pair = gate && section.obstacles.find(item => item.kind === 'column' && item !== gate && item.x === gate.x);
      let target = gate && pair ? (gate.y + gate.h + pair.y) / 2 : 310;
      if (next && next.from - state.x < 640) target = game.world.lanes(next)[answer.correctSide];
      held = state.player.y + state.player.velocity * .14 > target;
    }
    return { held, pressed };
  }
  while (game.state.status === 'running' && tick < 11000) {
    const state = game.state;
    route.push({ time: state.time, x: state.x, segment: state.segment, status: state.status,
      player: { ...state.player } });
    game.step(control()); tick++;
  }
  const state = game.state;
  route.push({ time: state.time, x: state.x, segment: state.segment, status: state.status,
    player: { ...state.player } });
  const preview = { world: game.world, get state() { return frame; },
    activeChoice: () => F.ReTrayQuestions.active(game.world, frame) };
  const playButton = document.getElementById('play');
  function stop() { if (playback) cancelAnimationFrame(playback); playback = 0; playButton.textContent = 'Spel av frå her'; }
  function show() {
    const x = Number(slider.value);
    let low = 0, high = route.length - 1;
    while (low < high) { const mid = (low + high) >> 1; if (route[mid].x < x) low = mid + 1; else high = mid; }
    frame = route[low]; render.snap(frame); render.draw(preview, config); hud.update(preview.activeChoice(), render.screen);
    const section = game.world.at(frame.time), view = game.world.viewAt(frame.x);
    label.textContent = 'x = ' + Math.round(frame.x) + ' · ' + section.title + ' · ' + frame.time.toFixed(1) +
      ' s · kamera ' + view.zoom.toFixed(2) + '× · ' +
      (game.state.status === 'complete' ? 'Full rute testa' : 'Ruta stoppa ved krasj');
  }
  function portal(direction) {
    stop(); const x = Number(slider.value);
    const stops = [0, ...F.BackOnTrack.sections.slice(1).map(section => section.from - 180), F.BackOnTrack.END_X - 300];
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
  F.Assets.load().then(() => { render.reset(config, route[0]); show(); })
    .catch(error => { label.textContent = error.message; });
})();
