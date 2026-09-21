// Finn ein kandidatpool til «Fotballspelarar 2026» frå dei mest lesne sidene
// på bokmålswikipedia, og skriv den avgrensa VALUES-spørjinga som byggjer CSV.
//
// Vindauget er låst til 60 heile dagar før årgangen vart laga. Ein ny årgang
// skal bruke sitt eige, dokumenterte vindauge i staden for å endre 2026-lista.

import { writeFile } from 'node:fs/promises';

const UA = 'Heimsank-kortdata/1.0 (Vyrdepil; https://github.com/KjelloveT)';
const START = new Date('2026-07-20T00:00:00Z');
const DAYS = 60;
const TOP_API = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/no.wikipedia.org/all-access';
const NO_API = 'https://no.wikipedia.org/w/api.php';
const WD_API = 'https://www.wikidata.org/w/api.php';
// Feilpositive treff og avslutta spelarkarrierar som framleis har gamle,
// opne lagutsegner i Wikidata.
const EXCLUDED = new Set([
  'Q520116', 'Q166984', 'Q17507', 'Q201381', 'Q1189', 'Q18224825',
  'Q17499', 'Q1778174', 'Q1797495', 'Q776291', 'Q368682', 'Q313936',
  'Q747257', 'Q50821956', 'Q786602', 'Q384542', 'Q266613', 'Q21226404',
  'Q1642994', 'Q2456388', 'Q7517540', 'Q489039', 'Q208050', 'Q3752820',
  'Q16234159', 'Q115819313', 'Q3804881', 'Q1790935', 'Q194769'
]);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function hentJSON(url, init = {}, forsok = 6, godta404 = false) {
  for (let i = 1; i <= forsok; i++) {
    const response = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } });
    if (response.ok) {
      const data = await response.json();
      if (!data.error) return data;
      if (data.error.code !== 'maxlag' || i === forsok) {
        throw new Error(`${data.error.code}: ${data.error.info}`);
      }
      await sleep((Number(response.headers.get('Retry-After')) || i * 3) * 1000);
      continue;
    }
    if (godta404 && response.status === 404) return null;
    if (i === forsok || ![429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    await sleep((Number(response.headers.get('Retry-After')) || i * 3) * 1000);
  }
}

function url(base, params) {
  const out = new URL(base);
  for (const [key, value] of Object.entries(params)) out.searchParams.set(key, value);
  return out;
}

function bitar(items, storleik) {
  const out = [];
  for (let i = 0; i < items.length; i += storleik) out.push(items.slice(i, i + storleik));
  return out;
}

