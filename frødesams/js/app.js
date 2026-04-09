// Main App for Frødesams
class Frødesams {
    constructor() {
        this.currentScreen = 'game';
        this.currentQuiz = null;
        this.teams = [];
        this.currentQuestionIndex = 0;
        this.currentTeam = 0; // 0-3 for 4 lag
        this.strikes = 0;
        this.revealedAnswers = new Set();
        this.isDisplay = window.location.pathname.includes('display.html');
        this.isController = !this.isDisplay;
        this.sync = new SyncManager();

        this.init();
    }
    
    // Safe element getter - returns null without error if element doesn't exist
    el(id) {
        return document.getElementById(id);
    }

    init() {
        this.bindNavigation();
        this.bindSync();

        if (this.isDisplay) {
            // Display mode: only needs sync + game rendering
            this.showScreen('game');
            setTimeout(() => {
                this.sync.send('request-state', {});
            }, 500);
            return;
        }

        // Full mode (index.html and controller.html)
        this.bindTeamSetup();
        this.bindGameControls();
        this.bindEditor();
        this.bindExportImport();
        this.loadSampleQuizzes();
    }
    
    // ===== NAVIGATION =====
    
    bindNavigation() {
        const editorBtn = document.getElementById('btn-editor');
        const savedBtn = document.getElementById('btn-saved');
        const controllerBtn = document.getElementById('btn-controller');
        const displayBtn = document.getElementById('btn-display');
        const openDisplayBtn = document.getElementById('btn-open-display');

        if (editorBtn) {
            editorBtn.addEventListener('click', () => this.showScreen('editor'));
        }

        if (savedBtn) {
            savedBtn.addEventListener('click', () => this.showScreen('saved'));
        }

        if (controllerBtn) {
            controllerBtn.addEventListener('click', () => {
                this.showScreen('game');
            });
        }

        if (displayBtn) {
            displayBtn.addEventListener('click', () => {
                window.open('display.html', 'frødesams-display', 'width=1200,height=800');
            });
        }

        if (openDisplayBtn) {
            openDisplayBtn.addEventListener('click', () => {
                window.open('display.html', 'frødesams-display', 'width=1200,height=800');
            });
        }
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        const screen = this.el(`${screenName}-screen`);
        if (screen) {
            screen.classList.remove('hidden');
        }

        // Hide instructions when going to game screen
        const instructions = this.el('instructions');
        if (instructions) {
            instructions.classList.toggle('hidden', screenName === 'game');
        }

        this.currentScreen = screenName;

        if (screenName === 'game' && !this.isDisplay) {
            this.loadQuizList();
        } else if (screenName === 'saved') {
            this.loadSavedQuizzes();
        }
    }
    
    // ===== TEAM SETUP =====
    
