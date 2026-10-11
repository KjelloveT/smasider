(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const effects = F.Effects.create();
    const scenery = F.Scenery.create(), motion = F.Motion.create();
    function portal(ctx, section, state, world, config, finish = false, foreground = false) {
      const at = finish ? F.ReTray.END_X : section.from;
      const x = 190 + at - state.x;
      if (x < -100 || x > 1050) return;
      const corridor = world.viewAt(Math.min(at, F.ReTray.END_X - 1));
      const centre = section && section.portalY || (corridor.top + corridor.bottom) / 2;
      const height = Math.min(230, corridor.bottom - corridor.top + 18);
      const speedOnly = !finish && section.index && world.segment(section.index - 1).mode === section.mode;
      const glow = finish ? '#f7d36d' : speedOnly ? '#e8a65a' : '#75bfd0';
      const phase = config.reduced ? 0 : state.time;
      const pulse = config.reduced ? 0 : Math.sin(phase * 5 + at * .01) * 1.8;
      const radius = 30 + pulse, vertical = height * .43;
      ctx.save();
      if (!foreground) {
        // The inner space and moving ripples sit behind the craft.
        ctx.fillStyle = '#102c3b'; ctx.globalAlpha = .56;
        ctx.beginPath(); ctx.ellipse(x, centre, radius, vertical, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(x, centre, radius - 3, vertical - 5, 0, 0, Math.PI * 2); ctx.clip();
        const light = ctx.createLinearGradient(x - radius, centre, x + radius, centre);
        light.addColorStop(0, 'rgba(45,119,139,.18)'); light.addColorStop(.5, 'rgba(158,238,237,.46)');
        light.addColorStop(1, 'rgba(36,95,121,.16)');
        ctx.globalAlpha = .9; ctx.fillStyle = light;
        ctx.fillRect(x - radius, centre - vertical, radius * 2, vertical * 2);
        ctx.strokeStyle = finish ? '#ffe4a0' : '#b1eeee'; ctx.lineWidth = 2;
        for (let row = -3; row <= 3; row++) {
          const y = centre + row * height * .095;
          ctx.globalAlpha = .15 + (3 - Math.abs(row)) * .055;
          ctx.beginPath();
          for (let step = -30; step <= 30; step += 3) {
            const wave = y + Math.sin(step * .14 + phase * 3.4 + row) * 5;
            if (step === -30) ctx.moveTo(x + step, wave); else ctx.lineTo(x + step, wave);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else {
        const distance = state.x - at;
        const crossing = Math.max(0, 1 - Math.abs(distance) / 62);
        if (crossing) {
          ctx.save(); ctx.beginPath(); ctx.ellipse(x, centre, radius - 4, vertical - 5, 0, 0, Math.PI * 2); ctx.clip();
          ctx.fillStyle = glow; ctx.globalAlpha = crossing * .63;
          ctx.fillRect(x - radius, centre - vertical, radius * 2, vertical * 2);
          ctx.fillStyle = '#ffffff'; ctx.globalAlpha = crossing * .48;
          ctx.fillRect(190 + Math.max(-22, Math.min(22, distance * .8)) - 3, centre - vertical, 6, vertical * 2);
          ctx.restore();
        }
        ctx.shadowColor = glow; ctx.shadowBlur = config.reduced ? 0 : 14;
        ctx.strokeStyle = glow; ctx.globalAlpha = .97; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(x, centre, radius, vertical, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([7, 11]); ctx.lineDashOffset = -phase * 24;
        ctx.strokeStyle = finish ? '#fff2bf' : '#f0d898'; ctx.globalAlpha = .82; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(x, centre, radius + 7, vertical + 6, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fff3c4';
        for (let i = 0; i < 8; i++) {
          const angle = phase * 1.45 + i * Math.PI / 4;
          const px = x + Math.cos(angle) * (radius + 7);
          const py = centre + Math.sin(angle) * (vertical + 6);
          ctx.globalAlpha = config.reduced ? .4 : .36 + .56 * Math.max(0, Math.sin(phase * 4 + i));
          ctx.beginPath(); ctx.arc(px, py, i % 2 ? 2 : 2.8, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    function draw(engine, config, alpha = 1) {
      const state = motion.sample(engine.state, alpha), world = engine.world, segment = world.at(state.time);
      const view = world.demo ? world.viewAt(state.x) : { top: 142, bottom: 462, zoom: 1, focusY: 300 };
      const ratio = Math.min(2, root.devicePixelRatio || 1);
      if (canvas.width !== 960 * ratio) { canvas.width = 960 * ratio; canvas.height = 540 * ratio; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = '#e7d9bc'; ctx.fillRect(0, 0, 960, 540);
      ctx.save(); ctx.translate(0, effects.shake);
      const oldScene = world.segment(Math.max(0, segment.index - 1)).scene;
      const blend = Math.min(1, Math.max(0, (state.time - segment.start) / .65));
      if (oldScene !== segment.scene && blend < 1) scenery.background(ctx, oldScene, state.x, config.reduced);
      scenery.background(ctx, segment.scene, state.x, config.reduced, oldScene === segment.scene ? 1 : blend);
      if (!config.reduced) {
        ctx.fillStyle = '#fff5cc';
        for (let i = 0; i < 24; i++) {
          const x = ((i * 149 + 960 - state.x * .12) % 960 + 960) % 960;
          const y = 160 + (i * 61 % 295) + Math.sin(state.time * .6 + i) * 9;
          ctx.globalAlpha = .18 + Math.sin(state.time + i) * .08;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      ctx.save();
      if (world.demo) {
        ctx.translate(190, 300); ctx.scale(view.zoom, view.zoom); ctx.translate(-190, -view.focusY);
      }
      const floor = view.bottom + F.Physics.SIZE / 2, ceiling = view.top - F.Physics.SIZE / 2;
      scenery.surface(ctx, state.x, floor, 64);
      scenery.surface(ctx, state.x, ceiling - 64, 64, 0, 960, true);
      ctx.strokeStyle = '#142820'; ctx.lineWidth = 3 / view.zoom;
      ctx.beginPath(); ctx.moveTo(0, floor); ctx.lineTo(960, floor);
      ctx.moveTo(0, ceiling); ctx.lineTo(960, ceiling); ctx.stroke();
      const choice = engine.activeChoice();
      if (choice) {
        ctx.fillStyle = 'rgba(255,253,245,.42)'; ctx.fillRect(0, 140, 960, 322);
        ctx.setLineDash([12, 9]); ctx.strokeStyle = '#8a5b25'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, F.Physics.SPLIT); ctx.lineTo(960, F.Physics.SPLIT); ctx.stroke(); ctx.setLineDash([]);
        if (['cube', 'robot'].includes(segment.mode)) {
          const startX = 190 + (segment.questionAt + 0.5 - state.time) * world.speed;
          const endX = 190 + (segment.gateAt + 0.1 - state.time) * world.speed;
          scenery.surface(ctx, state.x, 350, 8, startX, endX);
        }
        const gateX = 190 + (choice.segment.gateAt - state.time) * world.speed;
        const gate = F.Assets.get('gate.png');
        if (gate && gateX < 1000) ctx.drawImage(gate, gateX - 18, 130, 36, 346);
        ctx.fillStyle = '#8a5b25'; ctx.fillRect(gateX - 2, 130, 4, 346);
      }
      if (world.demo) {
        for (let i = Math.max(1, segment.index - 1); i <= Math.min(world.count - 1, segment.index + 1); i++)
          portal(ctx, world.segment(i), state, world, config);
        portal(ctx, null, state, world, config, true);
      }
      for (let i = Math.max(0, state.segment - 1); i <= Math.min(world.count - 1, state.segment + 1); i++) {
        const part = world.segment(i);
        part.obstacles.forEach(obstacle => {
          const x = 190 + obstacle.x - state.x;
          if (x + obstacle.w < -100 || x > 1050) return;
          if (obstacle.kind === 'platform') {
            scenery.platform(ctx, state.x, obstacle.y, obstacle.h, x, x + obstacle.w); return;
          }
          const img = F.Assets.get(obstacle.kind + '.png');
          if (img) ctx.drawImage(img, x, obstacle.y, obstacle.w, obstacle.h);
        });
      }
      const p = state.player, sprite = F.Assets.get(config.skin + '-' + p.mode + '.png');
      effects.behind(ctx, state);
      if (sprite) {
        const pose = effects.pose(p), scale = state.status === 'dead' ? effects.deadScale : 1;
        ctx.save(); ctx.translate(190, p.y);
        const angle = p.mode === 'wave' ? (p.velocity < 0 ? -1 : 1) * Math.PI / 4 : p.angle || 0;
        ctx.rotate(angle + (p.mode === 'swing' ? Math.sin(state.time * 7) * .15 : 0) + pose.rotation);
        ctx.scale(pose.x * scale, pose.y * scale);
        if (p.gravity < 0 && ['robot', 'spider'].includes(p.mode)) ctx.scale(1, -1);
        ctx.drawImage(sprite, -28, -28, 56, 56); ctx.restore();
      }
      effects.front(ctx, state);
      if (world.demo) {
        for (let i = Math.max(1, segment.index - 1); i <= Math.min(world.count - 1, segment.index + 1); i++)
          portal(ctx, world.segment(i), state, world, config, false, true);
        portal(ctx, null, state, world, config, true, true);
      }
      ctx.restore();
      ctx.restore();
      if (world.demo && effects.portalFlash && !config.reduced) {
        ctx.fillStyle = 'rgba(255,239,183,' + (effects.portalFlash * .22).toFixed(3) + ')';
        ctx.fillRect(0, 0, 960, 540);
      }
      if (!world.endless) {
        ctx.fillStyle = '#fff9e9'; ctx.fillRect(0, 534, 960, 6);
        ctx.fillStyle = '#8a5b25'; ctx.fillRect(0, 534, 960 * Math.min(1, state.time / world.end), 6);
      }
    }
    return { draw, snap: state => motion.snap(state), reset(config, state) { scenery.prepare(); motion.reset(state); effects.reset(config); },
      update(state, input) { motion.update(state); effects.update(state, input); }, notify: (event, state) => effects.notify(event, state) };
  }
  F.Render = { create };
})(window);
