const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const pack=JSON.parse(fs.readFileSync(path.join(root,'ordbas/data/oppgaver.json'),'utf8'));
function setup(initial={}){
  let data=structuredClone(initial);const badges=new Set();let snapshot;
  const context=vm.createContext({console,Math,Set,Map,Promise,Number,Array,Object,JSON,document:{addEventListener(){}},fetch:async()=>({ok:true,json:async()=>structuredClone(pack)})});
  context.window=context;
  context.VyrdepilStorage={getGameState:()=>data,setGameState:(game,value)=>{assert.equal(game,'ordbas');data=structuredClone(value);},clearGameState:()=>{data=null;},updateBragdProgress:(id,value)=>{assert.equal(id,'ordbas');snapshot=value;},getBragdData:()=>({badges:{ordbas:[...badges]}}),recordBadge:(id,badge)=>{badges.add(badge);}};
  context.VyrdepilBragd={announceBadges:async(id,list)=>{list.forEach(b=>badges.add(b));}};
  for(const file of ['js/vyrdepil-util.js','ordbas/js/config.js','ordbas/js/content.js','ordbas/js/round.js','ordbas/js/storage.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return {O:context.Ordbas,data:()=>data,badges,snapshot:()=>snapshot};
}
const settings={mode:'sort',level:1,count:8,classes:['substantiv','verb','adjektiv'],showMeaning:false};
test('120 complete questions, 30 in each class, every level represented',()=>{
  const {O}=setup();assert.equal(O.Content.validate(pack).length,120);
  assert.equal(new Set(pack.questions.map(q=>q.id)).size,120);
  for(const c of O.Config.classes){assert.equal(pack.questions.filter(q=>q.wordClass===c.id).length,30);for(const l of [1,2,3,4])assert.ok(pack.questions.some(q=>q.wordClass===c.id&&q.level===l));}
  for(const q of pack.questions){assert.ok(q.meaning.length<150);assert.ok(q.source.adapted);assert.ok(q.source.dictionaryExplanation);assert.ok(q.source.url.endsWith('/'+q.source.articleId));assert.ok(!q.meaning.includes('$'));}
});
test('reject malformed content before play',()=>{
  const {O}=setup(),invalid=structuredClone(pack);invalid.questions[1].id=invalid.questions[0].id;assert.throws(()=>O.Content.validate(invalid));
  const missing=structuredClone(pack);delete missing.questions[0].source.definitionId;assert.throws(()=>O.Content.validate(missing));
});
test('balanced unique delivery at every level and class selection',()=>{
  const {O}=setup();
  for(const level of [1,2,3,4])for(const classes of [['substantiv','verb'],settings.classes,['substantiv','verb','adjektiv','adverb']]){
    const r=O.Round.create(pack.questions,{...settings,level,classes},()=>.4);
    assert.equal(r.state.queue.length,8);assert.equal(new Set(r.state.queue.map(i=>i.question.id)).size,8);
    const counts=classes.map(c=>r.state.queue.filter(i=>i.question.wordClass===c).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
    assert.ok(r.state.queue.every(i=>i.question.level===level&&classes.includes(i.question.wordClass)));
  }
});
test('a wrong answer can be corrected; repeated clicks cannot inflate results',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,settings,()=>.4),q=r.current().question;
  const wrong=settings.classes.find(c=>c!==q.wordClass);
  assert.equal(r.answer(wrong).correct,false);assert.equal(r.answer(wrong).accepted,false);
  const answer=r.answer(q.wordClass);assert.equal(answer.correct,true);assert.equal(answer.result.firstTry,false);
  assert.equal(r.answer(q.wordClass).accepted,false);assert.equal(r.state.answers.length,1);
});
test('definition support does not penalise grammatical first attempt',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,settings,()=>.4);r.revealMeaning();const result=r.answer(r.current().question.wordClass);
  assert.equal(result.result.firstTry,true);assert.equal(result.result.meaningUsed,true);
});
test('retry has three intervening cards, is marked separately, and capped',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,{...settings,count:12},()=>.4);
  const first=r.current().question; r.answer(settings.classes.find(c=>c!==first.wordClass));r.answer(first.wordClass);
  assert.equal(r.state.queue[4].question.id,first.id);assert.equal(r.state.queue[4].retry,true);
  while(r.state.phase!=='complete'){
    if(r.state.phase==='feedback'){r.next();continue;}
    const q=r.current().question;r.answer(settings.classes.find(c=>c!==q.wordClass));r.answer(q.wordClass);
  }
  assert.ok(r.state.retries<=2);assert.equal(r.summary().total,12);assert.equal(r.summary().answers.length,12);
  assert.equal(r.next(),false);
});
test('late mistakes go to later practice instead of immediate repetition',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,{...settings,count:5},()=>.4);
  while(r.state.index<4){r.answer(r.current().question.wordClass);r.next();}
  const q=r.current().question;r.answer(settings.classes.find(c=>c!==q.wordClass));r.answer(q.wordClass);
  assert.equal(r.state.retries,0);assert.ok(r.summary().practiceIds.includes(q.id));
});
test('Ordskiftet keeps matching forms with both grammatical uses',()=>{
  const {O}=setup();
  for(const level of [1,2,3,4]){
    const r=O.Round.create(pack.questions,{...settings,mode:'pairs',classes:['adjektiv','adverb'],level},()=>.4);
    assert.ok(r.state.queue.length>=4);
    for(let i=0;i<r.state.queue.length;i+=2){const a=r.state.queue[i].question,b=r.state.queue[i+1].question;assert.equal(a.pairId,b.pairId);assert.equal(a.target.text.toLowerCase(),b.target.text.toLowerCase());assert.notEqual(a.wordClass,b.wordClass);}
  }
});
test('practice may include words from a different level',()=>{
  const {O}=setup(),questions=pack.questions.filter(q=>['ob-001','ob-120'].includes(q.id));
  const r=O.Round.create(questions,{...settings,review:true,classes:['substantiv','verb','adjektiv','adverb']},()=>.4);assert.equal(r.state.queue.length,2);
});
test('storage sanitises malformed settings and bounded counters',async()=>{
  const {O}=setup({settings:{classes:['foreign'],count:999,level:12,mode:'x'},correct:-1,firstTry:999,progress:{substantiv:{1:{completed:4,firstTry:90,recent:[{id:'evil',ok:true}]}}}});await O.Content.load();
  const d=O.Storage.read();assert.equal(d.correct,0);assert.equal(d.firstTry,0);assert.equal(d.settings.count,8);assert.equal(d.settings.level,1);assert.equal(d.progress.substantiv[1].firstTry,4);assert.equal(d.progress.substantiv[1].recent.length,0);
});
test('storage keeps at most 30 known practice IDs and ten recent outcomes',async()=>{
  const {O,data}=setup();await O.Content.load();
  pack.questions.slice(0,45).forEach(q=>O.Storage.notePractice(q.id));O.Storage.notePractice('untrusted');assert.equal(data().review.length,30);
  for(let i=0;i<20;i++)O.Storage.recordAnswer({id:'ob-001',wordClass:'substantiv',level:1,firstTry:true,retry:false});
  assert.equal(data().progress.substantiv[1].recent.length,10);assert.equal(data().correct,20);
  const raw=JSON.stringify(data());assert.ok(!raw.includes('date'));assert.ok(!raw.includes('name'));
});
test('retries do not double count progress; corrected cards stay for practice',async()=>{
  const {O,data}=setup();await O.Content.load();const a={id:'ob-001',wordClass:'substantiv',level:1,firstTry:false,retry:false};
  O.Storage.recordAnswer(a);O.Storage.recordAnswer({...a,firstTry:true,retry:true});assert.equal(data().correct,1);assert.ok(data().review.includes(a.id));
  O.Storage.recordAnswer({...a,firstTry:true});assert.equal(data().correct,2);assert.ok(!data().review.includes(a.id));
});
test('progress syncs immediately and delivery badge requires completion',async()=>{
  const {O,badges,snapshot}=setup();await O.Content.load();O.Storage.recordAnswer({id:'ob-001',wordClass:'substantiv',level:1,firstTry:true,retry:false});
  assert.equal(snapshot().correct,1);assert.ok(!badges.has('fyrste-levering'));await O.Storage.finish('helper');assert.ok(badges.has('fyrste-levering'));assert.ok(badges.has('vyrdes-hjelpar'));assert.equal(snapshot().rounds,1);
});
test('reset removes only app state and leaves earned badges intact',async()=>{
  const {O,data,badges,snapshot}=setup();await O.Content.load();await O.Storage.finish('sort');O.Storage.reset();assert.equal(data(),null);assert.ok(badges.has('fyrste-levering'));assert.equal(snapshot().correct,0);
});
