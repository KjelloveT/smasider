(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const STEP = 1 / 120, TOP = 142, BOTTOM = 462, SIZE = 28, SPLIT = 358;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function player(mode) {
    return { mode, y: ['ship', 'ufo', 'wave', 'swing'].includes(mode) ? 320 : BOTTOM, previousY: 320, velocity: 0, gravity: 1, grounded: true, angle: 0, jumpTime: 0 };
  }
  function update(p, input) {
    p.previousY = p.y;
    const flying = ['ship', 'wave', 'swing', 'ufo'].includes(p.mode);
    if (p.mode === 'cube' && p.grounded && (input.held || input.pressed)) { p.velocity = -1040; p.grounded = false; }
    if (p.mode === 'robot') {
      if (p.grounded && input.pressed) { p.velocity = -700; p.jumpTime = 0; p.grounded = false; }
      if (input.held && !p.grounded && p.velocity < 0 && p.jumpTime < 0.22) p.velocity -= 2200 * STEP;
      p.jumpTime += STEP;
    }
    if (p.mode === 'ball' && p.grounded && input.pressed) { p.gravity *= -1; p.grounded = false; }
    if (p.mode === 'spider' && p.grounded && input.pressed) { p.gravity *= -1; p.y = p.gravity === 1 ? BOTTOM : TOP; p.velocity = 0; }
    if (p.mode === 'ufo' && input.pressed) { p.velocity = -520; p.grounded = false; }
    if (p.mode === 'swing' && input.pressed) p.gravity *= -1;
    if (p.mode === 'wave') p.velocity = input.held ? -340 : 340;
    else if (p.mode === 'ship') p.velocity = clamp(p.velocity + (input.held ? -1850 : 1550) * STEP, -420, 420);
    else if (p.mode === 'swing') p.velocity = clamp(p.velocity + p.gravity * 1850 * STEP, -420, 420);
    else if (p.mode !== 'spider') p.velocity += (p.mode === 'ufo' ? 1650 : 3400) * p.gravity * STEP;
    p.y += p.velocity * STEP;
    if (p.y >= BOTTOM) { p.y = BOTTOM; if (p.velocity > 0) p.velocity = 0; p.grounded = p.gravity === 1; }
    else if (p.y <= TOP) { p.y = TOP; if (p.velocity < 0) p.velocity = 0; p.grounded = p.gravity === -1; }
    else p.grounded = false;
    if (flying) p.grounded = false;
    if (p.mode === 'cube' || p.mode === 'ball') p.angle += (p.grounded ? 0 : 6.8) * STEP;
    else if (p.mode === 'ship' || p.mode === 'ufo') p.angle = clamp(p.velocity / 1000, -0.4, 0.4);
    else p.angle = 0;
  }
  // Samanhengande kollisjon mellom to AABB-ar. Spider testar berre landingsflata i y.
  function collision(oldX, newX, p, obstacle) {
    const half = SIZE / 2;
    let t0 = 0, t1 = 1;
    const oldY = p.mode === 'spider' ? p.y : p.previousY;
    const axes = [[oldX, newX - oldX, obstacle.x - half, obstacle.x + obstacle.w + half], [oldY, p.y - oldY, obstacle.y - half, obstacle.y + obstacle.h + half]];
    for (const [position, delta, min, max] of axes) {
      if (Math.abs(delta) < 1e-9) { if (position <= min || position >= max) return false; }
      else {
        const a = (min - position) / delta, b = (max - position) / delta;
        t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
        if (t0 > t1) return false;
      }
    }
    return t1 >= 0 && t0 <= 1;
  }
  function accumulator() {
    let remainder = 0;
    return { advance(seconds, update) {
      remainder += seconds;
      let steps = 0;
      while (remainder + 1e-10 >= STEP && steps < 30) { update(); remainder -= STEP; steps++; }
      return { steps, alpha: Math.max(0, remainder / STEP) };
    }, clear() { remainder = 0; } };
  }
  F.Physics = { STEP, TOP, BOTTOM, SIZE, SPLIT, player, update, collision, accumulator };
})(window);
