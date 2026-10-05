# Livslina — generatorinstruksar for karakterprøve v5

Laga med den innebygde bildegeneratoren. Kjeldebileta er 1024 × 1536; målte delkomponentar er registrerte og eksporterte i felles rammer på 512 × 768. Sjå produksjonsstandarden og manifestet for dei faktiske festepunkta.

## Fyrste kalibrering

Meisterfiguren og dei to fyrste antrekka vart laga før avbrotet. Dei brukte poseguiden som geometri og det eldre detaljarket som stilreferanse. Krava var frontvend blankt hovud, utan hår, same avslappa armar, hovud/hals/hender på faste feste og sko på felles grunnlinje. Antrekk 01 er ein blå hettegenser med indigojeans og høge joggesko; 02 er ei rustraud kordjakke over kremfarga trøye, mørke bukser og brune joggesko. Den ordrette kallteksten frå denne kalibreringa er ikkje attvunnen; dei målte råbileta er lagra lokalt.

## Loggførte biletkall

Dei følgjande tekstane er dei faktiske lagra instruksane for resten av produksjonen. Eitt kall per ressurs; råbileta blir haldne uendra.

### Andlet 01

```text
Use case: precise-object-edit / compositing.
Asset type: EXPRESSION-ONLY transparent game sprite layer for Livslina, not a complete person.
Input image 1 is the frozen MASTER POSE and style reference. Edit the supplied full 1024×1536 portrait canvas. Keep this exact canvas, framing, and coordinate system. REMOVE the entire master person, skin, head silhouette, ears, neck, hands, clothes, shoes, background and glow. Output only facial features on genuine alpha transparency, placed where they fit over the master blank face. The rest of the full canvas must be empty/fully transparent.
Expression: warm, happy and approachable; both eyes open, detailed brown irises with white eye highlights, relaxed dark brown brows, a clearly readable friendly smile with a slim white tooth highlight. No blush or cheek patches. Only eyes, brows, dark nose contour, dark mouth contour and white teeth pixels may be visible.
Precise feature registration on 1024×1536 canvas (equivalent logical 256×384 at4×): left eye centre x432,y376; right eye centre x592,y376; nose centre x512,y432; mouth centre x512,y492. Features fit inside x372..652,y308..528. Eye whites may span approximately x392..468 and x556..632, eye brow ranges x384..480 and x544..640, brow baseline y328. Mouth is centred x512 near y492. No facial feature below y520. Preserve the actual positions and size relative to the attached master. All lower 1000 pixels of canvas are transparent.
Style: rich clean detailed 8-bit inspired pixel art, crisp stepped edges, coherent small pixel clusters, no outlines other than the feature contours, match master level of detail. Maintain a4× logical pixel grid, no blur/smoothing/glow/red edge contamination.
Absolutely no skin-colored fill, head oval, nose skin shading, cheeks, hair, body, text, labels, grid, border, or spritesheet. Do not crop to the face; do not zoom, recenter, enlarge features, or change full-canvas size. A sparse transparent portrait canvas with only the correctly registered eyes,brows,nose,mouth near the upper third is the deliverable.
```

### Andlet 02

