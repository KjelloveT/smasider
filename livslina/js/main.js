/* Livslina — main.js
 * Oppstart, skjermbyte, modal-/toast-hjelparar og wiring.
 */
window.LL = window.LL || {};

LL.main = (function () {
  'use strict';

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) { el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); }
    if (window.VyrdepilAppShell && typeof window.VyrdepilAppShell.setGameActive === 'function') {
      window.VyrdepilAppShell.setGameActive(id !== 'screen-start' && id !== 'screen-setup');
    }
  }

  function enterHome() {
    LL.uiHome.render();
    showScreen('screen-home');
  }

  // ── Modal ──
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    Vy.openModal(overlay);
  }
  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    Vy.closeModal(overlay);
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.open').forEach(o => {
      if (o.classList.contains('modal-locked')) return; // t.d. hendingskort krev val
      Vy.closeModal(o);
    });
  }

  // ── Toast ── sjå Vy.toast() i js/vyrdepil-util.js
  function toast(msg) {
    return Vy.toast(msg, { ms: 3000 });
  }

  async function boot() {
    try {
      await LL.data.loadAll();
      const ready = await LL.artCharacter.whenReady;
      if (!ready) throw new Error(LL.artCharacter.ready() ? 'Karakterteikningane kunne ikkje klargjerast.' : 'Karakterteikningane kunne ikkje lastast.');
    } catch (e) {
      const error = document.getElementById('bootError');
      error.textContent = 'Klarte ikkje laste Livslina. Sjekk at du opnar sida via ein tenar. ' + e.message;
      error.hidden = false;
      document.getElementById('bootStatus').hidden = true;
      console.error('Livslina: klarte ikkje laste spelressursar', e);
      return;
    }
    document.getElementById('bootStatus').hidden = true;
    ['btnNewGame', 'btnImport', 'btnInfo'].forEach(id => { document.getElementById(id).disabled = false; });
    const continueButton = document.getElementById('startContinue');
    if (continueButton) continueButton.disabled = false;
    LL.uiSetup.init();
    LL.uiHome.init();
    if (LL.uiRoom && LL.uiRoom.init) LL.uiRoom.init();
    if (LL.uiSummer && LL.uiSummer.init) LL.uiSummer.init();
    if (LL.uiBudget && LL.uiBudget.init) LL.uiBudget.init();
    if (LL.uiPlayback && LL.uiPlayback.init) LL.uiPlayback.init();
    if (LL.uiReport && LL.uiReport.init) LL.uiReport.init();
    LL.uiSetup.renderStart();

    // Modal-lukking gjennom felles Vy-dialoghandtering.
    document.querySelectorAll('[data-close-modal]').forEach(b => {
      b.addEventListener('click', () => closeModal(b.getAttribute('data-close-modal')));
    });

    LL.util.hydrate(document);
  }

  window.addEventListener('livslina:character-art-progress', event => {
    const status = document.getElementById('bootStatus');
    if (status) status.textContent = 'Lastar figurressursar … ' + event.detail.loaded + ' av ' + event.detail.total;
  });

  document.addEventListener('DOMContentLoaded', boot);

  return { showScreen, enterHome, openModal, closeModal, closeAllModals, toast };
})();
