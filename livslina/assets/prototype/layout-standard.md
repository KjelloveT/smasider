# Livslina — standard for romplassering og feste

> **Erstatta for kamera og romgeometri:** Bruk [målsett romplan v4](layout-standard-v4.md) og `layout-room-model.js`. Dei eldre prøvene nedanfor gav ikkje målt golvkontakt eller felles perspektiv og er ikkje godkjende teiknemalar. Prinsippet om forelderfeste står ved lag; gamle skjermplasseringar og kameratal skal ikkje kopierast til nye ressursar.

> Føremål: gje alle møblar, romting og tilbehøyr same målestokk, kameraretning og plasslogikk. Dette er ein produksjonsinstruks for framtidige ressursar; han endrar ikkje sjølve spelet.

## Kva prøva viser

Prøve 02 brukar det eldre rombiletet og møbelspritane i prøvepakken. Ho viser seng, skrivebord og utvalt tilbehøyr i scena, med farga fotavtrykk og valfrie festeprikkar. Prøve 03 under legg til den nye romreferansen med TV, vindauge, sofa, seng og pult i same kameravinkel. Begge er monterings- og komposisjonsprøver; dei stadfestar ikkje at alle illustrasjonane er endeleg spelkunst.

`bed-simple` og `bed-upgraded` peikar kvar sin veg i PNG-filene. Prøva spegelvender mellombels `bed-simple` i scena, slik at begge vala peikar same veg. Dette testar berre monteringa. Framtidige sengemotiv skal teiknast i den kanoniske retninga frå starten av, slik at produksjonsressursane ikkje treng CSS-spegelvending.

Illustrasjonane vart laga kvar for seg, og nokre perspektiv, synlege proporsjonar og feste er difor enno ikkje dokumenterte. Plassering kan rette opp retning og avstand, men ikkje eit feil teikna perspektiv. Tilbehøyret er vist i ei avgrensa prøveskalering for å få monteringsforholda synlege; desse visingsmåla er ikkje godkjende produksjonsmål. Godkjenning av denne prøva betyr at monteringssystemet verkar, ikkje at alle bileta er ferdige spelressursar.

Skjerm, lampe, spelkontroll og tårn er tekne med for at ein skal kunne sjå heile møbelgruppa i rommet. Dei får mellombelse visingsmål i denne prøva. Før ressursane blir godkjende, skal dei målast mot ei fast møbelreferanse og teiknast på rett logisk lerret; nettlesarskaleringa her er ikkje målestandarden.

## Oppsett 03 — eitt fast romperspektiv

`room/layout-setup-03-v2.png` er den nye romreferansen for den ønskte møbleringa: TV på venstre sida av vindauget, sofa midt på golvet vend mot TV-en, seng i bakre høgre hjørne og pult på høgre side framfor senga. Biletet er ei samansett layoutprøve; det er ikkje fire separate produksjonssprites.

Kameraprofilen heiter `hybelhjorne-v2` og er registrert i `layout-profile-v2.json`. Ho brukar eit 384 × 256 lerret, lett opphøgd hjørnevinkel og om lag 28° nedoverblikk. Plasseringsrutenettet er 4 pikslar. Veggar står loddrett, golvplanet er synleg, og lyskjelda kjem frå øvre venstre. Den samansette illustrasjonen fastset retning og relativ plassering; ho erstattar ikkje pivotmåling på dei separate ressursane. Den ordrette sluttprompten ligg i `layout-setup-03-prompt.md`.

Alle møbel som står på golvet, skal ha kontaktpunkt på det same golvplanet. Djupelement lenger bak får mindre synleg storleik gjennom perspektivet; dei skal ikkje få ei ny kamerahøgd eller roterast kvar for seg. TV-en og vindauget høyrer til det same bakre venstre veggplanet. Sofaen vender mot TV-en. Senga står med hovudenden bakarst til høgre og fotenden inn mot rommet. Pulten står til høgre for sofasona, framfor sengeområdet. Det skal vere ei lesbar gangline mellom alle fire sonene.

Når motivet seinare blir delt i eigne sprites, bruk layoutbiletet som einaste kamerareferanse for denne familien. Kvart objekt må då leverast med lerretsmål, synleg alfaboks, golvpivot, fotavtrykk og eventuelle lokale feste. Ikkje klipp ut dei samansette møblane frå referansebiletet og bruk dei som ferdige spelressursar.

## 1. Lås romkameraet først

Bruk `room/layout-setup-03-v2.png` som perspektivreferanse for den nye møbelfamilien. `room/empty-hybel.png` blir verande som eldre testgrunnlag for festeprøve 02. Begge har 384 × 256 pikslar; koordinat (0, 0) er øvst til venstre. Den nye referansen har to veggplan, eitt golvplan og eit synleg bakre hjørne.

