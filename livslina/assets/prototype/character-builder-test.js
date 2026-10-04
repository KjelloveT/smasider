(() => {
  const canvas = document.getElementById("character");
  const context = canvas.getContext("2d", { alpha: true });
  const summary = document.getElementById("selected-summary");
  const families = ["skin", "face", "hair", "clothes"];
  const selection = { skin: 0, face: 0, hair: 0, clothes: 0 };
  const groups = [...document.querySelectorAll(".choice-group")];

  function render() {
    if (!window.LivslinaCharacterArt.draw(context, selection)) return;
    const names = families.map((family) => window.LivslinaCharacterArt.labels[family][selection[family]]);
    summary.textContent = `Hud: ${names[0]} · andlet: ${names[1]} · hår: ${names[2]} · klede: ${names[3]}`;
    canvas.setAttribute("aria-label", `Karakter med ${names[0]} hud, ${names[1].toLowerCase()}, ${names[2].toLowerCase()} og ${names[3].toLowerCase()}`);

    for (const group of groups) {
      const family = group.dataset.family;
      for (const button of group.querySelectorAll("[data-option]")) {
        const selected = Number(button.dataset.option) === selection[family];
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    }
  }

  for (const group of groups) {
    group.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-option]");
      if (!button) return;
      selection[group.dataset.family] = Number(button.dataset.option);
      render();
    });
  }

  document.getElementById("randomize").addEventListener("click", () => {
    for (const family of families) selection[family] = Math.floor(Math.random() * 5);
    render();
  });

  document.getElementById("reset").addEventListener("click", () => {
    for (const family of families) selection[family] = 0;
    render();
  });

  window.addEventListener("livslina:character-art-ready", render, { once: true });
  window.addEventListener("livslina:character-art-error", () => {
    summary.textContent = "Figurressursane kunne ikkje lastast.";
  }, { once: true });
  render();
})();
