/* ══════════════════════════════════════════════
   FRØDEKAPP — Quiz Engine
   Kjerne-logikk: poeng, tidtaking, tilstandar
   ══════════════════════════════════════════════ */

const QuizEngine = {
    BASE_POINTS: 1000,
    MAX_TIME_BONUS: 500,
    STREAK_THRESHOLDS: [
        { count: 5, bonus: 500 },
        { count: 3, bonus: 200 }
    ],
    ANSWER_ICONS: ['▲', '◆', '●', '■'],
    ANSWER_COLORS: ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F'],
    ANSWER_CLASSES: ['answer-a', 'answer-b', 'answer-c', 'answer-d'],

    /**
     * Rekn ut poeng for eit svar
     * @param {boolean} correct - Om svaret er rett
     * @param {number} timeUsedMs - Tid brukt i millisekund
     * @param {number} timeLimitSec - Tidsfrist i sekund
     * @param {number} streak - Noverande streak (rette på rad)
     * @returns {{ points: number, timeBonus: number, streakBonus: number, newStreak: number }}
     */
    calculateScore(correct, timeUsedMs, timeLimitSec, streak) {
        if (!correct) {
            return { points: 0, timeBonus: 0, streakBonus: 0, newStreak: 0 };
        }

        const timeFraction = Math.max(0, 1 - (timeUsedMs / 1000) / timeLimitSec);
        const timeBonus = Math.round(this.MAX_TIME_BONUS * timeFraction);
        const newStreak = streak + 1;

        let streakBonus = 0;
        for (const t of this.STREAK_THRESHOLDS) {
            if (newStreak >= t.count && newStreak % t.count === 0) {
                streakBonus = t.bonus;
                break;
            }
        }

        const points = this.BASE_POINTS + timeBonus + streakBonus;
        return { points, timeBonus, streakBonus, newStreak };
    },

    /**
     * Sorter spelarar etter poeng (synkande)
     * @param {Array} players - [{id, name, score, ...}]
     * @returns {Array} Sortert kopi
     */
    sortLeaderboard(players) {
        return [...players].sort((a, b) => b.score - a.score);
    },

    /**
     * Lag leaderboard med rangering
     * @param {Array} players
     * @returns {Array} [{rank, id, name, score, ...}]
     */
    buildLeaderboard(players) {
        const sorted = this.sortLeaderboard(players);
        return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
    },

    /**
     * Last ein quiz frå URL
     * @param {string} url
     * @returns {Promise<Object>} Quiz-objekt
     */
    async loadQuiz(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Kunne ikkje laste quiz: ${res.status}`);
        return res.json();
    },

    /**
     * Last quiz-manifestet
     * @param {string} baseUrl - Base-URL til quizzes-mappa
     * @returns {Promise<Array>} Liste av quiz-metadata
     */
    async loadManifest(baseUrl) {
        const url = baseUrl.endsWith('/') ? baseUrl + 'index.json' : baseUrl + '/index.json';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Kunne ikkje laste quiz-liste: ${res.status}`);
        return res.json();
    },

    /**
     * Generer ein romkode (4 teikn, lesbar)
     * @returns {string}
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },

    /**
     * Generer ein unik spelar-ID
     * @returns {string}
     */
    generatePlayerId() {
        return 'p-' + Math.random().toString(36).substr(2, 8);
    },

    /**
     * Formater tid i sekund til mm:ss
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
    },

    /**
     * Valider eit quiz-objekt
     * @param {Object} quiz
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateQuiz(quiz) {
        const errors = [];
        if (!quiz.title || quiz.title.trim() === '') errors.push('Quiz manglar tittel');
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            errors.push('Quiz manglar spørsmål');
            return { valid: false, errors };
        }
        if (quiz.questions.length === 0) errors.push('Quiz har ingen spørsmål');

        quiz.questions.forEach((q, i) => {
            const n = i + 1;
            if (!q.question || q.question.trim() === '') errors.push(`Spørsmål ${n}: manglar tekst`);
            if (!q.options || q.options.length < 2) errors.push(`Spørsmål ${n}: treng minst 2 alternativ`);
            if (q.options && q.options.length > 4) errors.push(`Spørsmål ${n}: maks 4 alternativ`);
            if (q.correct === undefined || q.correct < 0 || q.correct >= (q.options || []).length) {
                errors.push(`Spørsmål ${n}: ugyldig rett svar`);
            }
        });

        return { valid: errors.length === 0, errors };
    }
};
