/* ══════════════════════════════════════════════
   FRØDEKAPP — Solo-øving
   Spel ein quiz åleine med poeng og tidtaking
   ══════════════════════════════════════════════ */

class SoloGame {
    constructor() {
        this.quiz = null;
        this.currentIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.answers = [];
        this.timer = null;
        this.questionStartTime = 0;
        this.selectedAnswer = null;

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
                    this.quiz = data;
                    UI.setText('ready-title', data.title);
                    UI.setText('ready-desc', data.description);
                    UI.setText('ready-count', `${data.questions.length} spørsmål`);
                    UI.showScreen('screen-ready');
                    UI.toast('Quiz lasta frå fil!', 'success');
                } catch (err) {
                    UI.toast('Ugyldig JSON-fil', 'error');
                }
            };
            reader.readAsText(file);
        });

        // Sjekk om quiz-ID er i URL
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
        try {
            const manifest = await QuizEngine.loadManifest('quizzes');
            grid.innerHTML = '';
            manifest.forEach(q => {
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.style.borderLeftWidth = '6px';
                card.style.borderLeftColor = q.color || '#000';
                card.innerHTML = `
                    <div class="quiz-card-title">${q.title}</div>
                    <div class="quiz-card-desc">${q.description}</div>
                    <div class="quiz-card-meta">
                        <span class="tag tag-count">${q.questionCount} spørsmål</span>
                    </div>
                `;
                card.addEventListener('click', () => this.loadQuizById(q.id));
                grid.appendChild(card);
            });
        } catch (e) {
            grid.innerHTML = `<div class="text-body text-center" style="padding:20px;color:#E74C3C;">Feil: ${e.message}</div>`;
        }
    }

    async loadQuizById(quizId) {
        try {
            this.quiz = await QuizEngine.loadQuizById(quizId, 'quizzes');
            this.showReadyScreen();
        } catch (e) {
            UI.toast('Kunne ikkje laste quiz: ' + e.message, 'error');
            await this.showQuizPicker();
        }
    }

    showReadyScreen() {
        UI.showScreen('screen-ready');
        UI.setText('ready-title', this.quiz.title);
        UI.setText('ready-desc', this.quiz.description);
        UI.setText('ready-count', `${this.quiz.questions.length} spørsmål`);

        document.getElementById('btn-start-solo').onclick = () => this.startGame();
    }

    startGame() {
        this.currentIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.answers = [];
        this.showQuestion();
    }

    showQuestion() {
        if (this.currentIndex >= this.quiz.questions.length) {
            this.showResults();
            return;
        }

        const q = this.quiz.questions[this.currentIndex];
        const timeLimit = q.timeLimit || 20;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now();

        UI.showScreen('screen-question');
        UI.setText('q-number', `Spørsmål ${this.currentIndex + 1} / ${this.quiz.questions.length}`);
        UI.setText('q-score', `${this.score} poeng`);
        UI.setText('q-text', q.question);

        // Streak-visning
        const streakEl = document.getElementById('q-streak');
        if (this.streak >= 2) {
            streakEl.textContent = `🔥 ${this.streak} på rad!`;
            streakEl.classList.remove('hidden');
        } else {
            streakEl.classList.add('hidden');
        }

        // Svaralternativ
        const gridContainer = document.getElementById('q-answers');
        gridContainer.innerHTML = '';
        const grid = UI.createAnswerGrid(q.options, (i) => this.submitAnswer(i));
        gridContainer.appendChild(grid);

        // Framgangslinje
        const pct = ((this.currentIndex) / this.quiz.questions.length) * 100;
        document.getElementById('q-progress-fill').style.width = pct + '%';

        // Timer
        if (this.timer) this.timer.stop();
        this.timer = UI.startTimer('q-timer', timeLimit, null, () => {
            this.timeUp();
        });
    }

    submitAnswer(answerIndex) {
        if (this.selectedAnswer !== null) return;
        this.selectedAnswer = answerIndex;

        if (this.timer) this.timer.stop();

        const q = this.quiz.questions[this.currentIndex];
        const timeUsed = Date.now() - this.questionStartTime;
        const isCorrect = answerIndex === q.correct;
        const timeLimit = q.timeLimit || 20;

        const result = QuizEngine.calculateScore(isCorrect, timeUsed, timeLimit, this.streak);
        this.score += result.points;
        this.streak = result.newStreak;

        this.answers.push({
            questionIndex: this.currentIndex,
            selected: answerIndex,
            correct: q.correct,
            isCorrect,
            timeUsed,
            points: result.points
        });

        // Vis rett/feil
        const grid = document.getElementById('q-answers').querySelector('.answer-grid');
        UI.revealAnswers(grid, q.correct, answerIndex);

        // Vis poeng-feedback
        const feedback = document.getElementById('q-feedback');
        if (isCorrect) {
            let txt = `✅ Rett! +${result.points} poeng`;
            if (result.streakBonus > 0) txt += ` (🔥 streak-bonus +${result.streakBonus})`;
            feedback.textContent = txt;
            feedback.style.color = '#2ECC71';
        } else {
            feedback.textContent = `❌ Feil! Rett svar: ${q.options[q.correct]}`;
            feedback.style.color = '#E74C3C';
        }
        feedback.classList.remove('hidden');

        UI.setText('q-score', `${this.score} poeng`);

        setTimeout(() => {
            feedback.classList.add('hidden');
            this.currentIndex++;
            this.showQuestion();
        }, 2200);
    }

    timeUp() {
        if (this.selectedAnswer !== null) return;

        const q = this.quiz.questions[this.currentIndex];
        this.streak = 0;

        this.answers.push({
            questionIndex: this.currentIndex,
            selected: null,
            correct: q.correct,
            isCorrect: false,
            timeUsed: (q.timeLimit || 20) * 1000,
            points: 0
        });

        // Deaktiver knappar og vis rett svar
        const grid = document.getElementById('q-answers').querySelector('.answer-grid');
        UI.revealAnswers(grid, q.correct, null);

        const feedback = document.getElementById('q-feedback');
        feedback.textContent = `⏰ Tida er ute! Rett svar: ${q.options[q.correct]}`;
        feedback.style.color = '#E74C3C';
        feedback.classList.remove('hidden');

        setTimeout(() => {
            feedback.classList.add('hidden');
            this.currentIndex++;
            this.showQuestion();
        }, 2200);
    }

    showResults() {
        UI.showScreen('screen-results');

        const correct = this.answers.filter(a => a.isCorrect).length;
        const total = this.answers.length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        const bestStreak = this.calcBestStreak();
        const avgTime = total > 0 ? Math.round(this.answers.reduce((s, a) => s + a.timeUsed, 0) / total / 100) / 10 : 0;

        UI.setText('res-title', this.quiz.title);
        UI.setText('res-score', this.score);
        UI.setText('res-correct', `${correct} / ${total}`);
        UI.setText('res-accuracy', `${accuracy}%`);
        UI.setText('res-streak', bestStreak);
        UI.setText('res-avgtime', `${avgTime}s`);

        // Spørsmåloversikt
        const list = document.getElementById('res-questions');
        list.innerHTML = '';
        this.answers.forEach((a, i) => {
            const q = this.quiz.questions[a.questionIndex];
            const row = document.createElement('div');
            row.className = 'nb-card-sm mb-8';
            row.style.borderLeftWidth = '4px';
            row.style.borderLeftColor = a.isCorrect ? '#2ECC71' : '#E74C3C';
            row.innerHTML = `
                <div style="font-weight:700;margin-bottom:4px;">${i + 1}. ${UI.escapeHTML(q.question)}</div>
                <div class="text-body" style="font-size:0.85rem;">
                    ${a.isCorrect ? '✅ Rett' : a.selected === null ? '⏰ Ikkje svara' : `❌ Svara: ${UI.escapeHTML(q.options[a.selected])}`}
                    ${!a.isCorrect ? ` — Rett: <strong>${UI.escapeHTML(q.options[a.correct])}</strong>` : ''}
                    <span style="float:right;font-weight:700;">+${a.points}</span>
                </div>
            `;
            list.appendChild(row);
        });

        document.getElementById('btn-retry').onclick = () => this.startGame();
        document.getElementById('btn-back').onclick = () => {
            window.location.href = 'index.html';
        };
    }

    calcBestStreak() {
        let best = 0, cur = 0;
        this.answers.forEach(a => {
            if (a.isCorrect) { cur++; best = Math.max(best, cur); }
            else cur = 0;
        });
        return best;
    }
}

document.addEventListener('DOMContentLoaded', () => new SoloGame());
