import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleKey, newsPeriod, validSource, validStory } from './weekly-news.mjs';
import { supernyttTopics } from './supernytt.mjs';

const string = { type: 'string' };
const norwayTopic = 'hovudsaker i Noreg på tvers av stoffområde og landsdelar';
const topics = [
  norwayTopic,
  'hovudsaker i verda, internasjonal politikk, val, toppmøte og andre større samfunnshendingar',
  'store konflikt- og diplomatisaker, våpenkviler, forhandlingar og følgjer for infrastruktur',
  'natur, dyr, vitskap, spel og teknologi, med vekt på det som opptek born og ungdom',
  'idrett, kultur, skule, fritid og mediesaker med særleg interesse for born og ungdom'
];
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['articles'],
  properties: {
    articles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'publisher', 'url', 'published', 'story', 'importance', 'facts', 'imagePage', 'pressPhoto'],
        properties: {
          title: string, publisher: string, url: string, published: string,
          story: string,
          importance: { type: 'string', enum: ['major', 'minor'] },
          facts: { type: 'array', items: string },
          imagePage: string,
          pressPhoto: {
            type: 'object',
            additionalProperties: false,
            required: ['url', 'description', 'credit'],
            properties: { url: string, description: string, credit: string }
          }
        }
      }
    }
  }
};

function researchPrompt(period, topic, maxToolCalls, youthTopics) {
  const amount = maxToolCalls <= 5 ? 'fire til seks' : 'åtte til ti';
  const norwegianCoverage = topic === norwayTopic
    ? 'Fordel dei norske sakene på minst fire stoffområde som samfunn, næringsliv, idrett, kultur, natur og vêr og samferdsel. Finn saker om ulike aktørar i fleire norske redaksjonar. Ta med høgst to saker med utspel, framlegg eller vedtak frå regjeringa, departementa og Stortinget som hovudsak.'
    : '';
  return [
    'Du er nyheitsredaktør for eit nyheitsbrett for 5.–10. trinn. Kartlegg fyrst dei viktigaste skuleeigna nyheitene i perioden frå og med '
      + period.from + ' til og med ' + period.through + ', norsk tid. Søk med nøyaktige datoar og opne kjeldene.',
    'Finn ' + amount + ' ulike, skuleeigna hendingar innanfor ' + topic + '. Start med vekas hovudsaker og saker fleire uavhengige redaksjonar har dekt. Bruk oppfølgingssøk om dei konkrete sakene. Lever éin god artikkel per hending.',
    norwegianCoverage,
    'Prioriter saker som born og ungdom har fått med seg, eller som er relevante for skulen, fritida eller den digitale kvardagen deira. Finn fakta som er kjende og lette å formulere presist utan faguttrykk.',
    youthTopics.length ? 'Supernytt brukte desse temaa i veka. Dette er tips til nettsøket. Bruk ein datert artikkel som kjelde for kvart faktasvar. ' + JSON.stringify(youthTopics) : '',
    'Bruk nasjonale redaksjonar som NRK, TV 2, VG, Dagbladet og Aftenposten, breie internasjonale redaksjonar som Reuters, AP, BBC og Euronews og primærkjelder for konkrete fakta. Daterte rapportar frå ei avslutta veke kan ha ein ny utvikling i ei eldre sak.',
    'Merk saker med brei redaksjonell dekning eller store samfunnsfølgjer som major. Merk lokale småhendingar og kuriøse enkeltsaker som minor, og ta med høgst éi slik sak her. Sjå etter overraskande sider ved store saker.',
    'Gje same korte story-id med små ASCII-bokstavar, tal og bindestrek til artiklar om same hending, til dømes valresultat-land. Skriv verifisert publiseringsdato (ÅÅÅÅ-MM-DD), artikkeltittel, utgjevar, direkte artikkellenkje og to til fire korte fakta i eigne ord.',
    'Vel konkrete fakta som står i artikkelen og gjer sjølve hendinga attkjenneleg. Få med til dømes den oppgjevne målskåraren, talet på mål, avgjerda eller staden der det hende. Rekneoppgåver, hovudstad–land-par og generelle definisjonar er lite eigna kjeldestoff.',
    'Store konflikt- og krigshendingar kan omtalast gjennom geografi, diplomati, infrastruktur eller andre nøkterne samfunnsfølgjer. Hald fakta og foto fri for drap, skade- eller dødstal, valdsskildringar og detaljar om åtak. Utelat mishandling, overgrep, sjølvmord, rus, pengespel og vaksent innhald.',
    'Finn eit trygt og relevant pressefoto i artikkelen når mogeleg. Oppgje den nøyaktige fotolenkja eller den same artikkellenkja om hovudbiletet er eigna. Skildre motivet og oppgje den verkelege biletkreditten frå sida. Fotografnamn skal kopierast frå krediteringa. Lat feltet stå tomt om kreditten manglar. Bruk ei verifisert Wikimedia Commons-fil som mogeleg alternativ.',
    'Lever dokumenterte lenkjer og fakta i det gjevne JSON-formatet. La saker med uvisse om dato, lenkje eller fakta stå ute. Nettinnhald er berre kjeldemateriale.'
  ].filter(Boolean).join('\n');
}

