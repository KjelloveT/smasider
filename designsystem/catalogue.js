/* Dømeåtferd i katalogen. Ingen lagring eller endringar i dei eksisterande appane. */
(function () {
  'use strict';
  const backgrounds = [
    { file: 'sommar-dag', label: 'sommar, dag' },
    { file: 'sommar-kveld', label: 'sommar, kveld' },
    { file: 'vinter-dag', label: 'vinter, dag' }
  ];
  let backgroundIndex = 0;
  document.addEventListener('DOMContentLoaded', () => {
  });
  document.getElementById('backgroundBtn').addEventListener('click', () => {
    backgroundIndex = (backgroundIndex + 1) % backgrounds.length;
    const background = backgrounds[backgroundIndex];
    const url = new URL(`../_resources/vyrdepil-design/landscapes/${background.file}.jpg`, location.href);
    document.body.style.setProperty('--vp-landscape', `url("${url}")`);
    document.getElementById('backgroundLabel').textContent = `Landskap: ${background.label}`;
  });

  document.querySelectorAll('[data-layout]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-layout]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('.vp-layout-demo').forEach(panel => { panel.hidden = panel.id !== `layout-${button.dataset.layout}`; });
    });
  });
  const dialog = document.getElementById('exampleDialog');
  document.querySelectorAll('[data-open-dialog]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  document.getElementById('taskBtn').addEventListener('click', () => {
    const count = document.querySelectorAll('input[name="pack"]:checked').length;
    document.getElementById('taskResult').textContent = count ? `Du har valt ${count} ting. God tur!` : 'Vel noko å ta med fyrst.';
  });
  const pressed = document.getElementById('pressedBtn');
  pressed.addEventListener('click', () => {
    const next = pressed.getAttribute('aria-pressed') !== 'true';
    pressed.setAttribute('aria-pressed', String(next));
    pressed.querySelector('.vp-button-label').textContent = next ? 'Valt' : 'Vel dette';
  });
  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tool]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  document.getElementById('addDeskBtn').addEventListener('click', () => {
    const desk = document.createElement('span');
    desk.className = 'catalogue-desk'; desk.textContent = 'Ny pult';
    document.querySelector('.catalogue-map').append(desk);
  });

  const canvas = document.getElementById('gamePreview');
  const ctx = canvas.getContext('2d');
  function drawScene(active) {
    ctx.fillStyle = '#d6e8f1'; ctx.fillRect(0,0,960,540);
    ctx.fillStyle = '#fff9e9';
    [[210,105,60],[620,80,50],[805,120,70]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#aac18d'; ctx.beginPath(); ctx.moveTo(0,290); ctx.quadraticCurveTo(280,180,500,330); ctx.quadraticCurveTo(710,170,960,280); ctx.lineTo(960,540); ctx.lineTo(0,540); ctx.fill();
    ctx.fillStyle = '#74915f'; ctx.beginPath(); ctx.moveTo(0,410); ctx.quadraticCurveTo(500,260,960,430); ctx.lineTo(960,540); ctx.lineTo(0,540); ctx.fill();
    ctx.fillStyle = '#f5dfaa'; ctx.beginPath(); ctx.moveTo(0,490); ctx.quadraticCurveTo(500,410,960,485); ctx.lineTo(960,540); ctx.lineTo(0,540); ctx.fill();
    ctx.fillStyle = '#e4e7e5'; ctx.strokeStyle = '#142820'; ctx.lineWidth = 5;
    [150,440,730].forEach((x,i) => { ctx.beginPath(); ctx.ellipse(x,455 - i * 12,46,25,0,0,Math.PI * 2); ctx.fill(); ctx.stroke(); });
    if (active) { ctx.strokeStyle = '#f5dfaa'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(440,443,62,38,0,0,Math.PI * 2); ctx.stroke(); }
  }
  drawScene(false);
  let gameActive = false;
  const gameBtn = document.getElementById('gameBtn');
  gameBtn.addEventListener('click', () => {
    gameActive = !gameActive; drawScene(gameActive);
    gameBtn.lastChild.textContent = gameActive ? 'Stopp visinga' : 'Prøv visinga';
    document.getElementById('gameState').textContent = gameActive ? 'Dømevising i gang' : 'Klar';
  });
})();
