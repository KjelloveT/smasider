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
