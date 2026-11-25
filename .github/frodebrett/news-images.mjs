import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const commons = 'https://commons.wikimedia.org';
const imageHosts = new Set(['https://upload.wikimedia.org', 'https://thumb.wikimedia.org']);
export const imageLimit = 450_000;
const userAgent = 'Vyrdepil-Frodebrett/1.0 (https://github.com/KjelloveT/smasider)';
const pressHosts = [
  'nrk.no', 'tv2.no', 'vg.no', 'dagbladet.no', 'aftenposten.no', 'nettavisen.no', 'e24.no', 'dn.no', 'bt.no',
  'adressa.no', 'abcnyheter.no', 'morgenbladet.no', 'klassekampen.no', 'radioh.no',
  'apnews.com', 'reuters.com', 'bbc.com', 'bbc.co.uk', 'euronews.com', 'theguardian.com',
  'aljazeera.com', 'yna.co.kr', 'elpais.com', 'aol.com', 'oslo.kommune.no',
  'cnn.com', 'nytimes.com', 'cnbc.com', 'abcnews.com', 'antaranews.com', 'techradar.com', 'nvidia.com',
  'regjeringen.no', 'stortinget.no', 'olympics.com', 'sportsbasen.no', 'fotball.no', 'fifa.com', 'uefa.com',
  'skiforbundet.no', 'worldathletics.org', 'forskning.no', 'nrksuper.no', 'framtida.no',
  'ung.no', 'skysports.com', 'sky.com', 'cbsnews.com', 'space.com', 'nature.com', 'theconversation.com',
  'abc.net.au', 'formula1.com', 'svt.se', 'yle.fi', 'dr.dk', 'nasa.gov', 'channelnewsasia.com',
  'lemonde.fr', 'kyivindependent.com', 'unicef.org', 'brecorder.com'
];
const pressImageHosts = [...pressHosts, 'nrk.cloud', 'vgc.no', 'vgcloud.no', 'ichef.bbci.co.uk', 'euro.news',
  'i.guim.co.uk', 'i.abcnewsfe.com', 'cdn.mos.cms.futurecdn.net', 'en-images-on-demand.s3.amazonaws.com',
  'cbsnewsstatic.com', 'skysports.com', 'img.formula1.com', 'cdn.sanity.io', 'svtstatic.se',
  'mediacorp.sg', 'lemde.fr', 'hermes.media.transform.aol.com', 'hermes.media.static.aol.com'];
const photoFolder = 'json/weekly-media';
const photoName = /^[a-f0-9]{24}\.(jpg|png|webp)$/;

function pressUrl(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host)) ? url : null;
  } catch {
    return null;
  }
}

export function commonsFile(url) {
  try {
    const page = new URL(url);
    if (page.origin !== commons || page.username || page.password || !page.pathname.startsWith('/wiki/File:')) return null;
    const file = decodeURIComponent(page.pathname.slice('/wiki/'.length));
    return /^File:[^|\x00-\x1F]{1,250}$/u.test(file) ? file : null;
  } catch {
    return null;
  }
}

function licenseCredit(value) {
  const url = new URL(value);
  if (url.hostname !== 'creativecommons.org' || !['https:', 'http:'].includes(url.protocol)
    || url.username || url.password || url.port) return null;
  const by = /^\/licenses\/(by|by-sa)\/(2\.0|2\.5|3\.0|4\.0)\/?$/.exec(url.pathname);
  if (by) return { license: 'CC ' + by[1].toUpperCase() + ' ' + by[2], licenseUrl: url.href.replace(/^http:/, 'https:') };
  if (url.pathname === '/publicdomain/zero/1.0/') return { license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' };
  if (url.pathname === '/publicdomain/mark/1.0/') return { license: 'Public Domain Mark 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' };
  return null;
}

function imageFormat(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

export function decodeImage(image) {
  const encoded = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!encoded || image.length > Math.ceil(imageLimit * 4 / 3) + 40) return null;
  const bytes = Buffer.from(encoded[2], 'base64');
  return bytes.length <= imageLimit && imageFormat(bytes) === encoded[1] ? { bytes, format: encoded[1] } : null;
}

async function readThumbnail(response) {
  const type = response.headers.get('content-type')?.split(';')[0];
  if (!response.ok || !/^image\/(jpeg|png|webp)$/.test(type) || Number(response.headers.get('content-length')) > imageLimit) return null;
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > imageLimit) return null;
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if ('image/' + imageFormat(bytes) !== type) return null;
  return 'data:' + type + ';base64,' + bytes.toString('base64');
}

function requestOptions() {
  return { headers: { 'User-Agent': userAgent }, redirect: 'error', signal: AbortSignal.timeout(12_000) };
}

function htmlValue(value) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(amp|quot|apos|lt|gt|#39);/g, (_, entity) => entities[entity] ?? "'");
}

async function articleMetadata(response) {
  if (!response.ok || !response.headers.get('content-type')?.startsWith('text/html')) return new Map();
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    const remaining = 500_000 - size;
    chunks.push(chunk.subarray(0, remaining));
    size += chunk.length;
    if (size >= 500_000) break;
  }
  const metadata = new Map();
  const html = Buffer.concat(chunks).toString('utf8').split(/<\/head>/i)[0];
  for (const match of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attrs = new Map([...match[1].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)]
      .map(([, name, value]) => [name.toLowerCase(), htmlValue(value)]));
    const key = attrs.get('property') ?? attrs.get('name');
    if (key && attrs.has('content') && !metadata.has(key)) metadata.set(key, attrs.get('content'));
  }
  return metadata;
}

