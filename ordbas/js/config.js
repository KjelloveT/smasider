(function (root) {
  'use strict';
  root.Ordbas = root.Ordbas || {};
  root.Ordbas.Config = {
    classes: [
      { id: 'substantiv', name: 'Substantiv', short: 'Namn på noko', guide: 'Namn på ting, dyr, menneske, kjensler og omgrep. Døme: hund, glede.' },
      { id: 'verb', name: 'Verb', short: 'Noko skjer eller er', guide: 'Fortel om handlingar, hendingar og tilstandar. Døme: hoppe, sove, vere.' },
      { id: 'adjektiv', name: 'Adjektiv', short: 'Skildrar noko eller nokon', guide: 'Skildrar det eit substantiv eller pronomen viser til. Døme: ein roleg hund.' },
      { id: 'adverb', name: 'Adverb', short: 'Kvar, når, korleis, grad', guide: 'Seier noko om verb, adjektiv, andre adverb eller heile setningar. Døme: går roleg, ganske glad.' }
    ],
    modes: [
      { id: 'sort', name: 'Båsrunden', description: 'Kort for kort.' },
      { id: 'helper', name: 'Hjelp Vyrde', description: 'Vyrde skildrar. Du finn ordet.' },
      { id: 'pairs', name: 'Ordskiftet', description: 'To setningar. To ulike båsar.' }
    ],
    levels: ['Lett', 'Middels', 'Vanskeleg', 'Ekstrem'],
    levelPictures: ['sprout','twin-sprouts','mixed-forest','mountain-goat'],
    defaults: { mode: 'sort', level: 1, count: 8, classes: ['substantiv','verb'], showMeaning: false }
  };
})(window);
