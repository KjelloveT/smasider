(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Eiga 84-sekundars tolking av Back on Track: terning, eitt luftskipstrekk,
  // så terning att. Forgylte sprettplater er den nye banemekanikken.
  const SPEED = 300, BPM = 120, PART_SECONDS = 3.5, COUNT = 24, DURATION = 84;
  const END_X = SPEED * DURATION, READING_SECONDS = 2.5;
  const sections = Array.from({ length: COUNT }, (_, index) => {
    const ship = index >= 12 && index < 16;
    return { index, from: index * SPEED * PART_SECONDS,
      to: (index + 1) * SPEED * PART_SECONDS,
      start: index * PART_SECONDS, end: (index + 1) * PART_SECONDS,
      mode: ship ? 'ship' : 'cube', speed: SPEED,
      top: ship ? 186 : 142, bottom: ship ? 440 : 462,
      zoom: ship ? 1.48 : 1.68, focus: ship ? 313 : 379,
      scene: index < 8 ? 0 : index < 12 ? 1 : index < 16 ? 2 : 3,
      title: index < 12 ? 'Sprettande terning' : ship ? 'Luftskipsgangen' : 'Trappene heim',
      questionAt: Infinity, gateAt: Infinity, obstacles: [] };
  });
  function spike(section, offset, width = 34) {
    section.obstacles.push({ x: section.from + offset, y: section.bottom - 18,
      w: width, h: 32, kind: 'spike' });
  }
  function pad(section, offset) {
    // Den måla foten går inn under golvkanten. Sprite og
    // kollisjonsflate står fast medan den øvre fjøra kan animerast.
    section.obstacles.push({ x: section.from + offset, y: section.bottom - 14,
      w: 120, h: 44, kind: 'pad' });
  }
  function gate(section, offset, centre, gap = 224) {
    const x = section.from + offset, w = 48;
    section.obstacles.push({ x, y: section.top - 30, w,
      h: centre - gap / 2 - section.top + 30, kind: 'column' });
    section.obstacles.push({ x, y: centre + gap / 2, w,
      h: section.bottom + 30 - centre - gap / 2, kind: 'column' });
  }
  const pads = new Set([2, 5, 8, 11, 17, 20]);
  for (const section of sections.slice(0, -1)) {
    if (section.mode === 'ship') {
      gate(section, 190, 310 + (section.index % 2 ? 13 : -13));
    } else if (pads.has(section.index)) {
      pad(section, 85); spike(section, 210);
    } else if ([4, 9, 18, 22].includes(section.index)) {
      spike(section, 185); spike(section, 210);
    } else spike(section, 225 + (section.index % 3) * 12);
  }
  pad(sections[23], 100); spike(sections[23], 225);
  spike(sections[23], 640); pad(sections[23], 800);
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
      tutorial: true, demo: true, endless: false, musicScene: 6,
      readingSeconds: READING_SECONDS,
      quiz: F.CapitalQuestions.create(config.seed || 1, COUNT - 1),
      previewRoute: !!config.previewRoute, lanes, finishX: END_X, viewAt,
      segment: index => sections[Math.max(0, Math.min(COUNT - 1, index))],
      at: time => sections[Math.min(COUNT - 1, Math.max(0, Math.floor(time / PART_SECONDS)))],
      xAt: time => Math.min(END_X, time * SPEED) };
  }
  F.BackOnTrack = { create, sections, obstacles, lanes, viewAt, SPEED, BPM, END_X };
})(window);
