# Ordbås – ordtunet til Vyrde

Plan og fyrste ordutval · 22. oktober 2026

**Ordbås skal vere eit kort, leikande sorteringsspel der eleven hjelper Vyrde å få ord på rett plass.** Det byrjar med substantiv, verb og adjektiv. Adverb kjem med som eit eige steg, med tydeleg setningskontekst. Ei vanleg økt tek 3–6 minutt.

Den opphavlege planleveransen inneheld 1000 oppføringar i kvar av dei fire ordklassane, fordelte på fire førebelse nivå, og 40 skrivne dømeoppgåver. Ordreserven er ikkje 4000 ferdige speloppgåver: nye setningar, forklaringar og vurdering av tyding må skrivast før fleire oppføringar blir tekne inn i spelet.

**Implementeringsstatus:** Fyrste spelutgåve ligg no i `ordbas/`, med 120 setningsoppgåver, 30 per ordklasse, alle tre spelmåtane, lokal framgang og felles bragder. Ordforklaringane er tilpassa frå uttrykkeleg valde ordboktydingar. Sjå `ordbas/README.md` for innhaldsbygging og kontroll. Planen under skildrar òg vidare arbeid: meir innhald og eigne val av grunngjeving. Alle fire ordstega er opne frå start. Hjelp Vyrde er no ei ordjakt der eleven finn ordet i ei setning ut frå Vyrde si forklaring, utan sorteringsbåsar. Ordskiftet lèt eleven flytte begge heile setningskorta oppi kvar sin bås i valfri rekkjefølgje. Trebåsar, steinsti, rundepoeng og Vyrde-uttrykk gjer framgangen synleg. Publisering skjer fyrst etter PR og kontroll av førehandsvisinga.

## 1. Det eleven møter

Vyrde har fått ansvar for eit lite ordtun. Ordkorta ligg hulter til bulter, og båsskilta viser kva som høyrer heime kvar. Eleven sorterer ei lita levering om gongen. Etter kvart blir tunet ryddigare, nye skilt kjem på plass, og Vyrde kan gå vidare på stigen.

**Ei konkret runde:**

1. Vyrde kjem fram med ei korg: «Desse orda treng kvar sin bås!»
2. Eitt stort ordkort kjem fram. I byrjinga står til dømes «Vyrde finn ein **stein**.» Tre store båsar heiter «Substantiv», «Verb» og «Adjektiv».
3. Eleven dreg kortet, trykkjer på ein bås eller bruker tastaturet. Det er same oppgåve og poengregel uansett innmåte.
4. Ved rett svar flyttar Vyrde kortet på plass. Ei kort forklaring kjem fram: «Stein er eit substantiv. Ordet er namn på noko.»
5. Ved feil svar held kortet seg tilgjengeleg. Vyrde gjev eitt konkret hint: «Kva er det Vyrde finn?» Eleven får prøve att.
6. Etter 8 kort er leveringa ferdig. Vyrde viser kva eleven fekk til, og høgst to ord som treng ei ny øving.
7. Eleven vel «Ei runde til», «Øv på desse» eller «Til tunet».

Det skal kjennast som ein liten jobb ein får til, med tydeleg byrjing og slutt. Ingen liv går tapt ved feil. Ingen nedteljing i vanleg øving.

## 2. Vyrde som deltakar

Vyrde gjer noko i sjølve spelet, med den eksisterande stein-Vyrde som figur:

- **Leverer ord:** kjem fram til ordkortet og ventar på at eleven bestemmer seg.
- **Hjelper med eit spørsmål:** «Seier ordet noko om hunden eller om korleis han går?» Hintet peikar mot undersøking, ikkje berre svaret.
- **Leitar med eleven:** i «Hjelp Vyrde» skildrar figuren eit ord. Eleven finn ordet i setninga og fyller ordboka hans.
- **Viser utvikling:** ryddar, snur seg mot rett bås og feirar ei avslutta levering med eit lite nikk eller hopp.

Bruk korte reaksjonar med variasjon. Eitt hint om gongen. Vyrde skal ikkje dekkje kort eller svarfelt. På mobil står figuren ved statusfeltet; på brei skjerm kan han stå ved sida av arbeidsflata. Redusert rørsle skal gje rolege tilstandsskifte. Alle opplysningar må òg stå som tekst.

