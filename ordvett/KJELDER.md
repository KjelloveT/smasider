# Ordvett — ordbank og vedlikehald

Nynorskordboka, Universitetet i Bergen og Språkrådet, [ordbøkene.no](https://ordbokene.no), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Datafilene under `data/`, medrekna det tilpassa ordgrunnlaget, er delte under CC BY 4.0. Koden følgjer Vyrdepil-lisensen. Spelet er ikkje godkjent av eller laga på oppdrag frå ordbokutgjevarane.

## Kjelder og endringar

- [API-dokumentasjon](https://ord.uib.no/ord_2_API.html).
- [Nedlastbare orddata](https://ord.uib.no/ord_1_Ordlister.html).
- [Ordbøkene sine vilkår](https://ordbokene.no/nno/about/open-data).
- Data henta 24. oktober 2026: gjeldande oppslagsformer, ordklasse og bøying i Nynorskordboka.
- Ordutval, vanskegrad, tema, bruksområde, forklaringar og setningsdøme er tilpassa for Ordvett. Kvar ordpost har artikkel-ID og vald tydings-ID. Særskilde artikkel-/tydingsval står i `data/tydingar.json`.
- Hinttekstane er gjennomgåtte under utvikling, men elevutprøving og lærarfagleg vurdering står att. Prisane er førebelse.
- Appen gjenbruker det eksisterande godkjende bokmotivet `ordaklok-mala.png`. Ingen nye UI-bilete eller eksterne avhengnader er lagde til.

## Bygg ordbanken

Køyr frå prosjektrota:

```sh
node ordvett/tools/bygg-ordbank.cjs
node --test ordvett/tests/game.test.cjs
```

Skriptet les `data/ordgrunnlag.tsv`, hentar lemmaindeksen og artiklar frå UiB og skriv `data/ordbank.js`. Henting skjer med tre samtidige førespurnader. Rådata og ei liste for tydingskontroll ligg lokalt i den ignorerte mappa `_kjelder/ordvett/` og blir ikkje publiserte. Ta vare på rådata for reprodusering; flytt den lokale hurtigbufferen til ei ny kjeldemappe før ei medviten oppdatering frå API-et.

Kontroller tyding, kjønn, normerte alternative grunnformer og at hint ikkje røper svaret, før ny bank blir teken i bruk. Endra `bankVersion` i byggjeskriptet når ord, hint, ordrekkjefølgje eller godtekne svar blir endra. Endra `rulesVersion` når prisar eller spelreglar blir endra. Rekordnøkkelen inneheld begge versjonane, vanskegrad og settnummer.

Spelet lastar ferdigbygde data som eit lokalt skript. Ingen API-kall blir gjorde av spelet. Appen brukar den felles Vyrdepil-ramma, som lastar lokale katalog- og designfiler over HTTP; ei lokal utgåve skal difor køyrast med `serve.ps1`.

## Kontroll før levering

Prøv alle hint, tomme og gjentekne svar, alternative skrivemåtar, fasit, femordsresultat, rekordar etter ny innlasting og avbroten omgang. Kontroller tastatur og Escape i avsluttingsdialogen, små mobilbreidder, nettbrett og stor skjerm. Spelet skal ikkje gje konsollfeil eller kontakte eksterne tenester under speling. Berre eit medvite klikk på kjeldelenkja opnar ordboka.
