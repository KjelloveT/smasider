# Appkartlegging — andre pass og sortering av element

Dato: 28. september 2026.

## Grunnlag og avgrensing

Kartlegginga omfattar dei **28 synlege appane** i `json/apps.json`: 7 spel, 9 klasseromsappar, 4 mediaappar og 8 verktøy. Dei har til saman **39 HTML-sider i brukarflytane**. Hovudsider, undersider, stilark og JavaScript som byggjer grensesnitt er undersøkte.

Kjelda for porteføljen er hovudutsjekkinga i `C:/Users/kjell/_projects`. Den nyaste Duldord-prototypen er i tillegg undersøkt i `C:/Users/kjell/_projects/.worktrees/duldord-annotations`. Det er der det godkjende tre-/skoguttrykket, hjørnemotiva, stolpeendane og stein-Vyrde ligg. Desse to utgåvene av Duldord må ikkje forvekslast ved seinare arbeid.

Dette er ei **kartlegging av kjeldekoden**, ikkje ein full visuell eller funksjonell nettlesartest av alle skjermane. Filnamn i tabellane er relative til appmappa. `heimsank/kort-preview.html`, `rettslause_raud/tiles_preview.html` og `frodekapp/nettsjekk.html` er preview-/diagnostikksider og er utelatne frå dei 39 sidene. Skjulte appar og andre prototypar er utelatne.

## Kva dei tre gruppene tyder

| Gruppe | Kriterium | Døme |
| --- | --- | --- |
| **Felles komponent** | Same struktur og åtferd kan nyttast med ulik tekst og data. | Knapp, skjemafelt, trekkspel, dialog, fane, statusmelding |
| **Variant / samansett mønster** | Fleire appar treng same oppsett, men med ulik storleik, tettleik eller innhald. | Speloppsett, poengtavle, editor med sidepanel, filimport, utskriftsvising |
| **Appspesifikk flate** | Utforming og styring følgjer sjølve faginnhaldet eller motoren. | Klokkevisarar, skipsrutenett, tidslinjeklipp, kodeblokker, QR-modular |

Alle appar får den nye felles toppmenyen. Heimsank og Bolkestokk er dokumenterte designunntak i `CHANGELOG.md`; appinnhaldet deira skal halde på det eigne uttrykket. Det at andre appar har lokale CSS-klassar er ikkje i seg sjølv eit designunntak.

## Sortering app for app

Knappar, ikon, typografi, fokus og vanlege felt høyrer til fellesgrunnlaget. Tabellane framhevar særleg dei andre elementa som må handterast.

### Spel — 7 appar

| App og undersøkte sider | Felles komponentar | Variantar / samansette mønster | Appspesifikke flater |
| --- | --- | --- | --- |
| **Duldord** — `index.html`; dessutan den nye prototypen | Hero, infopanel, dialog for hjelp/statistikk/arkiv, statusmelding, navigasjonsknappar, fargeforklaring | Dag/dato og førre/neste, statistikk med fordelingsstolpar, arkivkalender, skilt med dekor | Gjettebrett, bokstavtilstandar, skjermtastatur og tallskilt langs freistnadene |
| **Vidfaren** — `index.html`, dynamiske spørsmål i `js/` | Hero, valkort, valgruppe, resultatpanel, dialog og merkegrid | Quizoppsett, framdrift/poeng, spørsmålsflate og rundesamandrag | Kartval, landkonturar, geografiske bilete og svarframstillingar |
| **Heimsank** — `index.html`, dynamiske kort i `js/ui.js` og andre UI-modular | Ny toppmeny; felles åtferd kan gjenbrukast for meldingar og dialoglukking | Eigne kategori- og merkegalleri, kortdialog, innstillingar, oppgåve og resultat | Kortvifte, kortopning, korthylle, sjeldsemd og album; eige visuelt design |
| **Reknedæsj** — `index.html`, `game.js` | Meny-/innstillingspanel, valgruppe, talfelt, knappar, melding og resultatpanel | Liggjande spelramme, orienteringsmelding, poeng/tid og rekneoppgåve som overlegg | Løpespel på canvas, hopp/styring og bonusgrafikk |
| **Rettslause Raud** — `index.html`, `game.js` | Ny toppmeny må leggjast til; valgruppe, oppsett og resultatknappar | Liggjande spelramme, orienteringsmelding, HUD og spelet-er-slutt-vising | Plattformbane, figur, lava, styring og tal i banen |
| **Kludre Klodrian** — `index.html`, innebygd JavaScript | Menypanel, valgruppe og resultatpanel | Liggjande spelramme, poeng/rekord og orienteringsmelding | Canvas, pufferfisk, svarportar og spelstyring |
| **BåreTevling** — `index.html`, UI-modular i `js/` | Hero, stort trekkspel, valgrupper, skjema og resultatpanel | Oppsett, aktiv spelar, brettbytte på smal skjerm og poengsamandrag | Skipsplassering, koordinatrutenett, treff/bom og skipvising |

