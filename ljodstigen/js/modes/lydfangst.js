/* Lydlyngen vidarefører Lydfangst med dei same stabile bokstav-ID-ane. */
(function (root) {
  'use strict';
  function run(frame, ctx) {
    const q = LjodAdaptive.pick(ctx.adaptive, { guarantee: ctx.guarantee, pool: ctx.letterPool || undefined });
    if (!q) return Promise.resolve(null);
    frame.setPrompt('Lydlyngen — kva bokstav høyrer du?');
    return LjodPractice.introduce(frame.body, ctx, 'listen', q.ch, { text: q.ch, letters: [q.ch] }).then(function (modelled) {
      const R = LjodRender, P = LjodPractice, body = R.clear(frame.body);
      const scenery = P.scene(body, ctx.profile, false);
      let answered = false, helped = modelled, busy = false;
      const started = performance.now();
      return new Promise(function (resolve) {
        function play() { LjodAudio.stop(); return LjodAudio.play('f_' + q.ch); }
        const replay = P.ready(body, play);
        const items = q.options.map(function (ch) {
          const node = P.button('', function () {});
          node.setAttribute('aria-label', 'Planta med bokstaven ' + ch.toUpperCase());
          node.dataset.key = ch;
          node.append(R.h('span', 'ljod-glyph', ch), LjodShapes.plant(1, 64));
          return { key: ch, node: node };
        });
        const grid = R.optionGrid(items, function (key, node) {
          if (answered || busy) return;
          answered = true;
          const correct = key === q.ch, latency = performance.now() - started;
          R.lock(grid, true);
          replay.disabled = help.disabled = true;
          LjodAudio.stop();
          if (correct) {
            R.markCorrect(node);
            node.querySelector('svg').replaceWith(LjodShapes.plant(4, 64));
            scenery.finish();
          } else { R.markWrong(node); R.revealAnswer(grid, q.ch); }
          R.feedback(correct, correct ? [] : ['f_' + q.ch]).then(function () {
            resolve({ ch: q.ch, skill: 'listen', target: q.ch, correct: correct,
              helped: helped, latencyMs: latency, chosen: correct ? null : key });
          });
        });
        grid.classList.add('ljod-plants');
        body.appendChild(grid);
        const help = P.button('Vis meg', function () {
          if (answered || busy) return;
          helped = busy = true;
          R.lock(grid, true);
          const plate = R.letterPlate(q.ch);
          body.appendChild(plate);
          play().finally(function () {
            plate.remove(); busy = false;
            if (!answered && body.isConnected) R.lock(grid, false);
          });
        });
        body.appendChild(help);
        play();
      });
    });
  }
  root.LjodMode_lydfangst = { id: 'lydfangst', label: 'Lydlyngen',
    blurb: 'Høyr bokstavlyden og hjelp planta å vekse', needsAudio: true, run: run };
})(window);
