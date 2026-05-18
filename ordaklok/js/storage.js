/* Ordaklok — storage layer (wraps VyrdepilStorage)
 * Lagrar all state under VyrdepilStorage.ordaklok.state = {
 *   lists: [ {id, app:'ordaklok', version:1, title, labelA, labelB, description, pairs, created, updated} ],
 *   scores: { [listId]: { [mode]: { best, time, date } } },
 *   leitner: { [listId]: { [pairIdx]: { box: 1-5, due: epochMs } } },
 *   lastList: 'list_id' | null
 * }
 */
(function (root) {
  'use strict';

  const GAME = 'ordaklok';

  function defaultState() {
    return { lists: [], scores: {}, leitner: {}, lastList: null };
  }

  function readState() {
    const s = VyrdepilStorage.getGameState(GAME);
    if (!s || typeof s !== 'object') return defaultState();
    // Sørg for at alle felt finst
    return {
      lists: Array.isArray(s.lists) ? s.lists : [],
      scores: s.scores && typeof s.scores === 'object' ? s.scores : {},
      leitner: s.leitner && typeof s.leitner === 'object' ? s.leitner : {},
      lastList: s.lastList || null
    };
  }

  function writeState(state) {
    VyrdepilStorage.setGameState(GAME, state);
  }

  // ---- Liste-CRUD ----

  function getLists() {
    return readState().lists;
  }

  function getList(id) {
    return readState().lists.find(l => l.id === id) || null;
  }

  function newListObject(partial) {
    const now = new Date().toISOString();
    return Object.assign({
      app: 'ordaklok',
      version: 1,
      id: 'list_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title: 'Ny liste',
      labelA: 'Side A',
      labelB: 'Side B',
      description: '',
      pairs: [],
      created: now,
      updated: now
    }, partial || {});
  }

  function saveList(list) {
    const state = readState();
    list.updated = new Date().toISOString();
    if (!list.app) list.app = 'ordaklok';
    if (!list.version) list.version = 1;
    if (!list.id) list.id = 'list_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    if (!list.created) list.created = list.updated;
    const idx = state.lists.findIndex(l => l.id === list.id);
    if (idx >= 0) state.lists[idx] = list;
    else state.lists.push(list);
    writeState(state);
    return list;
  }

  function deleteList(id) {
    const state = readState();
    state.lists = state.lists.filter(l => l.id !== id);
    if (state.scores[id]) delete state.scores[id];
    if (state.leitner[id]) delete state.leitner[id];
    if (state.lastList === id) state.lastList = null;
    writeState(state);
  }

  function duplicateList(id) {
    const orig = getList(id);
    if (!orig) return null;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'list_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    copy.title = orig.title + ' (kopi)';
    const now = new Date().toISOString();
    copy.created = now;
    copy.updated = now;
    return saveList(copy);
  }

  function setLastList(id) {
    const state = readState();
    state.lastList = id;
    writeState(state);
  }

  function getLastList() {
    return readState().lastList;
  }

  // ---- Scores ----

  function getScore(listId, mode) {
    const state = readState();
    return state.scores[listId]?.[mode] || null;
  }

  function getScoresForList(listId) {
    return readState().scores[listId] || {};
  }

  function saveScore(listId, mode, entry) {
    const state = readState();
    if (!state.scores[listId]) state.scores[listId] = {};
    const prev = state.scores[listId][mode];
    const isBetter = !prev
      || (typeof entry.best === 'number' && entry.best > (prev.best || 0))
      || (typeof entry.best === 'number' && entry.best === prev.best && typeof entry.time === 'number' && entry.time < (prev.time || Infinity));
    if (isBetter) {
      state.scores[listId][mode] = Object.assign({}, entry, { date: new Date().toISOString() });
      writeState(state);
      return true;
    }
    return false;
  }

  // ---- Leitner ----

  function getLeitner(listId) {
    return readState().leitner[listId] || {};
  }

  function setLeitner(listId, leitnerData) {
    const state = readState();
    state.leitner[listId] = leitnerData;
    writeState(state);
  }

  function clearLeitner(listId) {
    const state = readState();
    delete state.leitner[listId];
    writeState(state);
  }

  // ---- Eksponer ----

  root.OrdaklokStorage = {
    GAME,
    readState,
    writeState,
    getLists,
    getList,
    newListObject,
    saveList,
    deleteList,
    duplicateList,
    setLastList,
    getLastList,
    getScore,
    getScoresForList,
    saveScore,
    getLeitner,
    setLeitner,
    clearLeitner
  };
})(window);
