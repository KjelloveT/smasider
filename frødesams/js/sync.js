// BroadcastChannel Sync for Frødesams
// Synkroniserer mellom storskjerm (index.html) og quiz-master (controller.html)

class SyncManager {
    constructor(channelName = 'frødesams-sync') {
        this.channel = new BroadcastChannel(channelName);
        this.isController = window.location.pathname.includes('controller.html');
        this.listeners = new Map();
        
        this.init();
    }
    
    init() {
        this.channel.onmessage = (event) => {
            const data = event.data;
            this.handleMessage(data);
        };
    }
    
    handleMessage(data) {
        const { type, payload } = data;
        
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(payload));
        }
    }
    
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }
    
    off(type, callback) {
        if (this.listeners.has(type)) {
            const callbacks = this.listeners.get(type);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    send(type, payload = {}) {
        this.channel.postMessage({ type, payload });
    }
    
    // Convenience methods for common actions
    revealAnswer(answerIndex) {
        this.send('reveal-answer', { answerIndex });
    }
    
    strike() {
        this.send('strike', {});
    }
    
    nextQuestion() {
        this.send('next-question', {});
    }
    
    awardPoints(teamId, points) {
        this.send('award-points', { teamId, points });
    }
    
    endGame() {
        this.send('end-game', {});
    }
    
    startGame(quizId, teams) {
        this.send('start-game', { quizId, teams });
    }
    
    close() {
        this.channel.close();
    }
}

// Export for use in app.js
if (typeof window !== 'undefined') {
    window.SyncManager = SyncManager;
}
