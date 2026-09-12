/* ══════════════════════════════════════════════
   UTIL.JS — Små hjelparar i Protokollsmia

   Det meste ligg i js/vyrdepil-util.js (`Vy`), og denne fila peikar vidare dit
   etter AGENTS.md §5.1.1. Det som står att her er det som er særskilt for
   Protokollsmia.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /** Er verdien tom, eller berre kvitrom? */
  function tom(verdi) {
    return !String(verdi == null ? '' : verdi).trim();
  }

  /**
   * Normaliserer tekst for samanlikning i kvalitetssjekken: små bokstavar,
   * aksentar bort, fleire mellomrom til eitt.
   *
   * Æ, ø og å blir gøymde bak siffer medan aksentane blir strippa, elles
   * ville ringen over å forsvunne og «på» blitt «pa». Same grepet som
   * `leitekryss/js/util.js` brukar på ord til rutenettet.
   */
  function norm(tekst) {
    return String(tekst == null ? '' : tekst)
      .toLowerCase()
      .replace(/æ/g, '').replace(/ø/g, '').replace(/å/g, '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(//g, 'æ').replace(//g, 'ø').replace(//g, 'å')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Talet på ord i ein tekst. Brukt av `for-kort`-regelen i sjekken. */
  function ordtal(tekst) {
    const t = String(tekst == null ? '' : tekst).trim();
    return t ? t.split(/\s+/).length : 0;
  }

  /** Knapp med ikon framfor teksten. */
  function ikonknapp(ikon, tekst, klasse) {
    const btn = Vy.el('button', klasse || 'btn');
    btn.type = 'button';
    const sp = Vy.el('span');
    /* ICON() gjev fast SVG-markup frå vår eigen ikonmodul, aldri brukartekst. */
    if (typeof ICON === 'function') sp.innerHTML = ICON(ikon, 16);
    btn.appendChild(sp);
    if (tekst) btn.appendChild(document.createTextNode(tekst));
    else btn.setAttribute('aria-label', ikon);
    return btn;
  }

  /* ──────────────── Tekstfelt som veks ────────────────

     Eit textarea med fast høgd tvingar deg til å skrive i eit kikkhol: du ser
     tre linjer av gongen av eit svar som kan vere ti. Her veks feltet med
     innhaldet.

     KORLEIS: `height: auto` fyrst, så `scrollHeight`. Utan nullstillinga måler
     vi den høgda vi alt har sett, og feltet ville berre kunne vekse — aldri
     krympe når nokon slettar ein paragraf.

     BORDER-DELTA. Felta har `box-sizing: border-box` og 3 px ramme, men
     `scrollHeight` tel ikkje ramma. Utan påslaget ville kvar måling bli seks
     piksel for låg, og siste linja ville bli klipt. `offsetHeight - clientHeight`
     gjev nøyaktig den ramma, uansett kva stilarket seier.

     TAKET er der for det tilfellet nokon limer inn eit heilt dokument. Utan det
     kunne feltet bli titusen piksel høgt, og knappane under uråd å nå. Over
     taket får feltet si eiga rulling. */
  const MAKS_VOKS = 0.5;   // av vindaugshøgda

  function voks(ta) {
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    /* Eit felt i ei skjult fane har scrollHeight 0, og då ville vi sett høgda
       til ramma åleine. Lat det stå til fana blir synleg. */
    if (!ta.offsetParent && ta.offsetHeight === 0) return;

    const ramme = ta.offsetHeight - ta.clientHeight;
    ta.style.height = 'auto';
    const trengst = ta.scrollHeight + ramme;
    const tak = Math.round(window.innerHeight * MAKS_VOKS);

    if (trengst > tak) {
      ta.style.height = tak + 'px';
      ta.style.overflowY = 'auto';
    } else {
      ta.style.height = trengst + 'px';
      ta.style.overflowY = 'hidden';
    }
  }

  /**
   * Måler alle tekstfelta under `rot` på nytt.
   *
   * Må kallast etter at felta står i DOM-en — eit textarea som ikkje er sett
   * inn enno har `scrollHeight` 0 — og på nytt når ei skjult fane blir synleg,
   * av same grunn.
   */
  function voksAlle(rot) {
    const felt = (rot || document).querySelectorAll('textarea.gd-textarea');
    Array.prototype.forEach.call(felt, voks);
  }

  /**
   * Eit skjemafelt: etikett, inndata og plass til hjelpetekst under.
   * Returnerer både wrapperen og sjølve inndatafeltet, så den som kallar
   * slepp å leite han opp att.
   */
  function feltrad(felt, verdi, onEndra) {
    const wrap = Vy.el('div', 'gd-felt');
    const id = 'f_' + felt.id;

    const merkelapp = Vy.el('label', 'gd-etikett', felt.etikett);
    merkelapp.htmlFor = id;
    wrap.appendChild(merkelapp);

    let inn;
    if (felt.type === 'lang') {
      inn = Vy.el('textarea', 'gd-textarea');
      inn.rows = 3;
    } else if (felt.type === 'val' || felt.type === 'jaNei') {
      inn = Vy.el('select', 'gd-select');
      const valg = felt.type === 'jaNei'
        ? ['', 'Nei', 'Ja', 'Veit ikkje']
        : [''].concat(felt.val || []);
      valg.forEach(function (v) {
        const o = Vy.el('option', null, v || '— vel —');
        o.value = v;
        inn.appendChild(o);
      });
    } else {
      inn = Vy.el('input', 'gd-input');
      inn.type = 'text';
    }

    inn.id = id;
    inn.value = verdi == null ? '' : verdi;
    inn.addEventListener('input', function () {
      onEndra(inn.value);
      voks(inn);
    });
    inn.addEventListener('change', function () { onEndra(inn.value); });
    wrap.appendChild(inn);

    /* Plass til rettleiing og til merknader frå sjekken. Står tom til nokon
       fyller han — men han skal finnast frå starten, så innhaldet ikkje
       dyttar skjemaet nedover når det kjem. */
    const under = Vy.el('div', 'gd-felt-under');
    wrap.appendChild(under);

    return { rot: wrap, inn: inn, under: under };
  }

  root.GD = root.GD || {};
  root.GD.util = {
    tom: tom,
    norm: norm,
    ordtal: ordtal,
    ikonknapp: ikonknapp,
    feltrad: feltrad,
    voks: voks,
    voksAlle: voksAlle,

    /* ---- Vidare til fellesmodulen ---- */
    el: Vy.el,
    uuid: function () { return Vy.uuid('gd'); },
    slug: function (t, f) { return Vy.slug(t, f || 'protokoll'); },
    escapeHtml: Vy.escapeHtml,
    downloadBlob: Vy.downloadBlob,
    downloadJson: Vy.downloadJson,
    openModal: Vy.openModal,
    closeModal: Vy.closeModal,
    bindOverlayClose: Vy.bindOverlayClose,
    toast: Vy.toast
  };
})(window);
