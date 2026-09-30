# Vyrdepil — designinstruks

Utgåve 1.0 · 30. september 2026. Brukarvald retning for heile Vyrdepil.

## Les fyrst

1. Denne instruksen er den faste designreferansen for alle publiserte appar og undersider, ikkje berre nye appar.
2. Sjå dei faktiske komponentane i [designsystem/index.html](designsystem/index.html).
3. Bruk **[css/vyrdepil-design.css](css/vyrdepil-design.css)**. Denne eine fila inneheld palett, typografi, knappar, flater, skjema, trekkspel, dialog, navigasjon, appoppsett og responsiv grunnstil. Ho krev ikkje gamle temaark. `designsystem/catalogue.css` er berre for demonstrasjonssida.
4. **[json/vyrdepil-design.json](json/vyrdepil-design.json)** er kjelda til vald logostil, logofiler, alle 144 bakgrunnar og faste appreservasjonar. Appnamn, lenkjer, kategoriar og synlegheit kjem framleis berre frå `json/apps.json`.

## Identitet og ressursar

- **Måla flater** er vald logostil: breie måla fasettar, litt ujamn mørk kontur, naturlege materialfargar, avgrensa tekstur og få tydelege detaljar. Nye applogoar skal følgje den etablerte logofamilien i `_resources/vyrdepil-design/logos/`, saman med stein-Vyrde. Namn skal vere ekte HTML-tekst, ikkje generert tekst inni logoen.
- Stein-Vyrde i `_resources/vyrdepil-design/vyrde.png` er maskotten i toppmeny, appmeny og ved hero. Alle katalogførte appar, også skjulte appar med direkte ruter, skal ha logo i stilen Måla flater. Logoavgjerdene som er stadfesta i gjennomgangen: Duldord og Ordkryss held på tidlegare logo; Heimsank held på originalen; Frødebrett får Jeopardy-liknande spørsmålsrute; Leitekryss får eit ringa ord.
- Ressursane i `_resources/vyrdepil-design/` er felles. Bruk dei eksisterande filene; ikkje generer eit nytt skilt, stolpebilete eller ornament for kvart oppdrag.
- Bakgrunnar gjev variasjon. Knappar, skilt, skrift, ramme og UI-palett står fast uavhengig av landskap, årstid og lys.
- Heimsank og Bolkestokk kan halde på avtalte særuttrykk i spelinnhaldet og arbeidsflatene. Toppmenyar, appmenyar, dialogar og generell UI følgjer dette designsystemet. Dei reserverte landskapa skal ikkje overstyre funksjonelle spel-/arbeidsflater.

## Fast bakgrunn per app

Registeret har `backgrounds[]` med `id`, scene, årstid, tid, fil, originalmål og `assignedTo`, og `apps[appId].backgroundId`. Begge sidene av appreservasjonen må samsvare. Éi app har eitt bilete; eit bilete kan berre vere reservert til éi app. Appane blir identifiserte med ID-en frå den eksisterande appkatalogen. Framsida har ei eiga, fast reservasjon i `home.backgroundId`; det biletet blir halde utanfor tilfeldig tildeling til appar.

**Duldord:** `sykkelsti-sommar-kveld`. Dei andre katalogførte appane er tilfeldig fordelte, inkludert tre skjulte appar som får reservasjonar til seinare arbeid. Fordelinga blir ikkje trekt på nytt ved oppdatering eller sideinnlasting.

Når ei ny app blir oppretta:

1. Registrer appen i `json/apps.json`, eventuelt med `hidden: true` medan ho blir utvikla.
2. Køyr `node designsystem/manage-backgrounds.cjs assign <app-id>`. Dette vel tilfeldig frå dei ledige bileta og lagrar reservasjonen. Eit eksisterande val blir bevart, og framsidebiletet er halde av.
3. Køyr `node designsystem/manage-backgrounds.cjs check`. `assign-new` fordeler alle nye, ufordelte katalogoppføringar på same måte.
4. Er banken full, utvid han og registrer nye ressursar. Ikkje gjenbruk eit reservert bilete som stillteiande reserveval. Sletting av ei app frigjev ikkje biletet automatisk.

Tilfeldig fordeling skjer under utvikling. Nettlesaren les berre den faste JSON-fila; han skriv ikkje til henne og bruker ikkje localStorage til designval.

## Palett, skrift og tilstandar

| Rolle | Verdi |
|---|---|
| All UI-tekst og vanlege ikon | `#000000` |
| Lyst tre / papir | `#FFF9E9` / `#FFFDF5` |
| Ramme og skugge, same tone | `#142820` |
| Korall / mose / himmel | `#EFB29D` / `#D5E5C5` / `#D6E8F1` |
| Honning / lyng / stein / lys raud | `#F5DFAA` / `#E5DCEF` / `#E4E7E5` / `#F3D2CF` |
| Innvendig fokusmarkering | `#8A5B25` |

