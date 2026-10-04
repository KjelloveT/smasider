# Livslina — plan for lagdelt karakterbyggjarprøve

## Mål

Lage ei eiga, lokal prøveside som viser at hår, andlet, hud og klede kan bytast kvar for seg og framleis passe saman. Prøva er eit arbeidsverktøy for ressursbiblioteket, ikkje ein del av spelgangen eller økonomien.

## Figur og arbeidsflate

- Bruk ein ny, nøytral ståande figur i avslappa frontstilling, teikna frå blankt utgangspunkt.
- Alle lag blir teikna på same gjennomsiktige arbeidsflate på 96 × 128 logiske pikslar, med same origo, kroppsstorleik og føter på same grunnlinje.
- Teiknestilen er detaljert 8-bit med tydelege pikselkonturar, små fargeklasar, lys frå øvre venstre og reine gjennomsiktige kantar. Hald fargar og motiv merkeuavhengige.
- Teikn pikselgruppene lokalt på prøvesida; ho skal fungere utan nettverk, lagring eller eksterne bibliotek.

## Lag og teiknerekkjefølgje

1. **Hud og kropp:** fem hudtonar på same kroppssilhuett, med synlege lys- og skuggetrinn. Kroppen har blankt andlet, hår og kledeområde. Hender blir teikna på nytt etter kleda slik at dei ikkje forsvinn under ermane.
2. **Klede:** fem heile antrekk som dekkjer overkropp og bein, men let hals, hender og synlege hudflater kome fram. Antrekka er frie val, ikkje kjønns- eller hudtonebundne.
3. **Andlet:** fem andletsuttrykk/trekk med auge, bryn og munn plasserte likt. Særtrekk som fregner eller briller kan variere, men skal ikkje skjule auge eller hudfarge.
4. **Hår:** fem tydeleg ulike frisyreformer og teksturar. Håret ligg øvst; side- og baklokk skal ikkje flytte hovudet eller dekkje andletsdraga utilsikta.

Samansetjing skjer på den same 96 × 128-flata i rekkja kropp/hud, klede, synlege hender, andlet og hår. Ho blir skalert pixelert; ingen variant får eiga storleik eller CSS-transformasjon.

## Val i prøva

Fire uavhengige veljarar skal ha fem namngjevne alternativ kvar: hudtone, andlet, frisyre og antrekk. Det gjev 625 moglege kombinasjonar. «Tilfeldig figur» trekkjer eitt alternativ i kvar gruppe; «Start på nytt» vel fyrste alternativ i kvar gruppe. Valde namn skal visast som lesbar tekst.

Andre detaljrunde gjer andleta til eit breitt smil, overrasking, briller, blunk med fregner og eit sjølvsikkert uttrykk. Antrekka er ein hettegenser, open jakke, mønstra strikkegenser, overall med T-skjorte og skjorte med krage. Snitt, uttrykk og små detaljar skal vere synlege ved vanleg vising, ikkje berre ved forstørring.

## Filstruktur

- `assets/prototype/character-builder-test.html` — prøvesida.
- `assets/prototype/character-builder-test.css` — responsiv framvising og pikselert skalering.
- `assets/prototype/character-builder-test.js` — val, samansetjing, tilfeldig figur og tilbakestilling.
- `assets/prototype/character-builder-art.js` — pikselgrupper og fem teiknevariantar per lag.
- `assets/prototype/character-builder-test-manifest.json` — kategoriar, namn, mål, rekkjefølgje og kombinasjonstal.

## Kontroll

- Stadfest at kvart lag blir teikna innanfor den gjennomsiktige 96 × 128-flata.
- Kontroller alle 20 variantane og fleire ytterkombinasjonar visuelt: lys/mørk hud, kort/langt/teksturert hår og alle antrekk.
- Ansiktsvala skal skiljast med augeform, bryn og munn, ikkje berre små pyntedetaljar. Klesvala skal ha ulike snitt eller konstruksjonsdetaljar, ikkje berre ulik farge.
- Test at veljarane berre endrar si eiga familie, tilfeldig-knappen endrar alle fire, og tilbakestilling gjev same startfigur.
- Test tastaturfokus og smal mobilbreidd, og sjå etter hol, ujamn skalering, avklipt hår eller klede og vassrett overflyt.
- Hald prøva utan lagring av brukarval, nettverkskall eller speleøkonomiske verdiar.
