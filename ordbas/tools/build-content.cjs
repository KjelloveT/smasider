/* Utviklingsverktøy: hent ordbokgrunnlag, aldri under elevbruk. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const project = path.resolve(root, '..');
const cache = path.join(root, '.cache');
fs.mkdirSync(cache, { recursive: true });
const banks = ['substantiv','verb','adjektiv','adverb'].flatMap(name => JSON.parse(fs.readFileSync(path.join(project,'docs/ordbas/data',name+'.json'),'utf8')).words);
const specs = fs.readFileSync(path.join(__dirname,'oppgaver.tsv'),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).map((line,index)=>{
  const [wordClass,level,lemma,before,target,after,meaning,reason,tip,pairId] = line.split('|');
  const word=banks.find(item=>item.wordClass===wordClass && (item.lemma===lemma||item.word===lemma));
  if(!word) throw new Error(`Manglar ord ${index+1}: ${wordClass}:${lemma}`);
  return {id:'ob-'+String(index+1).padStart(3,'0'),wordClass,level:Number(level),lemma,target:{before,text:target,after},meaning,reason,tip,pairId:pairId||null,word};
});
function expand(item){
  if(!item)return '';
  if(typeof item==='string')return item;
  if(item.lemmas)return item.lemmas.map(x=>x.lemma).join('/');
  if(item.text)return item.text;
  if(item.content){let index=0;return item.content.replace(/\$/g,()=>expand((item.items||[])[index++]));}
  return item.id||'';
}
function senses(article){
  const out=[];
  function walk(node){
    if(Array.isArray(node)){node.forEach(walk);return;}
    if(!node||node.type_!=='definition')return;
    const text=(node.elements||[]).filter(e=>e.type_==='explanation').map(expand).join('; ');
    if(text&&!/^brukt som /i.test(text))out.push({id:node.id,text});
    (node.elements||[]).filter(e=>e.type_==='definition').forEach(walk);
  }
  walk(article.body.definitions);return out;
}
async function article(id){
  const file=path.join(cache,id+'.json');
  if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8'));
  const response=await fetch(`https://ord.uib.no/nn/article/${id}.json`);
  if(!response.ok)throw new Error(`Ordboka ${id}: ${response.status}`);
  const data=await response.json(); fs.writeFileSync(file,JSON.stringify(data));return data;
}
async function main(){
  const ids=[...new Set(specs.flatMap(s=>s.word.possibleSourceArticleIds||[s.word.sourceArticleId]))];
  let cursor=0;const articles=new Map();
  await Promise.all(Array.from({length:4},async()=>{while(cursor<ids.length){const id=ids[cursor++];articles.set(id,await article(id));}}));
  const overridesPath=path.join(__dirname,'senses.json');
  const overrides=fs.existsSync(overridesPath)?JSON.parse(fs.readFileSync(overridesPath,'utf8')):{};
  const questions=specs.map(spec=>{
    const override=overrides[spec.id]||{};
    const id=override.articleId||spec.word.sourceArticleId;
    const data=articles.get(id), list=senses(data);
    const chosen=override.definitionId!==undefined?list.find(s=>s.id===override.definitionId):list[0];
    if(!chosen)throw new Error('Manglar forklaring '+spec.id);
    const forms=data.lemmas.flatMap(l=>[l.lemma,...(l.paradigm_info||[]).filter(p=>p.standardisation==='STANDARD'&&p.to===null).flatMap(p=>(p.inflection||[]).map(f=>f.word_form))]);
    if(!forms.includes(spec.target.text.toLocaleLowerCase('nn-NO')))throw new Error('Ugyldig form '+spec.id+': '+spec.target.text);
    return {id:spec.id,wordId:spec.word.id,wordClass:spec.wordClass,level:spec.level,lemma:spec.lemma,target:spec.target,meaning:spec.meaning,reason:spec.reason,tip:spec.tip,pairId:spec.pairId,source:{articleId:id,definitionId:chosen.id,wordClass:spec.word.sourceWordClass,url:`https://ordbokene.no/nn/${id}`,updated:data.updated,dictionaryExplanation:chosen.text,adapted:true}};
  });
  const data={app:'Ordbås',version:1,language:'nn',attribution:'Nynorskordboka, Universitetet i Bergen og Språkrådet, ordbøkene.no, CC-BY 4.0. Ordforklaringane er korta ned og tilpassa; setningar, hint og grammatikkforklaringar er skrivne for Ordbås.',license:'https://creativecommons.org/licenses/by/4.0/',sourceFetchedOn:'2026-10-22',questions};
  fs.writeFileSync(path.join(root,'data/oppgaver.json'),JSON.stringify(data,null,2)+'\n');
  const review=specs.map(s=>`\n${s.id} ${s.wordClass} ${s.lemma} – ${s.meaning}\n`+(s.word.possibleSourceArticleIds||[s.word.sourceArticleId]).map(id=>`${id}: `+senses(articles.get(id)).map(x=>`[${x.id}] ${x.text}`).join(' / ')).join('\n')).join('\n');
  fs.writeFileSync(path.join(cache,'sense-review.txt'),review);
  console.log(`${questions.length} oppgåver, ${articles.size} ordbokartiklar. SHA-256: ${crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
