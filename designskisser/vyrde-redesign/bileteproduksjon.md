# Grafikkproduksjon for Vyrdepil

**Vald logoretning:** Måla flater. Nye logoar skal bruke breie måla fasettar, ein litt ujamn mørk kontur, naturlege materialfargar og få tydelege detaljar. Duldord, Klassekart og Rissverk i `_resources/vyrdepil-design/logos/` er referansane. Appnamn skal stå som vanleg HTML-tekst.

## Bakgrunnsbank

Banken har ni norske turmotiv: høgfjell, fjord, fjørestein, bypark, vidde, myr, klippe, grøn bygate og sykkelsti. Kvar scene har vår, sommar, haust og vinter, og morgon, dag, kveld og natt: 144 ulike motiv. Den einskilde appen får éi fast bakgrunn frå registeret. Nye appar får ei tilfeldig, ubrukt bakgrunn gjennom `designsystem/manage-backgrounds.cjs`.

Motiva skal halde same illustrerte, turinspirerte uttrykk med store rolege former og kantete nordiske skyer. Hald midten og øvre del roleg bak dei lyse UI-flatene. Nattbilete skal framleis vere lesbare. Ikkje legg tekst, UI eller figurar inn i bakgrunnen.

## Eksport og kvalitet

Bruk `designsystem/export-illustration.py` for å lage publiseringsfila frå ein urørt original. Originalar skal liggje lokalt i `_kjelder/`; dei skal ikkje bli viste i appane.

- Logo: PNG med alfa, maks 384 px på lengste side, palett på 128 fargar.
- Bakgrunn: progressiv JPEG, maks 1920 px på lengste side, under 500 kB.
- Sjekk at motivet fungerer i små storleikar og at bakgrunnen held kontrast bak svarte UI-tekstar.
- Kontroller filstørrelse og oppdater `designsystem/illustration-bank.json` og appreservasjonane før fila blir brukt.

Dei ferdige filene vart laga i 1672 × 941 px før eksport. Eksportane er ikkje oppskalerte. Aktive bilete og faste appval er dokumenterte i `json/vyrdepil-design.json`.
