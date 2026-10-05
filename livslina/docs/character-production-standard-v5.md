# Livslina — produksjonsplan for karakterbyggjar v5

Dato: 5. oktober 2026. Status: produksjonsplan og målt ressurskontrakt for v5.

## Kvifor v4 ikkje passar

Delane vart klipte tett og skalerte kvar for seg. Eit hovud, ein frisyre og eit antrekk hadde dermed ikkje same anatomi eller faste koordinatar. Andletsarka inneheld hudflekker, antrekka inneheld hender, og grunnkroppen inneheld eit ekstra antrekk. Håret blandar delar framfor og bak kroppen. At alle rektangla fekk plass på lerretet, sa ingenting om samsvar mellom delane.

## Fast meisterfigur

Vi beheld den detaljerte pikselstilen: varme mørke konturar, tydelege fargeklynger, fleire skuggetonar, tekstur i stoff og hår og lett leselege uttrykk. Meisterfiguren står rett fram mot kameraet, utan perspektiv eller hovudrotasjon. Armane held same avslappa positur i alle variantar.

Den autoritative arbeidsflata er 256 × 384 logiske pikslar. Alle eksportar har 512 × 768 pikslar, med gjennomsiktig padding intakt. Generatorguiden er 1024 × 1536. Éin felles, proporsjonal oppløysingskonvertering er tillaten; eigen breidd-/høgdeskalering eller sentrering etter innhald er forbode.

| Feste | Logisk mål |
|---|---|
| Midtlinje | x = 128 |
| Hovud | x = 89–167, y = 42–132; øyre x = 77–179, y = 85–109 |
| Augesenter | (108, 94) og (148, 94) |
| Nase / munn | (128, 108) / (128, 123) |
| Hals | polygon (114,131), (142,131), (142,145), (138,147), (133,149), (122,149), (116,147), (114,145) |
| Skuldrer | (78, 163) og (178, 163) |
| Handledd | (63, 247) og (193, 247) |
| Hender | sentra (63, 258) og (193, 258) |
| Hofte / klesdeling | y = 246 |
| Sko | sentra x = 106 og 150 |
| Grunnlinje | y = 361 |

Måla ovanfor er kalibrerte mot den faktisk genererte meisterfiguren. Den fyrste poseguiden hadde grunnlinje 352 og eit litt større hovud; den godkjende teikninga vart målt før variantproduksjon. Modellen og dokumentasjonen brukar dei målte verdiane. Kvar seinare variant skal halde same pose og feste.

### Registrering før eksport

Ein koordinat i generatorinstruksen er ikkje eit løfte om at biletet følgjer koordinaten. Difor har produksjonen eit eige registreringssteg før eksport. Kjelderektangel og målte feste blir lagra i `registration-manifest.json`.

- Auga og bryna blir registrerte som éi samla gruppe. Ho får éi proporsjonal skalering som set avstanden mellom augesentra til 40 logiske pikslar, og vert plassert på dei to faste augesentra. Briller følgjer gruppa.
- Nasen er den same strukturelle komponenten i alle uttrykk. Munnen blir registrert til sitt faste feste; uttrykksforma blir bevart og held seg innanfor ei 12 pikslar høg sone. O-munnen har difor proporsjonal skala 0,55 i kjeldeoppløysinga, dei andre 0,75. Ingen hudflate blir teken med.
- Hår kan flyttast og skalerast proporsjonalt etter målte hovudfeste før eksport. Krølle- og bølgjeprøva er flytta opp 7 og 6 logiske pikslar for å setje hårtoppen ved y32. Rett lugg blir registrert frå to namngjevne kjeldefeste: hårkrone y184 og luggkant y518 skal bli y128 og y332 i 1024-ramma. Dette gjev éin proporsjonal skala 204/334. Fletter og hestehale blir registrerte etter hovudkrona, medan frie hårlengder beheld forma si. Det blir ikkje skalert etter ein automatisk avgrensingsboks.
- Klede skal allereie passe hals, handledd og føter. Ein variant som ikkje gjer det, må lagast om. Produksjonsrenderaren brukar meisterfiguren sin faktiske alfasilhuett til å fjerne hovud og hender frå kjeldekompositten, slik at kragar og hetter ved sida av halsen blir bevarte. I halssona skal berre dei faktiske hudpikslane fjernast; høge kragar og undertrøyer skal liggje framfor den felles halsen. Denne prøva brukar ein kontrollert varm hudmaske innanfor halsområdet, med visuell kontroll av kvart antrekk. Ein ny materialfarge som liknar hud krev ny maskekontroll.
- Svak generatorglød med alfa under 200 blir fjerna ved produksjon. Konturane og materiala blir ikkje målte om.

Alle korrigeringane blir bakte inn i den fullstendige 512 × 768 eksporten. Nettlesaren har ingen individuell tilpassing; kvart lag blir framleis teikna på (0,0). Dette skil kontrollert registrering ved produksjon frå den gamle automatiske tilpassinga ved kvart val.

## Ressurskontrakt

