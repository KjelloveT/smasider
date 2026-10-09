# Tevlingstreet

Turneringar med lokal lagring, direktevising og A3-ark. Ingen nye nettverksavhengnader.

## Oppbygging

- `core`, `engine` og `swiss`: modell, turneringsreglar, spelbolkar, poeng og rettingar.
- `setup`, `play` og `view`: lærarvising og delte DOM-komponentar.
- `storage`: VyrdepilStorage og validerte JSON-kopiar.
- `sync`, `receiver` og `display`: versjonert BroadcastChannel-protokoll, revisjonar og storskjerm.
- `paper`, `paper-swiss` og `print`: målte A3-sider, samanhengande greiner, puljar og papirparing.
- Felles elevbibliotek: `js/vyrdepil-elevgrupper.js` og `js/vyrdepil-elevgrupper-ui.js`.

Lærarvindauget held ei Web Lock for turnerings-ID-en. Fleire ulike turneringar kan redigerast samtidig, men berre eitt vindauge redigerer kvar turnering. Storskjermen spør etter tilstanden ved opning og omlasting, og viser kontaktbrot etter ti sekund utan livsteikn. Han viser berre lagmedlemmer når læraren vel det.

Resultat registrerte før og etter ein sveitserparing endrar aldri alt publiserte par. Ein cupretting tømmer resultat i kampar der motstandarane endrar seg, og i seinare kampar som må vente på desse resultata. Oppsettslåsen blir verande etter at eit resultat er angra. Baner og bolknummer er uendra når puljekvalifisering blir stadfesta. Storskjermen måler innhaldet og deler lange namn over fleire sider, med uendra skriftstorleik og globale plasseringar.

## Kontroll

Køyr motortestane utan ekstra bibliotek:

```
node tevlingstreet/tests/engine.cjs
node tevlingstreet/tests/coverage.cjs
```

Nettlesartestane brukar ei eksisterande Playwright-installasjon og ein isolert Chromium-profil. Dette er berre testverktøy; Playwright blir ikkje lasta av nettsida. Set `VYRDEPIL_PLAYWRIGHT` til modulbanen, `VYRDEPIL_BROWSER` til ein installert Chrome/Chromium og `VYRDEPIL_TEST_URL` til den lokale testserveren.

```
node tevlingstreet/tests/browser.cjs
node tevlingstreet/tests/library-browser.cjs
node tevlingstreet/tests/design-browser.cjs
```

PDF-ar, bilete og rapportar blir lagde i den ignorerte mappa `_kjelder/tevlingstreet-qa/`. Testane kontrollerer små og 128-deltakars oppsett i alle format, lange namn, utskriftsgrenser, minst 12 punkt skrift og 8 mm skrivefelt. Dei prøver også fleire vindauge, omlasting, kontaktbrot, redigeringslås, blokkert vindaugsopning, lagring berre i minnet, mobilbreidder, bibliotekkopiar og integrasjonane.

Det står att å prøve arka med ein lærar og elevar i ei verkeleg undervisningsøkt. Automatiske testar kan kontrollere reglar og layout, men stadfestar ikkje at ein uerfaren lærar finn alle stega utan hjelp.

`coverage.cjs` gjennomfører 50 turneringar med aukande deltakartal frå 2 til 128, og kontrollerer 43 319 kampar mot ei separat berekning av poeng, delt plass og avansement. Han prøver begge deltakarvariantane, like namn, ulike poengsystem, bronsefinale, uavgjort, kvalifisering, frirundar, retting, angre og import. Køyr han før `design-browser.cjs`, som brukar dei same oppsetta i ein isolert nettlesar, samanliknar synlege sluttresultat og måler designet ved 320–1920 px. Rapportar og skjermbilete ligg i `_kjelder/tevlingstreet-audit/`.
