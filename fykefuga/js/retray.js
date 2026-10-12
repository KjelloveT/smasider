(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // The mode and speed portal positions are read from ReTraY (level 6508283).
  // Obstacles are a deliberately playable study of its nine-part structure.
  const SPEED = 300, PORTAL_X = 1729, SOURCE_END_X = 18345, BPM = 108;
  const source = [
    { from: 0, mode: 'cube', speed: 300, top: 142, bottom: 462, zoom: 1.38, focus: 350, scene: 0, title: 'Terningopninga' },
    { from: 1729, mode: 'ship', speed: 290, top: 205, bottom: 430, zoom: 1.54, portalY: 370, scene: 0, title: 'Luftskipet' },
    { from: 3525, mode: 'ufo', speed: 290, top: 190, bottom: 442, zoom: 1.48, scene: 1, title: 'Sveveklokka' },
    { from: 5145, mode: 'ball', speed: 250, top: 170, bottom: 462, zoom: 1.28, portalY: 300, scene: 1, title: 'Rullekula' },
    { from: 6402, mode: 'ship', speed: 280, top: 195, bottom: 435, zoom: 1.5, portalY: 245, scene: 1, title: 'Luftskipet kjem att' },
    { from: 6825, mode: 'ship', speed: 250, top: 195, bottom: 435, zoom: 1.57, scene: 1, title: 'Klokkene dreg ned farten' },
    { from: 7043, mode: 'ship', speed: 280, top: 195, bottom: 435, zoom: 1.5, scene: 2, title: 'Spegelgangen' },
    { from: 9045, mode: 'ship', speed: 320, top: 215, bottom: 425, zoom: 1.62, scene: 2, title: 'Opptakt til bølgja' },
    { from: 9255, mode: 'wave', speed: 335, top: 220, bottom: 455, zoom: 1.63, scene: 2, title: 'Bølgjegangen' },
    { from: 14309, mode: 'cube', speed: 250, top: 215, bottom: 445, zoom: 1.57, focus: 335, scene: 3, auto: true, title: 'Urverket tek over' },
    { from: 14895, mode: 'ufo', speed: 390, top: 240, bottom: 420, zoom: 1.73, portalY: 395, scene: 3, auto: true, title: 'Automatisk svev' },
    { from: 17235, mode: 'ufo', speed: 290, top: 185, bottom: 445, zoom: 1.46, scene: 0, title: 'Siste svev' }
  ];
  // Every junction gets a full two-second decision runway, even where the
  // source level places two speed portals almost on top of one another.
  let extra = 0, previousFrom = 0;
  const definitions = source.map((item, index) => {
    let from = item.from + extra;
    if (index) {
      const previous = source[index - 1];
      const minimum = previousFrom + Math.ceil(previous.speed * 2.25);
      if (from < minimum) { extra += minimum - from; from = minimum; }
    }
    previousFrom = from;
    return { ...item, from, shift: extra };
  });
  const END_X = SOURCE_END_X + extra;
  const sections = [];
  let elapsed = 0;
  definitions.forEach((item, index) => {
    const to = index + 1 < definitions.length ? definitions[index + 1].from : END_X;
    const duration = (to - item.from) / item.speed;
    sections.push({ ...item, index, to, start: elapsed, end: elapsed + duration,
      questionAt: Infinity, gateAt: Infinity, obstacles: [] });
    elapsed += duration;
  });
  function spike(section, x, y, width = 38, height = 40) {
    section.obstacles.push({ x: x + section.shift, y, w: width, h: height, kind: 'spike' });
  }
  function platform(section, x, y, width, height) {
    section.obstacles.push({ x: x + section.shift, y, w: width, h: height, kind: 'platform' });
  }
  function gate(section, x, centre, gap, width = 48) {
    const edgeTop = centre - gap / 2, edgeBottom = centre + gap / 2;
    section.obstacles.push({ x, y: section.top - 30, w: width,
      h: edgeTop - section.top + 30, kind: 'column' });
    section.obstacles.push({ x, y: edgeBottom, w: width,
      h: section.bottom + 30 - edgeBottom, kind: 'column' });
  }
  function onBeat(section, beat) {
    const globalBeat = Math.ceil(section.start * BPM / 60) + beat;
    return Math.round(section.from + (globalBeat * 60 / BPM - section.start) * section.speed);
  }
  const first = sections[0];
  spike(first, 480, 446, 30, 30); spike(first, 910, 446, 30, 30);
  platform(first, 1050, 446, 240, 30); platform(first, 1380, 416, 360, 60);
  [345, 310, 350, 305, 340].forEach((centre, i) => gate(sections[1], onBeat(sections[1], 2 * (i + 1)), centre, 140));
  [315, 340, 305, 335].forEach((centre, i) => gate(sections[2], onBeat(sections[2], 2 * (i + 1)), centre, 190));
  spike(sections[3], 5550, 426, 45, 50);
  spike(sections[3], 5990, 156, 45, 50);
  spike(sections[3], 6230, 426, 42, 50);
  [330, 300, 350, 305, 340].forEach((centre, i) => gate(sections[6], onBeat(sections[6], 2 * (i + 1)), centre, 150));
  for (let i = 0; i < 13; i++) gate(sections[8], onBeat(sections[8], 2 * (i + 1)), i % 2 ? 365 : 315, 146, 46);
  platform(sections[9], 14470, 424, 180, 36);
  [330, 322, 335, 325].forEach((centre, i) => gate(sections[10], onBeat(sections[10], 2 * (i + 1)), centre, 130));
  [315, 340, 320].forEach((centre, i) => gate(sections[11], onBeat(sections[11], 2 * (i + 1)), centre, 155));
  // Remove hazards in the two seconds reserved for reading and steering.
  sections.slice(0, -1).forEach(section => {
    const start = section.to - 2 * section.speed;
    section.obstacles = section.obstacles.filter(item => item.kind === 'platform' || item.x + item.w < start);
  });
  const obstacles = sections.flatMap(section => section.obstacles);
  const smooth = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
  const mix = (a, b, part) => a + (b - a) * part;
  function sectionAtX(x) {
    for (let i = 0; i < sections.length - 1; i++) if (x < sections[i].to) return sections[i];
    return sections[sections.length - 1];
  }
  function viewAt(x) {
    const current = sectionAtX(x);
    let a = current, b = current, weight = 0;
    if (current.index > 0 && x < current.from + 145) {
      a = sections[current.index - 1]; b = current; weight = smooth((x - current.from + 145) / 290);
    } else if (current.index < sections.length - 1 && x > current.to - 145) {
      a = current; b = sections[current.index + 1]; weight = smooth((x - current.to + 145) / 290);
    }
    return { top: mix(a.top, b.top, weight), bottom: mix(a.bottom, b.bottom, weight),
      zoom: mix(a.zoom, b.zoom, weight),
      focusY: mix(a.focus || (a.top + a.bottom) / 2, b.focus || (b.top + b.bottom) / 2, weight) };
  }
  function autoTarget(section, x, player, view) {
    if (section.mode === 'cube') {
      const target = x < 14670 + section.shift ? 410 : view.bottom;
      return x < 14470 + section.shift ? mix(player.y, 410, .09) : mix(player.y, target, .12);
    }
    const target = 328 + Math.sin((x - section.from) / 270) * 13;
    return mix(player.y, target, .08);
  }
  function lanes(section) {
    const corridor = viewAt(section.from);
    const span = corridor.bottom - corridor.top;
    return { upper: corridor.top + span * .21, lower: corridor.bottom - span * .21,
      split: (corridor.top + corridor.bottom) / 2, height: Math.min(94, span * .35) };
  }
  function create(config = {}) {
    return { speed: SPEED, duration: elapsed, count: sections.length, end: elapsed,
      tutorial: true, demo: true, endless: false, musicScene: 4,
      quiz: F.ReTrayQuestions.create(config.seed || 1, sections.length - 1), previewRoute: !!config.previewRoute,
      lanes, finishX: END_X, autoTarget,
      segment: index => sections[Math.max(0, Math.min(sections.length - 1, index))],
      at: time => sections.find(section => time < section.end) || sections[sections.length - 1],
      xAt: time => { const section = sections.find(value => time < value.end) || sections[sections.length - 1];
        return Math.min(END_X, section.from + (time - section.start) * section.speed); },
      viewAt };
  }
  F.ReTray = { create, obstacles, sections, viewAt, autoTarget, lanes, SPEED, PORTAL_X, END_X, BPM };
})(window);
