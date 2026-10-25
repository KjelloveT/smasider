/* Spelreglar. Ingen DOM, nettverk eller lagring i denne modulen. */
window.OrdvettGame = (function () {
  'use strict';
  const BUDGET = 60;
  const MAX_POSITION = 30;
  const HINTS = Object.freeze([
    { id: 'pos', label: 'Ordklasse', icon: 'bookOpen', price: 1, stock: 5 },
    { id: 'grammar', label: 'Grammatikk', icon: 'layers', price: 1, stock: 5 },
    { id: 'theme', label: 'Tema', icon: 'mapPin', price: 3, stock: 5 },
    { id: 'length', label: 'Ordlengd', icon: 'ruler', price: 2, stock: 5 },
    { id: 'random', label: 'Bokstav', icon: 'shuffle', price: 2, stock: 8 },
    { id: 'chosen', label: 'Få vite bokstav nr …', icon: 'pointer', price: 5, stock: 5 },
    { id: 'usage', label: 'Bruk', icon: 'mapPin', price: 8, stock: 1 },
    { id: 'sentence', label: 'Setning', icon: 'type', price: 8, stock: 1 },
    { id: 'definition', label: 'Tyding', icon: 'lightbulb', price: 8, stock: 1 }
  ]);
  const POS = Object.freeze({ NOUN: 'Substantiv', VERB: 'Verb', ADJ: 'Adjektiv' });
  function normalize(value) { return String(value).normalize('NFC').trim().toLocaleLowerCase('nn-NO'); }
  // Samanlikning etter ny innlasting, ikkje kryptering. Eldre rundar har berre avtrykk.
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
      questions: words.map(word => ({ word, cost: 0, purchases: [], revealed: new Set(), misses: new Set(), guesses: new Set(), wrongGuesses: [], lastChanceMiss: null, outcome: null })) };
  }
  function current(round) { return round.questions[round.index]; }
  function summary(round) {
    const cost = round.questions.reduce((sum, question) => sum + question.cost, 0);
    return { solved: round.questions.filter(question => question.outcome === 'solved').length,
      cost, remaining: BUDGET - cost, complete: round.questions.every(question => question.outcome !== null) };
  }
  function lastChanceFailed(round) { return round.questions.some(question => question.lastChanceMiss !== null); }
  function canGuess(round) { return !current(round).outcome && !lastChanceFailed(round); }
  function known(round, id) {
    const question = current(round);
    if (id === 'random') return question.revealed.size >= Array.from(question.word.answer).length;
    if (id === 'chosen') return question.revealed.size + question.misses.size >= MAX_POSITION;
    if (question.purchases.some(purchase => purchase.id === id)) return true;
    if (id === 'pos' && question.purchases.some(purchase => purchase.id === 'grammar')) return true;
    return id === 'grammar' && question.word.pos !== 'NOUN' && question.purchases.some(purchase => purchase.id === 'pos');
  }
  function stock(round, id) {
    const hint = HINTS.find(item => item.id === id);
    return hint ? Math.max(0, hint.stock - round.questions.reduce((sum, question) => sum + question.purchases.filter(purchase => purchase.id === id).length, 0)) : 0;
  }
  function available(round, id) {
    const hint = HINTS.find(hint => hint.id === id);
    return Boolean(hint && stock(round, id) > 0 && !current(round).outcome && !known(round, id) && summary(round).remaining >= hint.price);
  }
  function buyHint(round, id, position) {
    const hint = HINTS.find(item => item.id === id);
    if (!hint || current(round).outcome || known(round, id)) return { ok: false, message: 'Dette hintet er alt kjent.' };
    if (stock(round, id) === 0) return { ok: false, status: 'stock', price: 0, message: 'Dette hintet er utselt for heile runden.' };
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
    if (!canGuess(round)) return { ok: false, status: 'closed', price: 0, message: 'Du kan ikkje tippe meir i denne runden.' };
    const answer = normalize(value);
    if (!answer) return { ok: false, status: 'empty', price: 0, message: 'Skriv eit ord før du prøver. Ingen myntar brukte.' };
    if (answer.length > 64) return { ok: false, status: 'long', price: 0, message: 'Svaret kan ha høgst 64 teikn. Ingen myntar brukte.' };
    const fingerprint = guessKey(answer);
    if (question.guesses.has(fingerprint)) return { ok: false, status: 'repeat', price: 0, message: 'Du har prøvd dette svaret før. Ingen nye myntar brukte.' };
    // Rette svar er gratis, også når potten er tom. Fyrste feil utan dekning avsluttar runden.
    if ([question.word.answer, ...question.word.alternatives].some(form => normalize(form) === answer)) {
      question.outcome = 'solved';
      return { ok: true, status: 'solved', price: 0, message: `Rett! Du fann «${question.word.answer}» med ${question.cost} ${question.cost === 1 ? 'mynt' : 'myntar'}.` };
    }
    const remaining = summary(round).remaining, price = Math.min(2, remaining);
    question.guesses.add(fingerprint); question.wrongGuesses.push(answer); question.cost += price;
    if (remaining < 2) {
      question.lastChanceMiss = fingerprint;
      round.questions.forEach(item => { if (!item.outcome) item.outcome = 'revealed'; });
      return { ok: false, status: 'lastWrong', price, message: 'Siste tipset var feil. Runden er over.' };
    }
    return { ok: false, status: 'wrong', price: 2, message: 'Det var ikkje ordet. Du brukte 2 myntar.' };
  }
  function reveal(round) {
    const question = current(round);
    if (!question.outcome) question.outcome = 'revealed';
    return { ok: true, status: 'revealed', price: 0, message: `Fasiten er «${question.word.answer}». Ordet blir registrert som uløyst.` };
  }
  function advance(round) {
    if (summary(round).complete || !current(round).outcome || round.index >= round.questions.length - 1) return false;
    round.index++; return true;
  }
  function pack(round) {
    return { version: 4, index: round.index, questions: round.questions.map(question => ({
      wordId: question.word.id, outcome: question.outcome, guesses: [...question.guesses],
      wrongGuesses: [...question.wrongGuesses], lastChanceMiss: question.lastChanceMiss,
      purchases: question.purchases.map(purchase => ({ id: purchase.id, position: purchase.position }))
    })) };
  }
  function restore(words, saved, random) {
    try {
      if (![2, 3, 4].includes(saved?.version) || saved.questions?.length !== words.length || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= words.length) return null;
      const round = createRound(words, random);
      const terminal = saved.version === 4 ? saved.questions.findIndex(entry => entry.lastChanceMiss != null) : -1;
      if (terminal >= 0 && (terminal !== saved.index || saved.questions.filter(entry => entry.lastChanceMiss != null).length !== 1)) return null;
      saved.questions.forEach((entry, index) => {
        const finalMiss = index === terminal;
        if (entry.wordId !== words[index].id || ![null, 'solved', 'revealed'].includes(entry.outcome) || !Array.isArray(entry.guesses) || entry.guesses.length > BUDGET / 2 + (finalMiss ? 1 : 0) || !Array.isArray(entry.purchases) || entry.purchases.length > 30) throw new Error('Ugyldig dagsrunde');
        if (index < saved.index && !entry.outcome || index > saved.index &&
            (entry.outcome !== (terminal >= 0 ? 'revealed' : null) || entry.guesses.length || entry.purchases.length)) throw new Error('Ugyldig rekkjefølgje');
        round.index = index;
        entry.purchases.forEach(purchase => { if (!buyHint(round, purchase.id, purchase.position).ok) throw new Error('Ugyldig hintkjøp'); });
        if (entry.guesses.some(value => typeof value !== 'string' || !/^[a-f0-9]{16}$/.test(value))) throw new Error('Ugyldig svaravtrykk');
        current(round).guesses = new Set(entry.guesses);
        if (current(round).guesses.size !== entry.guesses.length) throw new Error('Duplikat av feilforsøk');
        if (saved.version >= 3) {
          if (!Array.isArray(entry.wrongGuesses) || entry.wrongGuesses.length > entry.guesses.length ||
              entry.wrongGuesses.some(value => typeof value !== 'string' || !value || value.length > 64 || normalize(value) !== value || !current(round).guesses.has(guessKey(value))) ||
              new Set(entry.wrongGuesses).size !== entry.wrongGuesses.length) throw new Error('Ugyldige feilforsøk');
          current(round).wrongGuesses = [...entry.wrongGuesses];
        }
        current(round).cost += (current(round).guesses.size - (finalMiss ? 1 : 0)) * 2;
        if (summary(round).remaining < 0) throw new Error('Ugyldig myntbruk');
        if (finalMiss) {
          if (summary(round).remaining >= 2 || entry.outcome !== 'revealed' || !entry.guesses.length ||
              entry.lastChanceMiss !== entry.guesses.at(-1) || !current(round).wrongGuesses.length ||
              guessKey(current(round).wrongGuesses.at(-1)) !== entry.lastChanceMiss) throw new Error('Ugyldig siste sjanse');
          current(round).cost += summary(round).remaining;
          current(round).lastChanceMiss = entry.lastChanceMiss;
        }
        current(round).outcome = entry.outcome;
      });
      round.index = saved.index; return round;
    } catch (error) { return null; }
  }
  return Object.freeze({ BUDGET, MAX_POSITION, HINTS, POS, normalize, createRound, current, stock, known, available, buyHint, guess, reveal, advance, summary, lastChanceFailed, canGuess, pack, restore });
})();
