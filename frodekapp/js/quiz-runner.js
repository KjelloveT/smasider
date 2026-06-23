/* ══════════════════════════════════════════════
   FRØDEKAPP — Quiz-køyrar (delt spel-logikk)
   Eitt-spelar motor for poeng, streak og statistikk.
   Brukt av soloøvinga; held DOM/visning utanfor.
   ══════════════════════════════════════════════ */

class QuizRunner {
    constructor(quiz) {
        this.quiz = quiz;
        this.reset();
    }

    reset() {
        this.currentIndex = 0;
        this.score = 0;
        this.streak = 0;
        this.answers = [];
    }

    get total() { return this.quiz.questions.length; }
    get current() { return this.quiz.questions[this.currentIndex]; }
    get done() { return this.currentIndex >= this.total; }

    timeLimit() { return (this.current && this.current.timeLimit) || 20; }

    /**
     * Registrer eit svar.
     * @param {number} index - vald alternativ
     * @param {number} timeUsedMs
     * @returns {{ isCorrect: boolean, result: object, correctIndex: number }}
     */
    answer(index, timeUsedMs) {
        const q = this.current;
        const isCorrect = index === q.correct;
        const result = QuizEngine.calculateScore(isCorrect, timeUsedMs, this.timeLimit(), this.streak);
        this.score += result.points;
        this.streak = result.newStreak;
        this.answers.push({
            questionIndex: this.currentIndex,
            selected: index,
            correct: q.correct,
            isCorrect,
            timeUsed: timeUsedMs,
            points: result.points
        });
        return { isCorrect, result, correctIndex: q.correct };
    }

    /** Registrer at tida gjekk ut utan svar. */
    timeout() {
        const q = this.current;
        this.streak = 0;
        this.answers.push({
            questionIndex: this.currentIndex,
            selected: null,
            correct: q.correct,
            isCorrect: false,
            timeUsed: this.timeLimit() * 1000,
            points: 0
        });
    }

    advance() { this.currentIndex++; }

    /** Oppsummert statistikk for resultatskjermen. */
    stats() {
        const total = this.answers.length;
        const correct = this.answers.filter(a => a.isCorrect).length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        let best = 0, cur = 0;
        this.answers.forEach(a => {
            if (a.isCorrect) { cur++; best = Math.max(best, cur); }
            else cur = 0;
        });

        const avgTime = total > 0
            ? Math.round(this.answers.reduce((s, a) => s + a.timeUsed, 0) / total / 100) / 10
            : 0;

        return { score: this.score, correct, total, accuracy, bestStreak: best, avgTime };
    }
}
