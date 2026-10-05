/* Prepacked full-frame layers. Selection changes never fit or alter pixels. */
window.LivslinaCharacterArt = (() => {
  const model = window.LivslinaCharacterModel;
  const scriptURL = document.currentScript.src;
  const labels = {
    skin: ["Ljos varm", "Ljos nøytral", "Mellomvarm", "Djup brun", "Mørk brun"],
    face: ["Breitt smil", "Briller", "Overraska", "Blink og fregner", "Sjølvsikker", "Lattermild", "Søvnig", "Nysgjerrig", "Bekymra", "Konsentrert", "Roleg smil", "Lunt glis", "Sidemil", "Tenksam", "Konsentrert blikk", "Latter", "Varsamt uroleg", "Søvnig sideblikk", "Overraska", "Skeptisk smil"],
    hair: ["Kort krøllhår", "Langt bølgjehår", "Fletter", "Rett lugg", "Høg hestehale", "Rufsete quiff", "Tett krølltopp", "Sidesveipt pixie", "Kjevelang blåsvart bob", "Luftig blond kortklipp", "Låg fade med tette krøllar", "Brun sideskill", "Koparraud rufseklipp", "Lys kort quiff", "Svarte 360-bølgjer", "Korte tvinnar", "Mørk maskinklipp", "Blåsvart undercut med turkis lokk", "Tett krølltopp med fade", "Kort mørk framoverklipp"],
    clothes: ["Blå hettegenser", "Rustraud jakke", "Lilla strikkegenser", "Grøn overall", "Turkis skjorte", "Burgunder varsityjakke", "Lilla cardigan og skjørt", "Rutete flanell og cargobukse", "Blått treningssett", "Salviegrøn rugbyskorte"]
  };
  const fileFamilies = { body: "skin-body", hands: "skin-hands", clothes: "clothes", face: "face", hairBack: "hair-back", hairFront: "hair-front" };
  const counts = { body: 5, hands: 5, clothes: 10, face: 20, hairBack: 20, hairFront: 20 };
  const images = {};
  let ready = false;
  let loadError = "";
  let loadedCount = 0;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  function overlay(ctx) {
    ctx.save();
    ctx.scale(model.scale, model.scale);
    ctx.lineWidth = .5;
    ctx.strokeStyle = "#4b3424";
    ctx.fillStyle = "#fff9e9";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(model.centerX, 8); ctx.lineTo(model.centerX, 365);
    ctx.moveTo(30, model.groundY); ctx.lineTo(226, model.groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "6px sans-serif";
    ctx.textAlign = "center";
    for (const anchor of model.anchors) {
      ctx.fillRect(anchor.x - 2, anchor.y - 2, 4, 4);
      ctx.strokeRect(anchor.x - 2, anchor.y - 2, 4, 4);
      const textWidth = ctx.measureText(anchor.label).width;
      ctx.fillRect(anchor.x - textWidth / 2 - 1, anchor.y + 3, textWidth + 2, 7);
      ctx.fillStyle = "#000";
      ctx.fillText(anchor.label, anchor.x, anchor.y + 9);
      ctx.fillStyle = "#fff9e9";
    }
    ctx.restore();
  }

  function draw(ctx, selection, options = {}) {
    if (!ready) return false;
    const visible = { body: true, clothes: true, face: true, hairBack: true, hairFront: true, ...options.visible };
    const index = (family) => Math.max(0, Math.min(labels[family].length - 1, Number(selection[family]) || 0));
    const layers = {
      hairBack: images.hairBack[index("hair")],
      body: images.body[index("skin")],
      clothes: images.clothes[index("clothes")],
      hands: images.hands[index("skin")],
      face: images.face[index("face")],
      hairFront: images.hairFront[index("hair")]
    };
    const scaleX = ctx.canvas.width / model.assetWidth;
    const scaleY = ctx.canvas.height / model.assetHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.imageSmoothingEnabled = false;
    for (const name of model.layerOrder) {
      if (visible[name === "hands" ? "body" : name]) ctx.drawImage(layers[name], 0, 0, model.assetWidth, model.assetHeight);
    }
    if (options.anchors) overlay(ctx);
    return true;
  }

  const pending = [];
  for (const [family, prefix] of Object.entries(fileFamilies)) {
    images[family] = [];
    for (let i = 0; i < counts[family]; i++) pending.push(new Promise((resolve, reject) => {
      const filename = prefix + "-" + String(i + 1).padStart(2, "0") + ".png";
      const image = new Image();
      image.addEventListener("load", () => {
        if (image.naturalWidth !== model.assetWidth || image.naturalHeight !== model.assetHeight) {
          reject(new Error(filename + " har feil fullrammemål (" + image.naturalWidth + " × " + image.naturalHeight + ")."));
          return;
        }
        images[family][i] = image;
        loadedCount++;
        window.dispatchEvent(new CustomEvent("livslina:character-art-progress", { detail: { loaded: loadedCount, total } }));
        resolve();
      }, { once: true });
      image.addEventListener("error", () => reject(new Error("Kunne ikkje laste " + filename + ".")), { once: true });
      image.src = new URL("characters/v5/" + filename, scriptURL).href;
    }));
  }
  const whenReady = Promise.all(pending).then(() => {
    ready = true;
    window.dispatchEvent(new Event("livslina:character-art-ready"));
    return true;
  }).catch((error) => {
    loadError = error.message;
    window.dispatchEvent(new CustomEvent("livslina:character-art-error", { detail: { message: loadError } }));
    return false;
  });

  return { labels, draw, whenReady, get ready() { return ready; }, get error() { return loadError; } };
})();
