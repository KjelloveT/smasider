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
    const ASSET_DB = 'VyrdepilAssets';
    const ASSET_STORE = 'assets';
    let assetDbPromise = null;
    
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

    function openAssetDb() {
        if (!window.indexedDB) return Promise.reject(new Error('Nettlesaren støttar ikkje lokal fillagring.'));
        if (assetDbPromise) return assetDbPromise;
        assetDbPromise = new Promise(function (resolve, reject) {
            const request = indexedDB.open(ASSET_DB, 1);
            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(ASSET_STORE)) {
                    const store = db.createObjectStore(ASSET_STORE, { keyPath: 'key' });
                    store.createIndex('game', 'game', { unique: false });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error('Klarte ikkje opne lokal fillagring.')); };
            request.onblocked = function () { reject(new Error('Lokal fillagring er blokkert av ei anna fane.')); };
        }).catch(function (error) {
            assetDbPromise = null;
            throw error;
        });
        return assetDbPromise;
    }

    function assetTransaction(mode, operation) {
        return openAssetDb().then(function (db) {
            return new Promise(function (resolve, reject) {
                const transaction = db.transaction(ASSET_STORE, mode);
                let result;
                let request;
                transaction.oncomplete = function () { resolve(result); };
                transaction.onerror = function () { reject(transaction.error || new Error('Klarte ikkje lagre den lokale fila.')); };
                transaction.onabort = function () { reject(transaction.error || new Error('Lagringa av den lokale fila blei avbroten.')); };
                try {
                    request = operation(transaction.objectStore(ASSET_STORE));
                    if (request) {
                        request.onsuccess = function () { result = request.result; };
                        request.onerror = function () { reject(request.error || new Error('Klarte ikkje lese den lokale fila.')); };
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    function saveGameAsset(game, assetId, asset) {
        if (!asset || !(asset.blob instanceof Blob)) return Promise.reject(new Error('Fila manglar data for biletet.'));
        const record = {
            key: String(game) + ':' + String(assetId),
            game: String(game),
            assetId: String(assetId),
            blob: asset.blob,
            name: String(asset.name || ''),
            type: String(asset.type || asset.blob.type || ''),
            size: asset.blob.size,
            width: Number(asset.width) || 0,
            height: Number(asset.height) || 0
        };
        return assetTransaction('readwrite', function (store) { return store.put(record); });
    }

    function getGameAsset(game, assetId) {
        return assetTransaction('readonly', function (store) {
            return store.get(String(game) + ':' + String(assetId));
        });
    }

    function deleteGameAsset(game, assetId) {
        return assetTransaction('readwrite', function (store) {
            return store.delete(String(game) + ':' + String(assetId));
        });
    }

    function getStoredAssetInfo() {
        return assetTransaction('readonly', function (store) { return store.getAll(); }).then(function (records) {
            return (records || []).map(function (record) {
                return { game: record.game, assetId: record.assetId, name: record.name, type: record.type, size: record.size };
            });
        });
    }

    function clearGameAssets(game) {
        return assetTransaction('readwrite', function (store) {
            const request = store.getAll();
            request.addEventListener('success', function () {
                request.result.forEach(function (record) {
                    if (record.game === String(game)) store.delete(record.key);
                });
            });
            return request;
        });
    }

    function clearAllAssets() {
        if (!window.indexedDB) return Promise.resolve();
        return assetTransaction('readwrite', function (store) { return store.clear(); });
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

    /* Erset heile lista for ein game+listKey */
    function setList(game, listKey, arr) {
        const data = getData();
        if (!data[game]) data[game] = {};
        data[game][listKey] = arr;
        setData(data);
    }

    /* Oppdater eitt element i lista (finn på id) */
    function updateListItem(game, listKey, id, changes) {
        const data = getData();
        if (!data[game]?.[listKey]) return null;
        const idx = data[game][listKey].findIndex(item => item.id === id);
        if (idx === -1) return null;
        data[game][listKey][idx] = { ...data[game][listKey][idx], ...changes };
        setData(data);
        return data[game][listKey][idx];
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
        clearGameAssets(game).catch(function () {});
    }
    
    function clearAll() {
        localStorage.removeItem(ROOT_KEY);
        return clearAllAssets();
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
        setList,
        updateListItem,
        deleteListItem,
        getCollection,
        setCollection,
        getAllCollections,
        clearCollection,
        saveGameAsset,
        getGameAsset,
        deleteGameAsset,
        getStoredAssetInfo,
        clearGame,
        clearAll
    };
})();
