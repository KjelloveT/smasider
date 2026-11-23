# Livslina · illustrasjonar til fleire vegar

Fem lokale WebP-ark med 3 × 3 like store utsnitt. Dei vart laga med den
innebygde ImageGen-funksjonen og komprimerte til 936 × 936 pikslar.
Scenene er lista radvis. Familien har tre separate ark med dei same ni
situasjonane.

| Fil | Motiv |
| --- | --- |
| [livslina-karriere.webp](livslina-karriere.webp) | Laboratorium, elektroverkstad, produksjonslinje, veksthus, varemottak, mediestudio, byggteikning, samlingsstund i barnehage og beredskapsklasse |
| [livslina-transport.webp](livslina-transport.webp) | Internatkjøken, musikkøving, togstasjon, vandrarheim, buss, sykkel, køyretime, oppkøyring og bilverkstad |
| [livslina-familie.webp](livslina-familie.webp) | Tekveld, samtale, innflytting, plan om barn, trilletur, barnehage, avtalar mellom to heimar, mat frå ein ven og lesestund |
| [livslina-familie-to-modrer.webp](livslina-familie-to-modrer.webp) | Dei same familiesituasjonane med to mødrer |
| [livslina-familie-to-fedrar.webp](livslina-familie-to-fedrar.webp) | Dei same familiesituasjonane med to fedrar |

## Felles stillings- og komposisjonsinstruks

> Use case: illustration-story. Create a production sprite atlas for the Norwegian Vyrdepil game Livslina. Square image, exactly 3 by 3 equal square cells with each scene in its own cell, centered with a generous 9% transparent border on all sides. Nine entirely independent tightly composed cutaway Nordic isometric room dioramas like painted 1990s adventure-game graphics, careful restrained pixel clusters, dark fine pixel outlines, soft neutral daylight, muted spruce, cream and denim, expressive young adult characters, tactile everyday objects. Each scene is a cutout with a clear silhouette, floor slice and two walls where needed, over genuinely transparent alpha. No shared scene, no grid lines, no drop shadows outside the cutout, no writing, no letters or overlays, no logos. Readability at 150 pixels per cell. Stay centered, never cross cell boundaries.

## Motivprompt for karriere

> Rows left to right. Row 1 a quiet laboratory bench with two students and color-coded samples, a vocational training electronics workshop with an apprentice measuring circuits, a woman and man operating a safe automated production line. Row 2 a green agronomy greenhouse with apprentices, a logistics staffer at a warehouse packing bench, a graphic designer and audio colleague in a media studio. Row 3 an architecture and building model studio with big drafting plans, an early years educator reading to seated children, two emergency services apprentices talking in a classroom with equipment on shelves. Quiet human daily life, friendly to Norwegian pupils.

## Motivprompt for reise og transport

> Rows left to right. Row 1 a folk high school boarding house communal kitchen with two 19-year-olds making dinner, a folk high school music rehearsal space with young adults, a relatable Norwegian train platform with backpacker and train in the scene. Row 2 an inexpensive hostel room with bunk beds and two backpackers planning, a commuter seated by the window in a local Scandinavian bus, a young adult helmeted cyclist stopping by a bike rack. Row 3 a calm driving lesson with young adult student and instructor inside a compact car seen from cutaway, a parking place at a driving test centre with a student and instructor after the test, a garage visit to inspect a used blue hatchback.

## Motivprompt for den fyrste familieserien

> Rows left to right. Recurring cast: Ingrid is a young adult woman with chestnut wavy ponytail, sage green sweater, round face, and dark blue jeans; Sam is a young adult man with dark brown skin, short black curls and a faded blue sweater; Maja is a young adult woman with a light blonde braid and a rust red cardigan. Keep these three people visually consistent across the atlas. Row 1 Ingrid and friend Maja sharing tea at a small kitchen table, Sam and Ingrid quietly discussing a calendar at their kitchen table, Ingrid and Sam moving boxes together into a small flat. Row 2 Ingrid and Sam discussing hopes for a family at the table with a calendar, Sam taking a baby carriage out with Ingrid near a birch tree and simple stroller, an adult waving while dropping off their small child at a kindergarten coat rack. Row 3 two adults scheduling shared days at the kitchen table after moving apart, Maja bringing food to the new parents, a parent reading with a young child in a cosy compact living room. Warm real everyday family life and clear intentional non-medical stories.

