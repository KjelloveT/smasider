# Vyrdepil — Retningslinjer for utvikling og AI-assistert koding

Dette er den sentrale retningslinjen for koding, design og arkitektur for alle prosjekt, minispel og verktøy under paraplyen **Vyrdepil**. Som AI-assistent skal du **alltid** følgje desse reglane når du legg til ny funksjonalitet, opprettar nye sider eller refaktorerer eksisterande kode. Som menneskeleg utviklar skal du bruke den som referanse og oppslagsverk.

## 1. Grunnleggjande prinsipp og arkitektur
- **Vanilla tech stack:** Heile prosjektet er bygd med HTML5, CSS3 og Vanilla JavaScript. Ikkje bruk rammeverk (React, Vue, etc.) med mindre brukaren spesifikt ber om eit unntak.
- **Offline & lokal køyring:** All logikk skal køyre i nettlesaren. Ingen brukardata skal sendast til nokon tenar.
- **Språk:** All brukarvendt tekst på nettsidene skal skrivast på **nynorsk**. Bruk gjerne eldre og konservative variantar av nynorsk-ord der det er mogeleg. Variablar og funksjonsnamn i kode skrivast på engelsk.
- Målgruppe: Vyrdepil er ei samleside med spel og verktøy til grunnskulen, for både elevar og lærarar. Innhaldet skal passe for målgruppa. Ikkje lenk til nettstader som kan innehalde gambling, vald, misbruk eller vaksent materiale. Wikipedia-artiklar er tillatne.

## 2. Personvern (Privacy by Design)
- **Ingen cookies:** Det skal ikkje settast eller brukast cookies for sporing eller anna.
- **VyrdepilStorage:** Direkte bruk av `localStorage` er forbode inne i dei individuelle spela.
  - All lagring **må** gå gjennom det felles API-et definert i `js/vyrdepil-storage.js` (t.d. `VyrdepilStorage.saveHighScore()`, `VyrdepilStorage.saveToHistory()`, `VyrdepilStorage.getHighScore()`).
- **Personvern-oversikta på framsida:** Dersom du legg til lagring for eit nytt spel eller verktøy, eller endrar eksisterande, MÅ du samtidig oppdatere informasjonen i trekkspel-menyen (accordion) under "Personvern og datasikkerheit" → "Kva data lagrast?" på `index.html`. Spelet må listast der med informasjon om "Kva" og "Kvifor" det blir lagra. Det er òg ei visning på framsida som let brukaren sjå all informasjon som er lagra i localStorage.
- **Delingslenkjer skal bruke fragmentet (`#`), aldri spørjestrengen (`?`).** Legg eit verktøy data i lenkja — ei ordliste, eit oppsett, ein quiz — skal dei stå etter `#`. Ei spørjestreng blir **send til tenaren** og hamnar i tilgangsloggane hans, i `Referer`-headeren til kvar eksterne ressurs sida lastar, og i nettlesarhistorikka til alle som får lenkja. Fragmentet forlèt aldri nettlesaren.

## 3. Vyrdepil sitt skog-/turskiltdesign

Brukaren har valt det nye fellesdesignet. **Nye appar, nytt felles UI og avtalte redesign skal følgje `DESIGN.md`, `designsystem/index.html` og `css/vyrdepil-design.css`.** Neobrutalisme er ikkje lenger standard for nye oppgåver. Eksisterande appar blir migrerte i eigne oppgåver; funksjonelle feilrettingar skal ikkje automatisk starte eit heilt redesign.

### 3.1 Fast identitet
- Les `DESIGN.md` før ei designoppgåve. Den eine felles CSS-fila inneheld alle grunnkomponentar; app-CSS skal berre ha appspesifikke funksjonelle tillegg.
- All UI-tekst er svart (`#000000`) og står på lyse flater. Fast palett; ingen ny temaveljar. Ramme og skugge har same tone (`#142820`). Valte knappar har honningfyll og svart hake; fokus har ei innvendig varm brun markering.
- Stein-Vyrde erstattar den gamle pila i ny felles navigasjon. **Måla flater** er vald applogostil; dei tre valde logoane er i `json/vyrdepil-design.json`. Dei andre logoane blir teikna i same familie ved migrering.
- Gjenbruk skilt, stolper, ornament og landskap frå `_resources/vyrdepil-design/`. Katalogen viser gjeldande plassering og dimensjonar. Ikkje generer nye UI-ressursar som del av kvart appoppdrag med mindre dette er spesifikt etterspurt av brukar.
- Identitetsfargar og funksjonsfargar er ulike. Behald faglege spelbrett, teiknefargar, figurar og arbeidsflater der dei tener funksjonen; UI-etikettar står framleis på lyse flater.
- Heimsank og Bolkestokk held på avtalte særuttrykk i appinnhaldet. Felles navigasjon kan migrerast. Dette er ikkje eit generelt unntak for appar med lokal CSS.

