/* Frødebrett — offentleg nyheitsfrøde frå den vekentlege publiseringa. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });

  async function showWeeklyQuiz() {
    try {
      const response = await fetch('json/weekly-news.json', { cache: 'no-cache' });
      if (!response.ok) return;
      const { app, version, period, quiz } = await response.json();
      if (app !== 'frodebrett' || version !== 1 || !period || quiz?.categories?.length !== 5) return;

      const dates = dateFormat.formatRange(new Date(period.from), new Date(period.through));
      const panel = Vy.el('section', 'vp-panel vp-panel--plain vp-panel--compact vp-stack');
      const heading = Vy.el('h2', '', 'Vekas nyheitsfrøde');
      heading.id = 'weekly-news-heading';
      panel.setAttribute('aria-labelledby', heading.id);
      const start = Vy.el('button', 'vp-button vp-button--primary', 'Spel nyheitsfrøda');
      start.type = 'button';
      start.setAttribute('aria-haspopup', 'dialog');
      start.setAttribute('aria-controls', 'team-setup');
      start.addEventListener('click', () => FB.Board.selectQuiz(quiz));
      panel.append(heading, Vy.el('p', 'vp-help', 'Nyheiter frå ' + dates), start);
      FB.el('quiz-selection').prepend(panel);
    } catch (error) {
      // Dei andre frødene kan brukast om vekefrøda er utilgjengeleg.
    }
  }

  document.addEventListener('DOMContentLoaded', showWeeklyQuiz);
})(window);
