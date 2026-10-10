(function (root) {
  'use strict';
  // Fire eigne sekstentakts satsar, med motiv, imitasjon, sekvens og sluttkadens.
  const scores = [
    { name: 'Marmorfuga', tonic: 60, bpm: 132, scale: [0, 2, 4, 5, 7, 9, 11], motif: [0, 2, 1, 3, 2, 4, 3, 1], second: [4, 2, 3, 1, 2, 0, 1, 2], roots: [0, 0, 5, 1, 4, 0, 3, 4, 5, 2, 3, 1, 4, 4, 0, 0] },
    { name: 'Urverksinvensjon', tonic: 57, bpm: 144, scale: [0, 2, 3, 5, 7, 8, 11], motif: [0, 1, 2, 4, 3, 2, 1, 4], second: [2, 0, 3, 1, 4, 2, 3, 1], roots: [0, 4, 0, 3, 1, 4, 5, 4, 3, 0, 1, 4, 0, 4, 0, 0] },
    { name: 'Spegelmenuett', tonic: 65, bpm: 126, scale: [0, 2, 4, 5, 7, 9, 11], motif: [2, 1, 0, 2, 4, 3, 2, 1], second: [0, 2, 4, 3, 2, 0, 1, 3], roots: [0, 3, 1, 4, 0, 5, 1, 4, 3, 0, 5, 1, 4, 4, 0, 0] },
    { name: 'Tårntoccata', tonic: 62, bpm: 140, scale: [0, 2, 3, 5, 7, 8, 11], motif: [0, 4, 2, 3, 1, 2, 4, 3], second: [4, 3, 2, 0, 1, 3, 2, 1], roots: [0, 0, 4, 0, 3, 5, 1, 4, 0, 3, 1, 4, 4, 4, 0, 0] }
  ];
  function pitch(score, degree, octave) {
    const index = ((degree % 7) + 7) % 7;
    return score.tonic + score.scale[index] + 12 * (Math.floor(degree / 7) + (octave || 0));
  }
  function eventsAt(scene, step) {
    const score = scores[scene], pulses = scene === 2 ? 6 : 8, bar = Math.floor(step / pulses) % 16, pulse = step % pulses;
    const degree = score.roots[bar], quaver = 30 / score.bpm, notes = [];
    const add = (instrument, midi, duration, velocity, pan, delay) => notes.push({ instrument, midi, duration: duration * quaver, velocity, pan, delay: (delay || 0) * quaver });
    // Sterke slag held seg til treklangen; svake slag bind han saman med nabotonar.
    const variation = Math.floor(bar / 4), motif = variation === 2 ? score.second : score.motif;
    let lead = degree + (pulse % 2 === 0 ? [0, 2, 4, 2][pulse / 2] : motif[(pulse + variation * 2) % 8]);
    if (bar === 14) lead = [4, 3, 2, 1, 0, 1, 2, 1][pulse];
    if (bar === 15) lead = [0, 2, 4, 2, 0, 2, 4, 0][pulse];
    const ornament = pulse === pulses - 1 && bar % 4 === 3 && bar !== 15;
    add('cembalo', pitch(score, lead, 1), ornament ? .44 : .84, pulse % 2 ? .14 : .19, -.24);
    if (ornament) add('cembalo', pitch(score, lead + 1, 1), .42, .12, -.19, .5);
    // Andre inngang etter to taktar, og ein rolegare motrøyst i tredje delen.
    if (bar >= 2 && pulse % 2 === 0) {
      const counter = degree + [4, 2, 0, 2][(pulse / 2 + (bar % 2)) % 4];
      add('violin', pitch(score, counter, 0), 1.7, variation === 2 ? .11 : .075, .34);
    }
    if (pulse % 2 === 0) {
      const bass = degree + (pulse === 6 && bar !== 15 ? 4 : 0);
      add('cello', pitch(score, bass, -2), 1.75, pulse === 0 ? .17 : .11, -.06);
    }
    if (pulse === 0) [0, 2, 4].forEach((interval, i) => add('organ', pitch(score, degree + interval, -1), 7.2, scene === 3 ? .055 : .027, (i - 1) * .22));
    if ((scene === 1 || scene === 3) && pulse % 2 === 1 && bar > 3) add('cembalo', pitch(score, degree + [2, 4, 2, 0][Math.floor(pulse / 2)], 0), .58, .065, .18);
    return notes;
  }
  root.Fykefuga.Score = { scores, eventsAt, quaver: scene => 30 / scores[scene].bpm, stepsPerBar: scene => scene === 2 ? 6 : 8, pitch };
})(window);
