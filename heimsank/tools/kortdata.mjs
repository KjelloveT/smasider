// ════════════════════════════════════════════════════════════════════
// HEIMSANK — Byggjeskript for kortdata (køyrast for hand, aldri i spelet)
//
//   node heimsank/tools/kortdata.mjs hent <id>
//     Køyrer tools/sparql/<id>.rq og skriv kort/<csv>. Finst det ei
//     <id>.utan.rq, blir elementa ho returnerer trekte frå. Lagar
//     rarity-fila berre om ho ikkje finst frå før. Hentar lisensar til slutt.
//
//   node heimsank/tools/kortdata.mjs lisens [id …] [--alle]
//     Legg opphavsperson og lisens frå Wikimedia Commons til i CSV-ane
//     (alle kategoriane i categories.json om ingen id er gjeven). Utan
//     --alle blir berre rader som manglar lisens slått opp.
//
// Kvifor lisensen blir bakt inn her og ikkje henta i spelet: CSP-en tillèt
// ikkje fetch mot commons.wikimedia.org/w/api.php, og ein ekstra
// førespurnad per kort ville sendt IP-adressa til Wikimedia éin gong til.
//
// Rarity-filene blir aldri skrivne over. Samlingane til elevane er lagra
// per Q-id, og ei ny fordeling ville endra kort dei alt har fått.
//
// Ingen npm-avhengnader: Node 18+ har innebygd fetch.
// ════════════════════════════════════════════════════════════════════

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KORT_DIR = join(__dirname, '..', 'kort');
const SPARQL_DIR = join(__dirname, 'sparql');

const UA = 'Heimsank-kortdata/1.0 (Vyrdepil; https://github.com/KjelloveT)';
const WD_SPARQL = 'https://query.wikidata.org/sparql';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const FILEPATH = /^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//;

// Same fordeling som RW i js/state.js. Resten blir «vanleg».
const RARITY_PCT = { gudebore: 3, segngjeten: 7, sjeldgjevt: 25 };
const LISENS_KOLONNER = ['imageAuthor', 'imageLicense', 'imageLicenseUrl'];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function finst(sti) {
  try { await access(sti); return true; } catch { return false; }
}

// ── Henting med retry ────────────────────────────────────────────────
// Wikimedia rate-avgrensar hardt. Alt går serielt, og 429/5xx/maxlag
// blir venta ut i staden for å gi opp.
async function hentJSON(url, init = {}, forsok = 6) {
  for (let i = 1; i <= forsok; i++) {
    let res;
    try {
      res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } });
    } catch (e) {
      if (i === forsok) throw e;
      console.warn(`  nettverksfeil (${e.message}), prøver igjen …`);
      await sleep(3000 * i);
      continue;
    }
    if (res.ok) {
      const data = await res.json();
      // MediaWiki svarar 200 med error.code = maxlag når databasane heng etter
      if (data.error?.code === 'maxlag') {
        const vent = Number(res.headers.get('Retry-After')) || 5;
        console.warn(`  maxlag, ventar ${vent} s …`);
        await sleep(vent * 1000);
        continue;
      }
      if (data.error) throw new Error(`${data.error.code}: ${data.error.info}`);
      return data;
    }
    if (i === forsok || ![429, 500, 502, 503, 504].includes(res.status)) {
      throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const vent = Number(res.headers.get('Retry-After')) || 5 * i;
    console.warn(`  HTTP ${res.status}, ventar ${vent} s …`);
    await sleep(vent * 1000);
  }
  throw new Error('Gav opp etter fleire forsøk');
}

async function sparql(query) {
  const data = await hentJSON(WD_SPARQL, {
    method: 'POST',
    headers: { 'Accept': 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query })
  });
  const vars = data.head.vars;
  const rows = data.results.bindings.map(b => Object.fromEntries(vars.map(v => [v, b[v] ? b[v].value : ''])));
  return { vars, rows };
}

// ── CSV ──────────────────────────────────────────────────────────────
// Same reglar som parseCSV i js/utils.js. Den tolkar ikkje linjeskift inne
// i hermeteikn, så skrivCSV byter dei ut med mellomrom.
function parseLine(l) {
  const f = [];
  let c = '';
  let q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (ch === '"') {
      if (q && l[i + 1] === '"') { c += '"'; i++; } else { q = !q; }
    } else if (ch === ',' && !q) {
      f.push(c);
      c = '';
    } else {
      c += ch;
    }
  }
  f.push(c);
  return f;
}

function lesCSV(tekst) {
  // fly, hest og kunst er lagra med BOM
  const utanBOM = tekst.charCodeAt(0) === 0xFEFF ? tekst.slice(1) : tekst;
  const lines = utanBOM.trim().split(/\r?\n/);
  const hdr = parseLine(lines[0]);
  const rows = lines.slice(1).map(l => {
    const v = parseLine(l);
    return Object.fromEntries(hdr.map((h, i) => [h, v[i] ?? '']));
  });
  return { hdr, rows };
}

