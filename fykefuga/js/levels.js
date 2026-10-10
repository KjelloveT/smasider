(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const SPEED = 500, ACTION = 6.2;
  function obstacles(mode, start, difficulty, variant) {
    const result = [];
    const add = (time, y, h, kind, width) => result.push({ x: (start + time) * SPEED, y, h, w: width || 36, kind: kind || 'spike' });
    const times = difficulty === 0 ? [1.15, 2.35, 3.55, 4.75] : difficulty === 1 ? [1.1, 2.1, 3.1, 4.1, 5.1] : [1.05, 1.87, 2.69, 3.51, 4.33, 5.15];
    if (mode === 'cube' || mode === 'robot') {
      times.forEach((time, i) => {
        const tall = (i + variant) % 3 === 1;
        add(time, tall ? 422 : 438, tall ? 56 : 40, 'spike', difficulty === 2 ? 70 : tall ? 48 : 38);
        if (difficulty > 0 && !tall) add(time + .095, 446, 32, 'spike', 30);
      });
    } else if (mode === 'ball' || mode === 'spider') {
      times.forEach((time, i) => {
        const floor = (i + variant) % 2 === 0;
        const height = difficulty === 2 ? 148 : 112;
        add(time, floor ? 478 - height : 126, height, 'column', difficulty === 2 ? 82 : 62);
      });
    } else {
      times.forEach((time, i) => {
        const floor = (i + variant) % 2 === 0, gap = difficulty === 2 ? 174 : difficulty === 1 ? 194 : 220;
        const centre = floor ? 250 : 354, top = centre - gap / 2, bottom = centre + gap / 2;
        add(time, 126, top - 126, 'column', difficulty === 2 ? 72 : 56);
        add(time, bottom, 478 - bottom, 'column', difficulty === 2 ? 72 : 56);
      });
    }
    return result;
  }
  function create(config) {
    const tutorial = config.level.startsWith('tutorial-');
    const endless = config.level === 'endless';
    const level = F.level(config.level);
    const duration = tutorial ? 7 : ACTION + .8 + config.reading;
    const cache = [];
    function segment(index) {
      if (!cache[index]) {
        const random = Vy.rng((config.seed + Math.imul(index + 1, 7919)) >>> 0);
        const mode = tutorial ? config.level.slice(9) : endless ? F.modes[Math.floor(random() * F.modes.length)].id : level.modes[index % level.modes.length];
        const start = index * duration;
        const difficulty = tutorial ? 0 : endless ? Math.min(2, config.difficulty + Math.floor(index / 12)) : level.difficulty;
        cache[index] = { index, mode, start, end: start + duration, questionAt: start + ACTION, gateAt: start + ACTION + config.reading, scene: tutorial ? 0 : endless ? Math.floor(index / 4) % 4 : level.scene, obstacles: obstacles(mode, start, difficulty, Math.floor(random() * 2)) };
      }
      return cache[index];
    }
    const count = tutorial ? 1 : endless ? Infinity : level.modes.length;
    return { speed: SPEED, duration, count, end: count * duration, tutorial, endless, segment, at: time => segment(Math.floor(time / duration)) };
  }
  F.Levels = { create, obstacles, SPEED, ACTION };
})(window);
