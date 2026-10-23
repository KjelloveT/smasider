(function (root) {
  'use strict';
  const O = root.Ordbas;
  let settings, round;
  function change(next) {
    if (next.mode === 'pairs') { next.classes = ['adjektiv','adverb']; }
    else if (settings.mode === 'pairs') next.classes = O.Config.defaults.classes.slice();
    settings = next; O.View.setup(settings);
  }
  function home() {
    O.Effects.clear(); O.View.screen('setup'); O.View.setup(settings); O.View.progress(O.Storage.read()); O.View.byId('setupMessage').textContent = ''; O.View.focus('setupTitle');
  }
  function start(overrides = {}) {
    const next = {...settings,...overrides};
    if (next.classes.length < 2) return;
    settings = O.Storage.settings(next);
    const questions = next.review ? O.Storage.read().review.map(id => O.Content.get(id)).filter(Boolean) : O.Content.all();
    if (!questions.length) { home(); return; }
    O.Effects.clear(); O.Storage.saveSettings(settings);
    round = O.Round.create(questions,{...settings,review:next.review === true});
    O.View.game(round); O.View.focus('roundTitle');
  }
  function finishAnswer(outcome, question, origin) {
    if (!outcome.accepted) return;
    if (outcome.correct) { O.Storage.recordAnswer(outcome.result); O.View.progress(O.Storage.read()); }
    else O.Storage.notePractice(question.id);
    O.View.game(round); O.Effects.react(outcome.correct ? 'success' : 'retry');
    if (outcome.correct) {
      O.Effects.points(outcome.result.points);
      if (round.state.settings.mode !== 'helper') O.Effects.delivery(question.wordClass,round.state.settings.mode === 'pairs' ? question.target.before + question.target.text + question.target.after : question.target.text,origin);
    }
    if (round.state.phase === 'feedback') O.View.focus('nextButton'); else O.View.focusTask();
  }
  function answer(wordClass) {
    if (!round) return;
    const question = round.current().question;
    const card = O.View.byId('game').querySelector('#pairContext:not([hidden]) .ob-pair-tile[aria-pressed="true"],#wordCard:not([hidden])');
    const origin = card ? card.getBoundingClientRect() : null;
    finishAnswer(round.answer(wordClass),question,origin);
  }
  function chooseWord(index) { if (round) { const question = round.current().question; finishAnswer(round.chooseWord(index),question,null); } }
  function selectCard(index) { if (round && round.selectCard(index)) { O.View.game(round); O.View.focusTask(); } }
  async function next() {
    if (!round || !round.next()) return;
    O.Effects.clear();
    if (round.state.phase === 'complete') {
      const completed = round; O.View.result(completed); O.View.focus('resultTitle');
      await O.Storage.finish(completed.state.settings.mode); O.View.progress(O.Storage.read()); await O.View.badges();
    } else { O.View.game(round); O.View.focusTask(); }
  }
  function meaning() { if (round && round.state.phase !== 'complete') { round.revealMeaning(); O.View.meaning(round); } }
  function practice() { start({mode:'sort',classes:O.Config.classes.map(c => c.id),review:true}); }
  async function reset() {
    const accepted = await root.Vy.confirmAction('Val, øvingstal og repetisjonsord for Ordbås blir sletta på denne eininga. Bragdene blir verande.','Nullstill Ordbås?','Nullstill øvinga');
    if (!accepted) return;
    O.Storage.reset(); settings = O.Storage.read().settings; round = null; home(); O.View.byId('setupMessage').textContent = 'Ordbås-øvinga er nullstilt.';
  }
  O.App = {change,home,start,answer,chooseWord,selectCard,next,meaning,practice,reset,round:() => round};
  (async () => {
    try {
      await O.Content.load(); O.View.init(); settings = O.Storage.read().settings; O.Input.bind(); O.View.setup(settings); O.View.progress(O.Storage.read()); O.View.screen('setup'); await O.View.badges();
    } catch (error) { O.View.byId('loading').hidden = true; O.View.byId('loadError').hidden = false; O.View.byId('reloadButton').onclick = () => location.reload(); console.error('Ordbås kunne ikkje starte:',error); }
  })();
})(window);
