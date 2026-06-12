# Endringslogg — Vyrdepil

Alle merkbare endringar i prosjektet blir dokumenterte her.
Format: [Keep a Changelog](https://keepachangelog.com/), datoar i ISO 8601.

## [Ikkje publisert]

### Lagt til
- **Listesmia** (wikidata-tester) — bygd om frå rein SPARQL-tester til ein veivisar som finn kortlister til Heimsank utan at ein treng kunne SPARQL.
  - Steg-for-steg: søk etter emne med vanlege ord (Wikidata-søke-API på norsk), snøggval-chips (hunderasar, fjell, vulkanar m.fl.), krav (må ha bilete / Wikipedia-artikkel), filter (t.d. avgrens til eit land) og val av ekstra kolonnar.
  - Artikkel-lenkja vel beste tilgjengelege Wikipedia-utgåve: nynorsk → bokmål → engelsk.
  - Verktøyet undersøkjer automatisk kva opplysningar som faktisk finst for det valde emnet (stikkprøve på 200 element) og føreslår dei som kolonnar og filter.
  - Eksport tilpassa Heimsank: CSV, ferdig `categories.json`-utdrag (med rett statType/statField) og generert rarity-fil med justerbar prosentfordeling.
  - Duplikatrader blir fjerna automatisk, og element utan namn (berre Q-kode) kan hoppast over.
  - Talverdiar (areal, høgd, masse o.l.) blir henta som normaliserte SI-verdiar slik at sortering og samanlikning blir rett sjølv når Wikidata blandar einingar (km² mot m²).
  - Vel ein eit statistikk-felt, blir sorteringa automatisk sett til det feltet — namnesortering på store emne gjev vilkårlege treff fordi Wikidata fyller inn namn først etter LIMIT (A–Å blir difor sortert lokalt).
  - Den genererte SPARQL-spørjinga ligg open under «Avansert» og kan redigerast og køyrast direkte (gamal funksjonalitet er altså bevart).
  - Hentar data frå Wikidata/Wikipedia (eksternt API) — godkjent unntak; ingen brukardata blir sende, og ingenting blir lagra lokalt.
- **Heimsank** — tre nye kortkategoriar laga med Listesmia: matrettar, grunnstoff og videospel.
- **Dagsvegen** — ny dagsplan-skjerm for klasserommet.
  - Dagsplan med fag, friminutt og notat — tidsstyrt slik at aktiv økt blir utheva automatisk, med progresjonsstrek og stor datolinje («måndag 11. juni — veke 24»).
  - Plan for timen: aktivitetar med varigheit, tidsline med no-markør og nedteljing til neste byte. +5/−5-knappar per aktivitet: meirtid blir henta frå fleksible buffer-aktivitetar slik at slutten står fast; rest blir vist som raud overtid inn i friminuttet. Diskret «X min att»-varsel før kvart byte.
  - Forhandsdefinert fagliste med emoji (redigerbar) og eigenbygd emoji-veljar med ~150 kuraterte, skulerelevante emoji i seks kategoriar. (Dagsvegen har eksplisitt unntak frå emoji-forbodet — gjeld berre faginnhald, UI-et brukar Lucide.)
  - Widgetar: nedteljar med fargeskifte grøn→gul→raud og blink ved null (ingen lyd), stoppeklokke med rundetider, trafikklys for arbeidsro, analog+digital hjørneklokke (gjenbrukar TidvisClock), ro-modus med pustesirkel og hjernepause-trekk (10 redigerbare aktivitetar).
  - Touch-teiknelag over heile skjermen med fargeval, tre pennebreidder og viskelêr — flyktig, blir aldri lagra.
  - Plasserbare tekstboksar i tre stilar: vanleg, huskelapp (post-it med handskrift-font) og bursdagsbanner.
  - Vekemalar (éin per vekedag), namngjevne planar og JSON-eksport/-import (`app: "dagsvegen"`, `version: 1`) via `VyrdepilStorage`.
  - Dev-parameter `?testTime=HH:MM` for å teste tidsstyringa.
- **Ordskodde** — ny ordsky-generator.
  - Lim inn ein tekst og få ei ordsky der dei mest brukte orda er størst (kvadratrot-skalering).
  - Automatisk filtrering av høgfrekvente småord på nynorsk, bokmål og engelsk — kvart ord kan slåast av/på i ordlista etterpå.
  - Tre former (sirkel, firkant, hjarte) og seks forhandsdefinerte tema (Klassisk, Nordlys, Krit, Solnedgang, Skrivemaskin, Godteri) som kan justerast fritt: skrifttype (systemfontar), fem ordfargar, bakgrunn, tal på ord og loddrette ord.
  - Eigenutvikla utleggingsalgoritme i vanilla JS: arkimedisk spiral med kollisjonsgrid og formmasker. Seeded PRNG gjer at lagra skyer alltid blir teikna likt.
  - Eksport som PNG (med eller utan bakgrunn), SVG og utskrift. Lagra namngjevne skyer med JSON-eksport/-import (`app: "ordskodde"`, `version: 1`) via `VyrdepilStorage`.
  - Innebygd eksempeltekst: utdrag frå Wikipedia-artikkelen om taco på nynorsk (CC BY-SA 4.0, med kjeldetilvising).
- **Tidvis** — nytt klokkespel for å øve på å lese tid.
  - Tre representasjonar: analog urskive (SVG), digital (HH:MM) og tekst på nynorsk (t.d. «kvart på ti», «fem på halv ti»).
  - Fire vanskegrader: heile & halve, kvart, fem & ti, alle minutt.
  - Spelmodusar: «Les av» (fleirval), «Still visarane» (dra dei analoge visarane), «Para» (match tid på tvers av representasjonar) og «Snøggstart» (60 sek blanda).
  - Modusveljar i starten med valbar retning (t.d. Analog→Tekst, Digital→Analog, Bland alt).
  - Poeng med combo-bonus og tidsbonus, streak, XP/nivå-progresjon og åtte merke (m.a. Kvartkongen, Lynrask, Minuttmeister, Nattugle, Hundreklubben).
  - Eige neobrutalistisk uttrykk under `.tv`-namespace (sanksjonert avvik), med eigne tokens og system-fontar. Synkar tema med den globale temaveljaren.
  - All framgang (toppscore, nivå/XP, merke, lagra oppsett) lagra lokalt via `VyrdepilStorage`.
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
- **Dagsvegen** — ombygd layout etter tilbakemeldingar frå klasserommet.
  - Verktøyrada øvst er bytt ut med ein samanleggbar venstremeny (berre ikon samanlagd, ikon + namn utvida). Toppen har no berre datolinja, og sida nyttar heile skjermbreidda.
  - Dagsplanen og «Plan for timen» er no to frittståande, flyttbare panel (som widgetane) som kan dragast dit ein vil og slåast av/på frå menyen — av gjev blank tavle. Posisjon og av/på blir hugsa.
  - Hero-boksen kan lukkast med ✕ og held seg lukka. Ny rettleiing «Slik brukar du Dagsvegen» i menyen og i tom-tilstanden.
  - Tekstboksane kan no skalerast i både breidde og høgde (eige handtak som òg verkar på touch), og tekststorleiken kan justerast med A−/A+. Alt blir lagra per boks.
  - «Ingen plan for i dag enno»-boksen kan lukkast med ✕ — då står skjermen blank og kan fyllast fritt med teikning, tekstboksar og widgetar. Valet blir hugsa.
  - Ny **Snøggøkt** i menyen: start éi enkel økt no utan å lage dagsplan — med fag, varigheit og same aktivitetsplan (fleksibel tid, +5/−5) som i dagsplanen. Står det noko anna på planen akkurat då, blir det avslutta og snøggøkta tek over.
- **Frødesams** — full migrering til neobrutalisme-designet og vyrdepil-reglane.
  - Bytt eigen `css/style.css` og eigen `<header>` ut med `neobrutalisme.css`, `<neo-header>` og temastøtte (lyst/mørkt, alle 21 tema). `css/style.css` er no berre spel-spesifikke utvidingar (svar-brett, strike-display, display-modus) oppå designsystemet.
  - Flytta lagring frå rå `localStorage`-nøklar til felles `VyrdepilStorage` under nøkkelen `frodesams`. Eksportformatet har no `app: "frodesams"` og `version: 1`.
  - Splitta monolittisk kode i IIFE-modular: `state.js`, `storage.js`, `sync.js`, `game.js`, `editor.js`, `saved.js`, `app.js`, `display.js`.
  - Slå saman `index.html` og `controller.html` — `index.html` er quiz-master, `display.html` er storskjerm. `controller.html` er fjerna.
  - UX-forbetringar: tydelege stryk-merke (✕, raud farge), bekreft/angre-steg ved poenggjeving (UX2), flip-animasjon ved avsløring (UX3), tastaturnavigasjon (taltastar 1–9 for svar, mellomrom for neste) og «eksporter alle» med korrekt `app`/`version`-konvolutt.
  - `index.html` (rota): lagt til personvern-accordion-innslag for Frødesams.
- **Frødebrett** — full migrering til neobrutalisme-designet og vyrdepil-reglane.
  - Bytt eige `css/style.css` (1163 liner) og eigen `<header>` ut med `neobrutalisme.css`, `<neo-header>` og temastøtte (lyst/mørkt, alle 21 tema). `css/style.css` er no berre spel-spesifikke utvidingar (jeopardy-grid, podium, daglegdobbel) oppå designsystemet.
  - Flytta lagring frå rå `localStorage`-nøklar (`frodebrett_*`) til felles `VyrdepilStorage`. Eksportformatet har no `app: "frodebrett"` og `version: 1`.
  - Splitta den monolittiske `app.js` (1253 liner) i IIFE-modular: `state.js`, `storage.js`, `board.js`, `editor.js`, `saved.js`, `app.js`.
  - UX-forbetringar: tydeleg «Dagens dobbel!»-banner med animasjon, bekreft/angre-steg ved poenggjeving, tastaturnavigasjon (pilar, taltastar 1–6 for lag), «eksporter alle frøder» og synleg/klikkbart neste lag på tur.
  - `index.html` (rota): oppdatert personvern-accordion for Frødebrett (lagring under `VyrdepilStorage`).
- `js/neo-header.js`: lagt til Tidvis under «Spel» i dropdown-menyen og mobilnavigasjonen.
- `index.html` (rota): lagt til kort for Tidvis under «Spel» og personverninfo om kva som blir lagra.
- `js/neo-header.js`: lagt til Ordaklok i dropdown-menyen og mobilnavigasjonen.
- `index.html` (rota): lagt til kort for Ordaklok og personverninfo om kva som blir lagra.
- **Ordaklok**: tilfeldige replikkar frå Vyrde i oppsett-skjermen (100 setningar).
- **Ordaklok — Tevling**: stipla skiljelinje mellom venstre og høgre side, Vyrde står i ein tydeleg sirkel i midten over chips-laget.

### Fiksa
- **Dagsvegen**: økter byter ikkje lenger plass medan ein framleis skriv i starttid-feltet — sorteringa skjer først når feltet mistar fokus. Varigheits-felt byggjer heller ikkje om skjemaet midt i skrivinga (minutt-summen blir oppdatert direkte).
- **Frødebrett**: brukarinnhald (quiz-titlar, lagnamn) blir no rendra trygt med `textContent`/`createElement` i staden for `innerHTML` (XSS-vern, viktig for importerte `.json`-frøder). Lagt til `aria-label` på ikon-knappar, Escape lukkar alle modalar og `:focus-visible` frå designsystemet.
- **Ordaklok — Tevling**: chips «blinka» tilbake til opphavleg posisjon ved rett match etter smash-animasjonen. Dei ligg no usynlege når dei først er smasha.
- **Ordaklok — alle modus**: lange begrep og setningar (t.d. naturfag-definisjonar) sprengde boksane. Innført lengde-basert font-skalering og ordbryting i alle fire modus. I Skriv-modus byter vi automatisk til vanleg input når svaret inneheld mellomrom eller er over 20 teikn (bokstavboksar er framleis default for korte ord). Tevling-chips wrappar no til fleire liner i staden for å bli kutta.
