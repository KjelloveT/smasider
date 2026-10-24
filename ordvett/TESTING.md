# Kontroll av Ordvett

Kontrollert 24. oktober 2026 frå `origin/main` på `6398a1a` (versjon 2.3.1). Produksjonsframsida og endringsloggen viste òg 2.3.1 før utvikling.

- 13 automatiske testar passerer: ordbank, prisar, eingongskjøp, nye bokstavruter, tomme/gjentekne svar, normalisering, normerte infinitivsvariantar, fasit, heile omgangar, faste sett, rekordrangering og avgrensa lagring.
- Alle fire spelmodulane er syntakskontrollerte.
- Bakgrunnsreservasjonane passerer felles kontroll; berre Ordvett har fått ny reservasjon.
- Lokal HTTP-test med handheva `Content-Security-Policy` frå produksjonskonfigurasjonen. `serve.ps1` fekk ikkje løyve til å starte HttpListener på denne maskina; lokal testing brukte ein mellombels Node-tenar utan nye avhengnader.
- Nettlesartest i den innebygde nettlesaren og Chrome: heile femordsrundar på begge nivå, alle hinttypar, avbrote bokstavval utan trekk, tomt svar, gjenteke feil svar, riktige svar, fasit og resultat. A-formene «trekkja» og «bera» blir godtekne.
- Ein lett omgang enda med 5/5 ord og 11 myntar, og rekorden var synleg etter ny innlasting. Ein utfordringsomgang med éin vist fasit enda med 4/5 ord og 9 myntar.
- Escape lukkar avsluttingsdialogen og gjev fokus attende til knappen. Kjøpte hint flyttar fokus til ei tilgjengeleg handling; nye oppgåver og resultat får overskriftsfokus.
- Responsiv kontroll i Chrome ved 320, 437, 768 og 1024 px, i tillegg til stor skrivebordsvising. Kontroll av faktisk dokumentbreidd fann ingen vassrett overflyt etter retting av dekor. Ingen synlege handlingsknappar var under 44 px høge. Lange hintnamn får ei eiga rad på dei smalaste skjermane.
- Ingen konsollfeil frå Ordvett i lokal testing. Chrome viste separate feil frå den installerte Zotero-utvidinga; dei kjem ikkje frå spelet.

## Avgrensingar

Felles `designsystem/check-ui-system.cjs` køyrer gjennom 80 HTML-sider og finn to eksisterande feil i filer denne oppgåva ikkje endrar: modalutsjånad i `heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`. Kontrollen melder ingen feil frå Ordvett.

Elevutprøving, lærarfagleg gjennomgang og testing på fysiske telefonar/nettbrett står att. Prisane er førebelse. Spelet gjenbruker eit eksisterande godkjent bokmotiv som applogo.

PR-preview blir kontrollert etter at greina er publisert. Ingen endringar er lagde på `main`.
