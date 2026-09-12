/* ══════════════════════════════════════════════
   UI-SKJEMA.JS — Éin behandlingsaktivitet, felt for felt

   Skjemaet blir rendra frå `felt.js`, ikkje skrive ut i HTML. Nitten felt ×
   handskriven markup er nitten stader ein etikett kan kome ut av takt med det
   koden faktisk les.

   REKKJEFØLGJA ER IKKJE DATATILSYNET SI HER. I reknearket deira står kolonnane
   A til S i ei rekkje som passar eit rekneark: administrativt først, så
   innhaldet. På skjermen er det feil veg. Vi grupperer i staden etter kva
   spørsmål ein faktisk stiller seg når ein kartlegg ei behandling:

     1. Kva gjer vi, og kvifor?      formål og avgrensing
     2. Kven og kva handlar det om?  registrerte og opplysningar
     3. Kvar går opplysningane?      kjelde, mottakarar, tredjeland
     4. Kva har vi lov til?          behandlingsgrunnlag
     5. Korleis passar vi på dei?    system, sletting, sikring

   .xlsx-eksporten set dei tilbake i Datatilsynet si rekkjefølgje, så fila
   framleis er til å kjenne att. Skjermen og reknearket har ulike jobbar.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const U = function () { return GD.util; };
  let vert = null;

  const BOLKAR = [
    { tittel: '1. Kva gjer de, og kvifor?',
      hjelp: 'Éi behandling har eitt formål. Har de to formål med dei same opplysningane, er det to aktivitetar.',
      felt: ['kvaGjeld', 'formaal', 'funksjonsomraade', 'internansvar'] },

    { tittel: '2. Kven og kva handlar det om?',
      hjelp: 'Kven opplysningane gjeld, og kva slag opplysningar det er.',
      felt: ['registrerte', 'opplysningar'] },

    { tittel: '3. Kvar går opplysningane?',
      hjelp: 'Kvar dei kjem frå, kven som får dei, og om dei forlèt EØS.',
      felt: ['kjelde', 'mottakarar', 'databehandlarar', 'fellesansvar', 'tredjeland', 'garantiar'] },

    { tittel: '4. Kva har de lov til?',
      hjelp: 'Behandlingsgrunnlaget er ikkje kravd av artikkel 30, men er det første eit tilsyn spør om.',
      felt: ['grunnlag6', 'grunnlagVising', 'grunnlag910'] },

    { tittel: '5. Korleis passar de på opplysningane?',
      hjelp: 'Kvar dei ligg, kor lenge, og kva som vernar dei.',
      felt: ['system', 'slettefrist', 'sikringstiltak', 'hoegRisiko'] }
  ];

  function init(hostId) {
    vert = document.getElementById(hostId);
    if (!vert) return;
    GD.state.onChange(function (emne) {
      /* Ikkje teikn på 'aktivitet' — då ville feltet du skriv i bli bygd på
         nytt for kvart tasteslag, og markøren hoppe til slutten. */
      if (emne === 'val' || emne === 'load') teikn();
    });
    teikn();
  }

  function teikn() {
    if (!vert) return;
    const u = U();
    vert.textContent = '';

    const a = GD.state.aktiv();
    if (!a) {
      vert.appendChild(u.el('p', 'gd-muted',
        'Vel ein behandlingsaktivitet i lista, eller legg til ein ny.'));
      return;
    }

    BOLKAR.forEach(function (bolk) {
      const seksjon = u.el('section', 'gd-gruppe');
      seksjon.appendChild(u.el('h3', 'heading4 no-mt', bolk.tittel));
      if (bolk.hjelp) seksjon.appendChild(u.el('p', 'gd-hjelp', bolk.hjelp));

      bolk.felt.forEach(function (id) {
        const felt = GD.felt.get(id);
        if (!felt) return;
        if (!GD.felt.synleg(felt, a)) return;
        seksjon.appendChild(feltpar(felt, a));
      });

      vert.appendChild(seksjon);
    });

    /* Tekstfelta kan berre målast når dei står i DOM-en — eit textarea som
       ikkje er sett inn har scrollHeight 0. Difor her, ikkje i feltrad(). */
    U().voksAlle(vert);
  }

  /**
   * Eitt felt som to spalter: inndata til venstre, forklaring til høgre.
   *
   * KVIFOR TO SPALTER. Rettleiinga låg først under feltet, bak eit trekkspel.
   * Det er rett for eit verktøy folk brukar ofte, og feil for eit
   * opplæringsverktøy: den som treng forklaringa er nettopp den som ikkje veit
   * at han skal klikke etter henne. Med to spalter står lovteksten og
   * forklaringa ved sida av feltet medan ein skriv, og ein slepp å velje.
   *
   * På smal skjerm fell spaltene under kvarandre — med forklaringa FØRST,
   * sidan ho er det ein les før ein svarar.
   */
  function feltpar(felt, aktivitet) {
    const u = U();
    const par = u.el('div', 'gd-par');

    const venstre = u.el('div', 'gd-par-skriv');
    const rad = u.feltrad(felt, aktivitet[felt.id], function (verdi) {
      GD.state.settFelt(aktivitet.id, felt.id, verdi);
      /* Eit felt som styrer om eit anna skal visast, må teikne skjemaet på
         nytt — men berre når det faktisk endrar synlegheita. */
      if (felt.id === 'grunnlag6') teikn();
    });

    const etikett = rad.rot.querySelector('.gd-etikett');
    if (felt.art30) {
      /* Merket er ei LENKJE til lova, ikkje berre ein tekst. Ein referanse
         skal alltid vere eitt klikk frå kjelda si. */
      const ref = '30.1.' + felt.art30;
      if (root.GD.lov && GD.lov.harData()) {
        const a = GD.lov.lenkje(ref, { kort: true });
        a.className = 'gd-krav gd-krav-maa gd-krav-lenkje';
        etikett.appendChild(a);
      } else {
        etikett.appendChild(u.el('span', 'gd-krav gd-krav-maa', GD.lov
          ? GD.lov.etikett(ref, true) : 'Art. 30 nr. 1 ' + felt.art30));
      }
    } else {
      etikett.appendChild(u.el('span', 'gd-krav gd-krav-kan', 'Tillegg'));
    }
    venstre.appendChild(rad.rot);

    const hoegre = root.GD.uiRettleiing
      ? GD.uiRettleiing.spalte(felt)
      : u.el('aside', 'gd-forklaring');

    par.appendChild(venstre);
    par.appendChild(hoegre);
    return par;
  }

  root.GD = root.GD || {};
  root.GD.uiSkjema = { init: init, teikn: teikn, feltpar: feltpar, BOLKAR: BOLKAR };
})(window);
