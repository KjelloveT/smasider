# Møbelprøve 02 — ressursbrief

**Historisk brief, ikkje godkjend kamerastandard.** Samansetjinga svikta på perspektiv, fysisk skala, retning og golvkontakt. Sjå `layout-standard-v4.md` og målmodellen i `layout-asset-test.html`. PNG-ane nedanfor er berre stil-/motivprøver; dei skal ikkje brukast som ferdige romressursar.

Prøvepakka inneheld seks møbelfamiliar med to variantar kvar, pluss éin fast TV og eitt tomt rom. Ho er berre ei intern visuell prøve, ikkje ei publisert Livslina-side.

## Fast lys- og kamerastandard

- Logisk romflate: 384 × 256 pikslar, same hjørnerom og same plassering av vindauget i begge variantane.
- Kamera: fast, lett opphøgd trekvart hjørneperspektiv; om lag 28° ned, rette loddrette veggar og felles golvaksar.
- Ljos: mjukt, nøytralt dagsljos. Vindauget blir verande, men solstrålar, hard lysflekk, varm fargestikk og markerte slagskuggar blir haldne ute av ressursane.
- Pikselstil: skarpe 8-bit-klasar, mørk plommekoks-kontur, avgrensa palett og ingen glød rundt sprite-kanten.
- Plassering: kvar møbelfamilie har felles logisk lerret og botnsentrert golvpivot. Ein variant blir bytt utan at dette festet flyttar seg.
- Alle møbelpromptane brukte `room/room-neutral-v2.png` berre som kamera-, lys- og pikselreferanse. Ingen tidlegare Livslina-illustrasjon blei brukt som stilkjelde.

## Variantane

| Familie | Variant 1 | Variant 2 | Felles retning |
|---|---|---|---|
| Seng | Lys eik, grøn dyne, open tre-gavl | Eik, polstra lyngfarga gavl, blågrøn fotbrettpledd | Gavl bak/høgre; fotende fram/venstre |
| Pult | Kompakt skrivepult med skuff | Breiare spelpult med mørk ramme og kabelrenne | Front mot rommet; langkant langs bakveggen |
| Stol | Trestol med ryggspiler | Justerbar stol med hjul og polstra rygg | Rygg mot kamera; sitjeflate inn mot pulten |
| Teppe | Salvie/lyng med geometrisk midtmotiv | Blå/korall med stor blomestjerne | Flatt på golvet; langkant langs romaksen |
| Sofa | Salviefarga tosetar | Korallfarga tosetar | Sitjefront mot TV til venstre |
| TV-benk | Lukka skapdører og eiketopp | Open hylle, skuff og eiketopp | Front mot romsenteret |

TV-en er ei eiga fast ressurs med abstrakt fargeskjerm, utan lesbar tekst eller merke.

## Etterbehandling

Genererte PNG-ar blir klipte etter alfa, delvis gjennomsiktige glød-/bakgrunnspikslar blir fjerna med alfa-terskel, og motiva blir skalerte med næraste-nabo-metode inn på eit felles transparent lerret per familie. Palett-PNG blir avgrensa til høgst 128 fargar. Genereringsoriginalane blir verande i Codex sitt genererte biletearkiv.

## Testside

Opne `layout-asset-test.html`. Alle seks vala endrar berre sprite-fila; plassering, pivot, bakgrunn og kamera står fast. Tilbakestillingsknappen set alle familiar tilbake til variant 1. Sida lagrar ingenting.
