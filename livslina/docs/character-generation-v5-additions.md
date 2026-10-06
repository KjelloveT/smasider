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


## Karakterbyggjaren v5.4 — klede og handledd

Dato: 5. oktober 2026. Karakterprøva har fått tjue nye kleslag, frå tur- og regnklede til arbeidsdress, skjørt, kjole, collegejakke og meir formelle antrekk. Alle er pakkte som transparente PNG-lag på 512 × 768 med same midtlinje og golvfeste. Dei er registrerte til meisterfiguren sine skulder- og handleddsfeste; figuren sitt hovud og hender ligg ikkje i klesfilene.

| ID | Variant | Teikneintensjon |
|---|---|---|
| clothes-11 | Mosgrøn fleece og turbukse | Mosgrøn glidelåsfleece, sandfarga turbukse og mørke tursko. |
| clothes-12 | Gul regnjakke og marineblå regnbukse | Gul regnjakke, marineblå regnbukse og turkise støvlar. |
| clothes-13 | Blå treningsjakke med striper | Kongeblå treningsjakke med lyse ermestriper og mørk joggebukse. |
| clothes-14 | Lilla cardigan og vide bukser | Lilla cardigan, kremfarga skjorte og vide plommefarga bukser. |
| clothes-15 | Collegejakke og mørk jeans | Marineblå collegejakke med lyse ermar og mørk jeans. |
| clothes-16 | Skoggrøn arbeidsdress | Grøn arbeidsdress med brystlommer og kraftige tursko. |
| clothes-17 | Turkis genser og rustraudt skjørt | Mønsterstrikka turkis genser, rustraudt skjørt og ugjennomsiktige strømpebukser. |
| clothes-18 | Lilla vest og sennepsgul bukse | Mønstra lilla strikkevest, lys skjorte og sennepsgule bukser. |
| clothes-19 | Denimjakke og plommefarga bukse | Lys denimjakke over gul skjorte, plommefarga bukser og brune boots. |
| clothes-20 | Korallfarga vindjakke og joggebukse | Korallfarga vindjakke med mintgrøne felt og mørk joggebukse. |
| clothes-21 | Lilla kjole og turkise leggings | Ribbestrikka kjole med belte, turkise leggings og støvlar. |
| clothes-22 | Rustraud kordskjorte og cargobukse | Kordskjorte over grøn topp, mørk cargobukse og tursko. |
| clothes-23 | Koralrosa jakke og langt skjørt | Rosa quiltjakke, marineblått plisséskjørt og ugjennomsiktige strømpebukser. |
| clothes-24 | Olivengrøn vest og turbukse | Olivengrøn vattert vest over okergule ermar og grå turbukse. |
| clothes-25 | Lysblå skjorte og kamelfarga bukse | Lys skjorte, grafittgrå strikkevest og kamelfarga bukser. |
| clothes-26 | Raudrutete skjorte og svarte jeans | Rutete raud skjorte over svart trøye og svarte jeans. |
| clothes-27 | Sennepsgul kordjakke og mørk dressbukse | Kordjakke over vinraud høg hals, mørk dressbukse og brune boots. |
| clothes-28 | Petrolblå anorakk og olivenfarga turbukse | Anorakk med oransje glidelås, turbukse og tursko. |
| clothes-29 | Stripete genser og vide culottebukser | Lilla stripete genser, culottebukser over ugjennomsiktige strømpebukser og korallraude sko. |
| clothes-30 | Mørk turkis jakke og lys grå jeans | Mørk turkis jakke over gullgul skjorte, lys grå jeans og joggesko. |

Klesressursane blir registrerte frå skulderlinja til grunnlinja og maskerte med meisterkroppen si alphaform, slik at hovud og hals skin gjennom der dei høyrer til. Mansjettane sit ulikt på dei tjue nye antrekka, så teiknaren flyttar hudlaget for underarmar og hender per antrekk til handleddet møter ermekanten. Hudlaget blir teikna éin gong bak kleda; erma dekkjer den delen av armen som skal liggje inni plagget. Den tidlegare flanellressursen hadde lyse armar og hender teikna inn i kleslaget; dei er tekne bort.

Den tette krølltoppen er registrert på nytt: krunekanten startar ved hårfestet, silhuetten er smalare og avsluttar over nedre øyrekant.

Ved visuell kontroll 6. oktober vart dei tjue nye antrekka, dei nye andleta og dei nye frisyrene sette saman i nettlesaren. Handfesta vart justerte etter mansjettane. Andlets- og hårlaga held seg på same hovudfeste; ingen hovudflytting trongst.

Råteikningane ligg lokalt i `_kjelder/character-v5.4/raw/`. Dei brukte ressursane ligg i `assets/prototype/characters/v5/`; nettlesaren flyttar eller skalerer ikkje laga.
