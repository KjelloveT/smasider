(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create() {
    let previous, current;
    const snapshot = state => ({ ...state, player: { ...state.player, physicsAngle: state.player.angle } });
    function reset(state) { previous = current = state ? snapshot(state) : null; }
    function snap(state) {
      const angle = current && current.time === state.time && current.player.mode === state.player.mode ? current.player.angle : state.player.angle;
      reset(state); current.player.angle = angle;
    }
    function update(state) {
      if (!current || state.time < current.time || state.player.mode !== current.player.mode) { reset(state); return; }
      previous = current; current = snapshot(state);
      const p = current.player, old = previous.player, step = current.time - previous.time;
      if (p.mode === 'ball') p.angle = old.angle + (current.x - previous.x) / 22 * p.gravity;
      if (p.mode === 'swing') {
        const target = p.gravity < 0 ? Math.PI : 0;
        p.angle = old.angle + (target - old.angle) * (1 - Math.exp(-step / .07));
      }
      if (p.mode === 'cube' && p.grounded) {
        const target = Math.round(state.player.angle / (Math.PI / 2)) * Math.PI / 2;
        p.angle = old.angle + (target - old.angle) * (1 - Math.exp(-step / .03));
      }
      else if (p.mode === 'cube') p.angle = old.angle + p.physicsAngle - old.physicsAngle;
      // Teleportation must stay instantaneous; interpolate the scrolling camera as usual.
      if (p.mode === 'spider' && p.gravity !== old.gravity) previous = { ...previous, player: { ...old, y: p.y, gravity: p.gravity } };
    }
    function sample(state, alpha = 1) {
      if (!current || state.time !== current.time) return state;
      if (state.status !== 'running') return { ...state, player: { ...state.player, angle: current.player.angle } };
      const a = Math.max(0, Math.min(1, alpha)), mix = (old, value) => old + (value - old) * a;
      return { ...state, time: mix(previous.time, current.time), x: mix(previous.x, current.x),
        player: { ...current.player, y: mix(previous.player.y, current.player.y), angle: mix(previous.player.angle, current.player.angle) } };
    }
    return { reset, snap, update, sample };
  }
  F.Motion = { create };
})(window);
