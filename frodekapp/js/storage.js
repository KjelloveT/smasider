/* ══════════════════════════════════════════════
   FRØDEKAPP — Lagring via VyrdepilStorage
   All persistens går gjennom det felles API-et.
   Nøkkel: 'frodekapp'
     - quizzes : liste over lokalt lagra quiz-ar (List-API)
     - state   : { draft, playerName } (game state-API)
   ══════════════════════════════════════════════ */

const FK_GAME_KEY = 'frodekapp';
const FK_QUIZ_LIST = 'quizzes';

const FKStorage = {
    /* ── Lokalt quiz-bibliotek ───────────────── */

    /** @returns {Array} lagra quiz-objekt */
    getQuizzes() {
        try {
            return VyrdepilStorage.getList(FK_GAME_KEY, FK_QUIZ_LIST) || [];
        } catch (e) {
            console.error('[FKStorage] getQuizzes feila:', e);
            return [];
        }
    },

    /** Hent éin lagra quiz på id, eller null */
    getQuiz(id) {
        return this.getQuizzes().find(q => q.id === id) || null;
    },

    /**
     * Lagre ein quiz i biblioteket. Får app/version + savedAt.
     * @returns {object} det lagra quiz-objektet (med ny id)
     */
    saveQuiz(quiz) {
        const id = 'local_' + Date.now();
        const item = {
            app: 'frodekapp',
            version: 1,
            ...quiz,
            id,
            local: true,
            savedAt: new Date().toISOString()
        };
        try {
            VyrdepilStorage.saveListItem(FK_GAME_KEY, FK_QUIZ_LIST, item);
        } catch (e) {
            console.error('[FKStorage] saveQuiz feila:', e);
        }
        return item;
    },

    deleteQuiz(id) {
        try {
            VyrdepilStorage.deleteListItem(FK_GAME_KEY, FK_QUIZ_LIST, id);
        } catch (e) {
            console.error('[FKStorage] deleteQuiz feila:', e);
        }
    },

    /* ── Editor-utkast + kallenamn (game state) ─ */

    _state() {
        try {
            return VyrdepilStorage.getGameState(FK_GAME_KEY) || {};
        } catch (e) {
            return {};
        }
    },

    _setState(patch) {
        const next = { ...this._state(), ...patch };
        try {
            VyrdepilStorage.setGameState(FK_GAME_KEY, next);
        } catch (e) {
            console.error('[FKStorage] setState feila:', e);
        }
    },

    getDraft() {
        return this._state().draft || null;
    },

    saveDraft(quiz) {
        this._setState({ draft: quiz });
    },

    getPlayerName() {
        return this._state().playerName || '';
    },

    savePlayerName(name) {
        this._setState({ playerName: name });
    }
};
