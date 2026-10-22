(function (root) {
  'use strict';
  const O = root.Ordbas, el = root.Vy.el;
  const byId = id => document.getElementById(id);
  let lastQuestionId;
  function init() {
    const modes = byId('modeChoices'), classes = byId('classChoices'), guide = byId('classGuide');
    O.Config.modes.forEach(mode => {
      const label = el('label','vp-choice ob-mode-choice'), radio = el('input');
      radio.type='radio'; radio.name='mode'; radio.value=mode.id;
      const copy=el('span'); copy.append(el('strong','',mode.name),el('small','',mode.description));
      label.append(radio,copy); modes.append(label);
    });
    O.Config.classes.forEach(c => {
      const label=el('label','vp-choice'), box=el('input');
      box.type='checkbox';box.name='wordClass';box.value=c.id;label.append(box,document.createTextNode(c.name));classes.append(label);
      const p=el('p');p.append(el('strong','',c.name+': '),document.createTextNode(c.guide));guide.append(p);
    });
    byId('loading').hidden=true;
  }
  function screen(name) {
    ['setup','game','result'].forEach(id=>{byId(id).hidden=id!==name;});
    const active=name==='game';document.body.classList.toggle('ob-playing',active);
    byId('appHero').classList.toggle('vp-hero-stage--compact',active);
    if(root.VyrdepilAppShell)root.VyrdepilAppShell.setGameActive(active);
  }
  function setup(settings) {
    document.querySelectorAll('input[name="mode"]').forEach(input=>{input.checked=input.value===settings.mode;});
    document.querySelectorAll('input[name="wordClass"]').forEach(input=>{input.checked=settings.classes.includes(input.value);input.disabled=settings.mode==='pairs';});
    byId('levelSelect').value=String(settings.level);byId('countSelect').value=String(settings.count);byId('meaningToggle').checked=settings.showMeaning;
    const size=O.Round.pool(O.Content.all(),settings).length;
    const invalid=settings.classes.length<2||size<1;
    byId('startButton').disabled=invalid;
    byId('poolSummary').textContent=invalid?'Vel minst to ordklassar.':`${size} oppgåver å velje mellom. ${settings.mode==='pairs'?Math.min(Math.floor(settings.count/2)*2,size):Math.min(settings.count,size)} kort i denne leveringa.`;
    const data=O.Storage.read();byId('reviewButton').hidden=!data.review.length;
    byId('reviewButton').textContent=`Øv på ord frå før (${data.review.length})`;
  }
  function game(round) {
    const {state}=round, active=round.current(), q=active.question;
    const isNew=lastQuestionId!==q.id+':'+state.index;lastQuestionId=q.id+':'+state.index;
    byId('roundMode').textContent=O.Config.modes.find(m=>m.id===state.settings.mode).name+(active.retry?' · Eit ord kjem att':'');
    byId('roundTitle').textContent=O.Config.levels[state.settings.level-1];
    byId('counter').textContent=`Kort ${state.index+1} av ${state.queue.length}`;
    byId('firstTryCounter').textContent=`${round.summary().firstTry} ${round.summary().firstTry===1?'rett':'rette'} på fyrste forsøk`;
    byId('roundProgress').max=state.queue.length;byId('roundProgress').value=state.index+(state.phase==='feedback'?1:0);
    if(isNew){
      const sentence=byId('sentence');sentence.replaceChildren(document.createTextNode(q.target.before),el('strong','',q.target.text),document.createTextNode(q.target.after));
      byId('wordCard').textContent=q.target.text;byId('wordCard').setAttribute('aria-label',`Ordkort: ${q.target.text}. Vel ein bås.`);
      byId('wordCard').setAttribute('aria-pressed','false');
    }
    byId('wordCard').disabled=state.phase==='feedback';byId('wordCard').draggable=false;
    meaning(round);
    const bins=byId('bins');bins.replaceChildren();
    state.settings.classes.forEach((id,index)=>{
      const c=O.Config.classes.find(c=>c.id===id),button=el('button','vp-button ob-bin');
      button.type='button';button.dataset.class=id;
      button.setAttribute('aria-label',`${index+1}. ${c.name}`);
      button.append(el('small','',`Bås ${index+1}`),el('strong','',c.name),el('small','',c.short));
      let note='';
      if(active.wrong.includes(id)){button.dataset.state='wrong';note='Prøv ein annan bås';}
      if(state.phase==='feedback'&&id===q.wordClass){button.dataset.state='right';note='Rett bås';}
      button.append(el('span','ob-bin-state',note));
      button.disabled=state.phase==='feedback'||active.wrong.includes(id);bins.append(button);
    });
    const feedback=byId('feedback'),text=byId('feedbackText'),speech=byId('vyrdeSpeech');
    feedback.classList.remove('vp-notice--success','vp-notice--warning');
    let reaction='';
    if(state.phase==='feedback'){
      feedback.classList.add('vp-notice--success');text.textContent=`Rett bås: ${O.Config.classes.find(c=>c.id===q.wordClass).name}. ${q.reason}`;
      speech.textContent=state.settings.mode==='helper'?(active.proposal===q.wordClass?'Vi fann same bås! Takk for hjelpa.':'Du fann rett bås! No lærte eg noko òg.'):(active.wrong.length?'No kom ordet på plass. Godt at du prøvde att!':['Den sat! Eit ord til?','Fint sortert. Korga blir lettare!','Der høyrde ordet heime!'][state.index%3]);
      reaction='success';
    }else if(active.wrong.length){feedback.classList.add('vp-notice--warning');text.textContent=`Prøv ein annan bås. ${q.tip}`;speech.textContent='Vi ser ein gong til på ordet i setninga.';reaction='retry';}
    else{
      text.textContent='';
      speech.textContent=state.settings.mode==='helper'?`Eg foreslår «${O.Config.classes.find(c=>c.id===active.proposal).name}». Kva meiner du?`:state.settings.mode==='pairs'?'Same ordform kan få ulik bås. Les heile setninga.':active.retry?'Hugsar du dette ordet? No prøver vi ein gong til.':'Les setninga. Kva gjer det understreka ordet her?';
    }
    feedback.hidden=!text.textContent;
    byId('companion').dataset.reaction=reaction;
    byId('nextButton').hidden=state.phase!=='feedback';
    const source=byId('sourceLink');source.hidden=state.phase!=='feedback';source.href=`https://ordbokene.no/nn/${q.source.articleId}`;
    screen('game');
  }
  function meaning(round) {
    const active=round.current();byId('meaningBox').hidden=!active.meaning;
    byId('meaningButton').setAttribute('aria-expanded',String(active.meaning));
    byId('meaningButton').disabled=active.meaning;
    byId('meaningText').textContent=active.question.meaning;
  }
  function progress(data) {
    byId('progressSummary').textContent=`${data.rounds === 1 ? '1 levering ferdig' : data.rounds+' leveringar ferdige'} · ${data.correct} ord på plass.`;
    const host=byId('levelProgress');host.replaceChildren();
    O.Config.levels.forEach((name,index)=>{
      const buckets=O.Config.classes.map(c=>data.progress[c.id][index+1]);
      const completed=buckets.reduce((n,b)=>n+b.completed,0), firstTry=buckets.reduce((n,b)=>n+b.firstTry,0);
      const line=el('div','ob-level');line.append(el('strong','',`${index+1} · ${name}`),el('p','vp-small',completed?`${completed === 1 ? '1 ord øvd' : completed+' ord øvde'} · ${firstTry} ${firstTry===1?'rett':'rette'} på fyrste forsøk`:'Ikkje øvd på enno'));host.append(line);
    });
  }
  function result(round) {
    const summary=round.summary();
    byId('resultScore').textContent=`${summary.firstTry} av ${summary.total}`;
    byId('resultSummary').textContent=`${summary.firstTry===1?'rett':'rette'} på fyrste forsøk. Alle ${summary.total} orda kom på plass!${summary.retried?' Du fekk òg øvd på '+summary.retried+' ord ein gong til.':''}`;
    const review=byId('reviewWords');review.replaceChildren();
    if(summary.practiceIds.length){
      review.append(el('p','','Desse orda kan vi sjå på ein gong til:'));const list=el('ul');
      summary.practiceIds.slice(0,3).forEach(id=>list.append(el('li','',O.Content.get(id).target.text)));review.append(list);
    }else review.append(el('p','','Vyrde takkar for ei godt sortert ordkorg.'));
    byId('practiceButton').hidden=!summary.practiceIds.length;screen('result');
  }
  function badges() { return root.VyrdepilBragd.renderGameBadges(byId('badges'),'ordbas',O.Storage.earned()); }
  function focus(id) { byId(id).focus({preventScroll:true}); }
  O.View={init,screen,setup,game,meaning,progress,result,badges,focus,byId};
})(window);
