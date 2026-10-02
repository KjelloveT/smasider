# Designsystemet til Vyrdepil

Opne `http://127.0.0.1:8086/designsystem/` medan den lokale tenaren køyrer. Start han frå prosjektrota med `node designsystem/serve-local.cjs`.

## Faste kjelder

- `DESIGN.md` er instruksen for nye appar og avtalte redesign.
- `designsystem/index.html` viser felleskomponentane i praksis.
- `css/vyrdepil-design.css` inneheld palett, knappar, flater, skjema, trekkspel, dialog, toppmeny og sideoppsett.
- `js/vyrdepil-design.js` handterer komponentar, bakgrunn og applogo. `js/vyrdepil-menu.js` viser den eksisterande katalogen frå `json/apps.json`.
- `json/vyrdepil-design.json` reserverer éi bakgrunn per app og listar dei valde logofilene.
- `_resources/vyrdepil-design/` inneheld optimaliserte, godkjende grafikkressursar.

`catalogue.css` og `catalogue.js` gjev berre visings- og dømeåtferd på referansesida. Appane skal ikkje laste desse filene.

## Ny app og bakgrunn

Legg appen i den eksisterande `json/apps.json`, og tildel deretter ei ubrukt bakgrunn:

```powershell
node designsystem/manage-backgrounds.cjs assign <app-id>
node designsystem/manage-backgrounds.cjs check
```

Valet blir lagra i JSON, står fast ved sideinnlasting og blir ikkje trekt på nytt for eksisterande appar. Registeret listar ti scener, fire årstider og fire tider på døgnet. Framsida reserverer eit sett på 16 skolegard-landskap og vel eitt ut frå årstid og tid i norsk tid.

## Grafikkfiler

- `logos/` inneheld logoar i den valde «Måla flater»-stilen.
- `backgrounds/` inneheld 160 JPEG-landskap, maks 1920 px og under 500 kB per bilete.
- `corners/`, stolpe- og hero-filene inneheld godkjende skilt, ornament og stein-Vyrde.
- Fulloppløyste originalar ligg lokalt under `_kjelder/` og blir ikkje publiserte.

Lag nye eksportar frå originalar med `python designsystem/export-illustration.py <original> <logo|landscape> <motiv> <variant>`. Logoar blir avgrensa til 384 px og 128 fargar; landskap blir komprimerte og kontrollerte mot 500 kB.

## Puljevis migrering

Duldord er fyrste pilot. Felles-CSS-et er avgrensa til sider som uttrykkeleg har `data-vp-design`; umigrerte appar held på den eksisterande stilen. Ta éi app eller ei avtalt gruppe om gongen. Heimsank og Bolkestokk beheld dei særuttrykka som er godkjende for innhaldet deira.