### Aktivitetar i klasserommet — 9 appar

| App og undersøkte sider | Felles komponentar | Variantar / samansette mønster | Appspesifikke flater |
| --- | --- | --- | --- |
| **Frødebrett** — `index.html`, særleg `js/editor.js` | Hero, liste, skjema, faner og dialogar | Lagoppsett, redigerbart kategori-/spørsmålsbibliotek, poengtavle, spørsmål/svar-dialog og import/eksport | Jeopardy-rutenett, daglegdobbel, satsing, finale og podiuminnhald |
| **Ordaklok** — `index.html`, `editor.html`, `play.html`; `js/menu.js`, `js/game.js`, `js/modes/` | Bibliotekkort, tomtilstand, valkort, redigerbare rader, trekkspel og dialogar | Listeditor, bulkinnliming, deling med lenkje/QR, øvingsoppsett og svaroversikt | Fire øvingsmodusar, hugsekort/paring og boksekampgrafikk; nytt Vyrdepil-UI rundt desse |
| **Tidvis** — `index.html`; heile UI-et blir bygd i `js/ui.js`, oppgåver i `js/modes/`, ark i `js/print.js` | Hero, valkort, valgrupper, melding, resultatpanel og galleri | Oppsett, framdrift/XP, merke, arbeidsarkoppsett og A4-vising | Analog/digital klokke, dra i visarar, tidsparing og klokkeoppgåvene |
| **Heite Stavrim** — `index.html`, `js/render.js` | Hero, skjema, valgruppe, dialog og lister | Rundeoppsett, førehandsvising, lag/poeng, svarinnsamling og resultatrangering | Bokstav-/kategoritrekk og poengreglane |
| **Ordsmia** — `index.html`, UI i HTML og `js/ui.js` | Hero, valgrupper, historikkliste, hjelpedialog og resultatpanel | Spelmodus, nedteljing, klasseromspresentasjon og kontroll av mange elevsvar | Bokstavsett, ordinntasting, ordkontroll og ordresultat |
| **Talsmia** — `index.html`, `js/ui.js` | Same grunnkomponentar som Ordsmia | Spelmodus, nedteljing, klasseromspresentasjon og kontroll av mange elevsvar | Talsett, uttrykk, måltal og løysingsforslag |
| **Frødekapp** — `index.html`, `editor.html`, `host.html`, `play.html`, `solo.html` | Hero, bibliotek, skjema, statusmerke, progress og førehandsvisingsdialog | Quizeditor, vert/deltakar-lobby, tilkoplingstilstand, svaralternativ og poengtavle | Sanntidsquiz og rangering; appregisteret markerer live-delen som i ustand, som må følgjast opp separat |
| **Bolkestokk** — `index.html`, `bygg.html`; dynamiske trekkspel i `js/landing.js`, `js/leksjon.js`, `js/oppgaver.js` | Ny toppmeny; del funksjonsmønster for leksjonsdetaljar og meldingar | Kurskort, leksjonspanel, hint/fasit og resultatpanel med eigen visuell profil | Puslespelblokker, blokkmeny, programbenk, skilpadde og kodevising; eige design |
| **Ormritaren** — `index.html`, `kode.html`, `redigering.html`; `js/ui.js`, `js/leksjon.js`, `js/diagnose.js` | Kurskort, små trekkspel, faner, skjema, status/feil og inputdialog | Leksjonspresentasjon, fleirpanels editor, filoversikt, oppgåveredigering og køyringsstatus | Kodeeditor, terminal/input, variabelvising og grafikkutdata; fagfargar/syntaks må framleis vere funksjonelle |

