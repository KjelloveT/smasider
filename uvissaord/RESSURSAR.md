# UvissaOrd — bilete og promptar

Alle dei nye bileta vart laga 24. oktober 2026 med den innebygde bildegeneratoren etter uttrykkeleg ynske frå brukaren. Ingen ekstern biletteneste blir kontakta av spelet. Vyrde-referansen var `_resources/vyrdepil-design/mascot/vyrde-01.png`.

## Filer

- Applogo: `_resources/vyrdepil-design/logos/uvissaord-mala.png`, 384 × 384, PNG med 128 fargar (30 878 byte).
- Hint: `uvissaord/assets/hints/pos.png`, `grammar.png`, `usage.png`, `sentence.png`, `random.png`, `chosen.png`, `definition.png`, `theme.png` og `length.png`. Alle er 192 × 192, gjennomsiktige PNG-filer med 128 fargar, om lag 8–14 kB kvar.
- Mynt: `uvissaord/assets/coin-front.png` og `coin-back.png`, 128 × 128, gjennomsiktige PNG-filer med 128 fargar, om lag 8 kB kvar.
- Original logo ligg i den ignorerte mappa `_kjelder/logoar/`. Andre originalar og kontaktark ligg i `_kjelder/ordvett/bilete/`.

Adressa er `uvissaord/`. Den interne app-ID-en og lagringsnøkkelen `ordvett` er haldne stabile slik at lagra framgang og bakgrunnsreservasjonen framleis høyrer til same spel.

## Felles prompt for hintikona

Use case: logo-brand. Asset type: a single small raster game-shop icon for a Norwegian primary-school word game called Ordvett. Make a charming hand-painted gouache cutout with simple chunky shapes, very dark green-black outlines, subtle painted texture, cream, moss green, warm honey gold and muted sky blue palette. Match a woodland hiking-sign children's game. One central readable subject filling a square with generous transparent margins. Designed to read at 64 pixels. Genuine transparent background, no badge border, no scene, no text or letters, no watermark.

Kvart ikon fekk denne felles prompten pluss den tilsvarande teksten:

| Fil | Tilleggsprompt |
|---|---|
| pos | An open cream dictionary with THREE large distinct coloured index tabs representing noun, verb and adjective. Simple and legible. |
| grammar | Three chunky wooden puzzle pieces fitting together into a small stack, suggesting grammatical word forms. Clear simple silhouette. |
| usage | A small moss-green backpack with a wooden tool peeking out, representing how a word is used in everyday life. |
| sentence | A cream scroll of paper with three short dark brush strokes and a conspicuous empty square in the middle of a sentence line. No actual letters. |
| random | A wooden die with one face showing a single bold question mark, and a small golden sparkle. Question mark is the only allowed glyph. |
| chosen | A friendly pointing hand selecting one wooden square from three little numbered-free squares. One selected square is honey gold. |
| definition | A warm golden glowing lightbulb sitting on an open little book. Compact and friendly. |
| theme | A little folded woodland map with a tree, a house and a hill as three simple symbols, representing the subject or theme of a word. |
| length | A small wooden ruler beside a row of three cream letter tiles of different heights, with simple black measuring ticks but no letters or numbers. |

## Myntframside

Use case: identity-preserve. Create a single FRONT FACE of a game coin, using the attached mascot only as the reference for its head. Show a large round honey-gold coin face-on, with a lightly ridged dark gold rim and dark green-black chunky outline, in a hand-painted gouache children's woodland game style. In the centre is an embossed relief portrait of Vyrde's HEAD: the friendly wide pale-grey angular stone face with two black oval eyes and a little curved smile, small moss patches, and a smaller moss-capped stone sitting on top. Preserve the unmistakable head identity from the reference. Only head, no body, hands, feet or signposts. The coin is the entire image subject, centred, almost fills the square, no surrounding props. Gold coin relief with warm cream highlights and a little moss green in the head detail. No words, no letter, no numbers. Genuine transparent background. Clean silhouette, readable at 28px.

## Myntbakside

Use case: logo-brand. Asset type: the BACK FACE of a small virtual gold coin for the Norwegian children's word game UvissaOrd. A single perfectly ROUND, FACE-ON honey-gold coin with a lightly ridged dark-gold rim and a strong dark green-black contour. In the centre one very large, bold, handsome capital letter V, engraved and raised with warm cream highlights and dark gold shading. Text verbatim: "V". No other letters or numbers, no portrait. Hand-painted gouache woodland children's game style, slightly tactile gold surface, simple chunky details, not photorealistic, readable at 28 pixels. Centre the coin in a square image, coin almost fills frame with safe transparent margins. Absolutely genuine transparent background, no props, no scene, no watermark.

## Applogo

Use case: logo-brand. Asset type: playful painted app logo for a Norwegian children's word-mystery game named UvissaOrd; the title itself will be typeset separately, so do not put a wordmark in the illustration. Use the attached Vyrde mascot as an identity reference. Create a lively compact scene: the friendly angular mossy stone HEAD of Vyrde peeks curiously out of an open little honey-coloured wooden mystery box, its lid tilted, with THREE chunky cream letter tiles playfully flying out at different angles, showing exactly A, Ø, Å, one glyph on each tile. A big dark question mark is painted on the box front. A few small warm gold sparkles. Strong curved energetic composition and personality, readable as a small app icon. Hand-painted gouache with bold dark green-black contours, tactile painted surfaces, cream, warm honey, moss green, sky blue and a little coral. Preserve the reference head's stone face, two black oval eyes, curved smile and smaller moss-capped stone on top; no full body or signs. Transparent background, no frame, no backdrop, no words, no watermark. Centred square composition, generous safe transparent margins, everything visible without cropping.