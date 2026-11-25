/* Frødebrett — offentleg nyheitsfrøde frå den vekentlege publiseringa. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });
  const dateId = /^\d{4}-\d{2}-\d{2}$/;

  function label(period) {
    return dateFormat.formatRange(new Date(period.from), new Date(period.through));
  }

  async function readJson(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw Error('Kunne ikkje laste nyheitsfrøda.');
    return response.json();
  }

  function readQuiz(board) {
    if (board.app !== 'frodebrett' || board.version !== 1 || board.quiz?.categories?.length !== 5) return null;
    for (const category of board.quiz.categories) {
      if (category.name === 'snodige nyheter') category.name = 'snodige nyheiter';
    }
    return board.quiz;
  }

  function bindPlay(button, load, status) {
    let ready;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        ready ??= Promise.resolve().then(load).then(quiz => {
          if (!quiz) throw Error('Kunne ikkje laste nyheitsfrøda.');
          return quiz;
        });
        const quiz = await ready;
        if (button.getClientRects().length) FB.Board.selectQuiz(quiz);
      } catch {
        ready = null;
        status.hidden = false;
        status.textContent = 'Kunne ikkje laste nyheitsfrøda. Prøv att.';
      } finally {
        button.disabled = false;
      }
    });
  }

  async function showWeeklyQuiz() {
    const status = FB.el('weekly-news-period');
    try {
      const board = await readJson('json/weekly-news.json');
      const quiz = readQuiz(board);
      if (!quiz || !board.period) return;
      status.textContent = (board.testRun === true ? 'Prøvefrøde · Nyheiter frå ' : 'Nyheiter frå ') + label(board.period);
      bindPlay(FB.el('btn-start-weekly-news'), () => quiz, status);
      FB.show('weekly-news-actions');
    } catch {
      status.textContent = 'Kunne ikkje laste nyheitsfrøda.';
    }
  }

  async function showArchive() {
    const archive = FB.el('weekly-news-archive');
    const list = FB.el('weekly-news-history');
    const status = FB.el('weekly-news-history-status');
    try {
      const { editions } = await readJson('json/weekly-archive/index.json');
      const periods = editions.filter(period => [period.edition, period.from, period.through].every(value => dateId.test(value)))
        .sort((a, b) => b.edition.localeCompare(a.edition));
      for (const period of periods) {
        const button = Vy.el('button', 'vp-button vp-button--compact', label(period));
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', 'team-setup');
        bindPlay(button, async () => readQuiz(await readJson('json/weekly-archive/' + period.edition + '.json')), status);
        list.append(button);
      }
      archive.hidden = !list.childElementCount;
    } catch {
      // Den vekentlege frøda er tilgjengeleg sjølv om arkivet ikkje kan lastast.
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    showWeeklyQuiz();
    showArchive();
  });
})(window);
