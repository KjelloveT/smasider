(function () {
  'use strict';
  const Game = OrdvettGame;
  const View = OrdvettView;
  const Storage = OrdvettStorage;
  const Bank = OrdvettBank;
  const settings = Storage.getSettings();
  let round = null;
  let chooseMode = false;
  // Faste, versjonerte sett gjer rekordane samanliknbare. Orda blir ikkje trekte om att.
  const sets = Object.fromEntries(['lett', 'utfordring'].map((level, index) => {
    const words = Vy.shuffle(Bank.words.filter(word => word.level === level), Vy.rng(8713 + index));
    return [level, Array.from({ length: Math.floor(words.length / 5) }, (_, i) => words.slice(i * 5, i * 5 + 5))];
  }));
  function recordKey() { return `${Bank.bankVersion}-r${Bank.rulesVersion}-${settings.level}-${settings.setIndex}`; }
  function setup(focus) {
    chooseMode = false;
    round = null;
    View.setup(settings, sets[settings.level].length, recordKey());
    View.show('setup', focus ? 'setupTitle' : null);
  }
  function update() {
    View.question(round, chooseMode, {
      hint(id) {
        if (id === 'chosen') {
          chooseMode = true;
          update();
          View.byId('letters').querySelector('button')?.focus();
          return;
        }
        chooseMode = false;
        const result = Game.buyHint(round, id);
        update();
        View.feedback(result.message, result.ok);
        const sameButton = View.byId('hintButtons').querySelector(`[data-hint="${id}"]`);
        (sameButton && !sameButton.disabled ? sameButton : View.byId('hintButtons').querySelector('button:not([disabled])'))?.focus();
      },
      position(index) {
        const result = Game.buyHint(round, 'chosen', index);
        chooseMode = false;
        update();
        View.feedback(result.message, result.ok);
        View.byId('answer').focus();
      }
    });
  }
  function start() {
    Storage.setSettings(settings);
    round = Game.createRound(sets[settings.level][settings.setIndex], Vy.rng(4123 + settings.setIndex));
    chooseMode = false;
    View.byId('answer').value = '';
    View.feedback('');
    update();
    View.show('game', 'gameTitle');
  }
  document.querySelectorAll('input[name="level"]').forEach(input => input.addEventListener('change', () => {
    settings.level = input.value;
    settings.setIndex = Math.min(settings.setIndex, sets[settings.level].length - 1);
    Storage.setSettings(settings);
    View.setup(settings, sets[settings.level].length, recordKey());
  }));
  View.byId('setSelect').addEventListener('change', event => {
    settings.setIndex = Number(event.target.value);
    Storage.setSettings(settings);
    View.setup(settings, sets[settings.level].length, recordKey());
  });
  View.byId('setupForm').addEventListener('submit', event => { event.preventDefault(); start(); });
  View.byId('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    chooseMode = false;
    const result = Game.guess(round, View.byId('answer').value);
    update();
    View.feedback(result.message, result.ok);
    if (Game.current(round).outcome) View.byId('nextButton').focus();
    else View.byId('answer').select();
  });
  View.byId('cancelChoice').addEventListener('click', () => {
    chooseMode = false; update(); View.byId('answer').focus();
  });
  View.byId('revealButton').addEventListener('click', () => {
    chooseMode = false;
    const result = Game.reveal(round);
    update();
    View.feedback(result.message);
    View.byId('nextButton').focus();
  });
  View.byId('nextButton').addEventListener('click', () => {
    if (Game.summary(round).complete) {
      const oldRecord = Storage.getRecord(recordKey());
      const isBest = Storage.recordResult(recordKey(), Game.summary(round));
      View.results(round, isBest, oldRecord);
    } else if (Game.advance(round)) {
      View.byId('answer').value = '';
      View.feedback('');
      update();
      View.byId('gameTitle').focus();
    }
  });
  View.byId('setupButton').addEventListener('click', () => setup(true));
  View.byId('newSetButton').addEventListener('click', () => {
    settings.setIndex = (settings.setIndex + 1) % sets[settings.level].length;
    start();
  });
  const dialog = View.byId('leaveDialog');
  View.byId('leaveButton').addEventListener('click', () => Vy.openModal(dialog));
  ['closeLeave', 'continueButton'].forEach(id => View.byId(id).addEventListener('click', () => Vy.closeModal(dialog)));
  View.byId('confirmLeave').addEventListener('click', () => { Vy.closeModal(dialog); setup(true); });
  Vy.bindOverlayClose(dialog);
  setup(false);
})();
