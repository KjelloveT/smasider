/* Ordskodde — storage layer (wraps VyrdepilStorage)
 * Lagrar all state under VyrdepilStorage.ordskodde.state = {
 *   clouds: [ {app:'ordskodde', version:1, id, title, text,
 *              disabledWords:[], enabledStopwords:[], settings:{}, created, updated} ],
 *   lastCloud: 'cloud_id' | null
 * }
 * Rå tekst + ord-delta (ikkje frekvenslister) gjer skyene re-analyserbare.
 */
(function (root) {
  'use strict';

  const GAME = 'ordskodde';

  function defaultState() {
    return { clouds: [], lastCloud: null };
  }

  function readState() {
    const s = VyrdepilStorage.getGameState(GAME);
    if (!s || typeof s !== 'object') return defaultState();
    return {
      clouds: Array.isArray(s.clouds) ? s.clouds : [],
      lastCloud: s.lastCloud || null
    };
  }

  function writeState(state) {
    VyrdepilStorage.setGameState(GAME, state);
  }

  function newId() {
    return 'cloud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ---- Sky-CRUD ----

  function getClouds() {
    return readState().clouds;
  }

  function getCloud(id) {
    return readState().clouds.find(c => c.id === id) || null;
  }

  function newCloudObject(partial) {
    const now = new Date().toISOString();
    return Object.assign({
      app: 'ordskodde',
      version: 1,
      id: newId(),
      title: 'Ny ordsky',
      text: '',
      disabledWords: [],
      enabledStopwords: [],
      settings: OrdskoddeThemes.settingsFromTheme('klassisk'),
      created: now,
      updated: now
    }, partial || {});
  }

  function saveCloud(cloud) {
    const state = readState();
    cloud.updated = new Date().toISOString();
    if (!cloud.app) cloud.app = 'ordskodde';
    if (!cloud.version) cloud.version = 1;
    if (!cloud.id) cloud.id = newId();
    if (!cloud.created) cloud.created = cloud.updated;
    const idx = state.clouds.findIndex(c => c.id === cloud.id);
    if (idx >= 0) state.clouds[idx] = cloud;
    else state.clouds.push(cloud);
    writeState(state);
    return cloud;
  }

  function deleteCloud(id) {
    const state = readState();
    state.clouds = state.clouds.filter(c => c.id !== id);
    if (state.lastCloud === id) state.lastCloud = null;
    writeState(state);
  }

  function duplicateCloud(id) {
    const orig = getCloud(id);
    if (!orig) return null;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = newId();
    copy.title = orig.title + ' (kopi)';
    const now = new Date().toISOString();
    copy.created = now;
    copy.updated = now;
    return saveCloud(copy);
  }

  function setLastCloud(id) {
    const state = readState();
    state.lastCloud = id;
    writeState(state);
  }

  function getLastCloud() {
    return readState().lastCloud;
  }

  // ---- Import/eksport (AGENTS §5.2: app + version på toppnivå) ----

  /** Validerer eit importert objekt. Returnerer feilmelding (nynorsk) eller null. */
  function validateImport(obj) {
    if (!obj || typeof obj !== 'object') return 'Fila inneheld ikkje eit gyldig JSON-objekt.';
    if (obj.app !== 'ordskodde') return 'Fila ser ikkje ut til å vere frå Ordskodde (manglar app: "ordskodde").';
    if (obj.version !== 1) return 'Fila har ein ukjend versjon (' + obj.version + ').';
    if (typeof obj.text !== 'string' || !obj.text.trim()) return 'Fila manglar tekstinnhald.';
    if (typeof obj.title !== 'string') return 'Fila manglar tittel.';
    if (obj.settings && typeof obj.settings !== 'object') return 'Innstillingane i fila er ugyldige.';
    return null;
  }

  function importCloud(obj) {
    const err = validateImport(obj);
    if (err) return { error: err };
    const cloud = newCloudObject({
      title: obj.title || 'Importert ordsky',
      text: obj.text,
      disabledWords: Array.isArray(obj.disabledWords) ? obj.disabledWords.filter(w => typeof w === 'string') : [],
      enabledStopwords: Array.isArray(obj.enabledStopwords) ? obj.enabledStopwords.filter(w => typeof w === 'string') : [],
      settings: Object.assign(OrdskoddeThemes.settingsFromTheme('klassisk'), obj.settings || {})
    });
    return { cloud: saveCloud(cloud) };
  }

  root.OrdskoddeStorage = {
    GAME,
    readState,
    writeState,
    getClouds,
    getCloud,
    newCloudObject,
    saveCloud,
    deleteCloud,
    duplicateCloud,
    setLastCloud,
    getLastCloud,
    validateImport,
    importCloud
  };
})(window);
