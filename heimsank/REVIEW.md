# Heimsank — kortarkade

Designet brukar eit godkjent lokalt unntak frå neobrutalisme. Felles toppmeny,
spelreglar, prisar og VyrdepilStorage-format er vidareførte.

## Lokal kontroll

- `node --test heimsank/tests/flow.test.cjs`: fem målretta testar for dobbeltsvar,
  premie via Escape, byte til same kort med foil, kasting og retur til meny.
- Alle JavaScript-filene blir syntakskontrollerte med `node --check`.
- Visuell kontroll og speltest i den innebygde nettlesaren; Chrome-tilkopling
  er ikkje tilgjengeleg i denne arbeidsøkta.

## Samordning

- Oppdatert med main etter PR #65, #66 og #68; redesignen brukar versjon 1.51.
- Alle tolv kategoriar og biletkreditering er bevarte. Den felles kortkomponenten
  viser `imgAuthor`, `imgLicense`, `imgLicenseUrl` og `imgPage` i detaljvisinga.
- Poengfiksen og synkronisering mellom faner frå PR #68 er bevarte.
- Kategoritalet blir lese frå data; dei tre nye kategoriane har eigne fargar og ikon.
- Endeleg Chrome-kontroll på Azure-preview må vere ferdig før merge.
