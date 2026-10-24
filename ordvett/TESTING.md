# Kontroll av UvissaOrd

Kontrollert 24. oktober 2026 frå `origin/main` på `6398a1a` (versjon 2.3.1). Produksjonsframsida og endringsloggen viste òg 2.3.1 før utvikling. Ordvett-adressa i produksjon gav framsida som reserve, ikkje det nye spelet. Den tekniske app-ID-en/adressa `ordvett` blir halden stabil etter namnebyte til UvissaOrd.

- 23 automatiske testar passerer: ordbank og normerte svar, hintprisar, eingongskjøp, betalte tomme bokstavplassar, løynd ordlengd/tema, gjentekne feil, maksimal pott, heile omgangar, dagsrotasjon, norsk midnatt/vintertid, gjenoppretting, ugyldige data, avgrensa lagring og idempotent oppgradering frå format 1.
- Alle sju spelmodulane er syntakskontrollerte. Bankversjonen er 2026-10-24.1 og regelversjonen er 3. Nye reglar har eigne dagsnøklar; eldre resultat blir ikkje rekna om med nye prisar.
- Bakgrunnsreservasjonane passerer felles kontroll; Ordvett/UvissaOrd har éi unik reservasjon.
- Lokal HTTP-test med handheva `Content-Security-Policy` frå produksjonskonfigurasjonen. `serve.ps1` fekk ikkje løyve til å starte HttpListener på denne maskina; lokal testing brukar ein mellombels Node-tenar utan nye avhengnader.
- Nettlesartest av dagssett, fri øving, hintkjøp, bokstavval, avbroten handel, tomt/gjenteke svar, riktige svar, fasit og resultat. A-formene «trekkja» og «bera» vart òg prøvde. Eit fullført dagssett opnar resultatet etter ny innlasting; øving endrar ikkje dagsresultatet.
- Med dei nye prisane vart lett dagssett fullført med 5/5 ord og 28 brukte myntar. Kjøp av plass 5 i «vegg» kosta 5 og gav ingen bokstav. Hint, tom plass og samanlikningsavtrykk av feil svar overlevde ny innlasting; same feil kosta ikkje på nytt.
- Fri øving vart prøvd med 24 myntar i teksthint, 5 for tom plass 30 og 1 for ordklasse. Ved 30 brukte myntar var alle butikkort og svarforsøket inaktive; fasit var tilgjengeleg. Potten gjekk aldri under null.
- Tema og faktisk ordlengd var skjulte før kjøp, òg i tilgjengenamna. Kjøpte kort heldt lys flate og farga ikon; berre mynten var grå og stroken over. Native `disabled` og dei felles hover-/active-reglane hindrar klikk og hoverrespons.
- Escape lukkar avsluttingsdialogen og gjev fokus attende til knappen. Kjøp flyttar fokus til det nye hintkortet; nye oppgåver og resultat får overskriftsfokus. Myntanimasjonar og kort/bokstav-rørsle tek omsyn til redusert rørsle.
- Visuell kontroll på 320, 768, 1024 px og stor skrivebordsskjerm med dei nye bileta; 437 px vart òg kontrollert under omlegginga. Faktisk dokumentbreidd hadde ingen vassrett overflyt, ingen synlege handlingsknappar var under 44 px, og ingen synlege bilete mangla. På 320 px held myntteljar og dei fem framgangspunkta seg på same rad.
- Ingen konsollfeil frå spelet. Chrome viste separate feil frå den installerte Zotero-utvidinga.
- Alle nye prosjektbilete er komprimerte PNG-filer med 128 fargar. Logoen er 384 px (30,9 kB), hintikona 192 px og myntane 128 px. Originalane ligg i ignorerte kjeldemapper.

## Avgrensingar

Felles `designsystem/check-ui-system.cjs` kontrollerer 80 HTML-sider og finn to eksisterande feil i filer denne oppgåva ikkje endrar: modalutsjånad i `heite_stavrim/css/style.css` og `ormritaren/css/editor-design.css`. Kontrollen melder ingen feil frå UvissaOrd.

Elevutprøving, lærarfagleg gjennomgang og testing på fysiske telefonar/nettbrett står att. Prisane og 30-myntpotten er spelval som bør prøvast i klassen.

Azure-preview blir kontrollert etter siste push. Tidlegare bygg av PR 124 vart stoppa av full kvote for førehandsvisingsmiljø. Ingen endringar er lagde på `main`.