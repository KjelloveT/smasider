/* ══════════════════════════════════════════════
   FRØDEKAPP — Spelar (Player) logikk
   Elev-visning: koble til, svar, resultat
   ══════════════════════════════════════════════ */

class PlayerGame {
    constructor() {
        this.peerPlayer = null;
        this.playerId = '';
        this.playerName = '';
        this.roomCode = '';
        this.score = 0;
        this.currentQuestion = null;
        this.hasAnswered = false;
        this.questionStartTime = 0;
        this.timer = null;
        this.selectedAnswer = null;

        this.init();
    }

    init() {
        document.getElementById('btn-join').addEventListener('click', () => this.joinRoom());

        // Enter-tastar
        document.getElementById('input-room-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('input-player-name').focus();
        });
        document.getElementById('input-player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });

        // Auto-uppercase romkode
        document.getElementById('input-room-code').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        // Last siste namn via VyrdepilStorage
        const savedName = FKStorage.getPlayerName();
        if (savedName) {
            document.getElementById('input-player-name').value = savedName;
        }

        // Sjekk om romkode er i URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            document.getElementById('input-room-code').value = code.toUpperCase();
        }
    }

    joinRoom() {
        this.roomCode = document.getElementById('input-room-code').value.trim().toUpperCase();
        this.playerName = document.getElementById('input-player-name').value.trim();

        if (!this.roomCode || this.roomCode.length < 3) {
            UI.toast('Skriv inn ein gyldig romkode', 'error');
            return;
        }
        if (!this.playerName || this.playerName.length < 1) {
            UI.toast('Skriv inn namnet ditt', 'error');
            return;
        }

        // Lagre namn
        FKStorage.savePlayerName(this.playerName);

        // Vis koplar-til skjerm
        UI.showScreen('screen-connecting');
        UI.setText('connecting-status', 'Koplar til rom ' + this.roomCode + '...');

        this.peerPlayer = new PeerPlayer(this.roomCode, this.playerName, {
            onConnected: (playerId, players) => {
                this.playerId = playerId;
                console.log('[Player] Kopla til! ID:', playerId);
                this.showLobby(players);
            },
            onMessage: (data) => {
                this.handleMessage(data);
            },
            onDisconnected: () => {
                UI.toast('Mista tilkoplinga...', 'error');
            },
            onError: (msg) => {
                UI.toast(msg, 'error');
                UI.showScreen('screen-join');
            }
        });
    }

    showLobby(players) {
        UI.showScreen('screen-lobby');
        UI.setText('lobby-name', this.playerName);
        UI.setText('lobby-room', this.roomCode);
        UI.setText('lobby-player-count', `${players.length} spelar${players.length !== 1 ? 'ar' : ''} tilkopla`);
    }

    handleMessage(data) {
        switch (data.type) {
            case 'player-joined':
                UI.setText('lobby-player-count', `${data.count} spelar${data.count !== 1 ? 'ar' : ''} tilkopla`);
                break;

            case 'player-left':
                UI.setText('lobby-player-count', `${data.count} spelar${data.count !== 1 ? 'ar' : ''} tilkopla`);
                break;

            case 'game-start':
                UI.toast('Quizen startar!', 'success');
                break;

            case 'question':
                this.showQuestion(data);
                break;

            case 'answer-received':
                this.showAnswerFeedback(data);
                break;

            case 'reveal':
                this.showReveal(data);
                break;

            case 'end':
                this.showEnd(data);
                break;
        }
    }

    showQuestion(data) {
        this.currentQuestion = data;
        this.hasAnswered = false;
        this.selectedAnswer = null;
        this.questionStartTime = Date.now();

        UI.showScreen('screen-question');
        UI.setText('play-q-number', `Spørsmål ${data.questionNumber} / ${data.totalQuestions}`);
        UI.setText('play-q-text', data.question);
        UI.setText('play-score', `${this.score} poeng`);

        // Alternativ-knappar
        const container = document.getElementById('play-answers');
        container.innerHTML = '';
        container.appendChild(UI.createAnswerGrid(data.options, (i) => this.submitAnswer(i)));

        // Timer
        if (this.timer) this.timer.stop();
        this.timer = UI.startTimer('play-timer', data.timeLimit, null, () => {
            this.disableAnswers();
        });

        // Gøym feedback
        UI.toggle('play-feedback', false);
        UI.toggle('play-reveal-section', false);
    }

    submitAnswer(index) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        this.selectedAnswer = index;

        if (this.timer) this.timer.stop();

        const timeUsed = Date.now() - this.questionStartTime;

        // Marker valt svar
        const btns = document.getElementById('play-answers').querySelectorAll('.answer-btn');
        btns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === index) btn.classList.add('selected');
        });

        // Send til vert
        this.peerPlayer.send({
            type: 'answer',
            answer: index,
            time: timeUsed,
            questionIndex: this.currentQuestion.index
        });

        // Vis ventar-melding
        UI.toggle('play-feedback', true);
        this.setFeedback('hourglass', 'Svar sendt — ventar på resultat…', 'wait');
    }

    setFeedback(icon, text, kind) {
        const el = document.getElementById('play-feedback-text');
        el.className = 'fk-feedback ' + kind;
        el.textContent = '';
        el.appendChild(ICON_EL(icon, 20));
        el.append(' ' + text);
    }

    showAnswerFeedback(data) {
        UI.toggle('play-feedback', true);
        if (data.isCorrect) {
            this.setFeedback('check', `Rett! +${data.points} poeng`, 'ok');
        } else {
            this.setFeedback('x', 'Feil — ventar på rett svar…', 'bad');
        }
    }

    showReveal(data) {
        this.score = data.yourScore;
        UI.setText('play-score', `${this.score} poeng`);

        // Vis rett svar
        const grid = document.getElementById('play-answers').querySelector('.answer-grid');
        if (grid) UI.revealAnswers(grid, data.correctAnswer, this.selectedAnswer);

        // Vis mini-leaderboard og plassering
        UI.toggle('play-reveal-section', true);
        UI.setText('play-your-rank', `Du er på ${data.yourRank}. plass`);

        const lbContainer = document.getElementById('play-mini-leaderboard');
        lbContainer.innerHTML = '';
        lbContainer.appendChild(UI.createLeaderboard(data.leaderboard, 5));
    }

    showEnd(data) {
        UI.showScreen('screen-end');

        // Finn eigen plassering
        const myRank = data.leaderboard.findIndex(l => l.name === this.playerName) + 1;

        UI.setText('end-your-score', this.score);
        UI.setText('end-your-rank', myRank > 0 ? `${myRank}. plass` : '—');

        // Podium
        const podiumContainer = document.getElementById('end-podium');
        podiumContainer.innerHTML = '';
        podiumContainer.appendChild(UI.createPodium(data.leaderboard));

        // Full leaderboard
        const lbContainer = document.getElementById('end-leaderboard');
        lbContainer.innerHTML = '';
        lbContainer.appendChild(UI.createLeaderboard(data.leaderboard, 30));

        document.getElementById('btn-play-again').onclick = () => {
            if (this.peerPlayer) this.peerPlayer.destroy();
            window.location.reload();
        };
    }

    disableAnswers() {
        const btns = document.getElementById('play-answers').querySelectorAll('.answer-btn');
        btns.forEach(btn => btn.disabled = true);

        if (!this.hasAnswered) {
            UI.toggle('play-feedback', true);
            this.setFeedback('hourglass', 'Tida er ute!', 'bad');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new PlayerGame());
