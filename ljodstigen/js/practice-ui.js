/* Småspelramme med eksisterande figurar og plantesteg. Ingen presisjonsstyring. */
(function (root) {
  'use strict';
  const R = function () { return LjodRender; };
  function button(text, action, positive) {
    const b = R().h('button', 'vp-button vp-button--large' + (positive ? ' vp-button--positive' : ''), text);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  }
  function scene(body, p, bridge) {
    const box = R().h('div', 'ljod-practice-scene' + (bridge ? ' is-bridge' : ''));
    box.setAttribute('aria-hidden', 'true');
    const avatar = LjodAvatar.image(p.avatar, 100);
    box.appendChild(avatar);
    if (bridge) {
      const deck = R().h('div', 'ljod-bridge-deck');
      for (let i = 0; i < 5; i++) deck.appendChild(R().h('span', 'vp-panel vp-panel--soft'));
      box.appendChild(deck);
    }
    body.appendChild(box);
    return { finish: function () { box.classList.add('is-finished'); } };
  }
  function wordPlate(word) {
    const row = R().h('div', 'ljod-model-word');
    word.letters.forEach(function (ch) { row.appendChild(R().h('span', 'vp-panel vp-panel--inset', ch)); });
    return row;
  }
  function sound(word, row, whole) {
    LjodAudio.stop();
    const highlight = function (i) {
      if (row) Array.from(row.children).forEach(function (node, n) {
        node.classList.toggle('is-speaking', i === 'word' || i === n);
      });
    };
    const hooks = { onLetter: highlight, onWord: function () { highlight('word'); }, onEnd: function () { highlight(null); } };
    if (whole && word.sound) return LjodAudio.soundOut(word, null, hooks);
    return LjodAudio.playSeq(word.letters.map(function (ch) { return 'f_' + ch; }), 260,
      { onStart: highlight, onEnd: function () { highlight(null); } });
  }
  function introduce(body, ctx, skill, key, word) {
    const it = LjodLearning.get(ctx.profile, skill, key);
    if (it && it.introduced && !(it.last === 'wrong' && it.wrong >= 2)) return Promise.resolve(false);
    R().clear(body);
    scene(body, ctx.profile, skill !== 'listen');
    const plate = wordPlate(word);
    body.appendChild(R().h('p', 'ljod-prompt', 'Vi tek det saman fyrst.'));
    body.appendChild(plate);
    return new Promise(function (resolve) {
      const listen = button('Høyr og sjå', function () {
        listen.disabled = true;
        sound(word, plate, skill !== 'listen').then(function () {
          if (!body.isConnected) return;
          next.disabled = false;
          listen.disabled = false;
        });
      });
      const next = button('Prøv sjølv', function () {
        LjodAudio.stop();
        LjodLearning.introduce(ctx.profile, skill, key);
        LjodState.saveProfile(ctx.profile);
        resolve(true);
      }, true);
      next.disabled = true;
      const actions = R().h('div', 'vp-actions');
      actions.append(listen, next);
      body.appendChild(actions);
    });
  }
  function ready(body, action) {
    const b = button('Høyr oppgåva', function () { b.disabled = true; action().finally(function () { b.disabled = false; }); });
    body.appendChild(b);
    return b;
  }
  root.LjodPractice = { button: button, scene: scene, wordPlate: wordPlate,
    sound: sound, introduce: introduce, ready: ready };
})(window);