### Bilete og media — 4 appar

| App og undersøkte sider | Felles komponentar | Variantar / samansette mønster | Appspesifikke flater |
| --- | --- | --- | --- |
| **Handsam bilete** — `index.html`, `js/` | Opplastingssone, stegvising, skjema, små trekkspel, valgruppe og personverndialog | Filstripe/batchval, eigenskapspanel, behandlingstilstand og eksport | Før/etter-vising, utsnitt, rotasjon, reinskoring og plassering av vassmerke |
| **BiletFlett** — `index.html`, `js/app.js`, `js/collage.js` og malmodulane | Verktøyrad, panel, valkort og dialog | Malgalleri, biletopplasting, tekstinnstillingar og eksport | Collagelerret, malane, utsnitt/zoom og elementplassering |
| **Lydskurd** — `index.html`, modulane i `js/` | Verktøyrad, eigenskapspanel, skjema, dialog, progress og tipsvising | Filimport, opptak, prosjektlagring, gjenkopling av filer og eksport med framdrift | Tidslinje, spor, bølgjeform, klipphandtak og avspelingsstyring |
| **Rissverk** — `index.html`, særleg UI-/dialog-/fargemodulane i `js/` | Verktøyrad, panel, lagliste, skjema, dialog og hjelpetekst | Editor med sidepanel, farge-/eigenskapveljar, storleiks- og eksportdialog | SVG-lerret, former, penn/punktredigering, handtak, justering og lagoperasjonar |

### Verktøy — 8 appar

| App og undersøkte sider | Felles komponentar | Variantar / samansette mønster | Appspesifikke flater |
| --- | --- | --- | --- |
| **Klassekart** — `index.html`, UI-modular i `js/` | Verktøyrad, sidepanel, rader, faner, skjema og dialog | Elevlisteveljar, møbleringskort, lagra kart og import/eksport | Klasseromslerret, pultar, møblar, plassering og fordeling |
| **Flokkdeilar** — `index.html`, `admin.html`, `trekk.html`; `js/ui-index.js`, `js/ui-admin.js` | Bibliotekkort, redigerbare lister, trekkspel, skjema og stadfestingsdialogar | Klasselisteadministrasjon, PIN-felt, gruppestorleik, elevveljar, trekking og resultatsamling | Relasjonstabell for kven som kan vere saman, grupperingsreglar og trekkvising |
| **Eikekveik** — `index.html`, `js/picker.js`, `js/render.js` | Verktøyrad, panel, faner, søk/valgrid, skjema og dialog | Node-/linjeeigenskapar, zoomkontroll, lagra kart og eksport | Nodane, koplingane, former, panorering og dragstyring |
| **Ordskodde** — `index.html`, UI-/render-/eksportmodulane i `js/` | Tekstfelt, panel, skjema, ordliste, bibliotek og lagredialog | Tekst-til-resultat-oppsett, eigenskapsval og eksport | Ordskyutlegging, former og innhaldsfargar |
| **Ordkryss** — `index.html`, UI-/print-/storage-modular i `js/` | Redigerbare rader, panel, bibliotek og dialog | Bulkinnliming, elevnamnveljar, resultatførehandsvising, ark/fasit og utskrift | Kryssordgenerator, nummerert rutenett og forklaringslister |
| **Leitekryss** — `index.html`, UI-/print-/storage-modular i `js/` | Same grunnkomponentar som Ordkryss | Ordlisteveljar, dømegalleri, elevnamnveljar, ark/fasit og utskrift | Bokstavrutenett, ordplassering, vanskegrad og fasitmerking |
| **Vitjingsruta** — `index.html`, `js/ui.js`, `js/content.js`, `js/design.js`, `js/batch.js` | Skjema, faner, trekkspel, statuspanel, bibliotek og lagredialog | Innhaldstypar, QR-førehandsvising, logoopplasting, skannekontroll og batch-/utskriftsflyt | QR-modular, hjørnemerke, logoareal og lesbarheitskontroll |
| **Dagsvegen** — `index.html`, `js/render.js`, `js/edit.js`, `js/emoji.js` | Side-/verktøymeny, panel, lister, dialog, faner og valgrid | Planeditor, no-markering, nedteljing, lagra planar, fagveljar og fullskjerms tavlevising | Dagsplanrader, trafikklys, teikneflate, tekstfelt og hjernepausar |

