# Ressursprøve v5

Dette er ei samansett prøve med 126 detaljerte 8-bit-sprites. Av dei er 95
nye produktvariantar fordelte på ni møbelfamiliar og ti pyntekategoriar, med
fem prisnivå i kvar. Sengene har ei eiga femstegs kvalitetsstige frå ei
heimelaga ramme til ei eksklusiv hev- og senk-seng.

## Skil mellom geometri og stil

- `../layout-room-model.js` fastset mål, kamera, retning, kontaktpunkt,
  veggfeste og plassering.
- `guides/` har fem separate, grå geometrimalar og ei kontaktoversikt per
  produktfamilie. Dei styrer silhuett og feste, ikkje ferdig stil.
- `items/` har dei gjennomsiktige pikselillustrasjonane med detaljert
  materialteikning, fleire skuggelag, små pikselklynger og tydelege konturar.
  Stilreferansane styrer berre detaljnivået; motiv, palett, karakterar og
  romkomposisjon blir ikkje kopierte.
- `item-catalog.js` er kjelda for familienamn, fem variantmål og førebelse
  prisar. `bed-price-ladder.js` held sengene sine eigne prisidéar.

## Produktfamiliar

Dei ni møbelfamiliane med fem nivå kvar er TV-benk, TV, kontorpult,
kontorstol, PC-tårn, hifisystem, plante, teppe og nattbord. TV-benken går frå
pappkasser til ein luksusbenk med RGB. TV-en går frå ein skjerm på
nettbrettstorleik til 130 cm breidd, som er største trygge breidd på benken.

Dei ti pynteslaga har fem variantar kvar: plakat, spegel, oppslagstavle,
lysande veggskilt, skrivebordslampe, vekkjarklokke, kosedyr, samlefigurar,
bøker og sminkepakke.

## Feste og samansetjing

TV-en er ei sjølvstendig vare. Han og føtene blir festa midt på TV-benken, så
stor eller høg benk flyttar TV-en med seg. PC-tårnet er også ei eiga vare og
står på det lokale festet på pulten. Skjerm og tastatur inngår i pultsprite.
Sminkepakke og anna småpynt sit på ei eiga bordflateplassering. Veggpynt festest i høgre
veggplanet; når slik pynt blir prøvd, skjuler prøverommet dei andre høgre
veggtinga. Hifisystem, plante eller nattbord brukar same valfrie golvplass éin
om gongen. Hifisystemet står langs høgre vegg utanfor sofaens sideprojeksjon,
slik at høgtalarane ikkje blir dekte av sofaen.

Alle spritear er proporsjonale og gjennomsiktige. Kontaktpunkt kjem frå
rommodellen; teikningane blir ikkje spegelvende eller ulikt strekte. Lyssettinga
er jamn og nøytral, utan kveldssol, frie lysglorier eller slagskuggar som
flyttar golvkontakten.

Prøvesida `../layout-asset-test.html` lèt ein byte mellom variantane og
randomisere heile rommet. Ho viser også mål og feste. Prisane er førebelse
spelidéar, ikkje butikkprisar og ikkje kopla til speløkonomien.

Sjå [samla prøve av dei ti pynteslaga](../room/decor-room-tests.png) og
[sminkepakka festa til pulten](../room/makeup-set-attachment.png). Hifisystemet
er flytta langs høgre vegg, utanfor omrisset til sofaen i romprojeksjonen; [her er dei fem
hifinivåa i rommet](../room/hifi-placement-preview.png).

## Status

Mål, festepunkt og biletfiler er lista i `manifest.json`. Spritefamiliane er
viste i den samansette romprøva, men er framleis prototypeillustrasjonar.
Vurder kvar familie og kombinasjon vidare før endeleg bruk i spelet. Felles
stil- og motivinstruks ligg i `prompts.md`.
