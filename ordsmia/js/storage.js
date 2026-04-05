// Countdown - LocalStorage-håndtering
// Lagrer toppscore og historikk lokalt

const Storage = (function() {
    const KEYS = {
        highScore: 'countdown_hs',
        history: 'countdown_history'
    };
    
    // Hent toppscore
    function getHighScore() {
        const val = localStorage.getItem(KEYS.highScore);
        return val ? parseInt(val, 10) : 0;
    }
    
    // Lagre toppscore hvis nytt er høyere
    function saveHighScore(score) {
        const current = getHighScore();
        if (score > current) {
            localStorage.setItem(KEYS.highScore, score.toString());
            return true;
        }
        return false;
    }
    
    // Hent historikk (topp 20 lengste ord)
    function getHistory() {
        const val = localStorage.getItem(KEYS.history);
        return val ? JSON.parse(val) : [];
    }
    
    // Lagre ord i historikk
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
        
        localStorage.setItem(KEYS.history, JSON.stringify(history));
    }
    
    // Slett all data
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
