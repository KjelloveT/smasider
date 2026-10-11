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
      const frame = F.Assets.get('portal-side.png');
      if (!frame) return;
      const corridor = world.viewAt(Math.min(at, F.ReTray.END_X - 1));
      const centre = section && section.portalY || (corridor.top + corridor.bottom) / 2;
      const height = Math.min(230, corridor.bottom - corridor.top + 18);
      const width = height * frame.width / frame.height;
      const left = x - width / 2, top = centre - height / 2;
      const speedOnly = !finish && section.index && world.segment(section.index - 1).mode === section.mode;
      const glow = finish ? '#f7d36d' : speedOnly ? '#e8a65a' : '#75bfd0';
      const phase = config.reduced ? 0 : state.time;
      ctx.save();
      if (!foreground) {
        // The far lip and painted energy sit behind nearby obstacles and the craft.
        if (!config.reduced) {
          ctx.shadowColor = glow; ctx.shadowBlur = 16;
          ctx.globalAlpha = .32 + Math.sin(phase * 4 + at) * .08;
          ctx.drawImage(frame, left, top, width, height);
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        ctx.drawImage(frame, left, top, width, height);
        if (!config.reduced) {
          // A moving sheen is confined to the raster's narrow energy seam.
          ctx.save(); ctx.beginPath();
          ctx.ellipse(x + width * .17, centre, width * .14, height * .40, 0, 0, Math.PI * 2); ctx.clip();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = .28 + Math.sin(phase * 3.2) * .08;
          ctx.drawImage(frame, left, top + Math.sin(phase * 2.4 + at) * 7, width, height);
          ctx.globalAlpha = 1;
          const shimmerY = centre - height * .4 + ((phase * 72 + at) % (height * .8));
          const sheen = ctx.createRadialGradient(x + width * .17, shimmerY, 1,
            x + width * .17, shimmerY, height * .15);
          sheen.addColorStop(0, finish ? 'rgba(255,235,173,.58)' : 'rgba(225,255,249,.54)');
          sheen.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sheen; ctx.fillRect(left, top, width, height);
          ctx.restore();
        }
      } else {
        // The near painted lip is redrawn after obstacles and the craft; nothing
        // rectangular floats across the whole corridor during a crossing.
        const nearWidth = Math.round(frame.width * .47);
        ctx.drawImage(frame, 0, 0, nearWidth, frame.height,
          left, top, width * nearWidth / frame.width, height);
        const crossing = Math.max(0, 1 - Math.abs(state.x - at) / 48);
        if (crossing && !config.reduced) {
          const halo = ctx.createRadialGradient(190, state.player.y, 2, 190, state.player.y, 34);
          halo.addColorStop(0, finish ? 'rgba(255,238,182,.42)' : 'rgba(199,255,244,.38)');
          halo.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = crossing;
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(190, state.player.y, 34, 0, Math.PI * 2); ctx.fill();
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