All tekst står på lyse UI-flater, òg plasshaldarar, hjelpetekst og deaktivert tekst. Ingen temaveljar eller mørkt UI-tema. Brukarvalde teiknefargar og spelgrafikk er innhald. Funksjonsfargar for svar og status er eigne verdiar; dei endrar ikkje identitetspaletten. Status får forklarande ord/ikon i tillegg til farge.

Brødtekst og kontrollar: Segoe UI/systemfont, normalt 16 px og linjehøgd 1,5. Store titlar: Arial Black med systemfallback, responsiv storleik. Lucide-ikon via `js/vyrdepil-icons.js`; ingen nye fonttenester eller ikonbibliotek. Tekstblokker får `vp-prose` (maks 78ch).

Valt knapp: honningfyll og svart hake, `aria-pressed="true"`, vanleg ramme/skugge. Fokus: 4 px varm brun markering innvendig langs botnen; felt får òg ei lys varm flate. Lenker får honningfyll og tjukk understreking. Ikkje legg ein ny ytre ring rundt knappen. Vanlege knappar har 3 px loddrett skugge i ramma sin tone; panel har normalt ingen skugge.

Knappetekst skal vere sentrert, både med og utan ikon. Bruk berre ikonnamn som finst i `js/vyrdepil-icons.js`; eit tomt `data-icon`-felt blir skjult av felles CSS slik at det ikkje skyv teksten ut av sentrum.

## Felles komponentar

| Del | Klassar og struktur |
|---|---|
| Handling | `vp-button`; `--primary` korall, `--tool` himmel, `--positive` mose, `--danger` lys raud, `--quiet` utan skugge. `--compact`, `--large`, `--icon`, `--block` styrer form/storleik. |
| Hovudboks | `vp-panel` med `vp-decor vp-decor--grain` og `vp-content`. Store koter i minst 1536 px biletbreidd, utsnitt i små boksar, opasitet 0,85 og roleg midte. |
| Infoskilt | `vp-sign vp-sign--grounded` utanpå `vp-panel`. Eige klipt `vp-decor` med fire `vp-corner` og `data-vp-corners`; innhald i `vp-content`. |
| Andre flater | `vp-panel--plain` papir, `--soft` lys fargegruppe, `--inset` lett innfelt flate, `--compact` tett panel, valfri `--raised` skugge. |
| Felt og val | `vp-field`, `vp-input`, `vp-help`, `vp-choice`, `vp-choices`. Bruk ekte label, input, select og fieldset. Feil med `aria-invalid`. |
| Trekkspel | `details.vp-accordion` → `summary` og `.vp-accordion-body`. `data-vp-support` opnar støtte på brei skjerm og lèt henne foldast på mobil. |
| Melding | `vp-notice` med `vp-notice-icon` og tekst. `--success`, `--warning`, `--error` for status. |
| Dialog | `dialog.vp-dialog`, `vp-dialog-head`, tilgjengeleg namn og ein lukkehandling. Escape og fokusretur skal fungere. |
| Toppmeny | `vp-header vp-header--sky`, `vp-shell vp-header-row`, `vp-brand`, `vp-menu-trigger`. Lyse kantete kremskyer og stein-Vyrde. |
| Appmeny | `dialog.vp-dialog.vp-site-menu`, stor Vyrde, «Vyrdepil», søk og logoar etter kategoriane i apps.json. Same store kotemønster som hovudboksen. |

Hovudramme: 4 px, radius 10 px, 3 px på smal mobil. Lett ramme: 2 px. Luft: 8 px grunnrytme, 12 px mellom knappar, 16–24 px mellom grupper, 18–30 px panelpadding. Minste knappehøgd: 44/48/56 px. Lange etikettar får fleire linjer, ikkje mindre skrift.

Dekor skal klippast i sitt eige lag; stolper ligg utanfor laget bak den ugjennomsiktige skiltflata. Infoskilta har 24 px treskaft, 40 px synleg topp og botn, og to ulike steinføter. Hero har éi heil stolpe på kvar side. Ingen ekstra stolpebilete eller brunt fyll under desse.

Hjørne: maks 160 px, 18 px ut frå kanten, opasitet 0,55. Fire ulike motiv per skilt. Dei ti eksisterande PNG-motiva er den godkjende banken. Dekoren skal halde seg ved kvart hjørne og ikkje møtast over innhaldet.

Editorar, tabellar, små felt, spelkontrollar og tette lister har reine flater utan ornament/stolper. Gje dekor etter funksjon; ikkje pynt kvar undergruppe.

## Sideoppsett

