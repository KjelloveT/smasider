/* state.js — økt-/sesjonstilstand for ei Tidvis-runde.
   Held score, streak, combo, XP og oppgåve-progresjon for den aktive økta.
   Persistent framgang ligg i storage.js; her er berre det flyktige. */
(function () {
  'use strict';

  // poengmodell (modell etter Ordaklok)
  const BASE_POINTS = 100;
  const COMBO_STEP = 3;      // kvar 3-combo gjev bonus
  const COMBO_BONUS = 50;
  const WRONG_PENALTY = 25;
  const SPEED_BONUS_MAX = 50; // tidsbonus for raske svar
  const SPEED_WINDOW = 6000;  // ms — under dette gjev full tidsbonus-skala

  function createSession(opts) {
    opts = opts || {};
    return {
      mode: opts.mode || 'les',
      direction: opts.direction || 'a2t',
      level: opts.level != null ? opts.level : 0,
      total: opts.total || 10,
      stillTarget: opts.stillTarget || 'text',
      paraReprs: opts.paraReprs || ['analog', 'text'],

      score: 0,
      streak: 0,
      bestStreak: 0,
      combo: 0,
      xp: 0,            // XP tent i denne økta

      questionIndex: 0,
      correctCount: 0,
      answeredCount: 0,
      fastest: null,    // raskaste svar (ms) i økta

      currentQuestion: null,
      questionStart: 0,
      results: []       // {correct, ms, question}
    };
  }

  // registrer eit svar; returnerer detaljar om poeng/combo
  function recordAnswer(s, correct, opts) {
    opts = opts || {};
    const ms = opts.ms != null ? opts.ms : (Date.now() - s.questionStart);
    s.answeredCount++;
    s.results.push({ correct: correct, ms: ms, question: s.currentQuestion });

    let gained = 0;
    let comboBonus = 0;
    let speedBonus = 0;

    if (correct) {
      s.correctCount++;
      s.streak++;
      s.combo++;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      if (s.fastest == null || ms < s.fastest) s.fastest = ms;

      gained = BASE_POINTS;
      // tidsbonus: lineær frå full → 0 over SPEED_WINDOW
      if (ms < SPEED_WINDOW) {
        speedBonus = Math.round(SPEED_BONUS_MAX * (1 - ms / SPEED_WINDOW));
      }
      gained += speedBonus;
      // combo-bonus kvar COMBO_STEP rette
      if (s.combo % COMBO_STEP === 0) {
        comboBonus = COMBO_BONUS;
        gained += comboBonus;
      }
      // XP: enkel modell — combo og nivå aukar utteljing
      s.xp += 10 + s.level * 2 + (comboBonus ? 5 : 0);
    } else {
      s.streak = 0;
      s.combo = 0;
      gained = -WRONG_PENALTY;
    }

    s.score = Math.max(0, s.score + gained);

    return {
      correct: correct,
      gained: gained,
      comboBonus: comboBonus,
      speedBonus: speedBonus,
      combo: s.combo,
      streak: s.streak,
      ms: ms
    };
  }

  function isFinished(s) {
    return s.questionIndex >= s.total;
  }

  function accuracy(s) {
    if (s.answeredCount === 0) return 0;
    return Math.round((s.correctCount / s.answeredCount) * 100);
  }

  window.TidvisState = {
    createSession: createSession,
    recordAnswer: recordAnswer,
    isFinished: isFinished,
    accuracy: accuracy,
    BASE_POINTS: BASE_POINTS
  };
})();
