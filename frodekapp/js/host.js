/* ══════════════════════════════════════════════
   FRØDEKAPP — Vert (Host) logikk
   Styrer live-quiz: spørsmål, tidtaking, poeng
   ══════════════════════════════════════════════ */

class HostGame {
    constructor() {
        this.quiz = null;
        this.peerHost = null;
        this.roomCode = '';
        this.players = new Map(); // id → { name, score, streak, answers }
        this.state = 'setup'; // setup | lobby | question | reveal | end
        this.currentIndex = 0;
        this.timer = null;
        this.questionStartTime = 0;
        this.answeredThisRound = new Set();

        this.init();
    }

    async init() {
        // Knappar
        document.getElementById('btn-create-room').addEventListener('click', () => this.createRoom());
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
        document.getElementById('btn-next-question').addEventListener('click', () => this.nextStep());
        document.getElementById('btn-end-game').addEventListener('click', () => this.endGame());
        document.getElementById('host-upload-json').addEventListener('change', (e) => this.uploadQuiz(e));

        // Last quiz frå URL-parameter
        const params = new URLSearchParams(window.location.search);
        const quizId = params.get('quiz');
        if (quizId) {
            try {
                this.quiz = await QuizEngine.loadQuiz(`quizzes/${quizId}.json`);
                UI.setText('selected-quiz-title', this.quiz.title);
                UI.setText('selected-quiz-count', `${this.quiz.questions.length} spørsmål`);
                UI.toggle('selected-quiz-info', true);
            } catch (e) {
                UI.toast('Kunne ikkje laste quiz: ' + e.message, 'error');
            }
        }

        // Last quiz-bibliotek
        this.loadQuizList();
    }

    async loadQuizList() {
        const grid = document.getElementById('host-quiz-grid');
        try {
            const manifest = await QuizEngine.loadManifest('quizzes');
            grid.innerHTML = '';
            manifest.forEach(q => {
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.style.borderLeftWidth = '4px';
                card.style.borderLeftColor = q.color || '#000';
                card.style.padding = '16px';
                card.innerHTML = `
                    <div class="quiz-card-title" style="font-size:1rem;">${q.title}</div>
                    <div class="quiz-card-meta mt-8">
                        <span class="tag tag-count">${q.questionCount} spm.</span>
                    </div>
                `;
                card.addEventListener('click', async () => {
                    try {
                        this.quiz = await QuizEngine.loadQuiz(`quizzes/${q.id}.json`);
                        UI.setText('selected-quiz-title', this.quiz.title);
                        UI.setText('selected-quiz-count', `${this.quiz.questions.length} spørsmål`);
                        UI.toggle('selected-quiz-info', true);
                        document.querySelectorAll('#host-quiz-grid .quiz-card').forEach(c => c.style.outline = '');
                        card.style.outline = '3px solid #4CAF50';
                        UI.toast('Quiz valt: ' + q.title, 'success');
                    } catch (e) {
                        UI.toast('Feil ved lasting: ' + e.message, 'error');
                    }
                });
                grid.appendChild(card);
            });
        } catch (e) {
            grid.innerHTML = `<div class="text-body" style="color:#E74C3C;">Feil: ${e.message}</div>`;
        }
    }