| Oppsett | Bruk og struktur |
|---|---|
| Standard | `main.vp-shell` → `vp-standard`. `vp-hero-stage` og Vyrde over `vp-standard-main` og `vp-standard-support`; 1200 px totalbreidd og 700 px heroskilt. App-logo har eige felt i hero. Mobil: hero, hovudinnhald, støtteskilt; ekstra hjelp/val i trekkspel. Viktige startval og handlingar må vere synlege. |
| Utvida verktøy | `main.vp-shell.vp-shell--wide`. Intro i `vp-app-intro` (maks 1100 px), stor logo til venstre inni `vp-app-intro-board`, Vyrde utanfor til høgre. `vp-toolbar` og `vp-editor` med arbeidsflate og valfrie sidepanel. Berre arbeidsflata/verktøyrada får full breidd; sidemenyar foldast på mobil. |
| Canvas-spel | Same avgrensa `vp-app-intro`, med logo og Vyrde. `vp-game-frame`, `vp-game-stage`, canvas og HTML-status. Behald spelmotoren sitt sideforhold og eigne funksjonsfargar. Intro kan forsvinne under spel. Berøringskontrollar og viktige handlingar står synleg. |
| Informasjonssider | `body.vp-site-page` med felles skyheader og appmeny. Bruk `main.vp-shell.vp-site-main.vp-policy-page`, lyse `vp-panel`-flater og `vp-policy-heading`-skilt med kotemønster i full storleik. Hald hovudbreidda rundt 960 px og brødtekst på maks 78ch, sidan sidene ikkje har sidemeny. Tabellar brukar `vp-data-table` og kan rulle vassrett på små skjermar. Behald juridisk tekst, handlingar og skript-ID-ar når utsjånaden blir endra. |

Framsida har fem opne faggrupper frå `json/apps.json`, ikkje trekkspel. Ho viser fire kort per rad på stor skjerm, tre på nettbrett og fire på mobil; mobilkort viser berre logo og namn. Kortrekkja startar med tydeleg luft under kvart kategoriskilt. Personvern, lisens og sidefot deler breidd og venstrelinje. Vyrde står ved sida av informasjonsinnhaldet og følgjer med ved rulling, men blir gøymd på mobil.

## Startstruktur for ei ny app

```html
<!doctype html>
<html lang="nn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spelnamn — Vyrdepil</title>
<link rel="stylesheet" href="../css/vyrdepil-design.css">
<script src="../js/vyrdepil-icons.js" defer></script>
<script src="../js/vyrdepil-util.js" defer></script>
<script src="../js/vyrdepil-design.js" defer></script>
</head>
<body class="vp-page" data-vp-design data-vp-app="APP-ID">
  <a class="vp-skip" href="#main">Hopp til innhaldet</a>
  <!-- Felles skyheader og appmeny: sjå katalogen. -->
  <main class="vp-shell" id="main">
    <!-- Vel eitt av dei tre oppsetta ovanfor. -->
  </main>
</body>
```

`data-vp-app` bruker app-ID-en i JSON og lastar den reserverte bakgrunnen automatisk. Ei applogo-`img` med `data-vp-app-logo` får den valde logoen dersom ho finst i registeret. CSS-ressursbaner er relative til CSS-fila; JS reknar filbaner frå si eiga plassering og fungerer òg på undersider. Ingen app skal lage si eiga kopi av paletten eller felleskomponentane. Utvid den felles fila når fleire appar treng same komponent.

Sider som ikkje er appar, til dømes personvern og lisens, bruker `data-vp-site-page="true"` i staden for `data-vp-app`. Dei lastar same felles design-, ikon-, skal- og menymodular, men får det faste landskapet til framsida og får inga appreservasjon.

Appar som ikkje treng ei fullbreidd arbeidsflate, bruker `data-vp-layout="medium"`; dette avgrensar hovudinnhaldet til 1200 px. Bruk fullbreidd oppsett berre når sjølve arbeidsflata har nytte av det. Språk- og ordverktøya, Tidvis, Talsmia og Vitjingsruta skal ha middels breidd.

## Leveranse og kontroll

Nynorsk UI, Vanilla HTML/CSS/JS, felles lagrings-/ikon-/hjelpemodular og personvernreglane i AGENTS.md gjeld framleis. Test små mobilvisingar (320/437 px), nettbrett og brei skjerm, tastaturfokus, lange etikettar, klipping av dekor og hovudfunksjonen. Kontroller alle lokale stylesheet- og skriptlenkjer på alle HTML-ruter før gamle fellesfiler blir sletta. Ingen side skal peike på `neobrutalisme.css`, `neobrutalisme.js`, `neo-header.js` eller `vyrdepil-migration.css`. Nye appar må ha gyldig reservasjon og laste alle ressursar utan konsollfeil.

Originalar blir lagra lokalt i `_kjelder/`; bruk komprimerte eksportar frå ressursbanken. Logo: maks 384 px, 128 fargar og alfa. Landskap: JPEG, maks 1920 px og 500 kB. Ingen oppskalering for å late som ein original har høgare oppløysing.

Designsystemet gjeld heile porteføljen. [Designkontrollen](designskisser/vyrde-redesign/designkontroll.json) viser kjelderesultata og kva som er prøvd i nettlesaren; ein statisk kontroll er ikkje det same som full gjennomspeling av alle appar.