export async function publisherImage(source, proposal, fetchPhoto = fetch) {
  const article = pressUrl(source.url, pressHosts);
  if (!article || !proposal?.description) return null;
  try {
    const metadata = await articleMetadata(await fetchPhoto(article, requestOptions()));
    const images = ['og:image:secure_url', 'og:image', 'twitter:image'].flatMap(key => {
      const value = metadata.get(key);
      return value ? [pressUrl(new URL(value, article).href, pressImageHosts)] : [];
    }).filter(Boolean);
    const proposed = new URL(proposal.url);
    const matches = proposed.href === article.href ? images.slice(0, 1) : images.filter(image => image.href === proposed.href);
    for (const photo of matches) {
      if (/(?:placeholder|favicon|\/logo[./_-]|default-image)/i.test(photo.pathname)) continue;
      const image = await readThumbnail(await fetchPhoto(photo, requestOptions()));
      if (image) return {
        image, imageAlt: proposal.description,
        imageCredit: {
          title: proposal.description, author: proposal.credit || 'Fotograf ikkje stadfesta', publisher: source.publisher,
          source: article.href, imageUrl: photo.href, license: 'Pressefoto', preserved: true
        }
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function weeklyImageFile(image) {
  if (typeof image !== 'string' || !image.startsWith(photoFolder + '/')) return null;
  const name = image.slice(photoFolder.length + 1);
  return photoName.test(name) ? name : null;
}

export function storeWeeklyImages(items, appDirectory) {
  const folder = join(appDirectory, photoFolder);
  for (const item of items) {
    const photo = decodeImage(item.image);
    if (!photo) continue;
    const hash = createHash('sha256').update(photo.bytes).digest('hex').slice(0, 24);
    const name = hash + '.' + (photo.format === 'jpeg' ? 'jpg' : photo.format);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, name), photo.bytes);
    item.image = photoFolder + '/' + name;
  }
}

async function commonsResults(params, fetchPhoto) {
  const metadata = new URL('/w/api.php', commons);
  metadata.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', redirects: '1', ...params,
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '500',
    iiextmetadatafilter: 'Artist|LicenseUrl|LicenseShortName|Copyrighted|Restrictions|ImageDescription'
  }).toString();
  const response = await fetchPhoto(metadata, requestOptions());
  return response.ok ? (await response.json()).query?.pages ?? [] : [];
}

function commonsTitle(source) {
  return source.slice(5).replace(/_/g, ' ');
}

export function illustrationAlt(title) {
  return 'Illustrasjonsbilete frå Wikimedia Commons. ' + title.replace(/\.[a-z0-9]{2,5}$/i, '');
}

async function commonsPhoto(info, fetchPhoto) {
  const fields = info?.extmetadata;
  const author = fields?.Artist?.value?.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  if (!author || /^unknown$/i.test(author) || fields.Restrictions?.value || !info.thumburl) return null;
  const publicDomain = /^public domain$/i.test(fields.LicenseShortName?.value ?? '')
    && /^false$/i.test(fields.Copyrighted?.value ?? '');
  const rights = (fields.LicenseUrl?.value && licenseCredit(fields.LicenseUrl.value))
    || (publicDomain && { license: 'Public Domain', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/' });
  const source = commonsFile(info.descriptionurl);
  const thumbnail = new URL(info.thumburl);
  if (!rights || !source || !imageHosts.has(thumbnail.origin)) return null;
  const image = await readThumbnail(await fetchPhoto(thumbnail, requestOptions()));
  const title = commonsTitle(source);
  return image ? {
    image, imageAlt: illustrationAlt(title),
    imageCredit: { title, author, source: info.descriptionurl, ...rights, illustration: true }
  } : null;
}

export async function licensedImage(imagePage, alt, fetchPhoto = fetch) {
  try {
    const title = commonsFile(imagePage);
    if (!title || !alt) return null;
    const pages = await commonsResults({ titles: title }, fetchPhoto);
    return await commonsPhoto(pages[0]?.imageinfo?.[0], fetchPhoto);
  } catch {
    // Uvisse om fil, opphav eller lisens gjev eit spørsmål utan bilete.
    return null;
  }
}

export async function findLicensedImage(search, alt, fetchPhoto = fetch) {
  if (typeof search !== 'string' || !alt) return null;
  const terms = search.normalize('NFKC').replace(/[^\p{L}\p{N} -]+/gu, ' ').trim().split(/\s+/).slice(0, 7);
  if (!terms[0]) return null;
  const significant = [...new Set(terms.map(term => term.toLowerCase()))]
    .filter(term => term.length > 2 && !/^(the|and|from|for)$/.test(term));
  if (!significant.length) return null;
  try {
    const searches = new Set([terms.join(' '), terms.slice(0, 3).join(' ')]);
    for (const query of searches) {
      const pages = await commonsResults({
        generator: 'search', gsrnamespace: '6', gsrlimit: '6', gsrsearch: query + ' filetype:bitmap'
      }, fetchPhoto);
      for (const page of pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
        const info = page.imageinfo?.[0];
        const title = String(page.title || '').toLowerCase();
        if (/logo|contact[- ]sheet|photo montage|watermark/i.test(title)) continue;
        const description = (title + ' ' + (info?.extmetadata?.ImageDescription?.value ?? '')).toLowerCase();
        const titleMatch = significant.some(term => title.includes(term));
        const matches = significant.filter(term => description.includes(term)).length;
        if (!titleMatch || matches < Math.min(2, significant.length)) continue;
        const photo = await commonsPhoto(info, fetchPhoto).catch(() => null);
        if (photo) return photo;
      }
    }
  } catch {
    // Eit utilgjengeleg eller uklårt bilete blir hoppa over.
  }
  return null;
}
