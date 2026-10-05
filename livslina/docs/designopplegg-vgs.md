# Livslina — designopplegg for VG1–VG3

Dato: 5. oktober 2026
Status: gjennomføringsplan for første milepåle

## Retning

Livslina skal kjennast som ei roleg, inviterande forteljing om val gjennom
vidaregåande. Spelet bruker Vyrdepil sitt lyse skilt- og panelsystem for
all navigasjon og brukargrensesnitt. Den detaljerte pikselgrafikken blir
verande som spelillustrasjon i karakteren og rommet. Grensesnittet skal ikkje
konkurrere med illustrasjonane.

Kvart steg svarar på tre spørsmål: Kvar er eg i livsløpet? Kva skal eg ta
stilling til no? Kva endrar valet? Tidslina er difor fast på heimeskjermen,
halvårsvala er samla i eitt tydeleg arbeidssteg, og oppgjeret peikar tilbake på
vala utan å kalle dei rette eller galne.

## Skjermflyt

1. **Start:** kort forklaring, ny livslinje eller hald fram. Skjulde spelet
   held seg utanfor appkatalogen og framsida.
2. **Lag figur:** eit stort portrett med fire valgrupper: hud, andlet, hår og
   klede. Eitt valsett blir vist om gongen som små, tydelege figurkort.
3. **Vel utgangspunkt:** familieøkonomi, utdanningsprogram og bustad, i ei
   lineær oppstartsløype med synleg framdrift.
4. **Heimeskjerm:** aktivt halvår og samla tidsline først; deretter saldo,
   trivsel, energi og karakterar, rommet og neste handling.
5. **Rom og butikk:** romscena står saman med butikkategoriar. Eigde møblar kan
   bytast inn utan ny kostnad; kjøp blir trekte frå brukskontoen og lagra.
6. **Halvårsplan, case og månadsavspeling:** éi hovudoppgåve om gongen,
   tidsstempel og konsekvensar i same visuelle familie.
7. **Oppgjer og sluttrapport:** endringar i økonomi, energi og trivsel blir
   viste saman med vala som utløyste dei.

## Karakterbyggjar

Den lagdelte ressursprøva v5.2 blir brukt direkte: fem hudtonar, tjue andlet,
tjue frisyrar og ti antrekk. Byggjaren lagrar berre dei fire stabile
alternativindeksane i Livslina-lagringa. Val av ei anna frisyre endrar ikkje
hårfarge uavhengig, sidan fargane høyrer til dei ferdigteikna stilane.
Tilfeldig figur blir styrt av spelet sin seedbaserte tilfeldiggenerator.

## Rom og butikk

Startrommet får den billegaste senga, arbeidsbordet og stolen. Sofa og anna
utstyr byr ein på seinare. Dei autoritative rommåla, festepunkta og
dimetriske kameramodellen blir haldne samla i rommodulen; spelkoden vel berre
stabile produkt-ID-ar.

Spelprisane og dei små utslaga ligg i eiga speldatafil, ikkje i
ressursmanifestet. Bedre seng, arbeidsbord og sofa kan gi ein avgrensa
månadsbonus på energi. Stol og pynt gir ikkje ein stor økonomisk eller
trivselsmessig fordel; pynt kan gi små trivselsutslag. Effekten kjem fram
tydeleg i butikken og blir rekna berre for utstyr som står i rommet.

## Visuelle reglar

- Bruk felles Vyrdepil-knappar, panel, dialogar, lys bakgrunn og svart tekst.
- Halde store illustrasjonar på rolege, lyse flater med lesbare kantar.
- Bruk éi hovudhandling per skjerm, med sekundærhandlingar som tydelegare
  mindre val.
- Samle karakterval i ei responsiv rute; ikkje legg alle femti vala i ei lang
  liste.
- På romskjermen skal scena og butikklista stå ved sida av kvarandre på stor
  skjerm og i rekkjefølgje på mobil.
- Vis tid, pris og verknad med tekst; farge er aldri einaste signal.
- Behald tastaturstyring, synleg fokus og store trykkflater.

## Lagring og tryggleik

Spelet held fram med `VyrdepilStorage`. Lagringsversjon 3 legg til
karakterindeksar og rominventar, migrerer versjon 1/2 idempotent og bevarer
aktivt halvår. Importerte val blir avgrensa til kjende stabile ID-ar før dei
blir viste eller brukte av rommodellen. Spelet sender ikkje data ut av
nettlesaren.

## Ferdig for denne milepålen når

- heile karakterbyggjaren verkar i oppstarten, heimeskjermen, avspelinga og
  sluttrapporten
- startrommet viser dei tre billegaste grunnmøblane
- ein elev kan kjøpe og byte møblar, sjå saldo og forstå dei små utslaga
- rom, karakter, framdrift og kjøp overlever lokal oppdatering og eksport/import
- dei seks skulehalvåra, to somrane og 4–5 caseval per skulehalvår er
  framleis del av same flyt
- alle Livslina-rutene følgjer Vyrdepil sitt felles designsystem og spelet
  framleis ikkje er lista på framsida
