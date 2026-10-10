(function (root) {
  'use strict';
  const F = root.Fykefuga = root.Fykefuga || {};
  F.modes = [
    { id: 'cube', name: 'Terning', help: 'Trykk for å hoppe. Hald inne for nye hopp ved landing.' },
    { id: 'ship', name: 'Luftskip', help: 'Hald inne for å stige. Slepp for å dale.' },
    { id: 'ufo', name: 'Sveveklokke', help: 'Kvart nytt trykk løftar deg i lufta.' },
    { id: 'swing', name: 'Svingfarkost', help: 'Trykk for å snu tyngdekrafta i lufta.' },
    { id: 'ball', name: 'Rullekule', help: 'Trykk ved golv eller tak for å snu tyngdekrafta.' },
    { id: 'wave', name: 'Bølgje', help: 'Hald inne for å fyke opp. Slepp for å fyke ned.' },
    { id: 'robot', name: 'Urverksløpar', help: 'Hald hoppet lenger for å nå høgare.' },
    { id: 'spider', name: 'Spinneverk', help: 'Trykk ved ei flate for å flytte deg til motsett flate.' }
  ];
  F.levels = [
    { id: 'marmor', name: 'Marmorsalen', scene: 0, difficulty: 0, modes: ['cube', 'ufo', 'cube', 'ufo'], description: 'Ei lys opning med hopp og svev.' },
    { id: 'urverk', name: 'Urverkhagen', scene: 1, difficulty: 1, modes: ['ship', 'ball', 'ufo', 'ship', 'ball', 'cube'], description: 'Flyg og rull mellom mekaniske hagekulissar.' },
    { id: 'spegel', name: 'Spegelgalleriet', scene: 2, difficulty: 1, modes: ['wave', 'robot', 'cube', 'wave', 'ufo', 'robot', 'ship', 'ball'], description: 'Presise bølgjer og hopp gjennom galleriet.' },
    { id: 'orgel', name: 'Orgeltårnet', scene: 3, difficulty: 2, modes: ['swing', 'spider', 'cube', 'ship', 'ufo', 'ball', 'wave', 'robot', 'swing', 'spider'], description: 'Alle åtte former i den store finalen.' }
  ];
  F.skins = [
    { id: 'gold', name: 'Forgylling', hint: 'Di fyrste utsjånad.' },
    { id: 'porcelain', name: 'Porselen', hint: 'Fullfør ei hovudbane.' },
    { id: 'copper', name: 'Patinert kopar', hint: 'Svar rett 100 gonger.' }
  ];
  function question(id, prompt, correct, wrong) { return { id, prompt, correct, accepted: [], wrong: wrong || [] }; }
  function pack(id, title, questions) {
    return { app: 'fykefuga', version: 1, id, title, questions, recommended: { level: 'marmor', reading: 4, difficulty: 0 } };
  }
  const multiplication = [];
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
    const answer = a * b;
    multiplication.push(question('g-' + a + '-' + b, a + ' × ' + b, String(answer), [String(answer + a), String(Math.max(0, answer - a))].filter(x => x !== String(answer))));
  }
  const arithmetic = [];
  for (let a = 1; a <= 10; a++) {
    arithmetic.push(question('p-' + a, a + ' + ' + (a + 1), String(2 * a + 1), [String(2 * a), String(2 * a + 2)]));
    arithmetic.push(question('m-' + a, (a + 8) + ' − ' + a, '8', ['7', '9']));
  }
  const words = [['cat', 'katt'], ['dog', 'hund'], ['house', 'hus'], ['tree', 'tre'], ['book', 'bok'], ['water', 'vatn'], ['sun', 'sol'], ['moon', 'måne'], ['red', 'raud'], ['green', 'grøn'], ['school', 'skule'], ['friend', 'ven']];
  F.builtins = [pack('builtin-gonging', 'Gangetabell 1–10', multiplication), pack('builtin-rekning', 'Små reknestykke', arithmetic), pack('builtin-gloser', 'Korte engelske gloser', words.map((pair, i) => question('w-' + i, pair[0], pair[1])))];
  F.mode = id => F.modes.find(mode => mode.id === id) || F.modes[0];
  F.level = id => F.levels.find(level => level.id === id) || F.levels[0];
})(window);
