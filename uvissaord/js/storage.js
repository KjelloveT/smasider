/* Dagsframgang og feilforsøk blir berre lagra lokalt gjennom felles lagrings-API. */
window.OrdvettStorage = (function () {
  'use strict';
  function load() {
    const raw = VyrdepilStorage.getGameState('ordvett');
    const settings = { level: 'lett', mode: 'daily', setIndex: 0, archiveDate: null };
    const records = Object.create(null);
    const daily = Object.create(null);
    if (raw && [1, 2, 3, 4, 5].includes(raw.version)) {
      if (['lett', 'middels', 'krokut'].includes(raw.settings?.level)) settings.level = raw.settings.level;
      if (raw.settings?.level === 'utfordring') settings.level = 'middels';
      if (['daily', 'archive'].includes(raw.settings?.mode)) settings.mode = raw.settings.mode;
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw.settings?.archiveDate || '')) settings.archiveDate = raw.settings.archiveDate;
      if (Number.isInteger(raw.settings?.setIndex) && raw.settings.setIndex >= 0 && raw.settings.setIndex < 20) settings.setIndex = raw.settings.setIndex;
      if (raw.records && typeof raw.records === 'object' && !Array.isArray(raw.records)) {
        Object.entries(raw.records).slice(-900).forEach(([key, value]) => {
          if (/^[\w.-]{1,100}$/.test(key) && Number.isInteger(value?.solved) && value.solved >= 0 && value.solved <= 5 &&
              Number.isSafeInteger(value.cost) && value.cost >= 0) records[key] = { solved: value.solved, cost: value.cost };
        });
      }
      if (raw.version >= 2 && raw.daily && typeof raw.daily === 'object') {
        Object.entries(raw.daily).slice(-900).forEach(([key, value]) => {
          if (/^[\w.-]{1,100}$/.test(key) && [1, 2, 3, 4].includes(value?.version) && Array.isArray(value.questions) && value.questions.length === 5 &&
              value.questions.every(question => question && typeof question === 'object' && [null, 'solved', 'revealed'].includes(question.outcome))) daily[key] = value;
        });
      }
    }
    return { app: 'ordvett', version: 5, settings, records, daily };
  }
  let data = load();
  function save() { VyrdepilStorage.setGameState('ordvett', data); }
  function getSettings() { return { ...data.settings }; }
  function setSettings(settings) {
    if (!['lett', 'middels', 'krokut'].includes(settings.level)) return;
    data = load();
    data.settings = { level: settings.level, mode: settings.mode === 'archive' ? 'archive' : 'daily', setIndex: 0,
      archiveDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.archiveDate || '') ? settings.archiveDate : null };
    save();
  }
  const previousKey = key => key.replace('-r6-d', '-r5-d');
  function dailyFor(key) {
    const previous = previousKey(key);
    return (Object.hasOwn(data.daily, key) ? data.daily[key] : null) || (Object.hasOwn(data.daily, previous) ? data.daily[previous] : null);
  }
  function getRecord(key) {
    const previous = previousKey(key);
    const record = (Object.hasOwn(data.records, key) ? data.records[key] : null) || (Object.hasOwn(data.records, previous) ? data.records[previous] : null);
    return record ? { ...record } : null;
  }
  function better(result, record) { return !record || result.solved > record.solved || result.solved === record.solved && result.cost < record.cost; }
  function recordResult(key, result) {
    if (!result.complete) return false;
    const isBest = better(result, getRecord(key));
    if (isBest) {
      data.records[key] = { solved: result.solved, cost: result.cost };
      data.records = Object.fromEntries(Object.entries(data.records).slice(-900));
      save();
    }
    return isBest;
  }
  function getDaily(key) {
    data = load();
    // Regel 6 har same ord og prisar som regel 5. Hald fram utan å endre kjelda.
    const saved = dailyFor(key);
    return saved ? JSON.parse(JSON.stringify(saved)) : null;
  }
  function saveDaily(key, snapshot, result) {
    data = load();
    if (dailyFor(key)?.questions.every(question => question.outcome)) return;
    data.daily[key] = snapshot;
    data.daily = Object.fromEntries(Object.entries(data.daily).slice(-900));
    if (!result.complete || !recordResult(key, result)) save();
  }
  function clearDaily(key) { data = load(); delete data.daily[key]; save(); }
  function dayStatuses(keys) {
    data = load();
    return Object.fromEntries(keys.map(key => { const saved = dailyFor(key); return [key, saved ?
      saved.questions.every(question => question.outcome) ? 'complete' : 'started' : getRecord(key) ? 'complete' : null]; }));
  }
  function hasHistory() { data = load(); return Object.keys(data.daily).length > 0 || Object.keys(data.records).length > 0; }
  return Object.freeze({ getSettings, setSettings, getRecord, recordResult, getDaily, saveDaily, clearDaily, dayStatuses, hasHistory });
})();
