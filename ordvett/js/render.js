window.OrdvettView = (function () {
  'use strict';
  const Game = OrdvettGame;
  const byId = id => document.getElementById(id);
  const el = Vy.el;
  let lastWord, lastRound;
  function icon(name) {
    const host = el('span', 'ov-icon'); host.setAttribute('aria-hidden', 'true');
    const glyph = el('span'); glyph.dataset.icon = name; host.append(glyph);
    VyrdepilIcons.hydrateIcons(host); return host;
  }
  function price(amount) {
    const node = el('span', 'ov-price'); node.setAttribute('role', 'img');
    node.setAttribute('aria-label', `${amount} ${amount === 1 ? 'mynt' : 'myntar'}`);
    node.append(OrdvettEffects.coin(), el('strong', '', String(amount))); return node;
  }
  function hintImage(id) {
    const image = el('img', 'ov-hint-image'); image.src = `assets/hints/${id}.png`;
    image.width = 80; image.height = 80; image.alt = ''; return image;
  }
  function show(screen, focusId) {
    ['setup', 'game', 'results'].forEach(id => { byId(id).hidden = id !== screen; });
    VyrdepilAppShell?.setGameActive(screen !== 'setup');
    if (focusId) byId(focusId).focus();
  }
  function progress(round, host) {
    host.replaceChildren(...Array.from({ length: 5 }, (_, index) => {
      const outcome = round?.questions[index]?.outcome;
      const active = round && index === round.index;
      const node = el('span', 'ov-step');
      node.dataset.state = outcome || (active ? 'active' : 'waiting');
      node.setAttribute('aria-label', `Ord ${index + 1}: ${outcome === 'solved' ? 'løyst' : outcome === 'revealed' ? 'fasit vist' : active ? 'no' : 'står att'}`);
      if (outcome) node.append(icon(outcome === 'solved' ? 'check' : 'eye'));
      else node.textContent = String(index + 1);
      return node;
    }));
  }
  function setup(settings, descriptor, savedRound) {
    const daily = settings.mode === 'daily';
    const finished = savedRound && Game.summary(savedRound).complete;
    document.querySelectorAll('input[name="level"]').forEach(input => { input.checked = input.value === settings.level; });
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === settings.mode)));
    byId('setupTitle').textContent = daily ? 'Dagens fem ord' : 'Fem nye ord';
    byId('dayLabel').textContent = daily ? OrdvettSchedule.dateLabel(descriptor.date) : 'Øv så mykje du vil';
    byId('dayNumber').textContent = daily ? String(Number(descriptor.date.slice(-2))) : '5';
    byId('startLabel').textContent = finished ? 'Sjå resultat' : savedRound ? 'Hald fram' : 'Start';
    progress(savedRound, byId('setupProgress'));
    const state = byId('setupRecord'); state.replaceChildren();
    if (finished) {
      const result = Game.summary(savedRound);
      state.append(icon('check'), el('span', '', `${result.solved} / 5`), price(result.cost));
    } else if (savedRound) state.append(el('span', '', `Ord ${savedRound.index + 1} / 5`), price(Game.summary(savedRound).cost));
    state.hidden = !savedRound;
  }
  function feedback(result) {
    byId('announcement').textContent = result?.message || '';
    const host = byId('feedback'); host.replaceChildren();
    const labels = { empty: 'Skriv eit ord', repeat: 'Alt prøvd', wrong: 'Prøv att', funds: 'Ikkje nok myntar', position: 'Vel ein ny plass' };
    host.hidden = !labels[result?.status];
    if (!host.hidden) { host.append(icon('x'), el('span', '', labels[result.status])); if (result.price) host.append(price(result.price)); }
  }
  function question(round, chooseMode, handlers, change) {
    const current = Game.current(round), word = current.word, done = Boolean(current.outcome);
    const newWord = lastRound !== round || lastWord !== word.id;
    lastWord = word.id;
    lastRound = round;
    progress(round, byId('progress'));
    const remaining = Game.summary(round).remaining;
    byId('totalCost').textContent = String(remaining);
    byId('coinCounter').setAttribute('aria-label', `${remaining} av ${Game.BUDGET} myntar att`);
    byId('coinPile').replaceChildren(...Array.from({ length: Math.min(remaining, 8) }, (_, index) => {
      const coin = OrdvettEffects.coin(); coin.style.setProperty('--coin-index', index); return coin;
    }));
    const lengthKnown = done || current.purchases.some(purchase => purchase.id === 'length');
    const themeKnown = done || current.purchases.some(purchase => purchase.id === 'theme');
    byId('gameTitle').textContent = themeKnown ? word.theme : `Ord ${round.index + 1}`;
    byId('wordInfo').textContent = lengthKnown ? `${Array.from(word.answer).length} bokstavar.` : 'Ordlengda er skjult.';
    byId('letters').setAttribute('aria-label', lengthKnown ? `Ordet har ${Array.from(word.answer).length} bokstavar` : 'Kjøpte bokstavspor. Ordlengda er skjult.');
    const letters = byId('letters'); letters.replaceChildren();
    const positions = lengthKnown ? Array.from(word.answer, (_, index) => index) : [...current.revealed, ...current.misses].sort((a, b) => a - b);
    if (!positions.length) {
      const sealed = el('span', 'ov-sealed-word'); sealed.setAttribute('aria-hidden', 'true');
      sealed.append(hintImage('length'), el('strong', '', '?')); letters.append(sealed);
    }
    positions.forEach(index => {
      const revealed = done || current.revealed.has(index), letter = Array.from(word.answer)[index];
      const tile = el('span', 'ov-letter vp-panel vp-panel--inset');
      const value = letter === undefined ? '—' : revealed ? letter.toLocaleUpperCase('nn-NO') : '·';
      tile.setAttribute('aria-label', `Bokstav ${index + 1}: ${letter === undefined ? 'finst ikkje' : revealed ? value : 'skjult'}`);
      if (!lengthKnown) tile.append(el('small', 'ov-letter-position', String(index + 1)));
      tile.append(el('strong', '', value));
      if (change?.position === index || change?.status === 'solved') { tile.classList.add('ov-letter--new'); tile.style.setProperty('--tile-delay', `${change.status === 'solved' ? index * 45 : 0}ms`); }
      letters.append(tile);
    });
    byId('chooseNotice').hidden = !chooseMode;
    byId('answerForm').hidden = done;
    byId('guessButton').disabled = remaining < 2;
    byId('fundsNotice').hidden = done || remaining >= 2;
    byId('hintShop').hidden = done;
    byId('revealButton').hidden = done;
    byId('hintButtons').replaceChildren(...Game.HINTS.map(hint => {
      const button = el('button', 'vp-button vp-button--tool vp-button--purchase ov-hint'); button.type = 'button'; button.dataset.hint = hint.id;
      button.disabled = !Game.available(round, hint.id);
      const bought = current.purchases.some(purchase => purchase.id === hint.id), known = Game.known(round, hint.id);
      button.append(hintImage(hint.id), el('span', 'ov-hint-name', hint.label));
      const tag = price(hint.price); if (button.disabled) tag.classList.add('ov-price--unavailable'); button.append(tag);
      if (known) { const stamp = el('span', 'ov-paid'); stamp.append(icon('check'), el('span', '', bought ? 'Kjøpt' : 'Kjent')); button.append(stamp); }
      button.setAttribute('aria-label', known ? `${hint.label}: ${bought ? 'kjøpt' : 'alt kjent'}` : `${hint.label}, ${hint.price} ${hint.price === 1 ? 'mynt' : 'myntar'}${button.disabled ? ', ikkje nok myntar' : ''}`);
      button.addEventListener('click', event => handlers.hint(hint.id, event.currentTarget)); return button;
    }));
    const list = byId('purchasedHints');
    if (newWord) list.replaceChildren();
    while (list.children.length < current.purchases.length) {
      const purchase = current.purchases[list.children.length];
      const hint = Game.HINTS.find(item => item.id === purchase.id);
      const item = el('li', 'vp-panel vp-panel--plain ov-receipt');
      item.tabIndex = -1;
      if (change?.status === 'bought' && list.children.length === current.purchases.length - 1) item.classList.add('ov-receipt--new');
      const head = el('div', 'ov-receipt-head'); head.append(hintImage(hint.id), el('strong', '', purchase.label), icon('check'));
      item.append(head, el('p', '', purchase.text)); list.append(item);
    }
    byId('purchasedSection').hidden = current.purchases.length === 0;
    byId('solution').hidden = !done;
    if (done) {
      byId('solutionStamp').replaceChildren(icon(current.outcome === 'solved' ? 'check' : 'eye'), el('span', '', current.outcome === 'solved' ? 'Løyst' : 'Fasit'));
      byId('solutionTitle').textContent = word.answer;
      byId('solutionDefinition').textContent = word.definition;
      byId('solutionGrammar').textContent = `${Game.POS[word.pos]} · ${word.grammar}`;
      byId('solutionForms').textContent = `Bøying: ${word.inflections.join(' · ')}`;
      byId('solutionAlternatives').textContent = word.alternatives.length ? `Andre grunnformer: ${word.alternatives.join(', ')}` : '';
      byId('sourceLink').href = word.source.url;
      byId('nextButton').textContent = round.index === round.questions.length - 1 ? 'Resultat' : 'Neste ord';
      if (newWord) byId('solution').querySelector('details').open = false;
    }
  }
  function results(round, descriptor) {
    const result = Game.summary(round);
    byId('resultsTitle').textContent = descriptor.mode === 'daily' ? 'Ferdig for i dag!' : 'Godt ordarbeid!';
    byId('resultDate').textContent = descriptor.mode === 'daily' ? OrdvettSchedule.dateLabel(descriptor.date) : 'Øving';
    byId('resultSolved').replaceChildren(icon('check'), el('strong', '', `${result.solved} / 5`));
    byId('resultCost').replaceChildren(price(result.cost));
    byId('recordMessage').textContent = descriptor.mode === 'daily' ? 'Nye ord i morgon' : '';
    byId('resultWords').replaceChildren(...round.questions.map(current => {
      const item = el('li', 'vp-panel vp-panel--plain ov-result-row');
      item.append(icon(current.outcome === 'solved' ? 'check' : 'eye'), el('strong', '', current.word.answer), price(current.cost)); return item;
    }));
    show('results', 'resultsTitle');
  }
  return Object.freeze({ byId, show, setup, question, feedback, results });
})();
