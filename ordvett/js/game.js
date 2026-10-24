/* Spelreglar. Ingen DOM, nettverk eller lagring i denne modulen. */
window.OrdvettGame = (function () {
  'use strict';
  const BUDGET = 40;
  const MAX_POSITION = 30;
  const HINTS = Object.freeze([
    { id: 'pos', label: 'Ordklasse', icon: 'bookOpen', price: 1 },
    { id: 'grammar', label: 'Grammatikk', icon: 'layers', price: 1 },
    { id: 'theme', label: 'Tema', icon: 'mapPin', price: 3 },
    { id: 'length', label: 'Ordlengd', icon: 'ruler', price: 2 },
    { id: 'random', label: 'Bokstav', icon: 'shuffle', price: 2 },
    { id: 'chosen', label: 'Vel rute', icon: 'pointer', price: 5 },
    { id: 'usage', label: 'Bruk', icon: 'mapPin', price: 8 },
    { id: 'sentence', label: 'Setning', icon: 'type', price: 8 },
    { id: 'definition', label: 'Tyding', icon: 'lightbulb', price: 8 }
  ]);
  const POS = Object.freeze({ NOUN: 'Substantiv', VERB: 'Verb', ADJ: 'Adjektiv' });
  function normalize(value) { return String(value).normalize('NFC').trim().toLocaleLowerCase('nn-NO'); }
  // Samanlikning etter ny innlasting, ikkje kryptering. Svarteksten blir aldri lagra.
  function guessKey(value) {
    let a = 2166136261, b = 2246822507;
    for (const letter of normalize(value)) {
      a = Math.imul(a ^ letter.codePointAt(0), 16777619);
      b = Math.imul(b ^ letter.codePointAt(0), 3266489909);
    }
    return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
  }
  function createRound(words, random) {
    if (!Array.isArray(words) || !words.length) throw new Error('Omgangen treng ord.');
    return { index: 0, random: random || Math.random,
      questions: words.map(word => ({ word, cost: 0, purchases: [], revealed: new Set(), misses: new Set(), guesses: new Set(), outcome: null })) };
  }
  function current(round) { return round.questions[round.index]; }
  function summary(round) {
    const cost = round.questions.reduce((sum, question) => sum + question.cost, 0);
    return { solved: round.questions.filter(question => question.outcome === 'solved').length,
      cost, remaining: BUDGET - cost, complete: round.questions.every(question => question.outcome !== null) };
  }
  function known(round, id) {
    const question = current(round);
    if (id === 'random') return question.revealed.size >= Array.from(question.word.answer).length;
    if (id === 'chosen') return question.revealed.size + question.misses.size >= MAX_POSITION;
    if (question.purchases.some(purchase => purchase.id === id)) return true;
    if (id === 'pos' && question.purchases.some(purchase => purchase.id === 'grammar')) return true;
    return id === 'grammar' && question.word.pos !== 'NOUN' && question.purchases.some(purchase => purchase.id === 'pos');
  }
  function available(round, id) {
    const hint = HINTS.find(hint => hint.id === id);
    return Boolean(hint && !current(round).outcome && !known(round, id) && summary(round).remaining >= hint.price);
  }
  function buyHint(round, id, position) {
    const hint = HINTS.find(item => item.id === id);
    if (!hint || current(round).outcome || known(round, id)) return { ok: false, message: 'Dette hintet er alt kjent.' };
    if (summary(round).remaining < hint.price) return { ok: false, status: 'funds', price: 0, message: 'Du har ikkje nok myntar til dette hintet.' };
    const question = current(round), word = question.word;
    let text, revealedPosition;
    if (id === 'chosen' || id === 'random') {
      const letters = Array.from(word.answer);
      const hidden = letters.map((letter, index) => index).filter(index => !question.revealed.has(index));
      const randomIndex = id === 'random' ? hidden[Math.floor(round.random() * hidden.length)] : null;
      const index = id === 'random' && position === undefined ? randomIndex : position;
      if (!Number.isInteger(index) || index < 0 || index >= MAX_POSITION || question.revealed.has(index) || question.misses.has(index) || id === 'random' && !hidden.includes(index)) return { ok: false, status: 'position', price: 0, message: 'Vel ein ny bokstavplass frå 1 til 30. Same plass blir ikkje betalt to gonger.' };
      revealedPosition = index;
      if (index >= letters.length) {
        question.misses.add(index); text = `Det er ingen bokstav på plass ${index + 1}.`;
      } else {
        question.revealed.add(index); text = `Bokstav ${index + 1} er ${letters[index].toLocaleUpperCase('nn-NO')}.`;
      }
    } else if (id === 'length') text = `${Array.from(word.answer).length} bokstavar`;
    else text = id === 'pos' ? POS[word.pos] : word[id];
    question.cost += hint.price;
    question.purchases.push({ id, label: hint.label, price: hint.price, text, position: revealedPosition });
    return { ok: true, status: 'bought', price: hint.price, position: revealedPosition, message: `${hint.label}: ${text} Du brukte ${hint.price} ${hint.price === 1 ? 'mynt' : 'myntar'}.` };
  }
  function guess(round, value) {
    const question = current(round);
    if (question.outcome) return { ok: false, message: 'Dette ordet er ferdig.' };
    const answer = normalize(value);
    if (!answer) return { ok: false, status: 'empty', price: 0, message: 'Skriv eit ord før du prøver. Ingen myntar brukte.' };
    const fingerprint = guessKey(answer);
    if (question.guesses.has(fingerprint)) return { ok: false, status: 'repeat', price: 0, message: 'Du har prøvd dette svaret før. Ingen nye myntar brukte.' };
    // Eit forsøk krev dekning for feilprisen. Rette svar trekkjer ingen myntar.
    if (summary(round).remaining < 2) return { ok: false, status: 'funds', price: 0, message: 'Du treng 2 myntar for å prøve. Vis fasit for å gå vidare.' };
    if ([question.word.answer, ...question.word.alternatives].some(form => normalize(form) === answer)) {
      question.outcome = 'solved';
      return { ok: true, status: 'solved', price: 0, message: `Rett! Du fann «${question.word.answer}» med ${question.cost} ${question.cost === 1 ? 'mynt' : 'myntar'}.` };
    }
    question.guesses.add(fingerprint); question.cost += 2;
    return { ok: false, status: 'wrong', price: 2, message: 'Det var ikkje ordet. Du brukte 2 myntar.' };
  }
  function reveal(round) {
    const question = current(round);
    if (!question.outcome) question.outcome = 'revealed';
    return { ok: true, status: 'revealed', price: 0, message: `Fasiten er «${question.word.answer}». Ordet blir registrert som uløyst.` };
  }
  function advance(round) {
    if (!current(round).outcome || round.index >= round.questions.length - 1) return false;
    round.index++; return true;
  }
  function pack(round) {
    return { version: 2, index: round.index, questions: round.questions.map(question => ({
      wordId: question.word.id, outcome: question.outcome, guesses: [...question.guesses],
      purchases: question.purchases.map(purchase => ({ id: purchase.id, position: purchase.position }))
    })) };
  }
  function restore(words, saved, random) {
    try {
      if (saved?.version !== 2 || saved.questions?.length !== words.length || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= words.length) return null;
      const round = createRound(words, random);
      saved.questions.forEach((entry, index) => {
        if (entry.wordId !== words[index].id || ![null, 'solved', 'revealed'].includes(entry.outcome) || !Array.isArray(entry.guesses) || entry.guesses.length > BUDGET / 2 || !Array.isArray(entry.purchases) || entry.purchases.length > 30) throw new Error('Ugyldig dagsrunde');
        if (index < saved.index && !entry.outcome || index > saved.index && (entry.outcome || entry.guesses.length || entry.purchases.length)) throw new Error('Ugyldig rekkjefølgje');
        round.index = index;
        entry.purchases.forEach(purchase => { if (!buyHint(round, purchase.id, purchase.position).ok) throw new Error('Ugyldig hintkjøp'); });
        if (entry.guesses.some(value => typeof value !== 'string' || !/^[a-f0-9]{16}$/.test(value))) throw new Error('Ugyldig svaravtrykk');
        current(round).guesses = new Set(entry.guesses);
        current(round).cost += current(round).guesses.size * 2;
        if (summary(round).remaining < 0 || entry.outcome === 'solved' && summary(round).remaining < 2) throw new Error('Ugyldig myntbruk');
        current(round).outcome = entry.outcome;
      });
      round.index = saved.index; return round;
    } catch (error) { return null; }
  }
  return Object.freeze({ BUDGET, MAX_POSITION, HINTS, POS, normalize, createRound, current, known, available, buyHint, guess, reveal, advance, summary, pack, restore });
})();
