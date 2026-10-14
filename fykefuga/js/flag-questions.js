(function (root) {
  'use strict';
  const F = root.Fykefuga;
  // Same order as the locally assembled PNG atlas, eight 120 × 76 cells per row.
  const codes = 'al ad am at az ba be bg by ch cy cz de dk ee es fi fr gb ge gr hr hu ie is it kz li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sk sm tr ua va xk'.split(' ');
  const countries = [
    ['Noreg', 'no', 'nord'], ['Sverige', 'se', 'nord'], ['Danmark', 'dk', 'nord'],
    ['Finland', 'fi', 'nord'], ['Island', 'is', 'nord'], ['Estland', 'ee', 'nord'],
    ['Latvia', 'lv', 'nord'], ['Litauen', 'lt', 'nord'],
    ['Storbritannia', 'gb', 'vest'], ['Irland', 'ie', 'vest'], ['Frankrike', 'fr', 'vest'],
    ['Belgia', 'be', 'vest'], ['Nederland', 'nl', 'vest'], ['Tyskland', 'de', 'vest'],
    ['Sveits', 'ch', 'vest'], ['Austerrike', 'at', 'vest'], ['Luxembourg', 'lu', 'vest'],
    ['Spania', 'es', 'sør'], ['Portugal', 'pt', 'sør'], ['Italia', 'it', 'sør'],
    ['Hellas', 'gr', 'sør'], ['Kroatia', 'hr', 'sør'], ['Slovenia', 'si', 'sør'],
    ['Polen', 'pl', 'aust'], ['Tsjekkia', 'cz', 'aust'], ['Slovakia', 'sk', 'aust'],
    ['Ungarn', 'hu', 'aust'], ['Romania', 'ro', 'aust'], ['Bulgaria', 'bg', 'aust'],
    ['Ukraina', 'ua', 'aust']
  ];
  function create(seed, count) {
    if (count > countries.length) throw new Error('For få flagg til bana.');
    const random = Vy.rng((seed ^ 0x7ab314de) >>> 0);
    const questions = Vy.shuffle(countries, random).slice(0, count).map(([name, code, region], index) => ({
      item: { id: 'flagg-' + index, prompt: name, correct: name, kind: 'flag', code },
      region, code, wrong: '', upper: '', lower: '', correctSide: ''
    }));
    function reroll() {
      questions.forEach(question => {
        const sameRegion = countries.filter(([, code, region]) => region === question.region && code !== question.code && code !== question.wrong);
        const pool = sameRegion.length ? sameRegion : countries.filter(([, code]) => code !== question.code && code !== question.wrong);
        question.wrong = pool[Math.floor(random() * pool.length)][1];
        question.correctSide = question.correctSide ? (question.correctSide === 'upper' ? 'lower' : 'upper') : random() < .5 ? 'upper' : 'lower';
        question.upper = question.correctSide === 'upper' ? question.code : question.wrong;
        question.lower = question.correctSide === 'lower' ? question.code : question.wrong;
      });
    }
    reroll();
    return { get: index => questions[index], reroll, get count() { return questions.length; } };
  }
  F.FlagQuestions = { create, codes, countries, indexFor: code => codes.indexOf(code),
    nameFor: code => countries.find(([, value]) => value === code)?.[0] || code };
})(window);
