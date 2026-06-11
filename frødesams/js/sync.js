/* Frødesams — BroadcastChannel-synkronisering mellom quiz-master og storskjerm.
 * Tilgjengeleg som FS.Sync.
 */
(function (root) {
  'use strict';

  const FS = root.FS || (root.FS = {});

  const CHANNEL_NAME = 'frodesams-sync';
  let channel;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (e) { channel = null; }

  const listeners = new Map();

  if (channel) {
    channel.onmessage = function (event) {
      const { type, payload } = event.data || {};
      if (!type) return;
      const cbs = listeners.get(type);
      if (cbs) cbs.forEach(cb => { try { cb(payload); } catch (e) {} });
    };
  }

  FS.Sync = {
    on(type, cb) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(cb);
    },

    off(type, cb) {
      const arr = listeners.get(type);
      if (!arr) return;
      const i = arr.indexOf(cb);
      if (i > -1) arr.splice(i, 1);
    },

    send(type, payload) {
      if (!channel) return;
      channel.postMessage({ type, payload: payload || {} });
    },

    // Snarvegar for vanlege meldingstypar
    startGame(quiz, teams)           { FS.Sync.send('start-game',      { quiz, teams }); },
    showQuestion(data)               { FS.Sync.send('show-question',   data); },
    revealAnswer(answerIdx, text, points) {
      FS.Sync.send('reveal-answer', { answerIdx, text, points });
    },
    confirmReveal(answerIdx, teamIdx, points, scores) {
      FS.Sync.send('confirm-reveal', { answerIdx, teamIdx, points, scores });
    },
    undoReveal(answerIdx)            { FS.Sync.send('undo-reveal',     { answerIdx }); },
    strike(count, currentTeamIdx)   { FS.Sync.send('strike',          { count, currentTeamIdx }); },
    nextQuestion(data)               { FS.Sync.send('next-question',   data); },
    showWinner(teams, ranked)        { FS.Sync.send('show-winner',     { teams, ranked }); },
    requestState()                   { FS.Sync.send('request-state',  {}); },
    syncState(data)                  { FS.Sync.send('sync-state',     data); }
  };

})(window);