    uploadQuiz(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                const v = QuizEngine.validateQuiz(data);
                if (!v.valid) { UI.toast('Ugyldig quiz: ' + v.errors[0], 'error'); return; }
                this.quiz = data;
                UI.setText('selected-quiz-title', data.title);
                UI.setText('selected-quiz-count', `${data.questions.length} spørsmål`);
                UI.toggle('selected-quiz-info', true);
                UI.toast('Quiz lasta frå fil!', 'success');
            } catch (err) {
                UI.toast('Ugyldig JSON-fil', 'error');
            }
        };
        reader.readAsText(file);
    }

    createRoom() {
        if (!this.quiz) {
            UI.toast('Vel ein quiz fyrst!', 'error');
            return;
        }

        this.roomCode = QuizEngine.generateRoomCode();
        UI.showScreen('screen-lobby');
        this.state = 'lobby';

        // Vis romkode
        UI.setText('lobby-room-code', this.roomCode);
        UI.setText('lobby-quiz-title', this.quiz.title);

        // Start PeerJS vert
        this.peerHost = new PeerHost(this.roomCode, {
            onReady: (code) => {
                UI.setText('lobby-status', 'Klar — ventar på spelarar');
                document.getElementById('lobby-status').className = 'status-badge online';
                console.log('[Host] Rom oppretta:', code);
            },
            onPlayerJoin: (player) => {
                this.players.set(player.id, {
                    name: player.name,
                    score: 0,
                    streak: 0,
                    answers: []
                });
                this.updateLobbyPlayers();
                UI.toast(`${player.name} vart med!`, 'success');
            },
            onPlayerLeave: (player) => {
                this.players.delete(player.id);
                this.updateLobbyPlayers();
            },
            onPlayerMessage: (playerId, data) => {
                if (data.type === 'answer') {
                    this.handleAnswer(playerId, data);
                }
            },
            onError: (msg) => {
                UI.toast(msg, 'error');
            }
        });
    }

    updateLobbyPlayers() {
        const list = Array.from(this.players.values());
        UI.updatePlayerList('lobby-players', list);
        UI.setText('lobby-player-count', `${this.players.size} spelar${this.players.size !== 1 ? 'ar' : ''}`);
        UI.enableBtn('btn-start-game', this.players.size > 0);
    }

    startGame() {
        if (this.players.size === 0) {
            UI.toast('Treng minst éin spelar!', 'error');
            return;
        }

        this.currentIndex = 0;
        // Reset poeng
        this.players.forEach(p => { p.score = 0; p.streak = 0; p.answers = []; });

        // Send countdown
        this.peerHost.broadcast({ type: 'game-start', quizTitle: this.quiz.title, totalQuestions: this.quiz.questions.length });

        this.showQuestion();
    }

    showQuestion() {
        if (this.currentIndex >= this.quiz.questions.length) {
            this.endGame();
            return;
        }

        const q = this.quiz.questions[this.currentIndex];
        const timeLimit = q.timeLimit || 20;
        this.state = 'question';
        this.questionStartTime = Date.now();
        this.answeredThisRound = new Set();

        UI.showScreen('screen-game');

        // Oppdater vert-visning
        UI.setText('game-q-number', `Spørsmål ${this.currentIndex + 1} / ${this.quiz.questions.length}`);
        UI.setText('game-q-text', q.question);
        UI.setText('game-answer-count', `0 / ${this.players.size} har svara`);

        // Vis alternativ
        const optContainer = document.getElementById('game-options');
        optContainer.innerHTML = '';
        optContainer.appendChild(UI.createAnswerGridDisplay(q.options));

        // Framgangslinje
        document.getElementById('game-progress-fill').style.width = ((this.currentIndex) / this.quiz.questions.length * 100) + '%';

        // Send spørsmål til spelarar
        this.peerHost.broadcast({
            type: 'question',
            index: this.currentIndex,
            question: q.question,
            options: q.options,
            timeLimit: timeLimit,
            questionNumber: this.currentIndex + 1,
            totalQuestions: this.quiz.questions.length
        });

        // Timer
        if (this.timer) this.timer.stop();
        this.timer = UI.startTimer('game-timer', timeLimit, null, () => {
            this.revealAnswer();
        });

        // Knappar
        UI.enableBtn('btn-next-question', false);
    }

    handleAnswer(playerId, data) {
        if (this.state !== 'question') return;
        if (this.answeredThisRound.has(playerId)) return;

        this.answeredThisRound.add(playerId);
        const player = this.players.get(playerId);
        if (!player) return;

        const q = this.quiz.questions[this.currentIndex];
        const timeUsed = data.time || (Date.now() - this.questionStartTime);
        const isCorrect = data.answer === q.correct;
        const timeLimit = q.timeLimit || 20;

        const result = QuizEngine.calculateScore(isCorrect, timeUsed, timeLimit, player.streak);
        player.score += result.points;
        player.streak = result.newStreak;
        player.answers.push({
            questionIndex: this.currentIndex,
            answer: data.answer,
            correct: isCorrect,
            points: result.points,
            timeUsed
        });

        // Send bekreftelse til spelaren
        this.peerHost.sendTo(playerId, {
            type: 'answer-received',
            points: result.points,
            isCorrect
        });

        // Oppdater svar-teljar
        UI.setText('game-answer-count', `${this.answeredThisRound.size} / ${this.players.size} har svara`);

        // Automatisk reveal om alle har svara
        if (this.answeredThisRound.size >= this.players.size) {
            if (this.timer) this.timer.stop();
            setTimeout(() => this.revealAnswer(), 500);
        }
    }

    revealAnswer() {
        if (this.state === 'reveal') return;
        this.state = 'reveal';
        if (this.timer) this.timer.stop();

        const q = this.quiz.questions[this.currentIndex];

        // Marker rett svar i vert-visning
        const grid = document.getElementById('game-options').querySelector('.answer-grid');
        if (grid) UI.revealAnswers(grid, q.correct, null);

        // Bygg leaderboard
        const leaderboard = QuizEngine.buildLeaderboard(Array.from(this.players).map(([id, p]) => ({ id, ...p })));

        // Vis leaderboard på vert-skjermen
        const lbContainer = document.getElementById('game-leaderboard');
        lbContainer.innerHTML = '';
        lbContainer.appendChild(UI.createLeaderboard(leaderboard, 5));
        UI.toggle('game-leaderboard-section', true);

        // Send reveal til spelarar — inkluder kvar spelar sin eigen score
        this.players.forEach((player, playerId) => {
            this.peerHost.sendTo(playerId, {
                type: 'reveal',
                correctAnswer: q.correct,
                yourScore: player.score,
                yourRank: leaderboard.findIndex(l => l.id === playerId) + 1,
                leaderboard: leaderboard.slice(0, 5).map(l => ({ name: l.name, score: l.score, rank: l.rank }))
            });
        });

        UI.enableBtn('btn-next-question', true);
        document.getElementById('btn-next-question').textContent =
            this.currentIndex + 1 >= this.quiz.questions.length ? '🏆 Vis resultat' : '▶ Neste spørsmål';
    }

    nextStep() {
        UI.toggle('game-leaderboard-section', false);
        this.currentIndex++;
        this.showQuestion();
    }

    endGame() {
        this.state = 'end';
        if (this.timer) this.timer.stop();

        UI.showScreen('screen-end');

        const leaderboard = QuizEngine.buildLeaderboard(Array.from(this.players).map(([id, p]) => ({ id, ...p })));

        // Podium
        const podiumContainer = document.getElementById('end-podium');
        podiumContainer.innerHTML = '';
        podiumContainer.appendChild(UI.createPodium(leaderboard));

        // Full leaderboard
        const lbContainer = document.getElementById('end-leaderboard');
        lbContainer.innerHTML = '';
        lbContainer.appendChild(UI.createLeaderboard(leaderboard, 30));

        // Send slutt til spelarar
        this.peerHost.broadcast({
            type: 'end',
            leaderboard: leaderboard.map(l => ({ name: l.name, score: l.score, rank: l.rank }))
        });

        // Statistikk
        const totalCorrect = Array.from(this.players.values()).reduce((s, p) => s + p.answers.filter(a => a.correct).length, 0);
        const totalAnswers = Array.from(this.players.values()).reduce((s, p) => s + p.answers.length, 0);
        UI.setText('end-stats', `${this.players.size} spelarar • ${this.quiz.questions.length} spørsmål • ${totalAnswers > 0 ? Math.round(totalCorrect / totalAnswers * 100) : 0}% rett totalt`);

        document.getElementById('btn-new-game').onclick = () => {
            if (this.peerHost) this.peerHost.destroy();
            window.location.reload();
        };
    }
}

document.addEventListener('DOMContentLoaded', () => new HostGame());
