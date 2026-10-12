(function (root) {
  'use strict';
  function create(target, restart, pause) {
    const sources = new Set();
    let edge = false, enabled = false;
    function down(source) { if (!sources.has(source)) { sources.add(source); edge = true; } }
    function up(source) { sources.delete(source); }
    const controlKeys = new Set(['Space', 'ArrowUp', 'KeyW']);
    document.addEventListener('keydown', event => {
      if (!enabled || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if (controlKeys.has(event.code)) { event.preventDefault(); if (!event.repeat) down(event.code); }
      if (event.code === 'KeyR' && !event.repeat) { event.preventDefault(); restart(); }
      if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) pause();
    });
    document.addEventListener('keyup', event => { if (controlKeys.has(event.code)) { up(event.code); if (enabled) event.preventDefault(); } });
    target.addEventListener('pointerdown', event => {
      if (!enabled || event.button !== 0) return;
      event.preventDefault(); target.setPointerCapture(event.pointerId); down('pointer-' + event.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => target.addEventListener(type, event => up('pointer-' + event.pointerId)));
    window.addEventListener('blur', clear);
    function clear() { sources.clear(); edge = false; }
    return { read() { const result = { held: sources.size > 0, pressed: edge }; edge = false; return result; }, clear, discardPress() { edge = false; },
      enable(value) { enabled = value; clear(); }, get held() { return sources.size > 0; } };
  }
  root.Fykefuga.Input = { create };
})(window);
