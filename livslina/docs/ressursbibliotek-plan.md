# Livslina — historisk framlegg til ressursstandard og prøvepakke

> Status: historisk framlegg. Romprøva er sidan utvida til v5, og karakterprøva brukar no lagdelte v5-ressursar. Sjå `assets/prototype/resources-v5/README.md`, `assets/prototype/layout-standard-v4.md` og `character-production-standard-v5.md` for gjeldande standardar.

## Føremål

Livslina følgjer ein ungdom gjennom vidaregåande og let spelaren utforske val om økonomi, arbeid, sparing og trivsel. Karakteren skal kjennast personleg, medan rommet skal synleggjere prioriteringar og ting spelaren vel å bruke pengar på.

Ressursane skal vere nye for denne retninga. Det visuelle uttrykket i dette framlegget blir utvikla frå stilreglane nedanfor, ikkje frå prøveillustrasjonane som finst frå før. Spelet sine illustrasjonar kan ha sin eigen palett og pikselstil; tekst, knappar og andre felles grensesnittdelar følgjer dei gjeldande Vyrdepil-reglane.

## Føreslått stilstandard

### Pikseluttrykk

- Detaljert 8-bits pikselkunst, teikna på eit fast logisk rutenett. Pikslane skal vere tydelege ved vanleg vising; detaljrikdomen kjem frå gode fargeklasar, silhuettar og små lesbare særtrekk.
- Ingen mjuke gradientar, uskarpe skuggar eller kantutjamning i sjølve spritekunsten. Skaler bileta med næraste-nabo-metode og heiltalsfaktor, slik at kantane held seg skarpe.
- Bruk tydeleg silhuett, éi mørk konturfarge og skugge/lys i avgrensa trinn. Lys kjem konsekvent frå øvre venstre. Dithering blir brukt sparsamleg.
- Ingen lesbar tekst, logoar eller varemerke inne i genererte bilete. Plakatar kan ha abstrakte symbol eller mønster; eventuell tekst blir sett som vanleg HTML eller pixelgrafikk etterpå.

### Palett

Start med ei felles palett på høgst 96 fargar, med rom for utviding opp til 128 dersom prøvepakka treng det. Dette held uttrykket samla og passar godt for komprimerte PNG-spriteark med alfa.

Føreslåtte ankerfargar for første prøve:

| Rolle | Føreslått farge |
|---|---|
| Mørk kontur | `#211D27` |
| Djup skugge | `#403849` |
| Lys varm flate | `#F5E7C8` |
| Korall | `#E98E73` |
| Honning | `#E7BD59` |
| Mosegrøn | `#78A47A` |
| Himmelblå | `#70AFC2` |
| Lyng | `#AA8FBE` |

Hud, hår, klede og treverk får eigne små fargerampar innanfor paletten. Hudfargar skal vere fleire enn éin lys/mørk akse: kvar tone får passande skugge og lys, slik at dei mørkaste tonane ikkje berre blir ein flat silhuett. Hår- og klesfargar blir valde frå fargerampar som kan byte farge utan at konturar eller skuggelegging forsvinn.

### Karakterar

- Føreslått arbeidsflate: 96 × 128 logiske pikslar per heil figur. Alle lag brukar same lerret, origo og festeplassering; blankt areal er gjennomsiktig. Endeleg storleik blir stadfesta i prøvevisinga.
- Figurane står i avslappa, lett skråstilt frontstilling med same høgd og kameravinkel. Dette gjer ansikt, klede og tilbehøyr lesbare og let lag passe saman.
- Karakteren blir sett saman av lag: kropp/silhuett, hudtone, ansiktstrekk, hår eller hovudplagg, overdel, underdel, sko og valfritt tilbehøyr. Hjelpemiddel får eigne lag med avtalte feste, slik at dei ikkje blir dekte av klede eller hår.
- Kroppsform, hudtone, ansiktsdetaljar, hårtekstur, hårform, hovudplagg og klede skal kunne kombinerast uavhengig. Ingen todelt kjønnsveljar eller krav om at bestemte klede høyrer til bestemte kroppar.
- Grunnval som hudtone, kroppsform, hår og hjelpemiddel høyrer til gratis karaktertilpassing. Pengar i spelet kan brukast på ekstra klede, sminke og tilbehøyr.
- Mangfaldet skal finnast i heile utvalet og i kombinasjonane, ikkje som éin einsleg «representasjonsfigur». Briller, høreapparat, rullestol og andre hjelpemiddel blir viste som vanlege val utan eigne økonomiske straffer eller bonusar.