Etter brukarens visuelle gjennomgang er det generert eit nytt Vyrde-ark og spelillustrasjonar i same familie. Ressursar og endeleg promptgrunnlag står i `ordbas/assets/README.md`.

## 3. Tre spelmåtar som deler same faglege kjerne

| Spelmåte | Det eleven gjer | Kva som gjer henne fengjande |
|---|---|---|
| **Båsrunden** | Sorterer 8 kort, eitt om gongen. | Korte leveringar, Vyrde i arbeid og synleg framgang. Dette er hovudmåten. |
| **Hjelp Vyrde** | Les ei forklaring og vel rett ord i ei setning utan framheving. | Eleven fyller ordboka til Vyrde. Eit eige ordjaktspel utan båsar, ope frå start. |
| **Ordskiftet** | Flyttar to heile setningskort til kvar sin bås; vel sjølv rekkjefølgja. | Ei lita oppdaging: ordet ser likt ut, men bruken skiftar. Opent frå start, med adjektiv og adverb. |

Ein valfri fartsrunde kan kome etter at grunnspelet fungerer, med eigne resultat. Fart skal ikkje avgjere om eleven meistrar ei ordklasse, og fartsrunden skal aldri slåast på automatisk.

Klassevis spel er fyrst ein lærarstyrt storskjermmodus med same oppgåver, stor skrift og pausar for munnleg forklaring. Unngå offentlege elevlister og resultatlister i fyrste utgåve.

## 4. Læringsveg

| Steg | Ord og grammatikk | Oppsett |
|---|---|---|
| **1. Fyrste båsane** | Kjende substantiv og verb. Seinare enkle adjektiv. | To båsar i introduksjonen, deretter tre. Korte setningar og synlege hjelpeskilt. |
| **2. Meir i korga** | Fleire kvardagsord og bøygde former: «hundane», «sprang», «grøne». | Tre båsar. Eleven må sjå på meir enn endinga. |
| **3. Den fjerde båsen** | Vanlege adverb for tid, stad, grad og måte. | Fire båsar. Alltid ei setning rundt målorda. Kontrastpar med adjektiv. |
| **4. Ordmeisteren** | Abstrakte ord, fagord og ordformer som kan brukast på fleire måtar. | Fire båsar, fleire bøygde former og val av grunngjeving. |

Dette er ein veg inn i spelet, ikkje ei låst klassetrinnsinndeling. Læraren kan velje nivå og ordklassar direkte. Eleven kan gå attende til øving når som helst.

**Ordvanske og oppgåvevanske er to ulike ting.** Ordbanken har førebels ordnivå 1–4. Ei oppgåve får dessutan eigne felt for grammatisk utfordring, bøying, setningslengd og behov for støtte. Eit kjent ord kan difor brukast i ei krevjande oppgåve utan å bli eit «vanskeleg ord».

## 5. Faglege reglar som må halde

Fasiten skal gjelde **det markerte ordet slik det er brukt i den aktuelle setninga**. Eit oppslagsord kan ikkje utan vidare få éin bås for alle tydingar og bøyingsformer.

| Kontrast | Fasitskilnad | Forklaring til eleven |
|---|---|---|
| «Ein **roleg** hund.» / «Hunden går **roleg**.» | Adjektiv / adverb | Det fyrste skildrar hunden. Det andre seier korleis han går. |
| «Eit **høgt** tre.» / «Vyrde ropar **høgt**.» | Adjektiv / adverb | Same form; ulik bruk. |
| «Vyrde **veit** svaret.» | Verb | Verb kan òg seie noko om ein tilstand eller kva nokon veit. Dei er ikkje berre rørsleord. |
| «**Glede** fyller tunet.» | Substantiv | Substantiv kan vere namn på noko vi tenkjer eller kjenner. Dei er ikkje berre ting vi kan ta på. |

