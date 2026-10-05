# Livslina — lokale arbeidsreglar

Desse reglane gjeld Livslina og undermappene. Dei kjem i tillegg til rotas
`AGENTS.md`; krav til nynorsk, personvern, felles UI, tilgjenge og arbeidsflyt
gjeld framleis. Romgrafikk har sitt eige avtalte pikseluttrykk.

## Les før arbeid med rom og spelressursar

- [Målsett romplan og produksjonsinstruks](assets/prototype/layout-standard-v4.md)
- [Autoritativ rommodell](assets/prototype/layout-room-model.js)
- [Avleidd målprofil](assets/prototype/layout-profile-v4.json)
- [Samansett prøve med variantval](assets/prototype/layout-asset-test.html)

Rommodellen er kjelda for mål, projeksjon, retning og feste. Han og dei grå
guidebileta er **ikkje** stilguider. Romillustrasjonar skal følgje den avtalte
detaljerte 8-bit-pikselstilen, med nyanserte material, skuggelag, smådetaljar
og tydelege pikselkonturar. Profilen og romeksportane er avleidde frå modellen.
Ved endringar skal desse haldast i takt.
Romreglane gjeld møblar, veggting, golvting og figurar plasserte i rommet.
Ein separat karakterbyggjar kan ha eigne portrett- og posereglar.

## Fast kamera og målestokk

- Bruk v4-projeksjonen: ortografisk/dimetrisk kamera, 30° nedvinkel,
  0,52 logiske pikslar per cm og logisk scene 480 × 360.
- Definer alle ting med verkelege mål i cm og aksane `u`, `v`, `z`.
  Golvet er `z=0`, venstre vegg `u=0`, høgre vegg `v=0`.
- Behald det godkjende kameraet og romoppsettet. Ei uttrykkeleg bestilling
  om å endre dei skal løysast i modellen og instruksen fyrst.
- Rett aldri eit feil teikna perspektiv med individuell CSS-rotasjon,
  spegling eller ulik skalering i breidd og høgd.

## Feste, variantar og tilbehøyr

- Plasser golvting etter målte kontaktpunkt og fotavtrykk, aldri etter
  botnen av ei biletramme eller frie skjermkoordinatar.
- Definer veggting i veggplanet med høgd over golvet og djupn inn i rommet.
  Kontroller klaring mot vindauge og andre veggting, med innhaldet på hyllene.
- Tilbehøyr skal ha lokale feste på forelderen: TV på benkeplata,
  skjerm på pulten, bøker på hylla og pute på madrassen.
- Større variantar skal få større fotavtrykk. Rekn feste og klaringar på nytt;
  flytt tilbehøyr med forelderen. Golvting mellom seng og pult følgjer gapet.
- Bruk modellens lagrekkjefølgje og djupnesortering ved samansetjing.

## Produksjon og dokumentasjon

1. Prøv mål og variantar som enkle former i den samla rommodellen.
2. Eksporter ein nøyaktig mal for ressursen, med kontaktpunkt, retning,
   toppflater og feste. Bruk han berre som silhuett- og kamerareferanse.
3. Teikn detaljert 8-bit-grafikk med gjennomsiktig bakgrunn og jamt,
   nøytralt dagsljos. Stilreferansar styrer detaljnivå, ikkje motiv, palett
   eller romkomposisjon. Ikkje bak inn kveldssol eller sterke slagskuggar.
4. Behald teikninga proporsjonal. Tilpass eit gjennomsiktig lerret til den
   projiserte konturen utan å strekkje motivet ulikt i breidd og høgd.
   Kontroller synlege alfakantar, føter og kantvinklar. Ein kamerainstruks i
   ein prompt garanterer ikkje samsvar.
5. Prøv familien i rommet før fleire familiar eller variantar blir produserte.

Dokumenter nye ressursar med stabil ID, fil, kameraversjon, mål i cm,
fotavtrykk, framretning, lerretmål, pivot/kontaktpunkt og eventuelle lokale
feste. Skil mål i cm frå filstorleik i pikslar. Registrer status som målform,
stilprøve eller kontrollert romressurs i ressursoversikta.

## Kontroll før levering

- Køyr modellens validering på variantkombinasjonane. Kontroller særleg
  større seng/pult, golvting i gapet og høgare TV-benk med TV.
- Sjå på den faktisk samansette scena. Kontroller golvkontakt, retning,
  proporsjonar, veggfeste, overlapping og tilbehøyr på toppflater.
- Test variantvala og mobilvisinga i nettlesaren etter rotas retningslinjer.
  Oppgje det tydeleg dersom ein kontroll ikkje kunne utførast.
- Skil matematisk kontroll av modellen frå visuell kontroll av teikningane.
  Ei godkjend målform gjer ikkje ein generert PNG automatisk godkjend.

V4 er ein geometrisk kalibreringsmodell, ikkje stilfasit eller ferdig
8-bit-grafikk. `assets/prototype/resources-v5/manifest.json` viser den
samansette spriteprøva og kva ressursar som høyrer til kvar familie. Dei eldre
`test-*.png`-ressursane er stilprøver; v3 er forkasta som kameramal. Dei skal
ikkje brukast som bevis for rett perspektiv eller plassering.
