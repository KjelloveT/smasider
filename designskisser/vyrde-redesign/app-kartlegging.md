> **Historisk kartlegging:** Dette dokumentet kan innehalde gamle statusar og unntak. Gjeldande krav står i `../../DESIGN.md` og `../../AGENTS.md`.

# Kartlegging av synlege appar og felles grensesnittmalar

**Andre pass er ferdig:** Sjå [sortering app for app og komponentregister](app-kartlegging-pass2.md) og [tilrådd metode og arbeidsflyt](designarbeidsflyt.md). Denne fila dokumenterer første pass.

Første kartlegging av dei 28 appane som er synlege i `json/apps.json`. Ho byggjer på appomtalar og sidene sine overskrifter/struktur. Dette er ei oversikt over kva slags grensesnitt kvar app har, ikkje ei avgjerd om at alle appane skal få same arbeidsflate.

## Appoversikt

| App | Hovudtype | Særskilde flater og flytar |
| --- | --- | --- |
| Duldord | Dagleg ordspel | Spelebrett, tastatur, dagleg/arkivert spel, resultat og statistikk |
| Vidfaren | Geografispel | Modusveljar, kart- og faktaspørsmål, vanskegrad, rundeslutt og merke |
| Heimsank | Samlespel — eige uttrykk | Rekneoppgåver, kortopning, samlingar og merke; skal haldast visuelt særeige |
| Reknedæsj | Løpande mattespel | Oppsett av vanskegrad og rekneartar, sjølve spelvisinga |
| Rettslause Raud | Plattformspel | Liggjande spelvising, styring/HUD, vanskegrad og spel slutt |
| Kludre Klodrian | Action-/reknespel | Spelvising, svarval og spel slutt |
| BåreTevling | To spelar / mot maskin | Spelmodus, brettoppsett, koordinatval, to brett og resultat |
| Frødebrett | Quiz- og brettbyggjar | Brettredigering, lag, poengtavle, spørsmål/svar, finale og import/eksport |
| Ordaklok | Ordliste- og øvingsverktøy | Listeadministrasjon, deling, QR-kode og fleire spelmodusar |
| Tidvis | Klokkeøving | Analog/digital klokke, oppgåveval, øving og utskriftsark |
| Heite Stavrim | Lag- og kategorispel | Rundeoppsett, bokstavar, kategoriar, lag, poenggiving og resultat |
| Ordsmia | Ordspel / klasseromsmodus | Spelmodus, tid, beste ord, innliming og kontroll av elevsvar |
| Talsmia | Talspel / klasseromsmodus | Spelmodus, tid, beste rundar, uttrykk og kontroll av elevsvar |
| Frødekapp | Quizverktøy | Quizbibliotek, redigering/opning av quiz og rettleiing |
| Bolkestokk | Blokkprogrammering — eige uttrykk | Blokkmeny, kodeflate, skilpaddevising og leksjonar; bevar eigen arbeidsflate |
| Ormritaren | Python-verktøy | Kodeeditor, køyring/stopp, opplæring og leksjonar; bevar editor som arbeidsflate |
| Handsam bilete | Bilethandsaming | Filopplasting, batchliste, før/etter-lerret, verktøyinnstillingar og eksport |
| BiletFlett | Collageverktøy | Biletlerret, malar, utsnitt/zoom, tekst og eksport |
| Lydskurd | Lydeditor | Fleirspors tidslinje, opptak, transportkontrollar, prosjekt og lydeksport |
| Rissverk | Vektorteikning | Teikneflate, verktøylinje, lag, eigenskapspanel og SVG/PNG-eksport |
| Klassekart | Klasseromskart | Dra-og-slepp-lerret, elevliste, møblar, møbleringsmalar og import/eksport |
| Flokkdeilar | Klasseliste og gruppedeling | Klasselister, gruppestorleik/-tal, tilfeldig trekking og gruppeavgrensingar |
| Eikekveik | Tankekart | Uendeleg lerret, nodar/koplingar, eigenskapar og lagra kart |
| Ordskodde | Ordsky | Tekstfelt, resultatlerret, form-/fargeval og eksport/utskrift |
| Ordkryss | Utskriftsverktøy | Ord/forklaringar, kryssordresultat, retningar, elevnamn og utskrift |
| Leitekryss | Utskriftsverktøy | Ordliste, bokstavrutenett, vanskegrad, dømeordlister og utskrift |
| Vitjingsruta | QR-kodebyggjar | Innhaldsvegvisar, utformingsval, førehandsvising, lesbarheitskontroll og nedlasting |
| Dagsvegen | Klasseromsplan / kontrollpanel | Dagsplan, nedteljing, no-status, trafikklys, teikne-/tekstfelt og lagra planar |

