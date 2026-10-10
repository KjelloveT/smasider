(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const SPEED = 310;
  function obstacles(mode, start, difficulty, variant) {
    const result = [];
    const add = (time, y, h, kind, width) => result.push({ x: (start + time) * SPEED, y, h, w: width || 36, kind: kind || 'spike' });
    if (mode === 'cube' || mode === 'robot') {
      add(2.1, 444, 34, 'spike', difficulty === 2 ? 62 : 36);
      if (difficulty > 0) add(3.9, 440, 38, 'spike', 42);
    } else if (mode === 'ball' || mode === 'spider') {
      add(2.2, 410, 70, 'column', 48);
      if (difficulty > 0) add(3.9, 126, 86, 'column', 48);
    } else {
      const flipped = variant % 2 === 1;
      add(2.2, flipped ? 126 : 405, flipped ? 106 : 76, 'column', 42);
      if (difficulty > 0) add(3.9, flipped ? 405 : 126, flipped ? 76 : 106, 'column', 42);
    }
    return result;
  }
  function create(config) {
    const tutorial = config.level.startsWith('tutorial-');
    const endless = config.level === 'endless';
    const level = F.level(config.level);
    const duration = tutorial ? 7 : 6 + config.reading;
    const cache = [];
    function segment(index) {
      if (!cache[index]) {
        const random = Vy.rng((config.seed + Math.imul(index + 1, 7919)) >>> 0);
        const mode = tutorial ? config.level.slice(9) : endless ? F.modes[Math.floor(random() * F.modes.length)].id : level.modes[index % level.modes.length];
        const start = index * duration;
        const difficulty = tutorial ? 0 : endless ? Math.min(2, config.difficulty + Math.floor(index / 12)) : level.difficulty;
        cache[index] = { index, mode, start, end: start + duration, questionAt: start + 5.2, gateAt: start + 5.2 + config.reading, scene: tutorial ? 0 : endless ? Math.floor(index / 4) % 4 : level.scene, obstacles: obstacles(mode, start, difficulty, Math.floor(random() * 2)) };
      }
      return cache[index];
    }
    const count = tutorial ? 1 : endless ? Infinity : level.modes.length;
    return { speed: SPEED, duration, count, end: count * duration, tutorial, endless, segment, at: time => segment(Math.floor(time / duration)) };
  }
  F.Levels = { create, obstacles, SPEED };
})(window);