### 3.2 Sideoppsett og komponentar
- Standard: `vp-shell` og `vp-standard` med hero, rom for applogo, Vyrde ved sida, hovudboks og infoskilt. Støtte blir trekkspel på mobil; viktige startval og handlingar er synlege.
- Utvida verktøy: `vp-shell--wide`, avgrensa `vp-app-intro` med stor logo inni til venstre og Vyrde utanfor til høgre; verktøyrad og arbeidsflate får heile breidda. Sidepanel foldast på mobil. Innhaldstekst held eiga lesegrense.
- Canvas-spel: avgrensa intro som ovanfor, eiga `vp-game-frame`, korrekt sideforhold og synlege spelkontrollar. Behald spelmotoren og spelgrafikken.
- Knappar: `vp-button` med rolle-, storleik- og tilstandsvariantar. Flater: `vp-panel` med fem familiar. Skjema: `vp-field`, `vp-input`, `vp-choice`. Trekkspel: `vp-accordion`. Dialog: `vp-dialog`. Sjå strukturane i DESIGN.md/katalogen.
- Bruk felles klassar for generelle knappar, panel, felt, trekkspel og dialogar. App-CSS skal halde seg til oppsett, geometri og faglege tilstandar, ikkje kopiere fyll, rammer, skuggar, typografi eller fokusstil.
- Dialogar brukar `Vy.openModal()`, `Vy.closeModal()` og `Vy.bindOverlayClose()` for fokusfelle, Escape, rullelås, fokusretur og bakgrunnsklikk.
- Nye sider aktiverer sidefoten med `data-vp-site-footer` og lastar `js/vyrdepil-footer.js`. Canvas-spel (`data-vp-layout="canvas"`) er unntatt for å unngå ekstra rulling og kluss rundt spelruta.
- Nye sider bruker `<body class="vp-page" data-vp-design data-vp-app="APP-ID" data-vp-site-footer>`, felles CSS og `js/vyrdepil-design.js` etter ikon-/hjelpemodulane. Ingen avhengnad av `catalogue.css` eller gamle neobrutalisme-klassar.
- Ny navigasjon følgjer skyheaderen og appmenyen i katalogen, med kategoridata frå den eksisterande `json/apps.json`. Ikkje bruk den gamle temaveljaren i nye grensesnitt.
- Alt skal vere responsivt på små telefonar, nettbrett og store skjermar. Bruk grid/flex, clamp og minmax. Test at det ikkje er vassrett overflyt, at tekst er lesbar og at dekor blir klipt i eigne lag.
- UI-ikon er Lucide frå den felles ikonmodulen, ikkje nytt emoji. Dei avtalte innhaldsunntaka gjeld framleis: Dagsvegen sine fagemoji og Eikekveik sine nodeemoji; ikkje bruk flagg eller samansette ZWJ-emoji. Desse unntaka gjeld ikkje knappar/verktøyrader.

### 3.3 Bakgrunnsreservasjonar
- `json/vyrdepil-design.json` er den faste oversikta over alle bakgrunnar og kva app som eig kvart bilete. Éi app får eitt unikt bilete; bakgrunnen blir ikkje trekt på nytt ved sideinnlasting.
- Når du lagar ei ny app: registrer henne i `json/apps.json`, køyr `node designsystem/manage-backgrounds.cjs assign <app-id>`, og deretter `check`. Verktøyet vel tilfeldig frå ledige bilete og bevarer gamle val. Ikkje lag ein ny appkatalog.
- Nettstaden kan reservere eit sett i `siteBackgroundSets` i designregisteret. Framsida har 16 skolegard-bakgrunnar og vel årstid og tid ut frå serverdatoen i `Europe/Oslo`; alle reserverte nettstadbilete er utelukka frå tilfeldig apptildeling.
- Full bank krev fleire ressursar, ikkje gjenbruk av eit reservert bilete. Sletta appar held reservasjonen til han blir frigjeven med eit medvite val.
- Alle 32 katalogførte appar har reservasjonar (29 synlege og tre skjulte). Reservasjon er ikkje automatisk redesign av ei eksisterande app.

## 4. Arbeidsflyt for AI
Når du lagar eller modifiserer kode i dette prosjektet:
1. Sjekk at du ikkje bryt lagringsmønsteret for `localStorage` (bruk `VyrdepilStorage`).
2. Implementer nye grensesnitt med komponentane i `css/vyrdepil-design.css` og instruksen i `DESIGN.md`; hald reine funksjonsfiksar innanfor det eksisterande appdesignet til migrering er avtalt.
3. Sikre at layout er grid/flex og responsiv. Sjekk at det fungerer på mobil, små og mellomstore nettbrett, og store desktop-skjermar.
4. Pass på at UI og statiske tekstar er skrivne på nynorsk.
5. Oppdater personvern-lista på framsida viss lagringsbruken til eit spel endrar seg.
6. Still spørsmål og få avklaring dersom det er tvil om korleis noko skal løysast.
7. Ved visuelle endringar skal sida testast lokalt i nettlesar.

