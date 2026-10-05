# Livslina — plan for å ferdigstille vidaregåandedelen

Dato: 5. oktober 2026
Status: arbeidsplan etter avklaring med brukaren

## Mål og avgrensing

Fyrste milepåle er eit samanhengande spel om vidaregåande, frå starten av VG1
til avslutta VG3. Fase 2 etter vidaregåande er utanfor denne leveransen.
Livslina skal vera skjult medan arbeidet held fram.

Spelet skal gjera tid og konsekvensar lette å forstå. Det skal vise korleis
økonomi, skulekvardag, arbeid, kvile og trivsel verkar saman, utan å peike ut
éin fasit for vala til eleven.

## Arbeidsrekkjefølgje

### 1. Avslutt den pågåande karakterrunden

- Registrer alle nye hår-, andlets- og klesvariantar i det autoritative
  ressursmanifestet.
- Kople variantane til prøvesida og kontroller at dei kan kombinerast med
  same meisterfigur og faste festepunkt.
- Godkjenn stilen og monteringa før ressursane blir kopla til sjølve spelet.
- Fjern eldre heile karakterillustrasjonar og atlas frå ressursprøva. Den
  lagdelte v5-banken blir den einaste aktive karakterressursprøva.

### 2. Bygg karakterbyggjar og rombutikk

- Bygg vidare på den lagdelte karakterprøva, slik at spelaren kan setje saman
  hud, andlet, hår og klede. Grunnleggjande utsjånad skal ikkje krevje pengar.
- Erstatt det enkle karaktervalet i oppstarten og `art-doll.js` med den nye
  byggjaren. Fjern den gamle teiknaren når karakteren fungerer i oppstart,
  heimskjerm, månadleg avspeling og sluttrapport.
- Start rommet med den billegaste senga, arbeidsbordet og stolen.
- La spelaren kjøpe møblar og romting seinare, med stabile ressurs-ID-ar i
  speltilstanden. Prisane skal koma frå speldata, ikkje frå bilete eller
  manifest.
- Seng, arbeidsbord og sofa kan gje små, avgrensa utslag på energi. Andre
  kjøp kan gje eit lite utslag på trivsel. Effekten skal vera synleg i tekst,
  men aldri så stor at dyrare varer blir den eine rette løysinga.
- La kjøp konkurrere med sparing og andre behov, slik at rommet blir ein del
  av økonomivalet og ikkje ein eigen poengbutikk.

### 3. Gjer tidsprogresjonen tydeleg

Vis VG1, VG2 og VG3 som ei samla tidsline med haust, vår og sommar. Ved kvar
overgang skal spelaren kunne sjå:

- kva år og halvår som er aktive, og alderen til figuren
- kor mange månader som går i neste spelsteg
- kva som er gjennomført, kva som skjer no, og kva som kjem seinare
- når sommarjobb, stipend, 18-årsdag, læretid eller studieval kan bli aktuelt

Tidslina bør følgje spelaren gjennom oppstart, heimskjerm, månadleg avspeling
og sluttrapport. Månadene kan framleis spelast av raskt, men merkinga må gjera
det lett å skjøna at eit halvår har gått og kvifor økonomi eller energi endra
seg.

### 4. Utvid dilemma- og casebiblioteket

Før nye kort blir skrivne, sorter dei 19 eksisterande hendingane etter
halvår, økonomi, trivsel, vilkår og kva val dei gir. Fyll deretter hol i ei
matrise for dei seks skulehalvåra og dei to sommarane.

Mål for innhaldet:

- kvar skulehalvårsrunde har høve til både eit økonomisk val og eit val om
  trivsel eller overskot; somme case kan handle om begge delar
- somrane får eigne situasjonar rundt arbeid, inntekt, kvile og bruk av pengar
- ei gjennomspeling viser eit handterleg tal avgjerder, medan ei ny
  gjennomspeling kan trekkje andre relevante case
- case blir utløyste av tilstand som bustad, utdanningsprogram, saldo,
  arbeidstid, energi, trivsel og tidlegare val der det passar
- vala får forståelege kort- og langtidsfølgjer, og ingen blir skrivne som
  moralske prøver med eit opplagt «rett» svar

Aktuelle område å dekkje er uventa reparasjonar, forsikring og buffer,
transport, skuleutstyr, jobb ved sida av skulen, freistingar mot eit sparemål,
overgang til hybel, sakn og nye vener, press frå vener, søvn og balanse mellom
jobb, skule og fritid. Innhaldet skal vera trygt for skulebruk og handsama
ulike familieøkonomiar med respekt.

### 5. Balanser og førebu ei avgrensa lærartest

- Gå gjennom økonomikurvene for ulike familieprofilar, utdanningsprogram,
  bustader og jobbval. Kontroller at fleire livsvegar er truverdige.
- Avgrens møbel- og trivselseffektane, slik at dei støttar refleksjon utan å
  dominere budsjett, energi eller trivsel.
- Kontroller at lagring framleis går gjennom `VyrdepilStorage`, og at
  eksporterte data har `app`- og `version`-felt.
- Flytt Livslina sine eigne bragddata til Vyrdepil sitt felles Bragd-system
  før publisering. Oppdater personverninformasjonen dersom lagringsinnhaldet
  endrar seg.
- Kontroller kjeldeår og satsar i `data/grunndata.json` før lærartest; fila
  viser no mellom anna til SIFO 2025, Lånekassen 2025–2026 og frikortgrensa
  for 2026.
- Hald Livslina utanfor `json/apps.json` og framsida til det er teke ei eiga
  avgjerd om å opne for testing.

## Ferdigkriterium for VG1–VG3

Milepålen er klar når ein elev kan fullføre alle seks skulehalvåra og dei to
sommarane, forstå kva tid som går, møta fleire typar økonomiske og
trivselsmessige val, innreia eit rom frå eit nøkternt utgangspunkt og sjå
konsekvensane av vala i sluttrapporten. Rapporten skal avslutte vidaregåande
utan å krevja at fase 2 er bygd.

Før ei lærartest skal flyten i tillegg kontrollerast i nettlesar på mobil og
desktop, med fokus på leserekkjefølgje, tidsline, casevilkår, lagring,
sluttrapport og at Livslina framleis ikkje er lenka frå framsida.
