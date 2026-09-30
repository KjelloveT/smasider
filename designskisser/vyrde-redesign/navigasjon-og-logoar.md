> **Historiske meny- og logonotat:** Nokre avgjerder er avløyste av den ferdige porteføljegjennomgangen. Bruk `../../DESIGN.md`, `../../AGENTS.md` og `../../json/vyrdepil-design.json` som gjeldande kjelder.

# Meny og applogoar

## Den felles toppmenyen

Toppmenyen brukar ei lys himmelflate med kantete, lyse skyer. Stein-Vyrde og namnet «Vyrdepil» står til venstre; ein tydeleg menyknapp med hamburgarsymbol står til høgre. Menyen opnar ei tilgjengeleg dialogflate, kan lukkast med Escape og returnerer fokus til knappen som opna henne.

Appmenyen heiter «Vyrdepil». Ho hentar appnamn, lenkjer, kategoriar og synlegheit frå den eksisterande `json/apps.json`; det skal ikkje opprettast ein ny katalog. Menyen har søk og kategorifilter, og viser logoar når dei er klare. På større skjermar får Vyrde god plass i toppfeltet. På små skjermar skal søk, filter og appkort framleis vere lette å bruke.

## Felles logofamilie

«Måla flater» er vald for dei nye applogoane: store måla fasettar, avgrensa detaljar, naturlege materialfargar og ein mørk, litt ujamn kontur. Stein-Vyrde bind familien saman. Appnamn er HTML-tekst ved sida av illustrasjonen, aldri tekst inne i sjølve biletet.

Duldord, Klassekart og Rissverk er dei fyrste godkjende logoane. Dei andre blir laga når appane blir migrerte, og kvar logo skal vise eit motiv som passar verktøyet.

## Puljevis innføring

Duldord er fyrste app med den nye toppmenyen. Den eksisterande appkatalogen og den gamle globale menyen blir ståande for appar som ikkje er migrerte. Nye grunnkomponentar skal ikkje tvinge ei endring av utsjånaden i dei appane.
