# Endringslogg — Vyrdepil

Alle merkbare endringar i prosjektet blir dokumenterte her.
Format: [Keep a Changelog](https://keepachangelog.com/), datoar i ISO 8601.

## [Ikkje publisert]

### Lagt til
- **Ordaklok** — nytt verktøy for gloseøving (inspirert av glosepus.no).
  - Fire spelmodusar: skriv svar (med tjuvtitt og bokstavbokser), multiple choice, flashcard (sjølv-vurdering) og matching.
  - Liste-editor med CRUD, masseinnliming (fleire format), JSON-import og JSON-eksport.
  - Deling av lister via URL — heile lista pakka i lenkja med `CompressionStream('gzip')` der det er mogeleg.
  - Leitner spaced repetition (5 bokser) for å prioritere ord eleven strevar med.
  - Toppscore per liste og modus, lagra i `VyrdepilStorage`.
  - Innebygd dømeliste (10 engelsk-norske ord) for rask oppstart.

### Endra
- `js/neo-header.js`: lagt til Ordaklok i dropdown-menyen og mobilnavigasjonen.
- `index.html` (rota): lagt til kort for Ordaklok og personverninfo om kva som blir lagra.