```text
Use case: precise-object-edit / background-extraction.
Deliverable: one sparse EXPRESSION-ONLY transparent pixel-art sprite on EXACT1024×1536 portrait canvas. The attached image1 is the approved frozen master reference: its blank head is at x356..668, y168..528. Use this image ONLY to register scale and positions. Replace EVERYTHING except the newly drawn facial features with genuine alpha=0 transparency. No head shape, ears, skin, body, clothes, hair or glow in output. Keep full portrait framing unchanged.
Expression2: calm clever friendly face, detailed open brown eyes behind stylish slim dark brown rectangular glasses, relaxed dark brows, short dark nose contour, subtle closed smile. No skin-colored pixels; no flesh nose, cheeks, blush or head outline. Glasses frames and transparent lenses, only eye whites and brown irises inside frames. Match rich clean detailed pixel-art master style.
Critical EXACT pixel placement: eye pupils centred left(432,376),right(592,376). Eyes are narrow and contained inside left x404..460,y356..396 and right x564..620,y356..396. Glasses frame extends x384..640,y344..412. Bridge crosses x480..544,y365. Brows approximately left x404..460,y324..336 and right x564..620,y324..336. Small nose line centred(512,432) only y420..446. Subtle closed smile centred(512,492) only x480..544,y484..504. All visible pixels must be within x372..652,y308..516; that is near the TOP quarter of the full portrait canvas. Note y516 is the bottom of permitted expression; the master chin is y528. Nothing visible below y516. Do not place eye centres at y420 or mouth at y540 because those miss the master face.
Use crisp4×4 pixel units (logical256×384). Stepped dark contours, clean clustered detail, no anti-alias blur, no diffuse shading, no bloom/glow/halo, no soft alpha texture. Empty margins including all canvas below y516 must be FULLY TRANSPARENT. No black/color backdrop, checkerboard backdrop, vignette, text, labels, borders, or contact sheet. Do not crop, zoom in, enlarge, recenter or alter the1024×1536 canvas. Correct placement is more important than filling the page.
```

### Andlet 03

```text
Use case: precise-object-edit / compositing.
Asset: one EXPRESSION-ONLY transparent game sprite layer for Livslina. Image1 is the frozen MASTER POSE and detailed pixel-art style reference.
Keep the EXACT full1024×1536 portrait canvas and register all features to the blank head of the reference. Remove the master head/skin/ears/body/hands/hair/clothes/shoes and backdrop completely; output only the facial features described below. Fully transparent empty margins. No skin-colored cheeks, nose fill or head silhouette.
Face registration targets: left eye centre(432,376),right eye centre(592,376); eye/brow pair contained x372..652,y308..422. Eye whites approximately left x404..460,y356..396 and right x564..620,y356..396. Short dark brown nose contour centred(512,432),isolated inside x500..524,y418..450. Mouth centred(512,492),contained inside x452..572,y460..524. Keep these three feature groups separate with clear transparent gaps. Preserve facial feature size similar to the master face rather than filling the canvas.
Style: rich, appealing, clean detailed 8-bit inspired pixel art; crisp4×4logical-pixel units, dark brown stepped contours, coherent small pixel clusters, brown irises and clean white highlights. Match the attached master level of detail.
Expression03: surprised but friendly. Both eyes clearly open and a little wider vertically while retaining the prescribed width and pupil anchors. Brown irises, bright white highlights. Brows raised in a distinct upward arc, but within the eye/brow bounds. Small readable open O-shaped mouth: outer dark brown contour, dark mouth interior and small lighter tongue detail, centred(512,492),roughly52×56pixels. This should visibly differ from a smile without moving the eye centres. No cheek coloring.
Constraints: only expression features on genuine alpha transparency. No skin patches, hair, ears, neck, hands, body, garments, shoes, head oval, shadow, vignette, diffuse alpha halo, glow, blur, smooth vector art, red outline, decorations, text, grid, border or sprite sheet. Do not zoom, tightcrop, recenter, enlarge features or change1024×1536 canvas. All lower canvas belowy524 remains empty transparent.
```

### Andlet 04

