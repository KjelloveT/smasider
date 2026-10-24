/* Berre oppsett og avgrensa rekordar. Aldri namn, innskrivne svar eller pågåande spel. */
window.OrdvettStorage = (function () {
  'use strict';
  function load() {
    const raw = VyrdepilStorage.getGameState('ordvett');
    const settings = { level: 'lett', setIndex: 0 };
    const records = Object.create(null);
    if (raw && raw.version === 1) {
      if (['lett', 'utfordring'].includes(raw.settings?.level)) settings.level = raw.settings.level;
      if (Number.isInteger(raw.settings?.setIndex) && raw.settings.setIndex >= 0 && raw.settings.setIndex < 20) settings.setIndex = raw.settings.setIndex;
      if (raw.records && typeof raw.records === 'object' && !Array.isArray(raw.records)) {
        Object.entries(raw.records).slice(-40).forEach(([key, value]) => {
          if (/^[\w.-]{1,100}$/.test(key) && Number.isInteger(value?.solved) && value.solved >= 0 && value.solved <= 5 &&
              Number.isSafeInteger(value.cost) && value.cost >= 0) records[key] = { solved: value.solved, cost: value.cost };
        });
      }
    }
    return { app: 'ordvett', version: 1, settings, records };
  }
  let data = load();
  function save() { VyrdepilStorage.setGameState('ordvett', data); }
  function getSettings() { return { ...data.settings }; }
  function setSettings(settings) {
    if (!['lett', 'utfordring'].includes(settings.level) || !Number.isInteger(settings.setIndex) || settings.setIndex < 0 || settings.setIndex >= 20) return;
    data.settings = { ...settings };
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
  return Object.freeze({ getSettings, setSettings, getRecord, recordResult });
})();
