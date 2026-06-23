/* ══════════════════════════════════════════════
   LANDKJENNING — Kartteikning (vanilla SVG)
   Byggjer omriss (eitt land) og verdskart med pin
   frå path-dataen i countries.json. Ingen bibliotek.
   ══════════════════════════════════════════════ */

const GeoMap = (function () {

  const SVGNS = 'http://www.w3.org/2000/svg';

  /**
   * Teikn eit einsleg landomriss, skalert til sin eigen bounding box.
   * @param {object} country - { path, bbox }
   * @returns {SVGElement}
   */
  function outline(country) {
    const [bx, by, bw, bh] = country.bbox;
    const pad = Math.max(bw, bh) * 0.12;
    const vb = `${bx - pad} ${by - pad} ${bw + pad * 2} ${bh + pad * 2}`;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', vb);
    svg.setAttribute('class', 'outline-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', country.path);
    path.setAttribute('class', 'outline-land');
    svg.appendChild(path);
    return svg;
  }

  /**
   * Teikn heile verdskartet. Kan halde fram eitt land og setje ein pin.
   * @param {object} opts - { highlight: iso2, pin: {x,y}, faint: bool }
   * @returns {SVGElement}
   */
  function world(opts = {}) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${GeoData.W} ${GeoData.H}`);
    svg.setAttribute('class', 'world-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const g = document.createElementNS(SVGNS, 'g');
    GeoData.countries.forEach(c => {
      if (!c.path) return;
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', c.path);
      let cls = 'wland';
      if (opts.highlight && c.iso2 === opts.highlight) cls += ' wland-hl';
      p.setAttribute('class', cls);
      g.appendChild(p);
    });
    svg.appendChild(g);

    if (opts.pin) {
      svg.appendChild(makePin(opts.pin.x, opts.pin.y));
    }
    return svg;
  }

  /** Pin-markør (dråpeform) i kart-koordinatar, konstant visuell storleik. */
  function makePin(x, y) {
    const grp = document.createElementNS(SVGNS, 'g');
    grp.setAttribute('class', 'map-pin');
    // Skala pinnen til kartrommet (viewBox er ~1000 breitt).
    grp.setAttribute('transform', `translate(${x} ${y}) scale(0.9)`);
    const drop = document.createElementNS(SVGNS, 'path');
    // Dråpe med spiss nedst i (0,0)
    drop.setAttribute('d', 'M0 0 C-7 -10 -10 -14 -10 -20 a10 10 0 1 1 20 0 C10 -14 7 -10 0 0 Z');
    drop.setAttribute('class', 'map-pin-body');
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', '0'); dot.setAttribute('cy', '-20'); dot.setAttribute('r', '4');
    dot.setAttribute('class', 'map-pin-dot');
    grp.appendChild(drop);
    grp.appendChild(dot);
    return grp;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /**
   * Verdskart med pin og zoom/pan. Startar litt innzooma mot pinnen så
   * det er lett å sjå kvar han peikar. Scroll/knappar zoomar, dra panorerer.
   * @param {object} opts - { pin: {x,y}, startW }
   * @returns {HTMLElement} innpakning med svg + kontrollar
   */
  function worldZoomable(opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'lk-map-wrap';
    const svg = world(opts);
    svg.classList.add('is-zoomable');
    wrap.appendChild(svg);

    const W = GeoData.W, H = GeoData.H;
    const pin = opts.pin || { x: W / 2, y: H / 2 };
    const pinEl = svg.querySelector('.map-pin');
    let vb = frame(pin, opts.startW || 460);
    apply();

    function frame(center, w) {
      w = clamp(w, 120, W);
      return clampVB({ x: center.x - w / 2, y: center.y - (w / 2) / 2, w, h: w / 2 });
    }
    function clampVB(v) {
      if (v.w > W) v.w = W;
      if (v.h > H) v.h = H;
      v.x = clamp(v.x, 0, W - v.w);
      v.y = clamp(v.y, 0, H - v.h);
      return v;
    }
    function apply() {
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      // Hald pinnen tilnærma konstant på skjermen uansett zoom.
      if (pinEl) pinEl.setAttribute('transform', `translate(${pin.x} ${pin.y}) scale(${(0.9 * vb.w / W).toFixed(3)})`);
    }
    function center() { return { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 }; }

    function zoomAt(factor, p) {
      const nw = clamp(vb.w * factor, 120, W);
      const nh = nw / 2;
      const rx = (p.x - vb.x) / vb.w, ry = (p.y - vb.y) / vb.h;
      vb = clampVB({ x: p.x - rx * nw, y: p.y - ry * nh, w: nw, h: nh });
      apply();
    }
    function toSvg(ev) {
      const r = svg.getBoundingClientRect();
      return { x: vb.x + ((ev.clientX - r.left) / r.width) * vb.w,
               y: vb.y + ((ev.clientY - r.top) / r.height) * vb.h };
    }

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1.2 : 0.83, toSvg(e));
    }, { passive: false });

    let drag = null;
    svg.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, vbx: vb.x, vby: vb.y, moved: false };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('grabbing');
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = svg.getBoundingClientRect();
      const dx = (e.clientX - drag.x) / r.width * vb.w;
      const dy = (e.clientY - drag.y) / r.height * vb.h;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3) drag.moved = true;
      vb.x = drag.vbx - dx; vb.y = drag.vby - dy; clampVB(vb); apply();
    });
    const endDrag = () => { drag = null; svg.classList.remove('grabbing'); };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('pointerleave', endDrag);

    const ctrls = document.createElement('div');
    ctrls.className = 'lk-map-ctrls';
    const mk = (ico, fn, lbl) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lk-map-btn'; b.title = lbl;
      b.setAttribute('aria-label', lbl);
      b.innerHTML = ICON(ico, 18);
      b.addEventListener('click', ev => { ev.stopPropagation(); fn(); });
      return b;
    };
    ctrls.appendChild(mk('plus', () => zoomAt(0.7, center()), 'Zoom inn'));
    ctrls.appendChild(mk('minus', () => zoomAt(1.43, center()), 'Zoom ut'));
    ctrls.appendChild(mk('crosshair', () => { vb = frame(pin, opts.startW || 460); apply(); }, 'Sentrer på pinnen'));
    wrap.appendChild(ctrls);

    return wrap;
  }

  /** Pin-posisjon for eit land: bruk det førehandsrekna punktet inne i
   *  geometrien (treff alltid landmassa), elles koordinat, elles bbox-senter. */
  function pinFor(country) {
    if (country.pin && country.pin.length === 2) {
      return { x: country.pin[0], y: country.pin[1] };
    }
    if (country.latlng && country.latlng.length === 2) {
      return GeoData.project(country.latlng[1], country.latlng[0]);
    }
    const [bx, by, bw, bh] = country.bbox;
    return { x: bx + bw / 2, y: by + bh / 2 };
  }

  return { outline, world, worldZoomable, pinFor };
})();

if (typeof window !== 'undefined') window.GeoMap = GeoMap;
