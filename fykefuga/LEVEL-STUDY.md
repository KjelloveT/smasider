# Banestudie: ReTraY i Fykefuga

11. oktober 2026. Dette er ei spelbar opningsprøve, ikkje ein full kopi av ReTraY. White Space vart lagt bort fordi videogrunnlaget ikkje var presist nok for den komplekse bana. Med ei dekoda banefil kan vi arbeide frå koordinatar og objekt-ID-ar.

## Grunnlag

ReTraY av DiMaViKuLov26 har bane-ID `6508283`. Den offentlege nivåstrengen vart henta frå Geometry Dash-tenaren og dekoda lokalt med Base64 og zlib. Han inneheld 20 000 objekt. Dei fleste i opninga er dekorative pixel-art- og konturobjekt; vi har berre ført over hindera og dei viktigaste spelbare flatene.

Kjelder til formatet: [nivåstreng](https://github.com/gd-programming/gd.docs/blob/main/docs/resources/client/level-components/inner-level-string.md), [objektfelt](https://github.com/gd-programming/gd.docs/blob/main/docs/resources/client/level-components/level-object.md), [komprimering](https://github.com/gd-programming/gd.docs/blob/main/docs/topics/levelstring_encoding_decoding.md) og [objekt-ID-ar](https://flowvix.github.io/gd-info-explorer/ids). ReTraY-sida er [gdbrowser.com/6508283](https://gdbrowser.com/6508283). Den dekoda originalstrengen ligg berre i den lokale ignorerte `_kjelder/fykefuga-menu/`-mappa.

## Noverande prøve

- Fyrste terningdel fram til luftskipporten ved x=1729, om lag 5,77 sekund ved 300 speleiningar per sekund. Ingen spørsmål, fagrekordar eller bragder i prøva.
- Piggane er avleidde av ID 216 ved x=495 og x=925. Plattformer og høgdeskilnader ved x=1050–1290 og x=1380–1740 er ei forenkling av dei spelbare klossane og hellingane. Motoren kan no lande på desse flatene og skil landinga frå kollisjon med ei side.
- Grafikken er Fykefuga sine eigne JPEG- og PNG-ressursar. Ingen SVG eller original grafikk frå Geometry Dash er kopiert.
- «Barokksteg» er ein ny original Spitfire-sats i d-moll på 108 slag/minutt. Aksentar ved slag 3 og 5½ fell nær dei to piggane. Musikken startar på nytt saman med bana, følgjer pause og har kontrollert sløyfeskøyt. Den første prøva treng berre dei fyrste seks sekunda av satsen.

## Vidare arbeid

Neste del er luftskipet frå x=1729 og utover. Han krev eigne tak- og golvflater og eit portskifte som bevarer ei truverdig høgd og fart. Deretter kan dei seinare modusane førast inn seksjon for seksjon. For kvar seksjon må vi kontrollere objekt-ID-ar mot synleg bane, verifisere ei mogleg input-rekkje og jamføre hinderpasseringane med musikkens slag. Den noverande prøva er avgrensa til opninga; ho dokumenterer ikkje at resten av ReTraY kan gjenskapast tilfredsstillande.

Verifisert lokalt: automatisert fullføring med fire hopp, fast fysikksteg og lydprøve ved 44,1 og 48 kHz. Nettlesar på PC er prøvd. Fysisk iPad- og Android-kontroll må gjerast før ferdig bane.
