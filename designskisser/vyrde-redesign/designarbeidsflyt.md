# Metode for eit samla Vyrdepil-design

Dato: 28. september 2026. Tilråding etter andre pass av appkartlegginga.

## Hovudtilråding

**Bygg vidare på det godkjende Duldord-uttrykket i ei fungerande komponentvising i nettlesaren. Bruk bildegenerering til dei illustrerte ressursane som manglar.** Retninga er allereie vald; neste steg er å gjere henne tydeleg, skalerbar og mogleg å gjenbruke på 28 appar.

Ei biletskisse kan vere nyttig for ei ny komposisjon eller for å samanlikne to visuelle retningar. Ho avgjer ikkje korleis ein knapp med lang tekst, eit ope trekkspel eller eit sidepanel skal oppføre seg. Dette må vurderast i dei verkelege komponentane, med ekte tekst og skjermstorleikar.

## Kva bør lagast med kva?

| Element | Tilrådd metode | Grunn |
| --- | --- | --- |
| Skog, årstid og lysvariantar | Bildegenerering med den godkjende scenen som referanse; lokale eksportar etterpå | Illustrert stemning og organiske former er godt eigna som rasterbilete. Kontroller at komposisjonen held seg mellom variantane. |
| Vyrde og andre illustrerte figurar | Behald den godkjende originalen; bildegenerering for nye uttrykk/positurar ved behov | Ein fast referanse gjer stil og identitet lettare å halde gjennom nye rundar. Kvar variant må sjekkast visuelt. |
| Høgdekoter, enkle skiltomriss og ornament | Ekte SVG etter den godkjende referansen når motivet kan teiknast presist | SVG kan skalerast utan rastertap. Strekbreidd og detaljmengd må likevel vurderast i faktisk visingsstorleik. [MDN om SVG](https://developer.mozilla.org/en-US/docs/Web/SVG). |
| Måla tretekstur og eksisterande stolpegrafikk | Gjenbruk godkjende bilete; før kontroll over original, utsnitt og eksport | Materialuttrykket skal ikkje skiftast ut kvar gong dimensjonane blir endra. Stolpeender og midtdel må passe saman. |
| Knappar, panel, felt, faner og dialogar | Semantisk HTML, felles CSS og små JavaScript-modular | Teksten er redigerbar, strukturen kan vekse med innhaldet, og tilstandane kan prøvast direkte. |
| Trekkspel | `<details>`/`<summary>` med felles CSS, i stor og kompakt variant | Nettlesaren har innebygd opning/lukking og tastaturbruk. [MDN om details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details). |
| Ikon | Det eksisterande Lucide-/`ICON`-systemet | Lik strek, konsistente storleikar og eksisterande tilgjengefunksjonar. |
| Arbeidsflater og spelbrett | Eksisterande SVG/canvas/DOM-motor med ny felles ramme rundt | Teiknehandtak, klokkevisarar, kode og spelstyring har funksjonskrav som må avgjere utforminga. |

For nye ornament er SVG ei tilråding for produksjon, ikkje eit krav om å byte ut dei godkjende bileta straks. Prøv éin SVG-versjon ved sida av referansen før vi avgjer om utføringa er like god. Automatisk vektorisering kan lage for mange punkt og endre uttrykket; ho er ikkje eit ferdig kvalitetsstempel.

### Slik unngår vi problema frå stolpe- og hjørnerundane

- Definer eitt ansvar for kvar del: grunnflate, ramme, hjørnedekor, stolpe og innhald.
- Gje dekor eit eige, klipt lag. Stolpeutstikk ligg utanfor dette laget; tekst og knappar ligg framfor.
- Ha éi godkjend kjelde for kvar grafikk og spor kva eksport som blir brukt. Ein ny bakgrunn må ikkje kome i tillegg til ein gammal utan at det er tilsikta.
- La innhaldet bestemme panelhøgda. Unngå at ein bakgrunnsgrafikk bestemmer tekstbreidda eller strekkjer motivet når boksen veks.
- Test hjørnemotiv i liten storleik før det blir laga mange variantar. Vel synleg strek og passe få koter; høg oppløysing åleine hindrar ikkje at tynne strekar forsvinn ved nedskalering.

## Arbeidsflyt for oss to

### 1. Samle eit lite referansesett

Bruk den godkjende Duldord-visinga, stein-Vyrde og dei valde ornamenta. Skriv ned dei faste vala: palett, tekstfarge, ramme, skugge, typografi, ikon og kor mykje dekor ulike flater får. Hald referansesettet lite nok til at det faktisk blir brukt i nye oppgåver.

Skill mellom identiteten og funksjonsfargane: lys trefarge, mørk grøn og raudkorall høyrer til UI; til dømes grøn/gul/grå bokstavstatus og brukarvalde teiknefargar må fungere uavhengig av dette.

### 2. Bygg ei levande katalogside

Start med panel, knappar, felt, trekkspel og dialog. Katalogen skal laste dei same CSS-/JS-filene som appane skal bruke, slik at ei retting berre blir gjort éin stad. Den gamle `style-demo.html` kopierer mange stilvariantar inn i si eiga side og er ikkje eit tilstrekkeleg produksjonsgrunnlag.

Vis korte og lange etikettar, fleire tekstlinjer, ikonknappar, valt/deaktivert, felt med feil, opne/lukka trekkspel, tomme/fylte lister og dialogar med langt innhald. Kontroller 320–437 px mobil, nettbrett og store skjermar.

Du vurderer uttrykk, lesbarheit og prioritering. Eg byggjer, prøver tilstandane og dokumenterer kva som er valt. Browser-annoteringar på den fungerande katalogen gjev konkrete endringar å arbeide med.

### 3. Lag illustrasjonane i små omgangar

Bruk godkjend bilete som referanse, og skriv ein kort ressursbrief: føremål, endeleg visingsstorleik, palett, stil, transparens og kva som skal vere fast. Behald original, prompt/referanse, valt resultat og produksjonseksport.

Lag éin type grafikk om gongen og prøv han i katalogen før vi lagar mange variantar. Gjer éi tydeleg endring per iterasjon. Originalar går i `_kjelder/`; appane lastar dei optimaliserte eksportane. Følg prosjektgrensene for format, storleik og filvekt.

### 4. Prøv mønstera i pilotane

Framsida/toppmenyen prøver navigasjon, kort og kategori-accordion. Duldord prøver spel og illustrerte skilt. Ordaklok prøver bibliotek, skjema og øving. Rissverk prøver tett editor-UI med stor arbeidsflate. Desse er dei avtalte pilotane.

Bruk dei verkelege felleskomponentane i pilotane. Når dei fungerer, får resten av appane dei same komponentane og dei variantane kartlegginga har vist behov for.

### 5. Ta vare på vala mellom oppgåver og modellar

Ha eit kort designreferat som seier kva som er godkjent, kor originalen ligg, kva som er under arbeid og kva komponentversjon appen brukar. Ei ny oppgåve skal lese referatet og dei faktiske komponentane.

Den noverande `AGENTS.md` krev framleis neobrutalisme. Når det nye komponentgrunnlaget er valt, må designreglane oppdaterast og det påkravde kontrollpasset gjennom appane gjennomførast. Elles får framtidige oppgåver motstridande retningar. Unngå fleire kopiar av same regel i ulike dokument.

## Skills og tillegg

| Verktøy / skill | Vurdering for denne arbeidsflyten |
| --- | --- |
| **Imagegen** — tilgjengeleg | Bruk for landskap, figurar og måla teksturar. Referansane og ressursbriefen er viktigare enn å leggje til fleire generelle designinstruksjonar. |
| **Nettlesarkontroll / computer-use** — tilgjengeleg | Bruk for å sjå komponentane i verkeleg storleik, skifte skjermbreidd og prøve fokus/klikk/innhald. Lokal katalog er hovudflata for gjennomgang. |
| **Skill creator** — tilgjengeleg | Etter at komponentgrunnlaget er valt, lag éin liten Vyrdepil-design-skill som peikar til referansar, katalog og rett komponent. Han bør handle om å bruke og kontrollere designet, og ikkje lagre ein kopi av alle farge- og CSS-verdiar. |
| **Figma** — funnen som tilgjengeleg tillegg, ikkje installert ved kartlegginga | Valfri hjelp dersom du vil redigere skisser, komposisjonar og vektorelement manuelt og ha ei visuell komponentflate. Eg ville lagt han til når det er eit konkret behov for dette. Den fungerande HTML-katalogen er framleis referansen for nettlesaråtferd. |
| **Generelle design-/nettstadbyggjarar** | Låg verdi akkurat no. Vi har eit eksisterande Vanilla-prosjekt og eit valt uttrykk; eit ekstra designsystem eller ein ny byggjeplattform aukar samordningsarbeidet. |

Ein skill kan samle instruksjonar, døme og ressursar for ein gjentakande arbeidsflyt. Han erstattar ikkje dei verkelege komponentane. [OpenAI om skills](https://developers.openai.com/plugins/concepts/skills). Tilrådinga om éin avgrensa skill og korte, målretta instruksjonar følgjer også [OpenAI si rettleiing om skills og prosjektinstruksjonar](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).

## Kva eg ville starta med no

1. Eit lite referansesett med dei allereie godkjende bileta og ein palett henta frå Duldord.
2. Ei lokal komponentkatalog med panel, knappar, felt, trekkspel og dialog, inkludert tett/romsleg variant.
3. Gjennomgang i nettlesaren før fleire grafikkvariantar blir produserte.
4. Ein avgrensa Vyrdepil-design-skill når referansesettet og katalogen er valde.

Dette kan gjennomførast med verktøya som allereie er tilgjengelege. Figma er eit mogleg tillegg, og er ikkje ein føresetnad for å få eit godt resultat.
