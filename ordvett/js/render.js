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
    host.replaceChildren(...Array.from({ length: round?.questions.length || 5 }, (_, index) => {
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
    byId('setupTitle').textContent = daily ? 'Dagens utfordring' : 'Tidlegare utfordringar';
    byId('dayLabel').textContent = OrdvettSchedule.dateLabel(descriptor.date);
    byId('dayNumber').textContent = String(Number(descriptor.date.slice(-2)));
    byId('archivePicker').hidden = daily;
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
    byId('answerDock').hidden = done;
    byId('answerForm').hidden = done;
    byId('guessButton').disabled = remaining < 2;
    byId('fundsNotice').hidden = done || remaining >= 2;
    byId('hintShop').hidden = done;
    byId('revealButton').hidden = done;
    byId('leaveButton').hidden = false;
    byId('nextButton').hidden = false;
    byId('hintButtons').replaceChildren(...Game.HINTS.map(hint => {
      const slot = el('div', 'ov-shop-slot'); slot.dataset.slot = hint.id;
      if (current.purchases.some(purchase => purchase.id === hint.id)) { slot.setAttribute('aria-hidden', 'true'); return slot; }
      const button = el('button', 'vp-button vp-button--tool vp-button--purchase ov-hint'); button.type = 'button'; button.dataset.hint = hint.id;
      button.disabled = !Game.available(round, hint.id);
      const known = Game.known(round, hint.id);
      button.append(hintImage(hint.id), el('span', 'ov-hint-name', hint.label));
      const tag = price(hint.price); if (button.disabled) tag.classList.add('ov-price--unavailable'); button.append(tag);
      if (known) { const stamp = el('span', 'ov-paid'); stamp.append(icon('check'), el('span', '', 'Kjent')); button.append(stamp); }
      button.setAttribute('aria-label', known ? `${hint.label}: alt kjent` : `${hint.label}, ${hint.price} ${hint.price === 1 ? 'mynt' : 'myntar'}${button.disabled ? ', ikkje nok myntar' : ''}`);
      button.addEventListener('click', event => handlers.hint(hint.id, event.currentTarget)); slot.append(button); return slot;
    }));
    const list = byId('purchasedHints');
    const groups = new Map();
    current.purchases.forEach(purchase => { if (!groups.has(purchase.id)) groups.set(purchase.id, []); groups.get(purchase.id).push(purchase); });
    list.replaceChildren(...[...groups].map(([id, purchases]) => {
      const hint = Game.HINTS.find(item => item.id === id);
      const item = el('li', 'vp-panel vp-panel--plain ov-receipt');
      item.tabIndex = -1; item.dataset.ownedHint = id;
      const head = el('div', 'ov-receipt-head'); head.append(hintImage(id), el('strong', '', hint.label)); item.append(head);
      purchases.forEach(purchase => item.append(el('p', '', purchase.text)));
      if (!done && ['random', 'chosen'].includes(id)) {
        const button = el('button', 'vp-button vp-button--tool vp-button--purchase vp-button--compact ov-buy-again');
        button.type = 'button'; button.dataset.hint = id; button.disabled = !Game.available(round, id);
        button.append(el('span', '', id === 'random' ? 'Ny bokstav' : 'Vel rute'));
        const tag = price(hint.price); if (button.disabled) tag.classList.add('ov-price--unavailable'); button.append(tag);
        button.setAttribute('aria-label', `${hint.label}, ${hint.price} myntar${button.disabled ? ', ikkje tilgjengeleg' : ''}`);
        button.addEventListener('click', event => handlers.hint(id, event.currentTarget)); item.append(button);
      }
      return item;
    }));
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
    byId('resultsTitle').textContent = descriptor.mode === 'daily' ? 'Ferdig for i dag!' : 'Utfordringa er ferdig!';
    byId('resultDate').textContent = OrdvettSchedule.dateLabel(descriptor.date);
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
