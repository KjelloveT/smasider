// Heimsank — lokal kategoriidentitet, tidsstyring og tilgjengelege dialogar.
const HeimsankUI = (function () {
  const categories = {
    land: ['#92DFD0', 'globe'], byar: ['#A9C8FA', 'building'],
    forskere: ['#C8B4F3', 'microscope'], matrett: ['#FFB8A8', 'sparkles'],
    grunnstoff: ['#BCE8BC', 'sparkles'], videospill: ['#F3B0D5', 'sparkles'],
    fly: ['#ACE1F5', 'plane'], kunst: ['#F9D0AD', 'palette'], hest: ['#E7D3AB', 'rabbit']
  };
  const timers = new Set();
  const dialogs = [];
  function category(el, id) {
    el.dataset.category = id;
    el.style.setProperty('--cat-color', (categories[id] || categories.land)[0]);
  }
  function icon(name, size = 20) {
    const span = Vy.el('span');
    span.innerHTML = ICON(name, size);
    return span;
  }
  function later(fn, delay) {
    const timer = setTimeout(() => { timers.delete(timer); fn(); }, delay);
    timers.add(timer);
    return timer;
  }
  function cancelTimers() { timers.forEach(clearTimeout); timers.clear(); }
  function focusables(el) {
    return [...el.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')]
      .filter(node => node.getClientRects().length && !node.closest('[inert]'));
  }
  function syncDialogs() {
    const top = dialogs[dialogs.length - 1];
    document.querySelector('.page-wrapper').inert = !!top;
    document.querySelector('neo-header').inert = !!top;
    document.body.style.overflow = top ? 'hidden' : '';
    dialogs.forEach((item, index) => {
      item.el.inert = item !== top;
      item.el.style.zIndex = String(1100 + index);
    });
  }
  function open(id, onClose) {
    const el = document.getElementById(id);
    if (dialogs.some(item => item.el === el)) return;
    dialogs.push({ el, onClose, previous: document.activeElement });
    Vy.openModal(el);
    syncDialogs();
    (focusables(el)[0] || el).focus();
  }
  function close(id) {
    const index = dialogs.findIndex(item => item.el.id === id);
    if (index < 0) return;
    const item = dialogs[index];
    dialogs.splice(index, 1);
    Vy.closeModal(item.el);
    item.el.inert = false;
    syncDialogs();
    if (item.previous?.isConnected && !item.previous.closest('[inert]')) item.previous.focus();
  }
  function dismiss() {
    const top = dialogs[dialogs.length - 1];
    if (!top) return;
    if (top.onClose) top.onClose(); else close(top.el.id);
  }
  document.addEventListener('keydown', event => {
    const top = dialogs[dialogs.length - 1];
    if (!top) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); dismiss();
    } else if (event.key === 'Tab') {
      const items = focusables(top.el);
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !top.el.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !top.el.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  }, true);
  document.addEventListener('click', event => {
    const top = dialogs[dialogs.length - 1];
    if (top && event.target === top.el) dismiss();
  });
  return { category, icon, later, cancelTimers, open, close,
    reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    categoryIcon: id => (categories[id] || categories.land)[1] };
})();
