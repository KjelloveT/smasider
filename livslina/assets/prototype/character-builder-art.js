/* Detailed Livslina character sprites, composited from one aligned transparent atlas. */
window.LivslinaCharacterArt = (() => {
  const labels = {
    skin: ["Ljos varm", "Ljos nøytral", "Mellomvarm", "Djup brun", "Mørk brun"],
    face: ["Breitt smil", "Overraska", "Briller", "Blink og fregner", "Sjølvsikker"],
    hair: ["Kort krøllhår", "Langt bølgjehår", "Fletter", "Rett lugg", "Høg hestehale"],
    clothes: ["Blå hettegenser", "Rustraud jakke", "Lilla strikkegenser", "Grøn overall", "Turkis skjorte"]
  };

  // Source rectangles are [x, y, width, height] within the 1215 × 1295 atlas.
  const sprites = {
    skin: [
      [46, 30, 169, 368], [283, 30, 171, 368], [522, 30, 171, 368],
      [760, 30, 170, 368], [999, 30, 169, 368]
    ],
    face: [
      [36, 466, 195, 135], [276, 457, 187, 152], [506, 466, 203, 130],
      [752, 468, 187, 127], [984, 465, 195, 133]
    ],
    hair: [
      [17, 644, 226, 266], [243, 632, 243, 278], [486, 648, 215, 262],
      [733, 643, 221, 267], [980, 625, 222, 281]
    ],
    clothes: [
      [19, 900, 224, 361], [243, 900, 243, 361], [486, 900, 234, 361],
      [742, 900, 206, 381], [984, 900, 206, 395]
    ]
  };

  const hairWidths = [120, 128, 120, 126, 138];
  const canvasCenter = 96;
  const atlas = new Image();
  let ready = false;

  atlas.addEventListener("load", () => {
    ready = true;
    window.dispatchEvent(new Event("livslina:character-art-ready"));
  }, { once: true });

  atlas.addEventListener("error", () => {
    window.dispatchEvent(new Event("livslina:character-art-error"));
  }, { once: true });

  atlas.src = new URL("characters/character-builder-atlas-v4.png", document.currentScript.src).href;

  function drawHeight(ctx, sprite, targetHeight, top) {
    const [sx, sy, sourceWidth, sourceHeight] = sprite;
    const scale = targetHeight / sourceHeight;
    const width = sourceWidth * scale;
    ctx.drawImage(atlas, sx, sy, sourceWidth, sourceHeight,
      canvasCenter - width / 2, top, width, targetHeight);
  }

  function drawWidth(ctx, sprite, targetWidth, top) {
    const [sx, sy, sourceWidth, sourceHeight] = sprite;
    const height = sourceHeight * targetWidth / sourceWidth;
    ctx.drawImage(atlas, sx, sy, sourceWidth, sourceHeight,
      canvasCenter - targetWidth / 2, top, targetWidth, height);
  }

  function draw(ctx, selection) {
    if (!ready) return false;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Every layer keeps its own aspect ratio and shares the same 192 × 256 pose.
    drawHeight(ctx, sprites.skin[selection.skin] || sprites.skin[0], 256, 0);
    drawHeight(ctx, sprites.clothes[selection.clothes] || sprites.clothes[0], 174, 82);
    drawWidth(ctx, sprites.hair[selection.hair] || sprites.hair[0], hairWidths[selection.hair] || hairWidths[0], 0);
    drawWidth(ctx, sprites.face[selection.face] || sprites.face[0], 66, 25);
    return true;
  }

  return { labels, draw, get ready() { return ready; } };
})();