Mål golvretningane frå bakgrunnen kvar for seg. Ei hjørneprojeksjon gjer ikkje nødvendigvis at golvaksane står 90 grader på kvarandre på skjermen. Ikkje lag eit fotavtrykk ved å rotere ein vanleg CSS-rektangel og anta at det dermed ligg på golvet. Bruk to målte basisvektorar — éin for møbellengd og éin for møbelbreidd — og rekn alle hjørna og feste frå desse.

Før nye gjenstandar blir teikna, skal ressursarket vise:

- omrisset av golvet og dei to veggflatene
- bakre hjørne og golvkant
- retninga «mot kamera» og «mot bakveggen»
- ein møbelboks på 4-pikslars rutenett i minst tre storleikar
- ein fast lyskjelderetning og ein fast logisk pikselstorleik

Alle ting som deler ei plassering, deler same kamera. Veggpynt får eigne flater `wall-left` og `wall-right`; ho blir ikkje lagd fritt med tilfeldig rotasjon. Golvting brukar golvplanet. Bordting brukar den aktuelle bordplata sitt lokale plan.

### Kanonisk retning

For sengene i denne prøva er hovudenden bakarst til høgre og fotenden framme til venstre. Alle framtidige sengestorleikar og sengevariantar skal ha denne retninga. Alle skrivebord skal ha same synlege framkant og same sidevendte djupneretning. Skjerm, tårn, lampe og småting skal teiknast for den plassen dei skal stå på; dei skal ikkje roterast tilfeldig for å fylle eit hol.

Spegelvending kan nyttast mellombels for eit symmetrisk objekt. Ho må førast i metadata (`flipX: true`), aldri som ein laus CSS-regel på fleire sider. Spegelvending er ikkje godkjend for objekt der lesbare symbol, kablar, hengsler, tekst eller asymmetriske detaljar får feil side.

## 2. Mål i logiske pikslar — ikkje i skjermprosent

Sprites blir teikna på eit logisk lerret og viste med næraste-nabo-skalering. Ikkje gje ei seng `width: 49%` av scena: då blir ho ulik storleik på mobil og desktop. Scenekoordinatar og målestokk skal vere dei same på alle skjermar; berre heile scenelaget blir skalert.

Kvar sprite får:

- lerretsmål og synleg alfaboks
- eitt **pivot**: punktet som rører golvet eller festeplata
- eit **fotavtrykk**: arealet som gjenstanden legg beslag på i rommet
- ein retning/kameraprofil, til dømes `hybelhjørne-v1`
- feste punkt for ting som kan monterast på han
- djupnelag: `golv`, `vegg`, `bordflate`, `sengflate` eller `framkant`

For ei seng er pivoten fotpunktet på fotenden. For ein pult er pivoten midt mellom golvkontaktane på framkanten. For eit tårn eller ei plante er pivoten midt under objektet. Pivoten er ikkje automatisk sentrum av PNG-fila.

## 3. Fest til ein forelder, ikkje til rommet

Ting som høyrer saman, blir lagra som eit lite tre:

```text
rom
├── pult (fast romsone)
│   ├── skjerm → feste «skjerm-bak-midt»
│   ├── lampe  → feste «bord-venstre»
│   ├── kontroll → feste «bord-høgre»
│   └── tårn   → feste «golv-høgre»
└── seng (fast romsone)
    ├── pute → feste «hovudende»
    └── pledd → feste «sengeflate-fot»
```

Eit tilbehøyr lagrar forelderen sin stabile ID og festet det brukar, ikkje ein laus skjermposisjon. Festet har lokale koordinatar i forelderen sitt eige plan. Bruk normaliserte koordinatar `u/v` (0–1) når storleiken kan variere; bruk logiske piksel når festet er fysisk fast, som eit feste for ein skjermfot.

Ved utskifting skjer dette i rekkjefølgje:

1. Hald romsona til hovudmøbelet fast dersom fotavtrykket får plass.
2. Rekn ut festepunkta på nytt frå den nye varianten si breidd, djupn og festeprofil.
3. Flytt foreldretilbehøyret med festet; hald fram med same valde ID-ar.
4. Kontroller fotavtrykka mot vegg, golvkant og andre hovudmøblar.
5. Dersom det kolliderer, prøv dei førehandsdefinerte reservefesta. Vis ei tydeleg flyttemelding dersom ingen passar; aldri flytt eit anna møbel i det stille.

## 4. Når ei seng eller ein pult blir større

Storleiken kjem frå varianten sin metadata, ikkje frå CSS-skalering. Ein større sprite har framleis same retning, pivotrolle og logiske pikselstorleik. Variantskiftet endrar fotavtrykket og festa.

### Større seng

