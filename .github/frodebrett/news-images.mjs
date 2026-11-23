const commons = 'https://commons.wikimedia.org';
const imageHosts = new Set(['https://upload.wikimedia.org', 'https://thumb.wikimedia.org']);
const imageLimit = 195_000;
const userAgent = 'Vyrdepil-Frodebrett/1.0 (https://github.com/KjelloveT/smasider)';

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
  if (!size) return null;
  return 'data:' + type + ';base64,' + Buffer.concat(chunks).toString('base64');
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
    const request = { headers: { 'User-Agent': userAgent }, redirect: 'error', signal: AbortSignal.timeout(12_000) };
    const response = await fetchPhoto(metadata, request);
    if (!response.ok) return null;
    const info = (await response.json()).query?.pages?.[0]?.imageinfo?.[0];
    const fields = info?.extmetadata;
    const author = fields?.Artist?.value?.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!author || /^unknown$/i.test(author) || !fields.LicenseUrl?.value || fields.Restrictions?.value) return null;
    const rights = licenseCredit(fields.LicenseUrl.value);
    const source = commonsFile(info.descriptionurl);
    const thumbnail = new URL(info.thumburl);
    if (!rights || !source || !imageHosts.has(thumbnail.origin)) return null;
    const image = await readThumbnail(await fetchPhoto(thumbnail, { ...request, signal: AbortSignal.timeout(12_000) }));
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
