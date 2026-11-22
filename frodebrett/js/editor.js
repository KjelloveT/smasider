/* Frødebrett — kategoriar, spørsmålsfelt og lagring. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const S = FB.state;
  const Store = root.FrodebrettStorage;
  const Editor = {};
  const finalFields = {
    category: 'editor-final-category', hint: 'editor-final-clue',
    question: 'editor-final-question', answer: 'editor-final-answer'
  };
  let baseline;
  let editingQuiz;

  Editor.bind = function () {
    FB.el('btn-add-category').addEventListener('click', addCategory);
    FB.el('btn-save-quiz').addEventListener('click', Editor.saveQuiz);
    FB.el('btn-editor-start').addEventListener('click', () => {
      const quiz = prepareQuiz();
      if (quiz) FB.App.playFromEditor(quiz);
    });
    FB.Export.bindEditor(prepareQuiz);
    FB.el('btn-preview').addEventListener('click', () => Editor.previewQuiz());
    FB.el('btn-final-tab').addEventListener('click', () => selectTab('final'));
    FB.el('final-round-toggle').addEventListener('change', showFinalFields);
    FB.el('editor-screen').addEventListener('input', () => FB.hide('editor-errors'));

    FB.el('btn-close-preview').addEventListener('click', () => FB.closeOverlay('preview-modal'));
    Vy.bindOverlayClose(FB.el('preview-modal'));
    FB.el('btn-preview-reveal').addEventListener('click', () => {
      FB.show('preview-answer');
      FB.el('preview-answer-text').scrollIntoView({ block: 'nearest' });
    });
    FB.el('btn-preview-back').addEventListener('click', () => {
      FB.hide('preview-question');
      FB.show('preview-board');
    });
  };

  function emptyQuestion(points) {
    return { points, question: '', answer: '' };
  }

  function makeCategory(category) {
    return {
      name: category?.name || '',
      questions: FB.POINTS.map(points => ({
        ...emptyQuestion(points), ...category?.questions.find(q => q.points === points)
      }))
    };
  }

  function tabName(category, index) {
    return category.name || 'Kategori ' + (index + 1);
  }

  function hasQuestion(q) {
    return Boolean(q.question || FB.Images.valid(q.image));
  }

  function isComplete(q) {
    return hasQuestion(q) && Boolean(q.answer);
  }

  function field(id, text, value, multiline = false) {
    const label = Vy.el('label', 'vp-field');
    label.htmlFor = id;
    const input = Vy.el(multiline ? 'textarea' : 'input', 'vp-input');
    input.id = id;
    if (multiline) input.rows = 3;
    else input.type = 'text';
    input.value = value;
    label.append(Vy.el('strong', '', text), input);
    return { label, input };
  }

  function selectTab(index) {
    S.activeTab = index;
    const isFinal = index === 'final';
    const tabs = [...FB.el('category-tabs').children];
    tabs.forEach((tab, i) => {
      const selected = tab.id === 'btn-final-tab' ? isFinal : i === index;
      tab.setAttribute('aria-pressed', String(selected));
    });
    FB.el('category-name-fields').hidden = isFinal;
    FB.el('category-tab-content').hidden = isFinal;
    FB.el('editor-final-section').hidden = !isFinal;
    if (!isFinal) renderCategory();
  }

  function updateCategoryTab(tab, category, index) {
    const started = category.questions.filter(q => hasQuestion(q) || q.answer);
    const ready = Boolean(category.name && started.length && started.every(isComplete));
    const label = tabName(category, index);
    const description = ready ? 'Klar til spel' : 'Ikkje klar til spel';
    const status = tab.querySelector('.fb-category-status');
    tab.querySelector('.fb-tab-name').textContent = label;
    tab.setAttribute('aria-label', label + ' · ' + description);
    if (status.dataset.ready !== String(ready)) {
      status.dataset.ready = String(ready);
      status.title = description;
      status.innerHTML = ICON(ready ? 'check' : 'circle', 16);
    }
  }

  function renderTabs() {
    const tabs = S.editorCategories.map((category, i) => {
      const tab = Vy.el('button', 'vp-button vp-button--compact');
      tab.type = 'button';
      tab.setAttribute('aria-controls', 'category-name-fields category-tab-content');
      const mark = Vy.el('span', 'vp-selection-mark');
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = ICON('check', 18);
      const status = Vy.el('span', 'fb-category-status');
      status.setAttribute('aria-hidden', 'true');
      tab.append(mark, Vy.el('span', 'fb-tab-name'), status);
      updateCategoryTab(tab, category, i);
      tab.addEventListener('click', () => {
        if (S.activeTab !== i) selectTab(i);
      });
      return tab;
    });
    FB.el('category-tabs').replaceChildren(...tabs, FB.el('btn-final-tab'));
    FB.el('btn-add-category').disabled = tabs.length >= 6;
  }

  function editImage(question, label, onChange = () => {}) {
    const details = Vy.el('details', 'vp-accordion vp-accordion--compact fb-image-details');
    const summary = Vy.el('summary');
    const body = Vy.el('div', 'vp-accordion-body');
    function update() {
      summary.textContent = FB.Images.valid(question.image) ? 'Bilete lagt til' : 'Bilete (valfritt)';
      onChange();
    }
    body.append(FB.Images.control(question, label, update));
    details.append(summary, body);
    update();
    return details;
  }

  function makeQuestionRow(question, onChange) {
    const details = Vy.el('details', 'vp-accordion fb-question');
    details.name = 'editor-questions';
    const summary = Vy.el('summary');
    const title = Vy.el('span', 'fb-question-summary');
    const status = Vy.el('span', 'fb-question-status');
    const prompt = Vy.el('span', 'fb-question-snippet');
    title.append(Vy.el('strong', 'fb-question-points', question.points + ' poeng'), prompt);
    summary.append(title, status);

    const body = Vy.el('div', 'vp-accordion-body vp-stack');
    const fields = Vy.el('div', 'fb-question-fields');
    const questionField = field('editor-question-' + question.points, 'Spørsmål', question.question, true);
    const answerField = field('editor-answer-' + question.points, 'Fasitsvar', question.answer, true);
    function update() {
      const hasImage = FB.Images.valid(question.image);
      prompt.textContent = question.question || (hasImage ? 'Biletspørsmål' : '');
      status.textContent = isComplete(question) ? 'Klar'
        : hasQuestion(question) ? 'Manglar fasit'
        : question.answer ? 'Manglar spørsmål' : 'Tom';
      status.dataset.state = isComplete(question) ? 'ready' : hasQuestion(question) || question.answer ? 'partial' : 'empty';
      onChange();
    }
    questionField.input.addEventListener('input', () => {
      question.question = questionField.input.value.trim();
      update();
    });
    answerField.input.addEventListener('input', () => {
      question.answer = answerField.input.value.trim();
      update();
    });
    fields.append(questionField.label, answerField.label);
    body.append(fields, editImage(question, question.points + ' poeng', update));
    details.append(summary, body);
    return details;
  }

  function renderCategory() {
    const category = S.editorCategories[S.activeTab];
    const nameFields = FB.el('category-name-fields');
    const questions = FB.el('category-tab-content');
    const syncTab = () => {
      const index = S.editorCategories.indexOf(category);
      if (index >= 0) updateCategoryTab(FB.el('category-tabs').children[index], category, index);
    };
    const name = field('editor-cat-name', 'Kategorinamn', category.name);
    name.input.maxLength = 30;
    name.input.addEventListener('input', () => {
      category.name = name.input.value.trim();
      syncTab();
    });
    nameFields.replaceChildren(name.label);
    if (S.editorCategories.length > 2) {
      const remove = Vy.el('button', 'vp-button vp-button--danger vp-button--quiet vp-button--compact', 'Fjern kategori');
      remove.type = 'button';
      remove.addEventListener('click', () => {
        if ((category.name || category.questions.some(q => hasQuestion(q) || q.answer))
          && !confirm('Vil du fjerne «' + tabName(category, S.activeTab) + '» og spørsmåla i kategorien?')) return;
        S.editorCategories.splice(S.activeTab, 1);
        renderTabs();
        selectTab(Math.min(S.activeTab, S.editorCategories.length - 1));
        FB.el('category-tabs').children[S.activeTab].focus();
      });
      nameFields.append(remove);
    }
    questions.replaceChildren(...category.questions.map(question => makeQuestionRow(question, syncTab)));
    if (!category.questions.some(q => hasQuestion(q) || q.answer)) questions.firstElementChild.open = true;
  }

  function addCategory() {
    if (S.editorCategories.length >= 6) return;
    S.editorCategories.push(makeCategory());
    renderTabs();
    selectTab(S.editorCategories.length - 1);
    FB.el('editor-cat-name').focus();
  }

  function showFinalFields() {
    const enabled = FB.el('final-round-toggle').checked;
    FB.el('editor-final-state').textContent = enabled ? 'På' : 'Av';
    FB.el('final-round-fields').classList.toggle('hidden', !enabled);
  }

  function readFinal() {
    const final = { ...S.editorFinalImage };
    Object.entries(finalFields).forEach(([key, id]) => { final[key] = FB.el(id).value.trim(); });
    return final;
  }

  function snapshot() {
    return JSON.stringify([
      FB.el('quiz-title').value.trim(), S.editorCategories, FB.el('final-round-toggle').checked, readFinal()
    ]);
  }

  Editor.canLeave = function () {
    return (!FB.Images.busy() && snapshot() === baseline)
      || confirm('Vil du gå attende utan å lagre endringane?');
  };

  function showMessage(messages, kind) {
    const box = FB.el('editor-errors');
    box.className = 'vp-notice vp-notice--' + kind;
    const marker = Vy.el('span', 'vp-notice-icon');
    marker.setAttribute('aria-hidden', 'true');
    marker.innerHTML = ICON(kind === 'success' ? 'check' : 'alertTriangle', 22);
    const content = Vy.el('div');
    if (messages.length === 1) content.append(Vy.el('strong', '', messages[0]));
    else {
      const list = Vy.el('ul');
      list.append(...messages.map(message => Vy.el('li', '', message)));
      content.append(Vy.el('strong', '', 'Sjå over desse felta'), list);
    }
    box.replaceChildren(marker, content);
    box.focus();
  }

  Editor.showError = messages => showMessage(messages, 'error');

  function prepareQuiz() {
    const errors = [];
    if (FB.Images.busy()) errors.push('Vent til biletet er ferdig handsama.');
    const title = FB.el('quiz-title').value.trim();
    if (!title) errors.push('Gje frøda ein tittel.');

    S.editorCategories.forEach((category, i) => {
      const name = tabName(category, i);
      if (!category.name) errors.push(name + ' manglar namn.');
      if (!category.questions.some(isComplete)) errors.push(name + ' treng minst eitt ferdig spørsmål.');
      category.questions.forEach(q => {
        if (hasQuestion(q) && !q.answer) errors.push(name + ', ' + q.points + ' poeng, manglar fasitsvar.');
        if (!hasQuestion(q) && q.answer) errors.push(name + ', ' + q.points + ' poeng, manglar spørsmål eller bilete.');
      });
    });

    const final = FB.el('final-round-toggle').checked ? readFinal() : null;
    if (final) {
      if (!final.category) errors.push('Finalerunden manglar kategori.');
      if (!hasQuestion(final)) errors.push('Finalerunden manglar spørsmål eller bilete.');
      if (!final.answer) errors.push('Finalerunden manglar fasitsvar.');
    }

    if (errors.length) {
      Editor.showError(errors);
      return null;
    }
    FB.hide('editor-errors');
    return {
      title,
      categories: S.editorCategories.map(category => ({
        name: category.name, questions: category.questions.filter(isComplete)
      })),
      final
    };
  }

  Editor.saveQuiz = function () {
    const quiz = prepareQuiz();
    if (!quiz) return;
    quiz.id = editingQuiz?.id || Store.generateId('quiz');
    quiz.created = editingQuiz?.created || new Date().toISOString();
    const persistent = Store.saveQuiz(quiz);
    editingQuiz = quiz;
    baseline = snapshot();
    updateSaveLabel();
    if (persistent) showMessage(['«' + quiz.title + '» er lagra.'], 'success');
    else showMessage(['Frøda ligg mellombels i denne fana. Last ned ein kopi før du lukkar sida.'], 'warning');
  };


  // ---- Førehandsvising ----

  Editor.previewQuiz = function () {
    if (FB.Images.busy()) { Editor.showError(['Vent til biletet er ferdig handsama.']); return; }
    const categories = S.editorCategories.filter(c => c.name && c.questions.some(isComplete));
    if (categories.length === 0) {
      Editor.showError(['Legg til minst éin kategori med spørsmål for å førehandsvise.']);
      return;
    }
    FB.hide('editor-errors');
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
        const q = cat.questions.find(qu => qu.points === pts && isComplete(qu));
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
    FB.Images.show('preview-question-image', q);
    FB.el('preview-answer-text').textContent = q.answer;
    FB.hide('preview-answer');
    FB.el('preview-modal').querySelector('.preview-modal').scrollTop = 0;
  };

  function updateSaveLabel() {
    FB.el('editor-heading').textContent = editingQuiz ? 'Rediger frøda' : 'Ny frøde';
    const saveLabel = editingQuiz?.id ? 'Lagre endringar' : editingQuiz ? 'Lagre kopi' : 'Lagre frøde';
    FB.el('editor-save-label').textContent = saveLabel;
  }

  function openEditor(quiz) {
    editingQuiz = quiz;
    FB.el('quiz-title').value = quiz?.title || '';
    FB.hide('editor-errors');

    S.editorCategories = (quiz?.categories || []).map(makeCategory);
    while (S.editorCategories.length < 2) S.editorCategories.push(makeCategory());
    renderTabs();
    selectTab(0);

    const final = quiz?.final;
    S.editorFinalImage = { image: final?.image, imageAlt: final?.imageAlt, imageCredit: final?.imageCredit };
    FB.el('editor-final-image').replaceChildren(editImage(S.editorFinalImage, 'finalspørsmålet'));
    Object.entries(finalFields).forEach(([key, id]) => { FB.el(id).value = final?.[key] || ''; });
    FB.el('final-round-toggle').checked = Boolean(final);
    showFinalFields();
    updateSaveLabel();
    baseline = snapshot();

    FB.App.showScreen('editor');
    FB.el(quiz ? 'editor-heading' : 'quiz-title').focus();
  }

  Editor.newQuiz = () => openEditor(null);
  Editor.editQuiz = openEditor;
  FB.Editor = Editor;
})(window);
