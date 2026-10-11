(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const offsets = [-4, -3, -2, 2, 3, 4];
  const pairs = [];
  for (let first = 6; first <= 13; first++)
    for (let second = first; second <= 13; second++) pairs.push([first, second]);

  function create(seed, count) {
    const random = Vy.rng((seed ^ 0x5f4b6a31) >>> 0);
    const chosen = Vy.shuffle(pairs, random).slice(0, count);
    const questions = chosen.map(([first, second], index) => ({
      item: { id: 'retray-' + index, prompt: first + ' × ' + second, correct: String(first * second) },
      wrong: null, correctSide: null, upper: null, lower: null
    }));
    function reroll() {
      questions.forEach(question => {
        const previous = question.wrong;
        const available = offsets.filter(delta => String(Number(question.item.correct) + delta) !== previous);
        question.wrong = String(Number(question.item.correct) + available[Math.floor(random() * available.length)]);
        question.correctSide = question.correctSide ? (question.correctSide === 'upper' ? 'lower' : 'upper') : random() < .5 ? 'upper' : 'lower';
        question.upper = question.correctSide === 'upper' ? question.item.correct : question.wrong;
        question.lower = question.correctSide === 'lower' ? question.item.correct : question.wrong;
      });
    }
    reroll();
    return { get: index => questions[index], reroll, get count() { return questions.length; } };
  }
  function active(world, state) {
    if (!world.demo || state.status !== 'running') return null;
    const next = world.segment(state.segment + 1);
    if (!next || next.index <= state.segment || state.time + 1e-8 < next.start - 2 || state.time >= next.start) return null;
    return { ...world.quiz.get(next.index - 1), remaining: next.start - state.time, section: next, demo: true };
  }
  F.ReTrayQuestions = { create, active, offsets };
})(window);
