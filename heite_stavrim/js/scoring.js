// Heite Stavrim — Svar-gjennomgang, duplikat-deteksjon og poeng-utrekning

HeiteStavrimGame.prototype.navigateIndividual = function (direction) {
    const totalLetters = this.round.letters.length;
    const totalItems = this.round.categories.length * totalLetters;
    let currentIndex = this.individualMode.catIndex * totalLetters + this.individualMode.letterIndex;
    currentIndex += direction;

    if (currentIndex < 0 || currentIndex >= totalItems) return;

    this.individualMode.catIndex = Math.floor(currentIndex / totalLetters);
    this.individualMode.letterIndex = currentIndex % totalLetters;
    this.renderIndividualMode();
};

HeiteStavrimGame.prototype.toggleAnswerStatus = function (btn) {
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
};

HeiteStavrimGame.prototype.checkDuplicates = function () {
    // Only check if in write mode
    if (this.el.writeAnswers.style.display === 'none') return;

    // Group answers by category+letter (ci-li part of key)
    const answerGroups = {};
    Object.entries(this.round.answers).forEach(([key, answer]) => {
        const parts = key.split('-');
        const catLetterKey = `${parts[1]}-${parts[2]}`; // categoryIndex-letterIndex
        const text = answer.text.trim().toLowerCase();

        if (text) {
            if (!answerGroups[catLetterKey]) {
                answerGroups[catLetterKey] = [];
            }
            answerGroups[catLetterKey].push({ key, text });
        }
    });

    // Remove all duplicate highlights first
    this.el.writeAnswers.querySelectorAll('.answer-row').forEach(row => {
        row.classList.remove('duplicate-highlight');
        const input = row.querySelector('.answer-input');
        if (input) input.classList.remove('duplicate-input');
    });

    // Add highlight to duplicates
    Object.values(answerGroups).forEach(group => {
        if (group.length > 1) {
            const textCounts = {};
            group.forEach(item => {
                textCounts[item.text] = (textCounts[item.text] || 0) + 1;
            });

            group.forEach(item => {
                if (textCounts[item.text] > 1) {
                    const row = this.el.writeAnswers.querySelector(`.answer-row[data-key="${item.key}"]`);
                    if (row) {
                        row.classList.add('duplicate-highlight');
                        const input = row.querySelector('.answer-input');
                        if (input) input.classList.add('duplicate-input');
                    }
                }
            });
        }
    });
};

HeiteStavrimGame.prototype.computeWriteModeScores = function () {
    const totals = {};
    this.teams.forEach(t => { totals[t.id] = 0; });
    Object.entries(this.round.answers).forEach(([key, a]) => {
        const teamId = parseInt(key.split('-')[0], 10);
        if (a.status === 'unique') totals[teamId] += POINTS_UNIQUE;
        else if (a.status === 'duplicate') totals[teamId] += POINTS_DUPLICATE;
    });
    return totals;
};

HeiteStavrimGame.prototype.updateRunningTotals = function () {
    const totals = this.computeWriteModeScores();
    this.teams.forEach(t => {
        const el = this.el.writeAnswers.querySelector(`.team-running-total[data-team="${t.id}"]`);
        if (el) el.textContent = `${totals[t.id]} p denne runden`;
    });
};

HeiteStavrimGame.prototype.submitAnswers = function () {
    const mode = document.querySelector('input[name="answerMode"]:checked').value;

    if (mode === 'write' || mode === 'individual') {
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
};
