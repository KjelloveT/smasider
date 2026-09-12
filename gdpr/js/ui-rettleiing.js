/* ══════════════════════════════════════════════
   UI-RETTLEIING.JS — Forklaringa ved sida av feltet

   Dette er det Protokollsmia er til for. Eit rekneark kan vise deg nitten
   kolonneoverskrifter; det kan ikkje fortelje deg kvifor kolonnen står der,
   kva lova faktisk seier, kva eit godt svar ser ut som, eller kva eit tilsyn
   har hatt innvendingar mot.

   RETTLEIINGA ER ALLTID SYNLEG. Ho låg først bak eit «Kvifor spør vi om
   dette?»-trekkspel, som er rett for eit verktøy folk brukar ofte — men dette
   er eit opplæringsverktøy, og då er det å måtte klikke for å få forklaringa
   akkurat feil veg. Ein som brukar Protokollsmia gjer det nettopp fordi han
   ikkje veit kva som skal stå.

   LOVTEKSTEN STÅR ORDRETT, ikkje berre som ei lenkje. Ein lesar som må forlate
   sida for å sjå kva bokstav b faktisk seier, gjer det sjeldan. Teksten er på
   bokmål fordi den offisielle norske omsetjinga er det, og eit sitat frå ei lov
   skal ikkje omsetjast. Det blir sagt i grensesnittet, så skiftet ikkje ser ut
   som ein glipp.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const U = function () { return GD.util; };

  /**
   * Heile forklaringsspalta for eit felt: lovteksten øvst, så kvifor vi spør,
   * så døme og vanlege feil.
   *
   * @param {object} felt frå felt.js
   * @returns {HTMLElement}
   */
  function spalte(felt) {
    const u = U();
    const rot = u.el('aside', 'gd-forklaring');
    rot.setAttribute('aria-label', 'Forklaring til feltet ' + felt.etikett);

    const refs = GD.felt.lovrefar(felt);
    if (refs.length && GD.lov.harData()) {
      rot.appendChild(lovbolk(refs, felt));
    }

    const r = GD.innhald.forFelt(felt.id);
    if (r) {
      if (r.kort) rot.appendChild(u.el('p', 'gd-forklaring-kort', r.kort));

      if (r.kvifor) {
        rot.appendChild(overskrift('Kvifor spør vi om dette?'));
        rot.appendChild(u.el('p', null, r.kvifor));
      }

      if (r.dome && r.dome.length) {
        rot.appendChild(overskrift('Døme på gode svar'));
        const ul = u.el('ul', 'gd-dome');
        r.dome.forEach(function (t) { ul.appendChild(u.el('li', null, t)); });
        rot.appendChild(ul);
      }

      if (r.feil && r.feil.length) {
        rot.appendChild(overskrift('Vanlege feil'));
        const ul = u.el('ul', 'gd-feil');
        r.feil.forEach(function (t) { ul.appendChild(u.el('li', null, t)); });
        rot.appendChild(ul);
      }

      if (r.kjelde && r.kjelde.tekst) rot.appendChild(kjeldelinje(r.kjelde));
    } else if (!refs.length) {
      rot.appendChild(u.el('p', 'gd-muted', 'Inga rettleiing for dette feltet.'));
    }

    return rot;
  }

  function overskrift(tekst) {
    return U().el('h4', 'gd-forklaring-tittel', tekst);
  }

  /* ──────────────── Lovteksten ──────────────── */

  function lovbolk(refs, felt) {
    const u = U();
    const boks = u.el('div', 'gd-lov');

    /* Fyrste referansen er artikkel 30-kravet når feltet har eitt. Det er det
       som gjer feltet obligatorisk, og difor det som skal stå øvst. */
    refs.forEach(function (ref, i) {
      boks.appendChild(sitat(ref, i === 0 && !!felt.art30));
    });

    const k = GD.lov.kjelde();
    if (k) {
      const p = u.el('p', 'gd-lov-kjelde');
      p.appendChild(document.createTextNode('Ordrett frå '));
      const a = u.el('a', null, 'Lovdata');
      a.href = k.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      p.appendChild(a);
      p.appendChild(document.createTextNode(
        '. Den offisielle omsetjinga er på bokmål — eit lovsitat blir ikkje omsett.'));
      boks.appendChild(p);
    }

    return boks;
  }

  function sitat(ref, erKravet) {
    const u = U();
    const boks = u.el('div', 'gd-sitat' + (erKravet ? ' er-krav' : ''));

    const topp = u.el('div', 'gd-sitat-topp');
    if (erKravet) {
      topp.appendChild(u.el('span', 'gd-sitat-merke', 'Dette feltet er kravd av'));
    }
    topp.appendChild(GD.lov.lenkje(ref));
    const t = GD.lov.tittel(ref);
    if (t) topp.appendChild(u.el('span', 'gd-sitat-tittel', t));
    boks.appendChild(topp);

    const tk = GD.lov.tekst(ref);

    if (tk.innleiing) {
      boks.appendChild(u.el('p', 'gd-sitat-innleiing', tk.innleiing));
    }

    if (tk.punkt) {
      const d = GD.lov.del(ref);
      const p = u.el('p', 'gd-sitat-punkt');
      p.appendChild(u.el('span', 'gd-sitat-bokstav', d.bok + ')'));
      p.appendChild(document.createTextNode(' ' + tk.punkt));
      boks.appendChild(p);
    }

    if (tk.heile && tk.heile.length) {
      /* Ein heil artikkel kan vere lang — artikkel 35 har elleve nummer. Vi
         viser dei tre første og lèt resten stå bak eit klikk, så spalta ikkje
         drukna feltet ho skal forklare. */
      const synlege = tk.heile.slice(0, 3);
      const resten = tk.heile.slice(3);
      synlege.forEach(function (l) { boks.appendChild(linje(l)); });

      if (resten.length) {
        const d = u.el('details', 'gd-sitat-meir');
        d.appendChild(u.el('summary', null,
          'Resten av artikkelen (' + resten.length + ' punkt til)'));
        const kropp = u.el('div');
        resten.forEach(function (l) { kropp.appendChild(linje(l)); });
        d.appendChild(kropp);
        boks.appendChild(d);
      }
    }

    return boks;
  }

  function linje(l) {
    const u = U();
    if (l.bokstav) {
      const p = u.el('p', 'gd-sitat-punkt');
      p.appendChild(u.el('span', 'gd-sitat-bokstav', l.bokstav + ')'));
      p.appendChild(document.createTextNode(' ' + l.tekst));
      return p;
    }
    const p = u.el('p', 'gd-sitat-innleiing');
    if (l.nr) p.appendChild(u.el('span', 'gd-sitat-bokstav', l.nr + '.'));
    p.appendChild(document.createTextNode((l.nr ? ' ' : '') + l.tekst));
    return p;
  }

  function kjeldelinje(kjelde) {
    const u = U();
    const p = u.el('p', 'gd-kjelde');
    p.appendChild(document.createTextNode('Kjelde: '));
    if (kjelde.url) {
      const a = u.el('a', null, kjelde.tekst);
      a.href = kjelde.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      p.appendChild(a);
    } else {
      p.appendChild(document.createTextNode(kjelde.tekst));
    }
    return p;
  }

  /* ──────────────── Forsida ────────────────
     Forsida har eit smalare oppsett enn aktivitetsskjemaet, og der held det med
     ei kort forklaring under feltet. Lovteksten står i den fulle spalta på
     aktivitetane. */
  function hekt(rot) {
    if (!GD.innhald.harRettleiing()) return;
    const kroker = (rot || document).querySelectorAll('.gd-felt-under[data-felt]');
    Array.prototype.forEach.call(kroker, function (krok) {
      if (krok.querySelector('.gd-forklaring-kort')) return;
      const r = GD.innhald.forFelt(krok.dataset.felt);
      const felt = GD.felt.get(krok.dataset.felt);
      if (!r && !felt) return;

      if (r && r.kort) krok.appendChild(U().el('p', 'gd-forklaring-kort', r.kort));
      if (r && r.kvifor) krok.appendChild(U().el('p', 'gd-hjelp', r.kvifor));

      /* Lenkje til lova, sjølv i det korte oppsettet — det er heile poenget
         med endringa: ein referanse skal alltid vere eitt klikk frå kjelda. */
      if (felt && GD.lov.harData()) {
        const refs = GD.felt.lovrefar(felt);
        if (refs.length) {
          const p = U().el('p', 'gd-lovrad');
          refs.forEach(function (ref, i) {
            if (i) p.appendChild(document.createTextNode(' · '));
            p.appendChild(GD.lov.lenkje(ref));
          });
          krok.appendChild(p);
        }
      }
    });
  }

  root.GD = root.GD || {};
  root.GD.uiRettleiing = { hekt: hekt, spalte: spalte };
})(window);
