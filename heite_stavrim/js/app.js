// Heite Stavrim — Hovudlogikk

const DEFAULT_TEAM_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD166', '#A78BFA'];
const POINTS_UNIQUE = 3;
const POINTS_DUPLICATE = 1;
const AUDIO_PATH = '../_resources/audio/stopp-lyd.mp3';

class HeiteStavrimGame {
    constructor() {
        this.config = {
            categoryCount: 3,
            letterCount: 1,
            categoryLanguage: 'nn',
            categorySource: 'random',
            letterSource: 'random',
            manualLetters: '',
            manualCategories: '',
            timeLimit: 120,
            teamCount: 2
        };

        this.teams = []; // [{id, name, color, totalScore}]
        this.round = {
            letters: [],
            categories: [],
            answers: {}, // { 'teamId-catIdx-letterIdx': { text, status, points } }
            roundScores: {} // { teamId: points }
        };

        this.timer = { handle: null, timeLeft: 0, paused: false };
        this.audio = new Audio(AUDIO_PATH);
        this.audio.preload = 'auto';

        this.cacheElements();
        this.attachEvents();
        this.loadFromStorage();
        this.renderTeamInputs();
        this.syncRadioStyles();
    }

    cacheElements() {
        const id = (s) => document.getElementById(s);
        this.el = {
            // Sections
            setup: id('setup-section'),
            game: id('game-section'),
            answer: id('answer-section'),
            results: id('results-section'),
            // Setup
            categoryCount: id('categoryCount'),
            letterCount: id('letterCount'),
            timeLimit: id('timeLimit'),
            teamCount: id('teamCount'),
            categoryLanguage: id('categoryLanguage'),
            languageWrap: id('languageWrap'),
            manualLetters: id('manualLetters'),
            manualLettersWrap: id('manualLettersWrap'),
            manualCategories: id('manualCategories'),
            manualCatsWrap: id('manualCatsWrap'),
            customCatsSelect: id('customCatsSelect'),
            customCatsSelectWrap: id('customCatsSelectWrap'),
            teamInputs: id('teamInputs'),
            startBtn: id('startGame'),
            manageCustomBtn: id('manageCustomBtn'),
            // Game
            lettersDisplay: id('lettersDisplay'),
            categoriesDisplay: id('categoriesDisplay'),
            timerDisplay: id('timerDisplay'),
            pauseBtn: id('pauseTimer'),
            addTimeBtn: id('addTime'),
            endRoundBtn: id('endRound'),
            teamScores: id('teamScoresDisplay'),
            // Answer
            writeAnswers: id('writeAnswersMode'),
            directPoints: id('directPointsMode'),
            backToGameBtn: id('backToGame'),
            submitBtn: id('submitAnswers'),
            // Results
            finalScores: id('finalScores'),
            newRoundBtn: id('newRound'),
            resetScoresBtn: id('resetScores'),
            newGameBtn: id('newGame'),
            // Modal
            customModal: id('customModal'),
            customEditor: id('customCategoriesEditor'),
            customSaveBtn: id('customSaveBtn'),
            customCancelBtn: id('customCancelBtn'),
            customCloseBtn: id('customModalClose')
        };
    }

