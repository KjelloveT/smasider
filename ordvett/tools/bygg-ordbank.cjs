/* Køyr med Node. Berre ved vedlikehald: nettlesaren gjer ingen API-oppslag. */
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const cache = path.join(root, '_kjelder/ordvett');
const api = 'https://ord.uib.no';

async function getJson(route, filename) {
  const file = path.join(cache, filename);
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const response = await fetch(api + route);
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  const data = await response.json();
  await fs.writeFile(file, JSON.stringify(data));
  return data;
}

function senses(article) {
  const out = [];
  function walk(node, id) {
    if (!node || typeof node !== 'object') return;
    const next = node.type_ === 'definition' && node.id != null ? node.id : id;
    if (node.type_ === 'explanation' && node.content) out.push({ id: next, text: node.content });
    (node.elements || []).forEach(child => walk(child, next));
  }
  (article.body.definitions || []).forEach(node => walk(node, null));
  return out;
}

async function main() {
  await fs.mkdir(cache, { recursive: true });
  const lemmaIndex = await getJson('/nn/fil/lemma.json', 'lemma.json');
  const rows = (await fs.readFile(path.join(root, 'ordvett/data/ordgrunnlag.tsv'), 'utf8'))
    .trim().split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => line.split('|'));
  let choices = {};
  try { choices = JSON.parse(await fs.readFile(path.join(root, 'ordvett/data/tydingar.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const words = new Array(rows.length);
  const audit = new Array(rows.length);
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const index = cursor++;
      const [answer, pos, level, theme, usage, definition, sentence] = rows[index];
      const matches = lemmaIndex.filter(item => item[0] === answer && item[2] === pos);
      if (!matches.length) throw new Error(`Ingen normert ${pos}: ${answer}`);
      const articleId = choices[answer]?.articleId || matches[0][1];
      if (!matches.some(item => item[1] === articleId)) throw new Error(`Ugyldig artikkelval: ${answer}`);
      const article = await getJson(`/nn/article/${articleId}.json`, `${articleId}.json`);
      const validLemmas = article.lemmas.filter(lemma => lemma.paradigm_info?.some(info =>
        !info.to && info.standardisation === 'STANDARD' && info.tags.includes(pos)));
      const primary = validLemmas.find(lemma => lemma.lemma === answer);
      if (!primary) throw new Error(`Ikkje gjeldande norm: ${answer}`);
      const forms = primary.paradigm_info.filter(info => !info.to && info.standardisation === 'STANDARD')
        .flatMap(info => info.inflection || []).map(item => item.word_form);
      const infinitives = validLemmas.flatMap(lemma => lemma.paradigm_info
        .filter(info => !info.to && info.standardisation === 'STANDARD')
        .flatMap(info => info.inflection || []).filter(form => form.tags.includes('Inf')).map(form => form.word_form));
      const alternatives = [...new Set([...validLemmas.map(lemma => lemma.lemma), ...infinitives])].filter(word => word !== answer);
      const options = senses(article);
      const sense = choices[answer]?.senseId != null ? options.find(item => item.id === choices[answer].senseId) : options[0];
      if (!sense) throw new Error(`Manglar tyding: ${answer}`);
      const genders = [...new Set(primary.paradigm_info.filter(info => !info.to && info.standardisation === 'STANDARD')
        .flatMap(info => info.tags).filter(tag => ['Masc', 'Fem', 'Neuter'].includes(tag)))];
      const grammar = pos === 'NOUN' ? genders.map(tag => ({ Masc: 'Hankjønn: ein', Fem: 'Hokjønn: ei', Neuter: 'Inkjekjønn: eit' })[tag]).join(' / ')
        : pos === 'VERB' ? 'Verb: Ordet står i infinitiv.' : 'Adjektiv: Ordet står i positiv, utan gradbøying.';
      words[index] = {
        id: `nn-${articleId}-${primary.id}`, answer, alternatives, pos, level, theme,
        grammar, usage, definition, sentence, inflections: [...new Set(forms)],
        source: { articleId, senseId: sense.id, url: `https://ordbokene.no/nn/${articleId}` }
      };
      audit[index] = `${answer} [${articleId}] VAL ${sense.id}: ${sense.text}\n` +
        options.map(item => `  ${item.id}: ${item.text}`).join('\n');
      if ((index + 1) % 25 === 0) console.log(`Henta ${index + 1}/${rows.length}`);
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  const data = {
    app: 'ordvett', version: 1, bankVersion: '2026-10-24.1', rulesVersion: 3,
    attribution: 'Nynorskordboka, Universitetet i Bergen og Språkrådet, ordbøkene.no, CC BY 4.0.',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    changes: 'Ordutval, tema, vanskegrad, forklaringar og setningsdøme er tilpassa for Ordvett. Ordklasse, normerte oppslagsformer og bøying er henta frå Nynorskordboka.',
    words
  };
  await fs.writeFile(path.join(root, 'ordvett/data/ordbank.js'),
    '/* Nynorskordboka (UiB og Språkrådet), CC BY 4.0. Sjå KJELDER.md. */\nwindow.OrdvettBank = ' + JSON.stringify(data, null, 2) + ';\n');
  await fs.writeFile(path.join(cache, 'tydingskontroll.txt'), audit.join('\n\n'));
  console.log(`Bygde ${words.length} ord. Kontroller _kjelder/ordvett/tydingskontroll.txt.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
