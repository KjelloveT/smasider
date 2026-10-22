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
      { id: 'sort', name: 'Båsrunden', description: 'Finn rett bås for eitt ord om gongen.' },
      { id: 'helper', name: 'Hjelp Vyrde', description: 'Vyrde foreslår ein bås. Hjelp han å velje rett.' },
      { id: 'pairs', name: 'Ordskiftet', description: 'Same ordform i to setningar – bruken skiftar.' }
    ],
    levels: ['Fyrste båsane', 'Bøygde ord', 'Ord i samanheng', 'Ordmeisteren'],
    defaults: { mode: 'sort', level: 1, count: 8, classes: ['substantiv','verb','adjektiv'], showMeaning: false }
  };
})(window);
