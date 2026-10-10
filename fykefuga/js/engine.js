(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create(pack, config) {
    const world = F.Levels.create(config);
    const getQuestion = F.Questions.sequence(pack, config.seed, config.offset);
    const choices = new Map();
    let state, random, attempt = 0;
    function getChoice(index) {
      if (!choices.has(index)) choices.set(index, F.Questions.choice(pack, getQuestion(index), random));
      return choices.get(index);
    }
    function reset() {
      attempt++;
      random = Vy.rng(config.seed + attempt * 104729);
      choices.clear();
      state = { status: 'running', time: 0, x: 0, segment: 0, player: F.Physics.player(world.segment(0).mode), correct: 0, attempt, events: [], answered: new Set(), errors: [] };
      state.events.push({ type: 'mode', mode: state.player.mode });
      return state;
    }
    function die(type, detail) {
      state.status = 'dead';
      state.events.push({ type: 'dead', reason: type, detail });
      if (type === 'answer') state.errors.push({ prompt: detail.item.prompt, correct: detail.item.correct, chosen: detail.chosen });
    }
    function step(input) {
      if (state.status !== 'running') return;
      const oldX = state.x;
      state.time += F.Physics.STEP;
      state.x = state.time * world.speed;
      if (state.time >= world.end - 1e-8) {
        state.status = 'complete'; state.events.push({ type: 'complete', tutorial: world.tutorial, mode: state.player.mode }); return;
      }
      const segment = world.at(state.time);
      if (segment.index !== state.segment) {
        state.segment = segment.index;
        state.player = F.Physics.player(segment.mode);
        state.events.push({ type: 'mode', mode: segment.mode });
      }
      const before = { velocity: state.player.velocity, grounded: state.player.grounded, gravity: state.player.gravity, y: state.player.y };
      F.Physics.update(state.player, input);
      // Ei einvegshylle gjev hoppmodusane ein stabil øvre svarveg.
      if (!world.tutorial && ['cube', 'robot'].includes(segment.mode) && state.time >= segment.questionAt + 0.5 && state.time <= segment.gateAt + 0.1) {
        const p = state.player, surface = 336;
        if (p.previousY <= surface && p.y >= surface && p.velocity >= 0) { p.y = surface; p.velocity = 0; p.grounded = true; }
      }
      const p = state.player;
      if (p.mode === 'ufo' && input.pressed || ['cube', 'robot'].includes(p.mode) && before.grounded && p.velocity < -400) state.events.push({ type: 'jump', mode: p.mode });
      if (p.mode === 'spider' && before.y !== p.y) state.events.push({ type: 'teleport', mode: p.mode, fromY: before.y });
      else if (before.gravity !== p.gravity) state.events.push({ type: 'turn', mode: p.mode });
      if (!before.grounded && p.grounded && Math.abs(before.velocity) > 150) state.events.push({ type: 'land', mode: p.mode });
      if (segment.obstacles.some(obstacle => F.Physics.collision(oldX, state.x, state.player, obstacle))) { die('crash'); return; }
      if (!world.tutorial && state.time + 1e-8 >= segment.gateAt && !state.answered.has(segment.index)) {
        const choice = getChoice(segment.index);
        const side = state.player.y < F.Physics.SPLIT ? 'upper' : 'lower';
        state.answered.add(segment.index);
        if (side !== choice.correctSide) { die('answer', { ...choice, chosen: choice[side] }); return; }
        state.correct++;
        state.events.push({ type: 'answer', item: choice.item, correct: state.correct });
      }
    }
    function activeChoice() {
      const segment = world.at(state.time);
      return !world.tutorial && state.time >= segment.questionAt && state.time <= segment.gateAt + 0.15 ? { ...getChoice(segment.index), remaining: Math.max(0, segment.gateAt - state.time), segment } : null;
    }
    reset();
    return { world, get state() { return state; }, step, reset, activeChoice, getChoice, drain() { return state.events.splice(0); } };
  }
  F.Engine = { create };
})(window);