- Behald sengesona og fotpunktet om sengeenden framleis har klaring.
- Auk fotavtrykket i lengd/breidd etter den faktiske sengemodellen.
- Flytt `hovudende` og `sengeflate-fot` etter dei nye lokale måla. Pute og pledd følgjer senga.
- Kontroller friplass framfor senga og avstand til skrivebord. Flytt sjølve senga berre dersom den reserverte sona ikkje får plass.
- Dersom sengeforma endrar seg, lag ein ny festemal; ikkje anta at dei gamle festepunkta passar.

### Større pult

- Hald same pivotsenter eller same vegg-/golvkant, slik at pulten ikkje «hoppar» når spelaren oppgraderer.
- Fest skjermen etter `u/v` på bordplata, til dømes bak-midten. Lampa brukar venstre kant; kontroll/tilbehøyr brukar høgre kant.
- Tårnet er golvtilbehøyr. Fest det til høgre eller venstre utside av pulten med klaring frå stol-/gangsona; ikkje la det flyte på bordet.
- Når bordet blir breiare, flyttar venstre/høgre tilbehøyr seg automatisk med kantane, medan skjermen kan halde midtstillinga.
- Køyr kollisjonssjekk etterpå. Om romsona er for trong, vis den nye varianten som ikkje tilgjengeleg i denne romløysinga eller tilby ei konkret omplassering.

Kjeldefilene til skriveborda har lerret på 160 × 112 og 192 × 128, men golvfotavtrykka i prøva er 96 og 128 logiske pikslar. Skiljet er medvite: transparent lerret er ikkje møbelflate. Desse fotavtrykka er mellombelse mål frå synleg kunst og må målast mot endelege pivotar før dei blir produksjonsdata. Skjerm, lampe og kontroll følgjer kvart sitt feste på den valde pulten; tårnet følgjer golvfesta ved sida. Sengene har same faktiske PNG-lerret i dag, så valet `Større fotavtrykk` flyttar pivot og sengefeste som ei plassprøve, men gjer ikkje illustrasjonen større. Ei faktisk større seng krev ei sprite med dei rette logiske måla.

## 5. Djupne og overlapp

Golvobjekt blir sorterte etter pivoten sin golv-Y: lågare Y (lenger bak) teiknast først, høgare Y (nærare kamera) sist. Tilbehøyr som står på ei flate, teiknast over forelderen. Delar som må bak ein kant, får eit eige førehandsdefinert lag; ikkje bruk tilfeldige store `z-index`-tal.

Veggting sorterer etter veggplan og festehøgd. Bordting sorterer i bordplanet. Denne skilnaden hindrar at ein skjerm hamnar bak golvet, eller at ein plakat blir sortert som om han stod på golvet.

## 6. Metadata for neste asset-runde

Legg plasseringa i ein eigen layoutprofil ved sida av innhaldsmanifestet. Døme:

```json
{
  "id": "desk-gaming",
  "file": "items/desk-gaming.png",
  "camera": "hybelhjørne-v1",
  "size": { "w": 192, "h": 128 },
  "pivot": { "x": 96, "y": 120, "role": "golv-fram-midt" },
  "footprint": { "w": 192, "d": 64, "grid": 8 },
  "mounts": {
    "screen-back-centre": { "plane": "bordflate", "u": 0.5, "v": 0.28 },
    "lamp-left": { "plane": "bordflate", "u": 0.18, "v": 0.42 },
    "controller-right": { "plane": "bordflate", "u": 0.78, "v": 0.55 },
    "tower-outside-right": { "plane": "golv", "u": 1.08, "v": 0.94 }
  }
}
```

Måla målingane frå dei endelege bileta; dømet er ei datastruktur, ikkje godkjende pikselkoordinatar. Nye variantar i same familie skal bruke same festnamn der feste rolla er den same. Slik kan eit kjøp byte pult utan at skjermen mister plassen sin.

## 7. Kontroll før ressursar blir godkjende

- Vis alle variantar i same romscene ved same logiske storleik.
- Kontroller hovud-/fotende, framkant, lysretning og skuggeside side om side.
- Vis pivot, fotavtrykk og feste i eit eige kontrollag.
- Byt mellom minste og største variant. Tilbehøyret skal følgje feste, og ingen sprite skal skalerast vilkårleg.
- Test at fotavtrykk ikkje går gjennom vegg, romkant eller eit anna hovudmøbel.
- Kontroller ved 1× og 2× vising med næraste-nabo-skalering.
- Samanlikn i full romscene. Dersom romkameravinkelen og møbelvinkelen ikkje kan få truverdig kontakt, stans den kategorien og avgjer om rombakgrunnen må bytast før fleire motiv blir laga.

### Avgjerda for prøve 02

Festeprøve 02 held på det gamle rommet for samanlikning. Oppsett 03 etablerer ein ny, samla perspektivreferanse som passar TV-plasseringa til venstre for vindauget. Neste sprite-runde skal teiknast kvar for seg etter `hybelhjorne-v2`, og må godkjennast mot denne scena før ressursbiblioteket blir utvida.
