/* utforsk.js — fri utforsking av tidsrepresentasjonar.
   Alle tre klokketypar (analog, digital, tekst) er synkroniserte:
   dra visarane ELLER bruk +/- på digital — begge delar oppdaterer dei andre.
   Ingen spørsmål eller poeng; brukaren berre utforskar. */
(function () {
  'use strict';

  window.TidvisModes = window.TidvisModes || {};
  window.TidvisModes.utforsk = {
    flow: 'board',
    needsDirection: false,

    startBoard: function (container, session, api) {
      session.total = 0; // ingen framdrift / resultat-skjerm

      const snap = TidvisTime.snapStep(session.level);

      // Start med ei tilfeldig tid frå gjeldande nivå
      var init = TidvisTime.randomTime(session.level);
      var state = { h: init.h, m: init.m };

      // ---- DOM-hjelpar ----
      function el(cls, tag) {
        var e = document.createElement(tag || 'div');
        if (cls) e.className = cls;
        return e;
      }

      // ---- Hovud-wrapper ----
      var wrap = el('tv-utforsk');

      var hint = el('tv-utforsk__title');
      hint.textContent = 'Endre visarane eller bruk + / − — alle tre viser same tid';
      wrap.appendChild(hint);

      var grid = el('tv-utforsk__grid');

      // ====================================================
      // KOLONNE 1 — ANALOG
      // ====================================================
      var anaCol = el('tv-utforsk__col');
      var anaHead = el('tv-utforsk__head');
      anaHead.textContent = 'Analog';
      anaCol.appendChild(anaHead);

      var clock = TidvisClock.analog({
        h: state.h, m: state.m,
        size: 200,
        accent: 'teal',
        draggable: true,
        snapStep: snap,
        onChange: function (t) {
          state.h = t.h;
          state.m = t.m;
          syncDigital();
          syncText();
        }
      });
      anaCol.appendChild(clock.el);
      grid.appendChild(anaCol);

      // ====================================================
      // KOLONNE 2 — DIGITAL (+/- spinnarar)
      // ====================================================
      var digCol = el('tv-utforsk__col');
      var digHead = el('tv-utforsk__head');
      digHead.textContent = 'Digital';
      digCol.appendChild(digHead);

      var lcdWrap = TidvisClock.lcd({
        time: TidvisTime.toDigital(state),
        label: ' ',
        size: 'clamp(30px,5vw,52px)'
      });
      digCol.appendChild(lcdWrap);

      // Spinnarar
      var spinner = el('tv-utforsk__spinner');

      function makeSpinRow(labelText, onMinus, onPlus) {
        var row = el('tv-utforsk__spin-row');

        var lbl = el('tv-utforsk__spin-label', 'span');
        lbl.textContent = labelText;

        var bMinus = el('btn btn--ghost btn--sm', 'button');
        bMinus.type = 'button';
        bMinus.setAttribute('aria-label', labelText + ' ned');
        bMinus.appendChild(TidvisIcons.el('minus', { size: 18 }));
        bMinus.addEventListener('click', onMinus);

        var bPlus = el('btn btn--ghost btn--sm', 'button');
        bPlus.type = 'button';
        bPlus.setAttribute('aria-label', labelText + ' opp');
        bPlus.appendChild(TidvisIcons.el('plus', { size: 18 }));
        bPlus.addEventListener('click', onPlus);

        row.appendChild(lbl);
        row.appendChild(bMinus);
        row.appendChild(bPlus);
        return row;
      }

      // Time +/-
      spinner.appendChild(makeSpinRow(
        'Time',
        function () {                                         // minus
          state.h = ((state.h - 2 + 12) % 12) + 1;
          syncAll();
        },
        function () {                                         // pluss
          state.h = (state.h % 12) + 1;
          syncAll();
        }
      ));

      // Minutt +/-
      spinner.appendChild(makeSpinRow(
        'Minutt',
        function () {                                         // minus
          state.m = ((state.m - snap) % 60 + 60) % 60;
          syncAll();
        },
        function () {                                         // pluss
          state.m = (state.m + snap) % 60;
          syncAll();
        }
      ));

      digCol.appendChild(spinner);

      // Hint om snap-steg
      var snapHint = el('tv-utforsk__sub');
      snapHint.textContent = 'Steg: ' + snap + ' minutt  ·  ' + TidvisTime.LEVEL_NAMES[session.level];
      digCol.appendChild(snapHint);

      grid.appendChild(digCol);

      // ====================================================
      // KOLONNE 3 — TEKST
      // ====================================================
      var txtCol = el('tv-utforsk__col');
      var txtHead = el('tv-utforsk__head');
      txtHead.textContent = 'Tekst';
      txtCol.appendChild(txtHead);

      var textEl = el('tv-utforsk__text');
      textEl.textContent = TidvisTime.toText(state);
      txtCol.appendChild(textEl);

      grid.appendChild(txtCol);

      wrap.appendChild(grid);
      container.appendChild(wrap);

      // ====================================================
      // SYNK-HJELPARAR
      // ====================================================
      function syncDigital() {
        var val = lcdWrap.querySelector('.val');
        if (val) val.textContent = TidvisTime.toDigital(state);
      }
      function syncText() {
        textEl.textContent = TidvisTime.toText(state);
      }
      function syncAll() {
        clock.setTime(state.h, state.m);
        syncDigital();
        syncText();
      }
    }
  };
})();