1. **Kropp og hud:** éi meisterform med blankt andlet og utan hår. Produksjonen brukar berre hovud, øyre, hals og hender frå denne ressursen. Fem hudpalettar fargelegg den same forma før eksport, slik at hovud og hender alltid følgjer kvarandre. Pikselteksturen blir bevart med fargeinterpolasjon; det er ikkje fem uavhengig genererte kroppar.
2. **Andlet:** fem uttrykk med berre auge, bryn, nasestrekar og munn. Ingen hudfarga oval, kinnflate, øyre, hals eller hår. Auge og munn følgjer faste feste. Briller kan vere ein del av uttrykket, men kan ikkje flytte auga.
3. **Klede:** fem komplette antrekk frå krage til sko. Ingen hovud, hår eller hender. Alle antrekka har lange ermer i denne prøva, slik at det er éin felles handleddskøyt. Mansjettar overlappar handleddet med 2–3 pikslar; hudhendene blir viste frå kroppsressursen.
4. **Hår:** fem frisyrar med berre hår på gjennomsiktig bakgrunn. Felles hovudfeste, fri ytre silhuett. Bakre lengder blir viste bak kropp og klede; lugg og fremre lengder blir viste øvst. Vernesona for auge, nase og munn blir ikkje dekka av tilfeldig bakgrunn eller hud frå hårlaget. Fram-/baklag blir definerte eksplisitt i modellen.

Lagrekkjefølgje: bakre hår → kropp → klede → hender → andlet → fremre hår. Alle lag blir teikna på (0, 0) i same fullstendige ramme. Ingen tilpassing etter variantens avgrensingsboks.

Den ferdige ressursbanken har 30 PNG-lag: fem hovud/hals, fem handlag, fem antrekk, fem andlet, fem bakre og fem fremre hårlag. Hudfarging, alfarydding og masker er bakte inn. Nettlesaren les ikkje att pikseldata og gjer inga tilpassing. Det gjer prøva brukande frå lokale filer òg. Kontrollrenderaren og eksportsteget skal gje same ferdige pikslar som den enkle nettlesarrenderaren.

## Produksjon i steg

1. Lag ein nøyaktig, enkel poseguide. Guiden styrer berre geometri, ikkje visuell stil.
2. Generer meisterfiguren med poseguiden som geometri og v4-arket som stilreferanse. Kontroller hovud, hals, hender og føter mot måla. Forkast ein pose som ikkje passar.
3. Bruk den godkjende meisterfiguren og poseguiden i kvart biletkall. Generer éin ressurs per kall, ikkje eit tett atlas med automatisk utsnitt.
4. Lag fyrst to andlet, to frisyrar og to antrekk. Kople dei inn og sjå på alle 8 kombinasjonane med lys og mørk hud. Kontroller køytar og overlapping før meir produksjon.
5. Utvid kvar familie til fem. Originalane blir haldne utanfor Git; komprimerte eksportar går i `assets/prototype/characters/v5/`. Ein ressurs skal vere under 500 kB.
6. Registrer fil, familie, variant, fullrammemål, guideversjon og kontrollstatus i manifestet. Lagre dei faktiske generatorinstruksane i dokumentasjonen.

## Kontroll som må passere

- Når eit val blir bytt, står auge, hals, handledd og føter stille.
- Halsen har ingen hol eller doble kragar; ermene møter hendene utan ekstra hender eller hud i feil farge.
- Alle fem hudtonane verkar på både hovud og hender. Ansiktslaget inneheld ikkje ein lys hudflekk som overstyrer valet.
- Hår har rett fram-/bakrekkjefølgje. Auge blir ikkje teikna oppå lugg, og hårlaget inneheld ikkje eit ekstra hovud eller kroppsdelar.
- Ingen avklipte hårtoppar, laus grafikk, fargehalo eller bakgrunnsruter i PNG-ane.
- Kontroller alle 25 andlet/hår-par, 25 klede/hud-par og 25 hår/klede-par som kontaktark; gå òg gjennom dei 625 ferdige kombinasjonane. Matematisk rammetest blir rapportert separat frå visuell kontroll.
- Test faktisk side i nettlesaren: val, tilfeldig figur, tilbakestilling, lagkontroll, tastatur og breidder 320, 437 og stor skjerm.

## Nettlesarprøva

Dei fire veljarane held fem alternativ kvar, og tilfeldig-knappen held fram. Eit eige trekkspel, «Kontroller laga», lèt oss vise kropp, klede, andlet, hår bak og hår fram kvar for seg. «Vis festepunkt» legg dei autoritative måla over den faktiske figuren. Dette gjer feil synlege før vi byggjer eit større bibliotek.

Prøva lagrar ingen brukarval, har ingen nye avhengnader og endrar ikkje speleøkonomien. Ressursar og kode skal fungere lokalt utan tenartenester. PR-førehandsvisinga blir oppdatert fyrst når den nye samansetjinga er visuelt kontrollert.

## Utført ressurskontroll

- Alle 625 samansetjingar vart renderte og gjennomgått visuelt i 25 lesbare kontaktark.
- Dei 30 ferdige laga vart samanlikna med produksjonsrenderaren. Alle 625 ferdige bilete og fem lag-/festevisingar hadde identiske pikslar.
- Banken er 1 126 217 byte før HTTP-komprimering. Største ressurs er 113 065 byte, godt under grensa på 500 kB.
- Nettlesarkontrollen av mobilbreidder, val, tilfeldig figur, forstørring og lagvising blir dokumentert i PR-en.
