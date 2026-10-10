# Kontroll av Fykefuga — 10. oktober 2026

## Automatisk kontroll

`node fykefuga/tests/run.cjs`: 437 kontrollar består. Prøva bruker dei faktiske modulane og kontrollerer rørsle ved 30, 60, 120 og 144 biletruter per sekund, begge svarvegar i alle åtte modusar, alle 48 hinderstykke, alle hovudbaner med 2/4/6 sekund lesetid og 27 endelause løp med 100 rette vegval. Ho kontrollerer òg tynne hinder, rask input, halde kontroll ved omstart, same spørsmålsrekkje, varierande svarplassering, lokal lagring, kosmetikk, Bragd-vilkår, importformat og gamle Ordaklok-lenkjer. Rasterformat, sjekksummar, filstorleik, modulstorleik og fråvær av SVG i spelmodulane blir kontrollerte.

Musikkprøvene kontrollerer fire instrumentgrupper, gyldige notar, full sats, gjentaking og tretakt i menuetten. Presentasjonen har avgrensa partikkeltal og sporhistorikk, endrar ikkje speltilstanden og fjernar partiklar og skjermristing ved redusert dekor.

`node designsystem/manage-backgrounds.cjs check`: ingen appar utan bakgrunnsreservasjon. `git diff --check` består.

## Nettlesar

Prøvd i skrivebordsnettlesaren med lokal tenar:

- Start, styring med tastatur, rask omstart, pause, nedteljing, fullskjerm, ljod av/på og redusert dekor. Bølgjefarkosten har synleg lysband; presentasjonen gjev ingen konsollfeil.
- Oppretting og lagring av ordpar, førehandsvising, deling med komprimert fragment, opning i ny elevfane og JSON-eksport. Æ, ø og å blir tekne vare på.
- Import med lang tekst blir merkt utan avkutting. HTML-teikn blir viste som vanleg tekst. Ugyldig JSON blir avvist. Ei eldre Ordaklok-lenkje blir opna og den gamle spørjestrengen blir rydda etter lesing.
- Spelet held fram med grafikk, spørsmål og ljod etter at den særskilde prøvetenaren er stoppa. Prøvetenaren handheva produksjonen sine tryggingsheadarar.
- Den ekte spelsida er prøvd i rammer på 375 × 812, 568 × 320, 844 × 390 og 1024 × 768, og på PC ved 1280 × 720. Ingen vassrett overflyt; liggjande spelvising passar innan høgda. Dette prøver CSS-oppsettet og er ikkje fysisk einingstesting.

`tests/presentation.html` prøver heile satsar med den faktiske Web Audio-miksen i OfflineAudioContext. Alle fire består med null klipte eller ugyldige verdiar og fungerande stereo. Toppnivå ligg på 0,220–0,265 og RMS på 0,039–0,046 ved standardvolum. Startsida har prøvelytting til dei fire satsane og spel-ljoden.

## Før merge

Fysisk iPad/Safari og Android må framleis prøvast med berøring, skjermrotasjon, fullskjerm, nettbortfall og ljod i høgtalarar og hovudtelefonar. Input blir handsama neste fysikksteg. Faktisk responstid innan to biletruter må målast på dei aktuelle mobile einingane under vanleg belastning. Den endelege musikalske vurderinga krev prøvelytting.

Dei eksisterande globale stilkontrollane har feil frå før denne greina: modalreglar i `heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`, og ein feilrapport for ei innebygd ikonadresse i felles CSS. Desse filene er uendra i Fykefuga-PR-en.
