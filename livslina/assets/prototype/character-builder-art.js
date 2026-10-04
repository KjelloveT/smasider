/* Pixel art for the Livslina character-layer test. Every part uses a 96 × 128 canvas. */
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
    face: ["Lunt smil", "Nysgjerrig", "Med briller", "Fregner", "Sjølvsikkert"],
    hair: ["Kort krøllhår", "Langt bølgjehår", "Fletter", "Rett lugg", "Høg hestehale"],
    clothes: ["Blå hettegenser", "Rustraud jakke", "Lilla genser", "Grøn overall", "Turkis skjorte"]
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

  function drawOutfit(ctx, index) {
    const colors = outfits[index];
    drawTrousers(ctx, colors, index);
    drawShirtShape(ctx, colors, index);
    drawShoes(ctx, colors, index);
    // Small fixed waist and seam details make every outfit readable at native size.
    rows(ctx, colors.trim, [[39, 88, 18, 1]]);
  }

  function drawHands(ctx, palette) {
    rows(ctx, ink, [[27, 79, 9, 8], [60, 79, 9, 8]]);
    rows(ctx, palette.base, [[29, 80, 5, 5], [62, 80, 5, 5]]);
    rows(ctx, palette.light, [[30, 80, 2, 1], [63, 80, 2, 1]]);
    rows(ctx, palette.shade, [[28, 83, 2, 3], [66, 83, 2, 3]]);
    rows(ctx, palette.deep, [[31, 85, 3, 1], [63, 85, 3, 1]]);
  }

  function drawEye(ctx, x, y, size = 3, pupilOffset = 0) {
    rect(ctx, x, y, size + 2, 2, ink);
    rect(ctx, x + 1 + pupilOffset, y + 1, 2, 2, "#fff4d7");
    rect(ctx, x + 2 + pupilOffset, y + 1, 1, 2, "#28232d");
  }

  function drawFace(ctx, index) {
    if (index === 0) {
      rows(ctx, shadeInk, [[39, 22, 6, 1], [51, 22, 6, 1]]);
      drawEye(ctx, 40, 25, 3);
      drawEye(ctx, 52, 25, 3);
      rows(ctx, shadeInk, [[47, 28, 2, 3]]);
      rows(ctx, ink, [[43, 33, 10, 2], [45, 35, 6, 1]]);
      rows(ctx, "#f0a07e", [[46, 33, 4, 1]]);
    } else if (index === 1) {
      rows(ctx, ink, [[39, 21, 7, 2], [52, 22, 6, 1]]);
      drawEye(ctx, 40, 25, 3, 1);
      drawEye(ctx, 52, 25, 3, 1);
      rows(ctx, shadeInk, [[47, 28, 2, 4]]);
      rows(ctx, ink, [[45, 34, 6, 2]]);
      rows(ctx, "#fff0d2", [[46, 34, 4, 1]]);
    } else if (index === 2) {
      rows(ctx, shadeInk, [[39, 22, 7, 1], [51, 22, 7, 1]]);
      drawEye(ctx, 40, 25, 3);
      drawEye(ctx, 52, 25, 3);
      rows(ctx, ink, [[38, 24, 1, 7], [47, 24, 2, 2], [58, 24, 1, 7], [39, 24, 8, 1], [50, 24, 8, 1], [39, 30, 8, 1], [50, 30, 8, 1]]);
      rows(ctx, shadeInk, [[47, 28, 2, 3]]);
      rows(ctx, ink, [[44, 34, 8, 1], [46, 35, 4, 1]]);
      rows(ctx, "#fff4d7", [[39, 25, 2, 1], [50, 25, 2, 1]]);
    } else if (index === 3) {
      rows(ctx, shadeInk, [[39, 22, 6, 1], [52, 22, 6, 1]]);
      drawEye(ctx, 40, 25, 3);
      drawEye(ctx, 52, 25, 3);
      rows(ctx, shadeInk, [[47, 28, 2, 3]]);
      rows(ctx, ink, [[44, 33, 8, 2]]);
      rows(ctx, "#f0a07e", [[45, 33, 6, 1]]);
      rows(ctx, "#8f4d45", [[39, 29, 1, 1], [42, 31, 1, 1], [55, 30, 1, 1], [58, 29, 1, 1], [41, 34, 1, 1], [56, 34, 1, 1]]);
    } else {
      rows(ctx, ink, [[39, 22, 7, 2], [52, 21, 7, 2]]);
      rows(ctx, shadeInk, [[40, 24, 5, 1], [53, 24, 5, 1]]);
      drawEye(ctx, 40, 25, 3);
      drawEye(ctx, 52, 25, 3);
      rows(ctx, shadeInk, [[47, 28, 2, 4]]);
      rows(ctx, ink, [[43, 34, 10, 1], [45, 35, 6, 1]]);
    }
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

  function draw(ctx, selection) {
    ctx.clearRect(0, 0, 96, 128);
    ctx.imageSmoothingEnabled = false;
    const skinPalette = skin[selection.skin] || skin[0];
    drawBody(ctx, skinPalette);
    drawOutfit(ctx, selection.clothes);
    drawHands(ctx, skinPalette);
    drawFace(ctx, selection.face);
    drawHair(ctx, selection.hair);
  }

  return { labels, draw };
})();
