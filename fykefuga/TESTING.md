# Kontroll av Fykefuga — 10. oktober 2026

## Automatisk kontroll

`node fykefuga/tests/run.cjs`: 564 kontrollar består. Prøva bruker dei faktiske modulane og kontrollerer rørsle ved 30, 60, 120 og 144 biletruter per sekund, begge svarvegar i alle åtte modusar, alle 48 hinderstykke med 500 einingar/sekund og fire til seks hindergrupper, alle hovudbaner med 2/4/6 sekund lesetid og 27 endelause løp med 100 rette vegval. Ho kontrollerer òg tynne hinder, rask input, halde kontroll ved omstart, same spørsmålsrekkje, varierande svarplassering, lokal lagring, kosmetikk, Bragd-vilkår, importformat og gamle Ordaklok-lenkjer. Rasterformat, polstra figurspritar, PCM-format, sjekksummar, filstorleik, modulstorleik og fråvær av SVG i spelmodulane blir kontrollerte.

Musikkprøvene kontrollerer fire instrumentgrupper, gyldige notar, full sats, gjentaking og tretakt i menuetten. Presentasjonen har avgrensa partikkeltal og sporhistorikk, endrar ikkje speltilstanden og fjernar partiklar og skjermristing ved redusert dekor.

`node designsystem/manage-backgrounds.cjs check`: ingen appar utan bakgrunnsreservasjon. `git diff --check` består.

## Nettlesar

Prøvd i skrivebordsnettlesaren med lokal tenar:

- Start, styring med tastatur, rask omstart, pause, nedteljing, fullskjerm, ljod av/på og redusert dekor. Bølgjefarkosten har synleg lysband; presentasjonen gjev ingen konsollfeil.
- Oppretting og lagring av ordpar, førehandsvising, deling med komprimert fragment, opning i ny elevfane og JSON-eksport. Æ, ø og å blir tekne vare på.
- Import med lang tekst blir merkt utan avkutting. HTML-teikn blir viste som vanleg tekst. Ugyldig JSON blir avvist. Ei eldre Ordaklok-lenkje blir opna og den gamle spørjestrengen blir rydda etter lesing.
- Spelet held fram med grafikk, spørsmål og ljod etter at den særskilde prøvetenaren er stoppa. Prøvetenaren handheva produksjonen sine tryggingsheadarar.
- Den ekte spelsida er prøvd i rammer på 375 × 812, 568 × 320, 844 × 390 og 1024 × 768, og på PC ved 1280 × 720. Ingen vassrett overflyt; liggjande spelvising passar innan høgda. Dette prøver CSS-oppsettet og er ikkje fysisk einingstesting.

`tests/presentation.html` prøver heile satsar med den faktiske Web Audio-miksen i OfflineAudioContext. Den nye PCM-strykarbanken er med i prøva. Alle fire består med null klipte eller ugyldige verdiar og fungerande stereo. Toppnivå ligg på 0,194–0,225 og RMS på 0,042–0,045 ved standardvolum. Startsida har prøvelytting til dei fire satsane og spel-ljoden.

## Før merge

Fysisk iPad/Safari og Android må framleis prøvast med berøring, skjermrotasjon, fullskjerm, nettbortfall og ljod i høgtalarar og hovudtelefonar. Input blir handsama neste fysikksteg. Faktisk responstid innan to biletruter må målast på dei aktuelle mobile einingane under vanleg belastning. Den endelege musikalske vurderinga krev prøvelytting.

Dei eksisterande globale stilkontrollane har feil frå før denne greina: modalreglar i `heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`, og ein feilrapport for ei innebygd ikonadresse i felles CSS. Desse filene er uendra i Fykefuga-PR-en.

## Rulling og kulissar

Den nye prøva `tests/scrolling.cjs` kontrollerer jamn kamerafart og samordna figurrørsle ved 30/60/120/144 Hz, utan å endre speltilstanden. Ho prøver også omstart, momentan teletransport, kulerotasjon ved gravitasjonsbyte og pause, faste hylleteksturar, dekorproporsjonar og uendra tal på rasterflater gjennom kamerarundgang.

`tests/scrolling.html` bruker dei faktiske rasterressursane og teiknemodulane. Lokal nettlesarprøve med handheva tryggingsheadarar gav størst gjennomsnittleg pikselendring på 0,147 av 255 over dei åtte bakgrunnsskøytane. Alle består grensa på 1. Kameraet går gjennom fleire gjentakingar utan å lage nye rasterflater; golv og tak har rette kanter, og kulissane held sideforholdet. Den ekte spelsida er prøvd med hinder, hopp, svarhylle, pause og omstart. Ingen konsollfeil vart funne. Dette er ikkje ei måling av biletrutetid på fysiske nettbrett.