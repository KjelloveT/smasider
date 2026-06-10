/* render.js — teikning og eksport for Ordskodde.
   Canvas-førehandsvising, PNG-eksport (kvit/gjennomsiktig), SVG-generering og
   utskrift byggjer alle på det same utleggings-resultatet frå layout.js. */
(function (root) {
  'use strict';

  function fontStackFor(settings) {
    return OrdskoddeThemes.getFont(settings.fontId).stack;
  }

  function wordColor(settings, p) {
    return settings.colors[p.colorIdx % settings.colors.length];
  }

  /** Teiknar utlegget på ein 2d-kontekst i layout-koordinatar (skaler før kall). */
  function drawWords(ctx, layout, settings) {
    const stack = fontStackFor(settings);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of layout.placed) {
      ctx.fillStyle = wordColor(settings, p);
      ctx.font = '700 ' + p.fontSize + 'px ' + stack;
      if (p.rotated) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(p.word, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(p.word, p.x, p.y);
      }
    }
  }

  function paint(canvas, layout, settings, scale, withBackground) {
    canvas.width = layout.width * scale;
    canvas.height = layout.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    if (withBackground) {
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    drawWords(ctx, layout, settings);
    ctx.restore();
  }

  /** Førehandsvising — intern oppløysing = layoutstorleik, CSS skalerer ned. */
  function drawPreview(canvas, layout, settings) {
    paint(canvas, layout, settings, 1, !settings.transparentBg);
  }

  function slugify(title) {
    const s = String(title || '').toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'ordsky';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /** PNG i 2× layoutstorleik. transparent=true droppar bakgrunnen. */
  function exportPNG(layout, settings, opts) {
    opts = opts || {};
    const canvas = document.createElement('canvas');
    paint(canvas, layout, settings, 2, !opts.transparent);
    canvas.toBlob(blob => {
      if (blob) downloadBlob(blob, 'ordskodde-' + slugify(opts.title) + '.png');
    }, 'image/png');
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /** SVG frå same utleggings-resultat. NB: andre fontmiljø kan gje litt andre
      metrikkar enn canvas-målinga — akseptabelt avvik i v1. */
  function buildSVG(layout, settings) {
    const stack = fontStackFor(settings);
    const parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      layout.width + ' ' + layout.height + '" width="' + layout.width +
      '" height="' + layout.height + '">');
    if (!settings.transparentBg) {
      parts.push('<rect width="' + layout.width + '" height="' + layout.height +
        '" fill="' + escapeXml(settings.background) + '"/>');
    }
    for (const p of layout.placed) {
      const transform = p.rotated
        ? ' transform="rotate(90 ' + Math.round(p.x) + ' ' + Math.round(p.y) + ')"'
        : '';
      parts.push('<text x="' + Math.round(p.x) + '" y="' + Math.round(p.y) +
        '" font-size="' + p.fontSize + '" font-weight="700" font-family="' +
        escapeXml(stack) + '" fill="' + escapeXml(wordColor(settings, p)) +
        '" text-anchor="middle" dominant-baseline="central"' + transform + '>' +
        escapeXml(p.word) + '</text>');
    }
    parts.push('</svg>');
    return parts.join('\n');
  }

  function exportSVG(layout, settings, title) {
    const blob = new Blob([buildSVG(layout, settings)], { type: 'image/svg+xml' });
    downloadBlob(blob, 'ordskodde-' + slugify(title) + '.svg');
  }

  /** Utskrift: legg PNG-dataURL i print-containeren og kall window.print()
      (meir robust på tvers av nettlesarar enn å skrive ut canvas direkte). */
  function printCloud(layout, settings) {
    const canvas = document.createElement('canvas');
    paint(canvas, layout, settings, 2, !settings.transparentBg);
    const img = document.getElementById('printImg');
    if (!img) return;
    img.onload = () => {
      window.print();
      img.onload = null;
    };
    img.src = canvas.toDataURL('image/png');
  }

  root.OrdskoddeRender = { drawPreview, exportPNG, exportSVG, buildSVG, printCloud, downloadBlob, slugify };
})(window);