## Felles malar og komponentar å planleggje

### Grunnlag som går att på dei fleste sidene

- Toppmeny med stein-Vyrde, appnamn, navigasjon og mobilmeny.
- Sideinnpakking, breiddevariantar og responsiv grunnstruktur.
- Appintro/hero med namn, kort forklaring og valfri illustrasjon.
- Panel/skilt for innhald, varsel/banner, statusmerke og tom tilstand.
- Knappar: hovudhandling, sekundær, ikonknapp, farehandling, valt/segmentert val.
- Formelement: tekstfelt, talfelt, veljar, avkryssing, radioval, skyvar, fargeval og filopplasting; med etikett, hjelpetekst, feil og deaktivert tilstand.
- Dialog/modal med overskrift, innhald, handlingar, lukking og mobiltilpassing.
- Varsel/toast for lagra, feil, stadfesting og pågåande arbeid.
- Fokus, tastaturnavigering, ikonstorleik og lesbar typografisk skala.

### Gjentakande mønster å lage eigne malar for

- **Trekkspel / accordion:** rettleiing, FAQ og samanleggbare kategoriar. Må støtte fleire panel, tydeleg open/lukka tilstand og tastaturbruk.
- **Kort og kortsamling:** appkort på framsida, quiz-/ordlister, lagra planar, kort og merke. Skil mellom navigasjonskort og valbare/redigerbare kort.
- **Fane- og stegvising:** faner i modalar/verktøy, stegvis oppsett og vegvisarar som Vitjingsruta.
- **Valgrupper:** modusbrytarar, vanskegrad, format, rekneartar og andre samanliknbare val.
- **Tom-, lastar- og feiltyding:** ingen lagra lister, ingen bilete/lydfiler, tomt søk, feil ved opning/eksport og ferdigtilstand.
- **Liste-/samlingstabell:** klasselister, ordlister, quizbibliotek, spor, filer, lag og samlingar; med val, redigering og sletting.
- **Førehandsvising og utskrift:** arbeidsark, kryssord, leitekryss og andre resultat som skal på A4 eller lastast ned.
- **Lerret-/arbeidsflateoppsett:** fleksibel flate med verktøypanel, eigenskapspanel og mobil skuff. Felles rammeverk, men innhaldet og styringa er appspesifikk.
- **Speltilstandar:** oppsett, aktiv runde, pause/fortsetjing, resultat og spel om att. Brettet og reglane blir verande eigne for kvart spel.
- **Filflyt:** slepp-/opplastingssone, filliste, behandlingstilstand, avbryt/fjern og eksport/nedlasting.
- **Poeng/resultatvising:** poengtavle, rundesamandrag, merke og statistikk, med visuell prioritet tilpassa speltypen.

## Første prioritering for designarbeidet

1. Felles toppmeny og sidegrunnstruktur.
2. Panel/skilt, knappar, typografi og felles farge-/statussystem.
3. Accordion, modal, skjema og valgrupper.
4. Kort, lister, tom-/feiltilstand og varsel.
5. Speltilstandar og resultatmønster.
6. Arbeidsflate-, fil- og utskriftsmønster for redigerings- og verktøyappar.

## Oppfølging

Andre pass har undersøkt undersider og dynamisk UI, og sortert elementa som **felles**, **variant av felles** eller **appspesifikk**. Sjå [app-kartlegging-pass2.md](app-kartlegging-pass2.md). Visuell kontroll av alle skjermtilstandar i nettlesaren høyrer til pilot og utrulling.
