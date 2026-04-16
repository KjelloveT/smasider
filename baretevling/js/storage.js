// BåreTevling - Storage Management
const STORAGE_KEY = 'baretevling_game';

const Storage = {
    // Save game state to localStorage
    save(gameState) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    },

    // Load game state from localStorage
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },

    // Clear game state from localStorage
    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear game state:', e);
            return false;
        }
    },

    // Check if a saved game exists
    hasSavedGame() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }
};
