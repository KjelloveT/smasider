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
      });
      const image = F.Assets.get('floor.png');
      // Only the painted marble face is used. The source image's top and carved
      // underside gave both the ground and finite platforms a false 3D depth.
      const sourceX = Math.round(image.width * .27), sourceWidth = Math.round(image.width * .46);
      const sourceY = Math.round(image.height * .08), sourceHeight = Math.round(image.height * .29);
      floor = repeat(image, sourceX, sourceY, sourceWidth, sourceHeight,
        Math.round(sourceWidth * 64 / sourceHeight), 64);
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
      ctx.fillStyle = '#c99e5c'; ctx.fillRect(left, ceiling ? y + height - 4 : y, right - left, 2);
      ctx.fillStyle = '#142820'; ctx.fillRect(left, ceiling ? y + height - 2 : y + 2, right - left, 2);
    }
    // A finite, flat marble rectangle with straight painted end strokes.
    function platform(ctx, camera, y, height, left, right) {
      if (right <= left) return;
      ctx.save(); ctx.beginPath(); ctx.rect(left, y, right - left, height); ctx.clip();
      const tileWidth = floor.width * height / 64;
      for (const tileX of positions(camera - ANCHOR, tileWidth, left, right))
        ctx.drawImage(floor, tileX, y, tileWidth, height);
      ctx.restore();
      ctx.fillStyle = '#142820';
      ctx.fillRect(left, y, right - left, 3); ctx.fillRect(left, y + height - 3, right - left, 3);
      ctx.fillRect(left, y, 3, height); ctx.fillRect(right - 3, y, 3, height);
      ctx.fillStyle = '#c99e5c';
      ctx.fillRect(left + 3, y + 3, right - left - 6, 2);
      ctx.fillRect(left + 3, y + 3, 2, height - 6); ctx.fillRect(right - 5, y + 3, 2, height - 6);
    }
    return { prepare, backdrop, background, surface, platform, get cacheCount() { return backgrounds.length + (floor ? 1 : 0); } };
  }
  F.Scenery = { create, positions, wrap, ANCHOR };
})(window);
