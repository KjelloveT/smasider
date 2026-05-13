// Countdown - LocalStorage-håndtering
// Lagrer toppscore og historikk lokalt

// Migrate old localStorage keys to new structure
VyrdepilStorage.migrateAll();

const Storage = (function() {
    function getHighScore() {
        return VyrdepilStorage.getHighScore('ordsmia');
    }
    
    function saveHighScore(score) {
        return VyrdepilStorage.saveHighScore('ordsmia', score);
    }
    
    function getHistory() {
        return VyrdepilStorage.getHistory('ordsmia');
    }
    
    function saveToHistory(word, letters, score) {
        const history = getHistory();
        const entry = {
            word: word.toLowerCase(),
            letters: [...letters],
            score: score,
            date: new Date().toISOString()
        };
        
        // Sjekk om ordet allerede finnes
        const exists = history.some(h => h.word === entry.word);
        if (exists) return;
        
        history.push(entry);
        // Sorter etter lengde (descending), behold topp 20
        history.sort((a, b) => b.word.length - a.word.length);
        if (history.length > 20) history.length = 20;
        
        VyrdepilStorage.setHistory('ordsmia', history);
    }
    
    function clearAll() {
        VyrdepilStorage.clearGame('ordsmia');
    }
    
    return {
        getHighScore,
        saveHighScore,
        getHistory,
        saveToHistory,
        clearAll
    };
})();
