(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Eiga barokk tolking av Polargeist si terning–skip–terning-kurve.
  // Fire sekund per del: hinder og ring i fyrste halvdel, flaggval i andre.
  const SPEED = 300, BPM = 120, PART_SECONDS = 4, COUNT = 22, DURATION = COUNT * PART_SECONDS;
  const END_X = SPEED * DURATION;
  const sections = Array.from({ length: COUNT }, (_, index) => {
    const ship = index >= 8 && index < 12;
    return { index, from: index * SPEED * PART_SECONDS, to: (index + 1) * SPEED * PART_SECONDS,
      start: index * PART_SECONDS, end: (index + 1) * PART_SECONDS,
      mode: ship ? 'ship' : 'cube', speed: SPEED,
      top: ship ? 173 : 142, bottom: ship ? 447 : 462,
      zoom: ship ? 1.48 : 1.70, focus: ship ? 310 : 379,
      scene: 4, title: ship ? 'Nordhimmelen' : index < 8 ? 'Flagggalleriet' : 'Stjernehallen',
      questionAt: Infinity, gateAt: Infinity, obstacles: [] };
  });
  function spike(section, offset, width = 34) {
    section.obstacles.push({ x: section.from + offset, y: section.bottom - 18, w: width, h: 32, kind: 'spike' });
  }
  function gate(section, offset, centre, gap = 214) {
    const x = section.from + offset, w = 48;
    section.obstacles.push({ x, y: section.top - 30, w, h: centre - gap / 2 - section.top + 30, kind: 'column' });
    section.obstacles.push({ x, y: centre + gap / 2, w, h: section.bottom + 30 - centre - gap / 2, kind: 'column' });
  }
  const ringSections = new Set([2, 5, 13, 16, 19]);
  sections.forEach(section => {
    if (section.index === COUNT - 1) return;
    if (section.mode === 'ship') {
      gate(section, 260, 312 + (section.index % 2 ? 24 : -24));
      gate(section, 455, 312 + (section.index % 2 ? -14 : 14), 225);
    } else if (ringSections.has(section.index)) {
      // A timely second press at the ring carries the cube over the paired spikes.
      section.obstacles.push({ x: section.from + 260, y: 300, w: 64, h: 64, kind: 'ring' });
      spike(section, 370); spike(section, 409);
    } else if ([4, 14, 18].includes(section.index)) {
      spike(section, 280); spike(section, 317);
    } else spike(section, 310 + (section.index % 3) * 18);
  });
  spike(sections[COUNT - 1], 300);
  const obstacles = sections.flatMap(section => section.obstacles);
  const smooth = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
  const mix = (a, b, part) => a + (b - a) * part;
  function sectionAtX(x) { return sections[Math.min(COUNT - 1, Math.max(0, Math.floor(x / (SPEED * PART_SECONDS))))]; }
  function viewAt(x) {
    const current = sectionAtX(x);
    let a = current, b = current, weight = 0;
    if (current.index > 0 && x < current.from + 145) {
      a = sections[current.index - 1]; b = current; weight = smooth((x - current.from + 145) / 290);
    } else if (current.index < COUNT - 1 && x > current.to - 145) {
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
    return { speed: SPEED, duration: DURATION, count: COUNT, end: DURATION,
      tutorial: true, demo: true, endless: false, musicScene: 7,
      readingSeconds: 2,
      quiz: F.FlagQuestions.create(config.seed || 1, COUNT - 1),
      previewRoute: !!config.previewRoute, lanes, finishX: END_X, viewAt,
      segment: index => sections[Math.max(0, Math.min(COUNT - 1, index))],
      at: time => sections[Math.min(COUNT - 1, Math.max(0, Math.floor(time / PART_SECONDS)))],
      xAt: time => Math.min(END_X, time * SPEED) };
  }
  F.Polargeist = { create, sections, obstacles, lanes, viewAt, SPEED, BPM, END_X };
})(window);