## 5. Kvalitet og kontroll

### 5.1 JS-arkitektur
Spel og verktøy med meir enn **~400 linjer JavaScript** skal splittast i fleire filer etter ansvarsområde (t.d. `state`, `render`, `input`, `storage`, `game`).  Bruk **IIFE-mønster** med eksponerte modular — sjå `heimsank/js/` og `klassekart/js/` som referansar. Ein monolittisk ES6-klasse er greitt for kompakte verktøy under denne grensa.

### 5.1.1 Fellesmodulane i `js/` — sjå her før du skriv ein hjelpar

Ligg det ein hjelpar i `js/`, skal verktøyet bruke han. Skriv ikkje din eigen.

| Fil | Gjev deg |
|---|---|
| `js/vyrdepil-storage.js` | All lagring (§2). |
| `js/vyrdepil-icons.js` | `ICON(namn, storleik)` — Lucide-ikon som SVG. |
| `js/vyrdepil-util.js` | `Vy.escapeHtml`, `Vy.el`, `Vy.shuffle`, `Vy.rng`, `Vy.newSeed`, `Vy.slug`, `Vy.uuid`, `Vy.downloadBlob`, `Vy.downloadJson`, `Vy.openModal` / `closeModal` / `bindOverlayClose` (med Escape, §5.4), `Vy.toast`. |
| `js/vyrdepil-elevlister.js` | Elevnamn frå Flokkdeilar og Klassekart: `kjelder()`, `reinsk()`, `tel()`, og den ferdige veljardialogen `lagVeljar()`. |
| `js/vyrdepil-app-shell.js` og `js/vyrdepil-menu.js` | Felles toppmeny, appmeny og grunnramme for Vyrdepil-sider. |
| `js/vyrdepil-footer.js` | Felles sidefot når sida har `data-vp-site-footer`. |
| `js/vyrdepil-fullscreen.js` | Fullskjerm i spel. |

**Kvifor dette er ein regel og ikkje eit tips.** Same funksjonen skriven på nytt
i kvart verktøy er ikkje berre meir kode — det er fleire sjansar til å skrive
han litt feil, og ein feil som blir retta éin stad medan dei andre lever
vidare. Repoet hadde på det meste ni `toast()`, åtte `downloadBlob()`, ti
`shuffle()` og fire `escapeHtml()`. Éin av dei fire escape-funksjonane rensa
ikkje hermeteikn i det heile og var difor verdlaus inne i eit HTML-attributt,
og alle ni toast-ane fylte flata med `--accent` og fall under AA-kravet i dei
sju mørke temaa (§3.2). Ingen av delane hadde overlevd i ei felles fil, fordi
ei felles fil blir lesen av fleire.

Har verktøyet alt eit eige `util`-objekt, skal det **peike vidare** til
fellesmodulen i staden for å halde ein kopi — sjå `leitekryss/js/util.js` og
`ordkryss/js/util.js` for mønsteret. Kallstadene treng ikkje å endrast.

Rekkjefølgja på script-taggane: fellesmodulane fyrst, så verktøyet sine eigne.

```html
<script src="../js/vyrdepil-storage.js"></script>
<script src="../js/vyrdepil-icons.js"></script>
<script src="../js/vyrdepil-util.js"></script>
<script src="../js/vyrdepil-elevlister.js"></script>
<script src="js/util.js"></script>
```

**Treng du noko som ikkje finst der?** Er det noko berre dette verktøyet vil
bruke, høyrer det heime lokalt. Er det noko det andre verktøyet nummer to kjem
til å trenge — legg det i `js/vyrdepil-util.js` med ein gong. Grensa går på om
funksjonen handlar om *domenet* til verktøyet eller om *plattforma*.

### 5.1.2 Felles Bragd-system

- Nye spel og andre sider som viser bragder skal bruke den felles katalogen `json/bragder.json`, visingsmodulen `js/vyrdepil-bragd.js` og lagrings-API-et i `js/vyrdepil-storage.js` (`recordBadge`, `updateBragdProgress`, `getBragdData`). Bruk same Bragd-komponent og visuell familie på tvers av spela; vis òg applogo og spelnamn.
- Bruk stabile app-ID-ar og bragd-ID-ar. Spelet eig vilkåra og registrerer berre ei bragd når evaluatoren faktisk låser henne opp. Det rapporterer framgang når speltilstanden blir endra. Fellesmodulen skal ikkje evaluere spelvilkår, spørje etter framgang i bakgrunnen eller halde ei parallell samling.
- All lagring skal gå gjennom `VyrdepilStorage`; ikkje skriv direkte til `localStorage`. Bragd-blokka skal ikkje innehalde elevnamn eller oppteningsdatoar. Ved overgang frå eldre speldata skal det lagast ei versjonert, idempotent migrering som les kjeldedata utan å endre dei.
- Bruk «Bragd» konsekvent i brukarvendt tekst, med nynorsk bøying som «Ny bragd» og «Bragdane dine». Oppdater personverninformasjonen dersom lagringsinnhaldet eller føremålet endrar seg.
- **Ljodstigen er ei eksisterande særordning:** det unike progresjonssystemet hennar blir verande separat, men brukarvendt achievement-tekst skal seie «Bragd». Nye unntak frå fellesløysinga krev ei medviten avgjerd.

