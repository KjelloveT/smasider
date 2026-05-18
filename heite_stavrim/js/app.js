// Heite Stavrim — Klasse-deklarasjon, konstantar og bootstrap.
// Prototype-metodar ligg i: dom.js, timer.js, game.js, render.js, scoring.js, modal.js, events.js

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
            answers: {},      // { 'teamId-catIdx-letterIdx': { text, status } }
            roundScores: {}   // { teamId: points }
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
}

// ============== STORAGE-HJELPARAR ==============

HeiteStavrimGame.prototype.loadFromStorage = function () {
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
};

HeiteStavrimGame.prototype.saveCurrentSettings = function () {
    HeiteStavrimStorage.saveLastSettings(this.config);
    HeiteStavrimStorage.saveTeamConfig(this.teams.map(t => ({ name: t.name, color: t.color })));
};

// ============== BOOTSTRAP ==============

document.addEventListener('DOMContentLoaded', () => {
    window.heiteStavrimGame = new HeiteStavrimGame();
});
