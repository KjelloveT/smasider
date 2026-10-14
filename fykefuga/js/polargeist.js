(function (root) {
  'use strict';
  const F = root.Fykefuga, source = F.PolargeistSource;
  const SPEED = 300, BPM = 90, END_X = 27600, SOURCE_END = 27645, GAP = 600;
  // Answer corridors are inserted between original object groups. Compressing
  // the remaining horizontal distances keeps the existing 92-second score.
  const gates = [3435, 5000, 11115, 14795, 16575, 19170, 22395, 25380];
  const modes = [{ at: 9645, mode: 'ship' }, { at: 13305, mode: 'cube' }];
  const scale = (END_X - gates.length * GAP) / SOURCE_END;
  const mapX = x => x * scale + gates.filter(gate => x >= gate).length * GAP;
  const floorY = 477;
  const events = [...gates.map((at, choiceIndex) => ({ at, choiceIndex })), ...modes].sort((a, b) => a.at - b.at);
  const sections = [];
  let mode = 'cube', from = 0;
  for (const event of [...events, { at: SOURCE_END, finish: true }]) {
    const to = event.finish ? END_X : mapX(event.at);
    const sourceFrom = sections.length ? events[sections.length - 1].at : 0;
    const ship = mode === 'ship';
    sections.push({ index: sections.length, from, to, start: from / SPEED, end: to / SPEED,
      mode, speed: SPEED, scene: 4, title: ship ? 'Nordhimmelen' : 'Flagggalleriet',
      top: ship ? 85 : 142, bottom: 462, zoom: ship ? 1.36 : 1.65,
      focus: ship ? 292 : 366, questionAt: Infinity, gateAt: Infinity,
      sourceFrom, sourceTo: event.at, obstacles: [] });
    from = to;
    if (event.mode) mode = event.mode;
  }
  // A boundary belongs to the new section; only eight boundaries ask for flags.
  for (const event of events) if (event.choiceIndex !== undefined) {
    const section = sections.find(item => item.from === mapX(event.at));
    section.choiceIndex = event.choiceIndex;
  }
  const sectionAtX = x => sections.find(item => x < item.to) || sections[sections.length - 1];
  function add(item) { sectionAtX(item.x).obstacles.push(item); }
  function runs(objects, width, height, kind) {
    const rows = new Map();
    for (const [, x, y] of objects) {
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(x);
    }
    for (const [y, xs] of rows) {
      xs.sort((a, b) => a - b);
      let first = xs[0], previous = xs[0];
      function flush() {
        const x = mapX(first) - width / 2;
        add({ x, y: kind === 'pit' ? 447 : floorY - y - height / 2,
          w: mapX(previous) - mapX(first) + width, h: height, kind });
      }
      for (let i = 1; i < xs.length; i++) {
        if (xs[i] - previous > 31 || mapX(xs[i]) - mapX(previous) > 45) {
          flush(); first = xs[i];
        }
        previous = xs[i];
      }
      flush();
    }
  }
  runs(source.blocks, 30, 30, 'platform');
  runs(source.ledges, 30, 16, 'platform');
  runs(source.pits, 30, 32, 'pit');
  for (const [, x, y] of source.spikes) add({ x: mapX(x) - 16, y: floorY - y - 16,
    w: 32, h: 32, kind: 'spike' });
  for (const [, x, y] of source.rings) add({ x: mapX(x) - 32, y: floorY - y - 32,
    w: 64, h: 64, kind: 'ring' });
  for (const [, x, y] of source.pads) add({ x: mapX(x) - 24, y: floorY - y - 11,
    w: 48, h: 22, kind: 'pad' });
  for (const [, x, y] of source.chains) add({ x: mapX(x) - 4, y: floorY - y - 15,
    w: 8, h: 30, kind: 'chain' });
  // Leave a short recovery space after every answer portal. The source map
  // resumes immediately after it; only the colliders in this small margin go.
  sections.filter(section => section.choiceIndex !== undefined).forEach(section => {
    section.obstacles = section.obstacles.filter(item =>
      !['platform', 'spike', 'pit'].includes(item.kind) || item.x >= section.from + 180);
  });
  sections.forEach(section => {
    section.obstacles.sort((a, b) => a.x - b.x);
    const high = section.obstacles.filter(item => ['platform', 'spike', 'ring'].includes(item.kind))
      .reduce((max, item) => Math.max(max, floorY - item.y), 0);
    if (section.mode === 'cube' && high > 240) {
      section.top = 62; section.zoom = 1.27; section.focus = 290;
    } else if (section.mode === 'cube' && high > 165) {
      section.top = 100; section.zoom = 1.47; section.focus = 328;
    }
  });
  const obstacles = sections.flatMap(section => section.obstacles);
  const smooth = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
  const mix = (a, b, part) => a + (b - a) * part;
  function viewAt(x) {
    const current = sectionAtX(x);
    let a = current, b = current, weight = 0;
    if (current.index > 0 && x < current.from + 145) {
      a = sections[current.index - 1]; b = current; weight = smooth((x - current.from + 145) / 290);
    } else if (current.index < sections.length - 1 && x > current.to - 145) {
      a = current; b = sections[current.index + 1]; weight = smooth((x - current.to + 145) / 290);
    }
    return { top: mix(a.top, b.top, weight), bottom: mix(a.bottom, b.bottom, weight),
      zoom: mix(a.zoom, b.zoom, weight), focusY: mix(a.focus, b.focus, weight) };
  }
  function lanes(section) {
    const approach = sections[Math.max(0, section.index - 1)].mode;
    return approach === 'cube'
      ? { upper: 335, lower: 425, split: 380, height: 76 }
      : { upper: 260, lower: 365, split: 312.5, height: 88 };
  }
  function create(config = {}) {
    return { speed: SPEED, duration: END_X / SPEED, count: sections.length,
      questionCount: gates.length, end: END_X / SPEED, tutorial: true, demo: true,
      endless: false, musicScene: 7, readingSeconds: 2,
      quiz: F.FlagQuestions.create(config.seed || 1, gates.length),
      previewRoute: !!config.previewRoute, lanes, finishX: END_X, viewAt,
      choiceIndex: section => section.choiceIndex === undefined ? -1 : section.choiceIndex,
      segment: index => sections[Math.max(0, Math.min(sections.length - 1, index))],
      at: time => sectionAtX(Math.min(END_X, time * SPEED)),
      xAt: time => Math.min(END_X, time * SPEED) };
  }
  F.Polargeist = { create, sections, obstacles, gates, mapX, lanes, viewAt,
    SPEED, BPM, END_X };
})(window);