const pad = n => String(n).padStart(2, '0');
const dato = d => `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;

const visningar = new Map();
for (let dag = 0; dag < DAYS; dag++) {
  const d = new Date(START);
  d.setUTCDate(d.getUTCDate() + dag);
  const data = await hentJSON(`${TOP_API}/${dato(d)}`, {}, 6, true);
  if (!data) {
    process.stderr.write(`\rTopplister: ${dag + 1}/${DAYS} (manglar ${dato(d)})`);
    continue;
  }
  for (const row of data.items?.[0]?.articles || []) {
    let article = row.article;
    try { article = decodeURIComponent(article); } catch { /* bruk tittelen som han er */ }
    if (article.startsWith('Spesial:') || article === 'Hovedside') continue;
    visningar.set(article, (visningar.get(article) || 0) + Number(row.views || 0));
  }
  process.stderr.write(`\rTopplister: ${dag + 1}/${DAYS}`);
}
process.stderr.write('\n');

const titlar = [...visningar.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, process.env.HEIMSANK_DEBUG ? 1000 : 10000)
  .map(([title]) => title);
const sideTilQid = new Map();
for (const [index, bolk] of bitar(titlar, 50).entries()) {
  const data = await hentJSON(url(NO_API, {
    action: 'query', prop: 'pageprops', ppprop: 'wikibase_item',
    titles: bolk.join('|'), redirects: '1', format: 'json', formatversion: '2', maxlag: '5'
  }));
  const alias = new Map();
  for (const n of data.query?.normalized || []) alias.set(n.from, n.to);
  for (const r of data.query?.redirects || []) alias.set(r.from, r.to);
  const sideQid = new Map((data.query?.pages || [])
    .filter(page => page.pageprops?.wikibase_item)
    .map(page => [page.title, page.pageprops.wikibase_item]));
  for (const original of bolk) {
    let title = original.replace(/_/g, ' ');
    for (let k = 0; k < 3 && alias.has(title); k++) title = alias.get(title);
    const qid = sideQid.get(title);
    if (qid) sideTilQid.set(original, qid);
  }
  process.stderr.write(`\rWikipedia-sider: ${Math.min((index + 1) * 50, titlar.length)}/${titlar.length}`);
  await sleep(100);
}
process.stderr.write('\n');

const qidViews = new Map();
for (const [title, views] of visningar) {
  const qid = sideTilQid.get(title);
  if (qid) qidViews.set(qid, Math.max(qidViews.get(qid) || 0, views));
}

const godkjende = [];
const qids = [...qidViews.keys()];
const qidBatches = bitar(qids, 50);
let hentaQids = 0;
for (let i = 0; i < qidBatches.length; i += 5) {
  const gruppe = qidBatches.slice(i, i + 5);
  const svar = await Promise.all(gruppe.map(bolk => hentJSON(url(WD_API, {
    action: 'wbgetentities', ids: bolk.join('|'), props: 'claims|labels',
    languages: 'nn|nb|en', languagefallback: '1', format: 'json', formatversion: '2'
  }))));
  for (const data of svar) {
    for (const entity of Object.values(data.entities || {})) {
      const claims = entity.claims || {};
      const erSpelar = (claims.P106 || []).some(c => c.mainsnak?.datavalue?.value?.id === 'Q937857');
      const birth = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time || '';
      const year = Number(birth.match(/[+-](\d{4})/)?.[1] || 0);
      const image = claims.P18?.[0]?.mainsnak?.datavalue?.value;
      if (!erSpelar || year < 1985 || claims.P570?.length || !image || EXCLUDED.has(entity.id)) continue;
      const label = entity.labels?.nn?.value || entity.labels?.nb?.value || entity.labels?.en?.value || entity.id;
      godkjende.push({ qid: entity.id, label, views: qidViews.get(entity.id) || 0 });
    }
  }
  hentaQids += gruppe.reduce((sum, bolk) => sum + bolk.length, 0);
  process.stderr.write(`\rWikidata-element: ${hentaQids}/${qids.length}`);
  await sleep(100);
}
process.stderr.write('\n');

godkjende.sort((a, b) => b.views - a.views || a.label.localeCompare(b.label, 'nb'));
const kandidatar = godkjende.slice(0, 350);
const query = `# Fast kandidatpool til «Fotballspelarar 2026» i Heimsank.
# Laga av oppdag-fotballspelarar.mjs frå dei mest lesne sidene på
# bokmålswikipedia 2026-07-20–2026-09-17. kortdata.mjs rangerer kandidatane
# etter dei nøyaktige sidevisningane for same 60-dagarsperiode og tek 200.

SELECT ?item ?itemLabel (MIN(?img) AS ?image) (SAMPLE(?art) AS ?article)
       (SAMPLE(?nb) AS ?rankArticle)
       (MIN(?birth) AS ?birthDate) (MAX(?links) AS ?sitelinks)
WHERE {
  VALUES ?item {
${kandidatar.map(x => `    wd:${x.qid}`).join('\n')}
  }
  ?item wdt:P18 ?img ; wdt:P569 ?birth ; wikibase:sitelinks ?links .
  OPTIONAL { ?nn schema:about ?item ; schema:isPartOf <https://nn.wikipedia.org/> . }
  OPTIONAL { ?nb schema:about ?item ; schema:isPartOf <https://no.wikipedia.org/> . }
  BIND(COALESCE(?nn, ?nb) AS ?art)
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "nn,nb,en" .
  }
}
GROUP BY ?item ?itemLabel
`;
await writeFile(new URL('./sparql/fotballspelarar.rq', import.meta.url), query, 'utf8');
console.log(`# ${kandidatar.length} kandidatar frå ${DAYS} topplister, frå ${START.toISOString().slice(0, 10)}`);
console.log(kandidatar.map(x => `wd:${x.qid}`).join(' '));
console.log('\n# Kontrolliste');
for (const x of kandidatar) console.log(`${x.qid}\t${x.views}\t${x.label}`);
