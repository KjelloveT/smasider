(function (root) {
  'use strict';
  const O = root.Ordbas, el = root.Vy.el;
  const timers = new Set(), overlays = new Set();
  let reactionId = 0;
  function reduced() { return root.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function clear() { const gain = document.getElementById('scoreGain'); if(gain) gain.textContent = ''; reactionId++; timers.forEach(clearTimeout); timers.clear(); overlays.forEach(node => node.remove()); overlays.clear(); }
  function later(callback, delay) { const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay); timers.add(timer); }
  function react(kind) {
    const companion = document.getElementById('companion'), id = ++reactionId;
    companion.dataset.reaction = kind;
    companion.classList.remove('ob-react');
    if (!reduced()) { void companion.offsetWidth; companion.classList.add('ob-react'); }
    later(() => { if(id !== reactionId) return; companion.classList.remove('ob-react'); companion.dataset.reaction = 'hint'; }, reduced() ? 0 : 1300);
  }
  function points(value) {
    if (!value) return;
    const score = document.getElementById('scoreValue');
    score.classList.remove('ob-pop');
    if (!reduced()) { void score.offsetWidth; score.classList.add('ob-pop'); }
    const gain = document.getElementById('scoreGain'); gain.textContent = '+' + value;
    later(() => { gain.textContent = ''; }, 1600);
  }
  function delivery(wordClass, text, from) {
    if (reduced()) return;
    const target = document.querySelector('#bins button[data-class="' + wordClass + '"] .ob-cavity');
    if (!target || !from) return;
    const to = target.getBoundingClientRect();
    const token = el('span', 'vp-panel vp-panel--compact ob-flying-card', text);
    token.setAttribute('aria-hidden', 'true'); token.style.left = from.left + 'px'; token.style.top = from.top + 'px';
    document.body.append(token); overlays.add(token);
    const flying = token.getBoundingClientRect();
    const animation = token.animate([{transform:'translate(0,0) rotate(-4deg)',opacity:1},{transform:`translate(${to.left + to.width / 2 - from.left - flying.width / 2}px,${to.bottom - from.top - flying.height}px) rotate(8deg) scale(.55)`,opacity:0}], {duration:650,easing:'cubic-bezier(.3,.7,.3,1)'});
    animation.finished.catch(() => {}).finally(() => { token.remove(); overlays.delete(token); });
  }
  O.Effects = { clear, react, points, delivery };
})(window);