    attachEvents() {
        // Letter source
        document.querySelectorAll('input[name="letterSource"]').forEach(r => {
            r.addEventListener('change', () => {
                this.config.letterSource = r.value;
                this.el.manualLettersWrap.style.display = r.value === 'manual' ? '' : 'none';
                this.syncRadioStyles();
            });
        });

        // Category source
        document.querySelectorAll('input[name="categorySource"]').forEach(r => {
            r.addEventListener('change', () => {
                this.config.categorySource = r.value;
                this.el.manualCatsWrap.style.display = r.value === 'manual' ? '' : 'none';
                this.el.customCatsSelectWrap.style.display = r.value === 'custom' ? '' : 'none';
                this.el.languageWrap.style.display = r.value === 'random' ? '' : 'none';
                if (r.value === 'custom') {
                    this.populateCustomCategoriesSelect();
                }
                this.syncRadioStyles();
            });
        });

        // Answer mode (delegated)
        document.querySelectorAll('input[name="answerMode"]').forEach(r => {
            r.addEventListener('change', () => {
                this.el.writeAnswers.style.display = r.value === 'write' ? '' : 'none';
                this.el.directPoints.style.display = r.value === 'points' ? '' : 'none';
                this.syncRadioStyles();
            });
        });

        // Team count
        this.el.teamCount.addEventListener('change', () => this.renderTeamInputs());

        // Buttons
        this.el.startBtn.addEventListener('click', () => this.startGame());
        this.el.pauseBtn.addEventListener('click', () => this.togglePause());
        this.el.addTimeBtn.addEventListener('click', () => this.addTime(30));
        this.el.endRoundBtn.addEventListener('click', () => this.endRound());
        this.el.backToGameBtn.addEventListener('click', () => this.backToGame());
        this.el.submitBtn.addEventListener('click', () => this.submitAnswers());
        this.el.newRoundBtn.addEventListener('click', () => this.startNewRound());
        this.el.resetScoresBtn.addEventListener('click', () => this.resetScores());
        this.el.newGameBtn.addEventListener('click', () => this.gotoSetup());

        // Custom categories modal
        this.el.manageCustomBtn.addEventListener('click', () => this.openCustomModal());
        this.el.customSaveBtn.addEventListener('click', () => this.saveCustomCategories());
        this.el.customCancelBtn.addEventListener('click', () => this.closeCustomModal());
        this.el.customCloseBtn.addEventListener('click', () => this.closeCustomModal());
        this.el.customModal.addEventListener('click', (e) => {
            if (e.target === this.el.customModal) this.closeCustomModal();
        });

        // Event delegation for answer-status buttons
        this.el.writeAnswers.addEventListener('click', (e) => {
            const btn = e.target.closest('.status-btn');
            if (!btn) return;
            this.toggleAnswerStatus(btn);
        });

        // Live answer text input
        this.el.writeAnswers.addEventListener('input', (e) => {
            if (e.target.classList.contains('answer-input')) {
                const key = e.target.dataset.key;
                if (this.round.answers[key]) {
                    this.round.answers[key].text = e.target.value;
                }
            }
        });

        // Direct points live update
        this.el.directPoints.addEventListener('input', (e) => {
            if (e.target.classList.contains('direct-points-field')) {
                const teamId = parseInt(e.target.dataset.team, 10);
                this.round.roundScores[teamId] = parseInt(e.target.value, 10) || 0;
            }
        });

        // Direct points plus/minus buttons
        this.el.directPoints.addEventListener('click', (e) => {
            if (e.target.classList.contains('points-plus')) {
                const teamId = parseInt(e.target.dataset.team, 10);
                const input = this.el.directPoints.querySelector(`.direct-points-field[data-team="${teamId}"]`);
                const current = parseInt(input.value, 10) || 0;
                input.value = current + 1;
                this.round.roundScores[teamId] = current + 1;
            } else if (e.target.classList.contains('points-minus')) {
                const teamId = parseInt(e.target.dataset.team, 10);
                const input = this.el.directPoints.querySelector(`.direct-points-field[data-team="${teamId}"]`);
                const current = parseInt(input.value, 10) || 0;
                input.value = current - 1;
                this.round.roundScores[teamId] = current - 1;
            }
        });
    }

    syncRadioStyles() {
        document.querySelectorAll('.radio-label').forEach(label => {
            const input = label.querySelector('input[type="radio"]');
            if (input) label.classList.toggle('checked', input.checked);
        });
    }

    // ============== STORAGE ==============

    populateCustomCategoriesSelect() {
        const custom = HeiteStavrimStorage.getCustomCategories();
        this.el.customCatsSelect.innerHTML = custom.map(cat =>
            `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`
        ).join('');
    }

