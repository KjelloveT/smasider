# Fykefuga

Barokk fartsspel med faglege vegval. HTML, CSS, Vanilla JavaScript, Canvas 2D og Web Audio.

## Avtalt designunntak

Brukaren har uttrykkeleg valt måla barokkstil for heile Fykefuga. Figurar, miljø, portar, hinder, applogo og ornament er rasterressursar (PNG/JPEG); SVG skal ikkje brukast til speldesignet. Felles Vyrdepil-navigasjon, Lucide-kontrollikon, lagring, dialogåtferd og Bragd-system blir brukte vidare. UI-tekst står svart på lyse flater. Unntaket er avgrensa til Fykefuga.

## Kontroll

Køyr `node fykefuga/tests/run.cjs`, og test appen i nettlesar med `serve.ps1`. Testane kontrollerer fysikk ved 30/60/120/144 Hz, alle hinderstykke, heile hovudbaner, 27 endelause løp med 100 rette vegval, omstart, deling og den publiserte rasterbanken.

Spelgrafikken er laga med den innebygde imagegen-tenesta. `assets/manifest.json` dokumenterer dimensjonar, filstorleikar og sjekksummar; `assets/CREDITS.md` dokumenterer kjelder og motiv. Originalar ligg lokalt i `_kjelder/logoar/`, `_kjelder/bakgrunnar/` og `_kjelder/fykefuga/` og blir ikkje publiserte.

Åtte øvingsbaner lærer bort éin kontroll kvar. Hovudbanene varer 44, 66, 88 og 110 sekund ved standard lesetid. Farten er 500 bane-einingar per sekund (tidlegare 310). Spelpartia varer 6,2 sekund med fire til seks hindergrupper: enkle og doble hopp, høge klossar, vekselvise tak-/golvhinder og flygeportar. Endelaus modus bruker same testa bank med 48 variantar. Terning og urverksløpar får ei einvegshylle i lesestrekninga slik at øvre vegval kan haldast utan presis timing av svarlina. Modusskifte gjev ein trygg inngang før neste hinder. Rekordnøkkelen skil den raskare banken frå tidlegare resultat.

Fysiske iPad- og Android-einingar må prøvast før endeleg merge. Responsiv nettlesarvising er ikkje ein erstatning for kontroll av faktisk berøring og mobillyd.

Musikk og spel-ljod kan prøvelyttast på startsida og har separate volumval. Fire eigne sekstentakts satsar bruker fiolin- og cellogrupper, cembalo og orgel med stereoplassering, romklang og dynamikkontroll. Åtte eigne PCM-klangar dekkjer strykarregisteret, med harmoniske partialar, kroppsresonansar, bogestøy og vibrato; dei er syntetiserte av oss og er ikkje opptak av eit akustisk orkester. Tre ulikt stemde og tidsforskyvde røyster gjev kvar strykargruppe breidd. Banken blir lasta før start og blir verande i minnet ved nettbortfall. `tests/presentation.html` gjer dei heile satsane med den faktiske miksen og kontrollerer klipping og signalnivå. `tests/responsive.html` køyrer den ekte spelsida i valde skjermstorleikar.

Presentasjonen har eigne modular for spor, lysband, eksos, hoppreaksjon, landing, teletransport og modusskifte. Effektane blir oppdaterte ved same faste steg som spelet og endrar aldri treffområde eller baner. Redusert dekor tek vekk partiklar, spor og skjermristing.
