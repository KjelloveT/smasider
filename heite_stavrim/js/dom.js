// Heite Stavrim — DOM-cache og util-metodar

HeiteStavrimGame.prototype.cacheElements = function () {
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
        individualAnswers: id('individualAnswersMode'),
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

    // Individual mode state
    this.individualMode = {
        catIndex: 0,
        letterIndex: 0
    };
};

HeiteStavrimGame.prototype.syncRadioStyles = function () {
    document.querySelectorAll('.radio-label').forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (input) label.classList.toggle('checked', input.checked);
    });
};

HeiteStavrimGame.prototype.showSection = function (name) {
    ['setup', 'game', 'answer', 'results'].forEach(s => {
        this.el[s].style.display = s === name ? '' : 'none';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

HeiteStavrimGame.prototype.escapeHtml = function (str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};