### 5.2 JSON-eksport
Alle eksporterte data-objekt (lagra spel, quizzar, oppsett, kortsamlingar) skal innehalde to felt på toppnivå:

```json
{
  "app": "<spelnamn>",
  "version": 1,
  "...": "..."
}
```

Dette gjev ein migreringsveg når datastrukturen endrar seg, og let oss skilje filer frå ulike spel når brukarar importerer dei.

### 5.3 XSS / brukargenerert innhald
All tekst som kjem frå brukaren (lagra eller skriven inn no) skal renderast med `textContent` eller via ein `escapeHtml()`-hjelpar. **Ingen direkte `innerHTML` med dynamiske strenger.** Foretrekk DOM-API (`createElement`, `textContent`) når elementet inneheld brukargenerert innhald.

### 5.4 Tilgjenge (a11y)
- Ikon-knappar utan synleg tekst skal ha `aria-label`.
- Modal-overlay skal kunne lukkast med Escape-tasten.
- `:focus-visible`-stilar skal vere definerte for alle interaktive element (knappar, lenker, `input`, `select`, `textarea`).

### 5.5 Filstruktur
Alle spel/verktøy følgjer same struktur:

```
<spelnamn>/
  index.html          # inngangsside
  css/
    style.css         # appspesifikke tillegg til det felles designsystemet
  js/
    <modul>.js        # ein eller fleire JS-modular
```

Felles ressursar (logoar, ikon, lyd) ligg i `_resources/` på rot, eller i spelets eiga mappe når dei er spel-spesifikke.

### 5.6 Eksterne avhengnader
Nye avhengnader (bibliotek, CDN-script, fontar, ikon-pakkar) krev **eksplisitt godkjenning frå brukaren** før dei blir lagt til. **Vi skal aldri bruke eksterne font-tenester** — Google Fonts, Adobe Fonts og liknande. Kvar sidevising ville då meldt frå til ein tredjepart at ein elev opna sida, og det bryt lovnaden på framsida.

Standardvalet er framleis **system-fontar med passande fallbackar**. Ein **sjølv-hosta font i `_libs/`** er ikkje det same som ei fontteneste og er tillaten når det finst ein reell grunn — men han krev godkjenning som alle andre avhengnader, og grunnen skal stå i `_libs/CREDITS.md`. Så langt er det gjort éin gong: Andika i **Ljodstigen**, fordi `Segoe UI` teiknar stor `I` og liten `l` som to nesten identiske strekar (målt breidd 82 mot 80 einingar), og appen går ut på å kjenne att bokstavformer.

**Fontlisensar har ein felle systematisk:** SIL Open Font License brukar *reserverte fontnamn*. Subsettar eller konverterer du fonten slik at han ikkje lenger er *Functionally Equivalent* med originalen, er resultatet ein Modified Version som **ikkje får bere det opphavlege namnet**. Det er difor heile Andika ligg i repoet på 287 kB i staden for eit subsett på 21 kB — sjå grunngjevinga i `_libs/CREDITS.md`. Les lisensen før du optimaliserer ein font.

Når andre avhengnader er godkjende, skal dei anten:
- **Sjølv-hostast** i `_libs/` på rot (foretrekt for ekte offline-støtte), eller
- **Dokumenterast** i personvernseksjonen på framsida med kjelde og kva data som kan synast (t.d. IP-adresse i CDN-loggar).

**Store binærfiler skal versjonspinnast, ikkje haldast oppdaterte.** Repoet
har ikkje Git LFS, så ei avhengnad på fleire megabyte blir liggjande i
historikka for alltid — og ein gong til for kvar oppgradering. Pyodide i
`_libs/pyodide/` (~13 MB) er pinna til éin versjon med vilje. Oppgrader berre
når det er ein reell grunn, og legg då den nye utgåva i ei **ny mappe**
(`_libs/pyodide-315/`) framfor å byte innhaldet i den gamle: filnamna er dei
same, og `Cache-Control: immutable` gjer at elevmaskiner elles kan sitje att
med gammal wasm og ny JS. Sjå `_libs/CREDITS.md` for versjonar og sjekksummar.

