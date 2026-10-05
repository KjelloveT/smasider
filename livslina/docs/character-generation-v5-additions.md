# Karaktervariantar v5.1 — generasjonsnotat

Dato: 5. oktober 2026. Dei 15 nye teikningane vart laga som separate, transparente pikselressursar med same meisterfigur og detaljnivå som v5. Romguiden vart berre brukt som geometrisk referanse; han styrer ikkje figurstilen. Kvar råteikning vart registrert inn i den faste 1024 × 1536-guiden og pakka til ei fullramme på 512 × 768. Nettlesaren flyttar eller skalerer ikkje laga.

Felles føring for alle variantane: rett-fram meisterfigur i avslappa positur, varm mørk pikselkontur, tydelege fargeklynger og skuggar, gjennomsiktig bakgrunn utan glød. Hald meisterfiguren sine feste, ansiktsområde og kledegrenser. Lag éin ressurs per variant, ikkje eit atlas.

## Andletsuttrykk 06–10

| ID | Variant | Teikneintensjon |
|---|---|---|
| face-06 | Lattermild | Lukka smiljande auge og open, tydeleg lattermunn. |
| face-07 | Søvnig | Halvt lukka auge, mjuke bryn og roleg munn. |
| face-08 | Nysgjerrig | Auge og bryn med ulik høgd, lett sideblikk og liten open munn. |
| face-09 | Bekymra | Indre bryn litt opp, varsamt blikk og varsam munn. |
| face-10 | Konsentrert | Samla bryn, stødig blikk og lukka munn. |

Andletlaga inneheld berre trekk. Augegruppa blir registrert til dei faste augesentra, og munnen til den målte munnsona. Meisterfiguren tilfører nase og hud. Ingen variant skal ha eit eige hovud, augebakgrunn eller hudflekker.

## Korte frisyrar 06–10

| ID | Variant | Teikneintensjon |
|---|---|---|
| hair-06 | Rufsete quiff | Kastanjebrunt, teksturert kort hår med sveip opp og til sida. |
| hair-07 | Tett krølltopp | Mørk, tett krølltopp med jamn kort nakke og synleg krølltekstur. |
| hair-08 | Sidesveipt pixie | Raudbrun kortklipp med mjuke, sidesveipte lokkar. |
| hair-09 | Kjevelang blåsvart bob | Mørk blåsvart bob med kort, avrunda form ved kjeven. |
| hair-10 | Luftig blond kortklipp | Lys blond, mjuk kortklipp med luftige pannelokkar. |

Dei fem korte frisyrene treng ikkje hår bak nakken. Baklaga er gjennomsiktige, medan heile frisyresilhuetten ligg i framlaget. Felles vern maskerer ansiktsopninga slik at lokkar ikkje dekkjer auge eller andlet.

## Klesstilar 06–10

| ID | Variant | Teikneintensjon |
|---|---|---|
| clothes-06 | Burgundarraud collegejakke | Collegejakke med kremfarga ermar, mørk burgundarraud kropp og turkis trøye. |
| clothes-07 | Lilla cardigan og plissé-skjørt | Mjuk lilla cardigan over stripete topp, med plissert skjørt og ugjennomsiktig strømpebukse. |
| clothes-08 | Rutete flanell og cargobukse | Oransje/blågrøn rutete skjorte over grå topp, med cargobukse og synlege lommer. |
| clothes-09 | Blått treningssett | Djupt blå jakke og bukse med varme gullgule detaljar. |
| clothes-10 | Salviegrøn rugbyskorte | Stripete rugbyskorte i salviegrønt over tanfarga kordfløyelsbukse. |

Alle klede blir lagde over meisterkroppen av den same produksjonsmasken. Ho fjernar hovud og hender frå kjeldekompositten og bevarer dei faste hals- og handleddsfestene. Difor kan rågeneratorbiletet sjå ut til å ha hovud eller hender utan at det blir med i kleslaget.

## Registrering og kontroll

Kjeldefilene er separate bilete for variantane 06–10. Augegrupper blir målte til (432, 376) og (592, 376), nasa til (512, 432) og munnen til (512, 492) i guideoppløysinga. Hår blir sentrert etter meisterfiguren og registrert frå hårkruna; kropp og klesdelar held den frosne fullramma.

Kjeldeteikningane blir haldne utanfor Git. Dei pakka modulane ligg i assets/prototype/characters/v5/. Manifestet assets/prototype/character-builder-test-manifest.json viser fil, lag, variant, storleik, feste og kontrollstatus.