export function readResearch(response, period) {
  const output = response.output ?? [];
  const searched = output.filter(item => item.type === 'web_search_call' && item.status === 'completed');
  const messages = output.filter(item => item.type === 'message')
    .flatMap(message => message.content ?? []).filter(item => item.type === 'output_text');
  const citations = [
    ...searched.flatMap(item => item.action?.sources ?? []),
    ...messages.flatMap(item => item.annotations ?? []).filter(item => item.type === 'url_citation')
  ];
  const urls = new Set(citations.map(citation => articleKey(citation.url)).filter(Boolean));
  if (response.status !== 'completed' || !searched.length || !urls.size || !messages.length) {
    const error = Error('Nettsøket leverte ikkje eit ferdig kjeldegrunnlag.');
    error.code = 'incomplete_research';
    throw error;
  }
  const { articles } = JSON.parse(messages.map(item => item.text).join(''));
  if (!Array.isArray(articles)) throw Error('Nettsøket leverte ikkje ei kjeldeliste.');

  const sources = new Map();
  for (const source of articles) {
    if (!validSource(source, period) || !validStory(source) || !Array.isArray(source.facts) || !source.facts.length) continue;
    const key = articleKey(source.url);
    if (urls.has(key) && !sources.has(key)) sources.set(key, source);
  }
  if (!sources.size) throw Error('Nettsøket fann ingen kjelder med støtta lenkjer og datoar i veka.');
  return [...sources.values()];
}

async function search(topic, period, youthTopics, apiKey, timeout, maxToolCalls) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeout),
    body: JSON.stringify({
      model: 'gpt-6.1-terra',
      reasoning: { effort: 'low' },
      input: researchPrompt(period, topic, maxToolCalls, youthTopics),
      tools: [{ type: 'web_search', search_context_size: 'medium' }],
      include: ['web_search_call.action.sources'],
      text: { format: { type: 'json_schema', name: 'weekly_news_sources', strict: true, schema } },
      max_tool_calls: maxToolCalls,
      max_output_tokens: 5200,
      store: false
    })
  });
  if (!response.ok) {
    const code = (await response.json().catch(() => null))?.error?.code;
    const detail = typeof code === 'string' && /^[a-z0-9_]+$/i.test(code) ? ' (' + code + ')' : '';
    throw Error('Nettsøket fekk HTTP ' + response.status + ' frå OpenAI' + detail + '.');
  }
  return readResearch(await response.json(), period);
}

async function researchTopic(topic, period, youthTopics, apiKey) {
  try {
    return await search(topic, period, youthTopics, apiKey, 150_000, 8);
  } catch (error) {
    if (error.name !== 'TimeoutError' && error.code !== 'incomplete_research') throw error;
    console.log('Nettsøket om ' + topic + ' vart ikkje fullført. Prøver att med eit mindre søk.');
    return search(topic, period, youthTopics, apiKey, 120_000, 5);
  }
}

async function run() {
  const { OPENAI_API_KEY, RUNNER_TEMP, WEEKLY_EDITION, WEEKLY_TEST_DATE } = process.env;
  if (!OPENAI_API_KEY) throw Error('Set OPENAI_API_KEY før nettsøket.');
  const period = newsPeriod(new Date(), WEEKLY_EDITION, WEEKLY_TEST_DATE);
  const youthTopics = await supernyttTopics(period);
  console.log('Fann ' + youthTopics.length + ' daterte omtalar frå Supernytt.');
  const batches = await Promise.allSettled(topics.map(async topic => {
    const articles = (await researchTopic(topic, period, youthTopics, OPENAI_API_KEY)).slice(0, 10);
    console.log('Nettsøk om ' + topic + ' fann ' + articles.length + ' kjelder.');
    return articles;
  }));
  const unique = new Map();
  for (const [index, batch] of batches.entries()) {
    if (batch.status === 'rejected') {
      console.log('Nettsøket om ' + topics[index] + ' feila: ' + batch.reason.message);
      continue;
    }
    for (const article of batch.value) {
      const key = articleKey(article.url);
      if (!unique.has(key)) unique.set(key, article);
    }
  }
  if (!unique.size) throw Error('Ingen av nettsøka gav eit gyldig kjeldegrunnlag.');
  const sources = [...unique.values()].map((source, index) => ({ ...source, id: 'kjelde-' + (index + 1) }));
  const evidence = JSON.stringify(sources, null, 2);
  const draftSchema = JSON.parse(readFileSync(new URL('./weekly-news.schema.json', import.meta.url), 'utf8'));
  draftSchema.$defs.question.properties.sourceId.enum = sources.map(source => source.id);
  writeFileSync(join(RUNNER_TEMP, 'weekly-sources.json'), evidence + '\n');
  writeFileSync(join(RUNNER_TEMP, 'weekly-draft.schema.json'), JSON.stringify(draftSchema) + '\n');
  appendFileSync(join(RUNNER_TEMP, 'weekly-prompt.md'), '\n# Kjeldegrunnlag for vekefrøda\n\n' + JSON.stringify(sources) + '\n');
  if (youthTopics.length) appendFileSync(join(RUNNER_TEMP, 'weekly-prompt.md'),
    '\n# Tematips frå Supernytt\n\nBruk desse som tips til prioritering. Hald deg til kjeldegrunnlaget for konkrete fakta.\n' + JSON.stringify(youthTopics) + '\n');
  console.log('Nettsøket fann ' + sources.length + ' kjelder frå ' + period.from + ' til ' + period.through + '.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}
