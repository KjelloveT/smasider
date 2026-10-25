(function () {
  'use strict';
  const Game = OrdvettGame, View = OrdvettView, Storage = OrdvettStorage;
  const Schedule = OrdvettSchedule, Effects = OrdvettEffects, Tutorial = OrdvettTutorial;
  const settings = Storage.getSettings();
  let descriptor, round = null, chooseMode = false, tutorialReturn = null;
  function syncAnswerOffset() { View.byId('game').style.setProperty('--ov-answer-offset', `${View.byId('answerDock').offsetHeight + 24}px`); }
  function savedRound() {
    if (!descriptor.key) return null;
    const snapshot = Storage.getDaily(descriptor.key);
    if (!snapshot) return null;
    const restored = Game.restore(descriptor.words, snapshot, Vy.rng(descriptor.seed));
    if (!restored) Storage.clearDaily(descriptor.key);
    return restored;
  }
  function persist() { if (round && descriptor.key) Storage.saveDaily(descriptor.key, Game.pack(round), Game.summary(round)); }
  function setup(focus) {
    Effects.clear(); chooseMode = false; round = null;
    const today = Schedule.dateKey();
    if (!Schedule.inRange(settings.archiveDate) || settings.archiveDate >= today) settings.archiveDate = Schedule.latestArchive(today);
    if (settings.mode === 'archive' && !settings.archiveDate) settings.mode = 'daily';
    descriptor = settings.mode === 'archive' ? Schedule.archive(settings.level, settings.archiveDate) : Schedule.daily(settings.level);
    View.setup(settings, descriptor);
    OrdvettOverview.render(settings, descriptor.date, level => {
      settings.level = level;
      descriptor = settings.mode === 'archive' ? Schedule.archive(level, settings.archiveDate) : Schedule.daily(level);
      start();
    });
    if (settings.mode === 'archive') OrdvettCalendar.render(settings.archiveDate);
    View.feedback(null); View.show('setup', focus ? 'setupTitle' : null);
  }
  function transact(action, origin, hintId) {
    const bounds = origin?.getBoundingClientRect();
    const wallet = View.byId('coinCounter').getBoundingClientRect(), before = Game.summary(round).cost;
    const result = action(); chooseMode = false;
    Tutorial.receive(result, hintId); persist(); update(result); View.feedback(result);
    if (result.price > 0) Effects.spend(bounds, result.price, before, Game.summary(round).cost, wallet);
    if (result.status === 'bought') {
      const card = View.byId('purchasedHints').lastElementChild;
      card?.focus({ preventScroll: true }); card?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      Effects.moveHint(bounds, card);
    } else if (hintId === 'chosen') View.byId('answer').focus();
    return result;
  }
  function update(change) {
    View.question(round, chooseMode, {
      hint(id, button) {
        if (!Tutorial.allows(id)) return;
        if (id === 'chosen') { chooseMode = true; update(); View.byId('position').select(); return; }
        transact(() => Game.buyHint(round, id), button, id);
      }
    }, change);
    Tutorial.render();
    syncAnswerOffset();
  }
  function start() {
    if (settings.mode === 'daily' && descriptor.date !== Schedule.currentDate()) descriptor = Schedule.daily(settings.level);
    Storage.setSettings(settings);
    round = savedRound() || Game.createRound(descriptor.words, Vy.rng(descriptor.seed)); chooseMode = false;
    if (Game.summary(round).complete) { View.results(round, descriptor); return; }
    persist(); View.byId('answer').value = ''; View.feedback(null); update(); View.show('game', 'gameTitle');
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    settings.mode = button.dataset.mode; Storage.setSettings(settings); setup(false);
  }));
  OrdvettCalendar.init(date => { settings.archiveDate = date; Storage.setSettings(settings); setup(false); });
  View.byId('answerForm').addEventListener('submit', event => {
    event.preventDefault(); if (Tutorial.getActive() && !Tutorial.allows(null)) return;
    transact(() => Game.guess(round, View.byId('answer').value), View.byId('guessButton'));
    if (Game.current(round).outcome) {
      if (Tutorial.getActive()) View.byId('tutorialGuide').querySelector('button').focus();
      else View.byId('nextButton').focus();
    } else View.byId('answer').select();
  });
  function cancelChoice() { chooseMode = false; update(); View.byId('answer').focus(); }
  View.byId('cancelChoice').addEventListener('click', cancelChoice);
  View.byId('chooseNotice').addEventListener('submit', event => {
    event.preventDefault(); if (Tutorial.getActive()) return;
    transact(() => Game.buyHint(round, 'chosen', View.byId('position').valueAsNumber - 1), View.byId('chooseNotice').querySelector('button[type="submit"]'), 'chosen');
  });
  View.byId('revealButton').addEventListener('click', () => { transact(() => Game.reveal(round)); View.byId('nextButton').focus(); });
  View.byId('nextButton').addEventListener('click', () => {
    Effects.clear();
    if (Game.summary(round).complete) View.results(round, descriptor);
    else if (Game.advance(round)) { persist(); View.byId('answer').value = ''; View.feedback(null); update(); View.byId('gameTitle').focus(); }
  });
  View.byId('setupButton').addEventListener('click', () => setup(true));
  View.byId('newSetButton').addEventListener('click', () => { settings.mode = 'archive'; Storage.setSettings(settings); setup(true); });
  View.byId('leaveButton').addEventListener('click', () => { persist(); setup(true); });
  function endTutorial() {
    Effects.clear(); Tutorial.end();
    const previous = tutorialReturn; tutorialReturn = null;
    if (previous?.round) {
      round = previous.round; descriptor = previous.descriptor; chooseMode = previous.chooseMode;
      if (previous.screen === 'results') View.results(round, descriptor);
      else { View.byId('answer').value = previous.answer; update(); View.feedback(null); View.show('game', Game.current(round).outcome ? 'gameTitle' : 'answer'); }
    } else setup(true);
  }
  View.byId('tutorialButton').addEventListener('click', () => {
    if (Tutorial.getActive()) return;
    persist(); tutorialReturn = { round, descriptor, chooseMode, answer: View.byId('answer').value, screen: View.byId('results').hidden ? 'game' : 'results' };
    Effects.clear(); round = Tutorial.begin(endTutorial); descriptor = { mode: 'tutorial', key: null }; chooseMode = false;
    View.byId('answer').value = ''; View.feedback(null); update(); View.show('game', 'gameTitle');
    View.byId('tutorialGuide').scrollIntoView({ block: 'nearest' });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
    if (Tutorial.getActive()) { event.preventDefault(); endTutorial(); }
    else if (chooseMode) { event.preventDefault(); cancelChoice(); }
  });
  if (window.ResizeObserver) new ResizeObserver(syncAnswerOffset).observe(View.byId('answerDock'));
  function refreshDay() { if (!document.hidden && !round && settings.mode === 'daily' && descriptor.date !== Schedule.currentDate()) setup(false); }
  window.addEventListener('focus', refreshDay); document.addEventListener('visibilitychange', refreshDay);
  setup(false);
})();