const celle = s => `"${String(s ?? '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`;

function skrivCSV(hdr, rows) {
  return hdr.join(',') + '\n' + rows.map(r => hdr.map(h => celle(r[h])).join(',')).join('\n') + '\n';
}

// ── Rarity ───────────────────────────────────────────────────────────
// Seeda med kategori-id-en, så same liste gir same fordeling kvar gong.
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s) {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function lagRarity(id, qids) {
  const rnd = mulberry32(hashSeed(id));
  const arr = [...qids].sort();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const out = {};
  let idx = 0;
  for (const [tier, pct] of Object.entries(RARITY_PCT)) {
    const n = Math.max(1, Math.round(arr.length * pct / 100));
    for (let k = 0; k < n && idx < arr.length; k++) out[arr[idx++]] = tier;
  }
  while (idx < arr.length) out[arr[idx++]] = 'vanleg';
  return out;
}

// ── Lisens frå Commons ───────────────────────────────────────────────
function filnamn(url) {
  if (!FILEPATH.test(url || '')) return null;
  try { return decodeURIComponent(url.replace(FILEPATH, '').split('?')[0]); } catch { return null; }
}

// Artist er HTML (lenkjer, span, iblant heile tabellar). Kortet treng berre teksten.
function utanHTML(html) {
  const tekst = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return tekst.length > 140 ? tekst.slice(0, 139).trimEnd() + '…' : tekst;
}

function lisensUrl(u) {
  let url = String(u || '').trim();
  if (url.startsWith('//')) url = 'https:' + url;
  return /^https?:\/\//.test(url) ? url.replace(/^http:/, 'https:') : '';
}

async function hentLisensar(filer) {
  const ut = new Map();
  for (let i = 0; i < filer.length; i += 50) {
    const bolk = filer.slice(i, i + 50);
    const data = await hentJSON(COMMONS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'extmetadata',
        iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
        titles: bolk.map(f => 'File:' + f).join('|'),
        redirects: '1',
        format: 'json',
        formatversion: '2',
        maxlag: '5'
      })
    });
    // Commons normaliserer titlar (understrek, stor forbokstav) og følgjer
    // omdirigeringar. Følg same kjede frå tittelen vi bad om.
    const alias = new Map();
    for (const n of data.query?.normalized || []) alias.set(n.from, n.to);
    for (const r of data.query?.redirects || []) alias.set(r.from, r.to);
    const sider = new Map((data.query?.pages || []).map(p => [p.title, p]));
    for (const f of bolk) {
      let tittel = 'File:' + f;
      for (let k = 0; k < 3 && alias.has(tittel); k++) tittel = alias.get(tittel);
      const meta = sider.get(tittel)?.imageinfo?.[0]?.extmetadata;
      ut.set(f, meta ? {
        imageAuthor: utanHTML(meta.Artist?.value),
        imageLicense: utanHTML(meta.LicenseShortName?.value),
        imageLicenseUrl: lisensUrl(meta.LicenseUrl?.value)
      } : null);
    }
    process.stdout.write(`\r  ${Math.min(i + 50, filer.length)}/${filer.length} filer`);
    await sleep(1000);
  }
  if (filer.length) process.stdout.write('\n');
  return ut;
}

async function lesKategoriar() {
  return JSON.parse(await readFile(join(KORT_DIR, 'categories.json'), 'utf8'));
}

// Commons fyller inn eigen tekst når forfattarfeltet manglar eller er dobla.
// Kortet har lite plass, så gjer han kort og lesbar.
function ryddForfattar(s) {
  let t = String(s || '').trim();
  const antatt = t.match(/^No machine-readable author provided\.\s*(.+?)\s+assumed\b/i);
  if (antatt) t = antatt[1];
  t = t
    .replace(/~commonswiki\b/g, '')
    .replace(/\(\s*\[\[[^\]]*\]\]\s*\)/g, '')          // ([[User talk:X| talk ]])
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')  // [[Side|tekst]] -> tekst
    .replace(/\s*\[\d+\]/g, '')                        // fotnotar som [2]
    .replace(/\s+/g, ' ')
    .trim();
  // «Unknown author Unknown author»
  const midt = (t.length - 1) / 2;
  if (Number.isInteger(midt) && t[midt] === ' ' && t.slice(0, midt) === t.slice(midt + 1)) t = t.slice(0, midt);
  if (/^unknown( author)?$/i.test(t)) t = 'ukjend';
  return t;
}

