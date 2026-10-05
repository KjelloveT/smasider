/* Full-frame character contract. All coordinates below are logical pixels. */
window.LivslinaCharacterModel = (() => {
  const width = 256;
  const height = 384;
  const scale = 2;
  const skinRegions = {
    // Master clothing starts below this crop. Its alpha supplies the head outline.
    head: [[75, 32, 106, 104]],
    hands: [[48, 212, 31, 62], [177, 212, 31, 62]]
  };
  // The bare neck ends at 149. Rows 150–153 contain the calibration shirt collar.
  const neckPolygon = [[114, 131], [142, 131], [142, 145], [138, 147], [133, 149], [122, 149], [116, 147], [114, 145]];
  const headBounds = { left: 89, right: 167, top: 42, bottom: 132 };
  const earBounds = { left: 77, right: 179, top: 85, bottom: 109 };
  const anchors = [
    { id: "eye-left", label: "Auge", x: 108, y: 94 },
    { id: "eye-right", label: "Auge", x: 148, y: 94 },
    { id: "nose", label: "Nase", x: 128, y: 108 },
    { id: "mouth", label: "Munn", x: 128, y: 123 },
    { id: "neck", label: "Hals", x: 128, y: 143 },
    { id: "shoulder-left", label: "Skulder", x: 78, y: 163 },
    { id: "shoulder-right", label: "Skulder", x: 178, y: 163 },
    { id: "wrist-left", label: "Handledd", x: 63, y: 247 },
    { id: "wrist-right", label: "Handledd", x: 193, y: 247 },
    { id: "hand-left", label: "Hand", x: 63, y: 258 },
    { id: "hand-right", label: "Hand", x: 193, y: 258 },
    { id: "shoe-left", label: "Sko", x: 106, y: 361 },
    { id: "shoe-right", label: "Sko", x: 150, y: 361 }
  ];

  function neckPath(ctx) {
    ctx.beginPath();
    neckPolygon.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }

  // Feature protection follows the inner head shape rather than a rectangular cut.
  function faceProtectionPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(100, 83);
    ctx.quadraticCurveTo(128, 76, 156, 83);
    ctx.quadraticCurveTo(170, 97, 160, 121);
    ctx.quadraticCurveTo(149, 132, 128, 133);
    ctx.quadraticCurveTo(107, 132, 96, 121);
    ctx.quadraticCurveTo(86, 97, 100, 83);
    ctx.closePath();
  }

  const skinRamps = [
    ["#814c3c", "#b77858", "#dca17b", "#f2c7a0", "#ffe5c4"],
    ["#765045", "#aa7860", "#c99b82", "#e3bfa3", "#f5ddc1"],
    ["#58372d", "#85523b", "#ad7150", "#ce9566", "#e8b884"],
    ["#34251f", "#57382b", "#7a4b35", "#9e6849", "#bb895e"],
    ["#221b1a", "#392822", "#563b2e", "#73503b", "#926a49"]
  ];

  // Optional manual registrations may only be added after visual validation.
  // Values are { x, y, scale }, with x/y in logical pixels and a uniform scale.
  // An absent entry means precisely (0, 0, 1); image bounds never choose a fit.
  const registrations = {};
  return {
    version: 5, width, height, scale,
    assetWidth: width * scale, assetHeight: height * scale,
    groundY: 361, centerX: 128, alphaCutoff: 200,
    skinRampStops: [55, 110, 160, 210, 255],
    anchors, skinRegions, skinRamps, headBounds, earBounds, neckPolygon,
    faceProtectionPath, neckPath, registrations,
    layerOrder: ["hairBack", "body", "hands", "clothes", "face", "hairFront"]
  };
})();
