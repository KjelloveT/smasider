/* Livslina — storage.js
 * Tynn wrapper rundt VyrdepilStorage (spel-nøkkel 'livslina') + eksport/import.
 */
window.LL = window.LL || {};

LL.storage = (function () {
  'use strict';

  const GAME = 'livslina';

  function saveActive(save) {
    VyrdepilStorage.setGameState(GAME, save);
  }
  function loadActive() {
    return VyrdepilStorage.getGameState(GAME);
  }
  function hasActive() {
    return VyrdepilStorage.hasGameState(GAME);
  }
  function clearActive() {
    VyrdepilStorage.clearGameState(GAME);
  }

  // Komprimert sluttrapport lagra på tvers av løp
  function saveCompletedRun(summary) {
    VyrdepilStorage.saveToHistory(GAME, summary);
  }
  function completedRuns() {
    return VyrdepilStorage.getHistory(GAME);
  }

  // ── Eksport / import ──
  function exportSave(save) {
    const stamp = new Date().toISOString().slice(0, 10);
    Vy.downloadJson(save, `livslina-${stamp}.json`);
  }

  function importSave(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) { reject(new Error('Lagringsfila er for stor. Grensa er 5 MB.')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          if (obj.app !== 'livslina') {
            reject(new Error('Fila er ikkje ei Livslina-lagring.'));
            return;
          }
          if (typeof obj.version !== 'number' || !obj.stats || !obj.character) {
            reject(new Error('Lagringsfila manglar naudsynte felt.'));
            return;
          }
          resolve(obj);
        } catch (e) {
          reject(new Error('Klarte ikkje lese fila som JSON.'));
        }
      };
      reader.onerror = () => reject(new Error('Klarte ikkje opne fila.'));
      reader.readAsText(file);
    });
  }

  return {
    saveActive, loadActive, hasActive, clearActive,
    saveCompletedRun, completedRuns,
    exportSave, importSave
  };
})();
