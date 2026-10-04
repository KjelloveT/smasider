/* Detailed pixel art for the Livslina character-layer test. Drawn on a 192 × 256 canvas from a shared 96 × 128 pose grid. */
window.LivslinaCharacterArt = (() => {
  const ink = "#211d27";
  const shadeInk = "#403849";
  const skin = [
    { base: "#efc398", shade: "#c98f68", light: "#ffe0b8", deep: "#9f674e" },
    { base: "#d99b6a", shade: "#b8734e", light: "#f0bd88", deep: "#88523f" },
    { base: "#b77b57", shade: "#92583f", light: "#d69a70", deep: "#704430" },
    { base: "#89553f", shade: "#6b4034", light: "#aa7257", deep: "#4e332d" },
    { base: "#613d32", shade: "#492f2b", light: "#805542", deep: "#35272a" }
  ];
  const hairPalettes = [
    ["#30232b", "#51343b", "#805057"],
    ["#2b2429", "#4a383c", "#76575c"],
    ["#211f27", "#3c343d", "#67525b"],
    ["#38242d", "#64404a", "#93616a"],
    ["#29242f", "#51404b", "#806271"]
  ];
  const labels = {
    skin: ["Ljos varm", "Ljos nøytral", "Mellomvarm", "Djup brun", "Mørk brun"],
    face: ["Breitt smil", "Overraska", "Briller", "Blink og fregner", "Sjølvsikker"],
    hair: ["Kort krøllhår", "Langt bølgjehår", "Fletter", "Rett lugg", "Høg hestehale"],
    clothes: ["Blå hettegenser", "Rustraud jakke", "Lilla strikkegenser", "Grøn overall", "Turkis skjorte"]
  };

  function rect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  function rows(ctx, color, parts) {
    for (const [x, y, width, height = 2] of parts) rect(ctx, x, y, width, height, color);
  }

  function drawBody(ctx, palette) {
    // Feet shadow sits on the same ground line for every combination.
    ctx.fillStyle = "rgba(33, 29, 39, .18)";
    ctx.fillRect(29, 117, 38, 3);
    ctx.fillRect(34, 120, 28, 1);

    // Legs and torso silhouette underneath the selected outfit.
    rows(ctx, ink, [[36, 85, 11, 25], [49, 85, 11, 25]]);
    rows(ctx, palette.base, [[38, 87, 7, 21], [51, 87, 7, 21]]);
    rows(ctx, palette.shade, [[38, 99, 2, 8], [54, 99, 2, 8]]);
    rows(ctx, palette.light, [[43, 91, 1, 6], [56, 91, 1, 6]]);

    // Arms and hands.
    rows(ctx, ink, [[29, 45, 9, 7], [27, 51, 9, 19], [28, 69, 9, 12], [30, 79, 10, 8]]);
    rows(ctx, ink, [[58, 45, 9, 7], [60, 51, 9, 19], [59, 69, 9, 12], [56, 79, 10, 8]]);
    rows(ctx, palette.base, [[31, 47, 5, 5], [29, 53, 5, 16], [30, 71, 5, 8], [32, 81, 6, 4]]);
    rows(ctx, palette.base, [[60, 47, 5, 5], [62, 53, 5, 16], [61, 71, 5, 8], [58, 81, 6, 4]]);
    rows(ctx, palette.shade, [[29, 65, 3, 9], [63, 65, 3, 9], [30, 77, 3, 5], [63, 77, 3, 5]]);
    rows(ctx, palette.light, [[32, 54, 1, 8], [64, 54, 1, 8], [33, 82, 3, 1], [59, 82, 3, 1]]);

    // Neck and ears.
    rows(ctx, ink, [[42, 36, 12, 11], [32, 21, 5, 9], [59, 21, 5, 9]]);
    rows(ctx, palette.base, [[44, 38, 8, 8], [33, 23, 3, 5], [60, 23, 3, 5]]);
    rows(ctx, palette.shade, [[44, 42, 8, 4], [33, 25, 1, 3], [62, 25, 1, 3]]);
    rows(ctx, palette.light, [[45, 39, 4, 2], [34, 23, 1, 2]]);

    // Face silhouette, with identical attachment points for all five tones.
    rows(ctx, ink, [
      [42, 9, 12, 3], [38, 12, 20, 2], [36, 14, 24, 2], [34, 16, 28, 4],
      [33, 20, 30, 10], [34, 30, 28, 4], [36, 34, 24, 3], [39, 37, 18, 2]
    ]);
    rows(ctx, palette.base, [
      [42, 11, 12, 2], [39, 14, 18, 2], [37, 16, 22, 2], [36, 18, 24, 10],
      [37, 28, 22, 5], [39, 33, 18, 3], [42, 36, 12, 1]
    ]);
    rows(ctx, palette.shade, [[36, 25, 2, 7], [57, 25, 2, 7], [39, 34, 5, 2], [52, 34, 5, 2]]);
    rows(ctx, palette.light, [[39, 18, 4, 2], [43, 16, 5, 1], [39, 21, 1, 5], [55, 21, 1, 5]]);
    rows(ctx, palette.deep, [[34, 24, 1, 4], [63, 24, 1, 4]]);
    rows(ctx, ink, [[31, 22, 5, 8], [60, 22, 5, 8]]);
    rows(ctx, palette.base, [[32, 24, 3, 4], [61, 24, 3, 4]]);
    rows(ctx, palette.shade, [[32, 26, 2, 2], [63, 26, 1, 2]]);
  }

  const outfits = [
    { main: "#527a9a", light: "#82b2c6", shade: "#345267", trim: "#e6bf67", pants: "#34495c", pantsLight: "#536b79", shoe: "#e9dfc8", shoeTrim: "#bf7458" },
    { main: "#ba684e", light: "#e28d68", shade: "#7e443d", trim: "#e8c66b", pants: "#4c4650", pantsLight: "#756b70", shoe: "#ddddd0", shoeTrim: "#765267" },
    { main: "#79648f", light: "#ad91b4", shade: "#51425f", trim: "#d6c4a5", pants: "#596a62", pantsLight: "#87917a", shoe: "#f1dcb5", shoeTrim: "#847087" },
    { main: "#607e59", light: "#91a96e", shade: "#3c5946", trim: "#dfb85d", pants: "#61704b", pantsLight: "#87905c", shoe: "#514953", shoeTrim: "#d19a62" },
    { main: "#4a9290", light: "#7fc0b4", shade: "#2f6269", trim: "#df8a72", pants: "#394d59", pantsLight: "#5e7380", shoe: "#ede1c5", shoeTrim: "#628a82" }
  ];

  function drawTrousers(ctx, colors, style) {
    rows(ctx, ink, [[35, 85, 13, 26], [48, 85, 13, 26]]);
    rows(ctx, colors.pants, [[37, 87, 9, 22], [50, 87, 9, 22]]);
    rows(ctx, colors.pantsLight, [[38, 89, 2, 9], [52, 89, 2, 9], [37, 97, 9, 2]]);
    rows(ctx, shadeInk, [[47, 88, 2, 21], [37, 107, 10, 2], [50, 107, 10, 2]]);
    if (style === 1) {
      rows(ctx, colors.trim, [[39, 91, 5, 1], [52, 91, 5, 1]]);
      rows(ctx, ink, [[39, 93, 1, 4], [56, 93, 1, 4]]);
    } else if (style === 2) {
      rows(ctx, colors.pantsLight, [[39, 93, 1, 9], [55, 94, 1, 8], [37, 104, 9, 1], [50, 104, 9, 1]]);
    } else if (style === 3) {
      rows(ctx, colors.trim, [[38, 96, 7, 1], [51, 96, 7, 1]]);
      rows(ctx, ink, [[40, 89, 3, 4], [53, 89, 3, 4]]);
    } else if (style === 4) {
      rows(ctx, colors.pantsLight, [[38, 94, 2, 9], [54, 94, 2, 9]]);
    }
  }

  function drawShoes(ctx, colors, style) {
    rows(ctx, ink, [[33, 107, 16, 8], [48, 107, 17, 8]]);
    rows(ctx, colors.shoe, [[34, 108, 13, 4], [50, 108, 13, 4]]);
    rows(ctx, colors.shoeTrim, [[32, 112, 17, 2], [49, 112, 17, 2]]);
    rows(ctx, shadeInk, [[35, 114, 12, 1], [51, 114, 12, 1]]);
    if (style % 2 === 0) rows(ctx, ink, [[38, 109, 1, 3], [55, 109, 1, 3], [42, 109, 1, 3], [59, 109, 1, 3]]);
    else rows(ctx, colors.trim, [[35, 109, 8, 1], [51, 109, 8, 1]]);
  }

  function drawShirtShape(ctx, colors, style) {
    rows(ctx, ink, [[38, 43, 20, 3], [34, 46, 28, 3], [31, 49, 34, 4], [30, 53, 36, 23], [31, 76, 34, 7], [33, 83, 30, 6], [35, 89, 26, 3]]);
    rows(ctx, colors.main, [[39, 45, 18, 2], [36, 48, 24, 2], [33, 51, 30, 3], [32, 54, 32, 19], [33, 73, 30, 8], [35, 81, 26, 6], [37, 87, 22, 3]]);
    rows(ctx, colors.light, [[36, 50, 4, 13], [56, 50, 4, 10], [35, 74, 5, 4]]);
    rows(ctx, colors.shade, [[60, 56, 3, 14], [55, 80, 4, 5], [37, 86, 22, 2]]);
    rows(ctx, colors.main, [[28, 49, 8, 18], [60, 49, 8, 18]]);
    rows(ctx, colors.light, [[30, 51, 4, 13], [62, 51, 4, 13]]);
    rows(ctx, colors.shade, [[28, 65, 8, 3], [60, 65, 8, 3]]);
    rows(ctx, colors.trim, [[29, 68, 7, 2], [60, 68, 7, 2], [34, 85, 28, 2]]);

    if (style === 0) {
      rows(ctx, colors.shade, [[39, 46, 18, 2], [42, 48, 12, 2]]);
      rows(ctx, colors.main, [[41, 49, 14, 4]]);
      rows(ctx, colors.trim, [[43, 49, 1, 4], [52, 49, 1, 4]]);
      rows(ctx, colors.shade, [[40, 70, 16, 6]]);
      rows(ctx, colors.light, [[42, 71, 12, 3]]);
      rows(ctx, ink, [[47, 71, 1, 3]]);
      rows(ctx, colors.trim, [[47, 56, 2, 6], [47, 64, 2, 2]]);
    } else if (style === 1) {
      rows(ctx, colors.shade, [[43, 47, 10, 30]]);
      rows(ctx, colors.light, [[36, 49, 5, 21], [55, 49, 5, 21]]);
      rows(ctx, colors.trim, [[47, 48, 2, 29], [43, 55, 10, 2], [43, 68, 10, 2]]);
      rows(ctx, ink, [[47, 55, 2, 2], [47, 64, 2, 2], [47, 73, 2, 2]]);
    } else if (style === 2) {
      rows(ctx, colors.trim, [[33, 56, 30, 2], [32, 64, 32, 2], [33, 72, 30, 2]]);
      rows(ctx, colors.light, [[34, 58, 5, 2], [55, 66, 6, 2], [37, 74, 7, 2]]);
    } else if (style === 3) {
      rows(ctx, colors.shade, [[40, 47, 16, 4], [39, 50, 18, 20]]);
      rows(ctx, colors.light, [[39, 50, 3, 27], [54, 50, 3, 27]]);
      rows(ctx, colors.trim, [[41, 54, 14, 3], [42, 72, 12, 6]]);
      rows(ctx, ink, [[43, 73, 1, 3], [50, 73, 1, 3]]);
    } else {
      rows(ctx, colors.shade, [[42, 47, 12, 3], [46, 47, 4, 27]]);
      rows(ctx, colors.light, [[37, 51, 6, 21], [54, 51, 6, 21]]);
      rows(ctx, colors.trim, [[40, 49, 16, 2], [40, 77, 16, 2]]);
      rows(ctx, ink, [[47, 54, 2, 2], [47, 62, 2, 2], [47, 70, 2, 2]]);
    }
  }

  function drawGarmentDetails(ctx, colors, style) {
    if (style === 0) {
      // Hood and pouch pocket give the blue top a strong hoodie silhouette.
      rows(ctx, ink, [[41, 43, 14, 3], [39, 46, 18, 3], [39, 49, 3, 6], [54, 49, 3, 6]]);
      rows(ctx, colors.shade, [[42, 45, 12, 2], [40, 48, 2, 4], [56, 48, 2, 4]]);
      rows(ctx, colors.light, [[42, 46, 3, 1], [51, 46, 3, 1]]);
      rows(ctx, colors.trim, [[44, 52, 1, 9], [51, 52, 1, 9], [44, 60, 2, 1], [50, 60, 2, 1]]);
      rows(ctx, ink, [[39, 69, 18, 8]]);
      rows(ctx, colors.main, [[41, 70, 14, 5]]);
      rows(ctx, colors.light, [[42, 70, 4, 1], [51, 70, 3, 1]]);
      rows(ctx, colors.shade, [[47, 72, 2, 3]]);
      rows(ctx, colors.trim, [[29, 68, 7, 2], [60, 68, 7, 2]]);
    } else if (style === 1) {
      // Open jacket, contrasting shirt, lapels and two patch pockets.
      rows(ctx, ink, [[44, 49, 2, 30], [50, 49, 2, 30]]);
      rows(ctx, "#e9d8bc", [[46, 50, 4, 28]]);
      rows(ctx, "#b9a98f", [[47, 52, 2, 25]]);
      rows(ctx, colors.light, [[38, 47, 6, 3], [42, 50, 4, 3], [52, 50, 4, 3], [54, 47, 6, 3]]);
      rows(ctx, colors.shade, [[39, 51, 4, 3], [53, 51, 4, 3]]);
      rows(ctx, ink, [[35, 67, 9, 8], [52, 67, 9, 8]]);
      rows(ctx, colors.main, [[36, 68, 7, 5], [53, 68, 7, 5]]);
      rows(ctx, colors.trim, [[36, 68, 7, 1], [53, 68, 7, 1], [41, 55, 1, 1], [54, 55, 1, 1]]);
      rows(ctx, ink, [[43, 55, 1, 2], [53, 63, 1, 2], [42, 75, 1, 2], [54, 75, 1, 2]]);
    } else if (style === 2) {
      // Ribbed collar, knit bands and a stepped diamond pattern.
      rows(ctx, ink, [[41, 44, 14, 4], [43, 42, 10, 3]]);
      rows(ctx, colors.shade, [[43, 44, 10, 2]]);
      rows(ctx, colors.trim, [[44, 45, 8, 1], [29, 67, 7, 3], [60, 67, 7, 3], [35, 84, 27, 3]]);
      rows(ctx, colors.light, [[46, 56, 4, 2], [44, 58, 8, 2], [42, 60, 12, 2], [44, 62, 8, 2], [46, 64, 4, 2]]);
      rows(ctx, colors.shade, [[47, 58, 2, 2], [45, 60, 6, 2], [47, 62, 2, 2]]);
      rows(ctx, colors.trim, [[35, 59, 5, 1], [56, 59, 5, 1], [38, 71, 3, 2], [55, 71, 3, 2]]);
      rows(ctx, colors.light, [[30, 64, 5, 1], [63, 64, 5, 1]]);
    } else if (style === 3) {
      // Pale undershirt sleeves sit beneath a bib, straps and metal clips.
      rows(ctx, "#e7dcc5", [[30, 51, 5, 13], [61, 51, 5, 13], [41, 47, 14, 5]]);
      rows(ctx, "#b9aa8d", [[29, 63, 7, 3], [60, 63, 7, 3]]);
      rows(ctx, ink, [[39, 47, 5, 14], [52, 47, 5, 14], [40, 56, 16, 19]]);
      rows(ctx, colors.light, [[41, 49, 2, 9], [53, 49, 2, 9], [42, 58, 12, 14]]);
      rows(ctx, colors.main, [[43, 59, 10, 10]]);
      rows(ctx, colors.trim, [[40, 48, 4, 3], [52, 48, 4, 3], [38, 71, 2, 3], [56, 71, 2, 3]]);
      rows(ctx, ink, [[44, 61, 8, 7]]);
      rows(ctx, colors.shade, [[45, 62, 6, 4]]);
      rows(ctx, colors.light, [[46, 63, 4, 1]]);
      rows(ctx, colors.trim, [[44, 70, 1, 1], [51, 70, 1, 1]]);
    } else {
      // A visible collar, button placket and chest pocket distinguish the shirt.
      rows(ctx, ink, [[39, 45, 9, 5], [48, 45, 9, 5]]);
      rows(ctx, "#e8dfca", [[41, 46, 5, 3], [50, 46, 5, 3]]);
      rows(ctx, colors.light, [[42, 47, 3, 2], [51, 47, 3, 2]]);
      rows(ctx, ink, [[47, 50, 2, 28]]);
      rows(ctx, colors.trim, [[47, 52, 2, 22]]);
      rows(ctx, "#e8dfca", [[53, 61, 7, 8]]);
      rows(ctx, ink, [[52, 60, 9, 1], [52, 61, 1, 9], [60, 61, 1, 9], [52, 69, 9, 1]]);
      rows(ctx, colors.light, [[54, 62, 5, 5], [53, 61, 7, 1]]);
      rows(ctx, colors.trim, [[55, 64, 1, 1], [48, 55, 1, 1], [48, 62, 1, 1], [48, 69, 1, 1]]);
      rows(ctx, colors.shade, [[29, 64, 7, 3], [60, 64, 7, 3]]);
    }
  }

  function drawOutfit(ctx, index) {
    const colors = outfits[index];
    drawTrousers(ctx, colors, index);
    drawShirtShape(ctx, colors, index);
    drawGarmentDetails(ctx, colors, index);
    drawShoes(ctx, colors, index);
    // Small fixed waist and seam details make every outfit readable at native size.
    rows(ctx, colors.trim, [[39, 88, 18, 1]]);
    drawClothingFinish(ctx, index);
  }

  function drawHands(ctx, palette) {
    rows(ctx, ink, [[27, 79, 9, 8], [60, 79, 9, 8]]);
    rows(ctx, palette.base, [[29, 80, 5, 5], [62, 80, 5, 5]]);
    rows(ctx, palette.light, [[30, 80, 2, 1], [63, 80, 2, 1]]);
    rows(ctx, palette.shade, [[28, 83, 2, 3], [66, 83, 2, 3]]);
    rows(ctx, palette.deep, [[31, 85, 3, 1], [63, 85, 3, 1]]);
  }

  function drawEye(ctx, x, y, size = 3, pupilOffset = 0, iris = "#67452f") {
    rect(ctx, x, y, size + 2, 1, ink);
    rect(ctx, x, y + 1, size + 2, 4, "#fff4d7");
    rect(ctx, x + 1 + pupilOffset, y + 1, 2, 3, iris);
    rect(ctx, x + 2 + pupilOffset, y + 2, 1, 3, "#28232d");
    rect(ctx, x + 1 + pupilOffset, y + 1, 1, 1, "#ffffff");
    rect(ctx, x + 1, y + 4, size + 2, .5, "#c98573");
  }

  function drawFace(ctx, index) {
    const irises = ["#67452f", "#765033", "#4c443b", "#4b8057", "#416b9e"];
    const iris = irises[index] || irises[0];
    if (index === 0) {
      // Broad grin, bright teeth and raised cheeks.
      rows(ctx, ink, [[39, 21, 7, 2], [51, 21, 7, 2]]);
      drawEye(ctx, 40, 24, 3, 0, iris);
      drawEye(ctx, 52, 24, 3, 0, iris);
      rows(ctx, shadeInk, [[47, 29, 2, 3]]);
      rows(ctx, "#c97868", [[38, 31, 3, 2], [55, 31, 3, 2]]);
      rows(ctx, ink, [[42, 33, 12, 4], [44, 37, 8, 1]]);
      rows(ctx, "#fff0d2", [[44, 34, 8, 1], [45, 35, 6, 1]]);
      rows(ctx, "#cf675d", [[46, 36, 4, 1]]);
    } else if (index === 1) {
      // Raised brows, wide eyes and a clear round "O" mouth.
      rows(ctx, shadeInk, [[39, 20, 7, 1], [52, 20, 7, 1]]);
      rows(ctx, ink, [[40, 19, 5, 1], [53, 19, 5, 1]]);
      rect(ctx, 40, 23, 6, 6, ink);
      rect(ctx, 41, 24, 4, 4, "#fff4d7");
      rect(ctx, 42, 25, 2, 3, iris);
      rect(ctx, 43, 26, 1, 2, "#28232d");
      rect(ctx, 51, 23, 6, 6, ink);
      rect(ctx, 52, 24, 4, 4, "#fff4d7");
      rect(ctx, 53, 25, 2, 3, iris);
      rect(ctx, 54, 26, 1, 2, "#28232d");
      rows(ctx, shadeInk, [[47, 29, 2, 3]]);
      rows(ctx, ink, [[45, 33, 7, 5]]);
      rows(ctx, "#a94f50", [[47, 35, 3, 2]]);
      rows(ctx, "#f1c398", [[47, 33, 3, 1]]);
    } else if (index === 2) {
      // Thick round frames remain separate from the visible eyes.
      rows(ctx, shadeInk, [[39, 21, 7, 1], [51, 21, 7, 1]]);
      drawEye(ctx, 40, 25, 3, 0, iris);
      drawEye(ctx, 52, 25, 3, 0, iris);
      rows(ctx, ink, [
        [39, 23, 7, 1], [38, 24, 1, 6], [39, 30, 7, 1], [45, 24, 1, 6],
        [51, 23, 7, 1], [50, 24, 1, 6], [51, 30, 7, 1], [57, 24, 1, 6], [46, 26, 4, 1]
      ]);
      rows(ctx, "#8fb5b5", [[40, 24, 2, 1], [52, 24, 2, 1]]);
      rows(ctx, shadeInk, [[47, 28, 2, 3]]);
      rows(ctx, ink, [[45, 34, 6, 1], [46, 35, 4, 1]]);
    } else if (index === 3) {
      // A wink and freckles make this expression distinct at native size.
      rows(ctx, shadeInk, [[39, 21, 6, 1], [52, 21, 6, 1]]);
      rows(ctx, ink, [[40, 25, 6, 2], [41, 26, 4, 1]]);
      drawEye(ctx, 52, 24, 3, 0, iris);
      rows(ctx, shadeInk, [[47, 29, 2, 3]]);
      rows(ctx, ink, [[43, 34, 10, 2], [46, 36, 5, 1]]);
      rows(ctx, "#fff0d2", [[45, 34, 6, 1]]);
      rows(ctx, "#8f4d45", [[38, 29, 1, 1], [41, 31, 1, 1], [44, 30, 1, 1], [54, 29, 1, 1], [57, 31, 1, 1], [59, 29, 1, 1], [42, 34, 1, 1], [56, 34, 1, 1]]);
    } else {
      // One angled brow and a crooked smile read as self-assured.
      rows(ctx, ink, [[39, 22, 7, 1], [52, 20, 7, 1]]);
      rows(ctx, shadeInk, [[40, 23, 6, 1], [53, 22, 6, 1]]);
      drawEye(ctx, 40, 25, 3, 0, iris);
      drawEye(ctx, 52, 24, 3, 0, iris);
      rows(ctx, ink, [[48, 29, 2, 3]]);
      rows(ctx, ink, [[43, 34, 8, 1], [49, 33, 4, 1]]);
      rows(ctx, "#fff0d2", [[44, 34, 5, 1]]);
    }
  }

  function drawFaceDetails(ctx, index, palette) {
    // Tiny, sharp highlights read as eyes, skin and expression at phone size.
    const cheek = palette.shade;
    const glint = "#fff8e7";
    if (index === 0) {
      rows(ctx, palette.light, [[39, 32, 1, .5], [57, 32, 1, .5], [45, 34, 2, .5]]);
      rows(ctx, cheek, [[40, 32.5, 1, .5], [56, 32.5, 1, .5]]);
      rows(ctx, glint, [[41, 25, .5, .5], [53, 25, .5, .5]]);
      rows(ctx, "#b75255", [[44, 37, 2, .5], [50, 37, 2, .5]]);
    } else if (index === 1) {
      rows(ctx, palette.light, [[47, 30, 1, 1], [48, 31, 1, 1]]);
      rows(ctx, cheek, [[45, 35, 1, .5], [51, 35, 1, .5]]);
      rows(ctx, glint, [[42, 25, .5, .5], [54, 25, .5, .5]]);
      rows(ctx, ink, [[39, 18, 2, .5], [54, 18, 2, .5]]);
    } else if (index === 2) {
      rows(ctx, "#9bc7ca", [[40, 24, 1, 1], [52, 24, 1, 1]]);
      rows(ctx, glint, [[41, 25, .5, .5], [53, 25, .5, .5]]);
      rows(ctx, "#c6a66d", [[38, 23, .5, 7], [57.5, 23, .5, 7], [46, 26, 4, .5]]);
      rows(ctx, cheek, [[47, 30, 1, 1]]);
    } else if (index === 3) {
      rows(ctx, cheek, [[38.5, 29, .5, .5], [40.5, 31, .5, .5], [55, 29.5, .5, .5], [57, 31, .5, .5]]);
      rows(ctx, glint, [[54, 25, .5, .5]]);
      rows(ctx, palette.light, [[44, 35, .5, .5], [50, 35, .5, .5]]);
    } else {
      rows(ctx, palette.light, [[40, 29, 1, .5], [55, 29, 1, .5]]);
      rows(ctx, glint, [[41, 26, .5, .5], [53, 25, .5, .5]]);
      rows(ctx, ink, [[42, 34, 2, .5], [50, 33, 2, .5]]);
      rows(ctx, cheek, [[39, 32, 1, .5], [57, 31, 1, .5]]);
    }
    // A softly stepped nose bridge and nostril make the face read as more than eyes and mouth.
    rows(ctx, palette.light, [[47.5, 28, .5, 1], [47, 29, .5, .5]]);
    rows(ctx, palette.deep, [[48, 30, .5, .5]]);
  }

  function drawHairCap(ctx, colors) {
    rows(ctx, ink, [[41, 7, 14, 3], [37, 9, 22, 3], [34, 12, 28, 3], [33, 15, 30, 3], [33, 18, 30, 3], [36, 20, 24, 1]]);
    rows(ctx, colors[1], [[42, 9, 12, 2], [38, 12, 20, 2], [36, 14, 24, 2], [35, 16, 26, 3], [35, 19, 24, 2]]);
    rows(ctx, colors[0], [[39, 14, 3, 7], [57, 13, 2, 6], [35, 18, 3, 3]]);
    rows(ctx, colors[2], [[42, 10, 5, 1], [38, 13, 4, 1], [47, 14, 5, 1], [53, 16, 4, 1]]);
  }

  function drawHair(ctx, index) {
    const colors = hairPalettes[index];
    drawHairCap(ctx, colors);
    if (index === 0) {
      rows(ctx, ink, [[34, 12, 5, 5], [39, 9, 6, 5], [46, 7, 7, 5], [53, 10, 7, 5], [59, 14, 4, 5], [34, 20, 4, 5], [58, 20, 4, 5]]);
      rows(ctx, colors[1], [[35, 13, 3, 2], [41, 10, 3, 2], [48, 8, 4, 2], [55, 11, 3, 2], [60, 15, 2, 2], [35, 21, 2, 2], [59, 21, 2, 2]]);
      rows(ctx, colors[2], [[38, 10, 2, 1], [51, 9, 2, 1], [56, 13, 1, 1]]);
    } else if (index === 1) {
      rows(ctx, ink, [[33, 18, 6, 20], [35, 36, 7, 12], [58, 18, 6, 20], [56, 36, 7, 12], [36, 44, 7, 5], [55, 44, 7, 5]]);
      rows(ctx, colors[1], [[35, 20, 3, 14], [37, 34, 4, 10], [60, 20, 2, 14], [57, 34, 4, 10], [38, 44, 3, 3], [56, 44, 3, 3]]);
      rows(ctx, colors[2], [[36, 22, 1, 8], [39, 38, 1, 6], [59, 23, 1, 9], [57, 39, 1, 6], [39, 46, 2, 1]]);
      rows(ctx, colors[0], [[36, 29, 2, 3], [39, 32, 2, 3], [36, 36, 2, 3], [58, 29, 2, 3], [55, 32, 2, 3], [58, 36, 2, 3]]);
      rows(ctx, colors[0], [[35, 30, 2, 5], [60, 30, 2, 5], [37, 41, 2, 4], [57, 41, 2, 4]]);
    } else if (index === 2) {
      rows(ctx, ink, [[33, 18, 5, 20], [58, 18, 5, 20], [31, 34, 7, 12], [58, 34, 7, 12], [31, 44, 6, 7], [59, 44, 6, 7]]);
      rows(ctx, colors[1], [[34, 20, 3, 14], [60, 20, 2, 14], [33, 36, 3, 8], [61, 36, 2, 8], [32, 45, 4, 4], [60, 45, 4, 4]]);
      rows(ctx, ink, [[31, 49, 5, 5], [59, 49, 5, 5]]);
      rows(ctx, colors[2], [[32, 34, 2, 3], [34, 37, 2, 3], [32, 40, 2, 3], [34, 43, 2, 3], [32, 46, 2, 3], [60, 34, 2, 3], [62, 37, 2, 3], [60, 40, 2, 3], [62, 43, 2, 3], [60, 46, 2, 3]]);
      rows(ctx, colors[0], [[34, 35, 2, 2], [32, 38, 2, 2], [34, 41, 2, 2], [32, 44, 2, 2], [34, 47, 2, 2], [62, 35, 2, 2], [60, 38, 2, 2], [62, 41, 2, 2], [60, 44, 2, 2], [62, 47, 2, 2]]);
      rows(ctx, colors[2], [[32, 50, 2, 2], [61, 50, 2, 2]]);
      rows(ctx, "#e7bd59", [[32, 54, 2, 2], [62, 54, 2, 2]]);
      rows(ctx, colors[0], [[35, 30, 2, 4], [59, 30, 2, 4], [32, 40, 2, 3], [62, 40, 1, 3]]);
    } else if (index === 3) {
      rows(ctx, ink, [[33, 17, 5, 22], [58, 17, 5, 22], [35, 36, 7, 11], [55, 36, 7, 11]]);
      rows(ctx, colors[1], [[35, 20, 3, 15], [59, 20, 2, 14], [37, 37, 4, 8], [57, 37, 3, 8]]);
      rows(ctx, ink, [[36, 19, 6, 4], [42, 20, 5, 4], [47, 20, 5, 4], [52, 19, 6, 4]]);
      rows(ctx, colors[1], [[38, 20, 7, 2], [47, 20, 7, 2], [43, 22, 7, 1]]);
      rows(ctx, colors[2], [[39, 12, 4, 1], [51, 13, 4, 1], [43, 16, 4, 1]]);
    } else {
      rows(ctx, ink, [[51, 2, 10, 5], [57, 5, 8, 7], [61, 10, 8, 7], [59, 16, 8, 6], [55, 19, 7, 4]]);
      rows(ctx, colors[1], [[53, 3, 7, 3], [59, 7, 5, 4], [63, 12, 4, 4], [61, 17, 4, 3]]);
      rows(ctx, colors[2], [[55, 4, 3, 1], [61, 9, 2, 1], [64, 13, 2, 1]]);
      rows(ctx, ink, [[33, 18, 5, 21], [58, 18, 5, 20], [35, 36, 6, 9], [57, 35, 6, 9]]);
      rows(ctx, colors[1], [[35, 20, 3, 14], [60, 20, 2, 13], [37, 37, 3, 6], [58, 36, 3, 6]]);
      rows(ctx, colors[2], [[36, 22, 1, 8], [60, 23, 1, 8]]);
    }
  }

  function drawHairDetails(ctx, index) {
    const colors = hairPalettes[index];
    const fine = colors[2];
    const shade = colors[0];
    const strands = [
      [[37, 13, .5, 2], [42, 10, .5, 2], [49, 9, .5, 2], [56, 13, .5, 2], [36, 22, .5, 3], [60, 22, .5, 3]],
      [[36, 22, .5, 9], [39, 36, .5, 7], [59, 22, .5, 10], [56, 37, .5, 7], [38, 45, .5, 2], [57, 45, .5, 2]],
      [[34, 27, .5, 6], [36, 33, .5, 6], [61, 27, .5, 6], [59, 34, .5, 6], [33, 45, .5, 3], [62, 45, .5, 3]],
      [[36, 21, .5, 7], [42, 20, .5, 6], [49, 20, .5, 6], [56, 20, .5, 7], [37, 34, .5, 5], [57, 34, .5, 5]],
      [[54, 4, .5, 3], [60, 9, .5, 3], [64, 14, .5, 3], [61, 19, .5, 3], [56, 23, .5, 2], [36, 21, .5, 8], [59, 21, .5, 8]]
    ];
    for (const [x, y, width, height] of strands[index] || strands[0]) {
      rect(ctx, x, y, width, height, fine);
    }
    // Short shadow slivers give curls and braids a layered, tactile edge.
    const shadowMarks = [
      [[35, 15, .5, 1], [47, 12, .5, 1], [59, 17, .5, 1]],
      [[37, 29, .5, 4], [58, 29, .5, 4], [40, 41, .5, 3], [55, 41, .5, 3]],
      [[33, 38, .5, 3], [36, 44, .5, 3], [61, 38, .5, 3], [58, 44, .5, 3]],
      [[39, 25, .5, 4], [46, 23, .5, 4], [53, 25, .5, 4]],
      [[63, 15, .5, 3], [59, 21, .5, 3], [54, 25, .5, 2]]
    ];
    for (const [x, y, width, height] of shadowMarks[index] || shadowMarks[0]) {
      rect(ctx, x, y, width, height, shade);
    }
  }

  function drawClothingFinish(ctx, index) {
    const colors = outfits[index];
    const seam = colors.light;
    const shade = colors.shade;
    if (index === 0) {
      // Top-stitching, pocket folds, eyelets and cord tips on the hoodie.
      rows(ctx, seam, [[35, 76.5, 5, .5], [57, 76.5, 5, .5], [40, 78, 14, .5], [38, 55, .5, 10], [59.5, 55, .5, 10]]);
      rows(ctx, colors.trim, [[43.5, 51, .5, .5], [51, 51, .5, .5], [44, 61, .5, .5], [51, 61, .5, .5], [43.5, 63, .5, .5], [51, 63, .5, .5]]);
      rows(ctx, shade, [[43, 72, 1, .5], [54, 72, 1, .5], [41, 74, .5, .5], [56.5, 74, .5, .5]]);
      rows(ctx, colors.trim, [[46, 72, 1, .5], [50, 72, 1, .5]]);
    } else if (index === 1) {
      // Jacket top-stitching, metal snaps, lapel edges and pocket seams.
      rows(ctx, seam, [[34.5, 53, .5, 13], [61, 53, .5, 13], [36, 76, 7, .5], [53, 76, 7, .5], [42, 51, .5, 25], [53.5, 51, .5, 25]]);
      rows(ctx, colors.trim, [[47.5, 56, .5, .5], [47.5, 64, .5, .5], [47.5, 72, .5, .5], [38, 70, .5, 1], [56, 70, .5, 1]]);
      rows(ctx, shade, [[37, 66, 6, .5], [54, 66, 6, .5]]);
    } else if (index === 2) {
      // Fine knit ribs and alternate threads sit between the larger sweater diamonds.
      rows(ctx, seam, [[35, 54, .5, 22], [59.5, 54, .5, 22], [37, 80, 22, .5], [40, 55, .5, 2], [55.5, 61, .5, 2], [43, 70, .5, 2]]);
      rows(ctx, shade, [[36, 57, .5, 2], [58, 64, .5, 2], [41, 74, .5, 2], [53, 55, .5, 2]]);
      rows(ctx, colors.trim, [[38, 83, .5, 1], [41, 83, .5, 1], [44, 83, .5, 1], [53, 83, .5, 1], [56, 83, .5, 1], [59, 83, .5, 1]]);
    } else if (index === 3) {
      // Bib seams, reinforced knees and tiny brass buckle centres.
      rows(ctx, seam, [[40, 54, .5, 28], [56.5, 54, .5, 28], [41, 79, 15, .5], [38, 100, 8, .5], [51, 100, 8, .5]]);
      rows(ctx, colors.trim, [[39, 49, 2, .5], [55, 49, 2, .5], [40, 52, .5, 1], [56, 52, .5, 1], [43, 61, 10, .5], [43, 66, 10, .5]]);
      rows(ctx, shade, [[38, 96, .5, 4], [57.5, 96, .5, 4], [41, 77, .5, 3], [54.5, 77, .5, 3]]);
    } else {
      // Shirt placket, collar tips, button holes and a neatly edged chest pocket.
      rows(ctx, seam, [[40, 52, .5, 23], [55.5, 52, .5, 23], [39, 66, 6, .5], [53, 66, 6, .5], [40, 48, 6, .5], [54, 48, 6, .5]]);
      rows(ctx, colors.trim, [[47.5, 54, .5, .5], [47.5, 60, .5, .5], [47.5, 66, .5, .5], [47.5, 72, .5, .5]]);
      rows(ctx, shade, [[47, 55, .5, 2], [48, 61, .5, 2], [47, 67, .5, 2], [41, 68, 5, .5], [54, 68, 5, .5]]);
    }
    // Shared cuff and trouser-fold highlights keep the same materials dimensional.
    rows(ctx, seam, [[30, 67, 5, .5], [61, 67, 5, .5], [37, 96, .5, 7], [58, 96, .5, 7], [34, 113, 8, .5], [51, 113, 8, .5]]);
    rows(ctx, shade, [[36, 105, .5, 3], [59.5, 105, .5, 3], [43, 115, 5, .5], [54, 115, 5, .5]]);
  }

  function draw(ctx, selection) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(2, 2);
    const skinPalette = skin[selection.skin] || skin[0];
    drawBody(ctx, skinPalette);
    drawOutfit(ctx, selection.clothes);
    drawHands(ctx, skinPalette);
    drawFace(ctx, selection.face);
    drawFaceDetails(ctx, selection.face, skinPalette);
    drawHair(ctx, selection.hair);
    drawHairDetails(ctx, selection.hair);
  }

  return { labels, draw };
})();
