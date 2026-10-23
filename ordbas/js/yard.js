(function (root) {
  'use strict';
  const O = root.Ordbas, el = root.Vy.el;
  const byId = id => document.getElementById(id);
  function icon(name) { const span = el('span'); span.setAttribute('aria-hidden','true'); span.innerHTML = root.ICON(name,20); return span; }
  function sentence(host, q) { host.replaceChildren(document.createTextNode(q.target.before),el('strong','',q.target.text),document.createTextNode(q.target.after)); }
  function trail(round) {
    const {state} = round, primary = state.queue.filter(item => !item.retry), host = byId('roundTrail');
    const done = new Set(state.answers.filter(a => !a.retry).map(a => a.id));
    const active = round.board().map(item => item.question.id);
    host.replaceChildren(); host.setAttribute('aria-label',`${done.size} av ${primary.length} ord på plass`);
    primary.forEach((item,index) => {
      const stone = el('span','ob-trail-stone'); stone.setAttribute('aria-hidden','true');
      if (done.has(item.question.id)) { stone.dataset.state = 'done'; stone.append(icon('check')); }
      else { stone.textContent = String(index + 1); if (active.includes(item.question.id)) stone.dataset.state = 'current'; }
      host.append(stone);
    });
  }
  function pairs(round) {
    const host = byId('pairContext'), {state} = round;
    host.replaceChildren(); host.hidden = state.settings.mode !== 'pairs'; if (host.hidden) return;
    round.board().filter(item => !item.locked).forEach(item => {
      const index = state.queue.indexOf(item), tile = el('button','vp-button ob-pair-tile');
      tile.type = 'button'; tile.dataset.pairIndex = index; tile.draggable = false;
      tile.setAttribute('aria-pressed',String(index === state.selected));
      tile.setAttribute('aria-label',`Setningskort: ${item.question.target.before}${item.question.target.text}${item.question.target.after}`);
      sentence(tile,item.question); host.append(tile);
    });
  }
  function hunt(round) {
    const host = byId('wordHunt'), helper = round.state.settings.mode === 'helper';
    host.hidden = !helper; byId('wordBook').hidden = !helper; if (!helper) return;
    const active = round.current(), q = active.question, text = q.target.before + q.target.text + q.target.after;
    byId('huntClass').textContent = O.Config.classes.find(c => c.id === q.wordClass).name;
    byId('huntClue').textContent = q.meaning;
    const choices = byId('huntSentence'); choices.replaceChildren(); let end = 0;
    O.Round.words(q).forEach(word => {
      choices.append(document.createTextNode(text.slice(end,word.start)));
      const button = el('button','vp-button vp-button--quiet ob-hunt-word',word.text);
      button.type = 'button'; button.dataset.wordIndex = word.index;
      button.disabled = active.locked || active.wrong.includes(word.index);
      if (active.wrong.includes(word.index)) button.dataset.state = 'wrong';
      if (active.locked && word.target) button.dataset.state = 'right';
      choices.append(button); end = word.end;
    });
    choices.append(document.createTextNode(text.slice(end)));
    const found = byId('foundWords'); found.replaceChildren();
    round.state.answers.forEach(answer => { const word = el('span','vp-panel vp-panel--compact ob-found-word',O.Content.get(answer.id).target.text); word.prepend(icon('check')); found.append(word); });
    byId('bookEmpty').hidden = round.state.answers.length > 0;
  }
  function bins(round) {
    const {state} = round, active = round.current(), paired = state.settings.mode === 'pairs', host = byId('bins');
    host.hidden = state.settings.mode === 'helper'; host.replaceChildren(); if (host.hidden) return;
    host.style.setProperty('--ob-columns',state.settings.classes.length);
    state.settings.classes.forEach((id,index) => {
      const c = O.Config.classes.find(c => c.id === id), bay = el('div','ob-bay'); bay.dataset.class = id;
      const button = el('button','vp-button vp-button--illustration ob-bin'); button.type = 'button'; button.dataset.class = id;
      button.setAttribute('aria-label',c.name); button.setAttribute('aria-keyshortcuts',String(index + 1));
      const picture = el('span','ob-stall-picture'); picture.setAttribute('aria-hidden','true');
      button.append(picture,el('strong','ob-stall-name',c.name));
      const wrongChoice = state.phase === 'answering' && active.wrong.includes(id);
      button.disabled = state.phase === 'feedback' || wrongChoice;
      const outcome = state.lastOutcome;
      if (wrongChoice) button.dataset.state = 'wrong';
      if (outcome && outcome.correct && id === outcome.question.wordClass) button.dataset.state = 'right';
      const answers = paired ? round.board().filter(item => item.locked && item.question.wordClass === id).map(item => item.question) : state.answers.filter(a => !a.retry && a.wordClass === id).map(a => O.Content.get(a.id));
      const cavity = el('span','ob-cavity');
      cavity.setAttribute('aria-label',`${answers.length} ${paired ? 'setningskort' : 'ord'} i ${c.name.toLowerCase()}`);
      // The latest card sits inside the chest; earlier cards form the stack behind it.
      answers.slice(-3).forEach((q,offset,array) => {
        const card = el('span','vp-panel vp-panel--compact ob-collected-card');
        card.style.setProperty('--ob-card-depth',array.length - offset - 1);
        if (paired) sentence(card,q); else card.textContent = q.target.text;
        cavity.append(card);
      });
      button.append(cavity);
      if (answers.length && !paired) { const count = el('span','vp-panel vp-panel--soft vp-panel--compact ob-bay-count',String(answers.length)); count.setAttribute('aria-hidden','true'); button.append(count); }
      bay.append(button); host.append(bay);
    });
  }
  O.Yard = {sentence,trail,pairs,hunt,bins,icon};
})(window);