    loadFromStorage() {
        const settings = HeiteStavrimStorage.getLastSettings();
        if (settings) {
            Object.assign(this.config, settings);
            const setRadio = (name, value) => {
                const r = document.querySelector(`input[name="${name}"][value="${value}"]`);
                if (r) r.checked = true;
            };
            setRadio('letterSource', this.config.letterSource);
            setRadio('categorySource', this.config.categorySource);
            this.el.categoryCount.value = this.config.categoryCount;
            this.el.letterCount.value = this.config.letterCount;
            this.el.timeLimit.value = this.config.timeLimit;
            this.el.teamCount.value = this.config.teamCount;
            this.el.categoryLanguage.value = this.config.categoryLanguage;
            this.el.manualLettersWrap.style.display = this.config.letterSource === 'manual' ? '' : 'none';
            this.el.manualCatsWrap.style.display = this.config.categorySource === 'manual' ? '' : 'none';
            this.el.customCatsSelectWrap.style.display = this.config.categorySource === 'custom' ? '' : 'none';
            this.el.languageWrap.style.display = this.config.categorySource === 'random' ? '' : 'none';
            if (this.config.categorySource === 'custom') {
                this.populateCustomCategoriesSelect();
            }
        }

        const teams = HeiteStavrimStorage.getTeamConfig();
        if (teams && teams.length) {
            this.savedTeamNames = teams;
        }
    }

    saveCurrentSettings() {
        HeiteStavrimStorage.saveLastSettings(this.config);
        HeiteStavrimStorage.saveTeamConfig(this.teams.map(t => ({ name: t.name, color: t.color })));
    }

    // ============== TEAMS ==============

