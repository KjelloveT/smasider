(function (root) {
  'use strict';
  const F = root.Fykefuga;
  function create(stage) {
    const question = stage.querySelector('[data-retray-question]');
    const upper = stage.querySelector('[data-retray-upper]');
    const lower = stage.querySelector('[data-retray-lower]');
    function hide() { [question, upper, lower].forEach(node => { node.hidden = true; }); }
    function update(choice, screen) {
      if (!choice || !screen) { hide(); return; }
      const width = stage.clientWidth / 960, height = stage.clientHeight / 540;
      const x = screen.x * width;
      question.textContent = choice.item.prompt;
      question.hidden = false;
      question.style.left = x + 'px';
      const above = (screen.playerY - 31 * screen.zoom) * height;
      const below = (screen.playerY + 31 * screen.zoom) * height;
      if (above - question.offsetHeight < 6) {
        question.style.top = Math.min(stage.clientHeight - question.offsetHeight - 6, below) + 'px';
        question.classList.add('ff-retray-question--below');
      } else {
        question.style.top = above + 'px';
        question.classList.remove('ff-retray-question--below');
      }
      const lanes = F.ReTray.lanes(choice.section);
      const answerX = (screen.x + (choice.section.from - screen.worldX) * screen.zoom + 25) * width;
      [upper, lower].forEach((node, index) => {
        const laneY = index ? lanes.lower : lanes.upper;
        const y = (300 + (laneY - screen.focusY) * screen.zoom + screen.shake) * height;
        node.hidden = answerX < -30 || answerX > stage.clientWidth - 8 || y < 0 || y > stage.clientHeight;
        node.textContent = index ? choice.lower : choice.upper;
        node.style.left = answerX + 'px'; node.style.top = y + 'px';
      });
    }
    return { update, hide };
  }
  F.ReTrayHud = { create };
})(window);
