/* Første møte med spelet: ingen ny lagringsnøkkel eller eigne sporingsfelt. */
window.OrdvettWelcome = (function () {
  'use strict';
  function init(onTutorial) {
    const dialog = OrdvettView.byId('welcomeDialog');
    const close = () => Vy.closeModal(dialog);
    OrdvettView.byId('welcomeClose').addEventListener('click', close);
    OrdvettView.byId('welcomePlay').addEventListener('click', () => {
      close(); document.querySelector('[data-level]')?.focus();
    });
    OrdvettView.byId('welcomeTutorial').addEventListener('click', () => { close(); onTutorial(); });
    if (!OrdvettStorage.hasHistory()) {
      OrdvettView.progress(null, OrdvettView.byId('welcomeProgress'));
      Vy.openModal(dialog);
    }
  }
  return Object.freeze({ init });
})();
