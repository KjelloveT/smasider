# Ordbås

400 setningsoppgåver i tre spelmåtar: Båsrunden (kort for kort), Hjelp Vyrde (finn ordet i ei setning ut frå Vyrde si ordforklaring) og Ordskiftet (flytt to heile setningskort til kvar sin bås i valfri rekkjefølgje). 100 oppgåver per ordklasse og fire opne vanskegradar. Lett byrjar med substantiv og verb. Vanilla HTML/CSS/JS, felles Vyrdepil-design, lagring og bragder.

## Innhald og kjelder

Ordforklaringane byggjer på ei uttrykkeleg vald tyding i Nynorskordboka, Universitetet i Bergen og Språkrådet, ordbøkene.no, CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Dei er korta ned og tilpassa. Setningar, hint og grammatikkforklaringar er skrivne for Ordbås. Ordbokdata og bearbeidde ordforklaringar har framleis CC-BY 4.0; den generelle Vyrdepil-lisensen innskrenkar ikkje desse rettane.

Kjeldeartikkel, tydings-ID, oppdatering og den valde opphavlege forklaringa står per oppgåve i data/oppgaver.json. Spelet viser den tilpassa forklaringa. Oppslag skjer berre under utvikling. Ingen KI eller ordbok-API blir brukt når eleven spelar.

Verktøyet tools/build-content.cjs byggjer den lokale oppgåvefila frå tools/oppgaver.tsv, tools/utviding.tsv og tools/senses.json. Dei fyrste 120 ID-ane er haldne faste, og 280 nye oppgåver er lagde etter dei. Alle 400 har uttrykkeleg valde tydings-ID-ar i senses.json. Bygginga avviser ukjende ordformer eller manglande tydingar. Det hentar artiklar frå det dokumenterte API-et på ord.uib.no og mellomlagrar dei i den ignorerte .cache-mappa. Det tek ikkje automatisk med alternative tydingar eller faste uttrykk. Gjennomgå tydingar og setningar ved innhaldsendringar. Nivåa er redaksjonelle vurderingar som skal prøvast vidare på barnetrinnet.

## Kontroll

Køyr node --test ordbas/tests/*.test.cjs frå prosjektrota. Test lokalt med serve.ps1 (eller ein ledig lokal port) og i Azure-førehandsvisinga før publisering. Sjå docs/ordbas/PLAN.md for den større ordreserven og vidare innhaldsarbeid.

Lokalt kontrollert: alle 23 målretta testar, korrektur/repetisjon og resultat, alle tre spelmåtane, ordforklaringar, tastane 1–4, dra-og-slepp med peikar, lagring etter sideoppfrisking og Escape i nullstillingsdialogen. Skjermbreidder 320, 437, 768, 1024, 1440 og 1580 px er kontrollerte utan vassrett sideflyt. Ordkort er prøvde med demokrati, undersøkje, administrerer og bruksrettleiing i 32 kombinasjonar av kort- og skjermbreidd, utan orddeling eller overflyt. Alle 44 setningane i Ordskiftet er òg målte synlege over kassefronten ved mobilbreidd. Reell fingerbruk og klasseromsutprøving står att.

## Speluttrykk og poeng

Ordtunet har fire ulike illustrerte trebåsar med ordklassane sentrerte på hengjeskilta, kort på høgkant bak kassefronten, ein steinsti, synleg rundepoeng og rekkjer med rette svar. Vyrde held eit ekte hint-skilt, snakkar i ei boble med hale mot figuren og får ulike uttrykk med korte rørsler. Vanskegrad har fire illustrerte val: Lett, Middels, Vanskeleg og Ekstrem. Ordklassane er òg synlege før start. Fleire spelval og hjelp ligg i lukka trekkspel frå start. Ein illustrasjonsvariant av fellesknappen held på det vanlege tastaturfokuset. Båsane står stille ved trykk og dra-og-slepp; ein mjuk glød gjev markeringa. Poengfelt og reaksjonstekst har fast plass, slik at båsane held same dokumentposisjon ved svar. Ordkort viser heile ord på éi line; skriftstorleiken brukar målt tekstbreidd og blir oppdatert ved storleiksending. Dei minste skjermane gjev kortet heile breidda. Skiltteksten ligg innanfor kvart hengjeskilt, og kassefronten har eiga klippehøgd for dei to nedste illustrasjonane. All rørsle respekterer redusert rørsle.

Eit primærkort gjev 10 poeng på fyrste forsøk, elles 5. Kvart tredje rette primærkort på rad gjev 5 ekstra; feil bryt rekkja. Repetisjonskort gjev ikkje fleire poeng eller betre rekkje. Hint kostar ingenting. Poeng og rekkje ligg berre i den aktive runden og blir ikkje lagra. Hjelp Vyrde viser ei forklaring og ein ordklasse utan å framheve målordet. Eleven vel ordet direkte i setninga. Hintet gjev eit grammatisk spørsmål; funne ord blir samla i ordboka til Vyrde. I Ordskiftet blir kvart setningskort låst og lagt i rett kasse; begge må vere sorterte før neste par. Eit nytt par har eigne tomme kasser. I parutvalet er nivået det høgaste av dei to korta; berre par på vald vanskegrad blir tekne med. Ingen av dei to spelmåtane legg inn repetisjonskort i runden. Ordboka er gøymd til fyrste funn og viser deretter ordet og den valde forklaringa.

`yard.js` teiknar båsar, stien og ordpar. `effects.js` eig tidsavgrensa rørsler og ryddar dei ved skjermskifte. `round.js` eig reglane, medan lagringsmodulen brukar same avgrensa øvingsdata som før. Bilete, komprimering og promptgrunnlag er dokumenterte i [assets/README.md](assets/README.md).
