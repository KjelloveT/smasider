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
test('400 complete questions, 100 in each class, every level represented',()=>{
  const {O}=setup();assert.equal(O.Content.validate(pack).length,400);
  assert.equal(new Set(pack.questions.map(q=>q.id)).size,400);
  for(const c of O.Config.classes){assert.equal(pack.questions.filter(q=>q.wordClass===c.id).length,100);for(const l of [1,2,3,4])assert.ok(pack.questions.some(q=>q.wordClass===c.id&&q.level===l));}
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
    for(let i=0;i<r.state.queue.length;i+=2){const a=r.state.queue[i].question,b=r.state.queue[i+1].question;assert.equal(a.pairId,b.pairId);assert.equal(Math.max(a.level,b.level),level);assert.equal(a.target.text.toLowerCase(),b.target.text.toLowerCase());assert.notEqual(a.wordClass,b.wordClass);}
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


test('points reward first attempts and streaks, with no duplicate or hint penalty',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,settings,()=>.4);
  r.revealMeaning();assert.equal(r.answer(r.current().question.wordClass).result.points,10);
  assert.equal(r.answer(r.current().question.wordClass).accepted,false);assert.equal(r.state.points,10);r.next();
  r.answer(r.current().question.wordClass);r.next();
  assert.equal(r.answer(r.current().question.wordClass).result.points,15);assert.equal(r.state.points,35);r.next();
  const q=r.current().question;r.answer(settings.classes.find(c=>c!==q.wordClass));assert.equal(r.state.streak,0);
  assert.equal(r.answer(q.wordClass).result.points,5);assert.equal(r.state.points,40);
});

test('repeated practice is free of extra points and does not increase the streak',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,settings,()=>.4);
  const first=r.current().question;r.answer(settings.classes.find(c=>c!==first.wordClass));r.answer(first.wordClass);r.next();
  while(r.state.index<4){r.answer(r.current().question.wordClass);r.next();}
  assert.equal(r.current().retry,true);const before=r.state.points,streak=r.state.streak;
  assert.equal(r.answer(first.wordClass).result.points,0);assert.equal(r.state.points,before);assert.equal(r.state.streak,streak);
});

test('word hunt accepts the intended occurrence, not any word of the class',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,{...settings,mode:'helper'},()=>.4);
  const words=O.Round.words(r.current().question),right=words.find(w=>w.target),wrong=words.find(w=>!w.target);
  assert.equal(r.answer(r.current().question.wordClass).accepted,false);
  assert.equal(r.chooseWord(-1).accepted,false);assert.equal(r.chooseWord(.5).accepted,false);
  assert.equal(r.chooseWord(wrong.index).correct,false);assert.equal(r.chooseWord(wrong.index).accepted,false);
  assert.equal(r.chooseWord(right.index).result.firstTry,false);assert.equal(r.state.points,5);
  assert.equal(r.chooseWord(right.index).accepted,false);assert.equal(r.state.answers.length,1);
});

test('word hunt preserves repeated words, punctuation and Norwegian letters',()=>{
  const {O}=setup(),q={target:{before:'«Går Vyrde? Vyrde ',text:'går',after:' heim.»'}};
  const words=O.Round.words(q);assert.equal(words.length,5);assert.equal(words.filter(w=>w.target).length,1);
  assert.equal(words[0].target,false);assert.equal(words[3].target,true);assert.equal(words[3].text,'går');
  for(const q of pack.questions)assert.equal(O.Round.words(q).filter(w=>w.target).length,1,q.id);
});

test('word hunt completes with hint support and publishes once through normal storage',async()=>{
  const {O,data}=setup();await O.Content.load();const r=O.Round.create(pack.questions,{...settings,mode:'helper',count:5},()=>.4);
  while(r.state.phase!=='complete'){
    r.revealMeaning();const result=r.chooseWord(O.Round.words(r.current().question).find(w=>w.target).index);
    assert.equal(result.result.meaningUsed,true);O.Storage.recordAnswer(result.result);assert.equal(r.next(),true);
  }
  assert.equal(r.summary().answers.length,5);assert.equal(r.summary().firstTry,5);assert.equal(data().correct,5);
  assert.equal(r.state.retries,0);assert.equal(data().points,undefined);
});

