/* Lokal JSON-deling i URL-fragment. Appen eig innhaldsvalideringa. */
(function (root) {
  'use strict';
  const LIMIT = 2 * 1024 * 1024;
  function toBase64Url(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromBase64Url(value) {
    if (value.length > LIMIT * 2 || !/^[A-Za-z0-9_-]*={0,2}$/.test(value)) throw new Error('Ugyldig delelenkje.');
    const plain = value.replace(/-/g, '+').replace(/_/g, '/');
    let binary;
    try { binary = atob(plain + '='.repeat((4 - plain.length % 4) % 4)); }
    catch (_) { throw new Error('Ugyldig delelenkje.'); }
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }
  async function transform(bytes, stream) {
    const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        total += result.value.length;
        if (total > LIMIT) throw new Error('Delelenkja inneheld for mykje data. Bruk ei JSON-fil.');
        chunks.push(result.value);
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    const result = new Uint8Array(total);
    let offset = 0;
    chunks.forEach(chunk => { result.set(chunk, offset); offset += chunk.length; });
    return result;
  }
  async function encode(data) {
    const raw = new TextEncoder().encode(JSON.stringify(data));
    if (raw.length > LIMIT) throw new Error('Innhaldet er for stort til ei delelenkje.');
    if (typeof CompressionStream === 'function') {
      try { return { param: 'dz', value: toBase64Url(await transform(raw, new CompressionStream('gzip'))) }; }
      catch (error) { /* Ukopla nettlesarar kan dele ukomprimert JSON. */ }
    }
    return { param: 'd', value: toBase64Url(raw) };
  }
  async function decodeFromParams(params) {
    let bytes;
    if (params.has('dz')) {
      if (typeof DecompressionStream !== 'function') throw new Error('Nettlesaren kan ikkje opne komprimerte lenkjer. Bruk JSON-fila.');
      try { bytes = await transform(fromBase64Url(params.get('dz')), new DecompressionStream('gzip')); }
      catch (_) { throw new Error('Den komprimerte delelenkja er ugyldig eller for stor. Bruk ei JSON-fil.'); }
    } else if (params.has('d')) bytes = fromBase64Url(params.get('d'));
    else return null;
    if (bytes.length > LIMIT) throw new Error('Delelenkja er for stor.');
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch (_) { throw new Error('Delelenkja inneheld ikkje gyldig JSON-tekst.'); }
  }
  async function buildUrl(data, base) {
    const encoded = await encode(data);
    const url = new URL(base || location.href);
    url.search = '';
    url.hash = encoded.param + '=' + encoded.value;
    return url.href;
  }
  root.VyrdepilShare = { encode, decodeFromParams, buildUrl };
})(window);
