# Spørsmålsbilete — kontroll 2026-10-25

Grunnlag: origin/main 84826ff. Produksjon viste versjon 2.4.1 og same Frødebrett-grensesnitt som før endringa. Versjonsfilene er ikkje endra.

Kontrollert lokalt i nettlesar på http://127.0.0.1:8082/frodebrett/:
- Val av PNG blir handsama lokalt til JPEG; testbiletet vart 31 143 teikn som data-URL.
- Bilete utan spørsmålstekst og med fasitsvar kan lagrast og førehandsvisast.
- Bilete og biletskildring held seg ved kategoribyte, lagring, ny innlasting og redigering.
- JSON-eksport har app/version og bevarer bilete og skildring. Importert fil kan redigerast og spelast.
- Bilete blir vist i spelspørsmål og finalespørsmål. Vanlege tekstspørsmål er framleis med.
- Fjern bilete fjernar førehandsvisinga og skildringsfeltet.
- Mobil 390 × 844, nettbrett 1024 × 768 og standard desktop: ingen vassrett overflyt. Visuell kontroll av mobil-editor, spelspørsmål og finalebilete.
- Ingen konsollfeil i nettlesaren.
- node --check for endra JS og git diff --check passerer.
- Felles UI-kontroll køyrd på 80 HTML-sider. To eksisterande feil utanfor endringa: heite_stavrim/css/style.css og ormritaren/css/editor-design.css.

Bilete er valfrie felt i eksisterande eksportformat (version 1); eldre filer treng inga migrering. Berre avgrensa raster-data-URL-ar blir viste, aldri eksterne biletadresser eller SVG. Eksisterande CSP tillèt data:-bilete. All lagring går gjennom VyrdepilStorage. Ved mellombels minnelagring viser editoren ei melding om eksport før lukking.

Føreslått changelog-linje (nytt): Frødebrett kan bruke eigne bilete i spørsmål og finalerunde; bileta blir handsama lokalt og følgjer med lagring og JSON-eksport.

Lokal kontroll er gjennomført før PR. Preview-status og eventuelle avvik blir dokumenterte i PR-skildringa.

