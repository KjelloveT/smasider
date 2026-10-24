/* Spelreglar. Ingen DOM, nettverk eller lagring i denne modulen. */
window.OrdvettGame = (function () {
  'use strict';
  const HINTS = Object.freeze([
    { id: 'pos', label: 'Ordklasse', price: 1 },
    { id: 'grammar', label: 'Grammatisk hint', price: 1 },
    { id: 'usage', label: 'Bruksområde', price: 2 },
    { id: 'sentence', label: 'Setningsdøme', price: 3 },
    { id: 'random', label: 'Tilfeldig bokstav', price: 3 },
    { id: 'chosen', label: 'Vel bokstavplass', price: 4 },
    { id: 'definition', label: 'Forklaring', price: 4 }
  ]);
  const POS = Object.freeze({ NOUN: 'Substantiv', VERB: 'Verb', ADJ: 'Adjektiv' });
  function normalize(value) { return String(value).normalize('NFC').trim().toLocaleLowerCase('nn-NO'); }
  function createRound(words, random) {
    if (!Array.isArray(words) || !words.length) throw new Error('Omgangen treng ord.');
    return {
      index: 0, random: random || Math.random,
      questions: words.map(word => ({ word, cost: 0, purchases: [], revealed: new Set(), guesses: new Set(), outcome: null }))
    };
  }
  function current(round) { return round.questions[round.index]; }
  function available(round, id) {
    const question = current(round);
    if (!question || question.outcome || !HINTS.some(hint => hint.id === id)) return false;
    if (id === 'random' || id === 'chosen') return question.revealed.size < Array.from(question.word.answer).length;
    if (question.purchases.some(purchase => purchase.id === id)) return false;
    // Grammatikkhintet røper òg ordklassen. Ikkje ta betalt for same opplysning to gonger.
    if (id === 'pos' && question.purchases.some(purchase => purchase.id === 'grammar')) return false;
    if (id === 'grammar' && question.word.pos !== 'NOUN' && question.purchases.some(purchase => purchase.id === 'pos')) return false;
    return true;
  }
  function buyHint(round, id, position) {
    if (!available(round, id)) return { ok: false, message: 'Dette hintet gjev ikkje meir informasjon no.' };
    const question = current(round);
    const word = question.word;
    const hint = HINTS.find(item => item.id === id);
    let text;
    if (id === 'chosen' || id === 'random') {
      const letters = Array.from(word.answer);
      const hidden = letters.map((letter, index) => index).filter(index => !question.revealed.has(index));
      const index = id === 'random' ? hidden[Math.floor(round.random() * hidden.length)] : position;
      if (!Number.isInteger(index) || !hidden.includes(index)) return { ok: false, message: 'Vel ei skjult bokstavrute.' };
      question.revealed.add(index);
      text = `Bokstav ${index + 1} er ${letters[index].toLocaleUpperCase('nn-NO')}.`;
    } else {
      text = id === 'pos' ? POS[word.pos] : word[id];
    }
    question.cost += hint.price;
    question.purchases.push({ id, label: hint.label, price: hint.price, text });
    return { ok: true, message: `${hint.label}: ${text} Du brukte ${hint.price} ${hint.price === 1 ? 'mynt' : 'myntar'}.` };
  }
  function guess(round, value) {
    const question = current(round);
    if (question.outcome) return { ok: false, message: 'Dette ordet er ferdig.' };
    const answer = normalize(value);
    if (!answer) return { ok: false, message: 'Skriv eit ord før du prøver. Ingen myntar brukte.' };
    if ([question.word.answer, ...question.word.alternatives].some(form => normalize(form) === answer)) {
      question.outcome = 'solved';
      return { ok: true, message: `Rett! Du fann «${question.word.answer}» med ${question.cost} ${question.cost === 1 ? 'mynt' : 'myntar'}.` };
    }
    if (question.guesses.has(answer)) return { ok: false, message: 'Du har prøvd dette svaret før. Ingen nye myntar brukte.' };
    question.guesses.add(answer);
    question.cost += 2;
    return { ok: false, message: 'Det var ikkje ordet. Du brukte 2 myntar. Prøv eit anna svar eller kjøp eit hint.' };
  }
  function reveal(round) {
    const question = current(round);
    if (!question.outcome) question.outcome = 'revealed';
    return { ok: true, message: `Fasiten er «${question.word.answer}». Ordet blir registrert som uløyst.` };
  }
  function advance(round) {
    if (!current(round).outcome || round.index >= round.questions.length - 1) return false;
    round.index++;
    return true;
  }
  function summary(round) {
    return {
      solved: round.questions.filter(question => question.outcome === 'solved').length,
      cost: round.questions.reduce((sum, question) => sum + question.cost, 0),
      complete: round.questions.every(question => question.outcome !== null)
    };
  }
  return Object.freeze({ HINTS, POS, normalize, createRound, current, available, buyHint, guess, reveal, advance, summary });
})();
