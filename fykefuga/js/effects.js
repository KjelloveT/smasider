(function (root) {
  'use strict';
  const F = root.Fykefuga, palettes = {
    gold: { light: '#fff1b5', colour: '#ce8d2e', dark: '#775126' },
    porcelain: { light: '#eefbff', colour: '#679aca', dark: '#486983' },
    copper: { light: '#d4ffe9', colour: '#69a894', dark: '#926448' }
  };
  function create() {
    let particles = [], history = [], rings = [], age = 0, tick = 0, kick = 0, impact = 0, deathAge = -1, teleport, reduced = false;
    let random = Vy.rng(67139), palette = palettes.gold;
    function reset(config) {
      particles = []; history = []; rings = []; age = 0; tick = 0; kick = 0; impact = 0; deathAge = -1; teleport = null;
      random = Vy.rng(67139); reduced = !!config.reduced; palette = palettes[config.skin] || palettes.gold;
    }
    function particle(x, y, vx, vy, life, size, kind) {
      if (reduced || particles.length >= 120) return;
      particles.push({ x, y, vx, vy, life, total: life, size, kind });
    }
    function burst(x, y, count, power, kind) {
      for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2, speed = power * (.3 + random() * .7);
        particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, .18 + random() * .35, 1.5 + random() * 3, kind || 'spark');
      }
    }
    function ring(x, y, radius, life) {
      if (rings.length < 10) rings.push({ x, y, radius, life, total: life });
    }
    function notify(event, state) {
      const p = state.player;
      if (event.type === 'mode') { history = []; ring(state.x, p.y, 45, .34); burst(state.x, p.y, 16, 110); }
      if (event.type === 'jump') { kick = .18; burst(state.x - 6, p.y + 14, p.mode === 'ufo' ? 10 : 8, 90, 'dust'); ring(state.x, p.y + 15, 25, .2); }
      if (event.type === 'land') { kick = -.13; burst(state.x, p.y + 13 * p.gravity, 10, 100, 'dust'); }
      if (event.type === 'turn') { kick = .12; ring(state.x, p.y, 33, .22); burst(state.x, p.y, 8, 65); }
      if (event.type === 'teleport') { teleport = { x: state.x, from: event.fromY, to: p.y, life: .17 }; history = []; ring(state.x, event.fromY, 32, .2); ring(state.x, p.y, 42, .26); burst(state.x, p.y, 14, 110); }
      if (event.type === 'answer') { ring(state.x, p.y, 76, .44); burst(state.x, p.y, 22, 150); }
      if (event.type === 'dead') { deathAge = 0; impact = reduced ? 0 : .18; burst(state.x, p.y, 32, 230); ring(state.x, p.y, 70, .22); }
    }
    function update(state, input) {
      const dt = F.Physics.STEP, p = state.player; age += dt; tick++;
      kick = kick > 0 ? Math.max(0, kick - dt) : Math.min(0, kick + dt);
      impact = Math.max(0, impact - dt);
      if (deathAge >= 0) deathAge += dt;
      if (teleport && (teleport.life -= dt) <= 0) teleport = null;
      particles.forEach(part => { part.life -= dt; part.x += part.vx * dt; part.y += part.vy * dt; if (part.kind === 'dust') part.vy += 160 * dt; });
      particles = particles.filter(part => part.life > 0);
      rings.forEach(value => { value.life -= dt; }); rings = rings.filter(value => value.life > 0);
      if (state.status !== 'running' || reduced) return;
      history = history.filter(point => age - point.age < .48);
      if (tick % 2 === 0) history.push({ x: state.x, y: p.y, angle: p.angle, gravity: p.gravity, age });
      if (tick % 3 === 0) {
        const flying = ['ship', 'ufo', 'swing', 'wave'].includes(p.mode);
        const plume = p.mode === 'ship' && input.held;
        if (flying || !p.grounded) particle(state.x - 19, p.y + (random() - .5) * 9, -45 - random() * 60, (random() - .5) * 35, plume ? .48 : .3, plume ? 3 + random() * 3 : 1.3 + random() * 2, plume ? 'plume' : 'spark');
        else if (tick % 6 === 0) particle(state.x - 12, p.y + 12 * p.gravity, -45, -p.gravity * 20, .2, 2, 'dust');
      }
    }
    function behind(ctx, state, sprite) {
      if (reduced) return;
      const p = state.player, points = history;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 130, 960, 346); ctx.clip();
      if (p.mode === 'wave' && points.length > 1) {
        const gradient = ctx.createLinearGradient(20, 0, 195, 0);
        gradient.addColorStop(0, 'rgba(206,141,46,0)'); gradient.addColorStop(1, palette.colour);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (const width of [10, 4, 1.6]) {
          ctx.lineWidth = width; ctx.strokeStyle = width === 1.6 ? palette.light : gradient; ctx.globalAlpha = width === 10 ? .18 : .85;
          ctx.beginPath(); points.forEach((point, i) => { const x = 190 + point.x - state.x; if (i === 0) ctx.moveTo(x, point.y); else ctx.lineTo(x, point.y); }); ctx.lineTo(190, p.y); ctx.stroke();
        }
      } else if (sprite) {
        points.filter((_, i) => i % 5 === 0).forEach(point => {
          const progress = 1 - (age - point.age) / .48;
          ctx.save(); ctx.globalAlpha = progress * .17; ctx.translate(190 + point.x - state.x, point.y);
          ctx.rotate(point.angle); ctx.drawImage(sprite, -20, -20, 40, 40); ctx.restore();
        });
      }
      if (teleport) {
        ctx.globalAlpha = teleport.life / .17 * .6; ctx.strokeStyle = palette.light; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(190 + teleport.x - state.x, teleport.from); ctx.lineTo(190 + teleport.x - state.x, teleport.to); ctx.stroke();
      }
      ctx.restore();
    }
    function front(ctx, state) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 130, 960, 346); ctx.clip();
      particles.forEach(part => {
        const progress = part.life / part.total, x = 190 + part.x - state.x;
        ctx.globalAlpha = progress * (part.kind === 'dust' ? .45 : .8);
        ctx.fillStyle = part.kind === 'plume' ? palette.light : palette.colour;
        ctx.beginPath(); ctx.ellipse(x, part.y, part.size * progress * (part.kind === 'plume' ? 2.8 : 1), part.size * progress, 0, 0, Math.PI * 2); ctx.fill();
        if (part.kind === 'spark') { ctx.fillStyle = palette.light; ctx.fillRect(x - .7, part.y - .7, 1.4, 1.4); }
      });
      rings.forEach(value => {
        const progress = 1 - value.life / value.total;
        ctx.globalAlpha = (1 - progress) * (reduced ? .22 : .6); ctx.strokeStyle = palette.colour; ctx.lineWidth = 2 * (1 - progress) + .5;
        ctx.beginPath(); ctx.ellipse(190 + value.x - state.x, value.y, 10 + value.radius * progress, (10 + value.radius * progress) * .65, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.restore();
    }
    function pose(p) {
      if (reduced) return { x: 1, y: 1, rotation: 0 };
      const squash = kick < 0 ? -kick / .13 : kick / .18;
      return { x: kick < 0 ? 1 + squash * .15 : 1 - squash * .08, y: kick < 0 ? 1 - squash * .13 : 1 + squash * .1,
        rotation: p.mode === 'robot' && p.grounded ? Math.sin(age * 25) * .045 : p.mode === 'spider' ? Math.sin(age * 19) * .035 : 0 };
    }
    return { reset, notify, update, behind, front, pose, get shake() { return impact ? Math.sin(age * 70) * impact * 12 : 0; }, get deadScale() { return reduced ? 1 : Math.max(0, 1 - deathAge / .16); }, get count() { return particles.length; }, get trailCount() { return history.length; } };
  }
  F.Effects = { create };
})(window);