```text
Use case: precise-object-edit / compositing.
Asset: one EXPRESSION-ONLY transparent game sprite layer for Livslina. Image1 is the frozen MASTER POSE and detailed pixel-art style reference.
Keep the EXACT full1024×1536 portrait canvas and register all features to the blank head of the reference. Remove the master head/skin/ears/body/hands/hair/clothes/shoes and backdrop completely; output only the facial features described below. Fully transparent empty margins. No skin-colored cheeks, nose fill or head silhouette.
Face registration targets: left eye centre(432,376),right eye centre(592,376); eye/brow pair contained x372..652,y308..422. Eye whites approximately left x404..460,y356..396 and right x564..620,y356..396. Short dark brown nose contour centred(512,432),isolated inside x500..524,y418..450. Mouth centred(512,492),contained inside x452..572,y460..524. Keep these three feature groups separate with clear transparent gaps. Preserve facial feature size similar to the master face rather than filling the canvas.
Style: rich, appealing, clean detailed 8-bit inspired pixel art; crisp4×4logical-pixel units, dark brown stepped contours, coherent small pixel clusters, brown irises and clean white highlights. Match the attached master level of detail.
Expression04: playful friendly wink. The viewer-left eye is open with brown iris and white highlight at(432,376). The viewer-right eye is a clear curved closed winking eyelid centred(592,376),with no eye white. Brows gently playful. A short closed asymmetric smile centred(512,492). Freckles are ONLY a handful of separate tiny dark golden-brown pixel marks without any flesh backdrop: four marks on each cheek near x416..456,y424..440 andx568..608,y424..440. Freckles must remain separate from the nose contour and the mouth. They are an expression detail whose placement will be registered independently with the eye pair. No blush, no colored cheeks, no forehead skin.
Constraints: only expression features on genuine alpha transparency. No skin patches, hair, ears, neck, hands, body, garments, shoes, head oval, shadow, vignette, diffuse alpha halo, glow, blur, smooth vector art, red outline, decorations, text, grid, border or sprite sheet. Do not zoom, tightcrop, recenter, enlarge features or change1024×1536 canvas. All lower canvas belowy524 remains empty transparent.
```

### Andlet 05

```text
Use case: precise-object-edit / compositing.
Asset: one EXPRESSION-ONLY transparent game sprite layer for Livslina. Image1 is the frozen MASTER POSE and detailed pixel-art style reference.
Keep the EXACT full1024×1536 portrait canvas and register all features to the blank head of the reference. Remove the master head/skin/ears/body/hands/hair/clothes/shoes and backdrop completely; output only the facial features described below. Fully transparent empty margins. No skin-colored cheeks, nose fill or head silhouette.
Face registration targets: left eye centre(432,376),right eye centre(592,376); eye/brow pair contained x372..652,y308..422. Eye whites approximately left x404..460,y356..396 and right x564..620,y356..396. Short dark brown nose contour centred(512,432),isolated inside x500..524,y418..450. Mouth centred(512,492),contained inside x452..572,y460..524. Keep these three feature groups separate with clear transparent gaps. Preserve facial feature size similar to the master face rather than filling the canvas.
Style: rich, appealing, clean detailed 8-bit inspired pixel art; crisp4×4logical-pixel units, dark brown stepped contours, coherent small pixel clusters, brown irises and clean white highlights. Match the attached master level of detail.
Expression05: confident, friendly relaxed grin. Both brown eyes are open with slightly relaxed upper eyelids, modest white eye highlights, exact same eye pupil centres and eye size. Viewer-left brow has a slight confident lift; viewer-right brow remains relaxed. Small nose contour only. Clear asymmetric grin centred(512,492),about100×36pixels: corners rise softly, dark brown outline, slim clean white tooth highlight. Playful and approachable, no anger, no sneer, no blush. The difference comes from brow shapes, relaxed eyelids and grin, not by moving the face.
Constraints: only expression features on genuine alpha transparency. No skin patches, hair, ears, neck, hands, body, garments, shoes, head oval, shadow, vignette, diffuse alpha halo, glow, blur, smooth vector art, red outline, decorations, text, grid, border or sprite sheet. Do not zoom, tightcrop, recenter, enlarge features or change1024×1536 canvas. All lower canvas belowy524 remains empty transparent.
```

### Hår 01

