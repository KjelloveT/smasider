/* Oppstart for ei sjølvstendig Frødebrett-fil. Lag og poeng bur i minnet. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const quiz = JSON.parse(FB.el('frode-data').textContent).quiz;
  FB.Board.bind();
  FB.el('btn-offline-start').addEventListener('click', () => FB.Board.selectQuiz(quiz));
  document.addEventListener('keydown', FB.Board.handleGameKeyboard);
})(window);
