(async function () {
  'use strict';
  const F = window.Fykefuga, $ = id => document.getElementById(id);
  await F.Assets.load();
  const scenery = F.Scenery.create(); scenery.prepare();
  const probe = document.createElement('canvas'); probe.width = 960; probe.height = 540;
  const ctx = probe.getContext('2d', {willReadFrequently:true}); let maxDifference = 0;
  for (let scene = 0; scene < 4; scene++) {
    const image = F.Assets.get(['marmor','urverk','spegel','orgel'][scene] + '.jpg');
    const width = Math.round(image.width * 540 / Math.round(image.height * .8));
    for (const edge of [width, width * 2]) {
      scenery.backdrop(ctx, scene, (edge - .01) / .08, false); const before = ctx.getImageData(0,0,960,540).data;
      scenery.backdrop(ctx, scene, (edge + .01) / .08, false); const after = ctx.getImageData(0,0,960,540).data;
      let difference = 0; for (let i = 0; i < before.length; i++) if (i % 4 !== 3) difference += Math.abs(before[i] - after[i]);
      maxDifference = Math.max(maxDifference, difference / (960 * 540 * 3));
    }
  }
  $('checks').textContent = maxDifference < 1 ? 'Bestått: alle åtte bakgrunnsskøytar er utan bilethopp.' : 'Bakgrunnsskøyt må kontrollerast: for stor biletskilnad.';
  $('detail').textContent = 'Største gjennomsnittlege pikselendring ved skøyten: ' + maxDifference.toFixed(3) + ' av 255. Ni førebudde rasterflater blir brukte om att.';
  const render = F.Render.create($('canvas')), config = {skin:'gold',reduced:false};
  const world = F.Levels.create({level:'marmor',reading:4,seed:1});
  const fixture = {world, state:{time:0,x:0,segment:0,status:'running',player:F.Physics.player('cube')},activeChoice:() => null};
  let x = 0, running = true, last = performance.now(), frame;
  render.reset(config, fixture.state);
  $('play').addEventListener('click', () => { running = !running; $('play').textContent = running ? 'Pause rullinga' : 'Hald fram'; });
  $('camera').addEventListener('input', () => { x = Number($('camera').value); render.snap(fixture.state); });
  $('seam').addEventListener('click', () => {
    const image = F.Assets.get(['marmor','urverk','spegel','orgel'][Number($('scene').value)] + '.jpg');
    x = Math.round(image.width * 540 / Math.round(image.height * .8)) * 2 / .08 - 1500;
  });
  function loop(now) {
    if (running) x += Math.min(.05, (now - last) / 1000) * 500; last = now;
    fixture.state.x = x; fixture.state.time = x / 500; fixture.state.segment = Math.floor(fixture.state.time / world.duration);
    const scene = Number($('scene').value);
    const selectedWorld = {...world, at(time) { return {...world.at(time),scene}; }, segment(index) { return {...world.segment(index),scene}; }};
    render.draw({...fixture,world:selectedWorld},config);
    $('camera').value = Math.round(x); $('position').textContent = 'Kamera: ' + Math.round(x) + ' · fart: 500 · rasterflater: ' + scenery.cacheCount;
    frame = requestAnimationFrame(loop);
  }
  frame = requestAnimationFrame(loop);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
})().catch(error => { document.getElementById('checks').textContent = error.message; console.error(error); });