Vi følgjer den skulegrammatiske forklaringa frå [Nynorsksenteret](https://nynorsksenteret.no/nynorsk-grammatikk/adjektiv-pa-nynorsk): eit adjektiv kan nyttast som adverb i ei setning. Kjeldeordklassen blir bevart i dataa, slik at oppslagsinformasjon og den valde bruken i oppgåva er tydeleg skilde.

Orda skal ikkje sorterast med reglar som «alle ord på -leg er adjektiv», «alt du kan gjere er verb» eller «set ein framfor, så er det substantiv». Desse kan gje hint i utvalde tilfelle, men kan ikkje vere sjølve fasiten. Heller ikkje ei inkjekjønnsform av eit adjektiv kan automatisk bli ei adverboppgåve: bruken må vere naturleg og eintydig i setninga.

`contextRequired` tek omsyn til andre ordklassar som er registrerte for den same ordforma, også som bøyingsform. Feltet er eit varsel om behov for kontekst, ikkje ein komplett grammatisk analyse. I fyrste spelutgåve er det enklast å bruke setningar på alle kort.

## 6. Ordreserven

Sjå [ordlistene med nivådeling](ORDLISTER.md) og dei fire JSON-filene i [data](data/).

| Ordklasse | Nivå 1 | Nivå 2 | Nivå 3 | Nivå 4 | Til saman |
|---|---:|---:|---:|---:|---:|
| Substantiv | 147 | 500 | 250 | 103 | **1000** |
| Verb | 132 | 246 | 482 | 140 | **1000** |
| Adjektiv | 111 | 142 | 433 | 314 | **1000** |
| Adverb | 52 | 159 | 316 | 473 | **1000** |
| **Alle oppføringar** | **442** | **1047** | **1481** | **1030** | **4000** |

Substantivutvalet legg vekt på kvardag, natur, skule, leik, fag og abstrakte omgrep. Verb og adjektiv er valde frå eit større redaksjonelt utval, med frekvens som støtte. Ord som ikkje vart funne med rett ordklasse og godkjend skrivemåte i den henta ordboka, er utelatne. Same ordbokartikkel blir ikkje talt fleire gonger innan ei ordklasse for å fylle opp med alternative skrivemåtar.

**Adverb:** 500 oppføringar har adverb som ordklasse i Nynorskordboka. Dei andre 500 er ordformer av adjektiv som er føreslåtte for adverbiell bruk. Dei er merkte `adverbial-adjective`, med opphavleg lemma og kjeldeordklasse. Bøyingsforma er kontrollert mot ordboka, men den konkrete adverbielle bruken må vurderast når setninga blir skriven. Dette er ikkje ei påstand om 1000 ulike sjølvstendige adverboppslag. Nokre ordformer finst òg i adjektivbanken; dei tel som kvar sin bruk i dei to ordklassane.

For å få eit så breitt adverbutval inneheld nivå 4 òg sjeldne ord, måteskildringar og musikktermar. Dei skal vere ein reserve som læraren kan velje frå, og skal ikkje automatisk blandast inn i det vanlege elevløpet. Eit mindre, grundig gjennomarbeidd oppgåveutval vil vere meir nyttig ved fyrste publisering enn å vise heile banken.

**Nivåa er førebelse.** Kvardagsord og utvalde fagomgrep er vurderte redaksjonelt. For resten er avisfrekvens, ordlengd og ordtype støttesignal. Frekvenslista er frå vaksent avisspråk og skil ikkje sikkert mellom tydingar og ordklassar. Nivåa må justerast etter setningsarbeid og utprøving med elevar. Dei er ikkje standardiserte lesenivå eller dokumenterte meistringsgrenser.

## 7. Framgang, motivasjon og hjelp

- Leveringar er små: 8 kort i vanleg øving. Dei fyrste rundane kan ha 5.
- Rett på fyrste forsøk og rett etter hint blir viste kvar for seg. Begge fullfører leveringa.
- Etter feil kjem ei kort forklaring. Ordet blir teke opp att etter minst tre andre kort, og i ei seinare runde med ny setning.
- Ei klasse blir føreslått for meir øving ut frå fleire forsøk i ulike setningar, ikkje ut frå eitt feiltrykk.
- Eit førebels forslag til neste steg er 8 av dei siste 10 rette utan hint, fordelte på minst 5 ulike ord. Det er ein navigasjonshjelpar som må prøvast ut, ikkje ei karaktergrense. Læraren kan overstyre.
- Bonusar premierer arbeid og forståing: «Fyrste levering», «Alle tre båsane», «Adverb på plass», «Hjelpte Vyrde» og «Same ord, ny bruk». Bruk felles Bragd-system og stabile ID-ar ved implementering.

Unngå tilfeldig premieøkonomi, kjøp og lange innloggingsrekkjer. Tunet og Vyrde kan vise at arbeidet går framover med dei eksisterande ressursane.

## 8. Skjerm, kontrollar og lærarval

Startskjermen har «Spel», «Øv på ei ordklasse» og «Lærarval». Viktige val er synlege. Lærarval omfattar ordklassar, ordnivå, 5/8/12 kort, setningsstøtte og val av ord frå banken. Ingen PIN-kode eller løynd lærarmeny er naudsynt.

Under spel ligg setninga og ordkortet øvst. Båsane står under, med ordklassenamn og ei kort forklaring. På mobil får to båsar kvar si rad eller eit 2×2-oppsett når fire er i bruk. Lange ord skal brytast innanfor kortet utan å krympe skrift til uleseleg storleik.

Ein kan dra kortet, velje kortet og trykkje på bås, eller bruke 1–4 og Enter. Vanleg Tab-navigasjon skal òg fungere. Båsane er ekte knappar. Dragging er eit tillegg, aldri eit krav. Fokus blir halde på ei føreseieleg plassering etter svar. Skjermlesaren får ei kort statusmelding; han skal ikkje lese heile spelbrettet på nytt.

Bruk middels `vp-shell`, felles lyse flater, svart tekst, Lucide-ikon og stein-Vyrde. Båsane kan få ulik lys farge frå paletten, men namn, ikon og forklaring må bere skilnaden. Den vanlege heroen blir kompakt når spelet startar. Støtte kjem i trekkspel på mobil. Canvas er ikkje naudsynt for dette spelet.

## 9. Avgrensa fyrste byggjesteg

1. **Fagleg prøvesett:** skriv 120 naturlege oppgåver, 30 per ordklasse, med fasit og korte forklaringar. Dei 40 døma i denne leveransen er eit utgangspunkt. Kontroller alle tydingar, ordformer og forklaringar, og få fagleg gjennomlesing før publisering.
2. **Spelbar kjerne:** lag Båsrunden med klikk/tastatur/dragging, Vyrde-reaksjonar, hint og ei avslutta levering. Ta med alle fire ordklassane, med den føreslåtte vegen inn gjennom tre.
3. **Utprøving:** prøv med elevar på ulike nivå. Undersøk forståing av båsskilta, leseinnsats, motoriske krav, feilforklaringar og om det er freistande å ta ei runde til. Juster ordnivåa ut frå dette.
4. **Variasjon og framgang:** legg til Hjelp Vyrde, Ordskiftet, felles bragder og lokal framgang. Lærarval held alle nivå tilgjengelege.
5. **Utvid innhaldet:** bygg opp fleire setningsoppgåver frå ordreserven. Ei oppføring blir fyrst aktiv i spelet når ho har ei kontrollert setning og forklaring. Ei stor ordbank skal ikkje omgå dette kravet.

## 10. Gjennomføring i Vyrdepil

Følg gjeldande `AGENTS.md`, `DESIGN.md` og designkatalogen. App-ID og mappe blir `ordbas`. Vanilla HTML/CSS/JS; modulane blir IIFE-ar etter ansvar: `state`, `content`, `round`, `input`, `render`, `storage` og `main`. Bruk dei felles hjelpe-, ikon-, lagrings- og Bragd-modulane. All dynamisk tekst skal setjast med `textContent`.

Ord og oppgåver blir pakka som lokale filer. Ingen ordbok-API eller KI-kall når eleven spelar. Ordbokdata er ei innhaldskjelde under utviklinga, ikkje ein ny ekstern køyreavhengnad. Alle eksportar får `app` og `version`. Eventuelle delingsoppsett blir lagde etter `#` i lenkja.

Lagring skal gå gjennom `VyrdepilStorage`. Føreslått minimum er innstillingar, fullførte steg, avgrensa teljingar per ordklasse/nivå og høgst 30 oppgåve-ID-ar for repetisjon. Ikkje lagre elevnamn, fritekstsvar, datoar eller ein uavgrensa detaljhistorikk. Det skal vere lett å starte på nytt. Felles Bragd-blokk får berre tillatne ID-ar og framgang. Når lagringa blir implementert, oppdater personverninformasjonen på framsida og personvernsida i same endring.

Ved oppretting av den faktiske appen: registrer `ordbas` i eksisterande `json/apps.json`, tildel ein ledig bakgrunn med `manage-backgrounds.cjs`, og køyr kontrollen. Den opphavlege planleveransen registrerte inga app eller bakgrunn. Fyrste spelutgåve registrerer appen og tildeler ein eigen ledig bakgrunn. Nye bilete eller andre avhengnader krev eige grunnlag etter prosjektreglane.

Før publisering: test lokalt og i Azure-førehandsvisinga, konsoll, nettverk, hovudflyt, lagring, ny økt, import/eksport dersom det blir teke med, tastatur, skjermlesarstatus, redusert rørsle og breidder 320, 437, 768, 1024 og 1440 px. Ingen vassrett sideflyt, overlapp eller krympa ordkort. Kontroller at spelet fungerer utan eksterne datakall etter at filene er lasta. Reell fyrstegongsbruk utan nett krev at dei lokale filene er tilgjengelege; «lokal logikk» er ikkje i seg sjølv ein garanti for nettlesarcache.

Implementering skal leverast på ny grein frå oppdatert `origin/main`, gjennom PR og førehandsvising. Då skal òg endringslogg, kortversjon og versjonsnotat oppdaterast samla. Ingen direkte commit til `main`.

## 11. Kjelder og kontrollgrunnlag

- [Den delte idédugnaden](https://chatgpt.com/share/6ada563f-cee0-83ed-a119-4e2556e5f8ea) var tilgjengeleg og er lesen. Den synlege samtalen handlar særleg om ordtydingar, definisjonsoppgåver og jokarar. Ordbås-planen er ei vidare utforming frå bestillinga i denne samtalen. Poenget om eintydige oppgåver er teke med.
- [Nynorskordboka: opne data](https://ord.uib.no/ord_1_Ordlister.html), henta 22. oktober 2026. Lemma, ordklasse, artikkel-ID og bøyingsformer er brukte til kontroll og utval. Ordreserven inneheld ikkje definisjonar eller dømesetningar. Den seinare spelutgåva inneheld tilpassa ordforklaringar med kjeldetyding per oppgåve.
- [Nynorsksenteret: adjektiv og adverb](https://nynorsksenteret.no/nynorsk-grammatikk/adjektiv-pa-nynorsk), grunnlag for den skulegrammatiske skilnaden i bruk.
- [CLARINO/Språkbanken: frekvensordliste for nynorsk avisspråk](https://www.nb.no/sprakbanken/ressurskatalog/oai-repo-clarino-uib-no-11509-158/), generert 25. august 2025. Brukt som støttesignal, med avgrensingane oppgjevne ovanfor.
- [Kreditering og lisens](KJELDER.md) ligg ved. Ordbokdataa har sin eigen CC-BY 4.0-lisens og skal ikkje få meir avgrensande vilkår gjennom Vyrdepil sin generelle lisens.

Arbeidsgrunnlaget for denne planleveransen er `origin/main` på `6398a1a41e6bce51b5dd2795754d9f5be7486199`, etter henting frå origin. Produksjonsframsida vart opna i nettlesar og viste 2.3.1 og siste Ljodstigen-endring, i samsvar med denne arbeidskopien. Den opphavlege arbeidsmappa stod på ei eldre grein med omfattande lokale endringar og endringslogg 1.61. Ho vart ikkje endra som del av planarbeidet. Dette var kontrollen ved planleveransen; sjå PR-en for den seinare spelutgåva for spel- og førehandsvisingskontroll.
