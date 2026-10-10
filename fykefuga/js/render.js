(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const effects = F.Effects.create();
    const scenes = ['marmor', 'urverk', 'spegel', 'orgel'];
    function tile(file, offset, y, width, height, opacity) {
      const img = F.Assets.get(file); if (!img) return;
      ctx.globalAlpha = opacity || 1;
      for (let x = -(offset % width); x < 960; x += width) ctx.drawImage(img, x, y, width, height);
      ctx.globalAlpha = 1;
    }
    function draw(engine, config) {
      const state = engine.state, world = engine.world, segment = world.at(state.time);
      const ratio = Math.min(2, root.devicePixelRatio || 1);
      if (canvas.width !== 960 * ratio) { canvas.width = 960 * ratio; canvas.height = 540 * ratio; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = '#e7d9bc'; ctx.fillRect(0, 0, 960, 540);
      ctx.save(); ctx.translate(0, effects.shake);
      tile(scenes[segment.scene] + '.jpg', config.reduced ? 0 : state.x * 0.08, 0, 960, 540);
      // Lys slør skil spelplanet frå den detaljrike måla kulissen.
      ctx.fillStyle = 'rgba(255,249,233,.32)'; ctx.fillRect(0, 122, 960, 356);
      if (!config.reduced) tile('mid-' + segment.scene + '.png', state.x * 0.24, 115, 500, 360, 0.22);
      if (!config.reduced) {
        ctx.fillStyle = '#fff5cc';
        for (let i = 0; i < 24; i++) {
          const x = ((i * 149 + 960 - state.x * .12) % 960 + 960) % 960, y = 160 + (i * 61 % 295) + Math.sin(state.time * .6 + i) * 9;
          ctx.globalAlpha = .18 + Math.sin(state.time + i) * .08; ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      tile('floor.png', state.x, 476, 128, 64);
      tile('floor.png', state.x, 110, 128, 18);
      ctx.strokeStyle = '#142820'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 476); ctx.lineTo(960, 476); ctx.moveTo(0, 128); ctx.lineTo(960, 128); ctx.stroke();
      const choice = engine.activeChoice();
      if (choice) {
        ctx.fillStyle = 'rgba(255,253,245,.42)'; ctx.fillRect(0, 140, 960, 322);
        ctx.setLineDash([12, 9]); ctx.strokeStyle = '#8a5b25'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, F.Physics.SPLIT); ctx.lineTo(960, F.Physics.SPLIT); ctx.stroke(); ctx.setLineDash([]);
        if (['cube', 'robot'].includes(segment.mode)) {
          const startX = 190 + (segment.questionAt + 0.5 - state.time) * world.speed;
          const endX = 190 + (segment.gateAt + 0.1 - state.time) * world.speed;
          ctx.drawImage(F.Assets.get('floor.png'), Math.max(0, startX), 350, Math.max(0, Math.min(960, endX) - Math.max(0, startX)), 8);
        }
        const gateX = 190 + (choice.segment.gateAt - state.time) * world.speed;
        const gate = F.Assets.get('gate.png');
        if (gate && gateX < 1000) ctx.drawImage(gate, gateX - 18, 130, 36, 346);
        ctx.fillStyle = '#8a5b25'; ctx.fillRect(gateX - 2, 130, 4, 346);
      }
      for (let i = Math.max(0, state.segment - 1); i <= state.segment + 1; i++) {
        const part = world.segment(i);
        part.obstacles.forEach(obstacle => {
          const x = 190 + obstacle.x - state.x;
          if (x < -100 || x > 1000) return;
          const img = F.Assets.get(obstacle.kind + '.png');
          if (img) ctx.drawImage(img, x, obstacle.y, obstacle.w, obstacle.h);
          // Treffområdet får ein tydeleg mørk fot; biletdetaljane endrar aldri fysikken.
          ctx.strokeStyle = '#142820'; ctx.lineWidth = 2; ctx.strokeRect(x, obstacle.y, obstacle.w, obstacle.h);
        });
      }
      const p = state.player, sprite = F.Assets.get(config.skin + '-' + p.mode + '.png');
      effects.behind(ctx, state);
      if (sprite) {
        const pose = effects.pose(p), scale = state.status === 'dead' ? effects.deadScale : 1;
        ctx.save(); ctx.translate(190, p.y);
        const angle = p.mode === 'ball' ? state.x / 18 * p.gravity : p.mode === 'wave' ? (p.velocity < 0 ? -1 : 1) * Math.PI / 4 : p.mode === 'cube' && p.grounded ? Math.round(p.angle / (Math.PI / 2)) * Math.PI / 2 : p.angle || 0;
        ctx.rotate((p.mode === 'swing' ? Math.sin(state.time * 7) * 0.15 + (p.gravity < 0 ? Math.PI : 0) : angle) + pose.rotation);
        ctx.scale(pose.x * scale, pose.y * scale);
        if (p.gravity < 0 && ['robot', 'spider'].includes(p.mode)) ctx.scale(1, -1);
        ctx.drawImage(sprite, -28, -28, 56, 56); ctx.restore();
      }
      effects.front(ctx, state); ctx.restore();
      if (!world.endless) {
        ctx.fillStyle = '#fff9e9'; ctx.fillRect(0, 534, 960, 6); ctx.fillStyle = '#8a5b25'; ctx.fillRect(0, 534, 960 * Math.min(1, state.time / world.end), 6);
      }
    }
    return { draw, reset: config => effects.reset(config), update: (state, input) => effects.update(state, input), notify: (event, state) => effects.notify(event, state) };
  }
  F.Render = { create };
})(window);
