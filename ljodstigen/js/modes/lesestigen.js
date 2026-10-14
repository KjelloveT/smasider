/* Lesesteg 6–10: kjenn att heile ord og setningar. Ingen fartsterskel.
   Lydgrupper blir spelte samla, aldri som to eller tre bokstavnamn. */
(function (root) {
  'use strict';

  function optionsFor(level, target) {
    let others = Vy.shuffle(level.items.filter(function (item) {
      return item.id !== target.id && item.kind === target.kind;
    }));
    // La minimalpara møtast, slik at eleven faktisk må høyre vokallengda.
    if (target.pair) {
      others.sort(function (a, b) {
        return Number(b.text === target.pair) - Number(a.text === target.pair);
      });
    }
    return Vy.shuffle([target].concat(others.slice(0, 2)));
  }

  function run(frame, ctx) {
    const number = ctx.readingLevel;
    const level = LjodReading.LEVELS.find(function (l) { return l.number === number; });
    const target = LjodProgress.pick(ctx.profile, number, ctx.lastReadingId);
    if (!level || !target) return Promise.resolve(null);
    ctx.lastReadingId = target.id;
    const R = LjodRender;
    const play = function (id) { LjodAudio.stop(); return LjodAudio.play(id); };
    frame.setPrompt('Steg ' + number + ' — ' + level.title);
    const body = R.clear(frame.body);
    body.appendChild(R.h('p', 'vp-help', level.hint));
    body.appendChild(R.h('p', 'ljod-prompt', target.kind === 'sentence'
      ? 'Høyr og vel setninga som blir lesen.' : 'Høyr og vel ordet som blir lese.'));
    const replay = R.replayButton(function () { return play(target.id); },
      target.kind === 'sentence' ? 'Høyr setninga om att' : 'Høyr ordet om att');
    body.appendChild(replay);
    if (level.groups.length) {
      const groupRow = R.h('div', 'vp-actions ljod-sound-groups');
      level.groups.forEach(function (group) {
        const button = R.h('button', 'vp-button vp-button--compact', 'Høyr ' + group.text);
        button.type = 'button';
        button.addEventListener('click', function () { play(group.id); });
        groupRow.appendChild(button);
      });
      body.appendChild(groupRow);
    }
    let answered = false;
    return new Promise(function (resolve) {
      const items = optionsFor(level, target).map(function (item) {
        const button = R.h('button', 'vp-button vp-button--large ljod-reading-option', item.text);
        button.type = 'button';
        button.dataset.key = item.id;
        return { key: item.id, node: button };
      });
      const grid = R.optionGrid(items, function (key, button) {
        if (answered) return;
        answered = true;
        const correct = key === target.id;
        R.lock(grid, true);
        replay.disabled = true;
        body.querySelectorAll('.ljod-sound-groups button').forEach(function (b) { b.disabled = true; });
        if (correct) R.markCorrect(button);
        else {
          R.markWrong(button);
          R.revealAnswer(grid, target.id);
        }
        body.appendChild(R.h('p', 'vp-notice', correct ? 'Rett!' : 'Høyr og sjå: ' + target.text));
        R.setMood(correct ? 'happy' : 'think');
        LjodAudio.stop();
        R.feedback(correct, correct ? [] : [target.id]).then(function () {
          resolve({ reading: { level: number, id: target.id }, correct: correct });
        });
      });
      grid.classList.add('ljod-reading-options');
      body.appendChild(grid);
      play(target.id);
    });
  }

  root.LjodMode_lesestigen = { id: 'lesestigen', label: 'Lesestigen',
    blurb: 'Øv på lydgrupper, lengre ord og heile setningar', needsAudio: true, run: run };
})(window);
