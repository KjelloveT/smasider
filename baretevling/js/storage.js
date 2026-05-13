// BåreTevling - Storage Management
// Bruker det felles VyrdepilStorage-API-et for all lagring.
VyrdepilStorage.migrateAll();

const GAME_KEY = 'baretevling';

const Storage = {
    // Save game state via VyrdepilStorage
    save(gameState) {
        try {
            VyrdepilStorage.setGameState(GAME_KEY, gameState);
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    },

    // Load game state via VyrdepilStorage
    load() {
        try {
            return VyrdepilStorage.getGameState(GAME_KEY);
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },

    // Clear saved game
    clear() {
        try {
            VyrdepilStorage.clearGameState(GAME_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear game state:', e);
            return false;
        }
    },

    // Check if a saved game exists
    hasSavedGame() {
        return VyrdepilStorage.hasGameState(GAME_KEY);
    }
};
