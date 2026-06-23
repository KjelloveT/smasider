/* ══════════════════════════════════════════════
   LANDKJENNING — Runde-motor + poengrekning
   Eitt-spelar økt: poeng, streak, statistikk.
   Speglar frodekapp/js/quiz-runner.js. Held DOM utanfor.
   ══════════════════════════════════════════════ */

const Scoring = {
  BASE: 100,
  MAX_TIME_BONUS: 100,
  TIER_MULT: { 1: 1, 2: 1.3, 3: 1.6 },
  STREAK_THRESHOLDS: [
    { count: 25, bonus: 200 },
    { count: 10, bonus: 100 },
    { count: 5, bonus: 50 }
  ],

  calculate(correct, timeUsedMs, timeLimitSec, streak, tier) {
    if (!correct) return { points: 0, timeBonus: 0, streakBonus: 0, newStreak: 0 };
    const frac = Math.max(0, 1 - (timeUsedMs / 1000) / timeLimitSec);
    const timeBonus = Math.round(this.MAX_TIME_BONUS * frac);
    const newStreak = streak + 1;
    let streakBonus = 0;
    for (const t of this.STREAK_THRESHOLDS) {
      if (newStreak >= t.count && newStreak % t.count === 0) { streakBonus = t.bonus; break; }
    }
    const mult = this.TIER_MULT[tier] || 1;
    const points = Math.round((this.BASE + timeBonus + streakBonus) * mult);
    return { points, timeBonus, streakBonus, newStreak };
  }
};

class GeoRound {
  constructor(questions, modeId, levelId) {
    this.questions = questions;
    this.mode = modeId;
    this.level = levelId;
    this.timeLimitSec = GeoData.LEVELS[levelId].timeLimit;
    this.reset();
  }

  reset() {
    this.index = 0;
    this.score = 0;
    this.streak = 0;
    this.answers = [];
  }

  get total() { return this.questions.length; }
  get current() { return this.questions[this.index]; }
  get done() { return this.index >= this.total; }

  /**
   * Registrer eit svar.
   * @param {number} optionIndex - vald landknapp
   * @param {number} timeUsedMs
   */
  answer(optionIndex, timeUsedMs) {
    const q = this.current;
    const isCorrect = optionIndex === q.correctIndex;
    const res = Scoring.calculate(isCorrect, timeUsedMs, this.timeLimitSec, this.streak, q.answer.tier);
    this.score += res.points;
    this.streak = res.newStreak;

    if (isCorrect) {
      Progression.recordCorrect({ mode: this.mode, level: this.level, region: q.answer.region });
      Progression.noteStreak(this.streak);
    }
    this.answers.push({ index: this.index, selected: optionIndex, correct: q.correctIndex, isCorrect, points: res.points });
    return { isCorrect, correctIndex: q.correctIndex, points: res.points, streakBonus: res.streakBonus };
  }

  timeout() {
    const q = this.current;
    this.streak = 0;
    this.answers.push({ index: this.index, selected: null, correct: q.correctIndex, isCorrect: false, points: 0 });
  }

  advance() { this.index++; }

  /** Oppsummering for resultatskjermen + lagre progresjon. */
  finish() {
    const correct = this.answers.filter(a => a.isCorrect).length;
    const total = this.answers.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    let best = 0, cur = 0;
    this.answers.forEach(a => { if (a.isCorrect) { cur++; best = Math.max(best, cur); } else cur = 0; });

    const { record } = Progression.finishRound({ score: this.score, correct, total });
    return { score: this.score, correct, total, accuracy, bestStreak: best, record };
  }
}

if (typeof window !== 'undefined') { window.Scoring = Scoring; window.GeoRound = GeoRound; }