**Hugs CSP-allowlista:** all ekstern ressurs (script, bilete, fontar, API/WebSocket) blir blokkert i produksjon om han ikkje står i `Content-Security-Policy` under `globalHeaders` i `staticwebapp.config.json`. Legg origin-en i rett direktiv (`script-src`, `img-src`, `connect-src` osv.). Vér særleg merksam på **redirect-kjeder**: Wikimedia-bilete går t.d. via `commons.wikimedia.org/wiki/Special:FilePath/…` som redirectar til `upload.wikimedia.org`, og **begge** origin-ane må stå i `img-src` fordi nettlesaren sjekkar CSP på kvart ledd. NB: ein `Content-Security-Policy-Report-Only`-header *rapporterer* berre brot — han *blokkerer* ikkje, så ei side kan sjå ut til å fungere i report-only og likevel knuse når CSP-en blir handheva. Test difor alltid mot den handheva headeren før du konkluderer.

### 5.7 Logoar og bilete
Ein logo blir vist lite. Kortet på framsida er 160px høgt, hero-boksen på ei spelside 120px, og oppføringa i toppmenyen 30px. Ei fil på 512px dekkjer alt dette med god margin på ein 2×-skjerm — men eksportar frå teikneprogram kjem gjerne på 2400px og fleire hundre kilobyte, og då dreg vi på oss megabyte som ingen får sjå. Difor:

- **Komprimer alltid ein ny logo før han blir teken i bruk.** Maks **384px** på lengste side, og lagra som PNG med **paletten redusert til 128 fargar**. Det gjev typisk 10–30 kB per logo mot 100–650 kB rått. I Pillow:

  ```python
  im = Image.open(src).convert("RGBA")
  r = 384 / max(im.size)
  if r < 1:
      im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
  # FASTOCTREE er den einaste kvantiseringa i Pillow som tek vare på alfakanalen
  im.quantize(colors=128, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG).save(dst, optimize=True)
  ```

- **Legg originalen i `_kjelder/logoar/`.** Mappa er `.gitignore`-a, så originalane blir korkje publiserte eller drege med i repoet — dei ligg lokalt så vi kan lage større utgåver seinare om eit bruksområde krev det. Mappa finst difor ikkje på ein frisk klone; det er meint slik, og ingenting i koden skal peike på henne.

- **Éin storleik per logo.** Vi lagar ikkje eigne miniatyrar til menyen. Eit sett på 64px ville spart kring 390 kB på første opning av menyen, men kosta 26 ekstra filer som må haldast i takt for hand i eit prosjekt utan byggesteg. Gevinsten er ikkje verdt vedlikehaldet.

- Sprite-ark (t.d. `_resources/vyrde.png`) følgjer same tanken: skaler ned til det største visingsbehovet og kvantiser.

#### Bakgrunnar og anna spelgrafikk

Reglane over handlar om logoar, som er små. Det er ikkje der megabytene kjem
frå. Ein bakgrunn dekkjer heile skjermen, og eksporten frå teikneprogrammet
kjem gjerne som 32-bits RGBA på 2800 piksel — 8 MB for eitt bilete som ligg
bak ein meny. Tre slike bakgrunnar låg i dette repoet på til saman **23 MB**,
altså meir enn heile Pyodide-installasjonen som §5.6 skriv eit eige avsnitt om.
Ein klasse på 25 elevar bak éi skule-linje merkar det med ein gong.

Difor, for alt som ikkje er ein logo eller eit ikon:

- **Vel format etter innhaldet, ikkje etter vane.** Har biletet ikkje
  gjennomsikt — og ein bakgrunn har det som regel ikkje — skal det vere
  **JPEG**, ikkje PNG. Eit måla eller fotografisk motiv har hundretusenvis av
  fargar, og då er PNG feil verktøy: han er tapsfri og lagrar kvar einaste ein.
  Sjekk før du vel:

  ```python
  im = Image.open(src)
  a = im.getchannel("A") if "A" in im.getbands() else None
  print("treng alfa:", bool(a) and a.getextrema()[0] < 255)
  ```

  Er svaret `False`, er alfakanalen berre ein tredjedel meir fil for ingenting.
  PNG med redusert palett er framleis rett for flate fargefelt, ikon og
  sprite-ark; JPEG er rett for foto og måla flater.

- **Maks 1920 piksel på lengste side** for eit fullskjermsbilete. Ein
  klasseromsprojektor er sjeldan over 1920 brei, og eit bilete som blir skalert
  ned med `cover` treng ikkje meir. Kvalitet 82 og `progressive=True`:

  ```python
  im = Image.open(src).convert("RGB")
  r = 1920 / max(im.size)
  if r < 1:
      im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
  im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
  ```

  Dei tre bakgrunnane over gjekk frå 23 MB til under 1 MB på dette — 96 %, utan
  at nokon ser skilnaden gjennom eit menyoverlegg.

- **Taket er 500 kB per bilete.** Går ei fil over, skal ho anten komprimerast
  hardare eller grunngjevast i pull requesten. Dette er ei grense du skal måle
  mot, ikkje eit mål å sikte etter: dei fleste bakgrunnar landar på 200–400 kB.

- **Originalen går i `_kjelder/bakgrunnar/`**, på same måten som logoane. Mappa
  er `.gitignore`-a, så han blir korkje publisert eller dregen med i historikka.

