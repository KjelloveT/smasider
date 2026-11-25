/* Frødebrett — frødebibliotek og JSON-filer. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const Store = root.FrodebrettStorage;
  const Saved = {};
  let navigationVersion = 0;

  function action(text, style, icon, quiz, run) {
    const button = Vy.el('button', 'vp-button vp-button--compact ' + style);
    button.type = 'button';
    button.setAttribute('aria-label', text + ' – ' + quiz.title);
    if (icon) {
      const marker = Vy.el('span');
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = ICON(icon, 18);
      button.append(marker);
    }
    button.append(text);
    button.addEventListener('click', () => run(button));
    return button;
  }

  Saved.makeCard = function (quiz, standard = false, loadQuiz) {
    function useQuiz(run, navigates = false) {
      return async button => {
        const version = navigates ? ++navigationVersion : navigationVersion;
        if (!loadQuiz) return run(quiz, button);

        const hadFocus = document.activeElement === button;
        let loadedQuiz;
        button.disabled = true;
        try {
          loadedQuiz = await loadQuiz();
        } catch {
          loadedQuiz = null;
        } finally {
          button.disabled = false;
        }
        if (navigates && (version !== navigationVersion || !button.getClientRects().length)) return;
        if (hadFocus && document.activeElement === document.body) button.focus();
        if (!loadedQuiz) {
          Vy.toast('Kunne ikkje laste frøda. Prøv på nytt.');
          return;
        }
        return run(loadedQuiz, button);
      };
    }

    const card = Vy.el('article', 'vp-panel vp-panel--plain vp-panel--compact fb-quiz-card');
    const meta = standard
      ? quiz.categories.map(category => category.name).filter(name => name !== 'Snodige fakta').join(' · ')
      : quiz.categories.length + ' kategoriar · '
        + quiz.categories.reduce((total, category) => total + category.questions.length, 0)
        + ' spørsmål' + (quiz.final ? ' · finalerunde' : '');
    const heading = Vy.el('h3', 'vp-panel vp-panel--soft fb-quiz-title', quiz.title);
    const start = action('Start spel', 'vp-button--positive', 'play', quiz, useQuiz(data => FB.Board.selectQuiz(data), true));
    start.setAttribute('aria-haspopup', 'dialog');
    start.setAttribute('aria-controls', 'team-setup');
    const actions = Vy.el('div', 'vp-actions');
    actions.append(
      start,
      action(standard ? 'Rediger kopi' : 'Rediger', 'vp-button--tool', 'pencil', quiz,
        useQuiz(standard ? FB.Editor.editCopy : FB.Editor.editQuiz, true))
    );
    if (!standard) {
      actions.append(action('Slett', 'vp-button--danger vp-button--quiet', 'trash2', quiz, () => {
        if (!confirm('Vil du slette «' + quiz.title + '» frå denne eininga?')) return;
        Store.deleteQuiz(quiz.id);
        Saved.render();
        status('Frøda er sletta.');
        FB.el('library-heading').focus();
      }));
    }

    const downloads = standard ? actions : Vy.el('div', 'vp-actions');
    const html = action('Last ned HTML', 'vp-button--tool', 'download', quiz, useQuiz(FB.Export.download));
    const json = action('Last ned JSON', '', 'fileJson', quiz, useQuiz(FB.Export.downloadJson));
    downloads.append(FB.Export.withHelp(html, 'html'), FB.Export.withHelp(json, 'json'));

    card.append(heading, Vy.el('p', 'vp-help', meta), actions);
    if (!standard) card.append(downloads);
    return card;
  };

  Saved.render = function () {
    const quizzes = Store.getQuizzes();
    const container = FB.el('quiz-list');
    container.replaceChildren();
    if (quizzes.length) container.append(...quizzes.map(quiz => Saved.makeCard(quiz)));
    else container.append(Vy.el('p', '', 'Her kjem frødene dine når du lagar ei ny eller importerer ei JSON-fil.'));
    FB.el('btn-export-all').hidden = !quizzes.length;
  };

  function status(message) {
    const el = FB.el('library-status');
    el.hidden = false;
    el.textContent = message;
  }

  function isQuiz(quiz) {
    return quiz && typeof quiz.title === 'string' && quiz.title.trim() && Array.isArray(quiz.categories)
      && quiz.categories.length > 0 && quiz.categories.length <= 6
      && quiz.categories.every(category => category && typeof category.name === 'string'
        && Array.isArray(category.questions) && category.questions.every(question =>
          question && (typeof question.question === 'string' || FB.Images.valid(question.image))
          && typeof question.answer === 'string'))
      && quiz.categories.some(category => category.questions.some(question =>
        FB.POINTS.includes(question.points) && question.answer.trim()
        && ((typeof question.question === 'string' && question.question.trim()) || FB.Images.valid(question.image))));
  }

  async function importFile(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      status('Kunne ikkje lese fila. Vel ei gyldig JSON-fil frå Frødebrett.');
      return;
    }

    const isFrode = data && (data.app === 'frodebrett' || data.frodebrett || data.frodetavla);
    const quizzes = isFrode && (Array.isArray(data.quizzes) ? data.quizzes : [data.quiz]);
    if (!quizzes || !quizzes.length || !quizzes.every(isQuiz)) {
      status(Array.isArray(data?._instruksar)
        ? 'Fyll ut malen med tittel, kategoriar, spørsmål og fasitsvar før du opnar fila.'
        : 'Fila inneheld ingen gyldige frøder frå Frødebrett.');
      return;
    }

    let persistent = true;
    for (const quiz of quizzes) {
      quiz.id = Store.generateId('quiz');
      quiz.created = new Date().toISOString();
      if (!Store.saveQuiz(quiz)) persistent = false;
    }
    Saved.render();
    const message = quizzes.length === 1 ? '«' + quizzes[0].title + '» er opna.' : quizzes.length + ' frøder er opna.';
    status(persistent ? message : message + ' Innhaldet ligg mellombels i denne fana. Last ned ein kopi før du lukkar sida.');
  }

  Saved.bind = function () {
    const fileInput = FB.el('import-quiz-file');
    Store.retireExamples().then(changed => {
      if (changed) Saved.render();
    });
    FB.el('btn-download-template').addEventListener('click', FB.Export.downloadTemplate);
    FB.el('btn-import-quiz').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) importFile(file);
      fileInput.value = '';
    });
    FB.el('btn-export-all').addEventListener('click', event => {
      FB.Export.downloadCollection(Store.exportData(), event.currentTarget);
    });
  };

  FB.Saved = Saved;
})(window);
