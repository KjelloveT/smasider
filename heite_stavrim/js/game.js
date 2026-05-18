// Heite Stavrim — Spel-livssyklus (start, generering, slutt, navigasjon)

HeiteStavrimGame.prototype.startGame = function () {
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

    this.showPreview();
};

HeiteStavrimGame.prototype.showPreview = function (opts) {
    this.el.previewLetters.innerHTML = this.round.letters
        .map(L => `<div class="letter-box">${L}</div>`).join('');
    this.el.previewCategories.innerHTML = this.round.categories
        .map(c => `<div class="category-item">${this.escapeHtml(c)}</div>`).join('');

    // Skjul "trekk nye"-knappar når kjelda ikkje er tilfeldig
    this.el.redrawLettersBtn.style.display =
        this.config.letterSource === 'random' ? '' : 'none';
    this.el.redrawCategoriesBtn.style.display =
        this.config.categorySource === 'random' ? '' : 'none';

    this.showSection('preview', opts);
};

HeiteStavrimGame.prototype.redrawLetters = function () {
    const letters = this.generateLetters();
    if (!letters) return;
    this.round.letters = letters;
    this.showPreview({ scroll: false });
};

HeiteStavrimGame.prototype.redrawCategories = function () {
    const categories = this.generateCategories();
    if (!categories) return;
    this.round.categories = categories;
    this.showPreview({ scroll: false });
};

HeiteStavrimGame.prototype.startRound = function () {
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
};

HeiteStavrimGame.prototype.generateLetters = function () {
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
};

HeiteStavrimGame.prototype.generateCategories = function () {
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
};

HeiteStavrimGame.prototype.endRound = function () {
    this.stopTimer();
    this.timer.paused = false;
    this.el.pauseBtn.textContent = 'Pause';
    this.renderAnswerReview();
    this.showSection('answer');
};

HeiteStavrimGame.prototype.backToGame = function () {
    // Go back without scoring; resume timer if time left
    this.showSection('game');
    if (this.timer.timeLeft > 0) {
        this.startTimer();
    }
};

HeiteStavrimGame.prototype.startNewRound = function () {
    // Same teams, same setup, regenerate letters & categories
    const letters = this.generateLetters();
    if (!letters) return;
    const categories = this.generateCategories();
    if (!categories) return;
    this.round.letters = letters;
    this.round.categories = categories;
    this.startRound();
};

HeiteStavrimGame.prototype.resetScores = function () {
    if (!confirm('Vil du nullstille alle poeng?')) return;
    this.teams.forEach(t => { t.totalScore = 0; });
    this.renderResults();
};

HeiteStavrimGame.prototype.gotoSetup = function () {
    if (this.teams.some(t => t.totalScore > 0)) {
        if (!confirm('Vil du gå tilbake til oppsettet? Stillinga blir nullstilt.')) return;
    }
    this.teams.forEach(t => { t.totalScore = 0; });
    this.showSection('setup');
};
