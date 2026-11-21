# Hendingar i Livslina

`hendingar-isometrisk.png` er eit 4 × 4 sprite-ark med isometriske
pikselminiscener. Biletet er laga for Livslina med romdioramaet i spelet som
stilreferanse. Det har 64 fargar, er 1300 × 1209 pikslar og er 415 680 byte.

`js/art-vignettes.js` vel utsnitt ved hjelp av kolonne og rad, frå null:

| Rad | Kolonne 1 | Kolonne 2 | Kolonne 3 | Kolonne 4 |
|---|---|---|---|---|
| 1 | Heime-PC og mobil | Mobilbutikk | Kantine | Vennekveld |
| 2 | Nærbutikk og drikke | Klesshopping | Gaming | Mobildata |
| 3 | PC-uhell | Skulebuss | Sykkel | Verkstad og læretid |
| 4 | Pengemangel | Idrett | Tannlege | Skulearbeid |

Fleire hendingstypar deler ei scene når det ikkje fanst eit eige motiv. Arket
blir skalert med pikselert bildekant i CSS, slik at rutene held den skarpe
pikselstilen ved ulike skjermstorleikar.

## Studium og arbeid

`fase2-isometrisk.png` er eit 4 × 4-ark i same dioramafamilie.
Kvart motiv er klipt ut og sentrert i ei rute med gjennomsiktige margar.
Arket er 1344 × 1344 pikslar med 128 fargar, alfa og 306 938 byte. Dei 70
hendingane og dei 14 årsretningane har eksplisitte motivnøklar i
`data/fase2.json`. Utsnittet blir valt av `js/art-vignettes.js`.

| Rad | Kolonne 1 | Kolonne 2 | Kolonne 3 | Kolonne 4 |
|---|---|---|---|---|
| 1 | Nærmiljø og vener | Felles matlaging | Rekningar og konto | Buss og sykkel |
| 2 | Kollokvie | Rettleiing | Sjukepleie og helsefag | Lærarpraksis |
| 3 | Tømrararbeid | IT og mentor | Butikk | Lager |
| 4 | Kafé | Friår og kvile | Flytting og leige | Bustad og sparemål |

Laga med det innebygde `image_gen`-verktøyet 2026-11-01, med det gamle
hendingsarket som stilreferanse. Den fullstendige prompten står i
[`fase2-prompt.txt`](fase2-prompt.txt). Originalen ligg lokalt i den ignorerte
fila `_kjelder/bakgrunnar/livslina-fase2-original.png`; spelet brukar berre
den komprimerte utgåva. Dette er separate hendingsillustrasjonar, ikkje
målsette møblar til den autoritative rommodellen.
