# Frødebrett

Følg òg [retningslinjene for Vyrdepil](../AGENTS.md).

## Standardprompt for førehandslaga frøder

Dette er standardprompt for å lage forhåndsgenererte frøder (spørsmålssett) til Frødebrett.

- Skriv den norske teksten på moderne nynorsk. Vel ord som er tillatne både på nynorsk og på bokmål framfor synonym som berre er tillatne på nynorsk.

- Det skal lages 5 kategorier til hver frøde. Kategoriene skal være forskjellige, men passe til hovedtemaet for den forhåndsgenererte frøden. Spørsmålene i hver kategori skal ha økende vanskelighetsgrad, der 100 poeng skal være noe ca 95% av alle i aldersgruppen skal kunne svare på, mens 1000 skal være ganske vanskelig. Finalen skal være middels vanskelighet.

- Still eitt spørsmål om gongen. Bruk enkle ord og eitt eintydig svar på høgst to ord. Utelat perifere namn og tal, faguttrykk og eigennamn som er vanskelege å hugse når ein enklare del av same sak eignar seg. Unngå spørsmål der svaret sier seg sjølv. T.d. «Kva ledd brukar du når du bøyer kneet? Kneleddet.» Dersom frødebrettet har tema fag eller klassetrinn, så skal du ta utgangspunkt i Læreplanen for det faget. Spørsmålene skal være faglig relevant, men ikkje gå i fella med for «korrekte» svar som kun går direkte mot læreplanen. T.d. så står dette i læreplanen for naturfag 7. trinn: «utforske elektriske og magnetiske krefter gjennom forsøk og samtale om hvordan vi utnytter elektrisk energi i dagliglivet.» Da kan man ha spørsmål om hvor mange elbiler som finnes i Norge, eller når lyspæren ble oppfunnet, eller hva som bruker mest strøm av en mikrobølgeovn og en gamingPC. Prøv å ikke bare tenke teoretisk, men lag litt praktiske og virkelighetsnære spørsmål. Spørsmålene må ikke være direkte relatert til et læreplanmål, men kan være perifert knyttet til temaet. Prioriter spørsmål som er ekstra relevante for aldersgruppen.

- Bruk kvart spørsmål og/eller svar berre éin gong pr frøde. Samanlikn alle 30 rutene og finalen på tvers når alle er laga for å sjekke. To spørsmål er gjentakingar dersom dei ber om same opplysning om same hending, sjølv om ordlyden eller vinkelen er ulik. Byt ut gjentakingar før du leverer. Dersom du bruker ei hending to gonger, skal spørsmåla handle om to tydeleg ulike opplysningar. Vel eit anna spørsmål dersom den rette fasiten treng meir enn to ord.

- Skriv tre truverdige, gale `distractors` til kvart spørsmål, òg finalen og legg det inn under «Hint». Bruk same type svar, omfang og språk som fasiten. Når fasiten er ein norsk by, skal alternativa vere andre relevante norske byar. Når fasiten er eit tal, skal alternativa vere rimelege tal med same eining. Vel tre ulike svar som kan forvekslast med fasiten, men som ikkje kan vere riktig svar. Merk de med a) b) c) og d) Hald alternativa korte, utan forklaring, tullesvar, «alle» eller «ingen». Legg de inn i tilfeldig rekkefølge.

- Hald spørsmål, fasitar og bilete fri for drap, tal på drepne eller skadde, skildringar av vald og detaljar om korleis åtak vart gjennomførte. Utelat saker om mishandling, overgrep, sjølvmord, rus, pengespel, rasisme og anna vaksent eller skremmande innhald. Dette er spesielt viktig i frøder merket for 1. til 4. trinn, men elever på alle trinn har tilgang til frødene, så vi kan ikkje ha innhald i frødene som er upassende for de.

- Det skal vere bildeillustrasjon til minst halvparten av spørsmåla pr frøde. Bruk bilete frå wikipedia og wikidata. Skildre motivet på nynorsk og skriv 2–4 presise søkjeord på engelsk eller med eit kjent eigennamn, til dømes «Beitostølen skiing». Vel eit anna motiv enn fasiten. Bruk tom streng dersom eit felt ikkje er relevant.

