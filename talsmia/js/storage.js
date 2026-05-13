// Migrate old localStorage keys to new structure
VyrdepilStorage.migrateAll();

const Storage = (function () {
    function getHighScore() {
        return VyrdepilStorage.getHighScore('talsmia');
    }

    function saveHighScore(score) {
        return VyrdepilStorage.saveHighScore('talsmia', score);
    }

    function getHistory() {
        // Filter out malformed entries from before the saveToHistory bugfix
        return VyrdepilStorage.getHistory('talsmia').filter(e => e && e.expression !== undefined);
    }

    function saveToHistory(entry) {
        const history = getHistory();
        history.push({ ...entry });
        history.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.diff - b.diff;
        });
        if (history.length > 20) history.length = 20;
        VyrdepilStorage.setHistory('talsmia', history);
    }

    function clearAll() {
        VyrdepilStorage.clearGame('talsmia');
    }

    return {
        getHighScore,
        saveHighScore,
        getHistory,
        saveToHistory,
        clearAll
    };
})();
