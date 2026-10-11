# Banestudie: ReTraY i Fykefuga

11. oktober 2026. Dette er ei spelbar tolking av heile ReTraY-løypa, ikkje ein nøyaktig kopi av kvart objekt. White Space vart lagt bort fordi videogrunnlaget ikkje var presist nok. Den dekoda ReTraY-fila gjev koordinatar for modusskifte og fart, medan hinderrekkjer og kulissar her er forenkla og prøvde for Fykefuga sin motor.

## Grunnlag og avgrensing

ReTraY av DiMaViKuLov26 har bane-ID `6508283`. Den offentlege nivåstrengen vart henta frå Geometry Dash-tenaren og dekoda lokalt med Base64 og zlib. Han inneheld 20 000 objekt. Den dekoda strengen ligg berre i den ignorerte `_kjelder/fykefuga-menu/`-mappa. Kjelder til formatet er [nivåstrengen](https://github.com/gd-programming/gd.docs/blob/main/docs/resources/client/level-components/inner-level-string.md), [objektfelta](https://github.com/gd-programming/gd.docs/blob/main/docs/resources/client/level-components/level-object.md), [komprimeringa](https://github.com/gd-programming/gd.docs/blob/main/docs/topics/levelstring_encoding_decoding.md) og [objekt-ID-ane](https://flowvix.github.io/gd-info-explorer/ids). Sjå òg [omtalen av ReTraY](https://geometrydash.wiki.gg/wiki/ReTraY).

Banestudien byrjar med terning og går gjennom luftskip, sveveklokke, rullekule, luftskip, rask bølgje, automatisk terning, automatisk sveveklokke og siste svev. Modusportane står ved x=1729, 3525, 5145, 6402, 9255, 14309 og 14895. Fleire fartsportar ligg mellom dei; siste rolige parti byrjar ved x=17235. Målstreken er x=18345. Om lag 60 sekund ved 120 fysikksteg i sekundet.

## Spelbar tolking

- Fyrste piggar kjem frå baneobjekt ved x≈495 og x≈925. Marmorterrassane i opninga og i den automatiske delen har kvar sin synlege start og slutt. Ein kan lande oppå dei; sidene stoppar figuren.
- Luftskip, sveveklokke og bølgje får vekselvise portar i tak og golv. Rullekula må byte tyngderetning mellom piggar. Automatdelane tek over styringa i korte strekk, slik originalen gjer.
- Kvar modus- og fartsport har djupne: eit mørkt, bølgjande portrom ligg bak figuren, medan ei pulserande ljosramme, roterande glimt og ein kort ljosstrime blir teikna framfor idet figuren kryssar portplanet. Form eller fart skiftar ved dette planet. Ingen strekte klokker er brukte som støtte for portane. Overgangen får partiklar og eige spel-ljod. Redusert dekor stoggar roteringa.
- Kameraet går tettare på i dei låge gangane: frå 1,28–1,38× i dei romslegare delane til 1,63× under bølgja. Bølgjegangen er opna i høgda, og gapet mellom tak- og golvhinder er 146 speleiningar. Høgde og zoom blir jamt blanda ved overgangar. Kulissar og hinder har skilde lag og blir viste heilt til øvre kant.
- Ingen fagspørsmål, rekordar eller bragder er knytte til denne baneprøva. Spørsmålsfeltet er difor skjult. I dei andre banene viser feltet seg berre når eit spørsmål faktisk er aktivt. Kulissane er viste utan eit matt felt over speleplanet. Fykefuga sine andre baner er ikkje endra av kameraregelen.

All grafikk er Fykefuga sine eigne JPEG- og PNG-ressursar. Ingen SVG, original grafikk eller original lyd frå Geometry Dash er brukt. «Barokksteg» er ein original Spitfire-sats i d-moll på 108 slag/minutt. Dei fyrste aksentane fell nær opningspiggane; seinare hinderportar er lagde på den same globale slagklokka. Satsen har ei 32-slags sløyfe, startar på nytt saman med bana og følgjer pause. Dette er ei rytmisk studie, ikkje ei tone-for-tone gjenskaping av originalmusikken.

## Kontroll og vidare arbeid

Den automatiske spelprøva bruker dei faktiske fysikk- og banemodulane. Ei input-rekkje når mål etter 7203 fysikksteg, passerer alle 12 seksjonar og alle 11 portovergangane utan spørsmål. Prøva blir køyrd to gonger med same resultat; utan hopp døyr figuren ved fyrste pigg. `tests/retray.html` let ein bla gjennom alle portalane, plattformene og kameraområdet med den verkelege renderaren. Skrivebordsnettlesaren er kontrollert utan konsollfeil.

Dette provar ei mogleg rute gjennom alle delane, men ikkje at kvar elev vil oppleve balansen som rett. Særleg portplassering og musikalsk kjensle bør prøvast på fysisk iPad og Android før denne studien blir kalla ferdig bane. Dei fleste av originalen sine dekorative objekt og krevjande hinderkombinasjonar er framleis forenkla.