async function lisens(ids, alle) {
  const cats = await lesKategoriar();
  for (const id of ids) {
    if (!cats.some(c => c.id === id)) throw new Error(`Fann ikkje kategorien «${id}» i categories.json`);
  }
  const valde = ids.length ? cats.filter(c => ids.includes(c.id)) : cats;

  for (const cat of valde) {
    const sti = join(KORT_DIR, cat.csv);
    const { hdr, rows } = lesCSV(await readFile(sti, 'utf8'));
    const imgF = cat.imageField || 'image';
    for (const k of LISENS_KOLONNER) if (!hdr.includes(k)) hdr.push(k);
    for (const r of rows) for (const k of LISENS_KOLONNER) r[k] ??= '';

    const treng = rows.filter(r => filnamn(r[imgF]) && (alle || !r.imageLicense));
    const filer = [...new Set(treng.map(r => filnamn(r[imgF])))];
    console.log(`${cat.id}: ${rows.length} rader, slår opp ${filer.length} filer på Commons`);

    const meta = await hentLisensar(filer);
    let manglar = 0;
    for (const r of treng) {
      const m = meta.get(filnamn(r[imgF]));
      if (m) Object.assign(r, m); else manglar++;
    }
    for (const r of rows) r.imageAuthor = ryddForfattar(r.imageAuthor);
    await writeFile(sti, skrivCSV(hdr, rows), 'utf8');
    if (manglar) console.warn(`  ${manglar} rader fekk ingen metadata (fila manglar eller er sletta på Commons)`);
  }
}

async function hent(id) {
  const cats = await lesKategoriar();
  const cat = cats.find(c => c.id === id);
  if (!cat) throw new Error(`Legg inn «${id}» i categories.json før du hentar`);

  const { vars, rows } = await sparql(await readFile(join(SPARQL_DIR, `${id}.rq`), 'utf8'));
  for (const f of [cat.idField, cat.nameField, cat.imageField, cat.articleField, cat.statField]) {
    if (!vars.includes(f)) throw new Error(`Spørjinga manglar kolonna «${f}» som categories.json peikar på`);
  }

  let utan = new Set();
  const utanSti = join(SPARQL_DIR, `${id}.utan.rq`);
  if (await finst(utanSti)) {
    await sleep(2000);
    const r = await sparql(await readFile(utanSti, 'utf8'));
    utan = new Set(r.rows.map(x => x[r.vars[0]]));
  }

  // Éi rad per element, og berre element med bilete (carddata.js hoppar over resten uansett)
  const perId = new Map();
  for (const r of rows) {
    if (r[cat.imageField] && !utan.has(r[cat.idField]) && !perId.has(r[cat.idField])) perId.set(r[cat.idField], r);
  }
  const liste = [...perId.values()].sort((a, b) => a[cat.nameField].localeCompare(b[cat.nameField], 'nn'));

  // Ta vare på lisensdata frå førre køyring der biletet er det same
  const sti = join(KORT_DIR, cat.csv);
  if (await finst(sti)) {
    const gamle = new Map(lesCSV(await readFile(sti, 'utf8')).rows.map(r => [r[cat.idField], r]));
    for (const r of liste) {
      const g = gamle.get(r[cat.idField]);
      if (g && g[cat.imageField] === r[cat.imageField]) for (const k of LISENS_KOLONNER) r[k] = g[k] || '';
    }
  }
  await writeFile(sti, skrivCSV([...vars, ...LISENS_KOLONNER], liste), 'utf8');
  console.log(`${id}: ${liste.length} kort skrivne til kort/${cat.csv}` + (utan.size ? ` (${utan.size} element trekte frå)` : ''));

  const qids = liste.map(r => r[cat.idField].replace('http://www.wikidata.org/entity/', ''));
  const rarSti = join(KORT_DIR, cat.rarity);
  if (await finst(rarSti)) {
    const rar = JSON.parse(await readFile(rarSti, 'utf8'));
    const nye = qids.filter(q => !(q in rar)).length;
    console.log(`  ${cat.rarity} finst og blir ikkje endra` + (nye ? ` — ${nye} nye kort blir «vanleg»` : ''));
  } else {
    await writeFile(rarSti, JSON.stringify(lagRarity(id, qids), null, 2) + '\n', 'utf8');
    console.log(`  ${cat.rarity} laga`);
  }

  await lisens([id], false);
}

// ── Hovudprogram ─────────────────────────────────────────────────────
const [kommando, ...arg] = process.argv.slice(2);
const ids = arg.filter(a => !a.startsWith('--'));

try {
  if (kommando === 'hent' && ids.length === 1) {
    await hent(ids[0]);
  } else if (kommando === 'lisens') {
    await lisens(ids, arg.includes('--alle'));
  } else {
    console.log('Bruk:\n  node heimsank/tools/kortdata.mjs hent <id>\n  node heimsank/tools/kortdata.mjs lisens [id …] [--alle]');
    process.exit(1);
  }
} catch (e) {
  console.error('Feil:', e.message);
  process.exit(1);
}