## Register over felles komponentar

Dette er produksjonsoppgåver for det nye designsystemet. Døma viser kvar behovet er stadfesta. Ein komponent skal få ei felles struktur og utprøvde variantar; lokale namn som `.bk-modal` og `.help-modal` er kandidatar for migrering til denne strukturen.

| Komponentfamilie | Variantar / tilstandar som trengst | Stadfesta døme |
| --- | --- | --- |
| **Toppmeny og navigasjon** | Brei/smal, mobilmeny, aktiv app, tilbake; kompakt bruk rundt spel | Alle appane; Rettslause Raud manglar `<neo-header>` i dag |
| **Hero / appintro** | Med logo/mascot, utan bilete, kompakt, skjult under speling | Duldord, Vidfaren, BåreTevling, Frødebrett og andre menysider |
| **Panel / infoskilt** | Vanleg innhald, overskrift/innhald, infopanel, tett editorpanel; dekor valfri | Duldord, Ormritaren, Rissverk, Lydskurd |
| **Knapp og handlingsrad** | Hovud/sekundær/fare, ikon, lang tekst, valt, deaktivert, hover/fokus/trykt | Alle; eigne `.bk-btn`, `.opt-btn`, `.dd-action` finst |
| **Skjemafelt** | Etikett, hjelp, feil, obligatorisk, deaktivert; tekst/tal/select/textarea/range/farge/fil | Handsam bilete, Vitjingsruta, Flokkdeilar, Ordaklok |
| **Valgruppe** | Eitt val / fleire val, små knappar / større valkort, tydeleg valt tilstand | Vanskegrad, rekneartar, spelmodus, utskriftsval |
| **Trekkspel / accordion** | Stor kategori/rettleiing, vanleg innstillingsgruppe, kompakt leksjonsdetalj | Framsida, BåreTevling, Handsam bilete, Ordaklok, Vitjingsruta, Flokkdeilar, Ormritaren, Bolkestokk |
| **Dialog** | Liten stadfesting, skjema, stor førehandsvising; hovud/innhald/handlingar, skrolling, fokus og Escape | Duldord, Frødebrett, Rissverk, Klassekart, Lydskurd og andre |
| **Faner** | Horisontale, smal vising; aktiv fane, tastatur og knytt innhald | Frødebrett, Ormritaren, Eikekveik, Vitjingsruta, Dagsvegen |
| **Kort** | Navigasjon, val, bibliotek; miniatyr, metadata, handlingar og tom variant | Framsida, Ordaklok, Frødekapp, Flokkdeilar og malveljarar |
| **Liste og tabell** | Visingsrad / redigerbar rad, val, handlingar og responsiv overflyt | Ordlister, klasselister, fillister, lagliste, quizspørsmål |
| **Melding og tilstand** | Info/varsel/feil/suksess, tomt, lastar, avbrote; toast og melding i flata | `Vy.toast`, importstatus, QR-status, tomme bibliotek og køyringsfeil |
| **Framdrift og teljar** | Prosent, tal av total, ventetid, nedteljing; tekst saman med markering | Tidvis, Vidfaren, Frødekapp, Dagsvegen, Lydskurd |
| **Verktøyrad** | Grupperte ikonknappar, aktivt verktøy, zoom, kort hjelp; romsleg og tett variant | Rissverk, Lydskurd, Eikekveik, Klassekart, BiletFlett |

### Mønster bygde av fleire komponentar

