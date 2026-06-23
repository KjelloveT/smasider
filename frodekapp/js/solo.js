/* ══════════════════════════════════════════════
   FRØDEKAPP — Soloøving
   Tynn visningsklasse oppå QuizRunner (delt motor).
   ══════════════════════════════════════════════ */

class SoloGame {
    constructor() {
        this.runner = null;
        this.timer = null;
        this.questionStartTime = 0;
        this.locked = false;
        this.init();
    }

    async init() {
        // Fil-opplasting (bind éin gong)
        document.getElementById('solo-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const v = QuizEngine.validateQuiz(data);
                    if (!v.valid) { UI.toast('Ugyldig quiz: ' + v.errors[0], 'error'); return; }
                    this.setQuiz(data);
                    UI.toast('Quiz lasta frå fil!', 'success');
                } catch (err) {
                    UI.toast('Ugyldig JSON-fil', 'error');
                }
            };
            reader.readAsText(file);
        });

        const params = new URLSearchParams(window.location.search);
        const quizId = params.get('quiz');
        if (quizId) {
            await this.loadQuizById(quizId);
        } else {
            await this.showQuizPicker();
        }
    }

    async showQuizPicker() {
        UI.showScreen('screen-picker');
        const grid = document.getElementById('picker-grid');
        grid.textContent = '';
        try {
            const manifest = await QuizEngine.loadManifest('quizzes');
            manifest.forEach(q => grid.appendChild(this.quizCard(q)));
        } catch (e) {
            this.showGridError(grid, e.message);
        }
    }

    quizCard(q) {
        const card = document.createElement('div');
        card.className = 'quiz-card' + (q.local ? ' is-local' : '');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');

        const title = document.createElement('div');
        title.className = 'quiz-card-title';
        title.textContent = q.title;

        const desc = document.createElement('div');
        desc.className = 'quiz-card-desc';
        desc.textContent = q.description || '';

        const meta = document.createElement('div');
        meta.className = 'quiz-card-meta';
        const count = document.createElement('span');
        count.className = 'tag tag-count';
        count.textContent = `${q.questionCount} spørsmål`;
        meta.appendChild(count);
        if (q.local) {
            const local = document.createElement('span');
            local.className = 'tag tag-local';
            local.textContent = 'Lokal';
            meta.appendChild(local);
        }

        card.append(title, desc, meta);
        const open = () => this.loadQuizById(q.id);
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
        return card;
    }

    showGridError(grid, msg) {
        grid.textContent = '';
        const err = document.createElement('div');
        err.className = 'fk-error';
        err.textContent = 'Feil: ' + msg;
        grid.appendChild(err);
    }

    async loadQuizById(quizId) {
        try {
            const quiz = await QuizEngine.loadQuizById(quizId, 'quizzes');
            this.setQuiz(quiz);
        } catch (e) {
            UI.toast('Kunne ikkje laste quiz: ' + e.message, 'error');
            await this.showQuizPicker();
        }
    }

    setQuiz(quiz) {
        this.runner = new QuizRunner(quiz);
        this.showReadyScreen();
    }

    showReadyScreen() {
        const quiz = this.runner.quiz;
        UI.showScreen('screen-ready');
        UI.setText('ready-title', quiz.title);
        UI.setText('ready-desc', quiz.description || '');
        UI.setText('ready-count', `${quiz.questions.length} spørsmål`);
        document.getElementById('btn-start-solo').onclick = () => this.startGame();
    }

    startGame() {
        this.runner.reset();
        this.showQuestion();
    }

    showQuestion() {
        if (this.runner.done) { this.showResults(); return; }

        const q = this.runner.current;
        this.locked = false;
        this.questionStartTime = Date.now();

        UI.showScreen('screen-question');
        UI.setText('q-number', `Spørsmål ${this.runner.currentIndex + 1} / ${this.runner.total}`);
        UI.setText('q-score', `${this.runner.score} poeng`);
        UI.setText('q-text', q.question);

        // Streak-visning
        const streakEl = document.getElementById('q-streak');
        if (this.runner.streak >= 2) {
            streakEl.innerHTML = '';
            streakEl.appendChild(ICON_EL('flame', 18));
            streakEl.append(` ${this.runner.streak} på rad!`);
            streakEl.classList.remove('hidden');
        } else {
            streakEl.classList.add('hidden');
        }

        // Svaralternativ
        const gridContainer = document.getElementById('q-answers');
        gridContainer.textContent = '';
        gridContainer.appendChild(UI.createAnswerGrid(q.options, (i) => this.submitAnswer(i)));

        // Framgangslinje
        const pct = (this.runner.currentIndex / this.runner.total) * 100;
        document.getElementById('q-progress-fill').style.width = pct + '%';

        // Timer
        if (this.timer) this.timer.stop();
        this.timer = UI.startTimer('q-timer', this.runner.timeLimit(), null, () => this.timeUp());
    }

    submitAnswer(answerIndex) {
        if (this.locked) return;
        this.locked = true;
        if (this.timer) this.timer.stop();

        const timeUsed = Date.now() - this.questionStartTime;
        const { isCorrect, result, correctIndex } = this.runner.answer(answerIndex, timeUsed);

        const grid = document.getElementById('q-answers').querySelector('.answer-grid');
        UI.revealAnswers(grid, correctIndex, answerIndex);

        const feedback = document.getElementById('q-feedback');
        feedback.className = 'text-center mt-16 fk-feedback ' + (isCorrect ? 'ok' : 'bad');
        feedback.textContent = '';
        feedback.appendChild(ICON_EL(isCorrect ? 'check' : 'x', 20));
        if (isCorrect) {
            let txt = ` Rett! +${result.points} poeng`;
            if (result.streakBonus > 0) txt += ` (streak-bonus +${result.streakBonus})`;
            feedback.append(txt);
        } else {
            feedback.append(` Feil! Rett svar: ${this.runner.current.options[correctIndex]}`);
        }

        UI.setText('q-score', `${this.runner.score} poeng`);
        this.nextAfterDelay();
    }

    timeUp() {
        if (this.locked) return;
        this.locked = true;

        const correctIndex = this.runner.current.correct;
        const correctText = this.runner.current.options[correctIndex];
        this.runner.timeout();

        const grid = document.getElementById('q-answers').querySelector('.answer-grid');
        UI.revealAnswers(grid, correctIndex, null);

        const feedback = document.getElementById('q-feedback');
        feedback.className = 'text-center mt-16 fk-feedback bad';
        feedback.textContent = '';
        feedback.appendChild(ICON_EL('hourglass', 20));
        feedback.append(` Tida er ute! Rett svar: ${correctText}`);

        this.nextAfterDelay();
    }

    nextAfterDelay() {
        setTimeout(() => {
            document.getElementById('q-feedback').classList.add('hidden');
            this.runner.advance();
            this.showQuestion();
        }, 2200);
    }

    showResults() {
        UI.showScreen('screen-results');
        const s = this.runner.stats();

        UI.setText('res-title', this.runner.quiz.title);
        UI.setText('res-score', s.score);
        UI.setText('res-correct', `${s.correct} / ${s.total}`);
        UI.setText('res-accuracy', `${s.accuracy}%`);
        UI.setText('res-streak', s.bestStreak);
        UI.setText('res-avgtime', `${s.avgTime}s`);

        const list = document.getElementById('res-questions');
        list.textContent = '';
        this.runner.answers.forEach((a, i) => {
            const q = this.runner.quiz.questions[a.questionIndex];
            const row = document.createElement('div');
            row.className = 'res-row ' + (a.isCorrect ? 'ok' : 'bad');

            const head = document.createElement('div');
            head.className = 'res-row-q';
            head.textContent = `${i + 1}. ${q.question}`;

            const body = document.createElement('div');
            body.className = 'res-row-a';
            if (a.isCorrect) {
                body.textContent = 'Rett';
            } else if (a.selected === null) {
                body.textContent = `Ikkje svara — rett: ${q.options[a.correct]}`;
            } else {
                body.textContent = `Svara: ${q.options[a.selected]} — rett: ${q.options[a.correct]}`;
            }

            const pts = document.createElement('span');
            pts.className = 'res-row-pts';
            pts.textContent = `+${a.points}`;
            body.appendChild(pts);

            row.append(head, body);
            list.appendChild(row);
        });

        document.getElementById('btn-retry').onclick = () => this.startGame();
        document.getElementById('btn-back').onclick = () => { window.location.href = 'index.html'; };
    }
}

document.addEventListener('DOMContentLoaded', () => new SoloGame());
