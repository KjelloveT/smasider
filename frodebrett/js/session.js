/* Frødebrett — eitt lokalt, pågåande spel. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const S = FB.state;
  const Store = root.FrodebrettStorage;
  const Session = {};
  let activeId;

  function savedGame(session) {
    return session?.version === 1 && typeof session.quiz?.title === 'string'
      && Array.isArray(session.quiz.categories) && Array.isArray(session.teams)
      && Array.isArray(session.answeredCells);
  }

  function progress() {
    return {
      teams: S.teams.map(({ name, score }) => ({ name, score })),
      answeredCells: [...S.answeredCells],
      activeTeamId: S.activeTeamId,
      dailyDoubleCell: S.dailyDoubleCell,
      openCell: S.currentQuestion?.cellIndex ?? null,
      answerRevealed: S.currentQuestion?.answerRevealed === true,
      finalStage: S.finalStage,
      finalBets: S.finalBets
    };
  }

  Session.bind = function () {
    FB.el('btn-resume-game').addEventListener('click', Session.resume);
    FB.el('btn-pause-game').addEventListener('click', Session.pause);
    Session.render();
  };

  Session.render = function () {
    const { session } = Store.readState();
    const present = savedGame(session);
    FB.el('paused-game-title').textContent = present ? session.quiz.title : '';
    FB.el('paused-game').classList.toggle('hidden', !present);
  };

  Session.canStart = function () {
    return !savedGame(Store.readState().session)
      || confirm('Vil du byte ut spelet på vent med eit nytt spel?');
  };

  Session.start = function () {
    const data = Store.readState();
    activeId = Vy.uuid();
    // Ei ny publisering skal ikkje endre frøda midt i ein spelrunde.
    data.session = { version: 1, id: activeId, quiz: S.currentQuiz, ...progress() };
    Store.writeState(data);
    FB.show('btn-pause-game');
  };

  Session.save = function () {
    if (!activeId) return;
    const data = Store.readState();
    if (data.session?.id !== activeId) return;
    Object.assign(data.session, progress());
    Store.writeState(data);
  };

  Session.resume = function () {
    const data = Store.readState();
    const { session } = data;
    if (!savedGame(session)) {
      Session.render();
      return;
    }
    // Når nokon held fram i ei ny fane, går skrivetilgangen dit.
    FB.Board.resumeGame(session);
    activeId = Vy.uuid();
    session.id = activeId;
    Store.writeState(data);
    FB.show('btn-pause-game');
  };

  Session.pause = function () {
    Session.save();
    activeId = null;
    FB.Board.resetGame({ paused: true });
    Session.render();
    if (!FB.el('paused-game').classList.contains('hidden')) FB.el('btn-resume-game').focus();
  };

  Session.clear = function () {
    if (!activeId) return;
    const data = Store.readState();
    if (data.session?.id === activeId) {
      delete data.session;
      Store.writeState(data);
    }
    activeId = null;
    FB.hide('btn-pause-game');
    Session.render();
  };

  FB.Session = Session;
})(window);
