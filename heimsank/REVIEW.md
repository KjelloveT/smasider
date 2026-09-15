# Heimsank — kortarkade

Designet brukar eit godkjent lokalt unntak frå neobrutalisme. Felles toppmeny,
spelreglar, prisar og VyrdepilStorage-format er vidareførte.

## Lokal kontroll

- `node --test heimsank/tests/flow.test.cjs`: seks målretta testar for dobbeltsvar,
  premie via Escape, byte til same kort med foil, kasting, retur til meny og
  lasting av alle tolv kategoriar med biletkreditering.
- Alle JavaScript-filene blir syntakskontrollerte med `node --check`.
- Visuell kontroll og speltest i den innebygde nettlesaren; Chrome-tilkopling
  er ikkje tilgjengeleg i denne arbeidsøkta.

## Azure-preview

Kontrollert 14. september 2026 i den innebygde nettlesaren på
https://icy-water-0487ac303-67.westeurope.2.azurestaticapps.net/heimsank/.

- Spelt 42 rette svar: sju premiar, full samling og byte via knapp fungerer.
- Escape fullfører premien; kort og poeng er bevarte etter omlasting.
- Album, kortdetaljar, biletkreditering og merke er kontrollerte.
- Lyst og mørkt tema er visuelt kontrollerte på mobil. Ingen vassrett rulling
  ved 360, 768, 1024 eller 1440 pikslar breidd.
- Ingen åtvaringar eller feil i nettlesarkonsollen under kontrollen.
- Chrome-kontroll står att; PR #67 blir difor halden som utkast.

## Kortvising og kategoriomslag

- Same kort blir kontrollert i fire breidder på `tests/card-layout.html`. Testen
  måler sideforhold og den relative plasseringa til tekst, bilete og symbol.
- Kategoriar med opptente kort brukar det fyrste kortet i samlinga som eit
  heildekkjande omslagsbilete. Utan eit opptent kort står kategoriikonet att.
- Segngjetne og gudeborne kort har lokal WebGL-dekorasjon berre over toppen.
  Samlingsrutenett brukar ei statisk glød for å unngå mange GPU-kontekstar.
  `prefers-reduced-motion` slår av animasjonen.

## Samordning

- Oppdatert med main etter PR #65, #66 og #68; redesignen brukar versjon 1.51.
- Alle tolv kategoriar og biletkreditering er bevarte. Den felles kortkomponenten
  viser `imgAuthor`, `imgLicense`, `imgLicenseUrl` og `imgPage` i detaljvisinga.
- Poengfiksen og synkronisering mellom faner frå PR #68 er bevarte.
- Kategoritalet blir lese frå data; dei tre nye kategoriane har eigne fargar og ikon.
- Endeleg Chrome-kontroll på Azure-preview må vere ferdig før merge.
