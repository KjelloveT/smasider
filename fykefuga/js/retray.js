(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // ReTraY (ID 6508283), first cube passage. Positions are read from the
  // decoded level string; decorative pixel-art objects are deliberately omitted.
  // GD uses 30-unit tiles. The ground baseline maps to canvas y=476.
  const SPEED = 300, PORTAL_X = 1729;
  const obstacles = [
    { x: 480, y: 446, w: 30, h: 30, kind: 'spike' },
    { x: 910, y: 446, w: 30, h: 30, kind: 'spike' },
    { x: 1050, y: 446, w: 240, h: 30, kind: 'platform' },
    { x: 1380, y: 416, w: 360, h: 60, kind: 'platform' }
  ];
  function create() {
    const duration = PORTAL_X / SPEED;
    const first = { index: 0, mode: 'cube', start: 0, end: duration,
      questionAt: Infinity, gateAt: Infinity, scene: 0, obstacles };
    return { speed: SPEED, duration, count: 1, end: duration,
      tutorial: true, demo: true, endless: false, musicScene: 4,
      segment: () => first, at: () => first };
  }
  F.ReTray = { create, obstacles, SPEED, PORTAL_X };
})(window);
