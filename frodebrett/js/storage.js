// Storage System for Frødebrett
// Same localStorage approach as klassekart

const Storage = {
    // Keys
    QUIZZES_KEY: 'frodebrett_quizzes',
    TEAMS_KEY: 'frodebrett_teams',
    
    // Migrate old keys from frodetavla
    migrate() {
        const oldQ = localStorage.getItem('frodetavla_quizzes');
        const oldT = localStorage.getItem('frodetavla_teams');
        if (oldQ && !localStorage.getItem(this.QUIZZES_KEY)) {
            localStorage.setItem(this.QUIZZES_KEY, oldQ);
            localStorage.removeItem('frodetavla_quizzes');
        }
        if (oldT && !localStorage.getItem(this.TEAMS_KEY)) {
            localStorage.setItem(this.TEAMS_KEY, oldT);
            localStorage.removeItem('frodetavla_teams');
        }
    },
    
    // Quiz Management
    getQuizzes() {
        try {
            const data = localStorage.getItem(this.QUIZZES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading quizzes:', e);
            return [];
        }
    },
    
    saveQuiz(quiz) {
        try {
            const quizzes = this.getQuizzes();
            const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
            
            if (existingIndex >= 0) {
                quizzes[existingIndex] = quiz;
            } else {
                quiz.id = this.generateId('quiz');
                quiz.created = new Date().toISOString();
                quizzes.push(quiz);
            }
            
            localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(quizzes));
            return true;
        } catch (e) {
            console.error('Error saving quiz:', e);
            return false;
        }
    },
    
    deleteQuiz(quizId) {
        try {
            const quizzes = this.getQuizzes();
            const filtered = quizzes.filter(q => q.id !== quizId);
            localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(filtered));
            return true;
        } catch (e) {
            console.error('Error deleting quiz:', e);
            return false;
        }
    },
    
    // Team Management
    getTeams() {
        try {
            const data = localStorage.getItem(this.TEAMS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading teams:', e);
            return [];
        }
    },
    
    saveTeams(teams) {
        try {
            localStorage.setItem(this.TEAMS_KEY, JSON.stringify(teams));
            return true;
        } catch (e) {
            console.error('Error saving teams:', e);
            return false;
        }
    },
    
    // Utility
    generateId(prefix = 'id') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Export/Import for backup
    exportData() {
        return {
            quizzes: this.getQuizzes(),
            teams: this.getTeams(),
            exported: new Date().toISOString()
        };
    },
    
    importData(data) {
        try {
            if (data.quizzes) {
                localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(data.quizzes));
            }
            if (data.teams) {
                localStorage.setItem(this.TEAMS_KEY, JSON.stringify(data.teams));
            }
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },
    
    // Clear all data
    clearAll() {
        try {
            localStorage.removeItem(this.QUIZZES_KEY);
            localStorage.removeItem(this.TEAMS_KEY);
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
