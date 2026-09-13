# Heimsank — kortarkade

Designet brukar eit godkjent lokalt unntak frå neobrutalisme. Felles toppmeny,
spelreglar, prisar og VyrdepilStorage-format er vidareførte.

## Lokal kontroll

- `node --test heimsank/tests/flow.test.cjs`: fem målretta testar for dobbeltsvar,
  premie via Escape, byte til same kort med foil, kasting og retur til meny.
- Alle JavaScript-filene blir syntakskontrollerte med `node --check`.
- Visuell kontroll og speltest i den innebygde nettlesaren; Chrome-tilkopling
  er ikkje tilgjengeleg i denne arbeidsøkta.

## Samordning før merge

- PR #65 brukar versjon 1.48 og PR #66 brukar 1.49. Denne endringa brukar 1.50.
- PR #66 legg til kortkategoriar og biletkreditering. Behald desse endringane
  ved samanslåing. Den nye kortkomponenten støttar dei valfrie felta
  `imgAuthor`, `imgLicense`, `imgLicenseUrl` og `imgPage`.
- Kategoritalet blir lese frå data; ukjende kategoriar får ein trygg standardfarge.
- Endeleg Chrome-kontroll på Azure-preview må vere ferdig før merge.