```text
Use case: compositing.
Asset type: one standalone HAIR-ONLY modular pixel-art character layer for Livslina.
Input image: attached master character is only the exact pose/geometry/style reference. DO NOT include any portion of its head, face, skin, body, hands, clothing, feet, or background in the output.
Primary request: create a short dark chocolate curly hairstyle that fits that master at its original position, on a full 1024 by 1536 transparent canvas. Preserve the full empty padding canvas. This image will be overlaid at (0,0), without cropping, resizing, or recentering.
Geometry: source character is centered at x512. Bald scalp occupies source x356..668, y168..528; ears span x308..716 y340..436. Draw hair crown starting source y128 (logical32). Curls should envelope the top and temples, roughly x328..696, and end near source y540 (logical135). Eyes will later sit at source (432,376) and (592,376). Keep a transparent face opening at least source x376..648, y328..540; no eyes/nose/mouth/skin. Only hair exists outside this transparent opening.
Style/medium: detailed crisp retro pixel illustration, same pixel density and warm ink outline as master. Distinct readable clusters of tight natural curls, irregular curl tips, several dark brown shading ramps, restrained warm bronze highlights. All pixels belong to hair; sharp stepped edges and dense strand detail. Neutral soft illumination, no coloured rim or glow. This is a front view at the exact same height as the master.
Constraints: HAIR ONLY; absolutely no head silhouette filled with skin, mannequin, face, ears, neck, eyes, torso, outfit, shoes, ground, text, watermark, grid, checkerboard, or background. Transparent empty canvas including the large bottom three quarters. Do not center hairstyle within whole canvas: its crown must be at y128 and remain above the master's exact head. Preserve requested 1024x1536 aspect/dimensions. No random detached flecks.
```

### Hår 02

```text
Use case: compositing.
Asset type: one standalone HAIR-ONLY modular pixel-art character layer for Livslina.
Input image: attached master character is only the exact pose/geometry/style reference. DO NOT include any portion of its head, face, skin, body, hands, clothing, feet, or background in the output.
Primary request: create a long copper wavy hairstyle that fits that master at its original position, on a full 1024 by 1536 transparent canvas. Preserve the full empty padding canvas. This image will be overlaid at (0,0), without cropping, resizing, or recentering.
Geometry: source character is centered at x512. Bald scalp occupies source x356..668, y168..528; ears span x308..716 y340..436. Hair crown begins source y128 (logical32). A soft center part around x512,y160, rich waves over scalp, side lengths at source x280..400 and x624..744 that flow past the shoulders down to source y920 (logical230). At most source x260..764. Face is a completely transparent opening at least source x376..648, y328..540 (logical x94..162,y82..135); eyes will later sit at source (432,376) and (592,376). No bangs covering eye/face opening. Draw strands and ends at their exact relative locations on this full canvas.
Style/medium: detailed crisp retro pixel illustration, same pixel density and warm dark ink outline as master. Clearly readable flowing waves, fine dense hair strands organised into clean pixel clusters. Rich copper base, warm auburn shadows, restrained golden highlights, several shading ramps. Sharp stepped edges; front-view perspective, exact same height as master. Neutral diffuse illumination.
Constraints: HAIR ONLY; absolutely no skin oval, head fill, mannequin, face, ears, neck, eyes, body, torso, outfit, hands, shoes, ground, text, watermark, grid, checkerboard, or background. ACTUAL transparent background; no shadow or glow behind hair, no coloured halos, no detached random flecks. Transparent face opening and empty bottom portion. Do not center the hair within the whole canvas: crown stays at y128; tips end at y920. Preserve requested 1024x1536 aspect/dimensions and all empty padding.
```

### Hår 03

