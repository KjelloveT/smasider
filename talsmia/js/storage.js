const Storage = (function () {
    const KEYS = {
        highScore: 'talsmia_hs',
        history: 'talsmia_history'
    };

    function getHighScore() {
        const val = localStorage.getItem(KEYS.highScore);
        return val ? parseInt(val, 10) : 0;
    }

    function saveHighScore(score) {
        const current = getHighScore();
        if (score > current) {
            localStorage.setItem(KEYS.highScore, String(score));
            return true;
        }
        return false;
    }

    function getHistory() {
        const val = localStorage.getItem(KEYS.history);
        return val ? JSON.parse(val) : [];
    }

    function saveToHistory(entry) {
        const history = getHistory();
        history.push({ ...entry, date: new Date().toISOString() });
        history.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.diff - b.diff;
        });
        if (history.length > 20) history.length = 20;
        localStorage.setItem(KEYS.history, JSON.stringify(history));
    }

    function clearAll() {
        localStorage.removeItem(KEYS.highScore);
        localStorage.removeItem(KEYS.history);
    }

    return {
        getHighScore,
        saveHighScore,
        getHistory,
        saveToHistory,
        clearAll
    };
})();
