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
    const backgrounds = [];
    let floor, panel;
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
      });
      panel = F.Assets.get('platform-panel.png');
      // The painted centre reflects at each seam; ornamental ends are reserved
      // for finite platforms, so every length has complete end caps.
      const cap = Math.round(panel.height * .6), centreWidth = panel.width - 2 * cap;
      floor = repeat(panel, cap, 0, centreWidth, panel.height,
        Math.round(centreWidth * 64 / panel.height), 64);
    }
    function backdrop(ctx, scene, x, reduced, opacity = 1) {
      const image = backgrounds[scene]; ctx.globalAlpha = opacity;
      for (const left of positions(reduced ? 0 : wrap(x * .08, image.width), image.width)) ctx.drawImage(image, left, 0);
      ctx.globalAlpha = 1;
    }
    function background(ctx, scene, x, reduced, opacity = 1) {
      backdrop(ctx, scene, x, reduced, opacity);
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
    // Nine-slice-like rendering: the centre repeats while both painted ends
    // keep their aspect ratio, including on the shortest blocks.
    function platform(ctx, camera, y, height, left, right) {
      if (right <= left) return;
      const sourceCap = Math.round(panel.height * .6);
      const capWidth = Math.min((right - left) / 2, sourceCap * height / panel.height);
      const insideLeft = left + capWidth, insideRight = right - capWidth;
      ctx.save(); ctx.beginPath(); ctx.rect(left, y, right - left, height); ctx.clip();
      const tileWidth = floor.width * height / 64;
      ctx.beginPath(); ctx.rect(insideLeft, y, insideRight - insideLeft, height); ctx.clip();
      for (const tileX of positions(camera - ANCHOR, tileWidth, insideLeft, insideRight))
        ctx.drawImage(floor, tileX, y, tileWidth, height);
      ctx.restore();
      ctx.drawImage(panel, 0, 0, sourceCap, panel.height, left, y, capWidth, height);
      ctx.drawImage(panel, panel.width - sourceCap, 0, sourceCap, panel.height,
        insideRight, y, capWidth, height);
    }
    return { prepare, backdrop, background, surface, platform, get cacheCount() { return backgrounds.length + (floor ? 1 : 0); } };
  }
  F.Scenery = { create, positions, wrap, ANCHOR };
})(window);
