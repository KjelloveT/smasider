(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const offsets = [-4, -3, -2, 2, 3, 4];
  function create(seed, count, firstFactor = 6, lastFactor = 13, id = 'retray') {
    const pairs = [];
    for (let first = firstFactor; first <= lastFactor; first++)
      for (let second = first; second <= lastFactor; second++) pairs.push([first, second]);
    if (count > pairs.length) throw new Error('For få ulike gangestykke til bana.');
    const random = Vy.rng((seed ^ 0x5f4b6a31) >>> 0);
    const chosen = Vy.shuffle(pairs, random).slice(0, count);
    const questions = chosen.map(([first, second], index) => ({
      item: { id: id + '-' + index, prompt: first + ' × ' + second, correct: String(first * second) },
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
    if (!next || next.index <= state.segment || state.time + 1e-8 < next.start - (world.readingSeconds || 2) || state.time >= next.start) return null;
    return { ...world.quiz.get(next.index - 1), remaining: next.start - state.time, section: next, world, demo: true };
  }
  F.ReTrayQuestions = { create, active, offsets };
})(window);
