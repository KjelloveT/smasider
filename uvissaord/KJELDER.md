# UvissaOrd — ordbank og vedlikehald

Nynorskordboka, Universitetet i Bergen og Språkrådet, [ordbøkene.no](https://ordbokene.no), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Datafilene under `data/`, medrekna det tilpassa ordgrunnlaget, er delte under CC BY 4.0. Koden følgjer Vyrdepil-lisensen. Spelet er ikkje godkjent av eller laga på oppdrag frå ordbokutgjevarane.

## Kjelder og endringar

- [API-dokumentasjon](https://ord.uib.no/ord_2_API.html).
- [Nedlastbare orddata](https://ord.uib.no/ord_1_Ordlister.html).
- [Ordbøkene sine vilkår](https://ordbokene.no/nno/about/open-data).
- Data henta 24.–25. oktober 2026: gjeldande oppslagsformer, ordklasse og bøying i Nynorskordboka.
- Ordutval, vanskegrad, tema, bruksområde, forklaringar og setningsdøme er tilpassa for UvissaOrd. Kvar ordpost har artikkel-ID og vald tydings-ID. Særskilde artikkel-/tydingsval står i `data/tydingar.json`.
- 450 handplukka ord: 150 på kvart av nivåa Lett, Middels og Krokut. Lett har vanlege ord på høgst seks bokstavar. Lange ord frå den opphavlege lettbanken er flytta til Middels. Krokut blandar kjende ord med mindre vanlege ord frå mellom anna natur, handverk og eldre gardsliv.
- Hinttekstane og dei valde tydingane er gjennomgåtte under utvikling. `tools/ordkontroll.cjs` stoppar kjende seksualiserte ord, grove bannord og rasistiske skjellsord i fasit, alternative former, bøying og hintfelt før banken blir skriven. Dette er eit ekstra kontrollnett for eit lukka ordutval, ikkje ein garanti for automatisk vurdering av vilkårleg ordbokinnhald. Nye ord og tydingar skal framleis lesast gjennom. Elevutprøving og lærarfagleg vurdering står att.
- Applogo, ni hintikon og fram-/bakside på spelmynten er laga med den innebygde bildegeneratoren etter uttrykkeleg ynske frå brukaren. Vyrde-referansen er den eksisterande maskoten. Sjå `RESSURSAR.md` for promptar og filer. Ingen eksterne avhengnader er lagde til.

## Bygg ordbanken

Køyr frå prosjektrota:

```sh
node uvissaord/tools/bygg-ordbank.cjs
node --test uvissaord/tests/game.test.cjs
```

Skriptet les `data/ordgrunnlag.tsv` og `data/fleire-ord.tsv`, hentar lemmaindeksen og artiklar frå UiB og skriv `data/ordbank.js`. Henting skjer med tre samtidige førespurnader. Rådata og ei liste for tydingskontroll ligg lokalt i den ignorerte mappa `_kjelder/ordvett/` og blir ikkje publiserte. Ta vare på rådata for reprodusering; flytt den lokale hurtigbufferen til ei ny kjeldemappe før ei medviten oppdatering frå API-et.

Kontroller tyding, kjønn, normerte alternative grunnformer og at hint ikkje røper svaret, før ny bank blir teken i bruk. Endra `bankVersion` i byggjeskriptet når ord, hint, ordrekkjefølgje eller godtekne svar blir endra. Endra `rulesVersion` når prisar eller spelreglar blir endra. Dagsnøkkelen inneheld begge versjonane, vanskegrad og dato i norsk tid.

Bygginga skriv òg `data/dagssett.js`: 282 dagar frå 24.10.2026 til og med 01.08.2027, tre nivå per dag og fem ord per sett, totalt 846 ulike dagssett. `tools/dagssett.cjs` brukar dei felles `Vy.shuffle` og `Vy.rng` til eit reproduserbart oppsett. Kvart ord blir brukt éin gong i kvar heil 30-dagarsbolk, med minst 15 dagar til neste bruk, også over bolkgrensene. Eit heilt femordssett blir aldri repetert i perioden. Banken og kalenderen skal publiserast samla.

`schedule.js` les desse faste setta. Dagen blir rekna i norsk tid; ein påbyrja runde held datoen ved midnatt. Arkivet opnar berre publiserte dagar før i dag. Før og etter oppgåveperioden viser dagsvalet det fyrste eller siste tilgjengelege settet. Prøverunden brukar eitt fast ord utan å endre dagsframgangen.

Regelversjon 6 har 60 myntar og felles hintlager for alle fem orda: fem av ordklasse, grammatikk, tema og ordlengd; åtte tilfeldige bokstavar; fem valde bokstavnummer; eitt av bruk, setning og tyding. Nye feil kostar 2 myntar. Har spelaren færre enn 2 myntar att, er rette svar framleis gratis; det fyrste nye feilsvaret brukar eventuelle restmyntar og avsluttar runden. Alle attståande ord får vist fasit. Tomme, for lange og gjentekne svar brukar ikkje siste sjansen. Ugyldige nummer kostar ingenting; eit gyldig nummer 1–30 utan bokstav kostar 5 myntar og eitt kort.

Lagringsformat 5 tek vare på inntil 900 rundar og resultat, nok til alle 846 setta og tidlegare resultat. Rundesnapshot 4 lagrar feilorda som normalisert tekst, i tillegg til samanlikningsavtrykk, ord-ID-ar, hint-ID-ar, bokstavnummer og markør for eit mislukka siste tipp. Prisen og sluttstatusen blir kontrollerte ved gjenoppretting, så sjansen kan ikkje takast på nytt etter ny innlasting. Hinta blir laga på nytt frå den lokale banken. Feilorda blir viste berre på denne eininga. Prøverunden blir ikkje lagra. Lesing av eldre format endrar ikkje kjeldefelta, og neste lagring oppgraderer oppsettet idempotent. Regel 5 har same ord og ordinære prisar som regel 6; både påbyrja og fullførte dagsrundar blir lesne vidare utan å endre kjelda. Gamle 30-/40-myntsrundar blir bevarte under gamle nøklar.

Spelet lastar ferdigbygde data som eit lokalt skript. Ingen API-kall blir gjorde av spelet. Appen brukar den felles Vyrdepil-ramma, som lastar lokale katalog- og designfiler over HTTP; ei lokal utgåve skal difor køyrast med `serve.ps1`.

Førstegongstipset blir vist ved opning når det ikkje finst lagra rundar eller resultat, også frå eldre format. Det brukar berre desse eksisterande dataa som vilkår og lagrar ikkje eit eige visingsflagg. Prøverunden og lukking av tipset endrar ikkje dagsframgangen.

## Kontroll før levering

Prøv alle hint, tomme og gjentekne svar, alternative skrivemåtar, fasit, femordsresultat, dei tre nivåa og avbroten omgang. Kontroller at lageret varer over alle fem orda og etter ny innlasting. Kontroller tastatur og Escape i prøverunden og nummerkjøpet, mobil, nettbrett og stor skjerm. Spelet skal ikkje gje konsollfeil eller kontakte eksterne tenester under speling. Berre eit medvite klikk på kjeldelenkja opnar ordboka.
