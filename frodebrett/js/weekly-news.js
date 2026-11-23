/* Frødebrett — offentleg nyheitsfrøde frå den vekentlege publiseringa. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });

  async function showWeeklyQuiz() {
    const status = FB.el('weekly-news-period');
    try {
      const response = await fetch('json/weekly-news.json', { cache: 'no-cache' });
      if (!response.ok) throw Error('Kunne ikkje laste nyheitsfrøda.');
      const { app, version, period, quiz, testRun } = await response.json();
      if (app !== 'frodebrett' || version !== 1 || !period || quiz?.categories?.length !== 5) return;

      const dates = dateFormat.formatRange(new Date(period.from), new Date(period.through));
      status.textContent = (testRun === true ? 'Prøvefrøde · Nyheiter frå ' : 'Nyheiter frå ') + dates;
      FB.el('btn-start-weekly-news').addEventListener('click', () => FB.Board.selectQuiz(quiz));
      FB.show('weekly-news-actions');
    } catch (error) {
      status.textContent = 'Kunne ikkje laste nyheitsfrøda.';
    }
  }

  document.addEventListener('DOMContentLoaded', showWeeklyQuiz);
})(window);
