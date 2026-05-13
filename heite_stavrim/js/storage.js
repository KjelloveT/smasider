// Heite Stavrim - Storage via VyrdepilStorage (felles state-API)

const HeiteStavrimStorage = (function() {
    const GAME = 'heite_stavrim';

    function getState() {
        return VyrdepilStorage.getGameState(GAME) || {};
    }

    function patchState(updates) {
        const current = getState();
        VyrdepilStorage.setGameState(GAME, { ...current, ...updates });
    }

    return {
        getCustomCategories() {
            return getState().customCategories || [];
        },
        saveCustomCategories(list) {
            patchState({ customCategories: list });
        },
        getLastSettings() {
            return getState().lastSettings || null;
        },
        saveLastSettings(settings) {
            patchState({ lastSettings: settings });
        },
        getTeamConfig() {
            return getState().teamConfig || null;
        },
        saveTeamConfig(teams) {
            patchState({ teamConfig: teams });
        }
    };
})();
