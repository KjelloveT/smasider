/* Avgrensa øvingsobservasjonar. Gamle tre og bragder er historikk;
   nye handlingar blir haldne frå kvarandre og er ingen lesetest. */
(function (root) {
  'use strict';
  const SKILLS = {
    listen: 'Lyd til bokstav', sound: 'Bokstav til lyd', first: 'Fyrste lyd',
    blend: 'Setje lydar saman', build: 'Byggje ord', read: 'Les sjølv',
    recognise: 'Kjenne att ord og setningar', hunt: 'Bokstavjakt med rørsle'
  };
  const PILOT = ['lam', 'sal', 'mas', 'ras', 'ler', 'mel', 'sel', 'is', 'ti',
    'min', 'til', 'vil', 'kan', 'kam', 'tak', 'salt', 'nase', 'vase', 'kake', 'vise'];
  const EXTRA = [
    { text: 'arm', kind: 'new' }, { text: 'les', kind: 'new' }, { text: 'mal', kind: 'new' },
    { text: 'mep', kind: 'nonword' }, { text: 'fep', kind: 'nonword' }
  ];
  function blank() { return { version: 1, session: 0, items: {} }; }
  function count(value) { return Math.min(100000, Math.max(0, Math.floor(Number(value) || 0))); }
  function hydrate(raw) {
    const out = blank();
    if (!raw || typeof raw !== 'object') return out;
    out.session = count(raw.session);
    Object.keys(raw.items || {}).slice(-400).forEach(function (key) {
      const parts = key.split(':');
      if (!SKILLS[parts[0]] || !/^[a-zæøå_]{1,40}$/.test(parts[1] || '') || parts.length !== 2) return;
      const v = raw.items[key] || {};
      out.items[key] = {
        attempts: count(v.attempts), independent: count(v.independent), helped: count(v.helped),
        wrong: count(v.wrong), later: count(v.later), adult: count(v.adult),
        lastSession: count(v.lastSession), lastIndependent: count(v.lastIndependent),
        last: ['right', 'help', 'wrong', 'practice'].includes(v.last) ? v.last : 'practice',
        introduced: v.introduced === true,
        kind: ['new', 'nonword'].includes(v.kind) ? v.kind : null
      };
    });
    return out;
  }
  function state(p) { if (!p.learning) p.learning = blank(); return p.learning; }
  function get(p, skill, target) { return state(p).items[skill + ':' + target]; }
  function ensure(p, skill, target) {
    const s = state(p), key = skill + ':' + target;
    if (!s.items[key]) {
      const keys = Object.keys(s.items);
      if (keys.length >= 400) delete s.items[keys[0]];
      s.items[key] = { attempts: 0, independent: 0, helped: 0, wrong: 0, later: 0,
        adult: 0, lastSession: 0, lastIndependent: 0, last: 'practice', introduced: false, kind: null };
    }
    return s.items[key];
  }
  function introduce(p, skill, target) { ensure(p, skill, target).introduced = true; }
  function record(p, skill, target, result) {
    if (!SKILLS[skill] || !/^[a-zæøå_]{1,40}$/.test(target)) return;
    const s = state(p), it = ensure(p, skill, target);
    if (['new', 'nonword'].includes(result.kind)) it.kind = result.kind;
    it.attempts = count(it.attempts + 1);
    const verified = skill !== 'read' || result.adult === true;
    const independent = result.correct === true && !result.helped && verified;
    if (independent) {
      if (it.independent && it.lastIndependent < s.session) it.later = count(it.later + 1);
      it.independent = count(it.independent + 1);
      it.lastIndependent = s.session;
      if (result.adult) it.adult = count(it.adult + 1);
    }
    if (result.helped) it.helped = count(it.helped + 1);
    if (result.correct === false) it.wrong = count(it.wrong + 1);
    it.last = result.helped ? 'help' : independent ? 'right' : result.correct === false ? 'wrong' : 'practice';
    it.lastSession = s.session;
  }
  function start(p) { const s = state(p); s.session = count(s.session + 1); }
  function known(p) {
    return LjodLetters.upTo(p.adaptive.step).filter(function (ch) {
      return p.adaptive.items[ch] && p.adaptive.items[ch].maxBox >= 2;
    });
  }
  function words(p, skill, last, review) {
    const letters = known(p);
    // Modellering gjer at ein ny spelar kan byrje med dei fyrste lydane.
    const allowed = letters.length >= 3 ? letters : LjodLetters.STEPS[0];
    let pool = PILOT.map(function (text) { return LjodWords.byText(text); }).filter(Boolean)
      .filter(function (w) { return w.letters.every(function (ch) { return allowed.includes(ch); }); });
    if (skill === 'read') EXTRA.forEach(function (entry) {
      if (entry.text.split('').every(function (ch) { return allowed.includes(ch); })) {
        pool.push({ text: entry.text, letters: entry.text.split(''), len: entry.text.length,
          sound: null, clean: true, kind: entry.kind });
      }
    });
    const practiced = Object.keys(state(p).items).filter(function (key) {
      return key.startsWith(skill + ':') && state(p).items[key].independent > 0;
    }).length;
    const max = practiced >= 4 ? 4 : 3;
    pool = Vy.shuffle(pool.filter(function (w) { return w.len <= max; }));
    pool.sort(function (a, b) {
      const x = get(p, skill, a.text), y = get(p, skill, b.text);
      const score = function (it, word) {
        return Number(word.text === last) * 100 +
          (it && it.independent ? (it.lastIndependent < state(p).session ? (review ? 0 : 1) : 4) : (review ? 1 : 0));
      };
      return score(x, a) - score(y, b);
    });
    return pool;
  }
  function rows(p) {
    return Object.keys(state(p).items).map(function (key) {
      const parts = key.split(':');
      return Object.assign({ skill: parts[0], label: SKILLS[parts[0]], target: parts[1] }, state(p).items[key]);
    }).filter(function (it) { return it.attempts > 0; })
      .sort(function (a, b) { return b.lastSession - a.lastSession; });
  }
  root.LjodLearning = { SKILLS: SKILLS, PILOT: PILOT, EXTRA: EXTRA, blank: blank,
    hydrate: hydrate, get: get, introduce: introduce, record: record, start: start,
    known: known, words: words, rows: rows };
})(window);