test('Ordskiftet accepts either sentence first and advances only when both are placed',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,{...settings,mode:'pairs',level:3,classes:['adjektiv','adverb']},()=>.4);
  const first=r.board()[0],second=r.board()[1];assert.equal(r.selectCard(2),false);
  assert.equal(r.selectCard(1),true);const result=r.answer(second.question.wordClass);
  assert.equal(result.correct,true);assert.equal(second.locked,true);assert.equal(first.locked,false);
  assert.equal(r.current(),first);assert.equal(r.next(),false);assert.equal(r.selectCard(1),false);
  assert.equal(r.answer(first.question.wordClass).correct,true);assert.equal(r.state.phase,'feedback');
  assert.equal(r.state.answers.length,2);assert.equal(r.state.answers[0].id,second.question.id);
  assert.equal(r.answer(first.question.wordClass).accepted,false);assert.equal(r.next(),true);assert.equal(r.state.index,2);
});

test('Ordskiftet keeps separate mistakes and original sentences in the correct booths',()=>{
  const {O}=setup(),r=O.Round.create(pack.questions,{...settings,mode:'pairs',level:3,classes:['adjektiv','adverb']},()=>.4);
  const first=r.current(),pair=first.question.pairId;
  r.answer(r.state.settings.classes.find(c=>c!==first.question.wordClass));r.answer(first.question.wordClass);
  assert.equal(r.state.queue.length,8);assert.equal(r.state.retries,0);assert.equal(r.current().wrong.length,0);
  assert.equal(r.current().question.pairId,pair);assert.equal(r.state.answers[0].firstTry,false);
  r.answer(r.current().question.wordClass);
  const placed=r.board().filter(item=>item.locked);assert.equal(placed.length,2);assert.notEqual(placed[0].question.target.before,placed[1].question.target.before);
  assert.notEqual(placed[0].question.wordClass,placed[1].question.wordClass);assert.equal(r.summary().answers[1].firstTry,true);
});


test('first-time play starts with familiar nouns and verbs, with all levels available',async()=>{
  const {O}=setup();await O.Content.load();const initial=O.Storage.read().settings;
  assert.deepEqual(Array.from(initial.classes),['substantiv','verb']);assert.equal(initial.level,1);
  assert.deepEqual(Array.from(O.Config.levels),['Lett','Middels','Vanskeleg','Ekstrem']);
  for(const level of [1,2,3,4])assert.ok(O.Round.pool(pack.questions,{...initial,level}).length>=40);
});

test('the expansion preserves established question IDs and has explicit dictionary senses',()=>{
  const {O}=setup();const senses=JSON.parse(fs.readFileSync(path.join(root,'ordbas/tools/senses.json'),'utf8'));
  for(const [id,lemma] of [['ob-001','stein'],['ob-031','hoppe'],['ob-061','raud'],['ob-091','her'],['ob-120','kreativ'],['ob-121','arm'],['ob-400','neppe']])assert.equal(pack.questions.find(q=>q.id===id).lemma,lemma);
  for(const q of pack.questions){assert.equal(senses[q.id].articleId,q.source.articleId);assert.equal(senses[q.id].definitionId,q.source.definitionId);}
  for(const c of O.Config.classes)assert.equal(new Set(pack.questions.filter(q=>q.wordClass===c.id).map(q=>q.lemma)).size,100);
  const groups=Map.groupBy(pack.questions.filter(q=>q.pairId),q=>q.pairId);assert.ok(groups.size>=20);
  for(const pair of groups.values()){assert.equal(pair.length,2);assert.equal(pair[0].target.text.toLowerCase(),pair[1].target.text.toLowerCase());assert.notEqual(pair[0].wordClass,pair[1].wordClass);}
});
