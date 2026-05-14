// Heite Stavrim — Event-wiring (kjør etter at alle prototype-metodar er definerte)

HeiteStavrimGame.prototype.attachEvents = function () {
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

    // Answer mode
    document.querySelectorAll('input[name="answerMode"]').forEach(r => {
        r.addEventListener('change', () => {
            this.el.writeAnswers.style.display = r.value === 'write' ? '' : 'none';
            this.el.individualAnswers.style.display = r.value === 'individual' ? '' : 'none';
            this.el.directPoints.style.display = r.value === 'points' ? '' : 'none';
            this.syncRadioStyles();
            if (r.value === 'individual') {
                this.renderIndividualMode();
            }
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

    // Escape lukkar modalen (a11y)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isCustomModalOpen()) {
            this.closeCustomModal();
        }
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
            this.checkDuplicates();
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
};
