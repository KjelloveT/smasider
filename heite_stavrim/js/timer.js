// Heite Stavrim — Timer

HeiteStavrimGame.prototype.startTimer = function () {
    this.stopTimer();
    this.timer.handle = setInterval(() => {
        if (this.timer.paused) return;
        this.timer.timeLeft--;
        this.updateTimerDisplay();
        if (this.timer.timeLeft <= 0) {
            this.stopTimer();
            this.playEndSound();
            this.endRound();
        }
    }, 1000);
};

HeiteStavrimGame.prototype.stopTimer = function () {
    if (this.timer.handle) {
        clearInterval(this.timer.handle);
        this.timer.handle = null;
    }
};

HeiteStavrimGame.prototype.updateTimerDisplay = function () {
    const t = Math.max(0, this.timer.timeLeft);
    const m = Math.floor(t / 60);
    const s = t % 60;
    this.el.timerDisplay.textContent = m > 0
        ? `${m}:${String(s).padStart(2, '0')}`
        : String(s);
    this.el.timerDisplay.classList.toggle('warning', t <= 10 && t > 0 && !this.timer.paused);
    this.el.timerDisplay.classList.toggle('paused', this.timer.paused);
};

HeiteStavrimGame.prototype.togglePause = function () {
    this.timer.paused = !this.timer.paused;
    this.el.pauseBtn.textContent = this.timer.paused ? 'Fortsett' : 'Pause';
    this.updateTimerDisplay();
};

HeiteStavrimGame.prototype.addTime = function (seconds) {
    this.timer.timeLeft += seconds;
    this.updateTimerDisplay();
};

HeiteStavrimGame.prototype.playEndSound = function () {
    try {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
    } catch (e) { /* ignore */ }
};
