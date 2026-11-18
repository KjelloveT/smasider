/* Frødebrett — frødebibliotek og JSON-filer. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const Store = root.FrodebrettStorage;
  const Saved = {};

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

  function makeCard(quiz) {
    const card = Vy.el('article', 'vp-panel vp-panel--plain vp-panel--compact fb-quiz-card');
    const questionCount = quiz.categories.reduce((total, category) => total + category.questions.length, 0);
    const meta = quiz.categories.length + ' kategoriar · ' + questionCount + ' spørsmål'
      + (quiz.final ? ' · finalerunde' : '');
    const actions = Vy.el('div', 'vp-actions');
    actions.append(
      action('Start spel', 'vp-button--positive', 'play', quiz, () => FB.Board.selectQuiz(quiz)),
      action('Rediger', 'vp-button--tool', 'pencil', quiz, () => FB.Editor.editQuiz(quiz)),
      action('Last ned HTML', '', 'download', quiz, button => FB.Export.download(quiz, button))
    );

    const more = Vy.el('details', 'vp-accordion vp-accordion--compact');
    const moreActions = Vy.el('div', 'vp-accordion-body vp-actions');
    moreActions.append(
      action('Last ned JSON', 'vp-button--quiet', '', quiz, () => {
        Vy.downloadJson({ app: 'frodebrett', version: 1, quiz }, 'frodebrett_' + Vy.slug(quiz.title) + '.json');
      }),
      action('Slett frøde', 'vp-button--danger', '', quiz, () => {
        if (!confirm('Vil du slette «' + quiz.title + '» frå denne eininga?')) return;
        Store.deleteQuiz(quiz.id);
        Saved.render();
        status('Frøda er sletta.');
        FB.el('library-heading').focus();
      })
    );
    more.append(Vy.el('summary', '', 'Fleire val'), moreActions);

    card.append(Vy.el('h3', '', quiz.title), Vy.el('p', 'vp-help', meta), actions, more);
    return card;
  }

  Saved.render = function () {
    const quizzes = Store.getQuizzes();
    const container = FB.el('quiz-list');
    container.replaceChildren();
    if (quizzes.length) container.append(...quizzes.map(makeCard));
    else container.append(Vy.el('p', '', 'Her kjem frødene dine når du lagar ei ny eller opnar ei JSON-fil.'));
    FB.el('btn-export-all').hidden = !quizzes.length;
  };

  function status(message) {
    const el = FB.el('library-status');
    el.hidden = false;
    el.textContent = message;
  }

  function isQuiz(quiz) {
    return quiz && typeof quiz.title === 'string' && Array.isArray(quiz.categories)
      && quiz.categories.length > 0 && quiz.categories.length <= 6
      && quiz.categories.every(category => category && typeof category.name === 'string'
        && Array.isArray(category.questions) && category.questions.every(question =>
          question && (typeof question.question === 'string' || FB.Images.valid(question.image))
          && typeof question.answer === 'string'));
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
      status('Fila inneheld ingen gyldige frøder frå Frødebrett.');
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
    FB.el('btn-import-quiz').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) importFile(file);
      fileInput.value = '';
    });
    FB.el('btn-export-all').addEventListener('click', () => {
      Vy.downloadJson(Store.exportData(), 'frodebrett_alle.json');
    });
  };

  FB.Saved = Saved;
})(window);
