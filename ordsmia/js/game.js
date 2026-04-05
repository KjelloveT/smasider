// Countdown - Spillogikk
// Norsk ordspill med bokstavtrekking og validering

const Game = (function() {
    // Bokstavbrikker - basert på britisk Countdown, tilpasset norsk
    // Totalt 100 brikker for enkelhets skyld
    const LETTER_POOL = [
        // Vokaler (42 brikker)
        ...Array(12).fill('e'),   // 12%
        ...Array(8).fill('a'),    // 8%
        ...Array(7).fill('i'),    // 7%
        ...Array(6).fill('o'),    // 6%
        ...Array(4).fill('r'),    // r er nesten vokal på norsk
        ...Array(3).fill('u'),    // 3%
        ...Array(2).fill('æ'),    // 2%
        ...Array(2).fill('ø'),    // 2%
        ...Array(2).fill('å'),    // 2%
        // Konsonanter (58 brikker)
        ...Array(6).fill('n'),    // 6%
        ...Array(6).fill('t'),    // 6%
        ...Array(6).fill('s'),    // 6%
        ...Array(5).fill('l'),    // 5%
        ...Array(4).fill('d'),    // 4%
        ...Array(4).fill('g'),    // 4%
        ...Array(3).fill('k'),    // 3%
        ...Array(3).fill('m'),    // 3%
        ...Array(3).fill('p'),    // 3%
        ...Array(2).fill('b'),    // 2%
        ...Array(2).fill('f'),    // 2%
        ...Array(2).fill('v'),    // 2%
        ...Array(2).fill('h'),    // 2%
        ...Array(1).fill('j'),    // 1%
        ...Array(1).fill('c'),    // 1%
        ...Array(1).fill('w'),    // 1%
        ...Array(1).fill('x'),    // 1%
        ...Array(1).fill('y'),    // 1%
        ...Array(1).fill('z'),    // 1%
        ...Array(1).fill('q')     // 1%
    ];
    
    const VOWELS = ['a', 'e', 'i', 'o', 'u', 'æ', 'ø', 'å'];
    
    let currentLetters = [];
    let timeLeft = 30;
    let timerInterval = null;
    let isPlaying = false;
    let wordList = [];        // Alle ord for validering (Set)
    let wordListSorted = [];  // Sortert etter lengde for å finne lengste ord
    let onTimeUpdate = null;
    let onGameEnd = null;
    
    // Last inn ordliste
    async function loadWordList() {
        try {
            const response = await fetch('norsk_ordliste.json');
            const data = await response.json();
            wordList = new Set(data.ord.map(w => w.toLowerCase()));
            // Sorter etter lengde (descending) for raskt oppslag av lengste ord
            wordListSorted = [...wordList].sort((a, b) => b.length - a.length);
            return true;
        } catch (err) {
            console.error('Kunne ikke laste ordliste:', err);
            return false;
        }
    }
    
    // Trekk tilfeldig vokal fra pool
    function drawVowel() {
        const vowelPool = LETTER_POOL.filter(l => VOWELS.includes(l));
        return vowelPool[Math.floor(Math.random() * vowelPool.length)];
    }
    
    // Trekk tilfeldig konsonant fra pool
    function drawConsonant() {
        const consonantPool = LETTER_POOL.filter(l => !VOWELS.includes(l));
        return consonantPool[Math.floor(Math.random() * consonantPool.length)];
    }
    
    // Legg til bokstav manuelt (for klasseromsmodus)
    function addLetter(type) {
        if (currentLetters.length >= 9) return false;
        const letter = type === 'vowel' ? drawVowel() : drawConsonant();
        currentLetters.push(letter);
        return letter;
    }
    
    // Fjern siste bokstav
    function removeLastLetter() {
        return currentLetters.pop();
    }

    // Nullstill bokstaver
    function resetLetters() {
        currentLetters = [];
    }
    
    // Valider flere ord samtidig (for klasseromsmodus)
    function validateMultipleWords(words) {
        const results = [];
        const uniqueWords = [...new Set(words.map(w => w.toLowerCase().trim()))];
        
        for (const word of uniqueWords) {
            if (!word) continue;
            const result = validateWord(word);
            results.push({
                word: word,
                ...result
            });
        }
        
        // Sorter etter lengde (lengste først)
        results.sort((a, b) => (b.length || 0) - (a.length || 0));
        return results;
    }
    function generateLetters(vowelCount = 4) {
        currentLetters = [];
        // Lag kopi av bunke for denne runden
        let availablePool = [...LETTER_POOL];
        
        for (let i = 0; i < 9; i++) {
            // Trekk tilfeldig fra pool
            const idx = Math.floor(Math.random() * availablePool.length);
            currentLetters.push(availablePool[idx]);
            // Ikke fjern brikken - vi vil ha med-tilbake-ligging (som i ekte Countdown)
        }
        
        // Sørg for at vi har nok vokaler
        let vowelsInLetters = currentLetters.filter(l => VOWELS.includes(l)).length;
        
        // Hvis for få vokaler, bytt ut noen konsonanter
        let attempts = 0;
        while (vowelsInLetters < 3 && attempts < 50) {
            const idx = Math.floor(Math.random() * 9);
            if (!VOWELS.includes(currentLetters[idx])) {
                // Bytt til en vokal
                const vowelPool = ['e', 'e', 'e', 'a', 'a', 'i', 'i', 'o', 'u'];
                currentLetters[idx] = vowelPool[Math.floor(Math.random() * vowelPool.length)];
                vowelsInLetters++;
            }
            attempts++;
        }
        
        // Stokk tilfeldig
        currentLetters.sort(() => Math.random() - 0.5);
        return [...currentLetters];
    }
    
    // Sjekk om ord kan dannes fra bokstaver
    function canFormWord(word, letters) {
        word = word.toLowerCase().trim();
        const available = {};
        for (const letter of letters) {
            available[letter] = (available[letter] || 0) + 1;
        }
        
        for (const char of word) {
            if (!available[char] || available[char] === 0) {
                return false;
            }
            available[char]--;
        }
        return true;
    }
    
    // Valider ord
    function validateWord(word) {
        word = word.toLowerCase().trim();
        if (word.length < 3) {
            return { valid: false, reason: 'For kort (minst 3 bokstaver)' };
        }
        if (!canFormWord(word, currentLetters)) {
            return { valid: false, reason: 'Kan ikke dannes fra bokstavene' };
        }
        if (!wordList.has(word)) {
            return { valid: false, reason: 'Ikke et gyldig norsk ord' };
        }
        return { valid: true, length: word.length, score: calculateScore(word.length) };
    }
    
    // Beregn poeng
    function calculateScore(length) {
        if (length <= 4) return length;
        if (length <= 6) return length * 2;
        if (length === 7) return length * 3;
        if (length === 8) return length * 4 + 50;
        return length * 5 + 100; // 9+
    }
    
    // Finn de 10 lengste mulige ordene
    function findLongestPossibleWords(maxCount = 10) {
        const results = [];
        const available = {};
        for (const letter of currentLetters) {
            available[letter] = (available[letter] || 0) + 1;
        }
        
        for (const word of wordListSorted) {
            if (word.length < 3) continue;
            if (canFormWord(word, currentLetters)) {
                results.push(word);
                if (results.length >= maxCount) break;
            }
        }
        return results;
    }
    
    // Start timer
    function startTimer(seconds) {
        timeLeft = seconds;
        isPlaying = true;
        
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            if (onTimeUpdate) onTimeUpdate(timeLeft);
            
            if (timeLeft <= 0) {
                stopGame();
            }
        }, 1000);
    }
    
    // Stopp spill
    function stopGame() {
        isPlaying = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        // Ikke kall onGameEnd her - det håndteres av timeren eller manuelt
    }
    
    // Getters
    function getCurrentLetters() { return [...currentLetters]; }
    function getTimeLeft() { return timeLeft; }
    function isGamePlaying() { return isPlaying; }
    function getWordListSize() { return wordList.size; }
    
    // Setters for callbacks
    function setOnTimeUpdate(callback) { onTimeUpdate = callback; }
    function setOnGameEnd(callback) { onGameEnd = callback; }
    
    return {
        loadWordList,
        generateLetters,
        addLetter,
        removeLastLetter,
        resetLetters,
        drawVowel,
        drawConsonant,
        validateWord,
        validateMultipleWords,
        calculateScore,
        findLongestPossibleWords,
        startTimer,
        stopGame,
        getCurrentLetters,
        getTimeLeft,
        isGamePlaying,
        getWordListSize,
        setOnTimeUpdate,
        setOnGameEnd
    };
})();