    renderTeamInputs() {
        const count = parseInt(this.el.teamCount.value, 10);
        this.config.teamCount = count;
        const saved = this.savedTeamNames || [];
        const existing = [...this.el.teamInputs.querySelectorAll('.team-input-row')].map(row => ({
            name: row.querySelector('.team-name-input').value,
            color: row.querySelector('.team-color-input').value
        }));

        this.el.teamInputs.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const prev = existing[i] || saved[i];
            const name = prev?.name || `Team ${i + 1}`;
            const color = prev?.color || DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length];
            const row = document.createElement('div');
            row.className = 'team-input-row';
            row.innerHTML = `
                <input type="color" class="team-color-input" value="${color}">
                <input type="text" class="team-name-input" value="${this.escapeHtml(name)}" maxlength="30" placeholder="Lagsnamn">
            `;
            this.el.teamInputs.appendChild(row);
        }
    }

    collectTeams() {
        const rows = [...this.el.teamInputs.querySelectorAll('.team-input-row')];
        return rows.map((row, i) => ({
            id: i,
            name: row.querySelector('.team-name-input').value.trim() || `Team ${i + 1}`,
            color: row.querySelector('.team-color-input').value,
            totalScore: this.teams[i]?.totalScore || 0
        }));
    }

    // ============== GAME START ==============

    startGame() {
        // Read current config
        this.config.categoryCount = parseInt(this.el.categoryCount.value, 10);
        this.config.letterCount = parseInt(this.el.letterCount.value, 10);
        this.config.timeLimit = Math.max(15, parseInt(this.el.timeLimit.value, 10) || 120);
        this.config.categoryLanguage = this.el.categoryLanguage.value;
        this.config.manualLetters = this.el.manualLetters.value.toUpperCase();
        this.config.manualCategories = this.el.manualCategories.value;

        // Generate letters
        const letters = this.generateLetters();
        if (!letters) return; // validation failure

        // Generate categories
        const categories = this.generateCategories();
        if (!categories) return;

        this.round.letters = letters;
        this.round.categories = categories;

        // Init teams (only if not yet created or count changed)
        const newTeams = this.collectTeams();
        if (this.teams.length !== newTeams.length) {
            this.teams = newTeams;
        } else {
            this.teams = newTeams.map((t, i) => ({ ...t, totalScore: this.teams[i].totalScore }));
        }

        this.saveCurrentSettings();

        this.startRound();
    }

    startRound() {
        this.round.answers = {};
        this.round.roundScores = {};
        this.teams.forEach(t => { this.round.roundScores[t.id] = 0; });

        this.renderLetters();
        this.renderCategories();
        this.renderTeamScores();
        this.showSection('game');

        this.timer.timeLeft = this.config.timeLimit;
        this.timer.paused = false;
        this.updateTimerDisplay();
        this.startTimer();
    }

    generateLetters() {
        const count = this.config.letterCount;

        if (this.config.letterSource === 'manual') {
            const raw = (this.el.manualLetters.value || '').toUpperCase().replace(/[^A-ZÆØÅ]/g, '');
            const unique = [...new Set(raw.split(''))];
            if (unique.length < count) {
                alert(`Skriv inn minst ${count} unike bokstavar.`);
                return null;
            }
            return unique.slice(0, count);
        }

        // Random unique
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const result = [];
        const pool = [...alphabet];
        for (let i = 0; i < count && pool.length; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }

    generateCategories() {
        const count = this.config.categoryCount;
        let pool = [];

        if (this.config.categorySource === 'manual') {
            pool = (this.el.manualCategories.value || '')
                .split('\n').map(s => s.trim()).filter(Boolean);
            if (pool.length < count) {
                alert(`Skriv inn minst ${count} kategoriar (ein per linje).`);
                return null;
            }
        } else if (this.config.categorySource === 'custom') {
            const selected = [...this.el.customCatsSelect.selectedOptions].map(opt => opt.value);
            if (selected.length < count) {
                alert(`Vel minst ${count} kategoriar frå lista. Du har valt ${selected.length}.`);
                return null;
            }
            return selected.slice(0, count);
        } else {
            pool = [...(CATEGORIES[this.config.categoryLanguage] || CATEGORIES.nn)];
        }

        // Shuffle copy (don't mutate original)
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    // ============== RENDER GAME ==============

    renderLetters() {
        this.el.lettersDisplay.innerHTML = this.round.letters
            .map(L => `<div class="letter-box">${L}</div>`).join('');
    }

    renderCategories() {
        this.el.categoriesDisplay.innerHTML = this.round.categories
            .map(c => `<div class="category-item">${this.escapeHtml(c)}</div>`).join('');
    }

    renderTeamScores() {
        this.el.teamScores.innerHTML = this.teams.map(t => `
            <div class="team-score-box" style="border-left-color:${t.color};">
                <div class="team-score-name">${this.escapeHtml(t.name)}</div>
                <div class="team-score-points">${t.totalScore}</div>
            </div>
        `).join('');
    }

    // ============== TIMER ==============

    startTimer() {
        this.stopTimer();
        this.timer.handle = setInterval(() => {
            if (this.timer.paused) return;
            this.timer.timeLeft--;
            this.updateTimerDisplay();
            if (this.timer.timeLeft <= 0) {
                this.stopTimer();
                this.playEndSound();
                this.endRound();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer.handle) {
            clearInterval(this.timer.handle);
            this.timer.handle = null;
        }
    }

    updateTimerDisplay() {
        const t = Math.max(0, this.timer.timeLeft);
        const m = Math.floor(t / 60);
        const s = t % 60;
        this.el.timerDisplay.textContent = m > 0
            ? `${m}:${String(s).padStart(2, '0')}`
            : String(s);
        this.el.timerDisplay.classList.toggle('warning', t <= 10 && t > 0 && !this.timer.paused);
        this.el.timerDisplay.classList.toggle('paused', this.timer.paused);
    }

    togglePause() {
        this.timer.paused = !this.timer.paused;
        this.el.pauseBtn.textContent = this.timer.paused ? 'Fortsett' : 'Pause';
        this.updateTimerDisplay();
    }

    addTime(seconds) {
        this.timer.timeLeft += seconds;
        this.updateTimerDisplay();
    }

    playEndSound() {
        try {
            this.audio.currentTime = 0;
            this.audio.play().catch(() => {});
        } catch (e) { /* ignore */ }
    }

    // ============== END ROUND / ANSWER REVIEW ==============

    endRound() {
        this.stopTimer();
        this.timer.paused = false;
        this.el.pauseBtn.textContent = 'Pause';
        this.renderAnswerReview();
        this.showSection('answer');
    }

    backToGame() {
        // Go back without scoring; resume timer if time left
        this.showSection('game');
        if (this.timer.timeLeft > 0) {
            this.startTimer();
        }
    }

    renderAnswerReview() {
        // Reset write-mode answers structure
        this.round.answers = {};
        this.teams.forEach(t => {
            this.round.categories.forEach((cat, ci) => {
                this.round.letters.forEach((L, li) => {
                    const key = `${t.id}-${ci}-${li}`;
                    this.round.answers[key] = { text: '', status: null };
                });
            });
        });

        // Build write-mode UI
        this.el.writeAnswers.innerHTML = this.teams.map(t => {
            const rows = this.round.categories.map((cat, ci) => {
                return this.round.letters.map((L, li) => {
                    const key = `${t.id}-${ci}-${li}`;
                    return `
                        <div class="answer-row" data-key="${key}">
                            <div class="category-cell"><span class="letter-tag">${L}</span>${this.escapeHtml(cat)}</div>
                            <input type="text" class="answer-input" data-key="${key}" placeholder="Svar...">
                            <div class="answer-status">
                                <button class="status-btn unique" data-key="${key}" data-status="unique" type="button">3p</button>
                                <button class="status-btn duplicate" data-key="${key}" data-status="duplicate" type="button">1p</button>
                                <button class="status-btn invalid" data-key="${key}" data-status="invalid" type="button">0p</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }).join('');
            return `
                <div class="team-answers-section" style="border-left-color:${t.color};">
                    <div class="team-answers-header">
                        <span>${this.escapeHtml(t.name)}</span>
                        <span class="team-running-total" data-team="${t.id}">0 p denne runden</span>
                    </div>
                    ${rows}
                </div>
            `;
        }).join('');

        // Build direct-points UI
        this.el.directPoints.innerHTML = `
            <div class="box2">
                <div class="direct-points-grid">
                    ${this.teams.map(t => `
                        <div class="team-points-input" style="border-left-color:${t.color};">
                            <label>${this.escapeHtml(t.name)}</label>
                            <div class="points-control">
                                <button class="btn points-btn points-minus" data-team="${t.id}" type="button">−</button>
                                <input type="number" class="direct-points-field" data-team="${t.id}" value="0" step="1">
                                <button class="btn points-btn points-plus" data-team="${t.id}" type="button">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Reset answer mode visibility
        const writeRadio = document.querySelector('input[name="answerMode"][value="write"]');
        if (writeRadio) writeRadio.checked = true;
        this.el.writeAnswers.style.display = '';
        this.el.directPoints.style.display = 'none';
        this.syncRadioStyles();
    }

    toggleAnswerStatus(btn) {
        const key = btn.dataset.key;
        const status = btn.dataset.status;
        if (!this.round.answers[key]) return;

        const current = this.round.answers[key].status;
        const newStatus = current === status ? null : status;
        this.round.answers[key].status = newStatus;

        // Update UI for the row
        const row = btn.closest('.answer-row');
        row.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        if (newStatus) {
            row.querySelector(`.status-btn[data-status="${newStatus}"]`).classList.add('active');
        }

        this.updateRunningTotals();
    }

    computeWriteModeScores() {
        const totals = {};
        this.teams.forEach(t => { totals[t.id] = 0; });
        Object.entries(this.round.answers).forEach(([key, a]) => {
            const teamId = parseInt(key.split('-')[0], 10);
            if (a.status === 'unique') totals[teamId] += POINTS_UNIQUE;
            else if (a.status === 'duplicate') totals[teamId] += POINTS_DUPLICATE;
        });
        return totals;
    }

    updateRunningTotals() {
        const totals = this.computeWriteModeScores();
        this.teams.forEach(t => {
            const el = this.el.writeAnswers.querySelector(`.team-running-total[data-team="${t.id}"]`);
            if (el) el.textContent = `${totals[t.id]} p denne runden`;
        });
    }

    submitAnswers() {
        const mode = document.querySelector('input[name="answerMode"]:checked').value;

        if (mode === 'write') {
            const totals = this.computeWriteModeScores();
            this.teams.forEach(t => {
                this.round.roundScores[t.id] = totals[t.id];
                t.totalScore += totals[t.id];
            });
        } else {
            // Direct points
            this.el.directPoints.querySelectorAll('.direct-points-field').forEach(input => {
                const teamId = parseInt(input.dataset.team, 10);
                const pts = parseInt(input.value, 10) || 0;
                this.round.roundScores[teamId] = pts;
                const team = this.teams.find(t => t.id === teamId);
                if (team) team.totalScore += pts;
            });
        }

        this.renderResults();
        this.showSection('results');
    }

    // ============== RESULTS ==============

    renderResults() {
        const sorted = [...this.teams].sort((a, b) => b.totalScore - a.totalScore);
        const topScore = sorted[0]?.totalScore ?? 0;

        this.el.finalScores.innerHTML = sorted.map((t, i) => {
            const isWinner = t.totalScore === topScore && topScore > 0;
            const round = this.round.roundScores[t.id] || 0;
            return `
                <div class="result-item ${isWinner ? 'winner' : ''}" style="border-left-color:${t.color};">
                    <div class="result-rank">${i + 1}.</div>
                    <div class="result-name">${this.escapeHtml(t.name)}</div>
                    <div class="result-score-block">
                        <div class="result-round">+${round} denne runden</div>
                        <div class="result-score">${t.totalScore}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    startNewRound() {
        // Same teams, same setup, regenerate letters & categories
        const letters = this.generateLetters();
        if (!letters) return;
        const categories = this.generateCategories();
        if (!categories) return;
        this.round.letters = letters;
        this.round.categories = categories;
        this.startRound();
    }

    resetScores() {
        if (!confirm('Vil du nullstille alle poeng?')) return;
        this.teams.forEach(t => { t.totalScore = 0; });
        this.renderResults();
    }

    gotoSetup() {
        if (this.teams.some(t => t.totalScore > 0)) {
            if (!confirm('Vil du gå tilbake til oppsettet? Stillinga blir nullstilt.')) return;
        }
        this.teams.forEach(t => { t.totalScore = 0; });
        this.showSection('setup');
    }

    // ============== CUSTOM CATEGORIES MODAL ==============

    openCustomModal() {
        const list = HeiteStavrimStorage.getCustomCategories();
        this.el.customEditor.value = list.join('\n');
        this.el.customModal.classList.add('open');
    }

    closeCustomModal() {
        this.el.customModal.classList.remove('open');
    }

    saveCustomCategories() {
        const text = this.el.customEditor.value.trim();
        const list = text.split('\n').map(s => s.trim()).filter(Boolean);
        HeiteStavrimStorage.saveCustomCategories(list);
        this.populateCustomCategoriesSelect();
        this.closeCustomModal();
    }

    // ============== UTILITIES ==============

    showSection(name) {
        ['setup', 'game', 'answer', 'results'].forEach(s => {
            this.el[s].style.display = s === name ? '' : 'none';
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.heiteStavrimGame = new HeiteStavrimGame();
});
