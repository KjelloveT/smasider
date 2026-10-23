# Ordbås – genererte spelillustrasjonar

Generert 23. oktober 2026 med det innebygde imagegen-verktøyet. Ingen API-nøkkel, nye bibliotek eller eksterne bilettenester blir brukte under spel. Den eksisterande `_resources/vyrdepil-design/vyrde.png` var identitetsreferanse for Vyrde i dei to fyrste bileta. Det opphavlege figuruttrykket er halde fast.

| Fil | Bruk | Eksport |
|---|---|---|
| `vyrde-reaksjonar.png` | Eitt spriteark, 3 kolonnar × 2 rader: klar, jubel, tenkjande, hint-skilt, peikande, ordkorg | 1152 × 768, alfa, 128 fargar |
| `spelval.png` | Eitt bilete med tre ruter til dei illustrerte spelvala | 1152 × 384, alfa, 128 fargar |
| `baas.png` | Fyrste trebås, bevart som lokal motivreferanse | 384 × 384, alfa, 128 fargar |
| `baasar.png` | Fire ulike trebåsar i eit 2 × 2-ark: substantiv, verb, adjektiv og adverb | 1024 × 1024, alfa, 128 fargar |

Originalane ligg lokalt i `_kjelder/ordbas/` og er ignorerte av Git. Eksportane er om lag 78, 48, 29 og 232 kB, alle under 500 kB. Alfa er bevart; bileta er nedskalerte og palettreduserte utan nye motivendringar. Spelnamn, kategoriar og Hint er ekte HTML-tekst, ikkje tekst i rasterbileta. Spritearka blir viste med CSS-utsnitt, utan fleire biletfiler. Spelvalet Hjelp Vyrde bruker no den tenkjande Vyrde-ruta; midtruta i det eldre spelval-biletet er ikkje lenger i bruk.

## Endeleg promptgrunnlag

### Vyrde-reaksjonar

Use case: stylized-concept. ONE production sprite atlas for the Norwegian primary-school game Ordbås. The supplied image is the exact character identity reference: Vyrde, a friendly small stone cairn creature with three grey angular stacked rocks, moss green patches, simple black dot eyes and smiling mouth, small brown stick arms, green boots, thick dark outline, flat painted facets. Preserve silhouette, stone construction, colours and face in all frames.

Exactly 3 equal columns and 2 equal rows, six square cells, full bodies centered at consistent scale and baseline, transparent padding, transparent alpha background. No scenery, borders, labels, words or watermark. Six poses: (1) ready, arms relaxed; (2) joyful celebration, arms raised and one boot lifted; (3) kindly thinking, head tilted and hand at cheek; (4) holding one wide blank cream wooden board in both hands across the lower chest, for an HTML Hint label; (5) pointing to the viewer’s right, encouraging expression; (6) carrying a wicker basket with three blank cream word cards. No arrow signs from the reference. Suggested atlas 1536 × 1024; regular grid and transparency essential. Clean outlines readable at 130 px.

### Spelval

Use case: illustration-story. ONE wide three-panel atlas for three primary-school mode selection cards. Exactly three equal square cells in one horizontal row, independent vignettes with transparent margins and true alpha. No text, letters, numbers, borders or watermark. Match the supplied mascot’s painted facets, dark outline, warm wood, cream paper, moss green, honey, blue and heather.

Left: wicker basket with three blank cream word cards spilling toward three small wooden sorting boxes with soft coloured label plates. Middle: the same stone Vyrde pointing curiously at a tilted misplaced card among two sorting boxes, with no arrow signs. Right: two cream cards with the same simple dark dash as word placeholder, a curved double-ended wooden arrow between them, a calm sitting dog beneath one and the same dog running beneath the other. Keep simple balanced silhouettes, readable as 130 px pictures. No background scene or glow. Exactly 3:1 landscape.

### Trebås

Use case: illustration-story. ONE isolated painted game prop: small open wooden sorting stall in a friendly village yard, straight-on view with a slight view into the open box. A wide gently pitched mossy roof, two wooden side posts, an empty pale-wood sorting chest and a completely blank cream hanging sign under the roof. Small mossy grass patch with two grey stepping stones. Chunky simple proportions, dark uneven outline, large painted facets, soft wood grain, warm oak, cream and moss green. Transparent alpha with padding, no scenery, character, text, watermark, glow or cast background. Square composition readable at 150 px. Match a friendly mossy stone mascot’s illustration family.


### Fire særmerkte båsar

Create a transparent PNG sprite atlas of FOUR different fantasy wooden sorting stalls for a Norwegian primary school word game. Use reference for warm handpainted woodland cartoon style, moss wood stones, dark organic outlines. Exact square canvas, 2 by 2 equal square cells, one full stall per cell, nothing crossing cells, transparent outside. All stalls must have EXACTLY the same GEOMETRY so HTML overlays align: roof top at 8–26% of cell, large BLANK cream wooden hanging sign centered horizontally spanning x20–80% y30–44%, open spacious storage chest cavity x17–83% y50–80%, low front lip y80–90%. Clear view INSIDE each chest, cavity empty warm dark wood. NO letters, NO numbers, NO text anywhere. Differ in silhouette, roof and small thematic props, keep cavity unobstructed: TOP LEFT noun stall with rounded moss roof and small apple/book ornaments beside posts; TOP RIGHT verb stall with angular blue washed roof and tiny turning wheel/action pennant; BOTTOM LEFT adjective stall with purple scalloped roof and flowers/tall and short decorative posts; BOTTOM RIGHT adverb stall honey roof with small clock and wind vane. The four hanging signs remain pale cream, large, flat, blank, equal position. Do not duplicate reference stall four times; four distinctive charming builds, coherent family. Isolated game art, not a UI mockup. Consistent front-on view, inviting magical yard, child friendly. Transparent background.

Referanse: `baas.png`. Generert med det innebygde verktøyet og nedskalert frå 1254 × 1254 til 1024 × 1024. Ordklassane er ekte HTML på hengjeskilta. Setningskorta er ekte DOM-tekst i kasseopninga; på smale skjermar blir båsane høgare slik at setningane får plass. CSS klipper ein smal spritekant øvst i nedste rada.
