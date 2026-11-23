# Fleire vegar gjennom Livslina · gjennomføring og speltest

## Utdanning og arbeid

Retning har tre inngangar med fagfelt, søk og eit filter for kva figuren kan
starte. Lokal speldata har 39 inngangar i tolv felt og 78 ulike yrkesroller.
Ferdige utdanningar opnar yrkesroller, og arbeidsår kan opne stillingar med
meir ansvar. Fleire løp kan føre til arbeid med innkjøp. Val av rolle kan
endre løn, arbeidstid og kva som skjer gjennom året. Ved byte viser spelet
kva figuren går frå, og brukar ei stadfesting ved årsstart. Framdrifta blir
med ved retur. Livslina kan halde fram frå 25 til 35 år med den same figuren.

Poenggrensene er valde døme frå hovudopptaket i 2026. «Alle kvalifiserte fekk
tilbod» og «Ukjend poenggrense» har eigne visingar. Spelet brukar dei formelle
krava og ei forenkla poengutrekning. For medisin er den ordinære spelgrensa
59 karakterpoeng. Den historiske grensa står ved sida av og kan innehalde
tilleggspoeng. Spelaren kan om nødvendig ta påbygg, eit komprimert realfagsløp
eller privatisteksamen. Privatistresultatet tel i den ordinære delen av
spelopptaket og bevarer det opphavlege VGS-snittet.
[HK-dir sine poenggrenser](https://sokertallrapport.samordnaopptak.no/2026/figurer/side_5_konkurranse_hoved/tabeller/poenggrense_min_26.html) · [Samordna opptak om fagkrav](https://www.samordnaopptak.no/universitet-og-hogskole/opptakskrav/spesielle-opptakskrav/)

Folkehøgskule har eit eige internatbudsjett der mat og bustad er med i same
post. Spelaren kan velje friluftsliv eller musikk og medium, og velje eit
tillegg for turar og utstyr. Lånet går over ti månader. Reiseåret lèt spelaren
velje to, fire eller seks reisemånader før arbeidsmånader. Budsjettet viser
forsikring, overnatting, mat og transport, og krev ein buffer for heimreisa.
[Lånekassen om folkehøgskule](https://lanekassen.no/nb-NO/stipend-og-lan/norge/folkehogskole-i-norge/)

## Transport, bustad og inventar

Årsplanen viser pris og reisetid i by, tettstad og område med spreidd
busetnad. Føraropplæringa har fire steg med månad, timebruk og pris. Ein
prøve som vart utsett eller ikkje bestått kan leggjast inn i neste plan.
Kjøp og sal av brukt sykkel eller bil blir rekna ved årsstart. Vedlikehald,
forsikring, drivstoff og verditap blir synlege på eigne postar.
[Statens vegvesen om føraropplæring](https://www.vegvesen.no/forerkort/ta-forerkort/veien-til-forerkortet/personbil-b/) · [SIFO sitt referansebudsjett](https://www.oslomet.no/om/sifo/referansebudsjettet/)

Det er mogeleg å leige ei større leilegheit. Kjøkenkrok og ekstra rom kan
opnast i bustader som har dei. Rombutikken viser brukte og nye varer,
mål og pris. Ting kan stå på éin stad, flyttast mellom rom, setjast på
lager eller seljast. Ting frå rom som forsvinn ved flytting, går på lager.
Dei nye romtinga brukar den målsette v4-projeksjonen.
[Kjeldedata for leige](https://www.ssb.no/statbank/table/09895) · [Mål og festepunkt for illustrasjonane](../assets/prototype/resources-v5/room-fixtures.json)

## Hushald og familie

Hushaldet er synleg på oversikta og har si eiga fane i årsplanen. Vener og
partnarar hugsar tidlegare val. Spelaren vel om eit forhold skal få utvikle
seg, om dei skal bu saman, og om dei vil vente eller planleggje barn.
Delt leige og depositum blir rekna for spelaren sin del av hushaldet.

Eit barn kan bli ein del av spelet først når spelaren har valt ein plan,
partnaren er samd og spelaren stadfestar tidspunktet. Følgjene for permisjon,
utstyr, omsorg og barnehage er synlege i årsplan og årsoppgjer. Spelanslaget
for foreldrepengar brukar tidlegare inntekt, og foreldrepengar og
eingongsstønad har eigne budsjetthendingar. Ved eit brot held omsorgsplanen
og barnet fram i spelet. All lagring skjer lokalt. Det er oppdikta
spelpersonar og hushald, med namngjevne hendingar framfor opplysingar om eleven.
[NAV om foreldrepengar og eingongsstønad](https://www.nav.no/foreldrepenger/foreldrepenger-eller-engangsstonad/) · [NAV om barnetrygd](https://www.nav.no/barnetrygd) · [Udir om barnehagebetaling](https://www.udir.no/regelverk-og-tilsyn/barnehage/foreldrebetaling/)

Kvar av ni familiesituasjonar har tre illustrasjonar, mellom anna med to
mødrer og to fedrar. Det er den same trekninga per spel, speleår og hending,
slik at motivet held seg ved ny innlasting. Bileta kjem frå den innebygde
ImageGen-funksjonen. [Motiv, biletfiler og promptsett](../assets/events/livslina-utviding-prompts.md)

## 50 para gjennomspelingar

Dei same ti startprofilane og fem strategiane vart køyrde med dei same
frøa på utgåve `683488c` og utvidinga. Dei fem strategiane prioriterte
karakterar, økonomi, trivsel, sosialt eller blanda val. Dei ordinære
retningane var tilgjengelege som i den tidlegare køyringa, slik at tala
viser korleis utvidinga slår ut for desse vanane. Funksjonstestar går
gjennom dei nye vala, mellom anna bil, reise og hushald. Alle dei 50
observasjonane ved 19 år var identiske med førmålinga.

| Alder | Median brukskonto før | Median brukskonto etter | Median nettoformue før | Median nettoformue etter |
| --- | ---: | ---: | ---: | ---: |
| 19 år | 61 373 kr | 61 373 kr | 61 373 kr | 61 373 kr |
| 20 år | 217 560 kr | 217 560 kr | 219 835 kr | 218 315 kr |
| 21 år | 324 259 kr | 323 670 kr | 355 281 kr | 355 837 kr |
| 25 år | 920 400 kr | 921 959 kr | 928 221 kr | 961 779 kr |

Ved 21 år hadde 28 av 50 over 300 000 kr på brukskonto i båe utgåvene,
og seks hadde negativ nettoformue. Ved 25 år hadde to framleis negativ
nettoformue. Høge saldoar er særleg vanlege for profilar som bur rimeleg
og vel stabil arbeidsinntekt og låg pengebruk gjennom fleire år.

| Strategi | Brukskonto ved 21 før | Brukskonto ved 21 etter | Nettoformue ved 25 før | Nettoformue ved 25 etter |
| --- | ---: | ---: | ---: | ---: |
| Karakterar | 169 036 kr | 169 236 kr | 357 999 kr | 355 929 kr |
| Økonomi | 625 958 kr | 626 318 kr | 2 067 949 kr | 2 070 169 kr |
| Trivsel | 341 393 kr | 339 535 kr | 1 077 563 kr | 1 075 716 kr |
| Sosialt | 233 091 kr | 232 270 kr | 621 860 kr | 623 930 kr |
| Blanda | 337 452 kr | 337 252 kr | 928 221 kr | 961 779 kr |
