/* Ei styrt prøverunde som brukar same kjøp og svar, men aldri lagrar framgang. */
window.OrdvettTutorial = (function () {
  'use strict';
  const steps = [
    { hint: 'length', image: 'length', text: 'Kjøp ordlengda.' },
    { hint: 'random', image: 'random', text: 'Kjøp ein bokstav.' },
    { hint: 'definition', image: 'definition', text: 'Kjøp tydinga.' },
    { hint: null, image: 'chosen', text: 'Finn ordet og prøv svaret.' }
  ];
  let active = false, step = 0, failed = false, onClose;
  const byId = id => document.getElementById(id);
  function begin(close) {
    active = true; step = 0; failed = false; onClose = close;
    const word = OrdvettBank.words.find(word => word.answer === 'eple');
    return OrdvettGame.createRound([word], Vy.rng(731));
  }
  function allows(id) { return !active || steps[step]?.hint === id; }
  function receive(result, id) {
    if (!active) return;
    if (result.status === 'lastWrong') { failed = true; step = steps.length; return; }
    if (!result.ok) return;
    if (result.status === 'bought' && steps[step]?.hint === id || result.status === 'solved' && step === 3) step++;
  }
  function render() {
    const guide = byId('tutorialGuide'); guide.hidden = !active;
    document.querySelectorAll('.ov-tutorial-target').forEach(node => node.classList.remove('ov-tutorial-target'));
    if (!active) return;
    byId('answerDock').hidden = false;
    const finished = step >= steps.length, current = steps[step];
    const heading = Vy.el('div', 'ov-tutorial-heading');
    heading.append(Vy.el('strong', '', 'Prøverunde'));
    const dots = Vy.el('span', 'ov-tutorial-progress'); dots.setAttribute('aria-label', `Steg ${Math.min(step + 1, 4)} av 4`);
    steps.forEach((item, index) => { const dot = Vy.el('span', '', index < step ? '' : String(index + 1));
      if (index < step) { const glyph = Vy.el('span'); glyph.dataset.icon = 'check'; dot.append(glyph); }
      dot.setAttribute('aria-hidden', 'true'); dot.dataset.state = index < step ? 'done' : index === step ? 'active' : ''; dots.append(dot); });
    heading.append(dots);
    const close = Vy.el('button', `vp-button vp-button--quiet vp-button--compact${finished ? '' : ' vp-button--icon'}`, finished ? 'Til utfordringa' : '');
    if (!finished) { const glyph = Vy.el('span'); glyph.dataset.icon = 'x'; glyph.setAttribute('aria-hidden', 'true'); close.append(glyph); close.setAttribute('aria-label', 'Avslutt prøverunden'); }
    close.type = 'button'; close.addEventListener('click', onClose); heading.append(close);
    const instruction = Vy.el('p', 'ov-tutorial-instruction');
    if (current) { const image = Vy.el('img'); image.src = `assets/hints/${current.image}.png`; image.width = 36; image.height = 36; image.alt = ''; instruction.append(image); }
    instruction.append(Vy.el('strong', '', finished ? failed ? 'Prøverunden er over.' : 'Du fann ordet!' : current.text));
    guide.replaceChildren(heading, instruction);
    VyrdepilIcons.hydrateIcons(guide);
    byId('answerForm').hidden = step !== 3;
    byId('revealButton').hidden = true; byId('leaveButton').hidden = true; byId('nextButton').hidden = true;
    document.querySelectorAll('[data-hint]').forEach(button => { if (!allows(button.dataset.hint)) { button.disabled = true; button.querySelector('.ov-price')?.classList.add('ov-price--unavailable'); } });
    if (!finished) {
      byId('guessButton').disabled = step !== 3;
      const target = current.hint ? document.querySelector(`[data-hint="${current.hint}"]`) : byId('answer');
      target?.classList.add('ov-tutorial-target');
    }
  }
  function end() { active = false; byId('tutorialGuide').hidden = true; }
  function getActive() { return active; }
  return Object.freeze({ begin, allows, receive, render, end, getActive });
})();