| Samansett mønster | Innhald | Appar som bør vere referansar |
| --- | --- | --- |
| Speloppsett og skjermbyte | Modus, vanskegrad, innstillingar og start/fortset | Vidfaren, BåreTevling, Ordsmia/Talsmia |
| Oppgåve og svar | Spørsmål, svarval/inntasting, hjelp og tilbakemelding | Vidfaren, Ordaklok, Tidvis, Frødekapp |
| Resultat og poengtavle | Samandrag, metrikar, lag/rangering, merke og omspel | Frødebrett, Heite Stavrim, Vidfaren |
| Arbeidsflate med panel | Verktøyrad, fleksibelt lerret, sidepanel/faner/skuff på smal skjerm | Rissverk, Klassekart, Eikekveik, Ormritaren |
| Bibliotek / samling | Kort/lister, metadata, ny/opne/dupliser/slett, tomtilstand | Ordaklok, Frødekapp, Flokkdeilar, Dagsvegen |
| Filflyt | Slepp/vel fil, filelement, behandling, importstatus og eksport | Handsam bilete, Lydskurd, BiletFlett |
| Deling | Lenkje, kopiering, QR og status; delingsdata følgjer fragmentregelen | Ordaklok; romkode/lobby i Frødekapp er ein annan variant |
| Arbeidsark og utskrift | Arkval, elevnamn, førehandsvising, fasit og nedlasting/print | Ordkryss, Leitekryss, Tidvis, Vitjingsruta |
| Leksjon og hjelp | Kurskort, læringsmål, steg, hint/fasit og framdrift | Ormritaren og Bolkestokk; Bolkestokk held på eige uttrykk |

**Faner, valgrupper og stegvising skal vere ulike komponentar.** Ei fane byter innhald, ei valgruppe stiller ei innstilling, og stegvising viser kor i ein arbeidsflyt brukaren er. Handsam bilete er referanse for stegvising.

## Felles grafiske ressursar

| Ressurs | Utføring og variantar |
| --- | --- |
| Skogbakgrunn | Godkjend scene med lysvariantar. Ei roleg framstilling rundt arbeidsflater; kontroller både brei og smal beskjering. |
| Skilt og flater | Lys trefarge som grunnflate; ramme og dekor tilpassa innhald. Heroform og rektangulært panel er eigne variantar. |
| Hjørnetopografi | Avgrensa, unike motiv frå den godkjende stilen. Fade og klipping høyrer til dekorlaget, slik at mønstera ikkje møtest over tekst. |
| Stolper | Eitt synleg dekorlag per stolpe. Topp og botn er eigne ressursar med 40 px synleg utstikk på infoskiltet. Tallstolpen har i tillegg ei midtdel som eigen variant. |
| Vyrde | Godkjend steinfigur, klar plassering og luft; liten logo og større illustrasjon må kontrollerast kvar for seg. |
| Ikon | Gjenbruk det eksisterande Lucide-systemet; verktøyikon skal ha same strek og storleiksreglar. |

## Konsekvensar for bygging og migrering

1. Lag først dei felles komponentane i ei levande katalogside som lastar produksjonsfilene. Start med panel, knapp, skjema, trekkspel og dialog; desse dekkjer mest av porteføljen.
2. Vis kvar komponent med kort og lang tekst, tomt og fullt innhald, valt/deaktivert, og på mobil. Lag romsleg og tett variant av panel/felt/verktøyrad.
3. Bygg så mønstera for spel, bibliotek og editor. Eit kompakt editorpanel skal ikkje få like mykje stolpe-/hero-dekor som ei startside.
4. Bruk HTML/CSS og små felles JavaScript-modular. Gjenbruk `VyrdepilStorage`, `ICON` og `Vy` framfor nye kopiar av dei same hjelparane. `<neo-header>` har eigne stilar i Shadow DOM og må oppdaterast som eigen felles komponent.
5. Dei gamle fem boks- og modaltypane treng ikkje fem nye dekorformer. Dei skal kartleggast mot funksjonane over, med éin grunnkomponent og nødvendige variantar.
6. Fast Vyrdepil-palett gjeld UI. Brukarstyrte fargar i teikningar, ordskyer, QR-kodar og tankekart må framleis kunne veljast fritt. Syntaksfargar, svarstatus og spelgrafikk har funksjonelle krav.
7. Eksisterande temakoplingar må registrerast under migreringa; Tidvis har til dømes eigne temalyttarar. At brytaren er borte i toppmenyen er ikkje åleine nok til å fjerne temastøtta.

Neste konkrete leveranse bør vere katalogsida og eit lite referansesett for palett, ramme, skugge, typografi og dekor. Metode og samarbeidsflyt er utdjupa i [designarbeidsflyt.md](designarbeidsflyt.md).