- **Sjekk filnamnet.** `reknedaesj/resources/background.png.png` låg her med
  dobbel filending i månadsvis. Ingen ser eit filnamn ingen les.

**Hugs at eit bilete i eit git-repo er for alltid.** Same argumentet som for
binærfilene i §5.6 gjeld her: vi har ikkje Git LFS, så ein 8 MB PNG blir
liggjande i historikka sjølv etter at han er sletta — og ein gong til for kvar
gong nokon eksporterer han på nytt. Komprimer **før** første commit, ikkje
etterpå.

### 5.8 Compliance-pass
Ved endringar i denne fila (`AGENTS.md`) skal det gjerast eit kontroll-pass gjennom alle eksisterande spel og verktøy for å sikre at dei framleis følgjer reglane. Spel som ikkje gjer det skal merkast for oppgradering (t.d. i `CHANGELOG.md` eller som GitHub-issue). Ved modal- og felles UI-endringar skal `node designsystem/check-ui-system.cjs` køyrast for alle HTML-sider.

## 6. Workflow

### Før du startar ei oppgåve

Før den fyrste kodeendringa skal AI-agenten stadfeste både kva kodegrunnlag han arbeider på, og kva utgåve brukaren faktisk møter:

1. Les `git status --short --branch`, aktiv grein og `git rev-parse HEAD`. Sjå gjennom lokale endringar før du gjer noko med arbeidskopien. Ikkje forkast, stash, skriv over eller byt grein frå ei arbeidskopi med uavklarte endringar. Finn ut om dei høyrer til oppgåva; bruk ei eiga rein arbeidskopi dersom dei ikkje gjer det.
2. Køyr `git fetch origin` før du stolar på lokale `origin/*`-referansar. For ei ny oppgåve skal grunnlaget vere siste `origin/main`; når du held fram med ei namngjeven grein eller PR, kontroller den aktuelle fjern-greina og bygg vidare på henne. Samanlikn commitane, ikkje berre greinnamna. Dersom `fetch` ikkje verkar, stadfest fjern-commit med `git ls-remote origin <grein>` eller GitHub. Ikkje start kodearbeid frå ei grein som kan vere utdatert; skaff ei oppdatert arbeidskopi fyrst.
3. Opne produksjonssida på `https://icy-water-0487ac303.2.azurestaticapps.net/`. Samanlikn versjonsnummeret og siste endring på framsida med lokal `CHANGELOG.md` og `json/endringslogg.json`. Opne òg den aktuelle appen og sjå kva som faktisk er publisert. Ei publisert side kan liggje føre eller etter `origin/main`, så ikkje bruk den eine som prov på den andre. Når oppgåva gjeld ein PR eller ei førehandsvising, kontroller den tilhøyrande preview-URL-en òg.
4. Dersom Git-grunnlaget eller den publiserte sida ikkje samsvarar med arbeidskopien, noter kva som er ulikt og vel rett grein/arbeidskopi før du endrar kode. Dersom produksjon ikkje kan opnast, sei frå om det og ikkje framstill den publiserte tilstanden som kontrollert.

### Samarbeid når fleire agentar arbeider samstundes

Før parallelt arbeid startar, skal koordinatoren dele opp oppgåva og peike ut ein ansvarleg for kvar fil som fleire deloppgåver kan kome til å endre:

- Kvar aktiv agent arbeider i si eiga arbeidskopi/worktree og på si eiga grein frå oppdatert `origin/main`. To agentar skal ikkje skrive i same arbeidskopi eller på same grein samstundes. Ved behov for å ta over ei grein skal det avtalast ei tydeleg overlevering, og den fyrste agenten skal slutte å skrive der.
- Gje kvar agent eit avgrensa fil- eller appområde. Ei fellesfil som fleire deloppgåver treng, har éin namngjeven eigar; dei andre sender endringsforslaget til eigaren i PR-teksten eller som patch, men redigerer ikkje fila sjølve.
- Integrer ferdige greiner éi om gongen mot fersk `origin/main`. Før samanslåing skal integrator sjå gjennom fillista og diffen, og kontrollere at ingen endringar frå ei anna grein eller arbeidsoppgåve vart tekne med ved eit uhell.
- Bruk reglane for felles utgjevingsfiler i §6.2 når fleire agentar lagar endringsnotat.

### 6.1 Commit-meldingar
Commit-meldingar skal skrivast på **nynorsk**. Eksempel:
- `Fiks emoji i footer på framsida`
- `Legg til responsiv Jeopardy-grid i Frødebrett`
- `Oppdater personvern-info for Heimsank`

### 6.2 CHANGELOG.md
Ein `CHANGELOG.md` på rot skal vedlikehaldast med eit fast format per versjon:

```
## [0.3] — 2026-MM-DD
### Lagt til
- ...
### Endra
- ...
### Fiksa
- ...
```

