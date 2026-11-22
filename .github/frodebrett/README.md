# Vekas nyheitsfrøde

GitHub Actions startar Codex laurdag klokka 08.15 norsk tid. Frøda dekkjer sju heile kalenderdøgn frå førre laurdag til og med fredag. Ho har fem kategoriar med seks spørsmål kvar og ein finale. Den faste kategorien heiter «snodige nyheter».

Codex får [redaksjonsinstruksen](weekly-news-prompt.md) og leverer eit JSON-utkast. Jobben sjekkar datoperioden, strukturen og fasitlengda. Ein eigen jobb lagar ein PR mot main der den einaste nye endringa er quizfila. E-posten inneheld spørsmåla, fasitane, artikkellenkjene og PR-lenkja. Redaktøren godkjenner og flettar inn PR-en manuelt.

## Aktivering på GitHub

1. Legg til desse verdiane som repository secrets under **Settings → Secrets and variables → Actions**.

   | Namn | Verdi |
   | --- | --- |
   | OPENAI_API_KEY | Ein API-nøkkel frå eit OpenAI-prosjekt som kan køyre Codex |
   | FRODEBRETT_MAIL_TO | E-postadressa til redaktøren |
   | FRODEBRETT_GMAIL_APP_PASSWORD | Eit Gmail-app-passord for avsendarkontoen, utan skiljemellomroma |
   | FRODEBRETT_GMAIL_USER | Valfritt. Gmail-adressa til avsendaren dersom ho er ulik mottakaradressa |

2. Under **Settings → Actions → General → Workflow permissions**, sjekk at **Allow GitHub Actions to create and approve pull requests** er tillate. Jobben brukar løyvet til å opprette PR-ar. GitHub kan krevje eit trykk på **Approve workflows to run** for Azure-førehandsvisinga på boten sin PR.
3. Flett oppsetts-PR-en inn i main. Køyreplanen startar fyrste laurdag etter dette. Du kan òg velje **Run workflow** under Actions og la **Prøvekøyr utan PR og e-post** stå på for å teste generering og validering med den same KI-nøkkelen.

Bruk [Google sitt oppsett for app-passord](https://support.google.com/accounts/answer/185833) dersom Gmail-kontoen støttar det. Legg hemmelege verdiar direkte i GitHub. Dersom utsendinga feilar etter at PR-en er oppretta, kan du bruke **Re-run failed jobs** på køyringa for å prøve e-posten att.

## Bilete og godkjenning

Jobben kan ta inn miniatyrbilete frå Wikimedia Commons når filmetadata oppgjev opphav og ein av dei støtta opne lisensane. Kjelde, fotograf, lisens og informasjon om forminsking kjem fram saman med fasiten. E-posten har artikkellenkjer til eventuelle andre bilete som redaktøren kan vurdere.

GitHub-PR-en og Azure-førehandsvisinga er offentlege. For bilete utan dokumentert gjenbruksrett må den konkrete vurderinga av eventuell sitatrett eller løyve skje før biletet blir lagt i PR-en. Sjå [åndsverklova § 29](https://lovdata.no/lov/2018-06-15-40/§29).

Sjekk at kvar lenkje støttar fasiten og at språk og nyheitsstoff passar i grunnskulen. Frødebrett viser datoperioden for brettet som er publisert. Ved ei mislukka køyring eller utsett godkjenning kan ein bruke brettet som alt ligg ute.
