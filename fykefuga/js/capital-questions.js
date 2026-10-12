(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Korte, eintydige landsnamn og hovudstader til raske vegval.
  const capitals = [
    ['Noreg', 'Oslo', 'nord'], ['Sverige', 'Stockholm', 'nord'],
    ['Danmark', 'København', 'nord'], ['Finland', 'Helsingfors', 'nord'],
    ['Island', 'Reykjavík', 'nord'], ['Estland', 'Tallinn', 'baltikum'],
    ['Latvia', 'Riga', 'baltikum'], ['Litauen', 'Vilnius', 'baltikum'],
    ['Storbritannia', 'London', 'vest'], ['Irland', 'Dublin', 'vest'],
    ['Frankrike', 'Paris', 'vest'], ['Belgia', 'Brussel', 'vest'],
    ['Nederland', 'Amsterdam', 'vest'], ['Tyskland', 'Berlin', 'sentral'],
    ['Austerrike', 'Wien', 'sentral'], ['Sveits', 'Bern', 'sentral'],
    ['Polen', 'Warszawa', 'sentral'], ['Tsjekkia', 'Praha', 'sentral'],
    ['Slovakia', 'Bratislava', 'sentral'], ['Ungarn', 'Budapest', 'sentral'],
    ['Spania', 'Madrid', 'sør'], ['Portugal', 'Lisboa', 'sør'],
    ['Italia', 'Roma', 'sør'], ['Hellas', 'Aten', 'sør'],
    ['Kroatia', 'Zagreb', 'sør'], ['Slovenia', 'Ljubljana', 'sør'],
    ['Romania', 'București', 'aust'], ['Bulgaria', 'Sofia', 'aust'],
    ['Ukraina', 'Kyiv', 'aust'], ['Moldova', 'Chișinău', 'aust']
  ];
  function create(seed, count) {
    if (count > capitals.length) throw new Error('For få hovudstader til bana.');
    const random = Vy.rng((seed ^ 0x3751c2ab) >>> 0);
    const selected = Vy.shuffle(capitals, random).slice(0, count);
    const questions = selected.map(([country, capital, region], index) => ({
      item: { id: 'hovudstad-' + index, prompt: country, correct: capital },
      region, wrong: '', correctSide: '', upper: '', lower: ''
    }));
    function reroll() {
      questions.forEach(question => {
        const alternatives = capitals.filter(([, capital, region]) => region === question.region &&
          capital !== question.item.correct && capital !== question.wrong);
        const pool = alternatives.length ? alternatives : capitals.filter(([, capital]) =>
          capital !== question.item.correct && capital !== question.wrong);
        question.wrong = pool[Math.floor(random() * pool.length)][1];
        question.correctSide = question.correctSide ? (question.correctSide === 'upper' ? 'lower' : 'upper') :
          random() < .5 ? 'upper' : 'lower';
        question.upper = question.correctSide === 'upper' ? question.item.correct : question.wrong;
        question.lower = question.correctSide === 'lower' ? question.item.correct : question.wrong;
      });
    }
    reroll();
    return { get: index => questions[index], reroll, get count() { return questions.length; } };
  }
  F.CapitalQuestions = { create, capitals };
})(window);
