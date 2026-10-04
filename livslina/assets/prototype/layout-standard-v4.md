# Livslina: målsett romplan v4

Denne planen erstattar v3 sine frie skjermplasseringar. Den gamle prøva er ikkje ein godkjend illustrasjon eller ein påliteleg kameramal.

## Kva som svikta

Rommet hadde forsvinningsperspektiv, medan sprite-familiane brukte ulike parallelle skråvinklar. Felles prompt og filstorleik gav korkje same kamera eller same fysiske skala. Botnen av ei PNG-ramme er heller ikkje eit målt fotpunkt. TV-en vart flytt fritt i skjermkoordinatar utan feste til benkeplata. Sofaen vende feil veg, og gjennomsiktig luft rundt teppet gjorde den synlege flata mindre enn ramma. Ingen av desse filene er godkjende for samansetjing.

## Fast kamera og skala

Rom: 420 × 360 cm, vegghøgd 240 cm. Logisk scene: 480 × 360 pikslar. Eitt ortografisk, dimetrisk kamera med 30° nedvinkel og symmetriske golvaksar. Parallelle golvlinjer held seg parallelle, og same møbelmål har same skala overalt. Ingen forsvinningspunkt eller djupneavhengig skalering.

Alle mål er i cm. `u` går langs høgre vegg, `v` langs venstre vegg, `z` opp frå golvet. Bakre hjørne er `(0, 0, 0)`. Projeksjonen er:

```text
screenX = 220 + (u - v) × 0.52 × cos(30°)
screenY = 136 + (u + v) × 0.52 × sin(30°) - z × 0.52
```

Sjølve modellen i `layout-room-model.js` er den autoritative malen. PNG-motiv skal aldri skalerast uavhengig i breidd og høgd for å rette perspektivfeil.

## Romoppsett og variantmål

| Familie | Variant 1 | Variant 2 | Feste og retning |
|---|---|---|---|
| Seng | 95 × 200 cm | 120 × 200 cm | Gavl mot høgre vegg, v=0; veks i u-retninga |
| Pult | 110 × 58 × 72 cm | 150 × 68 × 75 cm | Fem prisnivå; høgre ende u=410; bakre kant v=0 |
| Stol | 42 × 42 × 78 cm | 50 × 50 × 102 cm | Fem prisnivå; midt på pulten, 35 cm framfor framkanten; sitjeretning -v |
| Teppe | 220 × 150 cm | 300 × 210 cm | Fem prisnivå; flatt på golvet, sentrert rundt u=250, v=250 |
| Sofa | 145 × 82 cm | 155 × 90 cm | Rygg u=305; sitjeretning -u mot TV-vegg |
| TV-benk | 140 × 45 × 34 cm | 140 × 48 × 52 cm | Fem prisnivå; mot venstre vegg, u=0; midtpunkt v=275 |

TV-en er ei sjølvstendig, valfri ressurs med fem skjermbreidder: 24, 42, 60, 90 og 130 cm. Den største skjermen er 130 cm brei og får plass på den 140 cm breie benken, langs veggstrekninga v=205–345. Han sit midt på benken; benkhøgda flyttar skjermen og føtene opp eller ned som eitt feste. Vindauget ligg på venstre vegg, v=70–190. Sofaen vender mot skjermen.

PC-tårnet er ei eiga valvare med fem storleikar og eit lokalt feste på pulten. Skjerm og tastatur høyrer til pultillustrasjonen; tårnet blir teikna oppå bordplata og flyttar seg med pulten. Bordlampe, vekkjarklokke, kosedyr, samlefigurar, bøker og sminkepakke brukar lokale festepunkt på pulten. Veggpynt bruker høgre veggplan.

Større møblar har eit større verkeleg fotavtrykk. Kvar variant blir kontrollert mot veggar og andre møblar. Teppet kan liggje under sofaen. Nattbord, plante eller hifisystem blir valde kvar for seg som golvting i sona mellom seng og pult. Høgder, skjermstorleik og plassering blir rekna på nytt frå forelderen; ingen festepunkt bruker frie absolutte skjermkoordinatar.

## Veggfeste og plassen mellom seng og pult

Bilete og hyller bruker den same projeksjonen som møbla. Venstre vegg er planet `u=0`, høgre vegg er `v=0`. Festet blir uttrykt langs veggen og i høgd over golvet; ei filramme eller fri skjermkoordinat er ikkje eit veggfeste. Rammer får 3 cm djupn inn mot rommet.

| Veggting | Plass langs veggen | Høgd over golvet | Mål |
|---|---|---|---|
| Venstre bilete | v=215–270 | z=158–215 | 55 × 57 cm |
| Venstre hylle | v=270–350 | underside z=130, topp z=134 | 80 × 22 cm, tjukkleik 4 cm |
| Høgre bilete | u=185–245 | z=140–200 | 60 × 60 cm |
| Høgre hylle | Sentrert over pulten | underside z=145, topp z=149 | 100 × 22 cm, tjukkleik 4 cm |

Hylleting får lokale feste på hylla; underkanten på bøker og pynt startar på hyllas topphøgd. Når pulten blir breiare, flyttar høgre hylle seg med midten på pulten. Vindauget og veggtingas utstrekning blir kontrollerte for overlapp. Hyllene med bøker er rekna med i klaringa mot bileta.

