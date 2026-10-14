(function () {
  'use strict';
  const F = window.Fykefuga, slider = document.getElementById('position');
  const label = document.getElementById('status');
  const game = F.Engine.create(F.builtins[0], { level: 'polargeist-study', seed: 1, previewRoute: true });
  const render = F.Render.create(document.getElementById('canvas'));
  const hud = F.ReTrayHud.create(document.getElementById('preview-stage'));
  const config = { skin: 'gold', reduced: false };
  const stops = [0, ...F.Polargeist.sections.slice(1).map(section => section.from - 240), F.Polargeist.END_X - 240];
  function show() {
    const x = Number(slider.value), section = game.world.at(x / game.world.speed);
    const state = game.state;
    state.x = x; state.time = x / game.world.speed; state.segment = section.index;
    state.player.mode = section.mode;
    state.player.y = section.mode === 'ship' ? 290 : section.bottom;
    state.player.previousY = state.player.y;
    render.snap(state); render.draw(game, config); hud.update(game.activeChoice(), render.screen);
    label.textContent = 'x = ' + Math.round(x) + ' · ' + section.mode + ' · ' +
      state.time.toFixed(1) + ' s · kamera ' + game.world.viewAt(x).zoom.toFixed(2) + '×';
  }
  function move(direction) {
    const x = Number(slider.value);
    slider.value = direction > 0 ? stops.find(value => value > x + 5) ?? stops.at(-1)
      : stops.findLast(value => value < x - 5) ?? 0;
    show();
  }
  slider.addEventListener('input', show);
  document.getElementById('previous').addEventListener('click', () => move(-1));
  document.getElementById('next').addEventListener('click', () => move(1));
  F.Assets.load().then(() => { render.reset(config, game.state); show(); })
    .catch(error => { label.textContent = error.message; });
})();
