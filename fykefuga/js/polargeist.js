(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Polargeist-kurva: tett terningopning, kort skip ved 35–48 %, og
  // trapper, piggrekkjer og fleire hoppringar i den siste terningdelen.
  // Kvar del held framleis av to sekund der flagga kan lesast og veljast.
  const SPEED = 300, BPM = 90, PART_SECONDS = 4, COUNT = 23, DURATION = COUNT * PART_SECONDS;
  const END_X = SPEED * DURATION;
  const sections = Array.from({ length: COUNT }, (_, index) => {
    const ship = index >= 8 && index < 11;
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
  function spikes(section, ...offsets) { offsets.forEach(offset => spike(section, offset)); }
  function platform(section, offset, y, width) {
    section.obstacles.push({ x: section.from + offset, y, w: width,
      h: section.bottom + 14 - y, kind: 'platform' });
  }
  function ring(section, offset) {
    section.obstacles.push({ x: section.from + offset, y: 300, w: 64, h: 64, kind: 'ring' });
  }
  function gate(section, offset, centre, gap = 214) {
    const x = section.from + offset, w = 48;
    section.obstacles.push({ x, y: section.top - 30, w, h: centre - gap / 2 - section.top + 30, kind: 'column' });
    section.obstacles.push({ x, y: centre + gap / 2, w, h: section.bottom + 30 - centre - gap / 2, kind: 'column' });
  }
  const patterns = [
    [145, 335, 525], [115, 149, 325, 525], null, [145, 335, 525],
    [115, 149, 325, 525], null, null, [115, 149, 325, 525],
    null, null, null, null,
    [115, 149, 325, 525], null, null, [145, 335, 525],
    null, [115, 149, 325, 525]
  ];
  sections.forEach(section => {
    if (section.mode === 'ship') {
      // Tre endringar i flyhøgd på to sekund, med ein open innfartsport.
      gate(section, 120, 320, 266);
      gate(section, 305, section.index % 2 ? 284 : 340, 210);
      gate(section, 490, section.index % 2 ? 346 : 288, 210);
      return;
    }
    if (section.index === 11) { spikes(section, 355, 510); return; }
    if ([2, 5, 13, 16, 19, 21].includes(section.index)) {
      // Første hoppet når ringen; det neste må gjerast medan terningen er i lufta.
      ring(section, 270); spikes(section, 375, 411);
      return;
    }
    if ([6, 14, 18].includes(section.index)) {
      platform(section, 300, 411, 100);
      platform(section, 480, 379, 110);
      return;
    }
    if (section.index === 20) {
      section.obstacles.push({ x: section.from + 260, y: section.bottom - 22,
        w: 70, h: 22, kind: 'pad' });
      spikes(section, 340, 376);
      return;
    }
    if (section.index === COUNT - 1) {
      spikes(section, 125, 390, 425, 710, 746, 980, 1016);
      return;
    }
    spikes(section, ...(patterns[section.index] || [120, 410, 444]));
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
