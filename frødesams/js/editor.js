/* Frødesams — quiz-editor.
 * Tilgjengeleg som FS.Editor.
 */
(function (root) {
  'use strict';

  const FS    = root.FS;
  const Store = root.FrodesamsStorage;

  const Editor = FS.Editor = {};

  let editingQuizId = null;

  // ===== INITIALISERING =====

  Editor.bind = function () {
    const container = FS.el('questions-container');
    if (!container) return;

    const addQBtn  = FS.el('btn-add-question');
    const saveBtn  = FS.el('btn-save-quiz');
    const clearBtn = FS.el('btn-clear');

    if (addQBtn)  addQBtn.addEventListener('click',  Editor.addQuestion);
    if (saveBtn)  saveBtn.addEventListener('click',  Editor.saveQuiz);
    if (clearBtn) clearBtn.addEventListener('click', Editor.clear);

    Editor.addQuestion(); // Start med eitt tomt spørsmål
  };

  // ===== SPØRSMÅL =====

  Editor.addQuestion = function () {
    const container = FS.el('questions-container');
    if (!container) return;
    const qIdx = container.children.length;

    const div = document.createElement('div');
    div.className = 'question-block box1';
    div.dataset.qindex = qIdx;

    // Heading
    const heading = document.createElement('div');
    heading.className = 'question-block-header';

    const label = document.createElement('span');
    label.className = 'question-block-label';
    label.textContent = 'Spørsmål ' + (qIdx + 1);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-icon btn-danger btn-sm';
    removeBtn.setAttribute('aria-label', 'Fjern spørsmål');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => Editor.removeQuestion(div));

    heading.appendChild(label);
    heading.appendChild(removeBtn);

    // Spørsmålstekst-input
    const qGroup = document.createElement('div');
    qGroup.className = 'form-group';

    const qLabel = document.createElement('label');
    qLabel.textContent = 'Spørsmål';

    const qInput = document.createElement('input');
    qInput.type = 'text';
    qInput.className = 'form-input editor-question';
    qInput.placeholder = 'Skriv spørsmål…';
    qInput.maxLength = 200;

    qGroup.appendChild(qLabel);
    qGroup.appendChild(qInput);

    // Svar-seksjon
    const answersSection = document.createElement('div');
    answersSection.className = 'answers-section';

    const answersLabel = document.createElement('div');
    answersLabel.className = 'form-group';
    const answersHeading = document.createElement('label');
    answersHeading.textContent = 'Svaralternativ (minst 3, sett poeng for kvart)';
    answersLabel.appendChild(answersHeading);

    const answersContainer = document.createElement('div');
    answersContainer.className = 'answers-container';

    const addABtn = document.createElement('button');
    addABtn.type = 'button';
    addABtn.className = 'btn btn-small';
    addABtn.textContent = '+ Legg til svar';
    addABtn.addEventListener('click', () => Editor.addAnswer(answersContainer));

    answersSection.appendChild(answersLabel);
    answersSection.appendChild(answersContainer);
    answersSection.appendChild(addABtn);

    div.appendChild(heading);
    div.appendChild(qGroup);
    div.appendChild(answersSection);
    container.appendChild(div);

    // Start med 3 tomme svar
    Editor.addAnswer(answersContainer);
    Editor.addAnswer(answersContainer);
    Editor.addAnswer(answersContainer);
  };

  Editor.removeQuestion = function (div) {
    const container = FS.el('questions-container');
    if (!container || container.children.length <= 1) {
      Editor.showError('Du må ha minst eitt spørsmål.');
      return;
    }
    div.remove();
    Editor.reindexQuestions();
  };

  Editor.reindexQuestions = function () {
    const container = FS.el('questions-container');
    if (!container) return;
    Array.from(container.children).forEach((div, i) => {
      div.dataset.qindex = i;
      const label = div.querySelector('.question-block-label');
      if (label) label.textContent = 'Spørsmål ' + (i + 1);
    });
  };

  // ===== SVAR =====

  Editor.addAnswer = function (container) {
    const aIdx = container.children.length;
    const row = document.createElement('div');
    row.className = 'answer-input';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'form-input editor-answer-text';
    textInput.placeholder = 'Svar…';
    textInput.maxLength = 80;

    const pointsInput = document.createElement('input');
    pointsInput.type = 'number';
    pointsInput.className = 'form-input editor-answer-points';
    pointsInput.placeholder = 'Poeng';
    pointsInput.min = 1;
    pointsInput.max = 99;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-icon btn-danger btn-sm';
    removeBtn.setAttribute('aria-label', 'Fjern svar');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      if (container.children.length <= 3) {
        Editor.showError('Kvart spørsmål treng minst 3 svar.');
        return;
      }
      row.remove();
    });

    row.appendChild(textInput);
    row.appendChild(pointsInput);
    row.appendChild(removeBtn);
    container.appendChild(row);
  };

  // ===== LAGRING =====

  Editor.saveQuiz = function () {
    Editor.hideMessages();
    const errors = Editor.validate();
    if (errors.length) { Editor.showError(errors); return; }

    const title = FS.el('quiz-title').value.trim();
    const questions = Editor.collectQuestions();

    const quiz = {
      id: editingQuizId || null,
      title,
      questions
    };

    Store.saveQuiz(quiz);
    editingQuizId = null;
    Editor.showSuccess('Frødesams lagra!');
    setTimeout(() => {
      FS.App.showScreen('saved');
    }, 800);
  };

  Editor.collectQuestions = function () {
    const questions = [];
    document.querySelectorAll('#questions-container .question-block').forEach(div => {
      const qText = div.querySelector('.editor-question').value.trim();
      if (!qText) return;

      const answers = [];
      div.querySelectorAll('.answers-container .answer-input').forEach(row => {
        const text   = row.querySelector('.editor-answer-text').value.trim();
        const points = parseInt(row.querySelector('.editor-answer-points').value) || 0;
        if (text && points > 0) answers.push({ text, points });
      });

      if (answers.length >= 3) {
        questions.push({ question: qText, answers });
      }
    });
    return questions;
  };

  Editor.validate = function () {
    const errs = [];
    const title = FS.el('quiz-title') && FS.el('quiz-title').value.trim();
    if (!title) errs.push('Tittel er obligatorisk.');

    const qBlocks = document.querySelectorAll('#questions-container .question-block');
    if (!qBlocks.length) { errs.push('Du må ha minst eitt spørsmål.'); return errs; }

    qBlocks.forEach((div, i) => {
      const qText = div.querySelector('.editor-question').value.trim();
      if (!qText) errs.push('Spørsmål ' + (i + 1) + ' manglar tekst.');

      const validAnswers = Array.from(div.querySelectorAll('.answers-container .answer-input')).filter(row => {
        const text   = row.querySelector('.editor-answer-text').value.trim();
        const points = parseInt(row.querySelector('.editor-answer-points').value) || 0;
        return text && points > 0;
      });
      if (validAnswers.length < 3) {
        errs.push('Spørsmål ' + (i + 1) + ' treng minst 3 svar med tekst og poeng (>0).');
      }
    });
    return errs;
  };

  Editor.editQuiz = function (quiz) {
    editingQuizId = quiz.id;
    FS.App.showScreen('editor');

    // Fyll inn tittel
    const titleEl = FS.el('quiz-title');
    if (titleEl) titleEl.value = quiz.title;

    // Tøm og fyll inn spørsmål
    const container = FS.el('questions-container');
    if (!container) return;
    container.innerHTML = '';

    quiz.questions.forEach(q => {
      Editor.addQuestion();
      const lastDiv = container.lastElementChild;
      if (!lastDiv) return;

      const qInput = lastDiv.querySelector('.editor-question');
      if (qInput) qInput.value = q.question;

      const answersContainer = lastDiv.querySelector('.answers-container');
      if (!answersContainer) return;
      answersContainer.innerHTML = '';

      q.answers.forEach(() => Editor.addAnswer(answersContainer));
      const rows = answersContainer.querySelectorAll('.answer-input');
      q.answers.forEach((a, i) => {
        if (rows[i]) {
          rows[i].querySelector('.editor-answer-text').value  = a.text;
          rows[i].querySelector('.editor-answer-points').value = a.points;
        }
      });
    });
  };

  Editor.clear = function () {
    editingQuizId = null;
    const titleEl = FS.el('quiz-title');
    if (titleEl) titleEl.value = '';
    const container = FS.el('questions-container');
    if (container) container.innerHTML = '';
    Editor.hideMessages();
    Editor.addQuestion();
  };

  // ===== MELDINGAR =====

  Editor.showError = function (msgs) {
    const el = FS.el('editor-errors');
    if (!el) return;
    el.innerHTML = '';
    const list = Array.isArray(msgs) ? msgs : [msgs];
    list.forEach(msg => {
      const p = document.createElement('p');
      p.className = 'editor-error-item';
      p.textContent = msg;
      el.appendChild(p);
    });
    el.classList.remove('hidden');
  };

  Editor.showSuccess = function (msg) {
    const el = FS.el('editor-errors');
    if (!el) return;
    el.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'editor-success';
    p.textContent = msg;
    el.appendChild(p);
    el.classList.remove('hidden', 'error-box');
    el.classList.add('success-box');
  };

  Editor.hideMessages = function () {
    const el = FS.el('editor-errors');
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('success-box');
    }
  };

})(window);
