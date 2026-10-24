window.OrdvettView = (function () {
  'use strict';
  const Game = OrdvettGame;
  const byId = id => document.getElementById(id);
  const el = Vy.el;
  function show(screen, focusId) {
    ['setup', 'game', 'results'].forEach(id => { byId(id).hidden = id !== screen; });
    if (window.VyrdepilAppShell) VyrdepilAppShell.setGameActive(screen === 'game');
    if (focusId) byId(focusId).focus();
  }
  function setup(settings, count, key) {
    document.querySelectorAll('input[name="level"]').forEach(input => { input.checked = input.value === settings.level; });
    const options = Array.from({ length: count }, (_, index) => {
      const option = el('option', '', `Sett ${index + 1}`);
      option.value = String(index);
      return option;
    });
    byId('setSelect').replaceChildren(...options);
    byId('setSelect').value = String(settings.setIndex);
    const record = OrdvettStorage.getRecord(key);
    byId('setupRecord').textContent = record ? `Rekord: ${record.solved} av 5 ord · ${record.cost} ${record.cost === 1 ? 'mynt' : 'myntar'}` : 'Ingen rekord for dette settet enno.';
  }
  function feedback(message, success) {
    const node = byId('feedback');
    byId('feedbackText').textContent = message;
    node.hidden = !message;
    node.classList.toggle('vp-notice--success', Boolean(success));
  }
  function question(round, chooseMode, handlers) {
    const current = Game.current(round);
    const word = current.word;
    const done = Boolean(current.outcome);
    byId('progressText').textContent = `Ord ${round.index + 1} av ${round.questions.length}`;
    const total = Game.summary(round).cost;
    byId('totalCost').textContent = String(total);
    byId('totalCurrency').textContent = total === 1 ? 'mynt' : 'myntar';
    byId('wordInfo').textContent = `${Array.from(word.answer).length} bokstavar · Tema: ${word.theme} · Brukt på dette ordet: ${current.cost} ${current.cost === 1 ? 'mynt' : 'myntar'}`;
    byId('letters').setAttribute('aria-label', `Ordet har ${Array.from(word.answer).length} bokstavar`);
    byId('letters').replaceChildren(...Array.from(word.answer, (letter, index) => {
      const revealed = done || current.revealed.has(index);
      const tile = el(chooseMode && !revealed ? 'button' : 'span',
        `ov-letter ${chooseMode && !revealed ? 'vp-button vp-button--tool' : 'vp-panel vp-panel--inset'}`,
        revealed ? letter.toLocaleUpperCase('nn-NO') : '·');
      tile.setAttribute('aria-label', `Bokstav ${index + 1}: ${revealed ? letter.toLocaleUpperCase('nn-NO') : 'skjult'}`);
      if (tile.tagName === 'BUTTON') { tile.type = 'button'; tile.addEventListener('click', () => handlers.position(index)); }
      return tile;
    }));
    byId('chooseNotice').hidden = !chooseMode;
    byId('answerForm').hidden = done;
    byId('hintShop').hidden = done;
    byId('revealButton').hidden = done;
    byId('hintButtons').replaceChildren(...Game.HINTS.map(hint => {
      const button = el('button', 'vp-button vp-button--tool ov-hint');
      button.type = 'button';
      button.dataset.hint = hint.id;
      const allowed = Game.available(round, hint.id);
      button.disabled = !allowed;
      button.append(el('span', '', hint.label), el('small', '', allowed ? `${hint.price} ${hint.price === 1 ? 'mynt' : 'myntar'}` : 'Alt kjent'));
      button.addEventListener('click', () => handlers.hint(hint.id));
      return button;
    }));
    byId('noHints').hidden = current.purchases.length > 0;
    byId('purchasedHints').replaceChildren(...current.purchases.map(purchase => {
      const item = el('li', 'vp-panel vp-panel--plain');
      item.append(el('strong', '', `${purchase.label} · ${purchase.price} ${purchase.price === 1 ? 'mynt' : 'myntar'}`), el('p', '', purchase.text));
      return item;
    }));
    byId('solution').hidden = !done;
    if (done) {
      byId('solutionTitle').textContent = word.answer;
      byId('solutionDefinition').textContent = word.definition;
      byId('solutionGrammar').textContent = `${Game.POS[word.pos]} · ${word.grammar}`;
      byId('solutionForms').textContent = `Bøying: ${word.inflections.join(' · ')}`;
      byId('solutionAlternatives').textContent = word.alternatives.length ? `Andre godtekne grunnformer: ${word.alternatives.join(', ')}` : '';
      byId('sourceLink').href = word.source.url;
      byId('nextButton').textContent = round.index === round.questions.length - 1 ? 'Sjå resultat' : 'Neste ord';
    }
  }
  function results(round, isBest, oldRecord) {
    const result = Game.summary(round);
    byId('resultSolved').textContent = `${result.solved} av ${round.questions.length} ord løyste`;
    byId('resultCost').textContent = `Du brukte ${result.cost} ${result.cost === 1 ? 'mynt' : 'myntar'} i denne omgangen.`;
    byId('recordMessage').textContent = isBest ? 'Dette er den beste omgangen din på dette settet!' :
      `Rekorden for settet er ${oldRecord.solved} av 5 ord med ${oldRecord.cost} ${oldRecord.cost === 1 ? 'mynt' : 'myntar'}.`;
    byId('resultWords').replaceChildren(...round.questions.map(current => {
      const item = el('li', 'vp-panel vp-panel--plain');
      item.append(el('strong', '', `${current.word.answer} · ${current.outcome === 'solved' ? 'Løyst' : 'Fasit vist'} · ${current.cost} ${current.cost === 1 ? 'mynt' : 'myntar'}`), el('p', '', current.word.definition));
      return item;
    }));
    show('results', 'resultsTitle');
  }
  return Object.freeze({ byId, show, setup, question, feedback, results });
})();
