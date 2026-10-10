(function (root) {
  'use strict';
  const F = root.Fykefuga, palettes = {
    gold: { light: '#fff6ce', colour: '#b67519', accent: '#35647e', dark: '#654324' },
    porcelain: { light: '#ffffff', colour: '#438ab3', accent: '#36548e', dark: '#38516c' },
    copper: { light: '#daffef', colour: '#398a75', accent: '#ad663d', dark: '#5d5442' }
  };
  const LIMIT = 220;
  function create() {
    let particles, history, rings, age, tick, kick, impact, deathAge, teleport, reduced, lastHeld, steering, held;
    let random, palette;
    function reset(config) {
      particles = []; history = []; rings = []; age = 0; tick = 0; kick = 0; impact = 0; deathAge = -1; teleport = null;
      lastHeld = held = false; steering = 0; random = Vy.rng(67139); reduced = !!config.reduced; palette = palettes[config.skin] || palettes.gold;
    }
    function particle(x, y, vx, vy, life, size, kind) {
      if (reduced || particles.length >= LIMIT) return;
      particles.push({ x, y, vx, vy, life, total: life, size, kind });
    }
    function burst(x, y, count, power, kind, direction) {
      for (let i = 0; i < count; i++) {
        const angle = direction === undefined ? random() * Math.PI * 2 : direction + (random() - .5) * 2.4;
        const speed = power * (.35 + random() * .65);
        particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, .24 + random() * .4, 2 + random() * 4.5, kind || 'spark');
      }
    }
    function ring(x, y, radius, life, flat) {
      if (rings.length < 16) rings.push({ x, y, radius, life, total: life, flat: flat || .7 });
    }
    function notify(event, state) {
      const p = state.player;
      if (event.type === 'mode') { history = []; ring(state.x, p.y, 65, .4); burst(state.x, p.y, 26, 180); }
      if (event.type === 'jump') {
        kick = .24; const y = p.y + 16;
        burst(state.x - 5, y, p.mode === 'ufo' ? 26 : 22, 210, 'dust', -Math.PI / 2);
        burst(state.x, y, 10, 180, 'spark', Math.PI); ring(state.x, y, 58, .32, .24);
      }
      if (event.type === 'land') { kick = -.18; burst(state.x, p.y + 13 * p.gravity, 26, 220, 'dust', -p.gravity * Math.PI / 2); ring(state.x, p.y + 14 * p.gravity, 64, .3, .16); }
      if (event.type === 'turn') { kick = .18; steering = .25; ring(state.x, p.y, 58, .3, 1); burst(state.x, p.y, 20, 165); }
      if (event.type === 'teleport') {
        teleport = { x: state.x, from: event.fromY, to: p.y, life: .22 }; history = []; kick = -.18;
        ring(state.x, event.fromY, 52, .3, .28); ring(state.x, p.y, 70, .36, .28); burst(state.x, p.y, 30, 230);
      }
      if (event.type === 'answer') { ring(state.x, p.y, 95, .5); burst(state.x, p.y, 38, 260); }
      if (event.type === 'dead') { deathAge = 0; impact = reduced ? 0 : .2; burst(state.x, p.y, 54, 330, 'shard'); ring(state.x, p.y, 85, .28); }
    }
    function update(state, input) {
      const dt = F.Physics.STEP, p = state.player; age += dt; tick++; held = !!input.held;
      kick = kick > 0 ? Math.max(0, kick - dt) : Math.min(0, kick + dt); steering = Math.max(0, steering - dt);
      impact = Math.max(0, impact - dt); if (deathAge >= 0) deathAge += dt;
      if (teleport && (teleport.life -= dt) <= 0) teleport = null;
      particles.forEach(part => { part.life -= dt; part.x += part.vx * dt; part.y += part.vy * dt; if (part.kind === 'dust' || part.kind === 'shard') part.vy += 280 * dt; });
      particles = particles.filter(part => part.life > 0);
      rings.forEach(value => { value.life -= dt; }); rings = rings.filter(value => value.life > 0);
      if (state.status !== 'running' || reduced) return;
      if (held !== lastHeld && ['ship', 'wave', 'ufo'].includes(p.mode)) {
        steering = .22; burst(state.x - 16, p.y, 12, 150, 'spark', Math.PI); ring(state.x, p.y, 32, .18, .8);
      }
      lastHeld = held;
      history = history.filter(point => age - point.age < .4);
      if (tick % 2 === 0) history.push({ x: state.x, y: p.y, age });
      if (tick % 2 === 0) {
        const flying = ['ship', 'ufo', 'swing', 'wave'].includes(p.mode), thrust = p.mode === 'ship' && held || p.mode === 'robot' && !p.grounded;
        if (flying || !p.grounded) {
          particle(state.x - 23, p.y + (random() - .5) * 14, -110 - random() * 100, (random() - .5) * 65, thrust ? .55 : .36, thrust ? 4 + random() * 4 : 2 + random() * 3, thrust ? 'plume' : 'spark');
          if (thrust) particle(state.x - 28, p.y, -80, (random() - .5) * 50, .62, 7, 'smoke');
        } else if (tick % 4 === 0) particle(state.x - 15, p.y + 12 * p.gravity, -90, -p.gravity * 35, .32, 4, 'dust');
      }
    }
    function ribbon(ctx, state) {
      if (history.length < 2) return;
      const points = history.filter(point => point.x < state.x).concat([{ x: state.x, y: state.player.y }]);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // A tapered ribbon follows movement. It never duplicates the player sprite.
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], strength = i / points.length;
        for (const layer of [{ width: 14, colour: palette.accent, alpha: .2 }, { width: 7, colour: palette.colour, alpha: .75 }, { width: 2.5, colour: palette.light, alpha: .95 }]) {
          ctx.lineWidth = layer.width * strength; ctx.globalAlpha = layer.alpha * strength; ctx.strokeStyle = layer.colour;
          ctx.beginPath(); ctx.moveTo(190 + a.x - state.x - 20, a.y); ctx.lineTo(190 + b.x - state.x - 20, b.y); ctx.stroke();
        }
      }
    }
    function propulsion(ctx, p) {
      ctx.save(); ctx.translate(190, p.y); ctx.globalAlpha = .9;
      if (p.mode === 'ship' || p.mode === 'robot' && !p.grounded) {
        const power = held ? 1 : .38, length = (36 + Math.sin(age * 85) * 9) * power;
        ctx.rotate(p.mode === 'ship' ? p.angle : -.7);
        for (const [width, colour, factor] of [[12, palette.accent, 1.4], [8, palette.colour, 1], [4, palette.light, .68]]) {
          ctx.fillStyle = colour; ctx.beginPath(); ctx.moveTo(-20, -width); ctx.quadraticCurveTo(-35, -width * .7, -24 - length * factor, Math.sin(age * 47) * 5); ctx.quadraticCurveTo(-35, width * .7, -20, width); ctx.fill();
        }
      }
      if (p.mode === 'ufo') {
        for (let i = 0; i < 3; i++) { ctx.globalAlpha = .48 - i * .12; ctx.lineWidth = 2; ctx.strokeStyle = i ? palette.colour : palette.light; ctx.beginPath(); ctx.ellipse(0, 18 + i * 8, 20 - i * 4 + Math.sin(age * 28 + i) * 3, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
      }
      if (p.mode === 'swing' || p.mode === 'ball') {
        ctx.rotate(p.angle + age * 3); ctx.strokeStyle = palette.accent; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(0, 0, 29 + steering * 15, i * 2.1, i * 2.1 + .85); ctx.stroke(); }
      }
      if (p.mode === 'spider' || p.mode === 'robot' && p.grounded) {
        ctx.strokeStyle = palette.dark; ctx.lineWidth = 2.5;
        for (const side of [-1, 1]) { const stride = Math.sin(age * 34 + side) * 6; ctx.beginPath(); ctx.moveTo(side * 11, 8 * p.gravity); ctx.lineTo(side * 21, (15 + stride) * p.gravity); ctx.lineTo(side * 27, 16 * p.gravity); ctx.stroke(); }
      }
      ctx.restore();
    }
    function behind(ctx, state) {
      if (reduced) return;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 130, 960, 346); ctx.clip();
      if (!state.player.grounded || ['wave', 'ship', 'swing', 'ufo'].includes(state.player.mode)) ribbon(ctx, state);
      if (state.status === 'running') propulsion(ctx, state.player);
      if (teleport) {
        ctx.globalAlpha = teleport.life / .22; const x = 190 + teleport.x - state.x;
        for (const [width, colour] of [[17, palette.accent], [8, palette.colour], [3, palette.light]]) {
          ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, teleport.from);
          ctx.lineTo(x + 9, (teleport.from + teleport.to) / 2); ctx.lineTo(x, teleport.to); ctx.stroke();
        }
      }
      ctx.restore();
    }
    function front(ctx, state) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 130, 960, 346); ctx.clip();
      particles.forEach(part => {
        const progress = part.life / part.total, x = 190 + part.x - state.x;
        ctx.globalAlpha = progress * (part.kind === 'smoke' ? .16 : part.kind === 'dust' ? .55 : .9);
        ctx.fillStyle = part.kind === 'smoke' ? palette.dark : part.kind === 'plume' ? palette.light : part.kind === 'shard' ? palette.accent : palette.colour;
        if (part.kind === 'spark' || part.kind === 'shard') {
          ctx.save(); ctx.translate(x, part.y); ctx.rotate(part.vx * age * .03); const size = part.size * progress;
          ctx.fillRect(-size, -size / 3, size * 2, size * .66); ctx.fillStyle = palette.light; ctx.fillRect(-size / 3, -size, size * .66, size * 2); ctx.restore();
        } else { ctx.beginPath(); ctx.ellipse(x, part.y, part.size * (part.kind === 'smoke' ? 2 - progress : progress * 1.8), part.size * progress, 0, 0, Math.PI * 2); ctx.fill(); }
      });
      rings.forEach(value => {
        const progress = 1 - value.life / value.total;
        ctx.globalAlpha = (1 - progress) * (reduced ? .22 : .85); ctx.strokeStyle = palette.colour; ctx.lineWidth = 4 * (1 - progress) + .5;
        ctx.beginPath(); ctx.ellipse(190 + value.x - state.x, value.y, 12 + value.radius * progress, (12 + value.radius * progress) * value.flat, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore();
    }
    function pose(p) {
      if (reduced) return { x: 1, y: 1, rotation: 0 };
      const squash = kick < 0 ? -kick / .18 : kick / .24;
      return { x: kick < 0 ? 1 + squash * .26 : 1 - squash * .14, y: kick < 0 ? 1 - squash * .22 : 1 + squash * .18,
        rotation: p.mode === 'robot' && p.grounded ? Math.sin(age * 34) * .08 : p.mode === 'spider' ? Math.sin(age * 27) * .06 : 0 };
    }
    reset({});
    return { reset, notify, update, behind, front, pose, get shake() { return impact ? Math.sin(age * 70) * impact * 16 : 0; }, get deadScale() { return reduced ? 1 : Math.max(0, 1 - deathAge / .16); }, get count() { return particles.length; }, get trailCount() { return history.length; } };
  }
  F.Effects = { create, LIMIT };
})(window);
