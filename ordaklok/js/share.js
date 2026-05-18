/* Ordaklok — deling via URL
 * Bruker CompressionStream('gzip') når tilgjengeleg, fallback til rein base64.
 * Format: ?d=<base64url>  eller ?dz=<gzip+base64url>
 */
(function (root) {
  'use strict';

  function toBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function utf8Encode(s) { return new TextEncoder().encode(s); }
  function utf8Decode(b) { return new TextDecoder().decode(b); }

  async function streamThrough(stream, bytes) {
    const writer = stream.writable.getWriter();
    writer.write(bytes); writer.close();
    const reader = stream.readable.getReader();
    const chunks = [];
    let total = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value); total += value.length;
    }
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  async function encodeList(list) {
    const json = JSON.stringify(list);
    const raw = utf8Encode(json);
    if (typeof CompressionStream === 'function') {
      try {
        const compressed = await streamThrough(new CompressionStream('gzip'), raw);
        return { param: 'dz', value: toBase64Url(compressed) };
      } catch (e) { /* fall through */ }
    }
    return { param: 'd', value: toBase64Url(raw) };
  }

  async function decodeFromParams(params) {
    const dz = params.get('dz');
    const d = params.get('d');
    if (dz && typeof DecompressionStream === 'function') {
      const bytes = fromBase64Url(dz);
      const decompressed = await streamThrough(new DecompressionStream('gzip'), bytes);
      return JSON.parse(utf8Decode(decompressed));
    }
    if (d) {
      const bytes = fromBase64Url(d);
      return JSON.parse(utf8Decode(bytes));
    }
    return null;
  }

  async function buildShareUrl(list) {
    const { param, value } = await encodeList(list);
    const base = location.origin + location.pathname.replace(/[^/]+$/, '') + 'index.html';
    return base + '?' + param + '=' + value;
  }

  root.OrdaklokShare = {
    encodeList,
    decodeFromParams,
    buildShareUrl
  };
})(window);