```text
Use case: compositing.
Asset type: one standalone HAIR-ONLY modular pixel-art character layer for Livslina.
Input image: image1 is the frozen master character, used only for exact geometry, pose, pixel density and warm outline style. It is the authoritative geometry. No reference skin/body/clothes/background is included in output.
Output: full 1024×1536 transparent PNG canvas. The hairstyle remains at the same absolute head location as image1, preserving all empty padding. It will be overlaid at (0,0), without cropping, variant scaling or recentering.
Frozen geometry: centerline source x512. Scalp source x356..668,y168..528 (logical x89..167,y42..132). Ears are source x308..716,y340..436. Eye centers source(432,376),(592,376), logical(108,94),(148,94). Hair cap crown around source y128/logical32. Maintain a transparent face opening x376..648,y336..540 (logical x94..162,y84..135); no hair crosses either eye center. The whole face interior is genuinely empty alpha. No skin/head silhouette fill.
Style: highly detailed polished retro pixel illustration, sharp clean stepped contour, warm dark ink linework, dense coherent strand clusters and several shading ramps, exact same pixel density as image1. Neutral diffuse soft illumination. Preserve tiny crisp cluster highlights; no glow or background haze.
Constraints: ONLY HAIR. No skin, head, face, ears, eyes, brows, nose, mouth, neck, shoulders, mannequin, torso, hands, clothes, footwear or any other object. No text, watermark, ground, checkerboard or opaque backdrop. Genuine transparency around and inside hair. No detached flecks, coloured halo, aura or cast shadow outside hair. Keep every hair strand attached to the hairstyle. Never enlarge the hairstyle to fill the frame.
Primary request: two dark chocolate braids. Front-view center-parted cap with finely organised crown strands. Two thick but realistic woven braids begin near the ears at source x330..390 and x635..695,y400, descend along either side of the shoulders, ending near source y960(logical240), never below y1080(logical270). Braids have clearly interwoven rounded segments, small simple chestnut ties at the ends and short tidy wisps. Overall silhouette roughly source x285..740, with the face opening preserved. Soft chestnut highlights and near-black brown shadows. Braids have no hands or body underneath.
Do not turn this into a recentered closeup hair product. This is the full character sprite frame, with hair anchored exactly where the master scalp is, and a very large empty lower frame. Preserve its dimensions and original head size.
```

### Hår 04

```text
Use case: compositing.
Asset type: one standalone HAIR-ONLY modular pixel-art character layer for Livslina.
Input images: image1 is the frozen master character, used only for exact geometry, pose, pixel density and warm outline style. Image2 short curls and image3 copper waves are style and material references only. No reference skin/body/clothes/background is included in output.
Output: full 1024×1536 transparent PNG canvas. The hairstyle remains at the same absolute head location as image1, preserving all empty padding. It will be overlaid at (0,0), without cropping, variant scaling or recentering.
Frozen geometry: centerline source x512. Scalp source x356..668,y168..528 (logical x89..167,y42..132). Ears are source x308..716,y340..436. Eye centers source(432,376),(592,376), logical(108,94),(148,94). Hair cap crown around source y128/logical32. Maintain a transparent face opening x376..648,y336..540 (logical x94..162,y84..135); no hair crosses either eye center. The whole face interior is genuinely empty alpha. No skin/head silhouette fill.
Style: highly detailed polished retro pixel illustration, sharp clean stepped contour, warm dark ink linework, dense coherent strand clusters and several shading ramps, exact same pixel density as image1. Neutral diffuse soft illumination. Preserve tiny crisp cluster highlights; no glow or background haze.
Constraints: ONLY HAIR. No skin, head, face, ears, eyes, brows, nose, mouth, neck, shoulders, mannequin, torso, hands, clothes, footwear or any other object. No text, watermark, ground, checkerboard or opaque backdrop. Genuine transparency around and inside hair. No detached flecks, coloured halo, aura or cast shadow outside hair. Keep every hair strand attached to the hairstyle. Never enlarge the hairstyle to fill the frame.
Primary request: straight black shoulder-length hair with crisp blunt bangs. Crown cap starts around source y128; jet-black base, cool charcoal and muted slate highlight clusters, warm almost-black contour matching master. Blunt fringe spans above the forehead source x374..650; LOWER EDGE MUST END AT source y332/logical83 OR HIGHER. Both eye centers at y376 remain entirely clear. Straight side panels frame the ears and face without narrowing the frozen opening, continue to shoulder-level source y680(logical170), slightly turned-in tips. Overall silhouette roughly source x285..740. Hair only; do not generate a dark face shape inside the opening. Refined straight strand texture distinguishable from curls and waves.
```

### Hår 05

