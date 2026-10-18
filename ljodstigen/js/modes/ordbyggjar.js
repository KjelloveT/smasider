/* ══════════════════════════════════════════════
   ORDBYGGJAREN — høyr eit ord, bygg det av bokstavlydar

   Toppen av stigen i v1: her går eleven frå å kjenne att til å byggje.

   TRYKK, IKKJE DRA. Dra-og-slepp er standard i slike spel og er feil
   val for målgruppa: det krev at ein seksåring held fingeren nede og
   treffer eit mål samtidig, og det feilar oftast for dei elevane som
   alt strevar mest. Her trykkjer eleven på ei brikke, og ho legg seg i
   neste ledige rute. Trykk på ei fylt rute sender brikka tilbake.
   Ingen presisjon kravd, alt kan angrast.

   Kvar brikke seier lyden sin når ho landar. Det er sjølve poenget:
   eleven høyrer ordet byggje seg opp lyd for lyd.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const R = function () { return LjodRender; };

  /* Brikkene: bokstavane i ordet, stokka, pluss ein distraktor når
     eleven er komen eit stykke. Fleire distraktorar ville gjort
     oppgåva til ei leiting i staden for ei lydering. */
  function tilesFor(word, a, extra) {
    const set = word.letters.slice();
    if (extra) {
      const pool = LjodLetters.upTo(a.step).filter(function (c) {
        return set.indexOf(c) === -1 && !LjodLetters.isConfusable(word.letters[0], c);
      });
      if (pool.length) set.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return Vy.shuffle(set);
  }

  function run(frame, ctx) {
    const p = ctx.profile;
    const word = ctx.word || LjodLearning.words(p, 'build')[0];
    if (!word) return Promise.resolve(null);

    frame.setPrompt('Ordbryggja — bygg ordet du høyrer.');
    const body = R().clear(frame.body);
    const scenery = LjodPractice.scene(body, p, true);
    let helped = ctx.introHelped === true;

    const play = function () { return speak(word.sound); };
    const replay = R().replayButton(play, 'Høyr ordet om att');
    body.appendChild(replay);

    /* Rutene */
    const slotRow = R().h('div', 'ljod-slots');
    const slots = [];
    for (let i = 0; i < word.len; i++) {
      const s = R().h('button', 'ljod-slot');
      s.type = 'button';
      s.dataset.index = String(i);
      s.setAttribute('aria-label', 'Rute ' + (i + 1) + ' av ' + word.len + ', tom');
      slotRow.appendChild(s);
      slots.push({ node: s, ch: null, from: null });
    }
    body.appendChild(slotRow);

    /* Brikkene */
    const tray = R().h('div', 'ljod-tray');
    const built = (p.counters.wordsBuilt || 0);
    const tiles = tilesFor(word, p.adaptive, built >= 3).map(function (ch, i) {
      const t = R().letterTile(ch, { size: 'md' });
      t.dataset.tile = String(i);
      tray.appendChild(t);
      return { node: t, ch: ch, used: false };
    });
    body.appendChild(tray);

    let resumeAfterHelp = function () {};
    const show = LjodPractice.button('Vis meg', function () {
      if (done || helping || checking) return;
      helped = helping = true;
      revision++; speech++;
      highlight(null);
      R().lock(body, true);
      const plate = LjodPractice.wordPlate(word);
      body.appendChild(plate);
      show.disabled = true;
      LjodPractice.sound(word, plate, true).finally(function () {
        plate.remove(); helping = false;
        if (!done && body.isConnected) {
          unlock();
          resumeAfterHelp();
        }
      });
    });
    body.appendChild(show);
    const started = performance.now();
    let firstAttempt = null;   // resultatet vi rapporterer til motoren
    let done = false;
    let helping = false, checking = false;
    let speech = 0;
    let revision = 0;

    function unlock() {
      replay.disabled = show.disabled = false;
      slots.forEach(function (s) { s.node.disabled = false; });
      tiles.forEach(function (t) { t.node.disabled = t.used; });
    }

    function highlight(index) {
      slots.forEach(function (s, i) {
        s.node.classList.toggle('is-speaking', index === 'word' ? !!s.ch : i === index);
      });
    }

    function speak(id, index) {
      const token = ++speech;
      LjodAudio.stop();
      highlight(null);
      return LjodAudio.play(id, {
        onStart: function () { if (token === speech) highlight(index == null ? 'word' : index); },
        onEnd: function () { if (token === speech) highlight(null); }
      });
    }

    return new Promise(function (resolve) {

      function refreshSlot(i) {
        const s = slots[i];
        R().clear(s.node);
        if (s.ch) {
          s.node.appendChild(R().h('span', 'ljod-glyph', s.ch));
          s.node.setAttribute('aria-label', 'Rute ' + (i + 1) + ', bokstaven ' + s.ch.toUpperCase() + '. Trykk for å ta han ut.');
          s.node.classList.add('is-filled');
        } else {
          s.node.setAttribute('aria-label', 'Rute ' + (i + 1) + ' av ' + word.len + ', tom');
          s.node.classList.remove('is-filled');
        }
        s.node.classList.remove('is-right', 'is-wrong');
      }

      function nextEmpty() {
        for (let i = 0; i < slots.length; i++) if (!slots[i].ch) return i;
        return -1;
      }

      function placeTile(t) {
        if (done || helping || checking || t.used) return;
        const i = nextEmpty();
        if (i === -1) return;
        t.used = true;
        t.node.classList.add('is-used');
        t.node.disabled = true;
        slots[i].ch = t.ch;
        slots[i].from = t;
        refreshSlot(i);
        /* Brikka seier lyden sin når ho landar. */
        const placed = ++revision;
        speak('f_' + t.ch, i).then(function () {
          if (!done && placed === revision && nextEmpty() === -1 && body.isConnected) check();
        });
      }

      function pullTile(i) {
        if (done || helping) return;
        const s = slots[i];
        if (!s.ch) return;
        revision++;
        speech++;
        LjodAudio.stop();
        highlight(null);
        s.from.used = false;
        s.from.node.classList.remove('is-used');
        s.from.node.disabled = false;
        s.ch = null; s.from = null;
        refreshSlot(i);
      }

      function check() {
        if (done || checking || helping) return;
        checking = true;
        R().lock(body, true);
        const guess = slots.map(function (s) { return s.ch; });
        const correct = guess.join('') === word.text;

        if (firstAttempt === null) {
          firstAttempt = {
            correct: correct,
            latencyMs: performance.now() - started,
            /* Ruter er tilbakemelding i oppgåva. Dei gir ikkje automatisk
               den same kunnskapsstatusen som lyd-til-bokstav-svar. */
            letters: slots.map(function (s, i) {
              return {
                ch: word.letters[i],
                correct: s.ch === word.letters[i],
                chosen: s.ch === word.letters[i] ? null : s.ch
              };
            })
          };
        }

        if (correct) {
          done = true;
          replay.disabled = show.disabled = true;
          scenery.finish();
          const token = ++speech;
          LjodAudio.stop();
          highlight(null);
          slots.forEach(function (s) { s.node.classList.add('is-right'); });
          R().setMood('happy');
          LjodMerke.noteWord(p, word.text);
          /* Lyder ordet seint, så heilt, med framheving av kvar rute. */
          LjodAudio.soundOut(word, null, {
            onLetter: function (index) { highlight(index); },
            onWord: function () { highlight('word'); },
            onEnd: function () { highlight(null); }
          })
            .then(function () {
              if (token === speech && body.isConnected) return LjodAudio.play(R().praiseId());
            })
            .then(function () {
              if (token !== speech || !body.isConnected) return;
              setTimeout(function () {
                resolve(Object.assign({ word: word, skill: 'build', target: word.text, helped: helped }, firstAttempt));
              }, 500);
            });
          return;
        }

        /* Feil: dei rette rutene blir ståande, dei gale blir tømde.
           Eleven mistar aldri alt han fekk til. */
        R().setMood('think');
        helped = true;
        slots.forEach(function (s, i) {
          if (s.ch === word.letters[i]) { s.node.classList.add('is-right'); }
          else { s.node.classList.add('is-wrong'); }
        });
        /* Brikkene kjem tilbake når oppmuntringa er ferdig snakka, ikkje
           etter ei fast klokke: klippa er frå 1,4 til 2,4 sekund lange,
           så eit fast tal ville anten avbrote henne eller late eleven
           sitje og vente. Så høyrer han ordet om att og kan prøve på ny. */
        R().feedback(false, []).then(function () {
          slots.forEach(function (s, i) {
            if (s.ch !== word.letters[i]) pullTile(i);
            else s.node.classList.remove('is-wrong');
          });
          return play().then(function () { checking = false; unlock(); });
        });
      }

      resumeAfterHelp = function () { if (nextEmpty() === -1) check(); };
      tiles.forEach(function (t) {
        t.node.addEventListener('click', function () { placeTile(t); });
      });
      slots.forEach(function (s, i) {
        s.node.addEventListener('click', function () { pullTile(i); });
      });

      play();
    });
  }

  root.LjodBridgeBuild = {
    id: 'ordbyggjar',
    label: 'Ordbyggjaren',
    blurb: 'Høyr eit ord og bygg det av bokstavar',
    needsAudio: true,
    run: run
  };
})(window);
