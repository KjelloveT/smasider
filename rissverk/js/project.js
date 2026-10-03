/* ══════════════════════════════════════════════
   PROJECT.JS — Prosjektfil og autolagring

   Prosjektfila er heile modellen, med {app, version} øvst slik
   retningslinjene krev. Ho ber MEIR enn SVG-fila: lagnamn, låste lag,
   skjulte lag og teikneflata sin storleik. Ei SVG-fil er resultatet,
   prosjektfila er arbeidet.

   Autolagringa går til VyrdepilStorage og er meint som ei tryggleiksline,
   ikkje som arkivet. Ho har ei hard grense: localStorage tek berre nokre
   få megabyte til saman for HEILE Vyrdepil, og ei teikning som veks forbi
   grensa skal ikkje få lov til å skuve ut andre spel sine data. Går ho
   over, sluttar vi å lagre og seier tydeleg frå — det er ærlegare enn å
   feile stille og la brukaren tru arbeidet er trygt.
   ══════════════════════════════════════════════ */
window.RV = window.RV || {};

RV.project = (function () {
  'use strict';

  const APP = 'rissverk';
  const VERSION = 1;
  const EXT = '.rissverk';

  const AUTOSAVE_LIMIT = 1500000;   // teikn — om lag 1,5 MB serialisert
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_NODES = 10000;
  const MAX_POINTS = 100000;
  const MAX_DEPTH = 64;
  const MAX_SYMBOL_DEPTH = 32;
  const AUTOSAVE_DELAY = 1200;      // ms etter siste endring
  const NODE_TYPES = new Set(['rect', 'ellipse', 'line', 'poly', 'path', 'group', 'text', 'image', 'use']);
  const PAINT_TYPES = new Set(['none', 'solid', 'gradient']);
  const COLORS = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  const ID_PATTERNS = { n: /^n[0-9a-z]{1,12}$/, g: /^g[0-9a-z]{1,12}$/, s: /^s[0-9a-z]{1,12}$/ };

  let autosaveBlocked = false;

  /* ──────────────── Ut og inn ──────────────── */

  function payload() {
    const d = RV.state.data;
    return {
      app: APP,
      version: VERSION,
      title: d.title,
      doc: d.doc,
      nodes: d.nodes,
      root: d.root,
      children: d.children,
      defs: d.defs
    };
  }

  function save(filename) {
    const text = JSON.stringify(payload(), null, 1);
    const blob = new Blob([text], { type: 'application/json' });
    RV.util.downloadBlob(blob, RV.util.slug(filename, 'teikning') + EXT);
  }

  function isRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || (Object.prototype.toString.call(value) === '[object Object]' && Object.getPrototypeOf(prototype) === null);
  }

  function onlyKeys(value, allowed) {
    return Object.keys(value).every((key) => allowed.has(key));
  }

  function finite(value, min, max) {
    return Number.isFinite(value) && value >= min && value <= max;
  }

  function validId(value, prefix) {
    return typeof value === 'string' && ID_PATTERNS[prefix].test(value);
  }

  function validPaint(paint, gradients, stroke) {
    if (!isRecord(paint) || !PAINT_TYPES.has(paint.type)) return false;
    const allowed = new Set(['type', 'color', 'opacity', 'id']);
    if (stroke) ['width', 'dash', 'cap', 'join'].forEach(key => allowed.add(key));
    if (!onlyKeys(paint, allowed)) return false;
    if (paint.opacity !== undefined && !finite(paint.opacity, 0, 1)) return false;
    if (paint.type === 'none') return Object.keys(paint).every(key => key === 'type');
    if (paint.type === 'solid') {
      if (typeof paint.color !== 'string' || !COLORS.test(paint.color)) return false;
    } else if (!validId(paint.id, 'g') || !Object.prototype.hasOwnProperty.call(gradients, paint.id)) {
      return false;
    }
    if (stroke && paint.width !== undefined && !finite(paint.width, 0, 100000)) return false;
    if (stroke && paint.dash !== undefined && (typeof paint.dash !== 'string' || paint.dash.length > 128)) return false;
    if (stroke && paint.cap !== undefined && !['butt', 'round', 'square'].includes(paint.cap)) return false;
    if (stroke && paint.join !== undefined && !['miter', 'round', 'bevel'].includes(paint.join)) return false;
    return true;
  }

  function validPath(geom, budget) {
    if (!Array.isArray(geom.subpaths)) return false;
    for (const subpath of geom.subpaths) {
      if (!isRecord(subpath) || !onlyKeys(subpath, new Set(['closed', 'points'])) ||
          typeof subpath.closed !== 'boolean' || !Array.isArray(subpath.points)) return false;
      budget.points += subpath.points.length;
      if (budget.points > MAX_POINTS) return false;
      for (const point of subpath.points) {
        if (!isRecord(point) || !onlyKeys(point, new Set(['x', 'y', 'ix', 'iy', 'ox', 'oy', 'type'])) ||
            !['corner', 'smooth'].includes(point.type) ||
            !['x', 'y', 'ix', 'iy', 'ox', 'oy'].every(key => finite(point[key], -1e9, 1e9))) return false;
      }
    }
    return true;
  }

  function validGeometry(node, symbols, budget) {
    const g = node.geom;
    if (!isRecord(g)) return false;
    const numbers = (keys) => keys.every(key => finite(g[key], -1e9, 1e9));
    switch (node.type) {
      case 'rect':
        return onlyKeys(g, new Set(['x', 'y', 'w', 'h', 'rx', 'ry'])) && numbers(['x', 'y', 'w', 'h']) &&
          ['rx', 'ry'].every(key => g[key] === undefined || finite(g[key], 0, 1e9));
      case 'ellipse':
        return onlyKeys(g, new Set(['cx', 'cy', 'rx', 'ry'])) && numbers(['cx', 'cy', 'rx', 'ry']);
      case 'line':
        return onlyKeys(g, new Set(['x1', 'y1', 'x2', 'y2', 'from', 'to'])) && numbers(['x1', 'y1', 'x2', 'y2']) &&
          ((g.from === undefined && g.to === undefined) || (validId(g.from, 'n') && validId(g.to, 'n')));
      case 'poly':
        return onlyKeys(g, new Set(['cx', 'cy', 'r1', 'r2', 'sides', 'star', 'rotation'])) &&
          numbers(['cx', 'cy', 'r1', 'r2', 'rotation']) && Number.isInteger(g.sides) && g.sides >= 3 && g.sides <= 60 &&
          typeof g.star === 'boolean' && g.r1 >= 0 && g.r2 >= 0;
      case 'path':
        return onlyKeys(g, new Set(['subpaths'])) && validPath(g, budget);
      case 'group':
        return onlyKeys(g, new Set());
      case 'text':
        return onlyKeys(g, new Set(['x', 'y', 'text', 'font', 'size', 'weight', 'italic', 'align', 'lineHeight'])) &&
          numbers(['x', 'y', 'size', 'weight', 'lineHeight']) && g.size >= 4 && g.size <= 800 &&
          g.weight >= 100 && g.weight <= 1000 && g.lineHeight >= 0.6 && g.lineHeight <= 4 &&
          typeof g.text === 'string' && g.text.length <= 10000 &&
          ['sans', 'serif', 'mono', 'round', 'heavy', 'narrow'].includes(g.font) &&
          ['start', 'middle', 'end'].includes(g.align) && typeof g.italic === 'boolean';
      case 'image':
        return onlyKeys(g, new Set(['x', 'y', 'w', 'h', 'href'])) && numbers(['x', 'y', 'w', 'h']) &&
          typeof g.href === 'string' && g.href.length <= MAX_FILE_BYTES &&
          /^data:image\/(?:png|jpeg|webp|gif|bmp|avif);base64,[a-z0-9+/]*={0,2}$/i.test(g.href);
      case 'use':
        return onlyKeys(g, new Set(['symbol'])) && validId(g.symbol, 's') && Object.prototype.hasOwnProperty.call(symbols, g.symbol);
      default:
        return false;
    }
  }

  function validNode(node, id, symbols, gradients, budget, allowClip) {
    const allowed = new Set(['id', 'type', 'name', 'parent', 'visible', 'locked', 'opacity', 'transform', 'fill', 'stroke', 'geom', 'clip', 'reference']);
    if (!isRecord(node) || !onlyKeys(node, allowed) || !validId(id, 'n') || node.id !== id ||
        !NODE_TYPES.has(node.type) || typeof node.name !== 'string' || node.name.length > 200 ||
        (node.parent !== null && !validId(node.parent, 'n')) || typeof node.visible !== 'boolean' ||
        typeof node.locked !== 'boolean' || !finite(node.opacity, 0, 1) ||
        !Array.isArray(node.transform) || node.transform.length !== 6 ||
        !node.transform.every(value => finite(value, -1e9, 1e9)) ||
        !validPaint(node.fill, gradients, false) || !validPaint(node.stroke, gradients, true) ||
        !validGeometry(node, symbols, budget)) return false;
    if (node.reference !== undefined && typeof node.reference !== 'boolean') return false;
    if (node.clip !== undefined) {
      if (!allowClip || !isRecord(node.clip) || ['group', 'image'].includes(node.clip.type)) return false;
      budget.nodes += 1;
      if (budget.nodes > MAX_NODES || !validNode(node.clip, node.clip.id, symbols, gradients, budget, false)) return false;
    }
    if (node.fill.type === 'gradient' && !Object.prototype.hasOwnProperty.call(gradients, node.fill.id)) return false;
    if (node.stroke.type === 'gradient' && !Object.prototype.hasOwnProperty.call(gradients, node.stroke.id)) return false;
    return true;
  }

  function validateTree(tree, symbols, gradients, budget) {
    if (!isRecord(tree) || !isRecord(tree.nodes) || !Array.isArray(tree.root) || !isRecord(tree.children)) return null;
    const ids = Object.keys(tree.nodes);
    if (budget.nodes + ids.length > MAX_NODES) return null;
    const uses = [];
    for (const id of ids) {
      const node = tree.nodes[id];
      budget.nodes += 1;
      if (!validNode(node, id, symbols, gradients, budget, true)) return null;
      if (node.type === 'use') uses.push(node.geom.symbol);
    }

    const placed = new Set();
    const place = (id, parentId) => {
      if (!validId(id, 'n') || !Object.prototype.hasOwnProperty.call(tree.nodes, id) || placed.has(id) ||
          tree.nodes[id].parent !== parentId) return false;
      placed.add(id);
      return true;
    };
    for (const id of tree.root) if (!place(id, null)) return null;
    for (const parentId of Object.keys(tree.children)) {
      if (!validId(parentId, 'n') || !Object.prototype.hasOwnProperty.call(tree.nodes, parentId) ||
          tree.nodes[parentId].type !== 'group' || !Array.isArray(tree.children[parentId])) return null;
      for (const childId of tree.children[parentId]) if (!place(childId, parentId)) return null;
    }
    if (placed.size !== ids.length) return null;

    const visited = new Set();
    const active = new Set();
    const stack = [];
    for (let i = tree.root.length - 1; i >= 0; i--) stack.push({ id: tree.root[i], depth: 1, exit: false });
    while (stack.length) {
      const current = stack.pop();
      if (current.exit) { active.delete(current.id); continue; }
      if (current.depth > MAX_DEPTH || active.has(current.id) || visited.has(current.id)) return null;
      visited.add(current.id);
      active.add(current.id);
      stack.push({ id: current.id, depth: current.depth, exit: true });
      const children = tree.children[current.id] || [];
      for (let i = children.length - 1; i >= 0; i--) stack.push({ id: children[i], depth: current.depth + 1, exit: false });
    }
    return visited.size === ids.length ? uses : null;
  }

  function validateProject(obj) {
    if (!isRecord(obj)) return 'Fila er ikkje ei gyldig prosjektfil.';
    if (obj.app !== APP) {
      return 'Denne fila høyrer til ' + (obj.app ? '«' + obj.app + '»' : 'eit anna verktøy') + ', ikkje til Rissverk.';
    }
    if (!Number.isInteger(obj.version) || obj.version < 1) return 'Fila manglar eit gyldig versjonsnummer.';
    if (obj.version > VERSION) {
      return 'Fila er laga med ein nyare versjon av Rissverk (versjon ' + obj.version + '). Oppdater sida og prøv på nytt.';
    }
    if (obj.version !== VERSION || !onlyKeys(obj, new Set(['app', 'version', 'title', 'doc', 'nodes', 'root', 'children', 'defs']))) {
      return 'Prosjektfila har eit format denne utgåva ikkje støttar.';
    }
    if (typeof obj.title !== 'string' || obj.title.length > 512 || !isRecord(obj.doc) ||
        !onlyKeys(obj.doc, new Set(['width', 'height', 'bg'])) ||
        !finite(obj.doc.width, 16, 8000) || !finite(obj.doc.height, 16, 8000) ||
        (obj.doc.bg !== null && (typeof obj.doc.bg !== 'string' || !COLORS.test(obj.doc.bg)))) {
      return 'Prosjektfila har ugyldige mål eller dokumentinnstillingar.';
    }

    const defs = obj.defs;
    if (!isRecord(defs) || !onlyKeys(defs, new Set(['gradients', 'symbols'])) ||
        !isRecord(defs.gradients) || !isRecord(defs.symbols)) return 'Prosjektfila manglar gyldige ressursar.';
    const gradientIds = Object.keys(defs.gradients);
    const symbolIds = Object.keys(defs.symbols);
    if (gradientIds.length > 5000 || symbolIds.length > 1000) return 'Prosjektfila har for mange ressursar.';
    for (const id of gradientIds) {
      const gradient = defs.gradients[id];
      if (!validId(id, 'g') || !isRecord(gradient) ||
          !onlyKeys(gradient, new Set(['kind', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'stops'])) ||
          !['linear', 'radial'].includes(gradient.kind) || !Array.isArray(gradient.stops) ||
          gradient.stops.length < 2 || gradient.stops.length > 64) return 'Prosjektfila har ein ugyldig fargeovergang.';
      const coordinates = gradient.kind === 'linear' ? ['x1', 'y1', 'x2', 'y2'] : ['cx', 'cy', 'r'];
      if (!coordinates.every(key => finite(gradient[key], -1e9, 1e9)) ||
          gradient.stops.some(stop => !isRecord(stop) || !onlyKeys(stop, new Set(['offset', 'color', 'opacity'])) ||
            !finite(stop.offset, 0, 1) || typeof stop.color !== 'string' || !COLORS.test(stop.color) ||
            !finite(stop.opacity, 0, 1))) return 'Prosjektfila har eit ugyldig fargeovergangsstopp.';
      if (gradient.kind === 'radial' && gradient.r < 0) return 'Prosjektfila har ein ugyldig radius i fargeovergangen.';
    }

    const budget = { nodes: 0, points: 0 };
    const dependencies = new Map();
    for (const id of symbolIds) {
      if (!validId(id, 's')) return 'Prosjektfila har ein ugyldig symbol-ID.';
      const symbol = defs.symbols[id];
      if (!isRecord(symbol) || !onlyKeys(symbol, new Set(['name', 'nodes', 'root', 'children', 'w', 'h'])) ||
          typeof symbol.name !== 'string' || symbol.name.length > 200 ||
          !finite(symbol.w, 0, 1e9) || !finite(symbol.h, 0, 1e9)) return 'Prosjektfila har eit ugyldig symbol.';
      const uses = validateTree(symbol, defs.symbols, defs.gradients, budget);
      if (!uses) return 'Prosjektfila har ei ugyldig eller sirkulær symbolform.';
      dependencies.set(id, uses);
    }
    const mainUses = validateTree(obj, defs.symbols, defs.gradients, budget);
    if (!mainUses) return 'Teikninga har ugyldige noder, referansar eller ei sløyfe.';

    const done = new Set();
    const active = new Set();
    for (const start of symbolIds) {
      const stack = [{ id: start, depth: 1, exit: false }];
      while (stack.length) {
        const current = stack.pop();
        if (current.exit) { active.delete(current.id); done.add(current.id); continue; }
        if (current.depth > MAX_SYMBOL_DEPTH || active.has(current.id)) return 'Symbola viser til kvarandre i ei sløyfe eller for djupt.';
        if (done.has(current.id)) continue;
        active.add(current.id);
        stack.push({ id: current.id, depth: current.depth, exit: true });
        const uses = dependencies.get(current.id) || [];
        for (let i = uses.length - 1; i >= 0; i--) stack.push({ id: uses[i], depth: current.depth + 1, exit: false });
      }
    }
    return null;
  }

  /** Kontrollerer heile prosjektet før arbeidsdokumentet kan bli bytt ut. */
  function validate(obj) {
    try { return validateProject(obj); }
    catch (error) { return 'Prosjektfila har ugyldige eller for omfattande data.'; }
  }

  /** @returns {string|null} feilmelding, eller null når fila blei opna */
  function load(obj) {
    const error = validate(obj);
    if (error) return error;

    RV.state.load(obj);
    RV.render.invalidate();
    RV.hit.invalidate();
    RV.state.emit('load');
    return null;
  }

  function openFile(file) {
    if (!file || (Number.isFinite(file.size) && file.size > MAX_FILE_BYTES)) {
      return Promise.resolve('Prosjektfila er for stor. Grensa er 8 MB.');
    }
    return file.text().then((text) => {
      if (typeof text !== 'string' || text.length > MAX_FILE_BYTES) return 'Prosjektfila er for stor. Grensa er 8 MB.';
      let obj;
      try {
        obj = JSON.parse(text);
      } catch (e) {
        return 'Fila er øydelagd og kan ikkje lesast.';
      }
      return load(obj);
    }).catch(() => 'Klarte ikkje å lese prosjektfila.');
  }

  /* ──────────────── Autolagring ──────────────── */

  const store = () => VyrdepilStorage.getGameState(RV.toolbar.STORE_KEY) || {};

  function autosaveNow() {
    if (autosaveBlocked) return;

    const text = JSON.stringify(payload());
    if (text.length > AUTOSAVE_LIMIT) {
      autosaveBlocked = true;
      clearAutosave();
      RV.util.toast('Teikninga er for stor til å lagrast i nettlesaren. Lagra ho som prosjektfil.');
      return;
    }

    const state = store();
    state.drawing = text;
    state.savedAt = Date.now();
    try {
      VyrdepilStorage.setGameState(RV.toolbar.STORE_KEY, state);
    } catch (e) {
      // Full lagringsplass er ikkje ein feil brukaren kan gjere noko med
      // der og då — men han skal vite at nettet under han er borte.
      autosaveBlocked = true;
      RV.util.toast('Nettlesaren har ikkje meir lagringsplass. Lagra teikninga som prosjektfil.');
    }
  }

  const autosave = RV.util.debounce(autosaveNow, AUTOSAVE_DELAY);

  /** Hentar att teikninga frå førre økt. @returns {boolean} */
  function restore() {
    const state = store();
    if (typeof state.drawing !== 'string' || !state.drawing || state.drawing.length > AUTOSAVE_LIMIT) return false;
    try {
      const obj = JSON.parse(state.drawing);
      return load(obj) === null;
    } catch (e) {
      return false;
    }
  }

  function clearAutosave() {
    const state = store();
    delete state.drawing;
    delete state.savedAt;
    VyrdepilStorage.setGameState(RV.toolbar.STORE_KEY, state);
  }

  /** Ny og tom teikning. */
  function reset() {
    RV.state.reset();
    RV.render.invalidate();
    RV.hit.invalidate();
    autosaveBlocked = false;
    clearAutosave();
    RV.state.emit('load');
  }

  return {
    APP, VERSION, EXT,
    save, load, openFile, validate, payload,
    autosave, autosaveNow, restore, clearAutosave, reset
  };
})();
