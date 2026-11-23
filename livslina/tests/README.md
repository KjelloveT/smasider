# Kontroll av Livslina fase 2

Køyr `node --test livslina/tests/phase2.test.cjs` frå prosjektrota.
Testane brukar Node sine innebygde modular og den faktiske spelkoden.
Dei omfattar òg skule- og lærlingstipend, månadsbudsjett, og korleis utgiftene
endrar seg ved flytting eller byte mellom studium og arbeid.

Prøvelagringane i `fixtures/` inneheld ingen persondata. Importer dei med
den vanlege Importer-knappen:

- `studieklar.json`: avslutta skuleløp med 5,30 i snitt, klar for
  faseovergangen og alle dei tre studia i prøveutgåva.
- `fagprove.json`: begge læreåra er ferdige, fagprøva står att.
- `siste-laerehalvaar.json`: siste lærehalvår, for kontroll av den gamle flyten.

## Nettlesarkontroll 2026-11-01

- Import av fullført VGS-løp, faseoversikt og vidareføring til 19 år.
- Årsplan med studenthybel, BSU, fri sparing og bustadmål.
- Seks case fordelte gjennom tolv månader, med årsoppgjer.
- Ny innlasting etter eit case bevarte månaden, saldoen og valet.
- Eksportert fil hadde app `livslina`, versjon 10, fase 2, tolv månadsrader
  og eitt årsoppgjer.
- Fullført lærlingløp kravde avsluttande fagprøve og gav rett fagbrev ved 20 år.
- Kjeldeforklaring opna i den felles dialogen, Escape lukka henne.
- Visuell kontroll av heimeskjerm, felt og budsjett på 320, 437, 768 og
  1024 pikslar i same-origin testiframe og på desktop.
- Hovudsida vart køyrd med tryggingsheaderane frå `staticwebapp.config.json`,
  utan konsollfeil. Det mellombelse iframe-kontrollverktøyet gav to
  MutationObserver-meldingar ved innlasting; desse er ikkje observerte i
  den frittståande Livslina-sida. Kontrollverktøyet er ikkje del av leveransen.

Felleskontrollen `node designsystem/check-ui-system.cjs` på arbeidskopien
kontrollerer 80 HTML-sider og melder to eksisterande avvik i
`heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`.
Desse filene er uendra frå hovudgreina. Ingen Livslina-avvik er melde.

## Nettlesarkontroll av den visuelle utgåva 2026-11-21

- Importerte `studieklar.json` og spelte sjukepleie med studenthybel,
  BSU og bustadmål gjennom alle tolv månadene og seks hendingar.
- Månadssporet viste rett steg. Hendingskorta viste diorama og symbol for
  valfølgjene, med eige symbol for sosialt. Ei ny innlasting etter første
  val bevarte månad, saldo og val, og gav handlinga «Vidare».
- Årsoppgjeret viste studieframdrift og økonomi. Trekkspela for rekneskap
  og val kunne opnast. Eksportfila inneheldt tolv månadsrader og eitt
  årsoppgjer.
- Importerte `fagprove.json` på ei 390 pikslar brei vising med emulert
  berøring. Fagprøva gav tilgang til tømrarløpet og første hending.
- Sjekka faseovergang, oversikt, årsplan, hendingskort og årsoppgjer på
  320, 437, 768, 1024 og 1440 pikslar utan vassrett overflyt. Escape lukka
  kjeldedialogen og returnerte fokus. Alle 16 dioramautsnitta vart kontrollerte,
  og alle 70 hendingane og 14 årsretningane peika til gyldige motiv.
- Køyrde i Chrome med handheva tryggingsheaderar frå
  `staticwebapp.config.json`. Ingen konsoll- eller lastingsfeil i gjennomspelinga.
- 16 automatiserte fasetestar passerer. Felleskontrollen av 81 HTML-sider
  melder dei same to avvika i Heite Stavrim og Ormritaren.

## Kontroll av poengkravet 2026-11-22

- Ein ny søkjar på 22 år med 35,0 poeng kan sjå lærarstudiet og budsjettet
  for det. Retninga viser kravet på 38,9, og «Start året» er sperra.
- Ei eldre lagring med 35,0 poeng og to studieår kan halde fram, også etter
  eit friår. Ein ny søkjar som når grensa, kan starte.
- Nettlesaren viste rett opptaksstatus frå 320 til 1440 pikslar. Prøvelagringa
  med 5,30 i snitt kom inn på sjukepleie. Tolv månader, seks hendingar,
  årsoppgjer, ny innlasting og eksport vart prøvde under same tryggingsheaderar
  som førehandsvisinga. Alle 25 automatiserte fasetestar passerte.

## Kontroll av utvidinga 2026-11-23

- Alle 32 fasetestar passerer. Kontrollane dekkjer opptak og fagskule,
  privatist og realfag, vidare spel etter 25 år, folkehøgskule og reise,
  føraropplæring, planlagd familie og flytting og sal av inventar.
- I Chrome vart karriereveljaren, månadsbudsjettet, fire førarkortsteg,
  fire samanhengande år med familieval og rombutikken prøvde frå 320 til
  1440 pikslar. Fordelinga av husleige og depositum stemde med årsplanen.
  Ved avbrot før stadfesting vart ingen plan om barn sett i gang.
- Tre bilete per familiesituasjon vart lasta. Same bilete kom att ved
  ny innlasting midt i ei hending. Målmodellen vart kontrollert med
  representative kombinasjonar for soverom, stove, kjøken, arbeidsrom
  og barnerom. Halvårsplanen og fagprøva vart prøvde på mobil.
- [Resultat frå dei same 50 spelprofilane før og etter utvidinga](../docs/fase2-gjennomforing.md#50-para-gjennomspelingar).
