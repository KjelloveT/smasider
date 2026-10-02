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
    } catch (e) {
      document.getElementById('bootError').hidden = false;
      console.error('Livslina: klarte ikkje laste datafiler', e);
      return;
    }
    LL.uiSetup.init();
    LL.uiHome.init();
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

  document.addEventListener('DOMContentLoaded', boot);

  return { showScreen, enterHome, openModal, closeModal, closeAllModals, toast };
})();
