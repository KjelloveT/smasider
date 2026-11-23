# Vekas nyheitsfrøde

GitHub Actions startar Codex laurdag klokka 08.15 norsk tid. Frøda dekkjer sju heile kalenderdøgn frå førre laurdag til og med fredag. Ho har fem kategoriar med seks spørsmål kvar og ein finale. Den faste kategorien heiter «snodige nyheter».

Codex får [redaksjonsinstruksen](weekly-news-prompt.md) og leverer eit JSON-utkast. Jobben sjekkar datoperioden, strukturen og fasitlengda. Ein eigen jobb lagar ein PR mot main der den einaste nye endringa er quizfila. E-posten inneheld spørsmåla, fasitane, artikkellenkjene og PR-lenkja. Redaktøren godkjenner og flettar inn PR-en manuelt.

## Aktivering på GitHub

1. Legg til desse verdiane som repository secrets under **Settings → Secrets and variables → Actions**.

   | Namn | Verdi |
   | --- | --- |
   | OPENAI_API_KEY | Ein API-nøkkel frå eit OpenAI-prosjekt som kan køyre Codex |
   | FRODEBRETT_PR_TOKEN | Eit avgrensa GitHub-token for å opprette vekas PR |
   | FRODEBRETT_MAIL_TO | E-postadressa til redaktøren |
   | FRODEBRETT_GMAIL_APP_PASSWORD | Eit Gmail-app-passord for avsendarkontoen, utan skiljemellomroma |
   | FRODEBRETT_GMAIL_USER | Valfritt. Gmail-adressa til avsendaren dersom ho er ulik mottakaradressa |

2. Opprett eit [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) med berre dette repoet og **Pull requests → Read and write**. Bruk dette som FRODEBRETT_PR_TOKEN og forny det før utløp. Den innebygde Actions-nøkkelen skriv til vekegreina. Det avgrensa tokenet opprettar PR-en, og vanlege GitHub-reglar gjeld ved manuell godkjenning og merge.
3. Flett oppsetts-PR-en inn i main. Køyreplanen startar fyrste laurdag etter dette. Du kan òg velje **Run workflow** under Actions og la **Prøvekøyr utan PR og e-post** stå på for å teste generering og validering med den same KI-nøkkelen.

Bruk [Google sitt oppsett for app-passord](https://support.google.com/accounts/answer/185833) dersom Gmail-kontoen støttar det. Legg hemmelege verdiar direkte i GitHub. Dersom utsendinga feilar etter at PR-en er oppretta, kan du bruke **Re-run failed jobs** på køyringa for å prøve e-posten att.

## Bilete og godkjenning

Jobben kan ta inn miniatyrbilete frå Wikimedia Commons når filmetadata oppgjev opphav og ein av dei støtta opne lisensane. E-posten kan òg ha konkrete framlegg frå NRK, Dagbladet og andre redaksjonar med lenkje, motivskildring og oppgjeven biletkreditt. Kjelde, fotograf og bruksgrunnlag for bilete som blir lagde ved, kjem fram saman med fasiten.

GitHub-PR-en og Azure-førehandsvisinga er offentlege. For bilete utan dokumentert gjenbruksrett må den konkrete vurderinga av eventuell sitatrett eller løyve skje før biletet blir lagt i PR-en. Sjå [åndsverklova § 29](https://lovdata.no/lov/2018-06-15-40/§29).

Når redaktøren har vurdert eit pressefoto, kan det leggjast til lokalt på greina for vekas PR. Bruk eit JPEG-, PNG- eller WebP-bilete på høgst 195 kB og ei lokal JSON-fil med felta title, author, publisher, source, rights og alt. Bruk cropped: true dersom biletet er skore til. Køyr **node .github/frodebrett/add-reviewed-photo.mjs 1.1 bilete.jpg kreditering.json** frå rota av repoet og legg den oppdaterte quizfila til i PR-en. Her viser 1.1 til fyrste spørsmål i fyrste kategori. Skriv **finale** for finalespørsmålet.

Sjekk at kvar lenkje støttar fasiten og at språk og nyheitsstoff passar i grunnskulen. Frødebrett viser datoperioden for brettet som er publisert. Ved ei mislukka køyring eller utsett godkjenning kan ein bruke brettet som alt ligg ute.