```text
Use case: compositing.
Asset type: one standalone HAIR-ONLY modular pixel-art character layer for Livslina.
Input image: image1 is the frozen master character, used only for exact geometry, pose, pixel density and warm outline style. It is the authoritative geometry. No reference skin/body/clothes/background is included in output.
Output: full 1024×1536 transparent PNG canvas. The hairstyle remains at the same absolute head location as image1, preserving all empty padding. It will be overlaid at (0,0), without cropping, variant scaling or recentering.
Frozen geometry: centerline source x512. Scalp source x356..668,y168..528 (logical x89..167,y42..132). Ears are source x308..716,y340..436. Eye centers source(432,376),(592,376), logical(108,94),(148,94). Hair cap crown around source y128/logical32. Maintain a transparent face opening x376..648,y336..540 (logical x94..162,y84..135); no hair crosses either eye center. The whole face interior is genuinely empty alpha. No skin/head silhouette fill.
Style: highly detailed polished retro pixel illustration, sharp clean stepped contour, warm dark ink linework, dense coherent strand clusters and several shading ramps, exact same pixel density as image1. Neutral diffuse soft illumination. Preserve tiny crisp cluster highlights; no glow or background haze.
Constraints: ONLY HAIR. No skin, head, face, ears, eyes, brows, nose, mouth, neck, shoulders, mannequin, torso, hands, clothes, footwear or any other object. No text, watermark, ground, checkerboard or opaque backdrop. Genuine transparency around and inside hair. No detached flecks, coloured halo, aura or cast shadow outside hair. Keep every hair strand attached to the hairstyle. Never enlarge the hairstyle to fill the frame.
Primary request: golden-blond high ponytail secured with one small turquoise hair tie, which is part of this hairstyle. Front-view swept-back cap with crown around source y128/logical32. Dark honey shadows, rich golden midtones, restrained pale gold shine, warm ink contour. Pulled-back hair has clearly readable swept strand flow from the forehead to the tie. The turquoise tie sits high near upper-right crown source x620..680,y155..205. A full curved ponytail emerges behind that tie, arcs to source x770,y180, and flows down the RIGHT side of the head and shoulder in detailed grouped strands, ending around source y920/logical230 and never below y1080/logical270. Preserve transparent face opening and both eye centers. Ponytail and cap are connected at tie; no floating hair. Overall silhouette within source x290..825. No skin, head, facial features or clothing.
Do not turn this into a recentered closeup hair product. This is the full character sprite frame, with hair anchored exactly where the master scalp is, and a very large empty lower frame. Preserve its dimensions and original head size.
```

### Klede 03

```text
Use case: precise-object-edit. Image1 is the approved frozen master mannequin; image2 is an already approved outfit on that same mannequin, only for pixel-art style and exact pose consistency. Edit ONLY calibration CLOTHES on image1. Preserve the bald blank head, ears, neck, hands, exact silhouette pose, pixel-art rendering, anatomical anchors and framing. Full1024x1536 transparent canvas; no crop, zoom, recenter or viewpoint change. The virtual grid is256x384 at4x, crisp pixel clusters, warm dark outlines, multiple material shades, visible seams, fabric texture and clear tiny details; no vector flat blocks. Eye area blank. Source composite for clothing extraction; maintain exact hands, collar openings and feet. Arms relaxed identically; wrist centers raw(252,988),(772,988), hand centers(252,1032),(772,1032); neck raw x456..568,y524..612; sole raw y1444. Long sleeves down to the unchanged wrists. No exposed forearms. Shoes preserve the same footprint and ground line. Head skin and hand pixels must match image1 at their existing positions, no additional anatomy. Transparent exterior, zero colored glow/halo, zero ground shadow, no text, no frame or detached items. Change ONLY the clothing to this distinctive outfit: A rich violet knitted Nordic sweater with cream small geometric knit bands across chest and shoulders, a ribbed round collar, ribbed cuffs, detailed cable-like stitches and soft pixel folds. Dark indigo straight jeans with seams and pockets, violet/cream lace-up sneakers. Keep neck opening at the same y148logical as other round collars; no raised sweater covering head or neck.
```

### Klede 04

