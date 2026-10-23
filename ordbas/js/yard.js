(function (root) {
  'use strict';
  const O = root.Ordbas, el = root.Vy.el;
  const byId = id => document.getElementById(id);
  function icon(name) { const span = el('span'); span.setAttribute('aria-hidden','true'); span.innerHTML = root.ICON(name,20); return span; }
  function sentence(host, q) { host.replaceChildren(document.createTextNode(q.target.before),el('strong','',q.target.text),document.createTextNode(q.target.after)); }
  function trail(round) {
    const {state} = round, primary = state.queue.filter(item => !item.retry), host = byId('roundTrail');
    const done = new Set(state.answers.filter(a => !a.retry).map(a => a.id));
    const active = state.settings.mode === 'helper' ? round.board().map(item => item.question.id) : [round.current().question.id];
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
    host.hidden = state.settings.mode !== 'pairs'; if (host.hidden) return;
    host.replaceChildren();
    const start = Math.floor(state.index / 2) * 2;
    state.queue.slice(start,start + 2).forEach((item,index) => {
      const tile = el('div','vp-panel vp-panel--soft vp-panel--compact ob-pair-tile');
      tile.dataset.active = String(start + index === state.index);
      if(start + index === state.index) { tile.setAttribute('aria-current','step'); const pointer=icon('arrowRight'); pointer.className='ob-pair-pointer'; tile.append(pointer); }
      const copy = el('p'); sentence(copy,item.question); tile.append(copy);
      const answer = state.answers.find(a => a.id === item.question.id);
      if (answer) { const stamp = el('span','ob-pair-stamp',O.Config.classes.find(c => c.id === answer.wordClass).name); stamp.prepend(icon('check')); tile.append(stamp); }
      host.append(tile);
    });
  }
  function bins(round) {
    const {state} = round, active = round.current(), helper = state.settings.mode === 'helper', host = byId('bins');
    host.replaceChildren(); host.style.setProperty('--ob-columns',state.settings.classes.length);
    state.settings.classes.forEach((id,index) => {
      const c = O.Config.classes.find(c => c.id === id), bay = el('div','ob-bay' + (helper ? ' vp-panel vp-panel--soft vp-panel--compact' : ''));
      bay.dataset.class = id;
      const button = el('button','vp-button vp-button--illustration ob-bin'); button.type = 'button'; button.dataset.class = id;
      button.setAttribute('aria-label',`${index + 1}. ${c.name}`);
      button.title = helper ? `Flytt det valde kortet til ${c.name.toLowerCase()}` : c.name;
      const image = el('img'); image.src = 'assets/baas.png'; image.width = 384; image.height = 384; image.alt = '';
      button.append(image,el('span','ob-stall-key',String(index + 1)),el('strong','ob-stall-name',c.name));
      button.disabled = state.phase === 'feedback' || (helper ? active.locked : active.wrong.includes(id));
      let note = '';
      if (!helper && active.wrong.includes(id)) { button.dataset.state = 'wrong'; note = 'Prøv att'; }
      if (!helper && state.phase === 'feedback' && id === active.question.wordClass) { button.dataset.state = 'right'; note = 'Rett!'; }
      if (note) button.append(el('span','vp-panel vp-panel--soft vp-panel--compact ob-bin-state',note));
      bay.append(button);
      if (helper) {
        const cards = el('div','ob-yard-cards');
        round.board().filter(item => item.placement === id).forEach(item => {
          const index = state.queue.indexOf(item), card = el('button','vp-button vp-button--quiet ob-yard-card');
          card.type = 'button'; card.dataset.helperIndex = index; card.setAttribute('aria-pressed',String(index === state.selected));
          card.setAttribute('aria-label',`Ordkort: ${item.question.target.text}. ${item.question.target.before}${item.question.target.text}${item.question.target.after}`);
          sentence(card,item.question); card.disabled = item.locked;
          if (item.locked) { card.dataset.state = 'right'; card.append(icon('check')); }
          if (item.checkedWrong) card.dataset.state = 'wrong';
          cards.append(card);
        });
        bay.append(cards);
      } else {
        const answers = state.answers.filter(a => !a.retry && a.wordClass === id);
        const pile = el('div','ob-collected'); pile.setAttribute('aria-label',`${answers.length} ord i ${c.name.toLowerCase()}`);
        answers.slice(-3).forEach(answer => pile.append(el('span','vp-panel vp-panel--compact ob-collected-card',O.Content.get(answer.id).target.text)));
        if (answers.length) { const count = el('span','vp-panel vp-panel--soft vp-panel--compact ob-bay-count',String(answers.length)); count.setAttribute('aria-hidden','true'); button.append(count); }
        bay.append(pile);
      }
      host.append(bay);
    });
  }
  O.Yard = {sentence,trail,pairs,bins,icon};
})(window);