### Rom og gjenstandar

- Rommet blir vist som ei fast, lett opphøgd front-/hjørnevising av vegg og golv. Det er ei arbeidsavgjerd for prøvepakka, vald for å gjere både veggpynt og golvgjenstandar synlege.
- Føreslått sceneformat: 384 × 256 logiske pikslar. Møblar og ting er separate PNG-filer med gjennomsiktig bakgrunn. Kvar fil får feste-/pivotpunkt og synleg storleik i ressursmanifestet.
- Alle gjenstandar brukar same kameravinkel, lyskjelderetning og golvplan. Plassering skjer på eit 8-pikslars grunnrutenett; mindre forskyving er tillaten for dekor som heng på veggen.
- Plassane i prøvepakka: **seng**, **skrivebord/teknologi**, **veggpynt**, **lys**, **sitjeplass/tekstil**, **hobby** og **personleg pleie**. Nokre ting kan dele plass, men kvart element har éin hovudplass.
- Innhaldet skal vere ungdomsnært og merkeuavhengig: teknologi, spel, musikk, kunst, bøker, planter, mjuke tekstilar, plakatar, sminkesaker og små oppbevaringsløysingar.
- Kjøp skal synleggjere prioriteringar. Pynt kan vere reint kosmetisk; møblar eller utstyr kan ha ei nøktern, forklart trivsel-/energivirkning. Unngå at høg pengebruk alltid blir framstilt som det beste valet.

## Prøvepakke

Prøvepakka skal vise at stilen, lagdelinga, festeplasseringane og butikkinnhaldet fungerer før biblioteket blir utvida. Ho er ein avgrensa produksjonsrunde, ikkje målomfanget for heile spelet.

### Karakterprøve

Lag fire testkombinasjonar som pressar ulike delar av systemet:

| Prøve | Det ho testar |
|---|---|
| 1 | Mørk hudtone, tett krøll/locs, lys overdel og briller |
| 2 | Lys hudtone, rett hår, hovudplagg og ytterplagg |
| 3 | Mellomtone, bølgjete hår, sminkeoverlay og smykke |
| 4 | Valfri hud-/hårkombinasjon med rullestol eller anna hjelpemiddellag |

Desse er tekniske testkombinasjonar, ikkje låste karaktertypar. Prøvepakka bør minst innehalde tre kroppsformer, tolv hudtonar, åtte hårformer på tvers av teksturar, seks hårfargar, seks overdelar, fire underdelar, fire skotypar, fire ytterplagg, seks ansikts-/brille-/smykkeval og to hjelpemiddellag. Fargeskift og lagkombinasjonar gjev variasjon utan at kvar heil figur må teiknast på nytt.

### Romprøve: 23 ressursvariantar

| Gruppe | Ressursar |
|---|---|
| Grunnmøblar | Enkel seng, betre seng, enkelt skrivebord, gaming-/studieoppsett |
| Teknologi | Skjerm, datamaskin/tårn, spelkontroll, hovudtelefonar |
| Lys og tekstil | Skrivebordslampe, lyslenkje, teppe, sengeteppe, pute |
| Vegg og oppbevaring | Plakat, biletevegg, vegghylle, bokstabel |
| Hobby og livsstil | Plante, gitar eller keyboard, teiknesaker, treningsutstyr |
| Personleg pleie | Sminkeskrin, lite sminkespegel med hylle |

Dette er 23 synlege elementvariantar; fleire variantar kan dele same plass, til dømes enkel og betre seng. Målet er å prøve ut alle plassane og minst fire tydelege romuttrykk: roleg/lesing, gaming/teknologi, musikk/skapande og sport/trening.

