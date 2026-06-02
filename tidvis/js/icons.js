/* icons.js — Lucide-stil inline SVG-ikon for Tidvis. Aldri emoji.
   Port frå designet sin icons.jsx. Ikona er statiske og trygge å
   bruke som innerHTML (ingen brukargenerert innhald). */
(function () {
  'use strict';

  const PATHS = {
    play:      '<polygon points="6 4 20 12 6 20 6 4"/>',
    target:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    link:      '<path d="M9 12h6"/><path d="M9.5 7H7a5 5 0 0 0 0 10h2.5"/><path d="M14.5 7H17a5 5 0 0 1 0 10h-2.5"/>',
    zap:       '<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/>',
    arrowRight:'<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
    arrowSwap: '<path d="M5 8h12l-3-3"/><path d="M19 16H7l3 3"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    hand:      '<circle cx="12" cy="12" r="9"/><path d="M12 12V7"/><path d="M12 12l4 2.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    text:      '<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h9"/>',
    digital:   '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 10v4M12 10v4M16 10v4"/>',
    star:      '<polygon points="12 3 14.6 9 21 9.5 16 13.8 17.6 20 12 16.4 6.4 20 8 13.8 3 9.5 9.4 9 12 3"/>',
    flame:     '<path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.4.6-2.4 1.3-3.2C9 9.5 10.5 8 12 3Z"/>',
    trophy:    '<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/><path d="M9 14.5V17h6v-2.5M8 21h8M10 17v4M14 17v4"/>',
    lock:      '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check:     '<path d="M5 12.5 10 17.5 19 6.5"/>',
    x:         '<path d="M6 6l12 12M18 6 6 18"/>',
    sun:       '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
    moon:      '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/>',
    medal:     '<circle cx="12" cy="9" r="5.5"/><path d="M9 13.5 7 21l5-2.5L17 21l-2-7.5"/>',
    sparkle:   '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
    rocket:    '<path d="M12 3c3 1 5 4 5 8l-3 3-4 0-3-3c0-4 2-7 5-8Z"/><path d="M9 14l-3 1 1 4 4-2M15 14l3 1-1 4-4-2"/><circle cx="12" cy="9" r="1.4"/>',
    grid:      '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    refresh:   '<path d="M4 12a8 8 0 0 1 13.5-5.8L20 8M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.5 5.8L4 16M4 20v-4h4"/>',
    home:      '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>',
    chevR:     '<path d="M9 6l6 6-6 6"/>',
    drag:      '<circle cx="9" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1.5" fill="currentColor" stroke="none"/>',
    bolt:      '<path d="M12 2 4 14h6l-1 8 9-12h-6l0-8Z"/>',
    crown:     '<path d="M4 8l4 4 4-6 4 6 4-4-2 11H6L4 8Z"/>',
    owl:       '<circle cx="9" cy="10" r="3"/><circle cx="15" cy="10" r="3"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="M12 13v3M7 5l2 2M17 5l-2 2"/>',
    volume:    '<path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="M17 9a3 3 0 0 1 0 6"/>',
    plus:      '<path d="M12 4v16M4 12h16"/>',
    minus:     '<path d="M4 12h16"/>'
  };

  function svg(name, opts) {
    opts = opts || {};
    const size = opts.size || '1em';
    const stroke = opts.stroke != null ? opts.stroke : 2.4;
    const fill = opts.fill || 'none';
    const inner = PATHS[name] || '';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" ' +
      'fill="' + fill + '" stroke="currentColor" stroke-width="' + stroke + '" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  }

  function el(name, opts) {
    const span = document.createElement('span');
    span.style.display = 'inline-flex';
    span.innerHTML = svg(name, opts);
    return span.firstChild;
  }

  window.TidvisIcons = { svg: svg, el: el, has: function (n) { return !!PATHS[n]; } };
})();
