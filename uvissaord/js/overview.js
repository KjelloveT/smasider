/* Tre inngangar til dagen og ei lokal, visuell kvittering for kvart ord. */
window.OrdvettOverview = (function () {
  'use strict';
  const View = OrdvettView, Game = OrdvettGame, el = Vy.el;
  function wordResult(question, index) {
    const item = el('li', 'vp-panel vp-panel--soft ov-word-result');
    const fills = ['--vp-sky', '--vp-honey', '--vp-moss', '--vp-heather', '--vp-coral'];
    item.style.setProperty('--vp-panel-fill', `var(${fills[index % fills.length]})`);
    const heading = el('div', 'ov-result-row');
    heading.append(View.icon(question.outcome === 'solved' ? 'check' : question.outcome ? 'eye' : 'circle'),
      el('strong', '', question.outcome ? question.word.answer : `Ord ${index + 1}`), View.price(question.cost));
    heading.setAttribute('aria-label', `Ord ${index + 1}: ${question.outcome === 'solved' ? 'løyst' : question.outcome ? 'fasit vist' : 'står att'}, ${question.cost} myntar brukte`);
    item.append(heading);
    if (question.wrongGuesses.length) {
      const misses = el('div', 'ov-wrong-words'); misses.setAttribute('aria-label', 'Feilforsøk');
      question.wrongGuesses.forEach(value => {
        const chip = el('span', 'ov-wrong-word'); chip.append(View.icon('x'), el('span', '', value)); misses.append(chip);
      }); item.append(misses);
    }
    if (question.purchases.length) {
      const hints = el('div', 'ov-history-hints'); hints.setAttribute('aria-label', 'Kjøpte hint');
      const grouped = new Map();
      question.purchases.forEach(purchase => {
        if (!grouped.has(purchase.id)) grouped.set(purchase.id, []);
        grouped.get(purchase.id).push(purchase);
      });
      grouped.forEach((purchases, id) => {
        const detail = el('section', 'ov-history-hint');
        const heading = el('div', 'ov-history-hint-heading');
        const name = Game.HINTS.find(hint => hint.id === id).label;
        heading.append(View.hintImage(id), el('strong', '', name));
        if (purchases.length > 1) heading.append(el('small', '', `× ${purchases.length}`));
        detail.setAttribute('aria-label', `${name}: ${purchases.length} kjøp`);
        detail.append(heading); purchases.forEach(purchase => detail.append(el('p', '', purchase.text)));
        hints.append(detail);
      }); item.append(hints);
    }
    return item;
  }
  function render(settings, date, onStart) {
    View.byId('levelCards').replaceChildren(...OrdvettSchedule.LEVELS.map(level => {
      const descriptor = OrdvettSchedule.daily(level.id, date);
      const snapshot = OrdvettStorage.getDaily(descriptor.key);
      const round = snapshot ? Game.restore(descriptor.words, snapshot, Vy.rng(descriptor.seed)) : null;
      const result = round ? Game.summary(round) : null;
      const article = el('article', 'vp-panel vp-panel--plain ov-day-level');
      const heading = el('header', 'ov-level-heading');
      const button = el('button', 'vp-button vp-button--tool ov-level-action'); button.type = 'button'; button.dataset.level = level.id;
      const image = el('img'); image.src = `../_resources/vyrdepil-design/bragder/icons/${level.image}.png`;
      image.width = 80; image.height = 80; image.alt = '';
      const copy = el('div', 'ov-level-copy'); copy.append(el('h3', 'vp-heading', level.label));
      const dots = el('div', 'ov-mode-progress'); View.progress(round, dots); copy.append(dots);
      if (result) {
        const totals = el('span', 'ov-mode-totals');
        const solved = el('span', 'ov-mode-solved'); solved.append(View.icon('check'), el('strong', '', `${result.solved}/5`));
        solved.setAttribute('aria-label', `${result.solved} av 5 ord løyste`);
        const spent = View.price(result.cost); spent.setAttribute('aria-label', `${result.cost} myntar brukte`);
        totals.append(solved, spent); copy.append(totals);
      }
      const action = round ? 'Hald fram' : 'Spel';
      button.append(View.icon('play'), el('span', '', action));
      button.setAttribute('aria-label', `${level.label}: ${action}${result ? `, ${result.solved} av 5 ord, ${result.cost} myntar brukte` : ', 5 ord og 60 myntar'}`);
      button.addEventListener('click', () => onStart(level.id)); heading.append(image, copy);
      if (!result?.complete) heading.append(button);
      article.append(heading);
      if (round && round.questions.some(question => question.outcome || question.purchases.length || question.guesses.size)) {
        const list = el('ol', 'ov-history-words'); round.questions.forEach((question, index) => {
          if (question.outcome || question.purchases.length || question.guesses.size) list.append(wordResult(question, index));
        }); list.setAttribute('aria-label', `Runden din: ${level.label}`); article.append(list);
      }
      return article;
    }));
  }
  return Object.freeze({ render, wordResult });
})();
