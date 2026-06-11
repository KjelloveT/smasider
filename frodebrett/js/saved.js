/* Frødebrett — lagra frøder + eksport/import (inkl. eksporter alle). */
(function (root) {
  'use strict';

  const FB = root.FB;
  const Store = root.FrodebrettStorage;

  const Saved = {};

  Saved.bind = function () {
    FB.el('btn-export-quiz').addEventListener('click', () => Saved.exportQuiz());
    FB.el('btn-export-all').addEventListener('click', () => Saved.exportAll());
    FB.el('btn-import-quiz').addEventListener('click', () => FB.el('import-quiz-file').click());
    FB.el('import-quiz-file').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        Saved.importFile(e.target.files[0]);
        e.target.value = '';
      }
    });
  };

  Saved.render = function () {
    const quizzes = Store.getQuizzes();
    const container = FB.el('saved-list');
    container.innerHTML = '';

    if (quizzes.length === 0) {
      const p = document.createElement('p');
      p.className = 'fb-muted';
      p.textContent = 'Ingen lagra frøder.';
      container.appendChild(p);
    } else {
      quizzes.forEach(quiz => {
        const item = document.createElement('div');
        item.className = 'saved-item';

        const info = document.createElement('div');
        const h = document.createElement('h3');
        h.textContent = quiz.title;
        info.appendChild(h);
        const meta = document.createElement('p');
        const nQ = quiz.categories.reduce((s, c) => s + c.questions.length, 0);
        meta.textContent = quiz.categories.length + ' kategoriar · ' + nQ + ' spørsmål'
          + (quiz.final ? ' · finalerunde' : '');
        info.appendChild(meta);
        item.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'saved-actions';

        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-small';
        edit.textContent = 'Rediger';
        edit.addEventListener('click', () => FB.Editor.editQuiz(quiz.id));
        actions.appendChild(edit);

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn-small btn-danger';
        del.textContent = 'Slett';
        del.addEventListener('click', () => Saved.deleteQuiz(quiz.id));
        actions.appendChild(del);

        item.appendChild(actions);
        container.appendChild(item);
      });
    }

    Saved.populateExportSelect(quizzes);
  };

  Saved.populateExportSelect = function (quizzes) {
    const select = FB.el('export-quiz-select');
    if (!select) return;
    select.innerHTML = '';
    const first = document.createElement('option');
    first.value = '';
    first.textContent = 'Vel ein frøde…';
    select.appendChild(first);
    (quizzes || Store.getQuizzes()).forEach(q => {
      const opt = document.createElement('option');
      opt.value = q.id;
      opt.textContent = q.title;
      select.appendChild(opt);
    });
  };

  function safeName(title) {
    return (title || 'froede').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').replace(/ /g, '_') || 'froede';
  }

  function download(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  Saved.exportQuiz = function () {
    const quizId = FB.el('export-quiz-select').value;
    if (!quizId) { alert('Vel ein frøde å eksportere!'); return; }
    const quiz = Store.getQuizzes().find(q => q.id === quizId);
    if (!quiz) return;
    download({ app: 'frodebrett', version: 1, quiz }, 'frodebrett_' + safeName(quiz.title) + '.json');
  };

  Saved.exportAll = function () {
    const quizzes = Store.getQuizzes();
    if (quizzes.length === 0) { alert('Ingen frøder å eksportere!'); return; }
    download(Store.exportData(), 'frodebrett_alle.json');
  };

  function status(msg, ok) {
    const el = FB.el('import-status');
    el.innerHTML = '';
    const span = document.createElement('span');
    span.className = ok ? 'import-ok' : 'import-err';
    span.textContent = (ok ? '✓ ' : '⚠ ') + msg;
    el.appendChild(span);
    el.classList.remove('hidden');
  }

  Saved.importFile = function (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch (err) {
        status('Kunne ikkje lese fila. Er det ei gyldig .json-fil?', false);
        return;
      }

      const isFrode = data && (data.app === 'frodebrett' || data.frodebrett || data.frodetavla);

      // Bulk: { quizzes: [...] }
      if (isFrode && Array.isArray(data.quizzes)) {
        let n = 0;
        data.quizzes.forEach(q => {
          if (q && q.categories) {
            q.id = Store.generateId('quiz');
            q.created = new Date().toISOString();
            if (Store.saveQuiz(q)) n++;
          }
        });
        status(n + ' frøde(r) importert!', true);
        Saved.render();
        return;
      }

      // Enkel: { quiz: {...} }
      if (isFrode && data.quiz && data.quiz.categories) {
        const quiz = data.quiz;
        quiz.id = Store.generateId('quiz');
        quiz.created = new Date().toISOString();
        if (Store.saveQuiz(quiz)) {
          status('«' + quiz.title + '» importert!', true);
          Saved.render();
        } else {
          status('Feil ved lagring.', false);
        }
        return;
      }

      status('Ugyldig fil. Fila må vere eksportert frå Frødebrett.', false);
    };
    reader.readAsText(file);
  };

  Saved.deleteQuiz = function (quizId) {
    if (confirm('Er du sikker på at du vil slette denne frøden?')) {
      Store.deleteQuiz(quizId);
      Saved.render();
    }
  };

  FB.Saved = Saved;
})(window);
