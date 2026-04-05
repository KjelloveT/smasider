// Countdown - UI og håndtering av brukergrensesnitt

const UI = (function() {
    // DOM-elementer
    let screens = {};
    let timerEl, lettersContainer, wordInput, submitBtn;
    
    // Initialiser UI-referanser
    function init() {
        screens = {
            menu: document.getElementById('screen-menu'),
            game: document.getElementById('screen-game'),
            manual: document.getElementById('screen-manual'),
            classroom: document.getElementById('screen-classroom'),
            result: document.getElementById('screen-result')
        };
        timerEl = document.getElementById('timer');
        lettersContainer = document.getElementById('letters-container');
        wordInput = document.getElementById('wordInput');
        submitBtn = document.getElementById('submitBtn');
    }
    
    // Vis skjerm
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[name]) screens[name].classList.add('active');
    }
    
    // Oppdater timer-visning
    function updateTimer(seconds) {
        if (!timerEl) return;
        timerEl.textContent = seconds;
        timerEl.classList.remove('warning', 'danger');
        if (seconds <= 10) timerEl.classList.add('danger');
        else if (seconds <= 20) timerEl.classList.add('warning');
    }
    
    // Vis bokstaver
    function showLetters(letters) {
        if (!lettersContainer) return;
        lettersContainer.innerHTML = '';
        letters.forEach(letter => {
            const tile = document.createElement('div');
            tile.className = 'letter-tile';
            tile.textContent = letter.toUpperCase();
            tile.dataset.letter = letter;
            lettersContainer.appendChild(tile);
        });
    }
    
    // Marker brukte bokstaver
    function markUsedLetters(word) {
        const tiles = lettersContainer.querySelectorAll('.letter-tile');
        const available = {};
        tiles.forEach(tile => {
            const l = tile.dataset.letter;
            available[l] = (available[l] || 0) + 1;
            tile.classList.remove('used');
        });
        
        word = word.toLowerCase();
        for (const char of word) {
            if (available[char] > 0) {
                available[char]--;
                // Finn første umarkerte tile med denne bokstaven
                for (const tile of tiles) {
                    if (tile.dataset.letter === char && !tile.classList.contains('used')) {
                        tile.classList.add('used');
                        break;
                    }
                }
            }
        }
    }
    
    // Rens markering
    function clearLetterMarks() {
        const tiles = lettersContainer.querySelectorAll('.letter-tile');
        tiles.forEach(t => t.classList.remove('used', 'error'));
    }
    
    // Marker ugyldig
    function markInvalid() {
        const tiles = lettersContainer.querySelectorAll('.letter-tile');
        tiles.forEach(t => t.classList.add('error'));
        setTimeout(() => clearLetterMarks(), 300);
    }
    
    // Hent input-verdi
    function getInputValue() {
        return wordInput ? wordInput.value : '';
    }
    
    // Tøm input
    function clearInput() {
        if (wordInput) wordInput.value = '';
    }
    
    // Vis resultat
    function showResult(playerWord, isValid, score, possibleWords, timeUsed) {
        const resultDiv = document.getElementById('result-content');
        const yourWord = document.getElementById('your-word');
        const yourScore = document.getElementById('your-score');
        const possibleDiv = document.getElementById('possible-words');
        
        yourWord.textContent = playerWord.toUpperCase();
        yourWord.className = isValid ? 'your-word' : 'your-word invalid';
        yourScore.textContent = isValid ? `${score} poeng` : 'Ugyldig ord';
        
        // Vis mulige ord
        possibleDiv.innerHTML = '';
        possibleWords.forEach((word, idx) => {
            const span = document.createElement('span');
            span.className = 'possible-word' + (word.toLowerCase() === playerWord.toLowerCase() ? ' highlight' : '');
            span.textContent = `${word.toUpperCase()} (${word.length})`;
            possibleDiv.appendChild(span);
        });
        
        // Oppdater statistikk
        updateStats();
    }
    
    // Oppdater statistikk på resultatskjerm
    function updateStats() {
        const highScore = Storage.getHighScore();
        document.getElementById('stat-highscore').textContent = highScore;
    }
    
    // Vis historikk på menyskjerm
    function showHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        const history = Storage.getHistory();
        list.innerHTML = '';
        
        if (history.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#666">Ingen ord lagra ennå</p>';
            return;
        }
        
        history.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span><strong>${entry.word.toUpperCase()}</strong> (${entry.letters.join('').toUpperCase()})</span>
                <span>${entry.score}p</span>
            `;
            list.appendChild(div);
        });
    }
    
    // Aktiver/deaktiver input
    function setInputEnabled(enabled) {
        if (wordInput) wordInput.disabled = !enabled;
        if (submitBtn) submitBtn.disabled = !enabled;
    }
    
    return {
        init,
        showScreen,
        updateTimer,
        showLetters,
        markUsedLetters,
        clearLetterMarks,
        markInvalid,
        getInputValue,
        clearInput,
        showResult,
        updateStats,
        showHistory,
        setInputEnabled
    };
})();