Golvplassen mellom seng og pult har eitt valfritt objekt om gongen: hifisystem (30–46 × 28–35 cm), plante (28–50 × 28–50 cm) eller nattbord (38–48 × 34–42 cm). Objektet står på `z=0`; kvar type har ein eigen stad i den ledige sona. Hifisystemet står langs høgre vegg ved `u=bed.u+bed.w+40, v=0`, slik at sidehøgtalarane kjem fri av sofaen i projeksjonen. Pult, seng eller objekt blir skala- og plasskontrollert på nytt når vala endrar seg.

Prøvesida let ein vise bilete, hylle, begge eller ingen på kvar vegg, velje golvting og prøve éi ekstra pynteting om gongen. Veggpynt erstattar dei andre høgre veggtinga medan han blir prøvd, slik at gjenstandane ikkje overlappar.

## Målmodell og visuell stil er to ulike ting

Rommodellen og dei grå guidebileta styrer berre perspektiv, mål, retning,
kontaktpunkt, veggfeste og plassering. Dei er ikkje ein visuell stilmal.
Illustrasjonane skal ha eit sjølvstendig, detaljert 8-bit-uttrykk: tydelege
pikselklynger, fleire skuggelag, lesbare materiale, små overflatedetaljar og
reine mørke konturar. Ein enkel geometrisk form frå rommodellen er ikkje
ferdig spelgrafikk.

Dei vedlagde stilreferansane viser detaljnivå, ikkje fargepalett, innhald,
karakterar eller romkomposisjon. Halde lystilhøva jamne mellom ressursane.
`resources-v5/guides/` inneheld geometrimalar; `resources-v5/items/` inneheld
dei gjennomsiktige, detaljerte sprites som blir viste i stilprøva.

Prøvesida har òg ei eiga sengestige med fem kvalitetsnivå frå ei skeiv,
heimelaga seng til ei luksusseng med hev- og senkefunksjon. Alle nivåa har same
golvavtrykk på 95 × 200 cm, men eigne målsette silhuettar og høgder. Dei
førebelse spelprisane står i `resources-v5/bed-price-ladder.js`; dei er ikkje
butikkprisar og er ikkje kopla til speløkonomien. Dei må vurderast før eventuell
innføring i spelet.

`layout-asset-test.html` viser fem prisklassar for seng, TV-benk, TV, kontorpult,
kontorstol, PC-tårn, hifisystem, plante, teppe og nattbord. Ti pynteslag har fem
variantar kvar: plakat, spegel, oppslagstavle, lysande veggskilt,
skrivebordslampe, vekkjarklokke, kosedyr, samlefigurar, bøker og sminkepakke.
Prisane er prototypeidéar i `resources-v5/item-catalog.js`; dei er ikkje
butikkprisar eller speløkonomidata. «Tilfeldig rom» trekkjer nye val for heile
rommet. Skjerm og tastatur høyrer til pulten; PC-tårnet er ei eiga festa vare.
TV og føter er ei eiga spritegruppe som flyttar seg med benken. Grafikken er
framleis prototype og må vurderast vidare før han blir godkjend for sjølve
spelet.

## Produksjon av pikselressursar

1. Godkjenn plassering, skala og retning i målmodellen før teikning. Bruk aldri målmodellen som stilfasit.
2. Eksporter kvart objekt som eigen geometrimal med nøyaktig kamera, projisert kontur, vegg-/golvfeste og gjennomsiktig lerret. Eksporter kvar veggretning for seg; ikkje spegelvend ressursar.
3. Bruk malen berre til form og kamera. Lag detaljert, sjølvstendig 8-bit-pikselkunst med lag på lag av materiale og skuggar. Bruk stilreferansar berre for detaljnivå; kopier ikkje palett eller motiv.
4. Behald proporsjonane i teikninga. Tilpass eit gjennomsiktig lerret til den målte projeksjonsforma med lik skalering; ikkje strekk grafikken ulikt i breidd og høgd. Forkast eller teikn om dersom golvkontakt, føter, kantvinklar eller veggfeste ikkje stemmer.
5. Kontroller dei synlege alpha-kantane og målte kontaktpunkta, ikkje berre PNG-ramma. Slepp ikkje gjennom glød, golvflate eller slagskugge som flyttar det synlege festet.
6. Prøv begge variantar i den samla scena. TV-føtene skal møte benkeplata, alle golvkontaktar skal liggje på z=0, sofa-/stolfront skal peike rett, og forholdet mellom seng, pult, sofa og TV-benk skal vere målbart.
7. Først når dette er godkjent, auk talet på ressursar. Nye variantar gjenbruker kamera, felles lysretning, projisert lerretsform, pivotar og feste, men får eigne detaljar og palettar.

Lys: jamt, nøytralt dagsljos med svake materialsider. Kveldssol, varme strålar, lysflekker og sterke slagskuggar er tekne ut av grunnstandarden.

## Status

V4 er den autoritative matematiske målmodellen og produksjonsinstruksen, ikkje
den visuelle stilguiden. Ressurspakka v5 har 126 detaljerte PNG-sprites, mellom
anna 95 nye prisstige- og pyntevariantar. Alle må kontrollerast vidare i scena
før dei kan godkjennast som endelege spelressursar.
