// Storage System for Frødesams
// localStorage for quizzes

const Storage = {
    // Keys
    QUIZZES_KEY: 'frødesams_quizzes',
    
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
    
    // Utility
    generateId(prefix = 'id') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Export/Import for backup
    exportData() {
        return {
            quizzes: this.getQuizzes(),
            exported: new Date().toISOString()
        };
    },
    
    importData(data) {
        try {
            if (data.quizzes) {
                localStorage.setItem(this.QUIZZES_KEY, JSON.stringify(data.quizzes));
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
