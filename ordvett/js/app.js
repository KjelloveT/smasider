(function () {
  'use strict';
  const Game = OrdvettGame, View = OrdvettView, Storage = OrdvettStorage;
  const Schedule = OrdvettSchedule, Effects = OrdvettEffects;
  const settings = Storage.getSettings();
  let descriptor, round = null, chooseMode = false;
  function savedRound() {
    if (descriptor.mode !== 'daily') return null;
    const snapshot = Storage.getDaily(descriptor.key);
    if (!snapshot) return null;
    const restored = Game.restore(descriptor.words, snapshot, Vy.rng(descriptor.seed));
    if (!restored) Storage.clearDaily(descriptor.key);
    return restored;
  }
  function persist() {
    if (round && descriptor.mode === 'daily') Storage.saveDaily(descriptor.key, Game.pack(round), Game.summary(round));
  }
  function setup(focus) {
    Effects.clear(); chooseMode = false; round = null;
    descriptor = settings.mode === 'daily' ? Schedule.daily(settings.level) : Schedule.practice(settings.level);
    View.setup(settings, descriptor, savedRound());
    View.feedback(null);
    View.show('setup', focus ? 'setupTitle' : null);
  }
  function transact(action, origin) {
    const bounds = origin?.getBoundingClientRect();
    const before = Game.summary(round).cost;
    const result = action();
    chooseMode = false;
    persist(); update(result); View.feedback(result);
    if (result.price > 0) Effects.spend(bounds, result.price, before, Game.summary(round).cost);
    return result;
  }
  function update(change) {
    View.question(round, chooseMode, {
      hint(id, button) {
        if (id === 'chosen') {
          chooseMode = true; update();
          View.byId('position').select(); return;
        }
        transact(() => Game.buyHint(round, id), button);
        View.byId('purchasedHints').lastElementChild?.focus();
      },
    }, change);
  }
  function start() {
    // Eit ferdig dagssett opnar resultatet. Ei øving trekkjer alltid fem nye ord.
    if (settings.mode === 'daily' && descriptor.date !== Schedule.dateKey()) descriptor = Schedule.daily(settings.level);
    round = savedRound() || Game.createRound(descriptor.words, Vy.rng(descriptor.seed));
    chooseMode = false;
    if (Game.summary(round).complete) { View.results(round, descriptor); return; }
    persist(); View.byId('answer').value = ''; View.feedback(null);
    update(); View.show('game', 'gameTitle');
  }
  document.querySelectorAll('input[name="level"]').forEach(input => input.addEventListener('change', () => {
    settings.level = input.value; Storage.setSettings(settings); setup(false);
  }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    settings.mode = button.dataset.mode; Storage.setSettings(settings); setup(false);
  }));
  View.byId('setupForm').addEventListener('submit', event => { event.preventDefault(); start(); });
  View.byId('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    transact(() => Game.guess(round, View.byId('answer').value), View.byId('guessButton'));
    if (Game.current(round).outcome) View.byId('nextButton').focus();
    else View.byId('answer').select();
  });
  View.byId('cancelChoice').addEventListener('click', () => {
    chooseMode = false; update(); View.byId('answer').focus();
  });
  View.byId('chooseNotice').addEventListener('submit', event => {
    event.preventDefault();
    transact(() => Game.buyHint(round, 'chosen', View.byId('position').valueAsNumber - 1), View.byId('chooseNotice').querySelector('button[type="submit"]'));
    View.byId('purchasedHints').lastElementChild?.focus();
  });
  View.byId('revealButton').addEventListener('click', () => {
    transact(() => Game.reveal(round)); View.byId('nextButton').focus();
  });
  View.byId('nextButton').addEventListener('click', () => {
    Effects.clear();
    if (Game.summary(round).complete) View.results(round, descriptor);
    else if (Game.advance(round)) {
      persist(); View.byId('answer').value = ''; View.feedback(null);
      update(); View.byId('gameTitle').focus();
    }
  });
  View.byId('setupButton').addEventListener('click', () => setup(true));
  View.byId('newSetButton').addEventListener('click', () => {
    settings.mode = 'practice'; Storage.setSettings(settings); setup(false); start();
  });
  const dialog = View.byId('leaveDialog');
  View.byId('leaveButton').addEventListener('click', () => {
    if (descriptor.mode === 'daily') { persist(); setup(true); }
    else Vy.openModal(dialog);
  });
  ['closeLeave', 'continueButton'].forEach(id => View.byId(id).addEventListener('click', () => Vy.closeModal(dialog)));
  View.byId('confirmLeave').addEventListener('click', () => { Vy.closeModal(dialog); setup(true); });
  Vy.bindOverlayClose(dialog);
  function refreshDay() {
    if (!document.hidden && !round && settings.mode === 'daily' && descriptor.date !== Schedule.dateKey()) setup(false);
  }
  window.addEventListener('focus', refreshDay);
  document.addEventListener('visibilitychange', refreshDay);
  setup(false);
})();
