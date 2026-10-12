(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const normalize = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('nn');
  const length = text => Array.from(text).length;
  function newPack() {
    return { app: 'fykefuga', version: 1, id: Vy.uuid(), title: '', questions: [], recommended: { level: 'marmor', reading: 4, difficulty: 0 } };
  }
  function normalizePack(input) {
    if (!input || typeof input !== 'object') throw new Error('Fila inneheld ikkje eit spørsmålsett.');
    if (input.app !== 'fykefuga' || input.version !== 1) throw new Error('Ukjent app eller filversjon.');
    if (!Array.isArray(input.questions) || input.questions.length > 500) throw new Error('Eit sett kan ha mellom 1 og 500 spørsmål.');
    const copy = newPack();
    copy.id = typeof input.id === 'string' && input.id.length <= 100 ? input.id : copy.id;
    copy.title = String(input.title || '').trim();
    if (copy.title.length > 100) throw new Error('Namnet på settet kan ha høgst 100 teikn.');
    const ids = new Set();
    copy.questions = input.questions.map(item => {
      if (!item || typeof item !== 'object') throw new Error('Ei spørsmålsrad er ugyldig.');
      if (typeof item.prompt !== 'string' || typeof item.correct !== 'string') throw new Error('Spørsmål og svar må vere tekst.');
      let id = typeof item.id === 'string' && item.id.length < 100 ? item.id : Vy.uuid();
      if (ids.has(id)) id = Vy.uuid();
      ids.add(id);
      if (item.wrong != null && !Array.isArray(item.wrong)) throw new Error('Feilalternativa må vere ei liste.');
      if (item.accepted != null && !Array.isArray(item.accepted)) throw new Error('Svarvariantane må vere ei liste.');
      if ((item.wrong || []).length > 30 || (item.accepted || []).length > 30) throw new Error('Ei rad kan ha høgst 30 feilalternativ og 30 godkjende variantar.');
      if ([...(item.wrong || []), ...(item.accepted || [])].some(value => typeof value !== 'string')) throw new Error('Alle svaralternativa må vere tekst.');
      return { id, prompt: String(item.prompt || '').trim(), correct: String(item.correct || '').trim(), accepted: (item.accepted || []).slice(0, 30).map(String), wrong: (item.wrong || []).slice(0, 30).map(String).map(x => x.trim()).filter(Boolean) };
    });
    const recommendation = input.recommended || {};
    copy.recommended = {
      level: F.levels.some(level => level.id === recommendation.level) || recommendation.level === 'endless' ? recommendation.level : 'marmor',
      reading: [2, 4, 6].includes(Number(recommendation.reading)) ? Number(recommendation.reading) : 4,
      difficulty: [0, 1, 2].includes(Number(recommendation.difficulty)) ? Number(recommendation.difficulty) : 0
    };
    return copy;
  }
  function acceptedFor(pack, item) {
    const answers = [item.correct].concat(item.accepted || []);
    pack.questions.filter(other => normalize(other.prompt) === normalize(item.prompt)).forEach(other => answers.push(other.correct, ...(other.accepted || [])));
    return new Set(answers.map(normalize));
  }
  function alternatives(pack, item) {
    const accepted = acceptedFor(pack, item);
    const pool = item.wrong.length ? item.wrong : pack.questions.map(other => other.correct);
    const seen = new Set();
    return pool.filter(answer => {
      const key = normalize(answer);
      if (!key || accepted.has(key) || seen.has(key) || length(answer) > 24) return false;
      seen.add(key); return true;
    });
  }
  function validate(pack) {
    const issues = [];
    if (!pack.title.trim()) issues.push({ row: 0, message: 'Gje settet eit namn.' });
    if (!pack.questions.length) issues.push({ row: 0, message: 'Legg inn minst eitt spørsmål.' });
    pack.questions.forEach((item, index) => {
      const add = message => issues.push({ row: index + 1, message });
      if (!item.prompt || !item.correct) add('Spørsmål og rett svar må fyllast ut.');
      if (length(item.prompt) > 60) add('Spørsmålet har meir enn 60 teikn. Kort det ned.');
      if (length(item.correct) > 24 || item.wrong.some(answer => length(answer) > 24) || item.accepted.some(answer => length(answer) > 24)) add('Eit svar har meir enn 24 teikn. Kort det ned.');
      const duplicates = pack.questions.filter(other => normalize(other.prompt) === normalize(item.prompt) && normalize(other.correct) !== normalize(item.correct));
      if (duplicates.length) add('Same spørsmål har fleire ulike fasitar. Gjer spørsmålet meir presist.');
      if (item.wrong.some(answer => acceptedFor(pack, item).has(normalize(answer)))) add('Eit feilalternativ er òg eit godkjent svar.');
      if (item.correct && !alternatives(pack, item).length) add('Manglar eit eintydig feilalternativ. Skriv inn eitt, eller legg til fleire ordpar.');
    });
    return issues;
  }
  function parsePairs(text) {
    if (!text.trim()) throw new Error('Lim inn minst eitt ordpar.');
    return text.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
      const cells = line.split('\t');
      if (cells.length !== 2) throw new Error('Rad ' + (index + 1) + ': lim inn nøyaktig to kolonnar med tabulator mellom.');
      return { id: Vy.uuid(), prompt: cells[0].trim(), correct: cells[1].trim(), accepted: [], wrong: [] };
    });
  }
  function fromOrdaklok(list) {
    if (!list || (list.app && list.app !== 'ordaklok') || !Array.isArray(list.pairs) || list.pairs.length > 500) throw new Error('Dette er ikkje ei gyldig Ordaklok-liste.');
    if (list.version != null && list.version !== 1) throw new Error('Denne Ordaklok-versjonen er ikkje støtta.');
    const result = newPack();
    result.title = String(list.title || 'Frå Ordaklok');
    result.questions = list.pairs.map(pair => {
      if (!pair || typeof pair.a !== 'string' || typeof pair.b !== 'string' || pair.alts != null && !Array.isArray(pair.alts)) throw new Error('Ordaklok-lista har ei ugyldig rad.');
      return { id: Vy.uuid(), prompt: pair.a, correct: pair.b, accepted: pair.alts || [], wrong: [] };
    });
    return normalizePack(result);
  }
  function sequence(pack, seed, offset) {
    const indices = Vy.shuffle(pack.questions.map((_, index) => index), Vy.rng(seed));
    const start = offset || 0;
    return index => pack.questions[indices[(index + start) % indices.length]];
  }
  function choice(pack, item, random) {
    const options = alternatives(pack, item);
    const wrong = options[Math.floor(random() * options.length)];
    const correctSide = random() < 0.5 ? 'upper' : 'lower';
    return { item, correctSide, upper: correctSide === 'upper' ? item.correct : wrong, lower: correctSide === 'lower' ? item.correct : wrong };
  }
  function revision(pack) {
    const text = JSON.stringify(pack.questions.map(item => [item.prompt, item.correct, item.accepted, item.wrong]));
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return pack.id + ':' + (hash >>> 0).toString(16);
  }
  F.Questions = { newPack, normalizePack, validate, parsePairs, fromOrdaklok, alternatives, sequence, choice, revision, normalize };
})(window);
