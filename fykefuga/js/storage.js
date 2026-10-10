(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function read() {
    const raw = VyrdepilStorage.getGameState('fykefuga') || {};
    const state = {
    app: 'fykefuga', version: 1,
    packs: Array.isArray(raw.packs) ? raw.packs : [],
    settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : {},
    records: raw.records && typeof raw.records === 'object' ? raw.records : {},
    results: Array.isArray(raw.results) ? raw.results.slice(-100) : [],
    progress: { correct: 0, levels: [], modes: [], ...(raw.progress || {}) }
  };
  state.progress.correct = Number.isFinite(state.progress.correct) ? Math.max(0, state.progress.correct) : 0;
  state.progress.levels = Array.isArray(state.progress.levels) ? state.progress.levels.filter(id => F.levels.some(level => level.id === id)) : [];
  state.progress.modes = Array.isArray(state.progress.modes) ? state.progress.modes.filter(id => F.modes.some(mode => mode.id === id)) : [];
    return state;
  }
  let state = read();
  const fresh = () => { state = read(); };
  const write = () => VyrdepilStorage.setGameState('fykefuga', state);
  function list() {
    fresh();
    return F.builtins.concat(state.packs).map(pack => {
      try { return F.Questions.normalizePack(pack); } catch (_) { return null; }
    }).filter(Boolean);
  }
  function save(pack) {
    fresh();
    const normalized = F.Questions.normalizePack(pack);
    const index = state.packs.findIndex(item => item.id === normalized.id);
    if (index < 0) state.packs.push(normalized); else state.packs[index] = normalized;
    write(); return normalized;
  }
  function remove(id) { fresh(); state.packs = state.packs.filter(pack => pack.id !== id); write(); }
  function key(pack, config) { return [F.Questions.revision(pack), config.level, config.reading, config.difficulty].join('|'); }
  function record(pack, config, run) {
    fresh();
    const id = key(pack, config), previous = state.records[id] || 0;
    const score = run.correct;
    state.records[id] = Math.max(previous, score);
    const keys = Object.keys(state.records);
    keys.slice(0, Math.max(0, keys.length - 200)).forEach(old => { delete state.records[old]; });
    state.results.push({ setId: pack.id, setTitle: pack.title, level: config.level, reading: config.reading, difficulty: config.difficulty, correct: score, seconds: Math.round(run.time), completed: run.status === 'complete' });
    state.results = state.results.slice(-100); write();
    return { best: state.records[id], newRecord: score > previous };
  }
  function progress(event, config) {
    fresh();
    const p = state.progress;
    if (event.type === 'answer') p.correct++;
    if (event.type === 'answer' || event.type === 'complete') {
      const mode = event.mode || config.mode;
      if (mode && !p.modes.includes(mode)) p.modes.push(mode);
    }
    if (event.type === 'complete' && !event.tutorial && !p.levels.includes(config.level)) p.levels.push(config.level);
    const badges = [];
    if (p.levels.length) badges.push('fyrste-bane');
    if (p.levels.length === 4) badges.push('alle-banene');
    if (p.modes.length === 8) badges.push('alle-modusane');
    if (event.type === 'answer' && config.level === 'endless' && event.correct >= 25) badges.push('tjuefem-vegval');
    VyrdepilStorage.updateBragdProgress('fykefuga', { correct: p.correct, levels: p.levels.length, modes: p.modes.length });
    if (root.VyrdepilBragd) VyrdepilBragd.announceBadges('fykefuga', badges);
    else badges.forEach(id => VyrdepilStorage.recordBadge('fykefuga', id));
    write();
  }
  const unlocked = skin => { fresh(); return skin === 'gold' || skin === 'porcelain' && state.progress.levels.length > 0 || skin === 'copper' && state.progress.correct >= 100; };
  F.Storage = { list, save, remove, key, record, progress, unlocked,
    settings: () => { fresh(); return { ...state.settings }; },
    saveSettings(settings) { fresh(); state.settings = { ...settings }; write(); },
    best: (pack, config) => { fresh(); return state.records[key(pack, config)] || 0; },
    progressData: () => { fresh(); return { ...state.progress }; },
    earned: () => VyrdepilStorage.getBragdData().badges.fykefuga || [],
    ordaklok: () => (VyrdepilStorage.getGameState('ordaklok') || {}).lists || []
  };
})(window);
