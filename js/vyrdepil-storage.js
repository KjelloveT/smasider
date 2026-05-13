// VyrdepilStorage - Felles localStorage-struktur for alle spill
// Root: VyrdepilStorage
// Struktur:
// {
//   "kludre_klodrian": { highScore: 123 },
//   "reknedaesj": { highScore: 456 },
//   "talsmia": { highScore: 789, history: [...] },
//   "ordsmia": { highScore: 321, history: [...] },
//   ...
// }

const VyrdepilStorage = (function() {
    const ROOT_KEY = 'VyrdepilStorage';
    
    // Migration map: oldKey -> { game, newKey }
    const MIGRATIONS = {
        'kkHS': { game: 'kludre_klodrian', newKey: 'highScore' },
        'rdHS': { game: 'reknedaesj', newKey: 'highScore' },
        'talsmia_hs': { game: 'talsmia', newKey: 'highScore' },
        'talsmia_history': { game: 'talsmia', newKey: 'history' },
        'countdown_hs': { game: 'ordsmia', newKey: 'highScore' },
        'countdown_history': { game: 'ordsmia', newKey: 'history' },
        'baretevling_game': { game: 'baretevling', newKey: 'state' },
        'klassekart_oppsett': { game: 'klassekart', newKey: 'oppsett', isJson: true },
        'klassekart_tabs':    { game: 'klassekart', newKey: 'tabs',    isJson: true }
    };
    
    function getData() {
        const raw = localStorage.getItem(ROOT_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    
    function setData(data) {
        localStorage.setItem(ROOT_KEY, JSON.stringify(data));
    }
    
    function migrateOldKey(oldKey) {
        const migration = MIGRATIONS[oldKey];
        if (!migration) return;
        
        const oldVal = localStorage.getItem(oldKey);
        if (oldVal === null) return;
        
        const data = getData();
        if (!data[migration.game]) {
            data[migration.game] = {};
        }
        
        // Parse if it's a JSON-encoded value (history/state/isJson), otherwise treat as integer
        if (migration.newKey === 'history' || migration.newKey === 'state' || migration.isJson) {
            try {
                data[migration.game][migration.newKey] = JSON.parse(oldVal);
            } catch (e) {
                data[migration.game][migration.newKey] = oldVal;
            }
        } else {
            data[migration.game][migration.newKey] = parseInt(oldVal, 10) || 0;
        }
        
        setData(data);
        localStorage.removeItem(oldKey);
    }
    
    function migrateAll() {
        for (const oldKey in MIGRATIONS) {
            migrateOldKey(oldKey);
        }
    }
    
    // High score API for games
    function getHighScore(game) {
        const data = getData();
        return data[game]?.highScore || 0;
    }
    
    function saveHighScore(game, score) {
        const data = getData();
        let isNew = false;
        if (!data[game]) {
            data[game] = {};
            isNew = true;
        }
        
        const current = data[game].highScore || 0;
        if (score > current || isNew) {
            data[game].highScore = Math.max(score, current);
            setData(data);
            return true;
        }
        return false;
    }
    
    // History API for games
    function getHistory(game) {
        const data = getData();
        return data[game]?.history || [];
    }
    
    function saveToHistory(game, entry) {
        const data = getData();
        if (!data[game]) data[game] = {};
        if (!data[game].history) data[game].history = [];
        
        data[game].history.push({ ...entry, date: new Date().toISOString() });
        setData(data);
    }
    
    // Replace the full history array (used by games that sort/cap before saving)
    function setHistory(game, historyArray) {
        const data = getData();
        if (!data[game]) data[game] = {};
        data[game].history = historyArray;
        setData(data);
    }
    
    // Generic game state API (for games that need to save complex state)
    function getGameState(game) {
        const data = getData();
        return data[game]?.state || null;
    }
    
    function setGameState(game, state) {
        const data = getData();
        if (!data[game]) data[game] = {};
        data[game].state = state;
        setData(data);
    }
    
    function clearGameState(game) {
        const data = getData();
        if (data[game]) {
            delete data[game].state;
            setData(data);
        }
    }
    
    function hasGameState(game) {
        const data = getData();
        return data[game]?.state != null;
    }
    
    // List API (for tools that store multiple named items, e.g. Klassekart setups)
    function saveListItem(game, listKey, item) {
        const data = getData();
        if (!data[game]) data[game] = {};
        if (!data[game][listKey]) data[game][listKey] = [];
        data[game][listKey].push(item);
        setData(data);
    }

    function getList(game, listKey) {
        const data = getData();
        return data[game]?.[listKey] || [];
    }

    function deleteListItem(game, listKey, id) {
        const data = getData();
        if (!data[game]?.[listKey]) return;
        data[game][listKey] = data[game][listKey].filter(item => item.id !== id);
        setData(data);
    }

    // Collection API (for card-collecting games like Heimsank)
    // Stored as: data[game].collections[catId] = [entry, entry, ...]
    function getCollection(game, catId) {
        const data = getData();
        return data[game]?.collections?.[catId] || [];
    }

    function setCollection(game, catId, entries) {
        const data = getData();
        if (!data[game]) data[game] = {};
        if (!data[game].collections) data[game].collections = {};
        data[game].collections[catId] = entries;
        setData(data);
    }

    function getAllCollections(game) {
        const data = getData();
        return data[game]?.collections || {};
    }

    function clearCollection(game, catId) {
        const data = getData();
        if (data[game]?.collections?.[catId]) {
            delete data[game].collections[catId];
            setData(data);
        }
    }

    // Clear all data or specific game
    function clearGame(game) {
        const data = getData();
        delete data[game];
        setData(data);
    }
    
    function clearAll() {
        localStorage.removeItem(ROOT_KEY);
    }
    
    return {
        migrateAll,
        getHighScore,
        saveHighScore,
        getHistory,
        saveToHistory,
        setHistory,
        getGameState,
        setGameState,
        clearGameState,
        hasGameState,
        saveListItem,
        getList,
        deleteListItem,
        getCollection,
        setCollection,
        getAllCollections,
        clearCollection,
        clearGame,
        clearAll
    };
})();
