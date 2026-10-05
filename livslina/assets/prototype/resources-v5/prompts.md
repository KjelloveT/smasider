# Promptsett for detaljert 8-bit-romgrafikk

## Felles instruks

Lag éin isolert, detaljert 8-bit-pikselillustrasjon av motivet under. Fyrste
referanse er berre geometrimal: hald nøyaktig silhuett, målforhold,
ortografisk/dimetrisk kameravinkel, retning, projisert lerret og kontaktpunkt.
Ikkje bruk det grå uttrykket som stil. Dei andre referansane viser berre
detaljnivå: tydelege pikselklynger, fleire skuggelag, materialtekstur,
avgrensa høglys og reine mørke pikselkonturar. Ikkje kopier referansebileta si
romkomposisjon, innhald, fargepalett eller figurar. Gjennomsiktig bakgrunn.
Ingen bakgrunnsflate, slagskugge, kveldssol, glød, rotasjon eller spegling.
Hald alle delar innanfor objektet si målsette utstrekning. Behald proporsjonane
og éi sams lysretning.

## Motiva i prøvepakka

| Ressurs | Motivskildring |
|---|---|
| `bed-01.png` | Eikeseng med mønstra grøn og kremfarga sengetøy, spiler og mjuke puter. |
| `bed-02.png` | Polstra seng med djup blågrøn gavl, treverk og sengetøy i varme korall- og kremtonar. |
| `bed-tier-01.png` | Skeiv heimelaga ramme av restebord med ein gammal, lappa og framleis brukande madrass. Førebels nivå 1 · kr 350. |
| `bed-tier-02.png` | Heil, rein brukt seng med enkel ramme og eldre madrass. Førebels nivå 2 · kr 1 500. |
| `bed-tier-03.png` | Stødig kvardagseng med god madrass og velstelt sengetøy. Førebels nivå 3 · kr 4 500. |
| `bed-tier-04.png` | Polstra seng med mjuk gavl, tjukk madrass og skuffer på sida under madrassen. Førebels nivå 4 · kr 12 000. |
| `bed-tier-05.png` | Eksklusiv seng med hev- og senkefunksjon, synlege løftesøyler, god madrass og sengetøy. Førebels nivå 5 · kr 26 000. |
| `desk-01.png` | Skrivepult i lys eik med skjerm, tastatur og eit ryddig lite utval skriveutstyr. |
| `desk-02.png` | Brei spelpult med blågrøn overflate, PC-tårn, skjerm og tastatur. |
| `chair-01.png` | Enkel trestol med ryggspiler og polstra, dempa grøn sitjeflate. |
| `chair-02.png` | Ergonomisk kontorstol med hjul, armlene og høg blågrøn rygg. |
| `rug-01.png` | Stort mjukt teppe med krem- og salviefelt, blomemønster og innramma kant. |
| `rug-02.png` | Stort teppe med geometriske ruter, blågrøn kant og varme små detaljar. |
| `sofa-01.png` | To-setars salviesofa med lyse og korallfarga puter, vend mot TV-en. Reine armlene og bakside utan klossar. |
| `sofa-02.png` | To-setars korallsofa med blågrøn sitjeflate og mønstra puter, vend mot TV-en. Reine armlene og bakside utan klossar. |
| `tv-bench-01.png` | Eikefarga TV-benk med to skapdører; flatskjerm og føter står på benkeplata. |
| `tv-bench-02.png` | Blågrøn TV-benk med opne hyller; flatskjerm og føter står på benkeplata. |
| `wall-picture-left-01.png` | Innramma, roleg landskapsmotiv for venstre vegg. |
| `wall-picture-left-02.png` | Innramma abstrakt botanisk motiv for venstre vegg. |
| `wall-picture-right-01.png` | Innramma nattmotiv over åsar for høgre vegg. |
| `wall-picture-right-02.png` | Innramma abstrakt hagemotiv for høgre vegg. |
| `wall-shelf-left-01.png` | Venstrevegghylle med fargerike bøker og ei lita potteplante. |
| `wall-shelf-left-02.png` | Venstrevegghylle med oppbevaringsboks, bøker og ei lita hengjeplante. |
| `wall-shelf-right-01.png` | Høgrevegghylle med bøker, eit lite bilete og ein sukkulent. |
| `wall-shelf-right-02.png` | Høgrevegghylle med ryddig boks, fargerike bøker og éin pyntegjenstand. |
| `speaker-01.png` | Kompakt golvhøgtalar med to synlege element og mørk trefinish. |
| `speaker-02.png` | Kompakt golvhøgtalar med fint vevd front og blågrøn finish. |
| `plant-01.png` | Opprett plante med naturlege blad i terrakottapotte. |
| `plant-02.png` | Tett plante med store mønstra blad i lys glasert potte. |
| `nightstand-01.png` | Lite eikenattbord med skuff, messinggrep og skrå føter. |
| `nightstand-02.png` | Kompakt blågrønt nattbord med lita skuff, ope rom og treføter. |

For bilete og hyller skal kvar veggretning lagast som eigen ressurs. Ikkje
spegelvend den eine veggen for å få den andre.

Sengestega bruker eigne geometrimalar (`guides/bed-tier-01.png` til `05.png`)
med same golvavtrykk, kamera og gavlretning, men ulike målsette høgder. Prisane
er prototypeverdiar frå `bed-price-ladder.js`, ikkje oppdaterte marknadsprisar
og ikkje speløkonomidata.

## Produktstige og pyntesamling

Den nye produktkatalogen ligg i `item-catalog.js`. Han har fem mål- og
prisvariantar for TV-benk, TV, kontorpult, kontorstol, PC-tårn, hifisystem,
plante, teppe og nattbord. Han har òg fem variantar i kvar av desse ti
pyntekategoriane: plakat, spegel, oppslagstavle, lysande veggskilt,
skrivebordslampe, vekkjarklokke, kosedyr, samlefigurar, bøker og sminkepakke.
Sjå katalogen for nivånamn, mål, skildringar og førebelse spelprisar.

For kvar familie finst det fem individuelle grå geometrimalar og ei
kontaktoversikt i `guides/`. Kontaktoversikta har fem felt i leseretning,
med det siste feltet tomt. Lag eit eige bilete per felt; ikkje lever ei
samansett plate i staden for spritefiler. Hald kamera, skala, retning,
silhuett, projisert lerret og kontaktpunkt slik dei står i kvar einskild
mal. Bruk dei to opphavlege stilreferansane berre for detaljnivå, aldri for
palett eller innhald.

TV og PC er separate ressursar med feste til høvesvis TV-benken og pulten.
TV-malen viser dei målsette føtene på benkeplata; PC-malen viser berre
tårnet. Skjerm og tastatur er del av pultressursen. Veggpynt blir teikna i
same plan og retning som den aktuelle veggen. Små pynteting får lokale mål på
pultflata. Alle bakgrunnar skal vere gjennomsiktige, og kvar gjenstand skal
ha jamt, nøytralt lys utan fri skugge eller lysglorie.
