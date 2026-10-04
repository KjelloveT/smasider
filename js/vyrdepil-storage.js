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
    const BRAGD_VERSION = 1;
    const ASSET_DB = 'VyrdepilAssets';
    const ASSET_STORE = 'assets';
    let assetDbPromise = null;
    let memoryMode = false;
    let memoryData = null;
    let storageReason = null;
    let recoveryRaw = null;
    let lastPersistedRaw = null;
    let warningElement = null;
    
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
    
    function isRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const prototype = Object.getPrototypeOf(value);
        return prototype === null || (Object.prototype.toString.call(value) === '[object Object]' && Object.getPrototypeOf(prototype) === null);
    }

    function copyRecord(value) {
        const copy = Object.create(null);
        Object.keys(value).forEach(function (key) { copy[key] = value[key]; });
        return copy;
    }

    function validateRoot(value) {
        if (!isRecord(value)) return false;
        for (const game of Object.keys(value)) {
            const record = value[game];
            if (!isRecord(record)) return false;
            if (record.highScore !== undefined && (!Number.isFinite(record.highScore) || record.highScore < 0)) return false;
            if (record.history !== undefined && !Array.isArray(record.history)) return false;
            if (record.collections !== undefined) {
                if (!isRecord(record.collections)) return false;
                if (Object.keys(record.collections).some(function (key) { return !Array.isArray(record.collections[key]); })) return false;
            }
        }
        return true;
    }

    function normalizeRoot(value) {
        const normalized = Object.create(null);
        Object.keys(value).forEach(function (game) {
            normalized[game] = copyRecord(value[game]);
            if (normalized[game].collections) normalized[game].collections = copyRecord(normalized[game].collections);
        });
        return normalized;
    }

    function warningMessage(reason) {
        if (reason === 'corrupt') return 'Lagringsdataa kunne ikkje lesast. Dei lagra rådataa er tekne vare på uendra. Endringar no blir berre haldne mellombels i denne fana.';
        if (reason === 'invalid-data') return 'Lagringsdataa har eit ugyldig format. Dei lagra rådataa er tekne vare på uendra. Endringar no blir berre haldne mellombels i denne fana.';
        if (reason === 'quota') return 'Nettlesaren har ikkje plass til meir lagring. Endringane no blir berre haldne mellombels i denne fana; tidlegare lagra data er tekne vare på.';
        if (reason === 'serialization') return 'Dataa kunne ikkje gjerast klare for lagring. Endringane no blir berre haldne mellombels i denne fana.';
        return 'Nettlesaren gav ikkje tilgang til lokal lagring. Endringane no blir berre haldne mellombels i denne fana.';
    }

    function downloadRecoveryRaw() {
        if (recoveryRaw === null || typeof document === 'undefined') return;
        const blob = new Blob([recoveryRaw], { type: 'text/plain;charset=utf-8' });
        if (window.Vy && typeof window.Vy.downloadBlob === 'function') {
            window.Vy.downloadBlob(blob, 'vyrdepil-lagringsdata-reserve.txt');
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vyrdepil-lagringsdata-reserve.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function renderStorageWarning() {
        if (!memoryMode || typeof document === 'undefined') return;
        const addWarning = function () {
            if (!document.body || warningElement || !memoryMode) return;
            const banner = document.createElement('aside');
            banner.className = 'vp-storage-warning';
            banner.setAttribute('role', 'alert');
            banner.setAttribute('aria-live', 'assertive');

            const text = document.createElement('p');
            text.className = 'vp-storage-warning__text';
            text.textContent = warningMessage(storageReason);
            banner.appendChild(text);

            const actions = document.createElement('div');
            actions.className = 'vp-storage-warning__actions';
            if (recoveryRaw !== null) {
                const download = document.createElement('button');
                download.type = 'button';
                download.className = 'vp-button vp-button--compact vp-button--positive';
                download.textContent = 'Last ned rådata';
                download.addEventListener('click', downloadRecoveryRaw);
                actions.appendChild(download);
            }
            const dismiss = document.createElement('button');
            dismiss.type = 'button';
            dismiss.className = 'vp-button vp-button--compact vp-button--quiet';
            dismiss.textContent = 'Skjul varsel';
            dismiss.addEventListener('click', function () { banner.remove(); warningElement = null; });
            actions.appendChild(dismiss);
            banner.appendChild(actions);
            document.body.appendChild(banner);
            warningElement = banner;
        };
        if (document.body) addWarning();
        else document.addEventListener('DOMContentLoaded', addWarning, { once: true });
    }

    function switchToMemory(reason, raw, data) {
        if (!memoryMode) {
            memoryMode = true;
            memoryData = data || Object.create(null);
            recoveryRaw = raw === undefined ? lastPersistedRaw : raw;
        }
        storageReason = reason;
        renderStorageWarning();
    }

    function getData() {
        if (memoryMode) return memoryData;
        let raw;
        try {
            raw = localStorage.getItem(ROOT_KEY);
        } catch (error) {
            switchToMemory('unavailable', lastPersistedRaw, Object.create(null));
            return memoryData;
        }
        lastPersistedRaw = raw;
        if (raw === null) return Object.create(null);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            switchToMemory('corrupt', raw, Object.create(null));
            return memoryData;
        }
        if (!validateRoot(parsed)) {
            switchToMemory('invalid-data', raw, Object.create(null));
            return memoryData;
        }
        return normalizeRoot(parsed);
    }

    function setData(data) {
        if (memoryMode) {
            memoryData = data;
            return false;
        }
        if (!validateRoot(data)) {
            switchToMemory('invalid-data', lastPersistedRaw, Object.create(null));
            return false;
        }
        let serialized;
        try {
            serialized = JSON.stringify(data);
        } catch (error) {
            switchToMemory('serialization', lastPersistedRaw, data);
            return false;
        }
        try {
            localStorage.setItem(ROOT_KEY, serialized);
            lastPersistedRaw = serialized;
            return true;
        } catch (error) {
            const quota = error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
            switchToMemory(quota ? 'quota' : 'unavailable', lastPersistedRaw, data);
            return false;
        }
    }

    function emptyBragdData() {
        return { version: BRAGD_VERSION, migrationVersion: 0, badges: Object.create(null), progress: Object.create(null) };
    }

    function sanitizeBragdSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
        const safe = Object.create(null);
        Object.keys(snapshot).sort().forEach(function (key) {
            const value = snapshot[key];
            if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
                safe[key] = value;
            } else if (Array.isArray(value) && value.every(item => typeof item === 'number' && Number.isFinite(item) && item >= 0)) {
                safe[key] = value.slice();
            }
        });
        return Object.keys(safe).length ? safe : null;
    }

    function normalizeBragdData(value) {
        const result = emptyBragdData();
        if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
        result.version = BRAGD_VERSION;
        result.migrationVersion = Number.isInteger(value.migrationVersion) ? value.migrationVersion : 0;
        Object.keys(value.badges || {}).sort().forEach(function (appId) {
            const ids = value.badges[appId];
            if (!validBragdId(appId) || !Array.isArray(ids)) return;
            result.badges[appId] = Array.from(new Set(ids.filter(validBragdId))).sort();
        });
        Object.keys(value.progress || {}).sort().forEach(function (appId) {
            const snapshot = sanitizeBragdSnapshot(value.progress[appId]);
            if (validBragdId(appId) && snapshot) result.progress[appId] = snapshot;
        });
        return result;
    }

    function getBragdData() {
        return normalizeBragdData(getData().bragd);
    }

    function validBragdId(value) {
        return typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
    }

    function recordBadge(appId, badgeId) {
        if (!validBragdId(appId) || !validBragdId(badgeId)) return false;
        const data = getData();
        const bragd = normalizeBragdData(data.bragd);
        if (!bragd.badges[appId]) bragd.badges[appId] = [];
        if (bragd.badges[appId].includes(badgeId)) return false;
        bragd.badges[appId].push(badgeId);
        bragd.badges[appId].sort();
        data.bragd = bragd;
        setData(data);
        return true;
    }

    function updateBragdProgress(appId, snapshot) {
        if (!validBragdId(appId) || !snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false;
        const safeSnapshot = sanitizeBragdSnapshot(snapshot);
        if (!safeSnapshot) return false;
        const data = getData();
        const bragd = normalizeBragdData(data.bragd);
        bragd.progress[appId] = safeSnapshot;
        data.bragd = bragd;
        setData(data);
        return true;
    }

    // Importer eldre speltilstand atomisk; trygg å køyre att om ei side blir avbroten.
    function importBragdData(payload) {
        if (!payload || !Number.isInteger(payload.version) || payload.version < 1) return false;
        const data = getData();
        const bragd = normalizeBragdData(data.bragd);
        if (bragd.migrationVersion >= payload.version) return false;
        Object.keys(payload.badges || {}).sort().forEach(function (appId) {
            if (!validBragdId(appId) || !Array.isArray(payload.badges[appId])) return;
            const merged = new Set(bragd.badges[appId] || []);
            payload.badges[appId].forEach(id => { if (validBragdId(id)) merged.add(id); });
            bragd.badges[appId] = Array.from(merged).sort();
        });
        Object.keys(payload.progress || {}).sort().forEach(function (appId) {
            const snapshot = sanitizeBragdSnapshot(payload.progress[appId]);
            if (validBragdId(appId) && !bragd.progress[appId] && snapshot) bragd.progress[appId] = snapshot;
        });
        bragd.migrationVersion = payload.version;
        data.bragd = bragd;
        setData(data);
        return true;
    }

    function getStatus() {
        return {
            mode: memoryMode ? 'memory' : 'persistent',
            reason: storageReason,
            message: memoryMode ? warningMessage(storageReason) : 'Data blir lagra lokalt på denne eininga.',
            rawAvailable: recoveryRaw !== null
        };
    }

    function getAllData() {
        return getData();
    }

    function getRecoveryRaw() {
        return recoveryRaw;
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
        let oldVal;
        try {
            oldVal = localStorage.getItem(oldKey);
        } catch (error) {
            switchToMemory('unavailable', lastPersistedRaw, Object.create(null));
            return;
        }
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
        
        if (setData(data)) {
            try { localStorage.removeItem(oldKey); } catch (error) { /* Keep the legacy copy if removal is unavailable. */ }
        }
    }
    
    function migrateAll() {
        for (const oldKey in MIGRATIONS) {
            try { migrateOldKey(oldKey); } catch (error) {
                switchToMemory('unavailable', lastPersistedRaw, memoryData || Object.create(null));
                break;
            }
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
        if (!Array.isArray(data[game].history)) {
            switchToMemory('invalid-data', lastPersistedRaw, data);
            data[game].history = [];
        }
        
        data[game].history.push({ ...entry, date: new Date().toISOString() });
        setData(data);
    }
    
    // Replace the full history array (used by games that sort/cap before saving)
    function setHistory(game, historyArray) {
        if (!Array.isArray(historyArray)) return false;
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
        if (!Array.isArray(data[game][listKey])) {
            switchToMemory('invalid-data', lastPersistedRaw, data);
            data[game][listKey] = [];
        }
        data[game][listKey].push(item);
        setData(data);
    }

    function getList(game, listKey) {
        const data = getData();
        const list = data[game]?.[listKey];
        if (list === undefined) return [];
        if (Array.isArray(list)) return list;
        switchToMemory('invalid-data', lastPersistedRaw, data);
        data[game][listKey] = [];
        return [];
    }

    function deleteListItem(game, listKey, id) {
        const data = getData();
        if (!data[game]?.[listKey]) return;
        if (!Array.isArray(data[game][listKey])) {
            switchToMemory('invalid-data', lastPersistedRaw, data);
            data[game][listKey] = [];
            return;
        }
        data[game][listKey] = data[game][listKey].filter(item => item.id !== id);
        setData(data);
    }

    /* Erset heile lista for ein game+listKey */
    function setList(game, listKey, arr) {
        if (!Array.isArray(arr)) return false;
        const data = getData();
        if (!data[game]) data[game] = {};
        data[game][listKey] = arr;
        setData(data);
    }

    /* Oppdater eitt element i lista (finn på id) */
    function updateListItem(game, listKey, id, changes) {
        const data = getData();
        if (!data[game]?.[listKey]) return null;
        if (!Array.isArray(data[game][listKey])) {
            switchToMemory('invalid-data', lastPersistedRaw, data);
            data[game][listKey] = [];
            return null;
        }
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
        const entries = data[game]?.collections?.[catId];
        if (entries === undefined) return [];
        if (Array.isArray(entries)) return entries;
        switchToMemory('invalid-data', lastPersistedRaw, data);
        data[game].collections[catId] = [];
        return [];
    }

    function setCollection(game, catId, entries) {
        if (!Array.isArray(entries)) return false;
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
        const bragd = normalizeBragdData(data.bragd);
        delete bragd.badges[game];
        delete bragd.progress[game];
        data.bragd = bragd;
        setData(data);
        clearGameAssets(game).catch(function () {});
    }
    
    function clearAll() {
        try {
            localStorage.removeItem(ROOT_KEY);
        } catch (error) {
            return Promise.reject(error);
        }
        memoryMode = false;
        memoryData = null;
        storageReason = null;
        recoveryRaw = null;
        lastPersistedRaw = null;
        if (warningElement) warningElement.remove();
        warningElement = null;
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
        recordBadge,
        updateBragdProgress,
        getBragdData,
        importBragdData,
        getStatus,
        getAllData,
        getRecoveryRaw,
        saveGameAsset,
        getGameAsset,
        deleteGameAsset,
        getStoredAssetInfo,
        clearGame,
        clearAll
    };
})();
