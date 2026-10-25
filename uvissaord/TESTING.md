# Kontroll av UvissaOrd

Kontrollert 25. oktober 2026 på `feat/uvissaord-open-oversikt`, frå fersk `origin/main` på `1fe029b` etter merge av PR #125. Produksjon viste versjon 2.4, UvissaOrd på den nye adressa og 60-myntsutgåva. Arbeidet vidarefører denne utgåva med opne kvitteringar, nivå under kvarandre, heimlenkjer og førstegongstips. Intern app-ID, lagringsnøkkel og bakgrunnsreservasjon er uendra.

Vidare kontroll av siste sjansen er gjort frå `849e182` i PR #128, med fersk `origin/main` på `84826ff`. Regel 6, rundesnapshot 4 og lagringsformat 5 bevarer både påbyrja og fullførte rundar frå regel 5. Fullførte nivå har ikkje lenger ein «Sjå resultat»-knapp.

## Automatiske kontrollar

- 40 speltestar passerer: 60-myntsgrensa, hintprisar, felles kortlager, kjøp utanfor ordlengda, gyldige svar og variantar, gjentekne feil, gjenoppretting, lager etter ny innlasting, øydelagde dagsdata, norsk midnatt/vintertid, førstegongsvilkår og kalendergrenser. Siste-sjanse-testane dekkjer 0/1 mynt att, gratis rette svar, automatisk slutt ved feil, ugyldige/gjentekne svar, gjenoppretting og regel-5-migrering.
- Banken har 450 ulike kjeldemerkte ord, 150 per nivå. Alle lettord har høgst seks bokstavar. Alle oppføringar har ordbokkjelde, grammatikk, bøying og tre språklege hint utan sjølve svaret.
- Skulekontrollen passerer for fasit, godtekne former, bøying og alle hintfelt. Testane kontrollerer òg at kjende seksualiserte ord, banning og rasistiske skjellsord blir stoppa dersom dei kjem inn i eit slikt felt.
- Alle 846 dagssett frå 24.10.2026 til og med 01.08.2027 er kontrollerte: tre nivå per dag, fem ulike ord på rett nivå, ingen gjentekne femordssett og minst 15 dagar mellom same ord. Heile kvart nivå blir brukt éin gong i kvar heil 30-dagarsbolk.
- Lagringsformat 5 og rundesnapshot 4 tek vare på feilorda og brukt siste sjanse lokalt. Regel 5 har dei same orda og blir lesen vidare utan å endre kjelda. Eldre bankar blir haldne separate. Alle 846 dagsrundar får plass innan grensa på 900.
- JavaScript-syntaks, diffkontroll og bakgrunnsreservasjonar passerer. Felles UI-kontroll finn dei same to eksisterande modalfeila i Heite Stavrim og Ormritaren; ingen gjeld UvissaOrd.

## Nettlesar

Kontrollen vart gjort i eigne Chrome-faner på `127.0.0.1:8081` og `localhost.:8081`, med eigne testdata. Brukaren si opne fane vart liggjande i fred. Den lokale tenaren brukar dei handheva tryggingsheaderane og CSP frå produksjonskonfigurasjonen.

- Nivåhandlinga startar runden direkte. Lett, Middels og Krokut står i kvar sin boks under kvarandre, med full innhaldsbreidd. Geita på fjellet er brukt for Krokut.
- Bruk vart kjøpt på fyrste ord; stakken var tom òg på ord nummer to. To tilfeldige bokstavkjøp gav to eigne kort og reduserte lageret frå åtte til seks. Val av nummer 30 kosta fem myntar og eitt kort utan å røpe ordlengda. Lager, kostnad og framgang var dei same etter ny innlasting.
- Lett-runden vart fullført med 1/5 løyste ord og 19 brukte myntar. Middels hadde 1/5 og 10 brukte myntar; Krokut hadde 1/5 og 13 brukte myntar. Startsida og resultatet synte feilord og alle kjøpte hint direkte, utan trekkspel eller plussknappar. Dei fem orda fekk kvar si lyse palettflate. Bokstavkvitteringa synte begge kjøpa utan utviding.
- Logoen og namnet tok spelaren heim frå spel og prøverunde. Eit kjøp på 8 myntar var framleis synleg etter retur og ny innlasting. Introen synte den nye teksten òg i speltilstanden. Ingen regel-/orddata er endra.
- Ei fane utan historikk fekk «Slik spelar du» som native dialog med mynt, hintikon og fem ordsymbol. Prøverundeknappen opna rettleiinga direkte. Etter ein lagra dagsrunde kom ikkje tipset att ved ny innlasting. Det blir ikkje lagra noko nytt sett-felt eller visingsflagg.
- Bokstavfeltet var gøymt når ingen bokstav eller ordlengd var kjøpt. Ikonet og spørsmålsteiknet er fjerna.
- Ein påbyrja Middels-runde frå regel 5 heldt fram med 1/5 løyste ord og 10 brukte myntar. Etter 25 nye feil var potten 0 og knappen «Siste tipp» framleis aktiv, også etter ny innlasting. Rett svar gav 2/5 utan trekk. Neste feil opna sluttresultatet med 60 brukte myntar, synleg sluttmelding og fasit for resten av orda. Etter ny innlasting var runden framleis ferdig og hadde ingen start-/resultatknapp. Ingen vassrett overflyt på 320 px.
- Prøverunden vart fullført med ordlengd, bokstav, tyding og svaret «eple». Etter retur stod det same dagsresultatet med 19 brukte myntar. Prøverunden blir ikkje lagra.
- Kalenderen synte berre 24. oktober, den einaste spelbare arkivdagen ved kontrollen. Datoar før lanseringa, dagens dato og framtidige datoar vart ikkje viste. Lanseringsmeldinga var synleg, og månadsgrensene var rette.
- Mobil 320 px, nettbrett 768 px og 1040 px: ingen vassrett overflyt. Tipsdialogen var 575 px høg og passa heilt på 320 × 800. All hinttekst var synleg på mobil. Den tidlegare kontrollerte faste svarflata er vidareført.
- Ingen konsollfeil eller åtvaringar frå spelet i kontrollfana. Kort- og myntanimasjonar har framleis vern for redusert rørsle.

Fysiske telefonar/nettbrett og elev-/lærarutprøving står att. Azure-preview blir kontrollert etter siste push; sjå PR-en for deploy-status.
