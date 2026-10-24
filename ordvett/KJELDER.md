# UvissaOrd — ordbank og vedlikehald

Nynorskordboka, Universitetet i Bergen og Språkrådet, [ordbøkene.no](https://ordbokene.no), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Datafilene under `data/`, medrekna det tilpassa ordgrunnlaget, er delte under CC BY 4.0. Koden følgjer Vyrdepil-lisensen. Spelet er ikkje godkjent av eller laga på oppdrag frå ordbokutgjevarane.

## Kjelder og endringar

- [API-dokumentasjon](https://ord.uib.no/ord_2_API.html).
- [Nedlastbare orddata](https://ord.uib.no/ord_1_Ordlister.html).
- [Ordbøkene sine vilkår](https://ordbokene.no/nno/about/open-data).
- Data henta 24. oktober 2026: gjeldande oppslagsformer, ordklasse og bøying i Nynorskordboka.
- Ordutval, vanskegrad, tema, bruksområde, forklaringar og setningsdøme er tilpassa for UvissaOrd. Kvar ordpost har artikkel-ID og vald tydings-ID. Særskilde artikkel-/tydingsval står i `data/tydingar.json`.
- Hinttekstane er gjennomgåtte under utvikling, men elevutprøving og lærarfagleg vurdering står att. Prisane er førebelse.
- Applogo, ni hintikon og fram-/bakside på spelmynten er laga med den innebygde bildegeneratoren etter uttrykkeleg ynske frå brukaren. Vyrde-referansen er den eksisterande maskoten. Sjå `RESSURSAR.md` for promptar og filer. Ingen eksterne avhengnader er lagde til.

## Bygg ordbanken

Køyr frå prosjektrota:

```sh
node ordvett/tools/bygg-ordbank.cjs
node --test ordvett/tests/game.test.cjs
```

Skriptet les `data/ordgrunnlag.tsv`, hentar lemmaindeksen og artiklar frå UiB og skriv `data/ordbank.js`. Henting skjer med tre samtidige førespurnader. Rådata og ei liste for tydingskontroll ligg lokalt i den ignorerte mappa `_kjelder/ordvett/` og blir ikkje publiserte. Ta vare på rådata for reprodusering; flytt den lokale hurtigbufferen til ei ny kjeldemappe før ei medviten oppdatering frå API-et.

Kontroller tyding, kjønn, normerte alternative grunnformer og at hint ikkje røper svaret, før ny bank blir teken i bruk. Endra `bankVersion` i byggjeskriptet når ord, hint, ordrekkjefølgje eller godtekne svar blir endra. Endra `rulesVersion` når prisar eller spelreglar blir endra. Dagsnøkkelen inneheld begge versjonane, vanskegrad og dato i norsk tid.

`schedule.js` gjev alle same fem ord på kvart nivå per norsk kalenderdag. Kvart ord blir brukt éin gong per 20-dagarsbolk; neste bolk får ny deterministisk blanding. Ein påbyrja runde held på datoen ved midnatt. Arkivkalenderen opnar dei same datofesta setta for tidlegare dagar. Den interaktive prøverunden brukar eitt fast øvingsord utan å endre dags- eller arkivframgangen.

Lagringsformat 3 tek vare på vald arkivdato, inntil 40 dagsrundar og 40 resultat. Gjenoppretting reknar myntkostnaden frå hintkjøp og lokale samanlikningsavtrykk av feil svar. Svartekst blir ikkje lagra. Avtrykka er ikkje kryptering. Lesing av format 1 og 2 og neste lagring oppgraderer oppsett og resultat utan å endre kjeldedata. Regelversjon 4 aukar potten frå 30 til 40 med same prisar. Ei påbyrja runde frå regelversjon 3 blir lesen vidare til den nye potten; kjelda blir ikkje endra.

Spelet lastar ferdigbygde data som eit lokalt skript. Ingen API-kall blir gjorde av spelet. Appen brukar den felles Vyrdepil-ramma, som lastar lokale katalog- og designfiler over HTTP; ei lokal utgåve skal difor køyrast med `serve.ps1`.

## Kontroll før levering

Prøv alle hint, tomme og gjentekne svar, alternative skrivemåtar, fasit, femordsresultat, rekordar etter ny innlasting og avbroten omgang. Kontroller tastatur og Escape i avsluttingsdialogen, små mobilbreidder, nettbrett og stor skjerm. Spelet skal ikkje gje konsollfeil eller kontakte eksterne tenester under speling. Berre eit medvite klikk på kjeldelenkja opnar ordboka.
