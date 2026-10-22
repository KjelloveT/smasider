# Ordbås

120 setningsoppgåver i tre spelmåtar: Båsrunden, Hjelp Vyrde og Ordskiftet. Fire ordklassar og fire opne ordsteg. Vanilla HTML/CSS/JS, felles Vyrdepil-design, lagring og bragder.

## Innhald og kjelder

Ordforklaringane byggjer på ei uttrykkeleg vald tyding i Nynorskordboka, Universitetet i Bergen og Språkrådet, ordbøkene.no, CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Dei er korta ned og tilpassa. Setningar, hint og grammatikkforklaringar er skrivne for Ordbås. Ordbokdata og bearbeidde ordforklaringar har framleis CC-BY 4.0; den generelle Vyrdepil-lisensen innskrenkar ikkje desse rettane.

Kjeldeartikkel, tydings-ID, oppdatering og den valde opphavlege forklaringa står per oppgåve i data/oppgaver.json. Spelet viser den tilpassa forklaringa. Oppslag skjer berre under utvikling. Ingen KI eller ordbok-API blir brukt når eleven spelar.

Verktøyet tools/build-content.cjs byggjer den lokale oppgåvefila frå tools/oppgaver.tsv og tools/senses.json. Det hentar artiklar frå det dokumenterte API-et på ord.uib.no og mellomlagrar dei i den ignorerte .cache-mappa. Det tek ikkje automatisk med alternative tydingar eller faste uttrykk. Gjennomgå tydingar og setningar ved innhaldsendringar. Oppgåvene er ikkje prøvde med elevar.

## Kontroll

Køyr node --test ordbas/tests/*.test.cjs frå prosjektrota. Test lokalt med serve.ps1 (eller ein ledig lokal port) og i Azure-førehandsvisinga før publisering. Sjå docs/ordbas/PLAN.md for den større ordreserven og vidare innhaldsarbeid.

Lokalt kontrollert: alle 14 målretta testar, korrektur/repetisjon og resultat, alle tre spelmåtane, ordforklaringar, tastane 1–4, dra-og-slepp med peikar, lagring etter sideoppfrisking og Escape i nullstillingsdialogen. Skjermbreidder 320, 437, 768, 1024 og 1440 px er kontrollerte utan vassrett sideflyt. Reell fingerbruk og klasseromsutprøving står att.
