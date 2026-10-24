/* Oppsett, avgrensa dagsframgang og resultat. Aldri namn eller innskriven svartekst. */
window.OrdvettStorage = (function () {
  'use strict';
  function load() {
    const raw = VyrdepilStorage.getGameState('ordvett');
    const settings = { level: 'lett', mode: 'daily', setIndex: 0, archiveDate: null };
    const records = Object.create(null);
    const daily = Object.create(null);
    if (raw && [1, 2, 3].includes(raw.version)) {
      if (['lett', 'utfordring'].includes(raw.settings?.level)) settings.level = raw.settings.level;
      if (['daily', 'archive'].includes(raw.settings?.mode)) settings.mode = raw.settings.mode;
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw.settings?.archiveDate || '')) settings.archiveDate = raw.settings.archiveDate;
      if (Number.isInteger(raw.settings?.setIndex) && raw.settings.setIndex >= 0 && raw.settings.setIndex < 20) settings.setIndex = raw.settings.setIndex;
      if (raw.records && typeof raw.records === 'object' && !Array.isArray(raw.records)) {
        Object.entries(raw.records).slice(-40).forEach(([key, value]) => {
          if (/^[\w.-]{1,100}$/.test(key) && Number.isInteger(value?.solved) && value.solved >= 0 && value.solved <= 5 &&
              Number.isSafeInteger(value.cost) && value.cost >= 0) records[key] = { solved: value.solved, cost: value.cost };
        });
      }
      if (raw.version >= 2 && raw.daily && typeof raw.daily === 'object') {
        Object.entries(raw.daily).slice(-40).forEach(([key, value]) => {
          if (/^[\w.-]{1,100}$/.test(key) && [1, 2].includes(value?.version) && Array.isArray(value.questions) && value.questions.length === 5) daily[key] = value;
        });
      }
    }
    return { app: 'ordvett', version: 3, settings, records, daily };
  }
  let data = load();
  function save() { VyrdepilStorage.setGameState('ordvett', data); }
  function getSettings() { return { ...data.settings }; }
  function setSettings(settings) {
    if (!['lett', 'utfordring'].includes(settings.level)) return;
    data = load();
    data.settings = { level: settings.level, mode: settings.mode === 'archive' ? 'archive' : 'daily', setIndex: 0,
      archiveDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.archiveDate || '') ? settings.archiveDate : null };
    save();
  }
  function getRecord(key) { return Object.hasOwn(data.records, key) ? { ...data.records[key] } : null; }
  function better(result, record) { return !record || result.solved > record.solved || result.solved === record.solved && result.cost < record.cost; }
  function recordResult(key, result) {
    if (!result.complete) return false;
    const isBest = better(result, getRecord(key));
    if (isBest) {
      data.records[key] = { solved: result.solved, cost: result.cost };
      data.records = Object.fromEntries(Object.entries(data.records).slice(-40));
      save();
    }
    return isBest;
  }
  function getDaily(key) {
    data = load();
    if (Object.hasOwn(data.daily, key)) return JSON.parse(JSON.stringify(data.daily[key]));
    // Regel 4 utvidar potten frå 30 til 40, med uendra hintprisar. Hald fram i ein påbyrja runde.
    const old = data.daily[key.replace('-r4-d', '-r3-d')];
    return old && !old.questions.every(question => question.outcome) ? JSON.parse(JSON.stringify(old)) : null;
  }
  function saveDaily(key, snapshot, result) {
    data = load();
    if (data.daily[key]?.questions.every(question => question.outcome)) return;
    data.daily[key] = snapshot;
    data.daily = Object.fromEntries(Object.entries(data.daily).slice(-40));
    if (!result.complete || !recordResult(key, result)) save();
  }
  function clearDaily(key) { data = load(); delete data.daily[key]; save(); }
  function dayStatuses(keys) {
    data = load();
    return Object.fromEntries(keys.map(key => [key, data.daily[key] ?
      data.daily[key].questions.every(question => question.outcome) ? 'complete' : 'started' : data.records[key] ? 'complete' : null]));
  }
  return Object.freeze({ getSettings, setSettings, getRecord, recordResult, getDaily, saveDaily, clearDaily, dayStatuses });
})();
