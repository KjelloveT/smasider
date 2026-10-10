(function (root) {
  'use strict';
  const F = root.Fykefuga, WIDTH = 960, HEIGHT = 540, ANCHOR = 190;
  const scenes = ['marmor', 'urverk', 'spegel', 'orgel'];
  const wrap = (value, period) => ((value % period) + period) % period;
  function positions(camera, period, left = 0, right = WIDTH) {
    const first = Math.floor((left + camera) / period) * period - camera;
    const result = [];
    for (let x = first; x < right; x += period) result.push(x);
    return result;
  }
  function create() {
    const backgrounds = [], props = [];
    let floor;
    function bitmap(width, height) {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
    }
    // Reflected raster edges meet pixel for pixel. Build once, never at a camera wrap.
    function repeat(image, sx, sy, sw, sh, width, height) {
      const canvas = bitmap(width * 2, height), ctx = canvas.getContext('2d');
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
      ctx.translate(width * 2, 0); ctx.scale(-1, 1);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
      return canvas;
    }
    function prepare() {
      if (floor) return;
      scenes.forEach((name, scene) => {
        const image = F.Assets.get(name + '.jpg');
        // The painted foreground belongs behind the playing plane, not inside it.
        const cropHeight = Math.round(image.height * .8), width = Math.round(image.width * HEIGHT / cropHeight);
        backgrounds[scene] = repeat(image, 0, 0, image.width, cropHeight, width, HEIGHT);
        const prop = F.Assets.get('mid-' + scene + '.png'), height = [330, 270, 300, 330][scene];
        const cached = bitmap(Math.round(prop.width * height / prop.height), height);
        cached.getContext('2d').drawImage(prop, 0, 0, cached.width, cached.height); props[scene] = cached;
      });
      const image = F.Assets.get('floor.png'), inset = Math.round(image.width * .19), sw = image.width - inset * 2;
      // Remove the sloping end caps; marble and carving now form a straight surface.
      floor = repeat(image, inset, 0, sw, image.height, Math.round(sw * 64 / image.height), 64);
    }
    function backdrop(ctx, scene, x, reduced, opacity = 1) {
      const image = backgrounds[scene]; ctx.globalAlpha = opacity;
      for (const left of positions(reduced ? 0 : wrap(x * .08, image.width), image.width)) ctx.drawImage(image, left, 0);
      ctx.globalAlpha = 1;
    }
    function background(ctx, scene, x, reduced, opacity = 1) {
      backdrop(ctx, scene, x, reduced, opacity);
      if (!reduced) {
        const prop = props[scene], camera = x * .22 - ANCHOR - 320;
        ctx.globalAlpha = opacity * .34;
        // Keep the actual proportions and place the base on the scenery floor.
        for (const left of positions(camera, 1160, -prop.width, WIDTH)) ctx.drawImage(prop, left, 468 - prop.height);
      }
      ctx.globalAlpha = 1;
    }
    function surface(ctx, x, y, height, left = 0, right = WIDTH, ceiling = false) {
      left = Math.max(0, left); right = Math.min(WIDTH, right);
      if (right <= left) return;
      ctx.save(); ctx.beginPath(); ctx.rect(left, y, right - left, height); ctx.clip();
      if (ceiling) { ctx.translate(0, y + height); ctx.scale(1, -1); }
      // Clip a world-anchored texture. Growing/shrinking visible bounds never stretch it.
      for (const tileX of positions(x - ANCHOR, floor.width, left, right)) ctx.drawImage(floor, tileX, ceiling ? 0 : y);
      ctx.restore();
    }
    return { prepare, backdrop, background, surface, get cacheCount() { return backgrounds.length + props.length + (floor ? 1 : 0); } };
  }
  F.Scenery = { create, positions, wrap, ANCHOR };
})(window);
