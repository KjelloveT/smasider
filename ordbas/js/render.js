(function (root) {
  'use strict';
  const O = root.Ordbas, el = root.Vy.el;
  const byId = id => document.getElementById(id);
  function init() {
    O.Config.modes.forEach(mode => {
      const label = el('label','vp-choice ob-mode-choice'), radio = el('input');
      radio.type = 'radio'; radio.name = 'mode'; radio.value = mode.id;
      const picture = el('span','ob-mode-picture'); picture.dataset.mode = mode.id; picture.setAttribute('aria-hidden','true');
      const copy = el('span','ob-mode-copy'); copy.append(el('strong','',mode.name),el('small','',mode.description));
      label.append(radio,picture,copy); byId('modeChoices').append(label);
    });
    O.Config.levels.forEach((name,index) => {
      const label = el('label','vp-choice ob-level-choice'), radio = el('input'), picture = el('img');
      radio.type = 'radio'; radio.name = 'level'; radio.value = String(index + 1);
      picture.src = `../_resources/vyrdepil-design/bragder/icons/${O.Config.levelPictures[index]}.png`; picture.alt = ''; picture.width = 80; picture.height = 80;
      label.append(radio,picture,el('strong','',name)); byId('levelChoices').append(label);
    });
    O.Config.classes.forEach(c => {
      const label = el('label','vp-choice'), box = el('input');
      box.type = 'checkbox'; box.name = 'wordClass'; box.value = c.id; label.append(box,document.createTextNode(c.name)); byId('classChoices').append(label);
      const p = el('p'); p.append(el('strong','',c.name + ': '),document.createTextNode(c.guide)); byId('classGuide').append(p);
    });
    if (root.ResizeObserver) new root.ResizeObserver(fitWord).observe(byId('wordCard'));
    root.addEventListener('resize',fitWord);
    byId('loading').hidden = true;
  }
  function screen(name) {
    ['setup','game','result'].forEach(id => { byId(id).hidden = id !== name; });
    const active = name === 'game'; document.body.classList.toggle('ob-playing',active);
    byId('appHero').classList.toggle('vp-hero-stage--compact',active);
    if (root.VyrdepilAppShell) root.VyrdepilAppShell.setGameActive(active);
  }
  function setup(settings) {
    document.querySelectorAll('input[name="mode"]').forEach(input => { input.checked = input.value === settings.mode; });
    document.querySelectorAll('input[name="wordClass"]').forEach(input => { input.checked = settings.classes.includes(input.value); input.disabled = settings.mode === 'pairs'; });
    document.querySelectorAll('input[name="level"]').forEach(input => { input.checked = Number(input.value) === settings.level; }); byId('countSelect').value = String(settings.count); byId('meaningToggle').checked = settings.showMeaning;
    const size = O.Round.pool(O.Content.all(),settings).length, invalid = settings.classes.length < 2 || size < 1;
    byId('startButton').disabled = invalid;
    byId('poolSummary').textContent = invalid ? 'Vel minst to ordklassar.' : '';
    const data = O.Storage.read(); byId('reviewButton').hidden = !data.review.length;
    byId('reviewButton').textContent = `Øv meir (${data.review.length})`;
    byId('setupSelection').textContent = `${Math.min(size,settings.mode === 'pairs' ? Math.floor(settings.count / 2) * 2 : settings.count)} kort`;
  }
  function game(round) {
    const {state} = round, active = round.current(), q = active.question, helper = state.settings.mode === 'helper', paired = state.settings.mode === 'pairs';
    byId('game').dataset.mode = state.settings.mode;
    byId('roundMode').textContent = active.retry ? 'Eit ord kjem att' : O.Config.levels[state.settings.level - 1];
    byId('roundTitle').textContent = O.Config.modes.find(m => m.id === state.settings.mode).name;
    byId('scoreValue').textContent = state.points;
    byId('streakValue').textContent = state.streak; byId('streakBadge').hidden = state.streak < 2;
    byId('counter').textContent = `${state.answers.filter(a => !a.retry).length} / ${round.summary().total}`;
    O.Yard.trail(round); O.Yard.pairs(round); O.Yard.hunt(round);
    O.Yard.sentence(byId('sentence'),q); byId('sentence').hidden = helper || paired;
    const card = byId('wordCard'); card.hidden = helper || paired; byId('wordText').textContent = q.target.text;
    card.setAttribute('aria-label',`Ordkort: ${q.target.text}. Vel ein bås.`); card.setAttribute('aria-pressed','false'); card.disabled = state.phase === 'feedback'; card.draggable = false;
    byId('nextButton').hidden = state.phase !== 'feedback';
    byId('nextLabel').textContent = paired ? 'Neste par' : helper ? 'Neste gåte' : 'Neste ord';
    const feedback = byId('feedback'), speech = byId('vyrdeSpeech');
    feedback.classList.remove('vp-notice--success','vp-notice--warning'); let text = '';
    if (state.lastOutcome && state.lastOutcome.correct) {
      text = state.lastOutcome.question.reason; feedback.classList.add('vp-notice--success');
      speech.textContent = helper ? 'Det var ordet mitt!' : ['Den sat!','Fint sortert!','Der høyrde ordet heime!'][state.index % 3];
    } else if (state.lastOutcome) { text = helper ? 'Leit etter ordet som passar til forklaringa.' : q.tip; feedback.classList.add('vp-notice--warning'); speech.textContent = 'Prøv att.'; }
    else speech.textContent = '';
    byId('feedbackText').textContent = text; feedback.hidden = !text; speech.hidden = !speech.textContent;
    const source = byId('sourceLink'); source.hidden = state.phase !== 'feedback' || helper; source.href = `https://ordbokene.no/nn/${q.source.articleId}`;
    byId('companion').dataset.reaction = 'hint';
    meaning(round); O.Yard.bins(round); screen('game'); fitWord();
  }
  function fitWord() {
    const card = byId('wordCard'), text = byId('wordText');
    if (!card || card.hidden || !card.clientWidth) return;
    text.style.fontSize = '';
    const style = root.getComputedStyle(card);
    const available = card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    // Measure the rendered word: letter widths matter more than character count.
    if (text.scrollWidth > available && available > 0) {
      text.style.fontSize = `${parseFloat(style.fontSize) * available / text.scrollWidth * .98}px`;
    }
  }
  function meaning(round) {
    const active = round.current(), helper = round.state.settings.mode === 'helper'; byId('meaningBox').hidden = !active.meaning;
    byId('huntClueBox').hidden = !helper; byId('vyrdeBubble').hidden = !helper && !active.meaning;
    const button = byId('meaningButton'); button.setAttribute('aria-expanded',String(active.meaning)); button.disabled = active.meaning;
    button.setAttribute('aria-label',round.state.settings.mode === 'helper' ? 'Vyrde: gje eit hint' : `Vyrde: hint om «${active.question.target.text}»`);
    byId('meaningText').textContent = round.state.settings.mode === 'helper' ? active.question.tip : active.question.meaning;
  }
  function progress(data) {
    byId('progressSummary').textContent = `${data.rounds === 1 ? '1 levering' : data.rounds + ' leveringar'} · ${data.correct} ord på plass.`;
    const host = byId('levelProgress'); host.replaceChildren();
    O.Config.levels.forEach((name,index) => {
      const buckets = O.Config.classes.map(c => data.progress[c.id][index + 1]);
      const completed = buckets.reduce((n,b) => n + b.completed,0), firstTry = buckets.reduce((n,b) => n + b.firstTry,0);
      const line = el('div','ob-level'); line.append(el('strong','',name),el('p','vp-small',completed ? `${completed} ord · ${firstTry} på fyrste forsøk` : 'Ikkje øvd enno')); host.append(line);
    });
  }
  function result(round) {
    const summary = round.summary(); byId('resultTitle').textContent = round.state.settings.mode === 'helper' ? 'Ordboka veks!' : round.state.settings.mode === 'pairs' ? 'Alle para er på plass!' : 'Tunet er ryddig!'; byId('resultScore').textContent = summary.points;
    byId('resultSummary').textContent = `${summary.firstTry} av ${summary.total} på fyrste forsøk`;
    byId('resultStreak').textContent = summary.bestStreak > 1 ? `${summary.bestStreak} på rad!` : 'Alle orda kom på plass!';
    const review = byId('reviewWords'); review.replaceChildren();
    if (summary.practiceIds.length) {
      const list = el('ul'); summary.practiceIds.slice(0,3).forEach(id => list.append(el('li','',O.Content.get(id).target.text))); review.append(list);
    }
    byId('practiceButton').hidden = !summary.practiceIds.length; screen('result');
  }
  function badges() { return root.VyrdepilBragd.renderGameBadges(byId('badges'),'ordbas',O.Storage.earned()); }
  function focus(id) { const target = byId(id); if (target && !target.hidden) target.focus({preventScroll:true}); }
  function focusTask() { const target = byId('game').querySelector('#pairContext:not([hidden]) .ob-pair-tile[aria-pressed="true"],#wordHunt:not([hidden]) button:not(:disabled),#wordCard:not([hidden])'); if (target) target.focus({preventScroll:true}); }
  O.View = {init,screen,setup,game,fitWord,meaning,progress,result,badges,focus,focusTask,byId};
})(window);
