/* ══════════════════════════════════════════════
   FRØDEKAPP — Quiz-editor
   Lag og rediger quiz-ar. Lagrar via VyrdepilStorage.
   ══════════════════════════════════════════════ */

class QuizEditor {
    constructor() {
        this.quiz = this.emptyQuiz();
        this.dragSrcIndex = null;
        this.init();
    }

    emptyQuiz() {
        return {
            id: '',
            title: '',
            description: '',
            author: '',
            created: new Date().toISOString().split('T')[0],
            tags: [],
            questions: []
        };
    }

    init() {
        document.getElementById('btn-add-question').addEventListener('click', () => this.addQuestion());
        document.getElementById('btn-add-question-bottom').addEventListener('click', () => {
            this.syncFromForm();
            this.addQuestion();
        });
        document.getElementById('btn-preview').addEventListener('click', () => this.showPreview());
        document.getElementById('btn-download').addEventListener('click', () => this.downloadQuiz());
        document.getElementById('btn-save-local').addEventListener('click', () => this.saveToLocalLibrary());
        document.getElementById('btn-save-draft').addEventListener('click', () => this.saveDraft());
        document.getElementById('btn-load-draft').addEventListener('click', () => this.loadDraft());
        document.getElementById('upload-json').addEventListener('change', (e) => this.uploadJSON(e));
        document.getElementById('btn-close-preview').addEventListener('click', () => this.closePreview());

        // Escape lukkar førehandsvisinga
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closePreview();
        });

        // Event delegation for spørsmål-knappar
        document.getElementById('questions-list').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const index = parseInt(btn.dataset.index);
            const target = parseInt(btn.dataset.target);
            if (btn.classList.contains('btn-move-up') || btn.classList.contains('btn-move-down')) {
                this.syncFromForm();
                this.moveQuestion(index, target);
            } else if (btn.classList.contains('btn-duplicate')) {
                this.syncFromForm();
                this.duplicateQuestion(index);
            } else if (btn.classList.contains('btn-remove')) {
                this.syncFromForm();
                this.removeQuestion(index);
            }
        });

        // Auto-lagre utkast kvart 30. sekund
        setInterval(() => this.saveDraft(true), 30000);

        this.render();
        this.tryLoadAutoDraft();
    }

    addQuestion() {
        this.quiz.questions.push({ question: '', options: ['', '', '', ''], correct: 0, timeLimit: 20 });
        this.render();
        setTimeout(() => {
            const items = document.querySelectorAll('.question-item');
            if (items.length > 0) items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    }

    removeQuestion(index) {
        if (this.quiz.questions.length <= 1) {
            UI.toast('Du må ha minst eitt spørsmål', 'error');
            return;
        }
        this.quiz.questions.splice(index, 1);
        this.render();
    }

    duplicateQuestion(index) {
        const copy = JSON.parse(JSON.stringify(this.quiz.questions[index]));
        this.quiz.questions.splice(index + 1, 0, copy);
        this.render();
    }

    moveQuestion(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.quiz.questions.length) return;
        const [item] = this.quiz.questions.splice(fromIndex, 1);
        this.quiz.questions.splice(toIndex, 0, item);
        this.render();
    }

    syncFromForm() {
        this.quiz.title = document.getElementById('quiz-title').value.trim();
        this.quiz.description = document.getElementById('quiz-desc').value.trim();
        this.quiz.author = document.getElementById('quiz-author').value.trim();
        this.quiz.tags = document.getElementById('quiz-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        this.quiz.id = this.quiz.title.toLowerCase().replace(/[^a-zæøå0-9]+/g, '-').replace(/^-|-$/g, '') || 'ny-quiz';

        document.querySelectorAll('.question-item').forEach((el, i) => {
            if (!this.quiz.questions[i]) return;
            const q = this.quiz.questions[i];
            q.question = el.querySelector('.q-text').value.trim();
            q.timeLimit = parseInt(el.querySelector('.q-time').value) || 20;
            q.correct = parseInt(el.querySelector('.q-correct').value) || 0;
            el.querySelectorAll('.q-option').forEach((opt, j) => { q.options[j] = opt.value.trim(); });
        });
    }

    /* ── Rendring (DOM-API, ingen innerHTML med brukartekst) ── */

    render() {
        const list = document.getElementById('questions-list');
        list.textContent = '';
        this.quiz.questions.forEach((q, i) => list.appendChild(this.renderQuestion(q, i)));
        UI.setText('question-count', `${this.quiz.questions.length} spørsmål`);
    }

    iconBtn(name, cls, label, dataset = {}) {
        const b = document.createElement('button');
        b.className = `btn btn-small icon-btn ${cls}`;
        b.type = 'button';
        b.setAttribute('aria-label', label);
        b.title = label;
        b.innerHTML = ICON(name, 16);
        Object.entries(dataset).forEach(([k, v]) => { b.dataset[k] = v; });
        return b;
    }

    renderQuestion(q, i) {
        const item = document.createElement('div');
        item.className = 'question-item box1';
        item.draggable = true;
        item.dataset.index = i;
        this.bindDrag(item, i);

        // Topprad: grep + tittel + kontrollar
        const head = document.createElement('div');
        head.className = 'q-head';
        const grip = document.createElement('span');
        grip.className = 'q-grip';
        grip.innerHTML = ICON('grip', 18);
        grip.append(` Spørsmål ${i + 1}`);
        const controls = document.createElement('div');
        controls.className = 'q-controls';
        controls.append(
            this.iconBtn('arrowUp', 'btn-move-up', 'Flytt opp', { index: i, target: i - 1 }),
            this.iconBtn('arrowDown', 'btn-move-down', 'Flytt ned', { index: i, target: i + 1 }),
            this.iconBtn('copy', 'btn-duplicate', 'Dupliser', { index: i }),
            this.iconBtn('trash', 'btn-remove btn-danger', 'Slett', { index: i })
        );
        head.append(grip, controls);

        // Spørsmålstekst
        const qGroup = document.createElement('div');
        qGroup.className = 'form-group';
        const qLabel = document.createElement('label');
        qLabel.textContent = 'Spørsmål';
        const qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'form-input q-text';
        qInput.placeholder = 'Skriv spørsmålet her…';
        qInput.value = q.question || '';
        qGroup.append(qLabel, qInput);

        // Alternativ
        const optGrid = document.createElement('div');
        optGrid.className = 'q-options-grid';
        q.options.forEach((opt, j) => {
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.className = 'q-option-label';
            const swatch = document.createElement('span');
            swatch.className = `answer-swatch ${QuizEngine.ANSWER_CLASSES[j]}`;
            swatch.textContent = String.fromCharCode(65 + j);
            label.append(swatch, document.createTextNode(` Alternativ ${String.fromCharCode(65 + j)}`));
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input q-option';
            input.placeholder = `Alternativ ${String.fromCharCode(65 + j)}`;
            input.value = opt || '';
            group.append(label, input);
            optGrid.appendChild(group);
        });

        // Botnrad: rett svar + tidsfrist
        const footer = document.createElement('div');
        footer.className = 'q-footer';
        const cGroup = document.createElement('div');
        cGroup.className = 'form-group';
        const cLabel = document.createElement('label');
        cLabel.textContent = 'Rett svar';
        const select = document.createElement('select');
        select.className = 'form-input q-correct';
        q.options.forEach((_, j) => {
            const o = document.createElement('option');
            o.value = j;
            o.textContent = String.fromCharCode(65 + j);
            if (j === q.correct) o.selected = true;
            select.appendChild(o);
        });
        cGroup.append(cLabel, select);
        const tGroup = document.createElement('div');
        tGroup.className = 'form-group';
        const tLabel = document.createElement('label');
        tLabel.textContent = 'Tidsfrist (sek)';
        const tInput = document.createElement('input');
        tInput.type = 'number';
        tInput.className = 'form-input q-time';
        tInput.min = 5; tInput.max = 120; tInput.value = q.timeLimit;
        tGroup.append(tLabel, tInput);
        footer.append(cGroup, tGroup);

        item.append(head, qGroup, optGrid, footer);
        return item;
    }

    bindDrag(item, i) {
        item.addEventListener('dragstart', (e) => {
            this.dragSrcIndex = i;
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.question-item').forEach(el => el.classList.remove('drag-over'));
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (this.dragSrcIndex !== null && this.dragSrcIndex !== i) {
                this.syncFromForm();
                this.moveQuestion(this.dragSrcIndex, i);
            }
            this.dragSrcIndex = null;
        });
    }

    /* ── Førehandsvising ── */

    showPreview() {
        this.syncFromForm();
        const validation = QuizEngine.validateQuiz(this.quiz);
        const container = document.getElementById('preview-content');
        container.textContent = '';

        if (!validation.valid) {
            const box = document.createElement('div');
            box.className = 'box1 preview-errors';
            const h = document.createElement('h3');
            h.textContent = 'Valideringsfeil';
            const ul = document.createElement('ul');
            validation.errors.forEach(err => {
                const li = document.createElement('li');
                li.textContent = err;
                ul.appendChild(li);
            });
            box.append(h, ul);
            container.appendChild(box);
        } else {
            const meta = document.createElement('div');
            meta.className = 'box1';
            const title = document.createElement('h2');
            title.textContent = this.quiz.title;
            const desc = document.createElement('p');
            desc.textContent = this.quiz.description || '';
            meta.append(title, desc);
            container.appendChild(meta);

            this.quiz.questions.forEach((q, i) => {
                const card = document.createElement('div');
                card.className = 'box1 preview-q';
                const qh = document.createElement('div');
                qh.className = 'preview-q-text';
                qh.textContent = `${i + 1}. ${q.question}`;
                const opts = document.createElement('div');
                opts.className = 'preview-options';
                q.options.forEach((opt, j) => {
                    const o = document.createElement('div');
                    o.className = 'preview-option' + (j === q.correct ? ` correct ${QuizEngine.ANSWER_CLASSES[j]}` : '');
                    o.textContent = `${String.fromCharCode(65 + j)}) ${opt}`;
                    opts.appendChild(o);
                });
                const time = document.createElement('div');
                time.className = 'preview-time';
                time.textContent = `${q.timeLimit} sek`;
                card.append(qh, opts, time);
                container.appendChild(card);
            });
        }

        document.getElementById('preview-overlay').classList.add('open');
    }

    closePreview() {
        document.getElementById('preview-overlay').classList.remove('open');
    }

    /* ── Eksport / lagring ── */

    exportObject() {
        // app/version på toppnivå (AGENTS §5.2)
        const { local, savedAt, ...rest } = this.quiz;
        return { app: 'frodekapp', version: 1, ...rest };
    }

    downloadQuiz() {
        this.syncFromForm();
        const validation = QuizEngine.validateQuiz(this.quiz);
        if (!validation.valid) {
            UI.toast('Quiz har feil: ' + validation.errors[0], 'error');
            return;
        }
        const json = JSON.stringify(this.exportObject(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.quiz.id || 'quiz') + '.json';
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('Quiz lasta ned!', 'success');
    }

    saveDraft(silent = false) {
        this.syncFromForm();
        FKStorage.saveDraft(this.quiz);
        if (silent !== true) UI.toast('Utkast lagra!', 'success');
    }

    loadDraft() {
        const data = FKStorage.getDraft();
        if (!data) { UI.toast('Ingen utkast funne', 'error'); return; }
        this.quiz = data;
        this.populateForm();
        this.render();
        UI.toast('Utkast lasta!', 'success');
    }

    tryLoadAutoDraft() {
        const data = FKStorage.getDraft();
        if (data) {
            this.quiz = data;
            this.populateForm();
            this.render();
        }
    }

    populateForm() {
        document.getElementById('quiz-title').value = this.quiz.title || '';
        document.getElementById('quiz-desc').value = this.quiz.description || '';
        document.getElementById('quiz-author').value = this.quiz.author || '';
        document.getElementById('quiz-tags').value = (this.quiz.tags || []).join(', ');
    }

    saveToLocalLibrary() {
        this.syncFromForm();
        const validation = QuizEngine.validateQuiz(this.quiz);
        if (!validation.valid) {
            UI.toast('Kan ikkje lagre: ' + validation.errors[0], 'error');
            return;
        }
        FKStorage.saveQuiz(this.quiz);
        UI.toast('Quiz lagra til lokalt bibliotek!', 'success');
    }

    uploadJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                const validation = QuizEngine.validateQuiz(data);
                if (!validation.valid) {
                    UI.toast('Ugyldig quiz-fil: ' + validation.errors[0], 'error');
                    return;
                }
                this.quiz = data;
                this.populateForm();
                this.render();
                UI.toast('Quiz lasta frå fil!', 'success');
            } catch (err) {
                UI.toast('Kunne ikkje lese fila: ugyldig JSON', 'error');
            }
        };
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.editor = new QuizEditor(); });
