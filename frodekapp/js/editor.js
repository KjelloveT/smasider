/* ══════════════════════════════════════════════
   FRØDEKAPP — Quiz-editor
   GUI for å lage og redigere quiz-ar
   ══════════════════════════════════════════════ */

class QuizEditor {
    constructor() {
        this.quiz = {
            id: '',
            title: '',
            description: '',
            author: '',
            created: new Date().toISOString().split('T')[0],
            tags: [],
            questions: []
        };
        this.dragSrcIndex = null;
        this.init();
    }

    init() {
        // Knappar
        document.getElementById('btn-add-question').addEventListener('click', () => this.addQuestion());
        document.getElementById('btn-preview').addEventListener('click', () => this.preview());
        document.getElementById('btn-download').addEventListener('click', () => this.downloadJSON());
        document.getElementById('btn-save-local').addEventListener('click', () => this.saveToLocalLibrary());
        document.getElementById('btn-save-draft').addEventListener('click', () => this.saveDraft());
        document.getElementById('btn-load-draft').addEventListener('click', () => this.loadDraft());
        document.getElementById('upload-json').addEventListener('change', (e) => this.uploadJSON(e));

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

        // Auto-save draft kvart 30 sekund
        setInterval(() => this.saveDraft(true), 30000);

        // Start med tom quiz
        this.quiz = this.emptyQuiz();
        this.render();
        this.tryLoadAutoDraft();
    }

