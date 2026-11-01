# Kontroll av Livslina fase 2

Køyr `node --test livslina/tests/phase2.test.cjs` frå prosjektrota.
Testane brukar Node sine innebygde modular og den faktiske spelkoden.

Prøvelagringane i `fixtures/` inneheld ingen persondata. Importer dei med
den vanlege Importer-knappen:

- `studieklar.json`: avslutta skuleløp, klar for faseovergangen.
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
