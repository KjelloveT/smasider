# Ordbås

120 setningsoppgåver i tre spelmåtar: Båsrunden (kort for kort), Hjelp Vyrde (finn ordet i ei setning ut frå Vyrde si ordforklaring) og Ordskiftet (flytt to heile setningskort til kvar sin bås i valfri rekkjefølgje). Fire ordklassar og fire opne ordsteg. Vanilla HTML/CSS/JS, felles Vyrdepil-design, lagring og bragder.

## Innhald og kjelder

Ordforklaringane byggjer på ei uttrykkeleg vald tyding i Nynorskordboka, Universitetet i Bergen og Språkrådet, ordbøkene.no, CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Dei er korta ned og tilpassa. Setningar, hint og grammatikkforklaringar er skrivne for Ordbås. Ordbokdata og bearbeidde ordforklaringar har framleis CC-BY 4.0; den generelle Vyrdepil-lisensen innskrenkar ikkje desse rettane.

Kjeldeartikkel, tydings-ID, oppdatering og den valde opphavlege forklaringa står per oppgåve i data/oppgaver.json. Spelet viser den tilpassa forklaringa. Oppslag skjer berre under utvikling. Ingen KI eller ordbok-API blir brukt når eleven spelar.

Verktøyet tools/build-content.cjs byggjer den lokale oppgåvefila frå tools/oppgaver.tsv og tools/senses.json. Det hentar artiklar frå det dokumenterte API-et på ord.uib.no og mellomlagrar dei i den ignorerte .cache-mappa. Det tek ikkje automatisk med alternative tydingar eller faste uttrykk. Gjennomgå tydingar og setningar ved innhaldsendringar. Oppgåvene er ikkje prøvde med elevar.

## Kontroll

Køyr node --test ordbas/tests/*.test.cjs frå prosjektrota. Test lokalt med serve.ps1 (eller ein ledig lokal port) og i Azure-førehandsvisinga før publisering. Sjå docs/ordbas/PLAN.md for den større ordreserven og vidare innhaldsarbeid.

Lokalt kontrollert: alle 21 målretta testar, korrektur/repetisjon og resultat, alle tre spelmåtane, ordforklaringar, tastane 1–4, dra-og-slepp med peikar, lagring etter sideoppfrisking og Escape i nullstillingsdialogen. Skjermbreidder 320, 437, 768, 1024 og 1440 px er kontrollerte utan vassrett sideflyt. Reell fingerbruk og klasseromsutprøving står att.

## Speluttrykk og poeng

Ordtunet har fire ulike illustrerte trebåsar med ordklassane sentrerte på hengjeskilta, kort som samlar seg inni kassene, ein steinsti, synleg rundepoeng og rekkjer med rette svar. Vyrde held eit ekte hint-skilt og får ulike uttrykk med korte rørsler. Hjelpetekst og spelval ligg i lukka trekkspel frå start. Ein illustrasjonsvariant av fellesknappen held på det vanlege tastaturfokuset. All rørsle respekterer redusert rørsle.

Eit primærkort gjev 10 poeng på fyrste forsøk, elles 5. Kvart tredje rette primærkort på rad gjev 5 ekstra; feil bryt rekkja. Repetisjonskort gjev ikkje fleire poeng eller betre rekkje. Hint kostar ingenting. Poeng og rekkje ligg berre i den aktive runden og blir ikkje lagra. Hjelp Vyrde viser ei forklaring og ein ordklasse utan å framheve målordet. Eleven vel ordet direkte i setninga. Hintet gjev eit grammatisk spørsmål; funne ord blir samla i ordboka til Vyrde. I Ordskiftet blir kvart setningskort låst og lagt i rett kasse; begge må vere sorterte før neste par. Eit nytt par har eigne tomme kasser. Ingen av dei to spelmåtane legg inn repetisjonskort i runden.

`yard.js` teiknar båsar, stien og ordpar. `effects.js` eig tidsavgrensa rørsler og ryddar dei ved skjermskifte. `round.js` eig reglane, medan lagringsmodulen brukar same avgrensa øvingsdata som før. Bilete, komprimering og promptgrunnlag er dokumenterte i [assets/README.md](assets/README.md).
