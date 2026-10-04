# Livslina — prøveplan for figurbyggjar med spriteark

## Mål

Ei eiga prøveside skal vise at fem hudtonar, fem andlet, fem frisyrar og fem antrekk kan bytast kvar for seg. Prøva er eit arbeidsverktøy for ressursbiblioteket, ikkje ein del av spelegangen eller speleøkonomien.

## Figur og ressursar

- Bruk det detaljerte, gjennomsiktige spritearket assets/prototype/characters/character-builder-atlas-v4.png.
- Arket inneheld fem figurar med hudtonar, fem andletsuttrykk, fem frisyrar og fem antrekk. Utsnitta er registrerte i character-builder-test-manifest.json.
- Samansetjinga skjer på ei fast gjennomsiktig arbeidsflate på 192 × 256 pikslar. Kroppen held same storleik, midtlinje og grunnlinje for alle val.
- Behald pikselkantane med næraste-nabo-skalering. Ingen variant får eiga proporsjonsstrekkjing eller CSS-rotasjon.
- Stilen er detaljert 8-bit med fleire skugge- og lystonar, tydelege konturar, stofftekstur og smådetaljar. Fargane er merkeuavhengige.

## Lag og teiknerekkjefølgje

1. **Hud og kropp:** vel eitt av fem fullfigurlag med same positur og grunnlinje.
2. **Klede:** legg valt antrekk over kroppen i same sentrumslinje og med føtene på same grunnlinje.
3. **Hår:** plasser frisyra med felles hovudfeste; storleik kan variere proporsjonalt mellom frisyretypane.
4. **Andlet:** legg andletsdraga øvst slik at auge, uttrykk og særtrekk held seg synlege.

Alle sprites blir teikna frå registrerte rektangel i same PNG. Bileta skal lastast lokalt frå prosjektmappa; prøva skal ikkje hente noko frå nettet eller lagre brukarval.

## Val i prøva

Fire uavhengige veljarar har fem namngjevne alternativ kvar: hudtone, andlet, frisyre og klede. Det gjev 625 moglege kombinasjonar. «Tilfeldig figur» trekkjer eitt alternativ i kvar gruppe; «Start på nytt» vel fyrste alternativ i kvar gruppe. Valde namn skal stå synleg.

## Filstruktur

- assets/prototype/character-builder-test.html — prøvesida.
- assets/prototype/character-builder-test.css — responsiv framvising og pikselert skalering.
- assets/prototype/character-builder-test.js — val, samansetjing, tilfeldig figur og tilbakestilling.
- assets/prototype/character-builder-art.js — utsnitt og lagrekkjefølgje for spritearket.
- assets/prototype/characters/character-builder-atlas-v4.png — komprimert ressursark med gjennomsiktig bakgrunn.
- assets/prototype/character-builder-test-manifest.json — kategoriar, utsnitt, mål og kombinasjonstal.

## Kontroll

- Stadfest at spritearket lastar utan nettverkskall, og at alle 20 val teiknast innanfor den gjennomsiktige 192 × 256-flata.
- Prøv ytterkombinasjonar for lys og mørk hud, alle fem andlet, alle fem frisyrar og alle fem antrekk.
- Veljarane skal berre endre si eiga gruppe. Tilfeldig-knappen endrar alle fire; tilbakestilling gjev same startfigur.
- Test tastaturfokus og smal mobilbreidd. Sjå etter avklipt hår eller klede, ujamn skalering, feil grunnlinje og vassrett overflyt.
- Hald prøva utan lagring, nettverkskall eller kopling til speleøkonomien.
