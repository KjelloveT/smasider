(function (root) {
  'use strict';
  const O=root.Ordbas;
  let settings,round;
  function change(next){
    if(next.mode==='pairs'){next.classes=['adjektiv','adverb'];if(settings.mode!=='pairs')next.level=Math.max(2,next.level);}
    else if(settings.mode==='pairs')next.classes=O.Config.defaults.classes.slice();
    settings=next;O.View.setup(settings);
  }
  function home(){
    O.View.screen('setup');O.View.setup(settings);O.View.progress(O.Storage.read());O.View.byId('setupMessage').textContent='';O.View.focus('setupTitle');
  }
  function start(overrides={}){
    const next={...settings,...overrides};
    if(next.classes.length<2)return;
    settings=O.Storage.settings(next);
    const questions=next.review?O.Storage.read().review.map(id=>O.Content.get(id)).filter(Boolean):O.Content.all();
    if(!questions.length){home();return;}
    O.Storage.saveSettings(settings);
    round=O.Round.create(questions,{...settings,review:next.review===true});
    O.View.game(round);O.View.focus('roundTitle');
  }
  function answer(wordClass){
    if(!round)return;
    const result=round.answer(wordClass);if(!result.accepted)return;
    if(result.correct){O.Storage.recordAnswer(result.result);O.View.progress(O.Storage.read());}
    else O.Storage.notePractice(round.current().question.id);
    O.View.game(round);O.View.focus(result.correct?'nextButton':'wordCard');
  }
  async function next(){
    if(!round||!round.next())return;
    if(round.state.phase==='complete'){
      const completed=round;O.View.result(completed);O.View.focus('resultTitle');
      await O.Storage.finish(completed.state.settings.mode);O.View.progress(O.Storage.read());await O.View.badges();
    }else{O.View.game(round);O.View.focus('wordCard');}
  }
  function meaning(){if(round&&round.state.phase!=='complete'){round.revealMeaning();O.View.meaning(round);}}
  function practice(){start({mode:'sort',classes:O.Config.classes.map(c=>c.id),review:true});}
  async function reset(){
    const accepted=await root.Vy.confirmAction('Val, øvingstal og repetisjonsord for Ordbås blir sletta på denne eininga. Bragdene blir verande i den felles samlinga.','Nullstill Ordbås?','Nullstill øvinga');
    if(!accepted)return;
    O.Storage.reset();settings=O.Storage.read().settings;round=null;home();O.View.byId('setupMessage').textContent='Ordbås-øvinga er nullstilt.';
  }
  O.App={change,home,start,answer,next,meaning,practice,reset,round:()=>round};
  (async()=>{
    try{
      await O.Content.load();O.View.init();settings=O.Storage.read().settings;O.Input.bind();O.View.setup(settings);O.View.progress(O.Storage.read());O.View.screen('setup');await O.View.badges();
    }catch(error){O.View.byId('loading').hidden=true;O.View.byId('loadError').hidden=false;O.View.byId('reloadButton').onclick=()=>location.reload();console.error('Ordbås kunne ikkje starte:',error);}
  })();
})(window);
