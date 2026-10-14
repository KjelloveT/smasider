/* ══════════════════════════════════════════════
   MAIN.JS — Økta

   Ei økt er 12 oppgåver, fem til sju minutt. Ho har ein fast form, og
   to av eigenskapane hennar er meir gjennomtenkte enn dei ser ut:

   1. SISTE OPPGÅVE ER ALLTID EIN SIGER. Vi ber motoren om ei garantert
      oppgåve på slutten. Kva eleven ser sist avgjer om han opnar appen
      i morgon, og ein elev som sluttar på eit nederlag gjer ikkje det.

   2. HAGEN ER DET SISTE BILETET. Ikkje eit resultat, ikkje ein prosent.
      Ein prosent under adaptiv vanskegrad seier uansett ingenting:
      motoren siktar mot same treffrate for alle.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const TASKS_PER_SESSION = 12;

  const MODES = {
    lydfangst: function () { return LjodMode_lydfangst; },
    bokstavropet: function () { return LjodMode_bokstavropet; },
    forstelyd: function () { return LjodMode_forstelyd; },
    ordbyggjar: function () { return LjodMode_ordbyggjar; },
    lesestigen: function () { return LjodMode_lesestigen; }
  };

  const R = function () { return LjodRender; };

  function param(name) {
    return new URLSearchParams(location.hash.slice(1)).get(name) || new URLSearchParams(location.search).get(name);
  }

  function go(url) { location.href = url; }

  /* ──────────────── Oppstart ──────────────── */

  function start() {
    const host = document.getElementById('play');
    if (!host) return;

    const profileId = param('p');
    const modeId = param('m') || 'lydfangst';
    const profile = profileId ? LjodState.getProfile(profileId) : null;
    const mode = MODES[modeId] ? MODES[modeId]() : null;

    if (!profile || !mode) { go('index.html'); return; }
    const progress = LjodProgress.summary(profile);
    const allOpen = LjodState.read().allModes;
    if (mode.id === 'lesestigen' && progress.current < 6 && !allOpen) { go('index.html'); return; }
    let readingLevel = Number(param('level'));
    if (!Number.isInteger(readingLevel) || readingLevel < 6 || readingLevel > 10 ||
        (!allOpen && readingLevel > progress.current)) readingLevel = Math.max(6, progress.current);

    document.body.dataset.font = LjodState.read().font;

    /* Lasteskjerm. Lyden skal vere ferdig dekoda før første oppgåve —
       ei oppgåve som ventar på nettverket er ei oppgåve eleven trur er
       øydelagd. */
    R().clear(host);
    const loading = R().h('div', 'ljod-loading vp-panel vp-panel--plain');
    loading.appendChild(R().h('p', 'ljod-prompt', 'Hentar lydane…'));
    const bar = R().h('div', 'ljod-progress');
    const fill = R().h('div', 'ljod-progress-fill');
    bar.appendChild(fill);
    loading.appendChild(bar);
    host.appendChild(loading);

    LjodAudio.load(function (done, total) {
      fill.style.width = Math.round(100 * done / total) + '%';
    }, { voice: LjodState.read().voice }).then(function (res) {
      if (mode.id === 'lesestigen') {
        const level = LjodReading.LEVELS.find(function (l) { return l.number === readingLevel; });
        if (!level.items.concat(level.groups).every(function (item) { return LjodAudio.hasClip(item.id); })) {
          R().clear(host);
          host.appendChild(R().h('p', 'vp-notice vp-notice--error', 'Lydane til dette steget kunne ikkje lastast. Prøv å laste sida på nytt.'));
          const retry = R().h('button', 'vp-button', 'Prøv på nytt');
          retry.addEventListener('click', function () { location.reload(); });
          host.appendChild(retry);
          return;
        }
      }
      runSession(host, profile, mode, res, readingLevel);
    });
  }

  /* ──────────────── Sjølve økta ──────────────── */

  function runSession(host, profile, mode, audioRes, readingLevel) {
    const newStars = LjodState.startSession(profile, mode.id);
    LjodState.saveProfile(profile);

    const frame = R().taskFrame({ prompt: '' });
    R().clear(host);
    host.appendChild(frame.root);

    /* Køyrer vi på plasshaldartonar, skal det stå — og det skal stå KVA
       som manglar. Ei melding om at «lyden manglar» når bokstavlydane
       faktisk er innspelte, får ein lærar til å tru at heile appen er
       øydelagd. */
    if (audioRes && audioRes.missing.length) {
      const NAMES = { fonem: 'bokstavlydane', namn: 'bokstavnamna', ord: 'orda', ros: 'rosen' };
      const list = audioRes.missing.map(function (b) { return NAMES[b] || b; });
      const what = list.length > 1
        ? list.slice(0, -1).join(', ') + ' og ' + list[list.length - 1]
        : list[0];
      /* Sei kva som manglar, ikkje kva du høyrer. Kva ein manglande bank
         gjer — tone eller stille — er eit val i audio.js, og ei melding
         som gjettar på det blir ståande feil neste gong valet endrar seg. */
      const note = R().h('p', 'ljod-audio-note',
        'Ikkje alt er spelt inn enno: ' + what + ' manglar.');
      frame.head.appendChild(note);
    }

    const ctx = { profile: profile, adaptive: profile.adaptive, guarantee: false, readingLevel: readingLevel };
    const journey = R().h('div');
    frame.head.appendChild(journey);
    LjodProgressUI.render(journey, profile, { compact: true, inTask: true });
    let n = 0;

    function nextTask() {
      if (n >= TASKS_PER_SESSION) { finish(host, profile, newStars); return; }

      frame.setProgress(n, TASKS_PER_SESSION);
      LjodProgressUI.render(journey, profile, { compact: true, inTask: true });
      /* Siste oppgåva skal eleven klare. */
      ctx.guarantee = (n === TASKS_PER_SESSION - 1);

      /* Sikring: ingen lyd frå førre oppgåve skal leve inn i denne.
         Tilbakemeldinga blir venta ut i R().feedback, så dette skal
         normalt vere eit no-op — men det kostar ingenting, og alternativet
         er at ein elev høyrer fasiten på førre bokstav medan han ser på
         den neste. */
      LjodAudio.stop();

      const p = mode.run(frame, ctx);
      if (!p) { finish(host, profile, newStars); return; }

      p.then(function (res) {
        if (!res) { finish(host, profile, newStars); return; }
        applyResult(profile, res);
        LjodState.saveProfile(profile);
        n++;
        if (res.reading && LjodProgress.levels(profile)[ctx.readingLevel - 1].done) {
          finish(host, profile, newStars);
          return;
        }
        nextTask();
      });
    }

    nextTask();
  }

  /* Eitt svar inn i motoren og i merka. Ordbyggjaren leverer eit svar
     per rute, sidan eleven kan ha to bokstavar rett og éin feil. */
  function applyResult(profile, res) {
    const a = profile.adaptive;
    if (res.reading) {
      LjodProgress.record(profile, res.reading.level, res.reading.id, res.correct);
    } else if (res.letters) {
      res.letters.forEach(function (l) {
        LjodAdaptive.record(a, l.ch, l.correct, res.latencyMs / res.letters.length, l.chosen);
        LjodMerke.noteAnswer(profile, l.ch, l.correct, res.latencyMs / res.letters.length, l.chosen);
      });
    } else {
      LjodAdaptive.record(a, res.ch, res.correct, res.latencyMs, res.chosen);
      LjodMerke.noteAnswer(profile, res.ch, res.correct, res.latencyMs, res.chosen);
    }
  }

  /* ──────────────── Slutten ──────────────── */

  function finish(host, profile, newStars) {
    const wonBadges = LjodMerke.check(profile);
    LjodState.saveProfile(profile);

    R().clear(host);
    const box = R().h('div', 'vp-panel vp-panel--plain ljod-done');

    const canvas = R().h('canvas', 'ljod-confetti');
    box.appendChild(canvas);

    box.appendChild(R().h('h2', 'heading2 no-mt', 'Godt jobba!'));

    /* Nye merke og stjerner blir feira. Resten står i skogen. */
    if (wonBadges.length) {
      const list = R().h('div', 'ljod-won');
      wonBadges.forEach(function (b) {
        const cell = R().h('div', 'ljod-badge is-earned');
        cell.appendChild(LjodShapes.badgeIcon(b.icon, 44));
        cell.appendChild(R().h('span', 'ljod-badge-title', b.title));
        list.appendChild(cell);
      });
      box.appendChild(R().h('p', 'ljod-prompt', wonBadges.length === 1 ? 'Ny bragd!' : 'Nye bragder!'));
      box.appendChild(list);
    }

    const stars = R().h('div');
    LjodSkog.renderStars(stars, profile);
    box.appendChild(stars);

    const journey = R().h('section');
    LjodProgressUI.render(journey, profile, { compact: true });
    box.appendChild(journey);

    /* Skogen er det siste eleven ser. */
    const garden = R().h('div');
    LjodSkog.renderSkog(garden, profile);
    box.appendChild(garden);

    const row = R().h('div', 'ljod-btn-row');
    const again = R().h('button', 'vp-button', 'Ein runde til');
    again.type = 'button';
    again.addEventListener('click', function () { location.reload(); });
    const back = R().h('a', 'vp-button', 'Tilbake');
    back.href = 'index.html';
    row.appendChild(again);
    const progress = LjodProgress.summary(profile);
    if (progress.current >= 6 && !progress.done) {
      const onward = R().h('a', 'vp-button vp-button--positive', 'Vidare til steg ' + progress.current);
      onward.href = 'spel.html#' + new URLSearchParams({ p: profile.id, m: 'lesestigen', level: progress.current });
      row.appendChild(onward);
    }
    row.appendChild(back);
    box.appendChild(row);

    host.appendChild(box);

    R().setMood('cool');
    LjodAudio.play('r_okt');
    requestAnimationFrame(function () { LjodSkog.celebrate(canvas); });
  }

  root.LjodMain = { start: start, TASKS_PER_SESSION: TASKS_PER_SESSION, MODES: MODES };

  // Lenkja til neste steg endrar berre fragmentet på same spelside.
  // Ei ny økt må få ein ny dokumenttilstand, utan gamle lydlovnader.
  root.addEventListener('hashchange', function () {
    const values = new URLSearchParams(location.hash.slice(1));
    if (values.has('p') && values.has('m')) {
      LjodAudio.stop();
      location.reload();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
