// Main App for Frødebrett
class Frodebrett {
    constructor() {
        this.currentScreen = 'game';
        this.currentQuiz = null;
        this.teams = [];
        this.currentQuestion = null;
        this.dailyDoubleCell = null; // Hidden daily double
        this.answeredCells = new Set();
        this.finalBets = {};
        
        this.init();
    }
    
    init() {
        Storage.migrate();
        this.bindNavigation();
        this.bindTeamSetup();
        this.bindQuestionModal();
        this.bindGameControls();
        this.bindFinalRound();
        this.bindEditor();
        this.bindExportImport();
        this.bindKeyboard();
        this.loadSampleQuizzes();
        this.showScreen('game');
    }
    
    // ===== NAVIGATION =====
    
    bindNavigation() {
        document.getElementById('btn-play').addEventListener('click', () => this.showScreen('game'));
        document.getElementById('btn-editor').addEventListener('click', () => this.showScreen('editor'));
        document.getElementById('btn-saved').addEventListener('click', () => this.showScreen('saved'));
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.remove('hidden');
        }
        
        this.currentScreen = screenName;
        
        if (screenName === 'game') {
            this.loadQuizList();
        } else if (screenName === 'saved') {
            this.loadSavedQuizzes();
        }
    }
    
    // ===== TEAM SETUP =====
    
    bindTeamSetup() {
        document.getElementById('btn-add-team').addEventListener('click', () => this.addTeamInput());
        this.updateTeamRemoveButtons();
    }
    
    addTeamInput() {
        const container = document.getElementById('teams-container');
        const teamCount = container.children.length;
        
        if (teamCount >= 6) {
            alert('Maks 6 team!');
            return;
        }
        
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team-input';
        teamDiv.innerHTML = `
            <input type="text" class="form-input team-name" placeholder="Team ${teamCount + 1}" maxlength="20">
            <button class="btn btn-small btn-danger btn-remove-team">×</button>
        `;
        
        container.appendChild(teamDiv);
        this.updateTeamRemoveButtons();
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
    
    // ===== SAMPLE QUIZZES =====
    
    loadSampleQuizzes() {
        const legacyTitles = ['Norsk geografi', 'Matte 5. trinn', 'Naturfag'];
        const defaultTitles = ['Blanda drops', 'Småtrinn'];

        // Remove old built-in quizzes if they exist
        Storage.getQuizzes()
            .filter(quiz => legacyTitles.includes(quiz.title))
            .forEach(quiz => Storage.deleteQuiz(quiz.id));

        const existingTitles = new Set(Storage.getQuizzes().map(quiz => quiz.title));
        const missingDefaults = defaultTitles.filter(title => !existingTitles.has(title));
        if (missingDefaults.length === 0) {
            return;
        }

        Promise.all([
            fetch('json/frodebrett_Blanda_drops.json').then(res => res.json()),
            fetch('json/frodebrett_Småtrinn.json').then(res => res.json())
        ])
            .then(files => {
                files.forEach(fileData => {
                    if (!fileData || !fileData.quiz) return;
                    const quiz = fileData.quiz;
                    const currentTitles = new Set(Storage.getQuizzes().map(q => q.title));
                    if (!currentTitles.has(quiz.title)) {
                        Storage.saveQuiz(quiz);
                    }
                });

                if (this.currentScreen === 'game') {
                    this.loadQuizList();
                }
            })
            .catch(err => {
                console.error('Klarte ikkje laste standardfrøder:', err);
            });
    }
    
    // ===== QUIZ SELECTION =====
    
    loadQuizList() {
        const quizzes = Storage.getQuizzes();
        const container = document.getElementById('quiz-list');
        
        if (quizzes.length === 0) {
            container.innerHTML = '<p>Ingen frøder funne. Lag ein i editoren!</p>';
            return;
        }
        
        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.categories.length} kategoriar</p>
                <p>${quiz.categories.reduce((sum, cat) => sum + cat.questions.length, 0)} spørsmål</p>
            `;
            card.addEventListener('click', () => this.selectQuiz(quiz));
            container.appendChild(card);
        });
    }
    
    selectQuiz(quiz) {
        this.currentQuiz = quiz;
        this.startGame();
    }
    
    // ===== GAME =====
    
    startGame() {
        const teamInputs = document.querySelectorAll('.team-name');
        this.teams = [];
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        teamInputs.forEach((input, index) => {
            const name = input.value.trim() || `Team ${index + 1}`;
            this.teams.push({
                id: index + 1,
                name: name,
                score: 0,
                color: colors[index % colors.length]
            });
        });
        
        // Hide setup, show game board
        document.getElementById('team-setup').classList.add('hidden');
        document.getElementById('quiz-selection').classList.add('hidden');
        document.getElementById('game-board').classList.remove('hidden');
        
        this.answeredCells.clear();
        this.finalBets = {};
        this.initializeDailyDouble();
        this.renderScoreBoard();
        this.renderGameBoard();
    }
    
    initializeDailyDouble() {
        const totalCells = this.currentQuiz.categories.length * 6;
        this.dailyDoubleCell = Math.floor(Math.random() * totalCells);
    }
    
    renderScoreBoard() {
        const container = document.getElementById('teams-score');
        container.innerHTML = '';
        
        this.teams.forEach(team => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'team-score';
            scoreDiv.style.borderColor = team.color;
            scoreDiv.innerHTML = `
                <span class="team-name-display" style="color: ${team.color}">${team.name}</span>
                <span class="team-points">${team.score}</span>
            `;
            container.appendChild(scoreDiv);
        });
    }
    
    renderGameBoard() {
        const grid = document.getElementById('jeopardy-grid');
        grid.innerHTML = '';
        
        const numCols = this.currentQuiz.categories.length;
        grid.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
        
        // Category headers
        this.currentQuiz.categories.forEach((category, index) => {
            const header = document.createElement('div');
            header.className = 'jeopardy-category';
            header.setAttribute('data-col', index);
            header.style.gridColumn = index + 1;
            header.style.gridRow = 1;
            header.textContent = category.name;
            grid.appendChild(header);
        });
        
        // Auto-fit category header text
        requestAnimationFrame(() => this.autoFitCategoryText());
        
        // Point values: 100 at top, 1000 at bottom
        const pointValues = [100, 200, 300, 400, 500, 1000];
        
        pointValues.forEach((points, rowIndex) => {
            this.currentQuiz.categories.forEach((category, colIndex) => {
                const question = category.questions.find(q => q.points === points);
                const cellKey = `${category.name}-${points}`;
                const isAnswered = this.answeredCells.has(cellKey);
                
                const cell = document.createElement('div');
                cell.className = 'jeopardy-cell';
                cell.setAttribute('data-col', colIndex);
                cell.style.gridColumn = colIndex + 1;
                cell.style.gridRow = rowIndex + 2;
                
                if (isAnswered) {
                    cell.classList.add('answered');
                } else if (question) {
                    cell.textContent = points;
                    const cellIndex = colIndex * 6 + rowIndex;
                    cell.addEventListener('click', () => this.selectQuestion(category, question, cellIndex));
                } else {
                    cell.classList.add('answered');
                }
                
                grid.appendChild(cell);
            });
        });
    }
    
    autoFitCategoryText() {
        document.querySelectorAll('.jeopardy-category').forEach(header => {
            let fontSize = 1.3;
            header.style.fontSize = fontSize + 'rem';
            while (header.scrollHeight > header.clientHeight && fontSize > 0.55) {
                fontSize -= 0.05;
                header.style.fontSize = fontSize + 'rem';
            }
        });
    }
    
    // ===== QUESTION HANDLING =====
    
    selectQuestion(category, question, cellIndex) {
        const isDailyDouble = cellIndex === this.dailyDoubleCell;
        
        this.currentQuestion = {
            category: category.name,
            question: question.question,
            answer: question.answer,
            points: isDailyDouble ? question.points * 2 : question.points,
            isDailyDouble: isDailyDouble
        };
        
        // Mark as answered
        const cellKey = `${category.name}-${question.points}`;
        this.answeredCells.add(cellKey);
        
        this.showQuestion();
    }
    
    showQuestion() {
        const modal = document.getElementById('question-modal');
        
        // Set content
        modal.querySelector('.question-category').textContent = this.currentQuestion.category;
        modal.querySelector('.question-text').textContent = this.currentQuestion.question;
        modal.querySelector('.answer-text').textContent = this.currentQuestion.answer;
        
        // Set points display
        const pointsEl = modal.querySelector('.question-points');
        if (this.currentQuestion.isDailyDouble) {
            pointsEl.textContent = this.currentQuestion.points + ' (Dagens dobbel!)';
            pointsEl.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
        } else {
            pointsEl.textContent = this.currentQuestion.points;
            pointsEl.style.background = '#FDFD96';
        }
        
        // Reset button states
        document.getElementById('btn-reveal-modal').classList.remove('hidden');
        document.getElementById('btn-final-modal').classList.add('hidden');
        modal.querySelector('.question-answer').classList.add('hidden');
        
        // Show point controls immediately
        this.showPointControls();
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        document.getElementById('question-modal').classList.add('hidden');
        document.getElementById('modal-point-controls').classList.add('hidden');
        this.renderGameBoard();
    }
    
    bindQuestionModal() {
        document.getElementById('btn-reveal-modal').addEventListener('click', () => {
            const modal = document.getElementById('question-modal');
            modal.querySelector('.question-answer').classList.remove('hidden');
            document.getElementById('btn-reveal-modal').classList.add('hidden');
        });
        
        document.getElementById('btn-final-modal').addEventListener('click', () => {
            this.closeModal();
            this.startFinalRound();
        });
        
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('btn-back-modal').addEventListener('click', () => {
            this.closeModal();
        });
    }
    
    // ===== POINT CONTROLS =====
    
    bindGameControls() {
        document.getElementById('btn-end-game').addEventListener('click', () => {
            if (confirm('Er du sikker på at du vil avslutte spelet?')) {
                this.endGame();
            }
        });
        
        document.getElementById('btn-go-final').addEventListener('click', () => {
            if (!this.currentQuiz || !this.currentQuiz.final) {
                alert('Denne frøden har ingen finalerunde!');
                return;
            }
            this.closeModal();
            this.startFinalRound();
        });
    }
    
    showPointControls() {
        const container = document.getElementById('modal-point-controls');
        container.innerHTML = '';
        
        const pts = this.currentQuestion ? this.currentQuestion.points : 100;
        
        this.teams.forEach((team, index) => {
            const row = document.createElement('div');
            row.className = 'modal-team-row';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'modal-team-name';
            nameSpan.style.color = team.color;
            nameSpan.textContent = team.name;
            row.appendChild(nameSpan);
            
            const btnsDiv = document.createElement('div');
            btnsDiv.className = 'modal-team-btns';
            
            const btnMinus = document.createElement('button');
            btnMinus.className = 'btn btn-small modal-pts-btn';
            btnMinus.textContent = `\u2212${pts}`;
            btnMinus.dataset.type = 'minus';
            
            const btnZero = document.createElement('button');
            btnZero.className = 'btn btn-small modal-pts-btn';
            btnZero.textContent = '0';
            btnZero.dataset.type = 'zero';
            
            const btnPlus = document.createElement('button');
            btnPlus.className = 'btn btn-small modal-pts-btn';
            btnPlus.textContent = `+${pts}`;
            btnPlus.dataset.type = 'plus';
            
            const allBtns = [btnMinus, btnZero, btnPlus];
            const values = [-pts, 0, pts];
            
            allBtns.forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    // First, revert any previous adjustment for this team
                    const currentBtn = btnsDiv.querySelector('.modal-pts-red, .modal-pts-gray, .modal-pts-green');
                    if (currentBtn) {
                        const currentValue = currentBtn.dataset.appliedValue ? parseInt(currentBtn.dataset.appliedValue) : 0;
                        this.adjustTeamScore(team.id, -currentValue);
                        currentBtn.classList.remove('modal-pts-red', 'modal-pts-gray', 'modal-pts-green');
                        delete currentBtn.dataset.appliedValue;
                    }
                    
                    // Apply new adjustment
                    this.adjustTeamScore(team.id, values[i]);
                    btn.dataset.appliedValue = values[i];
                    if (btn.dataset.type === 'minus') btn.classList.add('modal-pts-red');
                    else if (btn.dataset.type === 'zero') btn.classList.add('modal-pts-gray');
                    else btn.classList.add('modal-pts-green');
                });
                btnsDiv.appendChild(btn);
            });
            
            row.appendChild(btnsDiv);
            container.appendChild(row);
        });
        
        container.classList.remove('hidden');
    }
    
    adjustTeamScore(teamId, points) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            this.renderScoreBoard();
        }
    }
    
    allQuestionsAnswered() {
        const totalQuestions = this.currentQuiz.categories.reduce((sum, cat) => sum + cat.questions.length, 0);
        return this.answeredCells.size >= totalQuestions;
    }
    
    // ===== FINAL ROUND =====
    
    startFinalRound() {
        if (!this.currentQuiz.final) {
            alert('Denne frøden har ingen finalerunde!');
            return;
        }
        
        // Hide game elements, show final round
        document.getElementById('question-modal').classList.add('hidden');
        document.getElementById('jeopardy-grid').classList.add('hidden');
        document.getElementById('game-controls').classList.add('hidden');
        document.getElementById('score-board').classList.add('hidden');
        document.getElementById('final-round').classList.remove('hidden');
        
        // Show category and hint
        document.getElementById('final-category-display').textContent = this.currentQuiz.final.category;
        document.getElementById('final-clue-display').textContent = this.currentQuiz.final.hint || '';
        
        // Reset final round UI
        document.getElementById('final-betting').classList.remove('hidden');
        document.getElementById('final-question').classList.add('hidden');
        document.querySelector('.final-answer').classList.add('hidden');
        document.getElementById('btn-reveal-final').classList.remove('hidden');
        document.getElementById('btn-final-points').classList.add('hidden');
        document.getElementById('btn-end-game-final').classList.add('hidden');
        
        // Setup betting
        this.setupBettingControls();
    }
    
    setupBettingControls() {
        const container = document.getElementById('betting-controls');
        container.innerHTML = '';
        this.finalBets = {};
        
        this.teams.forEach(team => {
            const bettingDiv = document.createElement('div');
            bettingDiv.className = 'team-betting';
            
            const label = document.createElement('h5');
            label.style.color = team.color;
            label.textContent = `${team.name} (${team.score} poeng)`;
            bettingDiv.appendChild(label);
            
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'bet-input form-input';
            input.id = `bet-${team.id}`;
            input.min = 0;
            input.max = team.score;
            input.value = 0;
            input.addEventListener('input', () => {
                let val = parseInt(input.value) || 0;
                if (val < 0) val = 0;
                if (val > team.score) val = team.score;
                input.value = val;
                this.finalBets[team.id] = val;
            });
            bettingDiv.appendChild(input);
            
            container.appendChild(bettingDiv);
            this.finalBets[team.id] = 0;
        });
        
        // Add continue button
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary mt-16';
        continueBtn.textContent = 'Vis spørsmål';
        continueBtn.onclick = () => this.showFinalQuestion();
        container.appendChild(continueBtn);
    }
    
    showFinalQuestion() {
        document.getElementById('final-betting').classList.add('hidden');
        document.getElementById('final-question').classList.remove('hidden');
        
        // Show hint and question, but keep answer hidden
        document.getElementById('final-clue-display').textContent = this.currentQuiz.final.hint || '';
        document.getElementById('final-question-display').textContent = this.currentQuiz.final.question;
        document.getElementById('final-answer-display').textContent = this.currentQuiz.final.answer;
        
        // Ensure answer is hidden until reveal
        document.querySelector('.final-answer').classList.add('hidden');
        document.getElementById('btn-reveal-final').classList.remove('hidden');
        document.getElementById('btn-final-points').classList.add('hidden');
    }
    
    bindFinalRound() {
        document.getElementById('btn-reveal-final').addEventListener('click', () => {
            document.querySelector('.final-answer').classList.remove('hidden');
            document.getElementById('btn-reveal-final').classList.add('hidden');
            document.getElementById('btn-final-points').classList.remove('hidden');
        });
        
        document.getElementById('btn-final-points').addEventListener('click', () => {
            this.processFinalResults();
        });
        
        document.getElementById('btn-end-game-final').addEventListener('click', () => {
            this.endGame();
        });
        
        document.getElementById('btn-winner-close').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
            this.resetGame();
        });
    }
    
    processFinalResults() {
        const container = document.getElementById('final-point-controls');
        container.innerHTML = '';
        
        this.teams.forEach(team => {
            const bet = this.finalBets[team.id] || 0;
            const row = document.createElement('div');
            row.className = 'modal-team-row';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'modal-team-name';
            nameSpan.style.color = team.color;
            nameSpan.textContent = `${team.name} (satsa ${bet})`;
            row.appendChild(nameSpan);
            
            const btnsDiv = document.createElement('div');
            btnsDiv.className = 'modal-team-btns';
            
            const btnMinus = document.createElement('button');
            btnMinus.className = 'btn btn-small modal-pts-btn';
            btnMinus.textContent = `\u2212${bet}`;
            btnMinus.dataset.type = 'minus';
            
            const btnZero = document.createElement('button');
            btnZero.className = 'btn btn-small modal-pts-btn';
            btnZero.textContent = '0';
            btnZero.dataset.type = 'zero';
            
            const btnPlus = document.createElement('button');
            btnPlus.className = 'btn btn-small modal-pts-btn';
            btnPlus.textContent = `+${bet}`;
            btnPlus.dataset.type = 'plus';
            
            const allBtns = [btnMinus, btnZero, btnPlus];
            const values = [-bet, 0, bet];
            
            allBtns.forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    // First, revert any previous adjustment for this team
                    const currentBtn = btnsDiv.querySelector('.modal-pts-red, .modal-pts-gray, .modal-pts-green');
                    if (currentBtn) {
                        const currentValue = currentBtn.dataset.appliedValue ? parseInt(currentBtn.dataset.appliedValue) : 0;
                        this.adjustTeamScore(team.id, -currentValue);
                        currentBtn.classList.remove('modal-pts-red', 'modal-pts-gray', 'modal-pts-green');
                        delete currentBtn.dataset.appliedValue;
                    }

                    // Apply new adjustment
                    this.adjustTeamScore(team.id, values[i]);
                    btn.dataset.appliedValue = values[i];
                    if (btn.dataset.type === 'minus') btn.classList.add('modal-pts-red');
                    else if (btn.dataset.type === 'zero') btn.classList.add('modal-pts-gray');
                    else btn.classList.add('modal-pts-green');
                });
                btnsDiv.appendChild(btn);
            });
            
            row.appendChild(btnsDiv);
            container.appendChild(row);
        });
        
        container.classList.remove('hidden');
        document.getElementById('btn-final-points').classList.add('hidden');
        document.getElementById('btn-end-game-final').classList.remove('hidden');
    }
    
    endGame() {
        if (this.teams.length === 0) {
            this.resetGame();
            return;
        }
        
        const winner = this.teams.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        this.showWinnerModal(winner);
    }
    
    showWinnerModal(winner) {
        const modal = document.getElementById('winner-modal');
        const nameEl = modal.querySelector('.winner-name');
        const scoreEl = modal.querySelector('.winner-score');
        const trophyEl = modal.querySelector('.winner-trophy');
        
        nameEl.textContent = winner.name;
        nameEl.style.color = winner.color;
        scoreEl.textContent = `${winner.score} poeng`;
        trophyEl.textContent = '🏆';
        
        modal.classList.remove('hidden');
    }
    
    resetGame() {
        this.currentQuiz = null;
        this.teams = [];
        this.currentQuestion = null;
        this.dailyDoubleCell = null;
        this.answeredCells.clear();
        this.finalBets = {};
        
        document.getElementById('game-board').classList.add('hidden');
        document.getElementById('final-round').classList.add('hidden');
        document.getElementById('question-modal').classList.add('hidden');
        document.getElementById('modal-point-controls').classList.add('hidden');
        document.getElementById('final-point-controls').classList.add('hidden');
        document.getElementById('team-setup').classList.remove('hidden');
        document.getElementById('quiz-selection').classList.remove('hidden');
        document.getElementById('score-board').classList.remove('hidden');
        document.getElementById('game-controls').classList.remove('hidden');
        document.getElementById('jeopardy-grid').classList.remove('hidden');
        
        document.querySelectorAll('.team-name').forEach(input => input.value = '');
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    
    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        if (this.currentScreen === 'editor') this.saveQuiz();
                        break;
                    case 'n':
                        e.preventDefault();
                        if (this.currentScreen === 'editor') this.clearEditor();
                        break;
                }
                return;
            }
            
            if (this.currentScreen === 'game') {
                this.handleGameKeyboard(e);
            }
        });
    }
    
    handleGameKeyboard(e) {
        const modal = document.getElementById('question-modal');
        const modalVisible = !modal.classList.contains('hidden');
        
        switch(e.key) {
            case 'Escape':
                if (modalVisible) {
                    this.closeModal();
                } else if (!document.getElementById('final-round').classList.contains('hidden')) {
                    this.endGame();
                }
                break;
            case 'Enter':
                if (modalVisible) {
                    const revealBtn = document.getElementById('btn-reveal-modal');
                    if (!revealBtn.classList.contains('hidden')) {
                        revealBtn.click();
                    }
                }
                break;
            case ' ':
                e.preventDefault();
                if (!document.getElementById('team-setup').classList.contains('hidden')) {
                    document.getElementById('btn-add-team').click();
                }
                break;
        }
    }
    
    // ===== SAVED QUIZZES =====
    
    loadSavedQuizzes() {
        const quizzes = Storage.getQuizzes();
        const container = document.getElementById('saved-list');
        
        if (quizzes.length === 0) {
            container.innerHTML = '<p>Ingen lagra frøder.</p>';
        } else {
            container.innerHTML = '';
            quizzes.forEach(quiz => {
                const item = document.createElement('div');
                item.className = 'neo-box';
                item.style.marginBottom = '12px';
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="margin:0 0 4px 0;">${quiz.title}</h3>
                            <p style="margin:0; font-size:0.9rem; color:#666;">
                                ${quiz.categories.length} kategoriar, 
                                ${quiz.categories.reduce((sum, cat) => sum + cat.questions.length, 0)} spørsmål
                            </p>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-small btn-primary" onclick="game.editQuiz('${quiz.id}')">Rediger</button>
                            <button class="btn btn-small btn-danger" onclick="game.deleteQuiz('${quiz.id}')">Slett</button>
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        }
        
        // Populate export dropdown
        this.populateExportSelect(quizzes);
    }
    
    // ===== EXPORT / IMPORT =====
    
    bindExportImport() {
        document.getElementById('btn-export-quiz').addEventListener('click', () => this.exportQuiz());
        document.getElementById('btn-import-quiz').addEventListener('click', () => {
            document.getElementById('import-quiz-file').click();
        });
        document.getElementById('import-quiz-file').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importQuiz(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    
    populateExportSelect(quizzes) {
        const select = document.getElementById('export-quiz-select');
        if (!select) return;
        select.innerHTML = '<option value="">Vel ein frøde...</option>';
        (quizzes || Storage.getQuizzes()).forEach(q => {
            const opt = document.createElement('option');
            opt.value = q.id;
            opt.textContent = q.title;
            select.appendChild(opt);
        });
    }
    
    exportQuiz() {
        const select = document.getElementById('export-quiz-select');
        const quizId = select.value;
        if (!quizId) {
            alert('Vel ein frøde å eksportere!');
            return;
        }
        const quiz = Storage.getQuizzes().find(q => q.id === quizId);
        if (!quiz) return;
        
        const exportData = {
            frodebrett: true,
            version: 1,
            quiz: quiz
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frodebrett_${quiz.title.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').replace(/ /g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importQuiz(file) {
        const statusEl = document.getElementById('import-status');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if ((!data.frodebrett && !data.frodetavla) || !data.quiz) {
                    statusEl.innerHTML = '<span style="color:#C62828;font-weight:700;">⚠ Ugyldig fil. Fila må vere eksportert frå Frødebrett.</span>';
                    statusEl.classList.remove('hidden');
                    return;
                }
                
                const quiz = data.quiz;
                quiz.id = Storage.generateId('quiz');
                quiz.created = new Date().toISOString();
                
                if (Storage.saveQuiz(quiz)) {
                    statusEl.innerHTML = `<span style="color:#2E7D32;font-weight:700;">✅ «${quiz.title}» importert!</span>`;
                    statusEl.classList.remove('hidden');
                    this.loadSavedQuizzes();
                } else {
                    statusEl.innerHTML = '<span style="color:#C62828;font-weight:700;">⚠ Feil ved lagring.</span>';
                    statusEl.classList.remove('hidden');
                }
            } catch (err) {
                statusEl.innerHTML = '<span style="color:#C62828;font-weight:700;">⚠ Kunne ikkje lese fila. Er det ei gyldig .json-fil?</span>';
                statusEl.classList.remove('hidden');
            }
        };
        reader.readAsText(file);
    }
    
    // ===== EDITOR =====
    
    bindEditor() {
        // Category data: array of {name, questions: [{points, question, answer}]}
        this.editorCategories = [];
        this.activeTab = 0;
        
        document.getElementById('btn-add-category').addEventListener('click', () => this.addEditorCategory());
        document.getElementById('btn-remove-category').addEventListener('click', () => this.removeEditorCategory());
        document.getElementById('btn-save-quiz').addEventListener('click', () => this.saveQuiz());
        document.getElementById('btn-preview').addEventListener('click', () => this.previewQuiz());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearEditor());
        
        // Final round toggle
        document.getElementById('final-round-toggle').addEventListener('change', (e) => {
            document.getElementById('final-round-fields').classList.toggle('hidden', !e.target.checked);
        });
        
        // Preview modal
        document.getElementById('btn-close-preview').addEventListener('click', () => {
            document.getElementById('preview-modal').classList.add('hidden');
        });
        document.getElementById('btn-preview-reveal').addEventListener('click', () => {
            document.getElementById('preview-answer-text').classList.remove('hidden');
        });
        document.getElementById('btn-preview-back').addEventListener('click', () => {
            document.getElementById('preview-question').classList.add('hidden');
            document.getElementById('preview-board').classList.remove('hidden');
        });
        
        // Initialize with 2 empty categories
        this.initEditorCategories(2);
    }
    
    initEditorCategories(count) {
        this.editorCategories = [];
        for (let i = 0; i < count; i++) {
            this.editorCategories.push(this.emptyCategory());
        }
        this.activeTab = 0;
        this.renderEditorTabs();
        this.renderActiveTabContent();
    }
    
    emptyCategory() {
        const points = [100, 200, 300, 400, 500, 1000];
        return {
            name: '',
            questions: points.map(p => ({ points: p, question: '', answer: '' }))
        };
    }
    
    renderEditorTabs() {
        const container = document.getElementById('category-tabs');
        container.innerHTML = '';
        
        this.editorCategories.forEach((cat, i) => {
            const tab = document.createElement('button');
            tab.className = 'editor-tab' + (i === this.activeTab ? ' active' : '');
            tab.textContent = cat.name || `Kategori ${i + 1}`;
            tab.addEventListener('click', () => {
                this.saveActiveTabContent();
                this.activeTab = i;
                this.renderEditorTabs();
                this.renderActiveTabContent();
            });
            container.appendChild(tab);
        });
        
        // Update remove button state (min 2)
        document.getElementById('btn-remove-category').disabled = this.editorCategories.length <= 2;
        document.getElementById('btn-add-category').disabled = this.editorCategories.length >= 6;
    }
    
    renderActiveTabContent() {
        const container = document.getElementById('category-tab-content');
        const cat = this.editorCategories[this.activeTab];
        if (!cat) return;
        
        const points = [100, 200, 300, 400, 500, 1000];
        
        container.innerHTML = `
            <div class="form-group">
                <label>Kategorinamn</label>
                <input type="text" class="form-input" id="editor-cat-name" value="${this.escapeHtml(cat.name)}" placeholder="Skriv kategorinamn..." maxlength="30">
            </div>
            ${points.map((p, qi) => {
                const q = cat.questions[qi] || { points: p, question: '', answer: '' };
                return `
                    <div class="question-input" data-qi="${qi}">
                        <span class="points-label">${p}</span>
                        <input type="text" class="form-input question-text" value="${this.escapeHtml(q.question)}" placeholder="Spørsmål for ${p} poeng">
                        <input type="text" class="form-input answer-text" value="${this.escapeHtml(q.answer)}" placeholder="Svar">
                    </div>
                `;
            }).join('')}
        `;
        
        // Update tab name live
        const nameInput = document.getElementById('editor-cat-name');
        nameInput.addEventListener('input', () => {
            this.editorCategories[this.activeTab].name = nameInput.value.trim();
            const tabs = document.querySelectorAll('.editor-tab');
            if (tabs[this.activeTab]) {
                tabs[this.activeTab].textContent = nameInput.value.trim() || `Kategori ${this.activeTab + 1}`;
            }
        });
    }
    
    saveActiveTabContent() {
        const cat = this.editorCategories[this.activeTab];
        if (!cat) return;
        
        const nameInput = document.getElementById('editor-cat-name');
        if (nameInput) cat.name = nameInput.value.trim();
        
        document.querySelectorAll('#category-tab-content .question-input').forEach((row, qi) => {
            if (cat.questions[qi]) {
                cat.questions[qi].question = row.querySelector('.question-text').value.trim();
                cat.questions[qi].answer = row.querySelector('.answer-text').value.trim();
            }
        });
    }
    
    addEditorCategory() {
        if (this.editorCategories.length >= 6) return;
        this.saveActiveTabContent();
        this.editorCategories.push(this.emptyCategory());
        this.activeTab = this.editorCategories.length - 1;
        this.renderEditorTabs();
        this.renderActiveTabContent();
    }
    
    removeEditorCategory() {
        if (this.editorCategories.length <= 2) return;
        this.editorCategories.splice(this.activeTab, 1);
        if (this.activeTab >= this.editorCategories.length) {
            this.activeTab = this.editorCategories.length - 1;
        }
        this.renderEditorTabs();
        this.renderActiveTabContent();
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    showEditorError(messages) {
        const el = document.getElementById('editor-errors');
        el.innerHTML = messages.map(m => `<div class="editor-error-item">⚠ ${m}</div>`).join('');
        el.classList.remove('hidden');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    hideEditorError() {
        document.getElementById('editor-errors').classList.add('hidden');
    }
    
    validateEditor() {
        this.saveActiveTabContent();
        const errors = [];
        const warnings = [];
        
        const title = document.getElementById('quiz-title').value.trim();
        if (!title) errors.push('Tittel manglar.');
        
        this.editorCategories.forEach((cat, i) => {
            if (!cat.name) {
                errors.push(`Kategori ${i + 1} manglar namn.`);
            }
            const filled = cat.questions.filter(q => q.question && q.answer);
            if (filled.length === 0) {
                errors.push(`Kategori ${i + 1} («${cat.name || 'utan namn'}») har ingen spørsmål.`);
            }
            cat.questions.forEach(q => {
                if (q.question && !q.answer) {
                    warnings.push(`Kategori «${cat.name || 'Kategori ' + (i + 1)}», ${q.points} poeng: Manglar svar.`);
                }
            });
        });
        
        const finalToggle = document.getElementById('final-round-toggle').checked;
        if (finalToggle) {
            const fc = document.getElementById('editor-final-category').value.trim();
            const fq = document.getElementById('editor-final-question').value.trim();
            const fa = document.getElementById('editor-final-answer').value.trim();
            if (!fc) errors.push('Finalerunde: Kategori manglar.');
            if (!fq) errors.push('Finalerunde: Spørsmål manglar.');
            if (!fa) errors.push('Finalerunde: Svar manglar.');
        }
        
        return { errors, warnings };
    }
    
    showEditorWarning(messages) {
        const el = document.getElementById('editor-errors');
        el.innerHTML = messages.map(m => `<div class="editor-warning-item">⚠ ${m}</div>`).join('');
        el.classList.remove('hidden');
    }
    
    saveQuiz() {
        const { errors, warnings } = this.validateEditor();
        if (errors.length > 0) {
            this.showEditorError(errors);
            return;
        }
        this.hideEditorError();
        
        const title = document.getElementById('quiz-title').value.trim();
        const categories = this.editorCategories.map(cat => ({
            name: cat.name,
            questions: cat.questions.filter(q => q.question && q.answer)
        }));
        
        const finalToggle = document.getElementById('final-round-toggle').checked;
        const final = finalToggle ? this.extractFinalFromForm() : null;
        
        const quiz = {
            id: this.editingQuizId || Storage.generateId('quiz'),
            title: title,
            categories: categories,
            final: final,
            created: new Date().toISOString()
        };
        
        if (Storage.saveQuiz(quiz)) {
            const el = document.getElementById('editor-errors');
            let html = '<div class="editor-success">✅ Frøde lagra!</div>';
            if (warnings.length > 0) {
                html += warnings.map(w => `<div class="editor-warning-item">⚠ ${w}</div>`).join('');
            }
            el.innerHTML = html;
            el.classList.remove('hidden');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                this.clearEditor();
                this.showScreen('saved');
            }, warnings.length > 0 ? 2000 : 800);
        } else {
            this.showEditorError(['Feil ved lagring!']);
        }
    }
    
    extractFinalFromForm() {
        const category = document.getElementById('editor-final-category').value.trim();
        const hint = document.getElementById('editor-final-clue').value.trim();
        const question = document.getElementById('editor-final-question').value.trim();
        const answer = document.getElementById('editor-final-answer').value.trim();
        
        if (category && question && answer) {
            return { category, hint, question, answer };
        }
        return null;
    }
    
    previewQuiz() {
        this.saveActiveTabContent();
        const categories = this.editorCategories.filter(c => c.name && c.questions.some(q => q.question && q.answer));
        
        if (categories.length === 0) {
            this.showEditorError(['Legg til minst éin kategori med spørsmål for å førehandsvise.']);
            return;
        }
        this.hideEditorError();
        
        const title = document.getElementById('quiz-title').value.trim() || 'Utan tittel';
        document.getElementById('preview-title').textContent = title;
        
        const board = document.getElementById('preview-board');
        board.innerHTML = '';
        board.classList.remove('hidden');
        document.getElementById('preview-question').classList.add('hidden');
        
        const numCols = categories.length;
        board.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        
        // Headers
        categories.forEach((cat, ci) => {
            const header = document.createElement('div');
            header.className = 'preview-header';
            header.style.background = colors[ci % colors.length];
            header.textContent = cat.name;
            board.appendChild(header);
        });
        
        // Cells
        const pointValues = [100, 200, 300, 400, 500, 1000];
        pointValues.forEach(pts => {
            categories.forEach((cat, ci) => {
                const q = cat.questions.find(qu => qu.points === pts && qu.question && qu.answer);
                const cell = document.createElement('div');
                cell.className = 'preview-cell';
                cell.setAttribute('data-col', ci);
                if (q) {
                    cell.textContent = pts;
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => this.showPreviewQuestion(q, colors[ci % colors.length]));
                } else {
                    cell.classList.add('preview-empty');
                }
                board.appendChild(cell);
            });
        });
        
        document.getElementById('preview-modal').classList.remove('hidden');
    }
    
    showPreviewQuestion(q, color) {
        document.getElementById('preview-board').classList.add('hidden');
        const qDiv = document.getElementById('preview-question');
        qDiv.classList.remove('hidden');
        document.getElementById('preview-question-text').textContent = `${q.points} poeng: ${q.question}`;
        const ansEl = document.getElementById('preview-answer-text');
        ansEl.textContent = `Svar: ${q.answer}`;
        ansEl.classList.add('hidden');
    }
    
    clearEditor() {
        document.getElementById('quiz-title').value = '';
        document.getElementById('editor-final-category').value = '';
        document.getElementById('editor-final-clue').value = '';
        document.getElementById('editor-final-question').value = '';
        document.getElementById('editor-final-answer').value = '';
        document.getElementById('final-round-toggle').checked = false;
        document.getElementById('final-round-fields').classList.add('hidden');
        this.editingQuizId = null;
        this.hideEditorError();
        this.initEditorCategories(2);
    }
    
    editQuiz(quizId) {
        const quizzes = Storage.getQuizzes();
        const quiz = quizzes.find(q => q.id === quizId);
        
        if (!quiz) {
            alert('Frøde ikkje funne!');
            return;
        }
        
        this.editingQuizId = quizId;
        document.getElementById('quiz-title').value = quiz.title;
        this.hideEditorError();
        
        // Load categories into tab system
        const points = [100, 200, 300, 400, 500, 1000];
        this.editorCategories = quiz.categories.map(cat => ({
            name: cat.name,
            questions: points.map(p => {
                const existing = cat.questions.find(q => q.points === p);
                return existing ? { ...existing } : { points: p, question: '', answer: '' };
            })
        }));
        
        // Ensure minimum 2 categories
        while (this.editorCategories.length < 2) {
            this.editorCategories.push(this.emptyCategory());
        }
        
        this.activeTab = 0;
        this.renderEditorTabs();
        this.renderActiveTabContent();
        
        // Final round
        if (quiz.final) {
            document.getElementById('final-round-toggle').checked = true;
            document.getElementById('final-round-fields').classList.remove('hidden');
            document.getElementById('editor-final-category').value = quiz.final.category;
            document.getElementById('editor-final-clue').value = quiz.final.hint || '';
            document.getElementById('editor-final-question').value = quiz.final.question;
            document.getElementById('editor-final-answer').value = quiz.final.answer;
        } else {
            document.getElementById('final-round-toggle').checked = false;
            document.getElementById('final-round-fields').classList.add('hidden');
        }
        
        this.showScreen('editor');
    }
    
    deleteQuiz(quizId) {
        if (confirm('Er du sikker på at du vil slette denne frøden?')) {
            Storage.deleteQuiz(quizId);
            this.loadSavedQuizzes();
        }
    }
}

// Initialize
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Frodebrett();
});
