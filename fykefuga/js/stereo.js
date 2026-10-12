(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Ei sjølvstendig tolking av Stereo Madness sin fire delars
  // terning–skip–terning–skip-kurve. Kvart vegval ligg på 1,5 takter ved 120 BPM.
  const SPEED = 300, BPM = 120, PART_SECONDS = 3, COUNT = 23, DURATION = 72;
  const END_X = SPEED * DURATION;
  const sections = Array.from({ length: COUNT }, (_, index) => {
    const ship = index >= 6 && index < 12 || index >= 18;
    const from = index * SPEED * PART_SECONDS;
    const end = index === COUNT - 1 ? DURATION : (index + 1) * PART_SECONDS;
    return { index, from, to: end * SPEED,
      start: index * PART_SECONDS, end,
      mode: ship ? 'ship' : 'cube', speed: SPEED,
      top: ship ? 186 : 142, bottom: ship ? 440 : 462,
      zoom: ship ? 1.48 : 1.70, focus: ship ? 313 : 379,
      scene: Math.floor(index / 6), title: ['Terningopning', 'Luftskip', 'Marmortrapp', 'Siste svev'][Math.floor(index / 6)],
      questionAt: Infinity, gateAt: Infinity, obstacles: [] };
  });
  function spike(section, offset, width = 34) {
    section.obstacles.push({ x: section.from + offset, y: section.bottom - 18,
      w: width, h: 32, kind: 'spike' });
  }
  function gate(section, offset, centre, gap = 204) {
    const x = section.from + offset, w = 46;
    section.obstacles.push({ x, y: section.top - 30, w,
      h: centre - gap / 2 - section.top + 30, kind: 'column' });
    section.obstacles.push({ x, y: centre + gap / 2, w,
      h: section.bottom + 30 - centre - gap / 2, kind: 'column' });
  }
  // Den korte opninga i kvart tresekundsrom gjev plass til eit hinder. Dei
  // neste to sekunda er frie til reknestykket, utan ekstra dødtid mellom portar.
  const cubeHazards = [
    [260], [220], [240], [220], [210], [230],
    [], [], [], [], [], [],
    [], [210], [240], [210], [230], [210]
  ];
  cubeHazards.forEach((positions, index) => positions.forEach(offset => spike(sections[index], offset)));
  [...Array(6)].map((_, index) => index + 6).concat([18, 19, 20, 21, 22]).forEach(index => {
    const section = sections[index], final = index === COUNT - 1;
    const offsets = final ? [360, 990, 1470] : [220];
    offsets.forEach((offset, step) => gate(section, offset,
      312 + (step % 2 ? 16 : -10), index >= 18 ? 202 : 218));
  });
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
      tutorial: true, demo: true, endless: false, musicScene: 5,
      quiz: F.ReTrayQuestions.create(config.seed || 1, COUNT - 1, 2, 9, 'stereo'),
      previewRoute: !!config.previewRoute, lanes, finishX: END_X, viewAt,
      segment: index => sections[Math.max(0, Math.min(COUNT - 1, index))],
      at: time => sections[Math.min(COUNT - 1, Math.max(0, Math.floor(time / PART_SECONDS)))],
      xAt: time => Math.min(END_X, time * SPEED) };
  }
  F.Stereo = { create, sections, obstacles, lanes, viewAt, SPEED, BPM, END_X };
})(window);
