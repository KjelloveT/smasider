/* Myntkjøp og korte tilbakemeldingar. Spelet ventar aldri på ein animasjon. */
window.OrdvettEffects = (function () {
  'use strict';
  let counterFrame;
  const moving = new Set();
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function coin() {
    const node = Vy.el('span', 'ov-coin');
    node.setAttribute('aria-hidden', 'true');
    ['front', 'back'].forEach(face => {
      const image = Vy.el('img', 'ov-coin-face ov-coin-face--' + face);
      image.src = 'assets/coin-' + face + '.png'; image.alt = ''; node.append(image);
    });
    return node;
  }
  function pulse(node) {
    if (!reduced() && node?.animate) node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: .4 }, { transform: 'scale(1)' }], { duration: 380 });
  }
  function spend(origin, price, before, after, source) {
    const wallet = document.getElementById('coinCounter');
    const total = document.getElementById('totalCost');
    cancelAnimationFrame(counterFrame);
    if (reduced() || !origin || !wallet.animate) { total.textContent = String(OrdvettGame.BUDGET - after); return; }
    const target = source || wallet.getBoundingClientRect();
    const destination = { x: origin.left + origin.width / 2, y: origin.top + origin.height / 2 };
    for (let i = 0; i < price; i++) {
      const node = coin(); node.classList.add('ov-flying-coin');
      const x = target.left + target.width / 2, y = target.top + target.height / 2;
      node.style.left = `${x - 14}px`; node.style.top = `${y - 14}px`;
      document.body.append(node);
      const dx = destination.x - x, dy = destination.y - y;
      node.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * .45}px,${dy * .45 - 70}px) rotate(160deg) scale(1.2)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px,${dy}px) rotate(360deg) scale(.5)`, opacity: 0 }
      ], { duration: 620, delay: i * 55, easing: 'ease-in-out', fill: 'backwards' }).finished.then(() => node.remove()).catch(() => node.remove());
    }
    const start = performance.now();
    total.textContent = String(OrdvettGame.BUDGET - before);
    function count(now) {
      const progress = Math.min(1, (now - start) / 650);
      total.textContent = String(OrdvettGame.BUDGET - Math.round(before + (after - before) * progress));
      if (progress < 1) counterFrame = requestAnimationFrame(count);
    }
    counterFrame = requestAnimationFrame(count);
    pulse(wallet);
  }
  function clear() {
    cancelAnimationFrame(counterFrame);
    document.querySelectorAll('.ov-flying-coin').forEach(node => node.remove());
    moving.forEach(animation => animation.cancel()); moving.clear();
  }
  function moveHint(origin, target) {
    if (!origin || !target || reduced() || !target.animate) return;
    const end = target.getBoundingClientRect();
    if (!end.width || !end.height) return;
    const scaleX = origin.width / end.width, scaleY = origin.height / end.height;
    target.classList.add('ov-receipt--moving');
    const animation = target.animate([
      { transform: `translate(${origin.left - end.left}px,${origin.top - end.top}px) scale(${scaleX},${scaleY})`, opacity: .7 },
      { transform: 'none', opacity: 1 }
    ], { duration: 560, easing: 'cubic-bezier(.2,.75,.2,1)' });
    moving.add(animation);
    animation.finished.catch(() => {}).finally(() => { moving.delete(animation); target.classList.remove('ov-receipt--moving'); });
  }
  return Object.freeze({ coin, spend, pulse, moveHint, clear });
})();
