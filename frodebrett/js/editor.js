/* Frødebrett — editor: kategori-faner, validering, førehandsvising, lagring. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const S = FB.state;
  const Store = root.FrodebrettStorage;

  const Editor = {};

  Editor.bind = function () {
    S.editorCategories = [];
    S.activeTab = 0;

    FB.el('btn-add-category').addEventListener('click', () => Editor.addCategory());
    FB.el('btn-remove-category').addEventListener('click', () => Editor.removeCategory());
    FB.el('btn-save-quiz').addEventListener('click', () => Editor.saveQuiz());
    FB.el('btn-preview').addEventListener('click', () => Editor.previewQuiz());
    FB.el('btn-clear').addEventListener('click', () => Editor.clear());

    FB.el('final-round-toggle').addEventListener('change', (e) => {
      FB.el('final-round-fields').classList.toggle('hidden', !e.target.checked);
    });

    FB.el('btn-close-preview').addEventListener('click', () => FB.closeOverlay('preview-modal'));
    FB.el('btn-preview-reveal').addEventListener('click', () => FB.show('preview-answer-text'));
    FB.el('btn-preview-back').addEventListener('click', () => {
      FB.hide('preview-question');
      FB.show('preview-board');
    });

    Editor.initCategories(2);
  };

  Editor.emptyCategory = function () {
    return {
      name: '',
      questions: FB.POINTS.map(p => ({ points: p, question: '', answer: '' }))
    };
  };

  Editor.initCategories = function (count) {
    S.editorCategories = [];
    for (let i = 0; i < count; i++) S.editorCategories.push(Editor.emptyCategory());
    S.activeTab = 0;
    Editor.renderTabs();
    Editor.renderActiveTab();
  };

  Editor.renderTabs = function () {
    const container = FB.el('category-tabs');
    container.innerHTML = '';
    S.editorCategories.forEach((cat, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'box-tab' + (i === S.activeTab ? ' active' : '');
      tab.textContent = cat.name || ('Kategori ' + (i + 1));
      tab.addEventListener('click', () => {
        Editor.saveActiveTab();
        S.activeTab = i;
        Editor.renderTabs();
        Editor.renderActiveTab();
      });
      container.appendChild(tab);
    });
    FB.el('btn-remove-category').disabled = S.editorCategories.length <= 2;
    FB.el('btn-add-category').disabled = S.editorCategories.length >= 6;
  };

  Editor.renderActiveTab = function () {
    const container = FB.el('category-tab-content');
    container.innerHTML = '';
    const cat = S.editorCategories[S.activeTab];
    if (!cat) return;

    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Kategorinamn';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'form-input';
    nameInput.id = 'editor-cat-name';
    nameInput.value = cat.name;
    nameInput.placeholder = 'Skriv kategorinamn…';
    nameInput.maxLength = 30;
    nameInput.addEventListener('input', () => {
      cat.name = nameInput.value.trim();
      const tabs = document.querySelectorAll('#category-tabs .box-tab');
      if (tabs[S.activeTab]) tabs[S.activeTab].textContent = cat.name || ('Kategori ' + (S.activeTab + 1));
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    container.appendChild(nameGroup);

    FB.POINTS.forEach((p, qi) => {
      const q = cat.questions[qi] || { points: p, question: '', answer: '' };
      const row = document.createElement('div');
      row.className = 'question-input';
      row.dataset.qi = qi;

      const pl = document.createElement('span');
      pl.className = 'points-label';
      pl.textContent = p;
      row.appendChild(pl);

      const qInput = document.createElement('input');
      qInput.type = 'text';
      qInput.className = 'form-input question-text';
      qInput.value = q.question;
      qInput.placeholder = 'Spørsmål for ' + p + ' poeng';
      row.appendChild(qInput);

      const aInput = document.createElement('input');
      aInput.type = 'text';
      aInput.className = 'form-input answer-text';
      aInput.value = q.answer;
      aInput.placeholder = 'Svar';
      row.appendChild(aInput);

      container.appendChild(row);
    });
  };

  Editor.saveActiveTab = function () {
    const cat = S.editorCategories[S.activeTab];
    if (!cat) return;
    const nameInput = FB.el('editor-cat-name');
    if (nameInput) cat.name = nameInput.value.trim();
    document.querySelectorAll('#category-tab-content .question-input').forEach((row, qi) => {
      if (cat.questions[qi]) {
        cat.questions[qi].question = row.querySelector('.question-text').value.trim();
        cat.questions[qi].answer = row.querySelector('.answer-text').value.trim();
      }
    });
  };

  Editor.addCategory = function () {
    if (S.editorCategories.length >= 6) return;
    Editor.saveActiveTab();
    S.editorCategories.push(Editor.emptyCategory());
    S.activeTab = S.editorCategories.length - 1;
    Editor.renderTabs();
    Editor.renderActiveTab();
  };

  Editor.removeCategory = function () {
    if (S.editorCategories.length <= 2) return;
    S.editorCategories.splice(S.activeTab, 1);
    if (S.activeTab >= S.editorCategories.length) S.activeTab = S.editorCategories.length - 1;
    Editor.renderTabs();
    Editor.renderActiveTab();
  };

  // ---- Meldingar ----

  function messageBox(items, cls) {
    const el = FB.el('editor-errors');
    el.innerHTML = '';
    items.forEach(m => {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = '⚠ ' + m;
      el.appendChild(div);
    });
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  Editor.showError = (items) => messageBox(items, 'editor-error-item');
  Editor.showWarning = (items) => messageBox(items, 'editor-warning-item');
  Editor.hideMessages = () => FB.hide('editor-errors');

  Editor.validate = function () {
    Editor.saveActiveTab();
    const errors = [];
    const warnings = [];

    const title = FB.el('quiz-title').value.trim();
    if (!title) errors.push('Tittel manglar.');

    S.editorCategories.forEach((cat, i) => {
      if (!cat.name) errors.push('Kategori ' + (i + 1) + ' manglar namn.');
      const filled = cat.questions.filter(q => q.question && q.answer);
      if (filled.length === 0) {
        errors.push('Kategori ' + (i + 1) + ' («' + (cat.name || 'utan namn') + '») har ingen spørsmål.');
      }
      cat.questions.forEach(q => {
        if (q.question && !q.answer) {
          warnings.push('Kategori «' + (cat.name || 'Kategori ' + (i + 1)) + '», ' + q.points + ' poeng: Manglar svar.');
        }
      });
    });

    if (FB.el('final-round-toggle').checked) {
      const fc = FB.el('editor-final-category').value.trim();
      const fq = FB.el('editor-final-question').value.trim();
      const fa = FB.el('editor-final-answer').value.trim();
      if (!fc) errors.push('Finalerunde: Kategori manglar.');
      if (!fq) errors.push('Finalerunde: Spørsmål manglar.');
      if (!fa) errors.push('Finalerunde: Svar manglar.');
    }

    return { errors, warnings };
  };

  Editor.extractFinal = function () {
    const category = FB.el('editor-final-category').value.trim();
    const hint = FB.el('editor-final-clue').value.trim();
    const question = FB.el('editor-final-question').value.trim();
    const answer = FB.el('editor-final-answer').value.trim();
    if (category && question && answer) return { category, hint, question, answer };
    return null;
  };

  Editor.saveQuiz = function () {
    const { errors, warnings } = Editor.validate();
    if (errors.length) { Editor.showError(errors); return; }
    Editor.hideMessages();

    const quiz = {
      id: S.editingQuizId || Store.generateId('quiz'),
      title: FB.el('quiz-title').value.trim(),
      categories: S.editorCategories.map(cat => ({
        name: cat.name,
        questions: cat.questions.filter(q => q.question && q.answer)
      })),
      final: FB.el('final-round-toggle').checked ? Editor.extractFinal() : null,
      created: new Date().toISOString()
    };

    if (Store.saveQuiz(quiz)) {
      const el = FB.el('editor-errors');
      el.innerHTML = '';
      const ok = document.createElement('div');
      ok.className = 'editor-success';
      ok.textContent = '✓ Frøde lagra!';
      el.appendChild(ok);
      warnings.forEach(w => {
        const div = document.createElement('div');
        div.className = 'editor-warning-item';
        div.textContent = '⚠ ' + w;
        el.appendChild(div);
      });
      el.classList.remove('hidden');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        Editor.clear();
        FB.App.showScreen('saved');
      }, warnings.length ? 2000 : 800);
    } else {
      Editor.showError(['Feil ved lagring!']);
    }
  };

  // ---- Førehandsvising ----

  Editor.previewQuiz = function () {
    Editor.saveActiveTab();
    const categories = S.editorCategories.filter(c => c.name && c.questions.some(q => q.question && q.answer));
    if (categories.length === 0) {
      Editor.showError(['Legg til minst éin kategori med spørsmål for å førehandsvise.']);
      return;
    }
    Editor.hideMessages();

    FB.el('preview-title').textContent = FB.el('quiz-title').value.trim() || 'Utan tittel';

    const board = FB.el('preview-board');
    board.innerHTML = '';
    board.style.setProperty('--cols', categories.length);
    FB.show('preview-board');
    FB.hide('preview-question');

    categories.forEach((cat, ci) => {
      const color = FB.CAT_COLORS[ci % FB.CAT_COLORS.length];
      const header = document.createElement('div');
      header.className = 'jeopardy-category';
      header.style.background = color;
      header.style.color = FB.textOn(color);
      header.textContent = cat.name;
      board.appendChild(header);
    });

    FB.POINTS.forEach(pts => {
      categories.forEach((cat, ci) => {
        const q = cat.questions.find(qu => qu.points === pts && qu.question && qu.answer);
        const cell = document.createElement('div');
        cell.className = 'jeopardy-cell';
        if (q) {
          cell.style.borderColor = FB.CAT_COLORS[ci % FB.CAT_COLORS.length];
          cell.textContent = pts;
          cell.setAttribute('role', 'button');
          cell.setAttribute('tabindex', '0');
          const open = () => Editor.showPreviewQuestion(q);
          cell.addEventListener('click', open);
          cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
          });
        } else {
          cell.classList.add('answered');
        }
        board.appendChild(cell);
      });
    });

    FB.openOverlay('preview-modal');
  };

  Editor.showPreviewQuestion = function (q) {
    FB.hide('preview-board');
    FB.show('preview-question');
    FB.el('preview-question-text').textContent = q.points + ' poeng: ' + q.question;
    const ans = FB.el('preview-answer-text');
    ans.textContent = 'Svar: ' + q.answer;
    ans.classList.add('hidden');
  };

  Editor.clear = function () {
    FB.el('quiz-title').value = '';
    FB.el('editor-final-category').value = '';
    FB.el('editor-final-clue').value = '';
    FB.el('editor-final-question').value = '';
    FB.el('editor-final-answer').value = '';
    FB.el('final-round-toggle').checked = false;
    FB.hide('final-round-fields');
    S.editingQuizId = null;
    Editor.hideMessages();
    Editor.initCategories(2);
  };

  Editor.editQuiz = function (quizId) {
    const quiz = Store.getQuizzes().find(q => q.id === quizId);
    if (!quiz) { alert('Frøde ikkje funne!'); return; }

    S.editingQuizId = quizId;
    FB.el('quiz-title').value = quiz.title;
    Editor.hideMessages();

    S.editorCategories = quiz.categories.map(cat => ({
      name: cat.name,
      questions: FB.POINTS.map(p => {
        const existing = cat.questions.find(q => q.points === p);
        return existing ? { ...existing } : { points: p, question: '', answer: '' };
      })
    }));
    while (S.editorCategories.length < 2) S.editorCategories.push(Editor.emptyCategory());

    S.activeTab = 0;
    Editor.renderTabs();
    Editor.renderActiveTab();

    if (quiz.final) {
      FB.el('final-round-toggle').checked = true;
      FB.show('final-round-fields');
      FB.el('editor-final-category').value = quiz.final.category;
      FB.el('editor-final-clue').value = quiz.final.hint || '';
      FB.el('editor-final-question').value = quiz.final.question;
      FB.el('editor-final-answer').value = quiz.final.answer;
    } else {
      FB.el('final-round-toggle').checked = false;
      FB.hide('final-round-fields');
    }

    FB.App.showScreen('editor');
  };

  FB.Editor = Editor;
})(window);