Oppdater CHANGELOG når du legg til nye spel/verktøy, gjer brytande endringar eller fiksar feil som påverkar brukaropplevinga.

**Endringssida skal følgje CHANGELOG.** `json/endringslogg.json` er kortversjonen som `endringar.html` viser, og notatet på framsida lenkjer dit. Legg du ein ny versjon i `CHANGELOG.md`, skal du i **same pull request** leggje same versjonen i `json/endringslogg.json` med éi kort linje per punkt (`t` = `nytt`, `endra` eller `fiksa`). Ein endringslogg som veks medan sida står stille, er ein endringslogg ingen brukar les.

Når fleire agentar arbeider parallelt, skal dei ikkje redigere dei same fellesfilene. Utgjevingsansvarleg eig `CHANGELOG.md`, `json/endringslogg.json` og versjonsnotatet (`aside.hero-postit`) i rotas `index.html`. Dei andre agentane legg eit forslag i PR-teksten i staden:

```text
### Endringsnotat (forslag)
- App/verktøy:
- Type: nytt / endra / fiksa
- Kort tekst på nynorsk:
- Bør hovudsida nemne dette: ja / nei
```

Utgjevingsansvarleg går gjennom ferdige PR-ar éin om gongen, oppdaterer dei tre filene i den aktuelle PR-en, og held versjonsnummer og tekst samsvarande før PR-en blir klar for samanslåing. Ingen andre agentar skal endre desse filene medan denne samordninga går føre seg. Når berre éin agent arbeider, kan agenten sjølv ta utgjevingsansvaret og gjere alt i same PR.

**Notatet på framsida skal ha med dei største endringane som er gjort siste tida (tillegg av spel, store endringar og liknande). Notatet på framsida skal også ha med nyaste frå CHANGELOG.** Gul-lappen i `index.html` (`aside.hero-postit`) har eit versjonsnummer, og det skal vere det same som øvste versjonen i `CHANGELOG.md`. Legg du til ein ny versjon i endringsloggen, skal du i same pull request setje versjonsnummeret i notatet til den nye versjonen. Merk henne med «Nyaste endring på Vyrdepil».

**Berre nye spel og verktøy som ER PUBLISERTE PÅ FRAMSIDA skal stå i notatet.** Notatet er utstillingsvindauget, ikkje arbeidsloggen. Ei aktivitet som ligg i repoet men ikkje i `json/apps.json`, eller som står som prøveutgåve inne i eit anna verktøy, høyrer ikkje heime der — den besøkjande kan ikkje gå og sjå på henne, og då er punktet berre støy. Detaljar om noko som er under arbeid høyrer heime i `CHANGELOG.md` og på endringssida.

Er det ingenting nytt å vise fram, står notatet med versjonsnummeret og lenkja åleine. Det er eit betre notat enn eitt som fortel om noko ingen får prøve.

Notatet er det einaste stadet ein besøkjande ser at sida lever. Står det same versjonsnummeret der i mange veker medan endringsloggen veks, tyder det ikkje lenger noko.

### 6.3 Nettlesartesting
Verifiser i **nettlesar** før merge til `main`. Sjekk:
- Sida lastar utan konsollfeil
- Hovudfunksjonalitet fungerer (start spel, lagre, navigere)
- Nytt design: svart tekst på lyse UI-flater. Utforminga skal vere ryddig, utan utilsikta overlapp eller feilplassering, og med naturleg leserekkjefølgje.
- Responsivt på mobilbreidde (devtools)

Sjekklista skal som hovurdregel køyrast lokalt. Ved behov skal ein òg køyre på **preview-URL-en** frå pull requesten (§6.4), ikkje berre på `localhost`. Det er berre der `staticwebapp.config.json` — rutar, tryggingsheadarar og CSP — faktisk er i spel.

### 6.4 Branch- og deploy-flyt
Vyrdepil blir brukt i klasserom i skuletida. Ein utesta endring på `main` går rett i produksjon og kan velte ei undervisningsøkt. Difor:

**Ingen commits direkte på `main`.** Branchen er verna på GitHub, så direkte push blir avvist. Alt går gjennom pull request.

Branch-namn: `feat/<app>-<kort-skildring>` eller `fix/<app>-<kort-skildring>`, til dømes `feat/ordaklok-nye-lydar`.

```
lokalt (serve.ps1)  →  branch + PR  →  Azure preview-URL  →  merge  →  produksjon
```