    addQuestion() {
        this.quiz.questions.push({
            question: '',
            options: ['', '', '', ''],
            correct: 0,
            timeLimit: 20
        });
        this.render();
        // Scroll til nytt spørsmål
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
            el.querySelectorAll('.q-option').forEach((opt, j) => {
                q.options[j] = opt.value.trim();
            });
        });
    }

    render() {
        const list = document.getElementById('questions-list');
        list.innerHTML = '';

        this.quiz.questions.forEach((q, i) => {
            const item = document.createElement('div');
            item.className = 'question-item nb-card mb-16';
            item.draggable = true;
            item.dataset.index = i;

            // Drag events
            item.addEventListener('dragstart', (e) => {
                this.dragSrcIndex = i;
                e.dataTransfer.effectAllowed = 'move';
                item.style.opacity = '0.4';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
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

            const correctOptions = q.options.map((opt, j) =>
                `<option value="${j}" ${j === q.correct ? 'selected' : ''}>${String.fromCharCode(65 + j)}</option>`
            ).join('');

            item.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;cursor:grab;">
                    <span style="font-weight:900;font-size:1rem;">⠿ Spørsmål ${i + 1}</span>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-small btn-move-up" data-index="${i}" data-target="${i - 1}" title="Flytt opp">▲</button>
                        <button class="btn btn-small btn-move-down" data-index="${i}" data-target="${i + 1}" title="Flytt ned">▼</button>
                        <button class="btn btn-small btn-purple btn-duplicate" data-index="${i}" title="Dupliser">⧉</button>
                        <button class="btn btn-small btn-danger btn-remove" data-index="${i}" title="Slett">✕</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Spørsmål</label>
                    <input type="text" class="form-input q-text" placeholder="Skriv spørsmålet her..." value="${UI.escapeHTML(q.question)}">
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    ${q.options.map((opt, j) => `
                        <div class="form-group" style="margin-bottom:8px;">
                            <label style="font-size:0.8rem;display:flex;align-items:center;gap:6px;">
                                <span style="display:inline-block;width:20px;height:20px;background:${QuizEngine.ANSWER_COLORS[j]};border:2px solid #000;text-align:center;line-height:16px;color:#fff;font-size:0.7rem;">${String.fromCharCode(65 + j)}</span>
                                Alternativ ${String.fromCharCode(65 + j)}
                            </label>
                            <input type="text" class="form-input q-option" placeholder="Alternativ ${String.fromCharCode(65 + j)}" value="${UI.escapeHTML(opt)}">
                        </div>
                    `).join('')}
                </div>

                <div style="display:flex;gap:16px;align-items:flex-end;margin-top:8px;">
                    <div class="form-group" style="margin-bottom:0;flex:1;">
                        <label>Rett svar</label>
                        <select class="form-input q-correct">${correctOptions}</select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;flex:1;">
                        <label>Tidsfrist (sek)</label>
                        <input type="number" class="form-input q-time" min="5" max="120" value="${q.timeLimit}">
                    </div>
                </div>
            `;

            list.appendChild(item);
        });

        // Oppdater tal
        UI.setText('question-count', `${this.quiz.questions.length} spørsmål`);
    }

    showPreview() {
        this.syncFromForm();

        const validation = QuizEngine.validateQuiz(this.quiz);
        const container = document.getElementById('preview-content');

        if (!validation.valid) {
            container.innerHTML = `
                <div class="nb-card" style="border-left:4px solid #E74C3C;">
                    <h3 style="color:#E74C3C;margin-bottom:8px;">⚠ Valideringsfeil</h3>
                    <ul class="text-body" style="margin-left:20px;">
                        ${validation.errors.map(e => `<li>${UI.escapeHTML(e)}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            let html = `
                <div class="nb-card mb-16">
                    <h2 style="font-size:1.4rem;margin-bottom:4px;">${UI.escapeHTML(this.quiz.title)}</h2>
                    <p class="text-body">${UI.escapeHTML(this.quiz.description)}</p>
                    <div class="quiz-card-meta mt-8">
                        <span class="tag tag-count">${this.quiz.questions.length} spørsmål</span>
                        ${this.quiz.tags.map(t => `<span class="tag tag-subject">${UI.escapeHTML(t)}</span>`).join('')}
                    </div>
                </div>
            `;

            this.quiz.questions.forEach((q, i) => {
                html += `
                    <div class="nb-card-sm mb-8" style="border-left:4px solid ${QuizEngine.ANSWER_COLORS[q.correct]};">
                        <div style="font-weight:900;margin-bottom:8px;">${i + 1}. ${UI.escapeHTML(q.question)}</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                            ${q.options.map((opt, j) => `
                                <div style="padding:6px 10px;background:${j === q.correct ? QuizEngine.ANSWER_COLORS[j] : '#f0f0f0'};color:${j === q.correct ? '#fff' : '#000'};border:2px solid #000;font-weight:700;font-size:0.85rem;">
                                    ${String.fromCharCode(65 + j)}) ${UI.escapeHTML(opt)}
                                </div>
                            `).join('')}
                        </div>
                        <div class="text-body" style="font-size:0.8rem;margin-top:6px;">⏱ ${q.timeLimit} sek</div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        document.getElementById('preview-overlay').classList.remove('hidden');
    }

    closePreview() {
        document.getElementById('preview-overlay').classList.add('hidden');
    }

    downloadQuiz() {
        this.syncFromForm();

        const validation = QuizEngine.validateQuiz(this.quiz);
        if (!validation.valid) {
            UI.toast('Quiz har feil: ' + validation.errors[0], 'error');
            return;
        }

        const json = JSON.stringify(this.quiz, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.quiz.id || 'quiz') + '.json';
        a.click();
        URL.revokeObjectURL(url);

        UI.toast('Quiz lasta ned!', 'success');
    }

    saveDraft() {
        this.syncFromForm();
        localStorage.setItem('frodekapp_draft', JSON.stringify(this.quiz));
        UI.toast('Utkast lagra!', 'success');
    }

    loadDraft() {
        const data = localStorage.getItem('frodekapp_draft');
        if (!data) {
            UI.toast('Ingen utkast funne', 'error');
            return;
        }
        try {
            this.quiz = JSON.parse(data);
            this.populateForm();
            this.render();
            UI.toast('Utkast lasta!', 'success');
        } catch (e) {
            UI.toast('Kunne ikkje laste utkast', 'error');
        }
    }

    tryLoadAutoDraft() {
        const data = localStorage.getItem('frodekapp_draft');
        if (data) {
            try {
                this.quiz = JSON.parse(data);
                this.populateForm();
            } catch (e) { /* ignorer */ }
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

        // Lagre til localStorage med unik ID
        const localId = 'local_' + Date.now();
        const localQuizzes = JSON.parse(localStorage.getItem('frodekapp_local_quizzes') || '{}');
        localQuizzes[localId] = {
            ...this.quiz,
            id: localId,
            local: true,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('frodekapp_local_quizzes', JSON.stringify(localQuizzes));

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
