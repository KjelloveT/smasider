(() => {
  const canvas = document.getElementById("character");
  const context = canvas.getContext("2d", { alpha: true });
  const summary = document.getElementById("selected-summary");
  const stage = document.getElementById("character-stage");
  const families = ["skin", "face", "hair", "clothes"];
  const selection = { skin: 0, face: 0, hair: 0, clothes: 0 };
  const options = { visible: {}, anchors: false };
  const groups = [...document.querySelectorAll(".choice-group")];
  const art = window.LivslinaCharacterArt;

  function render() {
    if (!art.draw(context, selection, options)) return;
    const names = families.map((family) => art.labels[family][selection[family]]);
    summary.textContent = `Hud: ${names[0]} · andlet: ${names[1]} · hår: ${names[2]} · klede: ${names[3]}`;
    canvas.setAttribute("aria-label", `Karakter med ${names[0].toLowerCase()} hud, ${names[1].toLowerCase()}, ${names[2].toLowerCase()} og ${names[3].toLowerCase()}`);
    for (const group of groups) {
      for (const button of group.querySelectorAll("[data-option]")) {
        button.setAttribute("aria-pressed", String(Number(button.dataset.option) === selection[group.dataset.family]));
      }
    }
  }

  for (const group of groups) {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-option]");
      if (!button || button.disabled) return;
      selection[group.dataset.family] = Number(button.dataset.option);
      render();
    });
  }

  document.getElementById("randomize").addEventListener("click", () => {
    for (const family of families) selection[family] = Math.floor(Math.random() * art.labels[family].length);
    render();
  });

  document.getElementById("reset").addEventListener("click", () => {
    for (const family of families) selection[family] = 0;
    render();
  });

  for (const input of document.querySelectorAll("input[data-layer]")) {
    input.addEventListener("change", () => {
      options.visible[input.dataset.layer] = input.checked;
      render();
    });
  }
  document.getElementById("show-anchors").addEventListener("change", (event) => {
    options.anchors = event.target.checked;
    render();
  });

  for (const button of document.querySelectorAll("button[data-zoom]")) {
    button.addEventListener("click", () => {
      stage.dataset.zoom = button.dataset.zoom;
      for (const candidate of document.querySelectorAll("button[data-zoom]")) {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      }
    });
  }

  window.addEventListener("livslina:character-art-progress", (event) => {
    summary.textContent = `Lastar figurressursar: ${event.detail.loaded} av ${event.detail.total} …`;
  });
  art.whenReady.then((loaded) => {
    if (!loaded) {
      summary.textContent = `Figurressursane kunne ikkje lastast. ${art.error}`;
      canvas.setAttribute("aria-label", "Figurressursane kunne ikkje lastast");
      return;
    }
    for (const button of document.querySelectorAll(".toolbar button, .choice-group button")) button.disabled = false;
    render();
  });
})();