### Ressursdata

Kvar karakterdel eller gjenstand får ein stabil ID og oppføring i eit manifest. Eit romelement bør minst ha:

```json
{
  "id": "desk-gaming",
  "label": "Gaming- og studieplass",
  "asset": "items/desk-gaming.png",
  "slot": "desk",
  "priceKey": "upgrades.gamingDesk",
  "effects": { "wellbeing": 0 }
}
```

Dette er berre døme på feltnamn. Pris kjem frå Livslina sine prisdata, ikkje frå biletmanifestet. Løpande kostnader må vere skilde frå eingongskjøp. Lagre stabile ressurs-ID-ar i speltilstanden, slik at seinare omteikning av PNG-filer ikkje endrar kjøpa til spelaren.

## Arbeidsflyt med bildegenerator

1. Skriv eitt nytt stilark med reglane ovanfor og lag ei lita stilprøve frå blankt utgangspunkt.
2. Generer få, einsarta motiv om gongen med same lerret, vinkel, palett, lys og pikselkrav. Bruk ei godkjend prøve frå denne nye retninga som referanse for seinare seriar.
3. Vel ut, reins og tilpass resultata til pikselrutenettet. Kontroller alfa, festeplassering, fargebruk og silhuett. Generert tekst blir fjerna.
4. Set saman karakterkombinasjonar og romvariantar i spelet. Gjer visuell kontroll ved faktisk visingsstorleik og ved næraste-nabo-forstørring.
5. Når prøvepakka held mål, utvid biblioteket i kategoriar og registrer fil, ID, mål og plass i manifestet.

Originalar og sluttressursar må komprimerast før dei kjem inn i git-historikken. Spriteark skal ha gjennomsikt der det trengst, vere pixel-perfekte og få redusert fargepalett. Ikkje legg til eksterne bibliotek eller CDN-avhengnader for å vise ressursane.

## Godkjenningskriterium for prøvepakka

- Figurdelar passar saman utan synlege hol, overlapp eller endra storleik mellom val.
- Alle planlagde hudtonar har synlege lys- og skuggetrinn; ingen blir grå eller flate etter palettbyte.
- Hår, hovudplagg, briller og hjelpemiddel kan kombinerast utan å skjule andletet eller kvarandre utilsikta.
- Romting er lesbare ved normal spelevising, står på rett djupne og fyller ikkje same plass på ein måte som ser ut som feil.
- Pikselkantane er skarpe på mobil, nettbrett og stor skjerm. Ingen ressurs er avhengig av farge åleine for å bli kjend att.
- Prøvepakka inneheld fire tydeleg ulike romuttrykk og fleire truverdige karakterkombinasjonar utan merkevarer eller generert tekst.
- Gjenstandar viser pris og eventuell speleffekt som tekst i brukargrensesnittet; økonomiske val skal vere forståelege utan at spelaren må tolke sjølve biletet.

## Status no

Ressursbiblioteket har ei samansett romprøve med 126 sprites. Rommet brukar den målsette v4-modellen for geometri og feste; sjølve illustrasjonane er framleis prototypegrafikk, og prisane er ikkje kopla til speløkonomien.

Karakterbyggjaren har ei eiga lagdelt v5-prøveside. Ho viser monteringa og dei tilgjengelege komponentane, men er ikkje kopla til spelet si karaktertilpassing eller lagring. Dei eldre heilfigurane og atlaset er tekne ut av ressursprøva.

Neste steg er å fullføra den lagdelte ressursrunden, byggja karakterbyggjar og rombutikk rundt dei godkjende ressursane, og deretter ferdigstilla VG1–VG3 etter planen i `vgs-ferdigstilling-plan.md`.

## Tidlegare framlegg

Den første prøva med heilfigurane, rommet og 23 planlagde romvariantar er
erstatta av den lagdelte karakterprøva og ressursbiblioteket v5. Framlegget
beheld vi berre som bakgrunn for tidlegare val; det er ikkje ei gjeldande
produksjonsplan. Sjå `vgs-ferdigstilling-plan.md` for neste arbeid.
