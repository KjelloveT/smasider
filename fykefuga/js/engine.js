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
      if (world.demo && state && state.status === 'dead') world.quiz.reroll();
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
      state.x = world.xAt ? world.xAt(state.time) : state.time * world.speed;
      if (state.time >= world.end - 1e-8) {
        state.status = 'complete'; state.events.push({ type: 'complete', tutorial: world.tutorial, mode: state.player.mode }); return;
      }
      const segment = world.at(state.time);
      if (segment.index !== state.segment) {
        if (world.demo && !world.previewRoute) {
          const choice = world.quiz.get(segment.index - 1);
          const lanes = F.ReTray.lanes(segment);
          const side = state.player.y < lanes.split ? 'upper' : 'lower';
          if (Math.abs(state.player.y - lanes[side]) > lanes.height / 2 + F.Physics.SIZE / 2) { die('crash'); return; }
          if (side !== choice.correctSide) { die('answer', { ...choice, chosen: choice[side] }); return; }
          state.correct++;
          state.events.push({ type: 'answer', item: choice.item, correct: state.correct });
        }
        state.segment = segment.index;
        if (world.demo) {
          const former = state.player, changed = former.mode !== segment.mode;
          if (changed) {
            const next = F.Physics.player(segment.mode), corridor = world.viewAt(state.x);
            next.y = Math.max(corridor.top, Math.min(corridor.bottom, former.y));
            next.previousY = next.y; next.velocity = former.velocity * .3; next.grounded = false;
            state.player = next; state.events.push({ type: 'mode', mode: segment.mode });
          } else state.events.push({ type: 'pace', speed: segment.speed });
          state.events.push({ type: 'portal', mode: segment.mode, x: segment.from });
        } else {
          state.player = F.Physics.player(segment.mode);
          state.events.push({ type: 'mode', mode: segment.mode });
        }
      }
      const corridor = world.demo ? world.viewAt(state.x) : null;
      const p = state.player;
      if (world.demo && p.grounded && ['cube', 'ball'].includes(p.mode)) {
        const oldCorridor = world.viewAt(oldX);
        if (p.gravity === 1 && Math.abs(p.y - oldCorridor.bottom) < 2) p.y = corridor.bottom;
        else if (p.gravity === -1 && Math.abs(p.y - oldCorridor.top) < 2) p.y = corridor.top;
      }
      const before = { velocity: p.velocity, grounded: p.grounded, gravity: p.gravity, y: p.y };
      const next = world.demo && state.segment < world.count - 1 ? world.segment(state.segment + 1) : null;
      if (world.demo && segment.auto && (world.previewRoute || !next || state.time < next.start - 2)) {
        p.previousY = p.y; p.y = F.ReTray.autoTarget(segment, state.x, p, corridor);
        p.velocity = (p.y - p.previousY) / F.Physics.STEP;
        p.grounded = segment.mode === 'cube' && p.y >= corridor.bottom - .5;
      } else F.Physics.update(p, input, corridor);
      // Ei einvegshylle gjev hoppmodusane ein stabil øvre svarveg.
      if (!world.tutorial && ['cube', 'robot'].includes(segment.mode) && state.time >= segment.questionAt + 0.5 && state.time <= segment.gateAt + 0.1) {
        const p = state.player, surface = 336;
        if (p.previousY <= surface && p.y >= surface && p.velocity >= 0) { p.y = surface; p.velocity = 0; p.grounded = true; }
      }
      if (!segment.auto && (p.mode === 'ufo' && input.pressed || ['cube', 'robot'].includes(p.mode) && before.grounded && p.velocity < -400)) state.events.push({ type: 'jump', mode: p.mode });
      if (p.mode === 'spider' && before.y !== p.y) state.events.push({ type: 'teleport', mode: p.mode, fromY: before.y });
      else if (before.gravity !== p.gravity) state.events.push({ type: 'turn', mode: p.mode });
      // On the ReTraY study, solid marble steps can be landed on from above.
      // Their sides and undersides still stop the player.
      let landed = null;
      if (world.demo) for (const block of segment.obstacles.filter(item => item.kind === 'platform')) {
        const surface = block.y - F.Physics.SIZE / 2;
        if (p.velocity >= 0 && p.previousY <= surface + 2 && p.y >= surface &&
            state.x + F.Physics.SIZE / 2 > block.x && state.x - F.Physics.SIZE / 2 < block.x + block.w) {
          p.y = surface; p.velocity = 0; p.grounded = true; landed = block; break;
        }
      }
      if (!before.grounded && p.grounded && Math.abs(before.velocity) > 150) state.events.push({ type: 'land', mode: p.mode });
      if (segment.obstacles.some(obstacle => {
        if (obstacle === landed) return false;
        if (obstacle.kind === 'platform' && p.previousY <= obstacle.y - F.Physics.SIZE / 2 + .01 && p.y <= obstacle.y - F.Physics.SIZE / 2 + .01) return false;
        return F.Physics.collision(oldX, state.x, p, obstacle);
      })) { die('crash'); return; }
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
      if (world.demo) return F.ReTrayQuestions.active(world, state);
      const segment = world.at(state.time);
      return !world.tutorial && state.time >= segment.questionAt && state.time <= segment.gateAt + 0.15 ? { ...getChoice(segment.index), remaining: Math.max(0, segment.gateAt - state.time), segment } : null;
    }
    reset();
    return { world, get state() { return state; }, step, reset, activeChoice, getChoice, drain() { return state.events.splice(0); } };
  }
  F.Engine = { create };
})(window);
