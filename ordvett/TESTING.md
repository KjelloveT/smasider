# Kontroll av UvissaOrd

Kontrollert 24. oktober 2026 på greina `feat/ordvett-hintspel`, vidareført frå den opne PR-en #124. Fersk `origin/main` var `6398a1a`. Produksjonsframsida viste 2.3.1; `ordvett/` gav framsida som reserve, ikkje det nye spelet. App-ID og adresse er haldne stabile ved namnebyte.

## Spelreglar og lagring

- 26 automatiske testar passerer: kjeldemerkt ordbank, hintprisar, normerte svar, eingongskjøp, tomme bokstavplassar, gjentekne feil, maks 40 myntar, gjenoppretting, norsk midnatt/vintertid, arkivdatoar, skotår, ugyldige datoar, avgrensa lagring og idempotent oppgradering.
- Regelversjon 4 har ein pott på 40 myntar. Hintprisane er uendra, og nye feil svar kostar 2. Alle 20 feil i éi oppgåve kan gjenopprettast etter ny innlasting, utan fleire trekk eller negativ pott.
- Lagringsformat 3 hugsar vald arkivdato, inntil 40 dagsrundar og 40 resultat. Ei påbyrja runde frå 30-myntutgåva kan halde fram med 40-potten, utan at kjeldefelta blir endra. Svartekst og namn blir ikkje lagra.
- Alle JavaScriptfilene er syntakskontrollerte. Bankversjonen er 2026-10-24.1.

## Nettlesar

Lokal tenar brukar dei handheva tryggingsheaderane og CSP frå produksjonskonfigurasjonen. Han køyrer som ein skjult bakgrunnsprosess. Kontrollen vart gjort i ei separat Chrome-fane på `127.0.0.1:8081`, med eiga lagring, for å la den opne brukarrunden på `localhost` vere i fred.

- Dagens sett vart fullført med 5/5 ord og 15 brukte myntar. Det omfatta fleire tilfeldige bokstavar, betalt plass 30 i «lampe» og betalt plass 5 i «vegg», som ikkje finst. Hintplassane vart tomme i butikken, og kjøpte hint vart samla i små kort med tre kolonnar på større skjermar og to på mobil.
- Fleire kjøp av tilfeldig eller vald bokstav fungerer frå det kjøpte kortet. Same bokstavplass kostar ikkje på nytt. Nye oppgåver ryddar dei kjøpte korta og fyller butikken att.
- Svarfeltet er 64 px høgt og ligg i ei tydeleg lys flate. Ved rulling på 320 px vart svarflata målt til topp 8 px, med heile inputen synleg. Myntteljaren stod til høgre for butikkoverskrifta.
- Den interaktive prøverunden vart fullført gjennom kjøp av ordlengd, bokstav og tyding og deretter svaret «eple». Dagens runde hadde dei same 35 myntane att og dei same bokstavhinta etter retur og ny innlasting. Prøverunden vart òg avslutta med Escape. På 320 px tek den fyrste rettleiinga 130 px, og svarfeltet kjem fram når det er svarsteget sin tur.
- Kalenderen opna 29. februar 2024. Den runden heldt fram med same hint etter ny innlasting, vart fullført med fasit, og fekk ferdigmarkering i kalenderen. Dagens runde var uendra. Dagens og framtidige datoar kan ikkje veljast i arkivmodusen.
- Kontroll av mobil (320 px), nettbrett (768 px), mellomstor og stor skjerm. Ingen vassrett overflyt eller manglande synlege bilete. Synlege handlingsknappar er minst 44 px høge. Appnamnet held seg på éi linje på smal mobil.
- Ingen konsollfeil frå UvissaOrd. Separate meldingar frå Chrome si Zotero-utviding er ikkje spelkode.
- Kort- og myntanimasjonar tek omsyn til redusert rørsle. Kjøpte/utilgjengelege varer reagerer ikkje på klikk eller hover.

## Avgrensingar

Felles UI-kontroll går gjennom 80 HTML-sider og finn dei same to eksisterande modalfeila i Heite Stavrim og Ormritaren; ingen kjem frå UvissaOrd. Fysiske telefonar/nettbrett og elev-/lærarutprøving står att.

Azure-preview for PR 124 har tidlegare vorte stoppa av «maximum number of staging environments». Siste deploy blir kontrollert etter push. Ingen eksisterande miljø blir sletta, og ingen endringar blir lagde på `main`.