```text
Use case: precise-object-edit. Image1 is the approved frozen master mannequin; image2 is an already approved outfit on that same mannequin, only for pixel-art style and exact pose consistency. Edit ONLY calibration CLOTHES on image1. Preserve the bald blank head, ears, neck, hands, exact silhouette pose, pixel-art rendering, anatomical anchors and framing. Full1024x1536 transparent canvas; no crop, zoom, recenter or viewpoint change. The virtual grid is256x384 at4x, crisp pixel clusters, warm dark outlines, multiple material shades, visible seams, fabric texture and clear tiny details; no vector flat blocks. Eye area blank. Source composite for clothing extraction; maintain exact hands, collar openings and feet. Arms relaxed identically; wrist centers raw(252,988),(772,988), hand centers(252,1032),(772,1032); neck raw x456..568,y524..612; sole raw y1444. Long sleeves down to the unchanged wrists. No exposed forearms. Shoes preserve the same footprint and ground line. Head skin and hand pixels must match image1 at their existing positions, no additional anatomy. Transparent exterior, zero colored glow/halo, zero ground shadow, no text, no frame or detached items. Change ONLY the clothing to this distinctive outfit: A muted forest-green denim overall with brass buckles, bib pocket, shoulder straps and visible stitched panels, over a cream LONG-SLEEVE crewneck top. Two rolled-looking ankle hems but no exposed skin; forest/cream high-top sneakers. Clear overall silhouette; long cream sleeves keep original wrist anchors. No short-sleeve clothing.
```

### Klede 05

```text
Use case: precise-object-edit. Image1 is the approved frozen master mannequin; image2 is an already approved outfit on that same mannequin, only for pixel-art style and exact pose consistency. Edit ONLY calibration CLOTHES on image1. Preserve the bald blank head, ears, neck, hands, exact silhouette pose, pixel-art rendering, anatomical anchors and framing. Full1024x1536 transparent canvas; no crop, zoom, recenter or viewpoint change. The virtual grid is256x384 at4x, crisp pixel clusters, warm dark outlines, multiple material shades, visible seams, fabric texture and clear tiny details; no vector flat blocks. Eye area blank. Source composite for clothing extraction; maintain exact hands, collar openings and feet. Arms relaxed identically; wrist centers raw(252,988),(772,988), hand centers(252,1032),(772,1032); neck raw x456..568,y524..612; sole raw y1444. Long sleeves down to the unchanged wrists. No exposed forearms. Shoes preserve the same footprint and ground line. Head skin and hand pixels must match image1 at their existing positions, no additional anatomy. Transparent exterior, zero colored glow/halo, zero ground shadow, no text, no frame or detached items. Change ONLY the clothing to this distinctive outfit: A bright muted turquoise LONG-SLEEVE button-up collared casual shirt, sleeves fully down, chest pocket, small cream buttons, cuff stitching, subtle woven texture and folds; sandy beige chinos with side pockets and belt loops, teal/cream lace-up canvas sneakers. Distinct from jacket and overall; exactly the same relaxed arm pose and foot positions.
```

### Klede 05 — retting av halsopning

```text
Use case precise-object-edit. Edit ONLY the tiny triangular shirt opening on Image1 directly below the existing bare neck. Preserve this exact1024x1536 fullframe mannequin pixel for pixel everywhere else: blank bald head, ears, all pose anchors, hands, turquoise long-sleeve shirt, beige chinos, teal shoes and canvas framing. In the V opening between the turquoise collar points, add a cream crewneck undershirt with a small ribbed top edge. The exposed bare skin must end exactly at rawy596 (logical149). The area below rawy596 throughrawy624 inside the V must be cream FABRIC, no exposed skin. Neck above that boundary stays unchanged, shirt collar and buttons unchanged. This is a tiny material correction only; do not redraw or move the mannequin, zoom, crop, recenter or change foot groundline raw1444. Same detailed pixel-art texture and warm dark outlines. Transparent background, no glow or external halo. No hair, face features, text, jewelry or extraobjects.
```

