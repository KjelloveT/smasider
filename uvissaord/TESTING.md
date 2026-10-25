# Kontroll av UvissaOrd

Kontrollert 25. oktober 2026 i den reine arbeidskopien for PR #125, vidareført frå `64c4007`. Fersk `origin/main` var `5f2c044`. Produksjon viste versjon 2.4 og den publiserte 40-myntsutgåva under `ordvett/`. PR-en flyttar den offentlege adressa til `uvissaord/`, etter uttrykkeleg ynske utan ei gammal rute i tillegg. Intern app-ID, lagringsnøkkel og bakgrunnsreservasjon er haldne stabile.

## Automatiske kontrollar

- 32 speltestar passerer: 60-myntsgrensa, hintprisar, felles kortlager, kjøp utanfor ordlengda, gyldige svar og variantar, gjentekne feil, gjenoppretting, lager etter ny innlasting, øydelagde dagsdata og norsk midnatt/vintertid.
- Banken har 450 ulike kjeldemerkte ord, 150 per nivå. Alle lettord har høgst seks bokstavar. Alle oppføringar har ordbokkjelde, grammatikk, bøying og tre språklege hint utan sjølve svaret.
- Skulekontrollen passerer for fasit, godtekne former, bøying og alle hintfelt. Testane kontrollerer òg at kjende seksualiserte ord, banning og rasistiske skjellsord blir stoppa dersom dei kjem inn i eit slikt felt.
- Alle 846 dagssett frå 24.10.2026 til og med 01.08.2027 er kontrollerte: tre nivå per dag, fem ulike ord på rett nivå, ingen gjentekne femordssett og minst 15 dagar mellom same ord. Heile kvart nivå blir brukt éin gong i kvar heil 30-dagarsbolk.
- Lagringsformat 4 og rundesnapshot 3 tek vare på feilorda lokalt. Gamle format blir lesne utan å endre kjelda; eldre dagsnøklar blir ikkje flytta til nye oppgåver og reglar. Alle 846 nye dagsrundar får plass innan grensa på 900.
- JavaScript-syntaks, diffkontroll og bakgrunnsreservasjonar passerer. Felles UI-kontroll finn dei same to eksisterande modalfeila i Heite Stavrim og Ormritaren; ingen gjeld UvissaOrd.

## Nettlesar

Kontrollen vart gjort i ei separat Chrome-fane på `127.0.0.1:8081`, med eiga lagring, medan brukaren si `localhost`-fane vart liggjande i fred. Den lokale tenaren brukar dei handheva tryggingsheaderane og CSP frå produksjonskonfigurasjonen.

- Nivåkortet startar runden direkte. Lett, Middels og Krokut har kvar sin pott og sitt lager. Geita på fjellet er brukt for Krokut.
- Bruk vart kjøpt på fyrste ord; stakken var tom òg på ord nummer to. To tilfeldige bokstavkjøp gav to eigne kort og reduserte lageret frå åtte til seks. Val av nummer 30 kosta fem myntar og eitt kort utan å røpe ordlengda. Lager, kostnad og framgang var dei same etter ny innlasting.
- Lett-runden vart fullført med 1/5 løyste ord og 19 brukte myntar. Middels hadde 1/5 og 10 brukte myntar; Krokut hadde 1/5 og 13 brukte myntar. Startsida synte kvar av dei, med framgangssymbol, myntbruk og opnbare kvitteringar for feilord og kjøpte hint. Bokstavkvitteringa synte begge kjøpa.
- Prøverunden vart fullført med ordlengd, bokstav, tyding og svaret «eple». Etter retur stod det same dagsresultatet med 19 brukte myntar. Prøverunden blir ikkje lagra.
- Kalenderen tillét 24. oktober som fyrste arkivdag. Tidlegare datoar, dagens dato og framtidige datoar var utilgjengelege. Kalenderen synte status for alle tre nivåa.
- Mobil 320 px, nettbrett 768 px, smalt skrivebord 832 px, 1280 px og stor skjerm: ingen vassrett overflyt eller manglande synlege bilete. På 320 px var svarflata festa 8 px frå toppen og inputen var 64 px høg og heilt synleg.
- Ingen konsollfeil eller åtvaringar frå spelet i kontrollfana. Kort- og myntanimasjonar har framleis vern for redusert rørsle.

Fysiske telefonar/nettbrett og elev-/lærarutprøving står att. Azure-preview blir kontrollert etter siste push; sjå PR-en for deploy-status.
