# Endringslogg — Vyrdepil

Alle merkbare endringar i prosjektet blir dokumenterte her.
Format: [Keep a Changelog](https://keepachangelog.com/), datoar i ISO 8601.

## [Ikkje publisert]

### Lagt til
- **Flokkdeilar** — nytt verktøy for tilfeldige elevgrupper.
  - Lag og lagra fleire klasselister lokalt.
  - Vel mellom «gruppestorleik» og «tal grupper»; storleiksvising viser t.d. «8 grupper med 3–4 elevar».
  - Tilfeldig storskjerm-trekk med animasjon, kuraterte gruppenamn frå seks kategoriar (nynorsk), tilfeldige fargar og Lucide-ikon.
  - Lås enkeltgrupper og trekk resten på nytt.
  - Marker fråverande elevar direkte i trekke-skjermen.
  - Valfri «Utvida administrasjon» med PIN (SHA-256 + salt): ja/kanskje/aldri-relasjonar mellom elevar. «Aldri»-par hamnar aldri i same gruppe.
  - «Fjern tilleggsinfo» beheld elevnamn men slettar relasjonar og PIN.
  - Eksport og import av JSON. Toveis import-snarveg frå Klassekart.
- **Ordaklok** — nytt verktøy for gloseøving (inspirert av glosepus.no).
  - Fire spelmodusar: skriv svar (med tjuvtitt og bokstavbokser), multiple choice, flashcard (sjølv-vurdering) og matching.
  - Liste-editor med CRUD, masseinnliming (fleire format), JSON-import og JSON-eksport.
  - Deling av lister via URL — heile lista pakka i lenkja med `CompressionStream('gzip')` der det er mogeleg.
  - Leitner spaced repetition (5 bokser) for å prioritere ord eleven strevar med.
  - Toppscore per liste og modus, lagra i `VyrdepilStorage`.
  - Innebygd dømeliste (10 engelsk-norske ord) for rask oppstart.

### Endra
- `js/neo-header.js`: lagt til Ordaklok i dropdown-menyen og mobilnavigasjonen.
- `index.html` (rota): lagt til kort for Ordaklok og personverninfo om kva som blir lagra.
- **Ordaklok**: tilfeldige replikkar frå Vyrde i oppsett-skjermen (100 setningar).
- **Ordaklok — Tevling**: stipla skiljelinje mellom venstre og høgre side, Vyrde står i ein tydeleg sirkel i midten over chips-laget.

### Fiksa
- **Ordaklok — Tevling**: chips «blinka» tilbake til opphavleg posisjon ved rett match etter smash-animasjonen. Dei ligg no usynlege når dei først er smasha.
- **Ordaklok — alle modus**: lange begrep og setningar (t.d. naturfag-definisjonar) sprengde boksane. Innført lengde-basert font-skalering og ordbryting i alle fire modus. I Skriv-modus byter vi automatisk til vanleg input når svaret inneheld mellomrom eller er over 20 teikn (bokstavboksar er framleis default for korte ord). Tevling-chips wrappar no til fleire liner i staden for å bli kutta.