1. **Lokalt:** `git checkout main; git pull; git checkout -b feat/…`, og køyr `serve.ps1` på `http://localhost:8081` medan du jobbar. Køyr sjekklista i §6.3 der, og opne URL-en på telefon eller nettbrett.
2. **Opne PR:** `git push -u origin HEAD` og `gh pr create --fill`.
3. **Preview:** Azure byggjer PR-en. URL-en står i loggen til deploy-jobben («Visit your site at: …») og har formatet `https://icy-water-0487ac303-<PR-nummer>.westeurope.2.azurestaticapps.net/`. Køyr sjekklista i §6.3 der ved større endringar, og opne URL-en på telefon eller nettbrett for å kontrollere at nettsida fungerer responsivt utan at utforminga blir broten.

   **For AI-assistenten:** Når du har oppretta ein PR, skal du **alltid** oppgje preview-URL-en i svaret til brukaren, saman med lenkja til PR-en — utan at brukaren treng å spørje. Vent til deploy-jobben er ferdig og hent URL-en frå loggen:

   ```bash
   gh run list --branch <branch> --limit 1
   gh run view <run-id> --log | grep -o "https://[a-z0-9.-]*azurestaticapps.net[^ \"]*"
   ```

   Feilar eller manglar deployen (t.d. full kvote på preview-miljø, §6.4), sei det tydeleg framfor å utelate URL-en.
4. **Merge:** `gh pr merge --squash --delete-branch`. Produksjon (`https://icy-water-0487ac303.2.azurestaticapps.net/`) oppdaterer seg på eit par minutt, og `close_pull_request_job` slettar preview-miljøet.

**Ein merga PR tek ikkje imot fleire commitar.** Når PR-en er squash-merga, er branchen død. Pushar du meir dit, går det tilsynelatande bra — `git push` melder suksess — men commitane hamnar ingen stad og kjem aldri til produksjon. Dette skjer lett når nokon merger medan du framleis arbeider.

**For AI-assistenten:** Grein alltid ut frå ein fersk `origin/main` når du startar noko nytt, og `git fetch` først — `main` har ofte flytta seg medan du jobba. Skal du levere arbeid som ligg på ein branch der PR-en alt er merga, lag ein ny branch frå `origin/main` og plukk over berre dei commitane som manglar.

To fallgruver når du skal finne ut kva som faktisk manglar:

- **Squash-merge skjuler historikk.** Commitane frå branchen finst aldri i `main` med sine eigne SHA-ar, så `git log origin/main..branch` listar dei som «manglande» sjølv om innhaldet er merga for lenge sidan. Bruk `git diff --stat origin/main..HEAD` og sjekk filinnhaldet i staden — `git cat-file -e origin/main:<fil>` seier om fila er der.
- **Ein gammal branch reverserer andres arbeid.** Har det landa andre PR-ar på `main` etter at din branch vart laga, vil ein PR frå henne rulle dei tilbake. Sjå etter slettingar før du opnar PR-en:

  ```bash
  git diff --diff-filter=D --name-only origin/main..HEAD
  ```

**Stadfest at PR-en er open før du seier han er klar.** `gh pr create` skriv ut ein URL, men det er ikkje bevis for at han står open no. Sjekk:

```bash
gh pr list --state open
```

CHANGELOG-oppdateringa (§6.2) høyrer heime i **same PR** som endringa ho skildrar.

**Vit dette om preview-miljøa:**
- `localStorage` er per origin. Preview har eit anna domene enn produksjon, så du startar alltid med blanke ark. Det er bra for å teste førstegongsopplevinga, men det tyder at endringar i datastrukturen (`version`-feltet, §5.2) **ikkje** kan migreringstestast der — det må gjerast lokalt med kopiert `localStorage`.
- Preview-URL-ar er opne for den som har lenka. Uproblematisk her, men ikkje del dei som om dei var private.
- Gratisplanen tillèt tre samtidige preview-miljø. Blir kvota full, feilar deployen med «maximum number of staging environments» og PR-en får ingen URL.
- Eit ferskt preview-miljø gir sporadiske 404-ar dei første minutta før CDN-en er varm. Får du 404 på ei side du veit finst, last på nytt før du feilsøkjer.

**Ikkje rør OIDC-oppsettet i workflowen.** Begge jobbane hentar eit OIDC-token og sender det vidare som `github_id_token`, og kvar køyring melder «Unexpected input(s) 'github_id_token'» fordi inputen ikkje står i `action.yml`. Det ser ut som daud konfigurasjon, men er det ikkje: actionen køyrer i Docker, og runneren sender heile `INPUT_*`-settet inn som miljøvariablar uansett. Tokenet kjem fram og blir brukt — det er OIDC som autentiserer, ikkje repo-hemmelegheita. Fjernar du stega, feilar deployen med «No matching Static Web App was found or the api key was invalid».

**Rydde miljø for hand.** Skulle kvota likevel gå full, heiter ressursen `Kjellovetestside` i ressursgruppa `Tetsressurser` — `icy-water-0487ac303` er berre det autogenererte vertsnamnet. Med Azure CLI (`az login` først):

```bash
az staticwebapp environment list --name Kjellovetestside --resource-group Tetsressurser --output table
az staticwebapp environment delete --name Kjellovetestside --resource-group Tetsressurser --environment-name <PR-nummer> --yes
```

Miljøet `default` er produksjon og skal aldri slettast. Det same kan gjerast i Azure-portalen under **Environments**.
