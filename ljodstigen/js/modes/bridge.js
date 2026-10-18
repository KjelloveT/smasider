/* Ordbryggja: tre fagleg skilde oppdrag, med same profil og ordgrunnlag. */
(function (root) {
  'use strict';
  function wordOptions(p, word) {
    const pool = LjodLearning.PILOT.map(LjodWords.byText).filter(function (w) {
      return w && w.text !== word.text && w.len === word.len &&
        w.letters.every(function (ch) { return LjodLetters.upTo(p.adaptive.step).includes(ch); });
    });
    const others = Vy.shuffle(pool).sort(function (a, b) {
      return Number(b.first === word.first) - Number(a.first === word.first);
    });
    return Vy.shuffle([word].concat(others.slice(0, 2)));
  }
  function blend(frame, ctx, word, helped) {
    const R = LjodRender, P = LjodPractice, body = R.clear(frame.body);
    const scenery = P.scene(body, ctx.profile, true);
    body.appendChild(R.h('p', 'ljod-prompt', 'Set lydane saman. Kva ord blir det?'));
    let done = false, busy = false, assisted = helped;
    const result = new Promise(function (resolve) {
      function play() {
        if (done || busy) return Promise.resolve();
        busy = true;
        R.lock(grid, true);
        return P.sound(word, null, false).finally(function () {
          busy = false;
          if (!done && body.isConnected) R.lock(grid, false);
        });
      }
      const replay = P.ready(body, play);
      const items = wordOptions(ctx.profile, word).map(function (w) {
        const node = P.button(w.text, function () {});
        node.dataset.key = w.text;
        return { key: w.text, node: node };
      });
      const grid = R.optionGrid(items, function (key, node) {
        if (done || busy) return;
        done = true;
        R.lock(grid, true);
        replay.disabled = help.disabled = true;
        LjodAudio.stop();
        const correct = key === word.text;
        if (correct) R.markCorrect(node);
        else { R.markWrong(node); R.revealAnswer(grid, word.text); }
        const plate = P.wordPlate(word);
        body.appendChild(plate);
        scenery.finish();
        P.sound(word, plate, true).then(function () { return R.feedback(correct, []); }).then(function () {
          resolve({ word: word, skill: 'blend', target: word.text, correct: correct, helped: assisted });
        });
      });
      grid.classList.add('ljod-word-options');
      body.appendChild(grid);
      const help = P.button('Vis meg', function () {
        if (done || busy) return;
        assisted = true;
        busy = true;
        R.lock(grid, true);
        const plate = P.wordPlate(word);
        body.appendChild(plate);
        P.sound(word, plate, true).finally(function () {
          plate.remove(); busy = false;
          if (!done && body.isConnected) R.lock(grid, false);
        });
      });
      body.appendChild(help);
      play();
    });
    return result;
  }
  function read(frame, ctx, word) {
    const R = LjodRender, P = LjodPractice, body = R.clear(frame.body);
    const scenery = P.scene(body, ctx.profile, true);
    body.appendChild(R.h('p', 'ljod-prompt', 'Prøv å lese sjølv.'));
    if (word.kind) body.appendChild(R.h('p', 'vp-help', word.kind === 'nonword' ? 'Tulleord – dette er eit øveord.' : 'Eit nytt ord med kjende lydar.'));
    const plate = P.wordPlate(word);
    body.appendChild(plate);
    const field = R.h('label', 'vp-choice');
    const adult = R.h('input'); adult.type = 'checkbox'; adult.checked = ctx.withAdult === true;
    adult.addEventListener('change', function () { ctx.withAdult = adult.checked; });
    field.append(adult, R.h('span', null, 'Ein vaksen lyttar'));
    body.appendChild(field);
    let assisted = false, done = false;
    return new Promise(function (resolve) {
      const actions = R.h('div', 'vp-actions');
      function finish(correct, isAdult) {
        if (done) return;
        done = true;
        LjodAudio.stop();
        body.querySelectorAll('button, input').forEach(function (b) { b.disabled = true; });
        scenery.finish();
        body.appendChild(R.h('p', 'ljod-prompt', 'Godt øvd!'));
        LjodAudio.play('r_gjort').then(function () {
          resolve({ word: word, skill: 'read', target: word.text, correct: correct,
            helped: assisted || correct === false, adult: isAdult === true, kind: word.kind || null });
        });
      }
      const help = P.button(word.sound ? 'Høyr ordet' : 'Høyr lydane', function () {
        if (done) return;
        assisted = true;
        actions.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        P.sound(word, plate, true).finally(function () {
          if (!done && body.isConnected) actions.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        });
      });
      const tried = P.button('Eg har prøvd', function () {
        adult.disabled = true;
        R.clear(actions);
        if (adult.checked) {
          actions.append(P.button('Las sjølv', function () { finish(true, true); }, true),
            P.button('Med hjelp', function () { assisted = true; finish(true, true); }),
            P.button('Øv meir', function () { finish(false, true); }));
        } else {
          actions.append(help, P.button('Vidare', function () { finish(null, false); }, true));
        }
      }, true);
      actions.append(tried, help);
      body.appendChild(actions);
      body.appendChild(R.h('p', 'vp-help', 'Du kan øve åleine. Ein vaksen kan lytte når de les i lag.'));
      // Ingen automatisk lydfasit eller automatisk godkjenning av høgtlesing.
    });
  }
  function run(frame, ctx) {
    const skill = ['blend', 'build', 'read'].includes(ctx.bridgeTask) ? ctx.bridgeTask : 'build';
    ctx.bridgeCount = (ctx.bridgeCount || 0) + 1;
    const word = LjodLearning.words(ctx.profile, skill, ctx.lastWord, ctx.bridgeCount % 4 === 1)[0];
    if (!word) return Promise.resolve(null);
    ctx.lastWord = word.text;
    frame.setPrompt('Ordbryggja — ' + { blend: 'set lydane saman', build: 'bygg ordet', read: 'les sjølv' }[skill]);
    if (skill === 'read') return read(frame, ctx, word);
    return LjodPractice.introduce(frame.body, ctx, skill, '_demo', word).then(function (helped) {
      if (skill === 'blend') return blend(frame, ctx, word, helped);
      return LjodBridgeBuild.run(frame, Object.assign({}, ctx, { word: word, introHelped: helped }));
    });
  }
  root.LjodMode_ordbyggjar = { id: 'ordbyggjar', label: 'Ordbryggja',
    blurb: 'Set saman lydar, bygg ord og prøv å lese sjølv', needsAudio: true, run: run };
})(window);