## Promptgrunnlag for to mødrer og to fedrar

> Use case: illustration-story. A square sprite atlas for the Norwegian Vyrdepil game Livslina, exactly 3 x 3 equal square cells, nine independent cutaway Nordic isometric vignettes. Leave a visibly empty transparent gutter inside each quadrant and 9% margins. Genuine alpha transparency behind all scenes and no outer drop shadows. 1990s pixel adventure-game illustration, subtle painted pixel clusters, finely drawn dark outlines, neutral Nordic daylight, warm cream and muted spruce. Cozy believable Norwegian family life with distinct everyday clothes and props, warm natural gestures, believable child proportions. Repeat exactly the same adult faces, clothes and hair across the nine scenes wherever they appear. Draw simple readable scene compositions small enough to stay strictly inside each square. No writing, letters, numbers, logos, speech bubbles, grid lines, or backgrounds bridging cells.

### To mødrer

> Show two mothers and their small child over time. The two women are adults in their twenties. One has warm tan skin, straight black bob and muted blue shirt; the other has white skin, short copper hair, green cardigan and dark trousers. In scenes before the child they are naturally affectionate. Their friend has long braided brown hair and dresses in dusty rust. Row 1, left to right: women sharing tea or holding hands at a wooden table; the couple leaning toward each other over a simple household calendar; the two women carrying moving boxes into a modest flat. Row 2: they plan for a baby together at the table, with a tiny baby sock as visual clue; they take a blue stroller outside near a birch; one mother waves goodbye to their three-year-old at the kindergarten coat rack. Row 3: the couple calmly share dates for two households at the table; their friend brings a casserole to the two mothers and baby; one mother reads with their small child on a couch. No dramatic posing or cliché symbolism. This is one visibly affectionate family told in everyday moments.

### To fedrar

> Show two fathers and their little child over time. One is a young adult man with dark brown skin, round glasses, close black curls and cinnamon-orange hoodie. The other is a young adult man with fair skin, black wavy hair, short neat stubble and moss green overshirt. Their talkative friend is an adult with a shaved side of head and blue jacket. Put the couple together as partners with relaxed affection. Row 1, left to right: two friends having a friendly tea and bread evening; the fathers reviewing a calendar at their kitchen table as a couple; both move cardboard boxes into a small flat. Row 2: the two fathers speak about their plan to become parents over a calendar with a small baby blanket; a father takes the child out in a stroller with the other father beside him; one father drops their child off at kindergarten and kneels to say goodbye. Row 3: two adults schedule shared days across two homes; a friend visits to help and brings a pot of dinner; the two fathers read a book on a sofa while their child looks at the pages. Ordinary life, no rainbow props required, emotions expressed through interactions.

## Prompt for dei målsette romtinga

Brukte fire malar frå v4-modellen ved innlasting. Spelet viser dei fire
PNG-filene frå [ressursoversikta for rom](../prototype/resources-v5/room-fixtures.json).

> Use case: precise-object-edit, sprite sheet for Livslina. The reference is a four-cell measured silhouette and camera guide. Redraw the same four furniture objects as detailed 8-bit pixel adventure game sprites. Keep the four independent centered square quadrants unchanged. Top left a spruce-green kitchen unit with wood worktop and flat inset sink and hob, top right a simple Nordic wood dining table, bottom left a safe slatted wood crib with neutral mattress, bottom right a sage toy chest with a natural wood lid. Exact same orthographic 30-degree camera, proportions, facing angles, visible top and sides, corner positions, and ground contact as in the guide. Add fine material texture, visible dark pixel contours, purposeful pixel clusters and soft neutral Nordic daylight, with no photographic gradients. Do not add any objects beyond the cabinet top profile, no tap taller than the outline, no chairs, no toys outside the chest, no floor, no shadow, no captions, no text or watermark. Preserve the negative space between table and crib legs. Transparent alpha everywhere outside each sprite.
