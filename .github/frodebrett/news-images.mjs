import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const commons = 'https://commons.wikimedia.org';
const imageHosts = new Set(['https://upload.wikimedia.org', 'https://thumb.wikimedia.org']);
const imageLimit = 195_000;
const userAgent = 'Vyrdepil-Frodebrett/1.0 (https://github.com/KjelloveT/smasider)';
const pressHosts = [
  'nrk.no', 'tv2.no', 'vg.no', 'dagbladet.no', 'aftenposten.no', 'nettavisen.no', 'e24.no', 'dn.no', 'bt.no',
  'adressa.no', 'abcnyheter.no', 'morgenbladet.no', 'klassekampen.no', 'radioh.no',
  'apnews.com', 'reuters.com', 'bbc.com', 'bbc.co.uk', 'euronews.com', 'theguardian.com',
  'cnn.com', 'nytimes.com', 'cnbc.com', 'nvidia.com', 'regjeringen.no', 'stortinget.no', 'olympics.com',
  'fotball.no', 'fifa.com', 'uefa.com', 'skiforbundet.no', 'worldathletics.org'
];
const pressImageHosts = [...pressHosts, 'nrk.cloud', 'vgcloud.no', 'ichef.bbci.co.uk', 'euro.news',
  'en-images-on-demand.s3.amazonaws.com'];
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
  if (!encoded || image.length > 260100) return null;
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
  if (!article || !proposal?.credit || !proposal.description) return null;
  try {
    const metadata = await articleMetadata(await fetchPhoto(article, requestOptions()));
    const images = ['og:image:secure_url', 'og:image', 'twitter:image'].flatMap(key => {
      const value = metadata.get(key);
      return value ? [pressUrl(new URL(value, article).href, pressImageHosts)] : [];
    }).filter(Boolean);
    const proposed = new URL(proposal.url);
    const photo = proposed.href === article.href ? images[0] : images.find(image => image.href === proposed.href);
    if (!photo || /(?:placeholder|favicon|\/logo[./_-])/i.test(photo.pathname)) return null;
    const image = await readThumbnail(await fetchPhoto(photo, requestOptions()));
    if (!image) return null;
    return {
      image, imageAlt: proposal.description,
      imageCredit: {
        title: proposal.description, author: proposal.credit, publisher: source.publisher,
        source: article.href, imageUrl: photo.href, license: 'Pressefoto', preserved: true
      }
    };
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
  const kept = new Set();
  for (const item of items) {
    const photo = decodeImage(item.image);
    if (!photo) continue;
    const hash = createHash('sha256').update(photo.bytes).digest('hex').slice(0, 24);
    const name = hash + '.' + (photo.format === 'jpeg' ? 'jpg' : photo.format);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, name), photo.bytes);
    kept.add(name);
    item.image = photoFolder + '/' + name;
  }
  let files;
  try {
    files = readdirSync(folder, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const file of files) {
    if (file.isFile() && photoName.test(file.name) && !kept.has(file.name)) rmSync(join(folder, file.name));
  }
}

export async function licensedImage(imagePage, alt, fetchPhoto = fetch) {
  try {
    const title = commonsFile(imagePage);
    if (!title || !alt) return null;
    const metadata = new URL('/w/api.php', commons);
    metadata.search = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', redirects: '1', titles: title,
      prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '500',
      iiextmetadatafilter: 'Artist|LicenseUrl|Restrictions'
    }).toString();
    const response = await fetchPhoto(metadata, requestOptions());
    if (!response.ok) return null;
    const info = (await response.json()).query?.pages?.[0]?.imageinfo?.[0];
    const fields = info?.extmetadata;
    const author = fields?.Artist?.value?.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!author || /^unknown$/i.test(author) || !fields.LicenseUrl?.value || fields.Restrictions?.value) return null;
    const rights = licenseCredit(fields.LicenseUrl.value);
    const source = commonsFile(info.descriptionurl);
    const thumbnail = new URL(info.thumburl);
    if (!rights || !source || !imageHosts.has(thumbnail.origin)) return null;
    const image = await readThumbnail(await fetchPhoto(thumbnail, requestOptions()));
    if (!image) return null;

    return {
      image, imageAlt: alt,
      imageCredit: { title: source.slice(5).replace(/_/g, ' '), author, source: info.descriptionurl, ...rights }
    };
  } catch {
    // Uvisse om fil, opphav eller lisens gjev eit spørsmål utan bilete.
    return null;
  }
}