    bindTeamSetup() {
        const addTeamBtn = document.getElementById('btn-add-team');
        const teamsContainer = document.getElementById('teams-container');

        if (!addTeamBtn || !teamsContainer) return;

        addTeamBtn.addEventListener('click', () => {
            const currentTeams = teamsContainer.querySelectorAll('.team-input').length;
            if (currentTeams >= 4) {
                alert('Maksimalt 4 team!');
                return;
            }

            const div = document.createElement('div');
            div.className = 'team-input';
            div.innerHTML = `
                <input type="text" class="form-input team-name" placeholder="Team ${currentTeams + 1}" maxlength="20">
                <button class="btn btn-small btn-danger btn-remove-team">×</button>
            `;
            teamsContainer.appendChild(div);

            div.querySelector('.btn-remove-team').addEventListener('click', () => {
                div.remove();
                this.updateTeamRemoveButtons();
                this.syncTeams();
            });

            div.querySelector('.team-name').addEventListener('input', () => {
                this.syncTeams();
            });

            this.updateTeamRemoveButtons();
            this.syncTeams();
        });

        // Add remove button listeners to existing teams
        teamsContainer.querySelectorAll('.btn-remove-team').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.team-input').remove();
                this.updateTeamRemoveButtons();
                this.syncTeams();
            });
        });

        // Add input listeners to existing team names
        teamsContainer.querySelectorAll('.team-name').forEach(input => {
            input.addEventListener('input', () => {
                this.syncTeams();
            });
        });

        this.updateTeamRemoveButtons();
    }

    syncTeams() {
        if (!this.isController) return;

        const teamInputs = document.querySelectorAll('.team-name');
        const teams = [];
        teamInputs.forEach((input, i) => {
            const name = input.value.trim() || `Team ${i + 1}`;
            teams.push({ id: i, name, score: 0 });
        });

        this.sync.send('sync-teams', { teams });
    }
    
    updateTeamRemoveButtons() {
        const teamInputs = document.querySelectorAll('.team-input');
        teamInputs.forEach(input => {
            const removeBtn = input.querySelector('.btn-remove-team');
            if (removeBtn) {
                removeBtn.style.display = teamInputs.length > 2 ? 'block' : 'none';
            }
        });
        
        document.querySelectorAll('.btn-remove-team').forEach(btn => {
            btn.onclick = () => this.removeTeamInput(btn);
        });
    }
    
    removeTeamInput(button) {
        const teamInputs = document.querySelectorAll('.team-input');
        if (teamInputs.length > 2) {
            button.parentElement.remove();
            this.updateTeamRemoveButtons();
        }
    }
    
    // ===== QUIZ SELECTION =====
    
    loadQuizList() {
        const container = this.el('quiz-list');
        if (!container) return;
        const quizzes = Storage.getQuizzes();
        
        if (quizzes.length === 0) {
            container.innerHTML = '<p style="padding:20px;">Ingen quizer tilgjengelege. Lag ein ny quiz i editoren.</p>';
            return;
        }
        
        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.style.cursor = 'default';
            card.innerHTML = `
                <h3>${this.escapeHtml(quiz.title)}</h3>
                <p>${quiz.questions.length} spørsmål</p>
                <button class="btn btn-small mt-8 btn-start-quiz">Start</button>
            `;
            card.querySelector('.btn-start-quiz').addEventListener('click', (e) => {
                e.stopPropagation();
                this.startQuiz(quiz);
            });
            container.appendChild(card);
        });
    }
    
    startQuiz(quiz) {
        this.currentQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.currentTeam = 0;
        this.strikes = 0;
        this.revealedAnswers = new Set();
        
        // Get team names (only if inputs exist, e.g. not on display)
        if (!this.isDisplay) {
            const teamInputs = document.querySelectorAll('.team-name');
            this.teams = [];
            teamInputs.forEach((input, i) => {
                const name = input.value.trim() || `Team ${i + 1}`;
                this.teams.push({ id: i, name, score: 0 });
            });
            
            // Sync start game
            this.sync.startGame(quiz.id, this.teams);
        }
        
        // Show game board (hide setup elements if they exist)
        const teamSetup = this.el('team-setup');
        const quizSelection = this.el('quiz-selection');
        const gameBoard = this.el('game-board');
        if (teamSetup) teamSetup.classList.add('hidden');
        if (quizSelection) quizSelection.classList.add('hidden');
        if (gameBoard) gameBoard.classList.remove('hidden');
        
        this.renderTeamsScore();
        this.showQuestion();
    }
    
    renderTeamsScore() {
        const container = this.el('teams-score');
        if (!container) return;
        container.innerHTML = '';
        
        this.teams.forEach(team => {
            const div = document.createElement('div');
            div.className = 'team-score';
            div.innerHTML = `
                <span class="team-name-display">${this.escapeHtml(team.name)}</span>
                <span class="team-points">${team.score}</span>
            `;
            container.appendChild(div);
        });
    }
    
    // ===== QUESTION DISPLAY =====
    
    showQuestion() {
        if (this.currentQuestionIndex >= this.currentQuiz.questions.length) {
            this.showWinner();
            return;
        }
        
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        const questionText = this.el('question-text');
        const teamDisplay = this.el('current-team-display');
        if (questionText) questionText.textContent = question.question;
        if (teamDisplay) teamDisplay.textContent = `${this.teams[this.currentTeam].name} sin tur`;
        
        // Update question progress
        const progress = this.el('question-progress');
        if (progress) progress.textContent = `${this.currentQuestionIndex + 1} av ${this.currentQuiz.questions.length}`;
        
        // Reset state
        this.strikes = 0;
        this.revealedAnswers = new Set();
        
        // Render answer board
        this.renderAnswerBoard(question);
        
        // Show question display
        const qd = this.el('question-display');
        const gc = this.el('game-controls');
        const pac = this.el('point-award-controls');
        if (qd) qd.classList.remove('hidden');
        if (gc) gc.classList.add('hidden');
        if (pac) pac.classList.add('hidden');
    }
    
    renderAnswerBoard(question) {
        const container = document.getElementById('answer-board');
        container.innerHTML = '';

        // Sort answers by points (highest first) and keep track of original indices
        const sortedAnswers = question.answers.map((answer, originalIndex) => ({
            ...answer,
            originalIndex
        })).sort((a, b) => b.points - a.points);

        sortedAnswers.forEach((answer, displayIndex) => {
            const div = document.createElement('div');
            div.className = 'answer-item';
            div.dataset.originalIndex = answer.originalIndex;
            div.dataset.displayIndex = displayIndex;

            if (this.isDisplay) {
                // Display shows numbered boxes with question marks (hidden answers)
                div.innerHTML = `
                    <div class="answer-number">${displayIndex + 1}</div>
                    <div class="answer-text hidden-content">?</div>
                    <div class="answer-points">?</div>
                `;
                div.addEventListener('click', () => this.revealAnswer(answer.originalIndex));
            } else {
                // Quiz-master (index.html and controller.html) can see all answers and click to reveal
                div.innerHTML = `
                    <div class="answer-number">${displayIndex + 1}</div>
                    <div class="answer-text">${this.escapeHtml(answer.text)}</div>
                    <div class="answer-points">${answer.points}</div>
                `;
                div.addEventListener('click', () => this.revealAnswer(answer.originalIndex));
            }

            container.appendChild(div);
        });

    }
    
    revealAnswer(index) {
        if (this.revealedAnswers.has(index)) return;

        this.revealedAnswers.add(index);

        // Sync reveal to other screens
        this.sync.revealAnswer(index);

        const answerItems = document.querySelectorAll('.answer-item');
        const answerItem = Array.from(answerItems).find(item => parseInt(item.dataset.originalIndex) === index);
        const answer = this.currentQuiz.questions[this.currentQuestionIndex].answers[index];

        if (!answerItem) return;

        // Update display
        answerItem.classList.remove('hidden');
        answerItem.classList.add('revealed');
        answerItem.querySelector('.answer-text').classList.remove('hidden-content');
        answerItem.querySelector('.answer-text').textContent = answer.text;
        answerItem.querySelector('.answer-points').textContent = answer.points;

        // Award points to current team (controller only)
        if (this.isController && answer) {
            this.awardPoints(this.currentTeam, answer.points);
        }
    }
    
    // ===== GAME CONTROLS =====
    
    bindGameControls() {
        const nextQuestionBtn = document.getElementById('btn-next-question');
        const endGameBtn = document.getElementById('btn-end-game');
        const backToBoardBtn = document.getElementById('btn-back-to-board');
        const strikeBtn = document.getElementById('btn-strike');

        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        }

        if (endGameBtn) {
            endGameBtn.addEventListener('click', () => this.endGame());
        }

        if (backToBoardBtn) {
            backToBoardBtn.addEventListener('click', () => this.backToBoard());
        }

        if (strikeBtn) {
            strikeBtn.addEventListener('click', () => this.strike());
        }
    }
    
    nextQuestion() {
        if (this.isController) {
            this.sync.nextQuestion();
        }
        this.currentQuestionIndex++;
        this.currentTeam = (this.currentTeam + 1) % this.teams.length;
        this.showQuestion();
    }
    
    strike() {
        // Sync strike
        if (this.isController) {
            this.sync.strike();
        }
        
        // Switch team
        this.currentTeam = (this.currentTeam + 1) % this.teams.length;
        const td = this.el('current-team-display');
        if (td) td.textContent = `${this.teams[this.currentTeam].name} sin tur`;
    }
    
    
    awardPoints(teamId, points) {
        this.teams[teamId].score += points;
        this.renderTeamsScore();
        
        // Sync award
        if (this.isController) {
            this.sync.awardPoints(teamId, points);
        }
    }
    
    backToBoard() {
        const qd = this.el('question-display');
        const gc = this.el('game-controls');
        const qs = this.el('quiz-selection');
        const ts = this.el('team-setup');
        const gb = this.el('game-board');
        if (qd) qd.classList.add('hidden');
        if (gc) gc.classList.remove('hidden');
        if (qs) qs.classList.remove('hidden');
        if (ts) ts.classList.remove('hidden');
        if (gb) gb.classList.add('hidden');
    }
    
    endGame() {
        if (this.isController) {
            this.sync.endGame();
        }
        this.showWinner();
    }
    
    showWinner() {
        // Find winner
        const sortedTeams = [...this.teams].sort((a, b) => b.score - a.score);
        const winner = sortedTeams[0];
        
        // Render winner modal
        const winnerContent = this.el('winner-content');
        if (!winnerContent) return;
        winnerContent.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:3rem;margin-bottom:16px;">🏆</div>
                <h2 style="font-size:2rem;margin-bottom:8px;">${this.escapeHtml(winner.name)}</h2>
                <p style="font-size:1.5rem;font-weight:700;color:#666;">${winner.score} poeng</p>
                <div style="margin-top:24px;">
                    <h4 style="margin-bottom:12px;">Poengtavle:</h4>
                    ${sortedTeams.map((team, i) => `
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
                            <span>${i + 1}. ${this.escapeHtml(team.name)}</span>
                            <span style="font-weight:700;">${team.score}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const modal = this.el('winner-modal');
        if (modal) modal.classList.remove('hidden');
        
        // Bind winner modal close (only if button exists)
        const closeBtn = this.el('btn-winner-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.classList.add('hidden');
                this.backToBoard();
            });
        }
    }
    
    // ===== SYNC BINDING =====

    bindSync() {
        if (this.isController) {
            // Controller responds to state requests from display
            this.sync.on('request-state', () => {
                this.sync.send('sync-state', {
                    currentQuiz: this.currentQuiz,
                    teams: this.teams,
                    currentQuestionIndex: this.currentQuestionIndex,
                    currentTeam: this.currentTeam,
                    strikes: this.strikes,
                    revealedAnswers: Array.from(this.revealedAnswers),
                    inGame: this.currentQuiz !== null
                });
            });

            // Controller also listens for reveals triggered from display
            this.sync.on('reveal-answer', (data) => {
                this.revealAnswer(data.answerIndex);
            });
            return;
        }

        // Display listens for all sync events from controller
        this.sync.on('reveal-answer', (data) => {
            this.revealAnswer(data.answerIndex);
        });

        this.sync.on('strike', () => {
            this.strike();
        });

        this.sync.on('next-question', () => {
            this.nextQuestion();
        });

        this.sync.on('award-points', (data) => {
            this.awardPoints(data.teamId, data.points);
        });

        this.sync.on('end-game', () => {
            this.endGame();
        });

        this.sync.on('start-game', (data) => {
            const quiz = Storage.getQuizzes().find(q => q.id === data.quizId);
            if (quiz) {
                this.teams = data.teams;
                this.startQuiz(quiz);
            }
        });

        // Sync state from controller
        this.sync.on('sync-state', (data) => {
            this.syncState(data);
        });

        // Sync teams from controller
        this.sync.on('sync-teams', (data) => {
            this.syncTeamsFromController(data);
        });
    }

    syncTeamsFromController(data) {
        this.teams = data.teams;
        this.renderTeamsScore();
    }

    syncState(data) {
        if (!data.inGame) return;

        this.currentQuiz = data.currentQuiz;
        this.teams = data.teams;
        this.currentQuestionIndex = data.currentQuestionIndex;
        this.currentTeam = data.currentTeam;
        this.strikes = data.strikes;
        this.revealedAnswers = new Set(data.revealedAnswers);

        // Update UI (elements may not exist on all pages)
        const ts = this.el('team-setup');
        const qs = this.el('quiz-selection');
        const gb = this.el('game-board');
        if (ts) ts.classList.add('hidden');
        if (qs) qs.classList.add('hidden');
        if (gb) gb.classList.remove('hidden');

        this.renderTeamsScore();

        this.showQuestion();
    }
    
    // ===== EDITOR =====
    
    bindEditor() {
        this.editorQuestions = [];

        // Skip entirely if editor elements don't exist (e.g. display.html)
        if (!this.el('questions-container')) return;

        const addQuestionBtn = this.el('btn-add-question');
        const saveQuizBtn = this.el('btn-save-quiz');
        const clearBtn = this.el('btn-clear');

        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => this.addEditorQuestion());
        }

        if (saveQuizBtn) {
            saveQuizBtn.addEventListener('click', () => this.saveQuiz());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearEditor());
        }
        
        // Initialize with 1 empty question
        this.addEditorQuestion();
    }
    
    addEditorQuestion() {
        const container = document.getElementById('questions-container');
        const questionIndex = this.editorQuestions.length;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'neo-box mb-16';
        questionDiv.dataset.index = questionIndex;
        questionDiv.innerHTML = `
            <div class="form-group">
                <label>Spørsmål ${questionIndex + 1}</label>
                <input type="text" class="form-input editor-question" placeholder="Skriv spørsmål...">
            </div>
            <div class="form-group">
                <label>Svaralternativer (minst 3)</label>
                <div class="answers-container">
                    <!-- Svaralternativer -->
                </div>
                <button class="btn btn-small mt-8 btn-add-answer" data-q-index="${questionIndex}">+ Legg til svar</button>
            </div>
            <button class="btn btn-small btn-danger btn-remove-question" data-q-index="${questionIndex}" style="margin-top:8px;">Fjern spørsmål</button>
        `;
        
        container.appendChild(questionDiv);
        this.editorQuestions.push({ question: '', answers: [] });
        
        // Add 3 empty answers by default
        for (let i = 0; i < 3; i++) {
            this.addEditorAnswer(questionIndex);
        }
        
        // Bind remove button
        questionDiv.querySelector('.btn-remove-question').addEventListener('click', (e) => {
            this.removeEditorQuestion(questionIndex);
        });
        
        // Bind add answer button
        questionDiv.querySelector('.btn-add-answer').addEventListener('click', (e) => {
            this.addEditorAnswer(parseInt(e.target.dataset.qIndex));
        });
    }
    
    addEditorAnswer(questionIndex) {
        const questionDiv = document.querySelector(`.neo-box[data-index="${questionIndex}"]`);
        const answersContainer = questionDiv.querySelector('.answers-container');
        const answerIndex = this.editorQuestions[questionIndex].answers.length;
        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-input';
        answerDiv.dataset.answerIndex = answerIndex;
        answerDiv.innerHTML = `
            <input type="text" class="form-input editor-answer-text" placeholder="Svar...">
            <input type="number" class="form-input editor-answer-points" placeholder="Poeng" min="1" max="99">
            <button class="btn btn-small btn-danger btn-remove-answer">×</button>
        `;
        
        answersContainer.appendChild(answerDiv);
        this.editorQuestions[questionIndex].answers.push({ text: '', points: 0 });
        
        // Bind remove button
        answerDiv.querySelector('.btn-remove-answer').addEventListener('click', (e) => {
            this.removeEditorAnswer(questionIndex, answerIndex);
        });
    }
    
    removeEditorAnswer(questionIndex, answerIndex) {
        const questionDiv = document.querySelector(`.neo-box[data-index="${questionIndex}"]`);
        const answerDiv = questionDiv.querySelector(`.answer-input[data-answerIndex="${answerIndex}"]`);
        
        answerDiv.remove();
        this.editorQuestions[questionIndex].answers.splice(answerIndex, 1);
        
        // Re-index remaining answers
        const answersContainer = questionDiv.querySelector('.answers-container');
        answersContainer.querySelectorAll('.answer-input').forEach((div, i) => {
            div.dataset.answerIndex = i;
        });
    }
    
    removeEditorQuestion(questionIndex) {
        const questionDiv = document.querySelector(`.neo-box[data-index="${questionIndex}"]`);
        questionDiv.remove();
        this.editorQuestions.splice(questionIndex, 1);
        
        // Re-index remaining questions
        const container = document.getElementById('questions-container');
        container.querySelectorAll('.neo-box').forEach((div, i) => {
            div.dataset.index = i;
            div.querySelector('label').textContent = `Spørsmål ${i + 1}`;
            div.querySelector('.btn-add-answer').dataset.qIndex = i;
            div.querySelector('.btn-remove-question').dataset.qIndex = i;
        });
    }
    
    saveQuiz() {
        const title = document.getElementById('quiz-title').value.trim();
        
        if (!title) {
            alert('Tittel er obligatorisk!');
            return;
        }
        
        // Collect questions
        const questions = [];
        document.querySelectorAll('#questions-container .neo-box').forEach((questionDiv, qIndex) => {
            const questionText = questionDiv.querySelector('.editor-question').value.trim();
            const answers = [];
            
            questionDiv.querySelectorAll('.answer-input').forEach((answerDiv, aIndex) => {
                const answerText = answerDiv.querySelector('.editor-answer-text').value.trim();
                const answerPoints = parseInt(answerDiv.querySelector('.editor-answer-points').value) || 0;
                
                if (answerText) {
                    answers.push({ text: answerText, points: answerPoints });
                }
            });
            
            if (questionText && answers.length >= 3) {
                questions.push({ question: questionText, answers });
            }
        });
        
        if (questions.length === 0) {
            alert('Du må ha minst eit spørsmål med minst 3 svaralternativer!');
            return;
        }
        
        const quiz = {
            title,
            questions
        };
        
        Storage.saveQuiz(quiz);
        alert('Quiz lagra!');
        this.clearEditor();
        this.showScreen('saved');
    }
    
    clearEditor() {
        document.getElementById('quiz-title').value = '';
        document.getElementById('questions-container').innerHTML = '';
        
        this.editorQuestions = [];
        
        this.addEditorQuestion();
    }
    
    // ===== SAVED QUIZZES =====
    
    loadSavedQuizzes() {
        const container = this.el('saved-quiz-list');
        if (!container) return;
        const quizzes = Storage.getQuizzes();
        
        if (quizzes.length === 0) {
            container.innerHTML = '<p style="padding:20px;">Ingen lagra quizer.</p>';
            return;
        }
        
        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <h3>${this.escapeHtml(quiz.title)}</h3>
                <p>${quiz.questions.length} spørsmål</p>
                <button class="btn btn-small btn-danger" style="margin-top:8px;">Slett</button>
            `;
            
            card.querySelector('.btn-danger').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Er du sikker på at du vil slette denne quizen?')) {
                    Storage.deleteQuiz(quiz.id);
                    this.loadSavedQuizzes();
                }
            });
            
            container.appendChild(card);
        });
    }
    
    // ===== EXPORT / IMPORT =====
    
    bindExportImport() {
        const exportBtn = document.getElementById('btn-export');
        const importBtn = document.getElementById('btn-import');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportQuizzes());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => this.importQuizzes());
        }
    }
    
    exportQuizzes() {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frødesams-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importQuizzes() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Velg ein fil å importere!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Storage.importData(data)) {
                    alert('Quizer importert!');
                    this.loadSavedQuizzes();
                } else {
                    alert('Import feila!');
                }
            } catch (err) {
                alert('Ugyldig filformat!');
            }
        };
        reader.readAsText(file);
    }
    
    // ===== SAMPLE QUIZZES =====
    
    loadSampleQuizzes() {
        // Check if there are any quizzes, if not load samples
        const quizzes = Storage.getQuizzes();
        if (quizzes.length > 0) return;
        
        const sampleQuizzes = [
            {
                title: 'Skoleliv',
                questions: [
                    {
                        question: 'Hva er det første du tenker på når jeg sier "skole"?',
                        answers: [
                            { text: 'Lærere', points: 45 },
                            { text: 'Venner', points: 30 },
                            { text: 'Mat', points: 15 },
                            { text: 'Friminutt', points: 10 }
                        ]
                    },
                    {
                        question: 'Hva er det morsomste med skolen?',
                        answers: [
                            { text: 'Friminutt', points: 40 },
                            { text: 'Venner', points: 35 },
                            { text: 'Gym', points: 15 },
                            { text: 'Kunst', points: 10 }
                        ]
                    },
                    {
                        question: 'Hva glemmer du oftest å ta med til skolen?',
                        answers: [
                            { text: 'Blyant', points: 35 },
                            { text: 'Bok', points: 30 },
                            { text: 'Matpakke', points: 20 },
                            { text: 'Gymsko', points: 15 }
                        ]
                    }
                ],
            },
            {
                title: 'Norsk natur',
                questions: [
                    {
                        question: 'Hva forbinder du med Norge?',
                        answers: [
                            { text: 'Fjell', points: 40 },
                            { text: 'Fisk', points: 30 },
                            { text: 'Snø', points: 20 },
                            { text: 'Olje', points: 10 }
                        ]
                    },
                    {
                        question: 'Hvilken norsk by vil du besøke?',
                        answers: [
                            { text: 'Oslo', points: 35 },
                            { text: 'Bergen', points: 30 },
                            { text: 'Trondheim', points: 20 },
                            { text: 'Stavanger', points: 15 }
                        ]
                    },
                    {
                        question: 'Hva er det beste med norsk natur?',
                        answers: [
                            { text: 'Fjell', points: 35 },
                            { text: 'Fjorder', points: 30 },
                            { text: 'Skog', points: 20 },
                            { text: 'Sjø', points: 15 }
                        ]
                    }
                ],
            }
        ];
        
        sampleQuizzes.forEach(quiz => {
            Storage.saveQuiz(quiz);
        });
    }
    
    // ===== UTILITIES =====
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
}

// Initialize app
const game = new Frødesams();