- Kontroller kvart bilde mot spørsmålet og fasiten, medrekna finalen og reservevala. Motivet skal vise ein konkret stad, gjenstand, situasjon eller prosess som sjølve spørsmålet handlar om. Eleven skal ikkje kunne lese eller kjenne igjen fasiten frå motivet, synleg tekst, eit kart, eit flagg, ei resultattavle eller bildeskildringa. Byt motiv eller lat spørsmålet stå utan bilde når motivet har laus samanheng med spørsmålet eller røper fasiten.

- Vel eit miniatyrbilete til kvar frøde som viser hovudtemaet på kortet på framsida til Frødebrett. Motivet skal vere tydeleg i lite format og tole eit liggjande utsnitt på 3:2. Hald motivet fritt for fasitar, og bruk eit komprimert, lokalt bilete med kjelde og lisens.

## Filformat og kontroll

- Legg fagfrødene i `json/standard/<trinn>.json` med det eksisterande fag-ID-et. Skriv seks ruter i kvar kategori i rekkjefølgja 100, 200, 300, 400, 500 og 1000. Legg finalen i `final`.
- I ei fagfrøde er ei rute lagra som `[spørsmål, fasit, detaljar]`. Bruk `options` i detaljane og direkte i finalen. Lista inneheld fire alternativ med fasiten éin gong. Frødebrett set bokstavane framfor alternativa ved vising.
- Bruk minst 16 bilete blant dei 31 spørsmåla. Lagre dei i `json/standard-media/` med 24 små heksadesimale teikn i filnamnet. Før opp `image`, `imageAlt`, `imageKeywords` og `imageCredit` på illustrerte spørsmål. Biletkreditten viser originalfila på Wikimedia Commons, opphavspersonen og lisensen. Bruk verk med ein lisens som tillet gjenbruk, og merk eventuell tilskjering.
- Gje fagfrøda ein `thumbnail`-nøkkel og registrer miniatyren med `image`, `imageAlt` og `imageCredit` under `boards` i `json/thumbnails.json`. Temafrøder brukar filnamnet som nøkkel under `themes`. Komprimer miniatyren for bibliotekvising.
- Køyr `node --test frodebrett/tests/standard-quizzes.test.cjs` og prøv frøda i nettlesaren. Sjekk filter, start, «Vis hint», bilete og finale.

## Saker i vekas nyheitsfrøde

- Bruk minst to, helst tre, brettspørsmål om spelnyheiter frå den aktuelle veka. Aktuelle saker kan vere lanseringar og større oppdateringar i populære mobilspel og dataspel. Vel ulike hendingar for spelspørsmåla.
- Bruk eitt spørsmål per nyheitssak som hovudregel på heile brettet, medrekna finalen. Ulike artiklar om den same hendinga tel som éi sak. Bruk to spørsmål om ei sak berre når kjeldegrunnlaget manglar ei god, ubrukt sak. Dei to spørsmåla skal då gjelde ulike opplysningar.

## Foto i vekas nyheitsfrøde

- Vel først eit foto frå artikkelen som støttar fasiten. Bruk gjerne eit foto frå ei anna truverdig kjelde som viser den same saka. Sikt mot at fleirtalet av bilda kjem frå nyheitskjeldene.
- Bruk Wikimedia Commons som reserve når du ikkje finn eit eigna kjeldefoto. Vel eit motiv med klar samanheng med sjølve spørsmålet. Minst 15 brettspørsmål skal ha bilde.
- Kontroller motiv, synleg tekst, logoar, kart, flagg, resultattavler og alternativtekst mot fasiten. Gjer den same kontrollen for finalen. Vel bort foto med identifiserbare barn, valdelege motiv eller motiv som røper fasiten.
- Før opp fotograf eller kreditert opphav, utgivar og lenkje til sida som publiserte fotoet. Merk arkivfoto som arkivfoto. Redaktøren vurderer fotoa før publisering. [Redaksjonsinstruks for den automatiske køyringa](../.github/frodebrett/weekly-news-prompt.md)
