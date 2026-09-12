/* ══════════════════════════════════════════════
   LOV.JS — Oppslag i lovteksten

   Løyser ein referanse som «30.1.b» opp til tre ting: etiketten
   («Artikkel 30 nr. 1 bokstav b»), den ordrette lovteksten, og ei lenkje til
   Lovdata.

   REFERANSEFORMA er `artikkel.nummer.bokstav`, der dei to siste er valfrie:
     "30"       heile artikkel 30
     "30.1"     artikkel 30 nr. 1
     "30.1.b"   artikkel 30 nr. 1 bokstav b
     "32"       heile artikkel 32

   TEKSTEN ER PÅ BOKMÅL, og det er med vilje. Den offisielle norske omsetjinga
   av forordninga er på bokmål, og eit sitat frå ei lov skal ikkje omsetjast —
   gjer ein det, siterer ein ikkje lenger. Resten av grensesnittet er nynorsk,
   og skiljet blir merkt i grensesnittet så det ikkje ser ut som ein glipp.

   LENKJA PEIKAR PÅ ARTIKKELEN, ikkje på kapittelet. Lovdata har ein eigen URL
   per artikkel — `/gdpr/ARTIKKEL_30` — og han landar rett på teksten. Den
   gamle kapittel-URL-en med eit fragment gjorde det ikkje alltid.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  let lager = null;

  function settData(data) {
    lager = data;
  }

  function artikkel(nr) {
    if (!lager || !lager.artiklar) return null;
    return lager.artiklar[String(nr)] || null;
  }

  /**
   * Deler ein referanse i delane sine.
   * @returns {{art:string, nr:string|null, bok:string|null}|null}
   */
  function del(ref) {
    const m = String(ref || '').match(/^(\d+)(?:\.(\d+))?(?:\.([a-zæøå]))?$/);
    if (!m) return null;
    return { art: m[1], nr: m[2] || null, bok: m[3] || null };
  }

  /** «Artikkel 30 nr. 1 bokstav b» */
  function etikett(ref, kort) {
    const d = del(ref);
    if (!d) return String(ref);
    let s = (kort ? 'Art. ' : 'Artikkel ') + d.art;
    if (d.nr) s += ' nr. ' + d.nr;
    if (d.bok) s += (kort ? ' ' : ' bokstav ') + d.bok;
    return s;
  }

  function url(ref) {
    const d = del(ref);
    const a = d && artikkel(d.art);
    if (a && a.url) return a.url;
    return 'https://lovdata.no/dokument/NL/lov/2018-06-15-38';
  }

  function tittel(ref) {
    const d = del(ref);
    const a = d && artikkel(d.art);
    return a ? a.tittel : '';
  }

  /**
   * Sjølve lovteksten for referansen.
   *
   * For eit bokstavpunkt gjev vi BÅDE innleiinga til nummeret og punktet, for
   * eit bokstavpunkt åleine er ofte uforståeleg: «formålene med behandlingen»
   * seier ingenting utan «Nevnte protokoll skal inneholde følgende informasjon»
   * framfor seg.
   *
   * @returns {{innleiing:string|null, punkt:string|null, heile:Array|null}}
   */
  function tekst(ref) {
    const d = del(ref);
    const a = d && artikkel(d.art);
    if (!a) return { innleiing: null, punkt: null, heile: null };

    if (d.bok) {
      const gruppe = a.bokstav[d.nr || '1'] || {};
      return {
        innleiing: (a.avsnitt && a.avsnitt[d.nr || '1']) || null,
        punkt: gruppe[d.bok] || null,
        heile: null
      };
    }

    if (d.nr) {
      const punkter = a.bokstav[d.nr];
      return {
        innleiing: (a.avsnitt && a.avsnitt[d.nr]) || null,
        punkt: null,
        heile: punkter ? Object.keys(punkter).map(function (b) {
          return { bokstav: b, tekst: punkter[b] };
        }) : null
      };
    }

    /* Heile artikkelen. */
    const alle = [];
    Object.keys(a.avsnitt || {}).forEach(function (n) {
      alle.push({ nr: n === '0' ? null : n, tekst: a.avsnitt[n] });
      const punkter = (a.bokstav || {})[n];
      if (punkter) {
        Object.keys(punkter).forEach(function (b) {
          alle.push({ bokstav: b, tekst: punkter[b] });
        });
      }
    });
    return { innleiing: null, punkt: null, heile: alle };
  }

  /**
   * Ei ferdig lenkje til Lovdata for referansen. Brukt overalt der ein
   * artikkel blir nemnd, så brukaren alltid er eitt klikk frå kjelda.
   *
   * @param {string} ref  t.d. '30.1.b'
   * @param {object} [o]  { kort: bool, tekst: string } — eigen lenkjetekst
   */
  function lenkje(ref, o) {
    o = o || {};
    const a = document.createElement('a');
    a.href = url(ref);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'gd-lovlenkje';
    a.textContent = o.tekst || etikett(ref, o.kort);
    const t = tittel(ref);
    a.title = t ? etikett(ref) + ' — ' + t + ' (opnar Lovdata)' : 'Opnar Lovdata';
    return a;
  }

  function harData() {
    return !!(lager && lager.artiklar);
  }

  function kjelde() {
    return (lager && lager._kjelde) || null;
  }

  root.GD = root.GD || {};
  root.GD.lov = {
    settData: settData,
    del: del,
    etikett: etikett,
    url: url,
    tittel: tittel,
    tekst: tekst,
    lenkje: lenkje,
    harData: harData,
    kjelde: kjelde
  };
})(window);
