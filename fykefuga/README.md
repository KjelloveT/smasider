# Fykefuga

Barokk fartsspel med faglege vegval. HTML, CSS, Vanilla JavaScript, Canvas 2D og Web Audio.

## Avtalt designunntak

Brukaren har uttrykkeleg valt måla barokkstil for heile Fykefuga. Figurar, miljø, portar, hinder, applogo og ornament er rasterressursar (PNG/JPEG); SVG skal ikkje brukast til speldesignet. Felles Vyrdepil-navigasjon, Lucide-kontrollikon, lagring, dialogåtferd og Bragd-system blir brukte vidare. UI-tekst står svart på lyse flater. Unntaket er avgrensa til Fykefuga.

## Kontroll

Køyr `node fykefuga/tests/run.cjs`, og test appen i nettlesar med `serve.ps1`. Testane kontrollerer fysikk ved 30/60/120/144 Hz, alle hinderstykke, heile hovudbaner, 27 endelause løp med 100 rette vegval, omstart, deling og den publiserte rasterbanken.

Spelgrafikken er laga med den innebygde imagegen-tenesta. `assets/manifest.json` dokumenterer dimensjonar, filstorleikar og sjekksummar; `assets/CREDITS.md` dokumenterer kjelder og motiv. Originalar ligg lokalt i `_kjelder/logoar/`, `_kjelder/bakgrunnar/` og `_kjelder/fykefuga/` og blir ikkje publiserte.

Åtte øvingsbaner lærer bort éin kontroll kvar. Hovudbanene varer 44, 66, 88 og 110 sekund ved standard lesetid. Farten er 500 bane-einingar per sekund (tidlegare 310). Spelpartia varer 6,2 sekund med fire til seks hindergrupper: enkle og doble hopp, høge klossar, vekselvise tak-/golvhinder og flygeportar. Endelaus modus bruker same testa bank med 48 variantar. Terning og urverksløpar får ei einvegshylle i lesestrekninga slik at øvre vegval kan haldast utan presis timing av svarlina. Modusskifte gjev ein trygg inngang før neste hinder. Rekordnøkkelen skil den raskare banken frå tidlegare resultat.

Fysiske iPad- og Android-einingar må prøvast før endeleg merge. Responsiv nettlesarvising er ikkje ein erstatning for kontroll av faktisk berøring og mobillyd.

Musikk og spel-ljod kan prøvelyttast på startsida og har separate volumval. Fire originale Spitfire-satsar med innspelte fiolinar, bratsj og cello varer 65–83 sekund. Dei komprimerte filene blir lasta før start; to dekoda tema blir haldne i hurtiglageret, og andre kan dekodast frå dei lagra byta ved nettbortfall. Musikkposisjonen blir bevart ved pause, omstart byrjar frå starten, og endelaus modus skifter sats mjukt med miljøet. `assets/audio/music-v1.json` dokumenterer tempo, sløyfegrenser, MP3-referansar og sjekksummar. `tests/presentation.html` prøver dei faktiske filene ved 44,1 og 48 kHz, inkludert sløyfeskøyt og lydstyring. `tests/responsive.html` køyrer den ekte spelsida i valde skjermstorleikar.

Presentasjonen har eigne modular for spor, lysband, eksos, hoppreaksjon, landing, teletransport og modusskifte. Effektane blir oppdaterte ved same faste steg som spelet og endrar aldri treffområde eller baner. Redusert dekor tek vekk partiklar, spor og skjermristing.

`scenery.js` førebur ni rasterflater før start. Spegla kantar gjev samanhengande bakgrunnsskøytar; kulissar bevarer sideforholdet, og rette golvstriper blir klipte framfor strekte. Golv, tak, svarhylle og hinder følgjer same verdskamera. `motion.js` interpolerer visinga mellom dei faste 120 Hz-stega, med høgst eitt steg (8,3 ms) visingsforskyving. Teletransport held seg momentan. Kulerotasjon er samanhengande ved gravitasjonsbyte, og svingfarkosten snur mjukt. Fysikk, treffområde, fart og rekordgrunnlag er uendra.

`tests/scrolling.html` viser rullinga gjennom fleire bakgrunnsgjentakingar og kontrollerer alle åtte skøytar med faktiske biletpikslar. Ho kan opnast lokalt og i Azure-prøveutgåva.