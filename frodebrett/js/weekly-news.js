/* Frødebrett — offentleg nyheitsfrøde frå den vekentlege publiseringa. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });
  const dateId = /^\d{4}-\d{2}-\d{2}$/;
  let navigationVersion = 0;

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

  function bindQuizActions(play, edit, load, status) {
    const statusText = status.textContent;
    const statusHidden = status.hidden;
    let ready;
    function bind(button, activate) {
      button.addEventListener('click', async () => {
        const version = ++navigationVersion;
        const hadFocus = document.activeElement === button;
        play.disabled = edit.disabled = true;
        let quiz;
        try {
          ready ??= Promise.resolve().then(load).then(quiz => {
            if (!quiz) throw Error('Kunne ikkje laste nyheitsfrøda.');
            return quiz;
          });
          quiz = await ready;
        } catch {
          ready = null;
        } finally {
          play.disabled = edit.disabled = false;
        }
        if (version !== navigationVersion || !button.getClientRects().length) return;
        if (hadFocus && document.activeElement === document.body) button.focus();
        status.hidden = quiz ? statusHidden : false;
        status.textContent = quiz ? statusText : 'Kunne ikkje laste nyheitsfrøda. Prøv att.';
        if (quiz) activate(quiz);
      });
    }
    bind(play, FB.Board.selectQuiz);
    bind(edit, FB.Editor.editCopy);
  }

  async function showWeeklyQuiz() {
    const status = FB.el('weekly-news-period');
    try {
      const board = await readJson('json/weekly-news.json');
      const quiz = readQuiz(board);
      if (!quiz || !board.period) return;
      status.textContent = (board.testRun === true ? 'Prøvefrøde · Nyheiter frå ' : 'Nyheiter frå ') + label(board.period);
      bindQuizActions(FB.el('btn-start-weekly-news'), FB.el('btn-copy-weekly-news'), () => quiz, status);
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
        const date = label(period);
        const actions = Vy.el('div', 'vp-actions');
        const play = Vy.el('button', 'vp-button vp-button--compact', date);
        const edit = Vy.el('button', 'vp-button vp-button--tool vp-button--compact', 'Rediger kopi');
        play.type = edit.type = 'button';
        play.setAttribute('aria-haspopup', 'dialog');
        play.setAttribute('aria-controls', 'team-setup');
        edit.setAttribute('aria-label', 'Rediger kopi av nyheitsfrøda frå ' + date);
        bindQuizActions(play, edit, async () => readQuiz(await readJson('json/weekly-archive/' + period.edition + '.json')), status);
        actions.append(play, edit);
        list.append(actions);
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
