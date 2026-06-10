/* icons.js — Lucide-stil inline SVG-ikon for Ordskodde. Aldri emoji.
   Ikona er statiske og trygge å bruke som innerHTML (ingen brukargenerert innhald). */
(function () {
  'use strict';

  const PATHS = {
    sparkles:  '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15Z"/>',
    download:  '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 19h16"/>',
    upload:    '<path d="M12 15V3"/><path d="M7 7l5-5 5 5"/><path d="M4 19h16"/>',
    save:      '<path d="M5 4h11l3 3v13H5V4Z"/><path d="M8 4v5h7V4"/><path d="M8 14h8v6H8v-6Z"/>',
    printer:   '<path d="M7 8V3h10v5"/><rect x="4" y="8" width="16" height="8" rx="1.5"/><path d="M7 13h10v8H7v-8Z" fill="var(--surface, #fff)"/><path d="M7 13h10v8H7v-8Z"/>',
    trash:     '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
    copy:      '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
    pencil:    '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z"/><path d="M14 6.5 17.5 10"/>',
    folder:    '<path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/>',
    heart:     '<path d="M12 20.5C7 16.5 3.5 13 3.5 9.3 3.5 6.4 5.7 4.5 8 4.5c1.7 0 3.2.9 4 2.3.8-1.4 2.3-2.3 4-2.3 2.3 0 4.5 1.9 4.5 4.8 0 3.7-3.5 7.2-8.5 11.2Z"/>',
    circle:    '<circle cx="12" cy="12" r="8.5"/>',
    square:    '<rect x="4" y="4" width="16" height="16" rx="1.5"/>',
    x:         '<path d="M6 6l12 12M18 6 6 18"/>',
    check:     '<path d="M5 12.5 10 17.5 19 6.5"/>',
    search:    '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    image:     '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-9 8"/>',
    fileJson:  '<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4"/><path d="M9 13c-1 0-1 .8-1 1.5S8 16 9 16M15 13c1 0 1 .8 1 1.5s0 1.5-1 1.5"/>',
    plus:      '<path d="M12 4v16M4 12h16"/>'
  };

  function svg(name, opts) {
    opts = opts || {};
    const size = opts.size || '1em';
    const stroke = opts.stroke != null ? opts.stroke : 2.2;
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

  function inject(rootEl) {
    (rootEl || document).querySelectorAll('[data-icon]').forEach(node => {
      if (node.querySelector('svg')) return;
      node.insertBefore(el(node.dataset.icon, { size: node.dataset.iconSize || '1.1em' }), node.firstChild);
    });
  }

  window.OrdskoddeIcons = { svg, el, inject, has: n => !!PATHS[n] };
})();
