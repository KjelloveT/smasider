/* Frødesams — lagra frødesamsar, eksport og import.
 * Tilgjengeleg som FS.Saved.
 */
(function (root) {
  'use strict';

  const FS    = root.FS;
  const Store = root.FrodesamsStorage;

  const Saved = FS.Saved = {};

  Saved.bind = function () {
    const exportBtn = FS.el('btn-export');
    const importBtn = FS.el('btn-import');

    if (exportBtn) exportBtn.addEventListener('click', Saved.exportAll);
    if (importBtn) importBtn.addEventListener('click', Saved.importFile);
  };

  Saved.render = function () {
    const container = FS.el('saved-list');
    if (!container) return;
    container.innerHTML = '';
    const quizzes = Store.getQuizzes();

    if (!quizzes.length) {
      const p = document.createElement('p');
      p.textContent = 'Ingen lagra frødesamsar. Lag din første i editoren!';
      p.className = 'empty-state';
      container.appendChild(p);
      return;
    }

    quizzes.forEach(quiz => {
      const item = document.createElement('div');
      item.className = 'saved-item';

      const info = document.createElement('div');
      info.className = 'saved-info';

      const title = document.createElement('h3');
      title.textContent = quiz.title;

      const meta = document.createElement('p');
      meta.textContent = quiz.questions.length + ' spørsmål';

      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'saved-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-small btn-accent';
      editBtn.textContent = 'Rediger';
      editBtn.addEventListener('click', () => FS.Editor.editQuiz(quiz));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-small btn-danger';
      delBtn.setAttribute('aria-label', 'Slett ' + quiz.title);
      delBtn.textContent = 'Slett';
      delBtn.addEventListener('click', () => Saved.deleteQuiz(quiz.id));

      const exportOneBtn = document.createElement('button');
      exportOneBtn.type = 'button';
      exportOneBtn.className = 'btn btn-small';
      exportOneBtn.textContent = 'Eksporter';
      exportOneBtn.addEventListener('click', () => Saved.exportOne(quiz));

      actions.appendChild(editBtn);
      actions.appendChild(exportOneBtn);
      actions.appendChild(delBtn);

      item.appendChild(info);
      item.appendChild(actions);
      container.appendChild(item);
    });
  };

  Saved.deleteQuiz = function (id) {
    Store.deleteQuiz(id);
    Saved.render();
  };

  // Hjelpar: last ned JSON-fil
  function download(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  Saved.exportAll = function () {
    const data = Store.exportData();
    const date = new Date().toISOString().split('T')[0];
    download(data, 'frodesams-alle-' + date + '.json');
    Saved.showStatus('Alle frødesamsar eksportert!', false);
  };

  Saved.exportOne = function (quiz) {
    const data = { app: 'frodesams', version: 1, quiz, exported: new Date().toISOString() };
    const safe = quiz.title.replace(/[^a-z0-9æøå]/gi, '-').toLowerCase();
    download(data, 'frodesams-' + safe + '.json');
  };

  Saved.importFile = function () {
    const fileInput = FS.el('import-file');
    if (!fileInput || !fileInput.files[0]) {
      Saved.showStatus('Vel ei JSON-fil å importere.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        // Valider: aksepter app=frodesams eller legacy-import utan app-felt
        if (data.app && data.app !== 'frodesams') {
          Saved.showStatus('Feil filformat — dette er ikkje ei Frødesams-fil.', true);
          return;
        }
        const count = Store.importData(data);
        if (count === false || count === 0) {
          Saved.showStatus('Ingen gyldig frødesams funne i fila.', true);
        } else {
          Saved.showStatus(count + ' frødesams importert!', false);
          Saved.render();
        }
      } catch (err) {
        Saved.showStatus('Ugyldig JSON-fil.', true);
      }
    };
    reader.readAsText(fileInput.files[0]);
  };

  Saved.showStatus = function (msg, isError) {
    const el = FS.el('import-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'import-status ' + (isError ? 'import-err' : 'import-ok');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  };

})(window);
