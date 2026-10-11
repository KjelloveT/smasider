# Kontroll av Fykefuga — 11. oktober 2026

## Automatisk kontroll

`node fykefuga/tests/run.cjs`: 570 kontrollar består etter den heile baneprøva. Prøva bruker dei faktiske modulane og kontrollerer rørsle ved 30, 60, 120 og 144 biletruter per sekund, begge svarvegar i alle åtte modusar, alle 48 hinderstykke med 500 einingar/sekund og fire til seks hindergrupper, alle hovudbaner med 2/4/6 sekund lesetid og 27 endelause løp med 100 rette vegval. Ho kontrollerer òg ei heil spørsmålsfri ReTraY-prøve på om lag 60 sekund: alle 12 seksjonane, 11 portar, zoom i låge gangar, endelege plattformer, alle hinder og deterministisk fullføring etter 7203 fysikksteg. Elles prøver ho plattformlandingar, tynne hinder, rask input, halde kontroll ved omstart, same spørsmålsrekkje, varierande svarplassering, lokal lagring, kosmetikk, Bragd-vilkår, importformat og gamle Ordaklok-lenkjer. Rasterformat, polstra figurspritar, dei fem MP3-temaa, sjekksummar, filstorleik, modulstorleik og fråvær av SVG i spelmodulane blir kontrollerte.

`node fykefuga/tests/music.cjs` har 76 kontrollar for MP3-dekoding med og utan startforskyving ved 44,1/48 kHz, pauseposisjon, omstart, avbrotne og kølagde temabyte, høgst to dekoda tema, nettbortfall og uavhengig muting av musikk og spel-ljod. Presentasjonen har avgrensa partikkeltal og sporhistorikk, endrar ikkje speltilstanden og fjernar partiklar og skjermristing ved redusert dekor.

`node designsystem/manage-backgrounds.cjs check`: ingen appar utan bakgrunnsreservasjon. `git diff --check` består.

## Nettlesar

Prøvd i skrivebordsnettlesaren med lokal tenar:

- Start, styring med tastatur, rask omstart, pause, nedteljing, fullskjerm, ljod av/på og redusert dekor. Bølgjefarkosten har synleg lysband; presentasjonen gjev ingen konsollfeil.
- Oppretting og lagring av ordpar, førehandsvising, deling med komprimert fragment, opning i ny elevfane og JSON-eksport. Æ, ø og å blir tekne vare på.
- Import med lang tekst blir merkt utan avkutting. HTML-teikn blir viste som vanleg tekst. Ugyldig JSON blir avvist. Ei eldre Ordaklok-lenkje blir opna og den gamle spørjestrengen blir rydda etter lesing.
- Spelet held fram med grafikk, spørsmål og ljod etter at den særskilde prøvetenaren er stoppa. Prøvetenaren handheva produksjonen sine tryggingsheadarar.
- Den ekte spelsida er prøvd i rammer på 375 × 812, 568 × 320, 844 × 390 og 1024 × 768, og på PC ved 1280 × 720. Ingen vassrett overflyt; liggjande spelvising passar innan høgda. Dette prøver CSS-oppsettet og er ikkje fysisk einingstesting.

`tests/presentation.html` dekodar dei fem publiserte Spitfire-filene med dei faktiske spelmodulane ved 44,1 og 48 kHz. Alle ti prøver består. Nettlesaren fjernar MP3-startforskyvinga; bølgjeformreferansen gjev samsvar 1,0000, rett lengd og sløyfestart 0. Ingen klipping, ugyldige verdiar eller stille hol ved skjøten. Toppnivå i dei dekoda filene ligg på 0,834–0,870. Prøva spelar over den ekte sløyfegrensa med OfflineAudioContext og prøver òg den faktiske lydstyringa: pause, vidareføring frå same posisjon, omstart, separate volumval og sein dekoding etter eit avbrote temabyte.

Den lokale tenaren handhevar produksjonen sine tryggingsheadarar. Alle musikkfiler blir henta frå same origin; ingen ny CSP-origin eller ny lagring er naudsynt. Spitfire-samples, plugin, separate stemmer og WAV-masterar blir ikkje publiserte.

## Før merge

Fysisk iPad/Safari og Android må framleis prøvast med berøring, skjermrotasjon, fullskjerm, nettbortfall og ljod i høgtalarar og hovudtelefonar. Input blir handsama neste fysikksteg. Faktisk responstid innan to biletruter må målast på dei aktuelle mobile einingane under vanleg belastning. Den endelege musikalske vurderinga krev prøvelytting.

Dei eksisterande globale stilkontrollane har feil frå før denne greina: modalreglar i `heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`, og ein feilrapport for ei innebygd ikonadresse i felles CSS. Desse filene er uendra i Fykefuga-PR-en.

## Rulling og kulissar

Den nye prøva `tests/scrolling.cjs` kontrollerer jamn kamerafart og samordna figurrørsle ved 30/60/120/144 Hz, utan å endre speltilstanden. Ho prøver også omstart, momentan teletransport, kulerotasjon ved gravitasjonsbyte og pause, faste hylleteksturar, dekorproporsjonar og uendra tal på rasterflater gjennom kamerarundgang.

`tests/scrolling.html` bruker dei faktiske rasterressursane og teiknemodulane. Lokal nettlesarprøve med handheva tryggingsheadarar gav størst gjennomsnittleg pikselendring på 0,147 av 255 over dei åtte bakgrunnsskøytane. Alle består grensa på 1. Kameraet går gjennom fleire gjentakingar utan å lage nye rasterflater; golv og tak har rette kanter, og kulissane held sideforholdet. Den ekte spelsida er prøvd med hinder, hopp, svarhylle, pause og omstart. Ingen konsollfeil vart funne. Dette er ikkje ei måling av biletrutetid på fysiske nettbrett.

Hindera er prøvde utan synlege treffområderammer. Lokal nettlesarprøve viser reine rasterhinder, fungerande hopp, krasj og omstart, med tom feil- og åtvaringslogg. Kollisjonsmodulen er uendra, og JavaScript-syntaksen består kontroll.

## Heil ReTraY-prøve

`tests/retray.html` viser den faktiske renderaren for alle 12 seksjonane med ein posisjonsskyvar. Portopninga blir liggjande på den testa figurruta, bakljoset ligg bak figuren, og ei pulserande ljosramme, roterande glimt og ein kort ljosstrime legg seg over figuren ved kryssing. Lokal nettlesarprøve av opning, marmorterrassar, luftskipport, breiare bølgjegang og automatdel gav ingen konsollfeil. Spørsmålspanelet er synleg berre ved aktive spørsmål, og det matte bakgrunnsfeltet er fjerna; takhindera blir teikna heilt opp til kanten. Synsprøva kan spele den fullførte ruta frå ein vald posisjon for å vise rørsla i porten. `tests/retray.cjs` køyrer ei full input-rekkje to gonger, prøver at alle portane blir passerte og at manglande hopp fører til krasj. Musikksløyfa er 32 slag ved 108 slag/minutt, medan seinare hinderportar er plasserte på den globale slagklokka. Fysisk nettbrett- og mobilprøve står framleis att.
