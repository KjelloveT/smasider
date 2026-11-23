/* Frødebrett — offentleg nyheitsfrøde frå den vekentlege publiseringa. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });
  const mediaPath = /^json\/weekly-media\/[a-f0-9]{24}\.(jpg|png|webp)$/;

  async function loadPhoto(question) {
    const path = question.image;
    if (!mediaPath.test(path)) return;
    delete question.image;
    try {
      const response = await fetch(path);
      if (!response.ok) return;
      const blob = await response.blob();
      if (blob.size > 195000) return;
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (FB.Images.valid(image)) question.image = image;
    } catch {
      // Eit bilete som ikkje kan lastast, skal ikkje hindre spelstart.
    }
  }

  async function showWeeklyQuiz() {
    const status = FB.el('weekly-news-period');
    try {
      const response = await fetch('json/weekly-news.json', { cache: 'no-cache' });
      if (!response.ok) throw Error('Kunne ikkje laste nyheitsfrøda.');
      const { app, version, period, quiz, testRun } = await response.json();
      if (app !== 'frodebrett' || version !== 1 || !period || quiz?.categories?.length !== 5) return;

      const dates = dateFormat.formatRange(new Date(period.from), new Date(period.through));
      status.textContent = (testRun === true ? 'Prøvefrøde · Nyheiter frå ' : 'Nyheiter frå ') + dates;
      const start = FB.el('btn-start-weekly-news');
      const questions = [...quiz.categories.flatMap(category => category.questions), quiz.final].filter(Boolean);
      let photos;
      start.addEventListener('click', async () => {
        start.disabled = true;
        try {
          photos ??= Promise.all(questions.map(loadPhoto));
          await photos;
          FB.Board.selectQuiz(quiz);
        } finally {
          start.disabled = false;
        }
      });
      FB.show('weekly-news-actions');
    } catch (error) {
      status.textContent = 'Kunne ikkje laste nyheitsfrøda.';
    }
  }

  document.addEventListener('DOMContentLoaded', showWeeklyQuiz);
})(window);
