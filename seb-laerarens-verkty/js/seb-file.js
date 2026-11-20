/* Safe Exam Browser password envelopes and property lists. */
(function () {
  'use strict';

  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const prefix = encoder.encode('pswd');
  const fileLimit = 4 * 1024 * 1024;
  const settingsLimit = 8 * 1024 * 1024;
  const aes = { name: 'AES-CBC', length: 256 };
  const hmac = { name: 'HMAC', hash: 'SHA-256', length: 256 };

  function fail(code) {
    const error = new Error(code);
    error.name = 'SebFileError';
    throw error;
  }

  // Bound both gzip layers before parsing untrusted settings.
  async function gunzip(bytes, limit) {
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel().catch(() => {});
          fail('size');
        }
        chunks.push(value);
      }
    } catch (error) {
      if (error.name === 'SebFileError') throw error;
      fail('format');
    } finally {
      reader.releaseLock();
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  function gzip(parts) {
    const stream = new Blob(parts).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  async function importPassword(password) {
    const bytes = encoder.encode(password);
    try {
      return await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']);
    } finally {
      bytes.fill(0);
    }
  }

  function deriveKey(password, salt, algorithm, usage) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-1', iterations: 10000, salt },
      password, algorithm, false, [usage]);
  }

  async function readContainer(file) {
    if (!file.size) fail('format');
    if (file.size > fileLimit) fail('size');
    return gunzip(await file.arrayBuffer(), fileLimit);
  }

  async function readEnvelope(file, password) {
    const outer = await readContainer(file);
    const kind = String.fromCharCode(...outer.subarray(0, 4));
    if (kind === 'pkhs' || kind === 'phsk') fail('certificate');
    if (kind === 'pwcc') fail('purpose');
    if (kind !== 'pswd') fail('format');
    const packet = outer.subarray(4);
    const version = packet[0];
    if (packet.byteLength < 82 || (packet.byteLength - 66) % 16 !== 0 ||
        ![2, 3].includes(version) || packet[1] !== 1) fail('format');

    // Verify the full envelope before attempting AES decryption.
    const verificationKey = await deriveKey(password, packet.subarray(10, 18), hmac, 'verify');
    if (!await crypto.subtle.verify('HMAC', verificationKey, packet.subarray(-32), packet.subarray(0, -32))) {
      fail('password');
    }
    let compressed;
    try {
      const key = await deriveKey(password, packet.subarray(2, 10), aes, 'decrypt');
      compressed = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: packet.subarray(18, 34) },
        key, packet.subarray(34, -32));
    } catch {
      fail('format');
    }
    return { version, bytes: await gunzip(compressed, settingsLimit) };
  }

  function readSettings(bytes) {
    let xml;
    try {
      xml = decoder.decode(bytes);
    } catch {
      fail('format');
    } finally {
      bytes.fill(0);
    }
    // Accept the standard plist declaration, but reject custom XML entities.
    if (/<!ENTITY\s/i.test(xml)) fail('format');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const root = doc.documentElement;
    const dictionary = root.firstElementChild;
    if (root.tagName !== 'plist' || root.children.length !== 1 || dictionary?.tagName !== 'dict' ||
        doc.doctype?.internalSubset || doc.getElementsByTagName('parsererror').length) fail('format');

    const entries = dictionary.children;
    const settings = new Map();
    if (entries.length % 2 !== 0) fail('format');
    for (let index = 0; index < entries.length; index += 2) {
      const key = entries[index];
      if (key.tagName !== 'key' || key.childElementCount || settings.has(key.textContent)) fail('format');
      settings.set(key.textContent, entries[index + 1]);
    }
    const purpose = settings.get('sebConfigPurpose');
    if (purpose && (purpose.tagName !== 'integer' || purpose.textContent.trim() !== '0')) fail('purpose');
    return { doc, dictionary, settings };
  }

  async function writeEnvelope(version, xml, password) {
    // SEB expects separate salts and a fresh IV for each file.
    const encryptionSalt = crypto.getRandomValues(new Uint8Array(8));
    const authenticationSalt = crypto.getRandomValues(new Uint8Array(8));
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const [key, signingKey, compressed] = await Promise.all([
      deriveKey(password, encryptionSalt, aes, 'encrypt'),
      deriveKey(password, authenticationSalt, hmac, 'sign'),
      gzip([xml])
    ]);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, compressed);
    const body = await new Blob([new Uint8Array([version, 1]), encryptionSalt, authenticationSalt, iv, encrypted]).arrayBuffer();
    const signature = await crypto.subtle.sign('HMAC', signingKey, body);
    return new Blob([await gzip([prefix, body, signature])], { type: 'application/octet-stream' });
  }

  async function writeExam({ version, bytes }, startUrl, password) {
    const { doc, dictionary, settings } = readSettings(bytes);
    let start = settings.get('startURL');
    if (start && start.tagName !== 'string') fail('format');
    if (!start) {
      const name = doc.createElement('key');
      name.textContent = 'startURL';
      start = doc.createElement('string');
      dictionary.append(name, start);
    }
    start.textContent = startUrl;
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(doc);
    const blob = await writeEnvelope(version, xml, password);
    const filterEnabled = settings.get('URLFilterEnable')?.tagName === 'true';
    return { blob, filterEnabled };
  }

  async function exportExam(file, templatePassword, startUrl, newPassword) {
    const sourceKey = await importPassword(templatePassword);
    const source = await readEnvelope(file, sourceKey);
    const outputKey = newPassword ? await importPassword(newPassword) : sourceKey;
    return writeExam(source, startUrl, outputKey);
  }

  async function exportFromStandard(file, startUrl, password) {
    // Only the bundled public template uses the plain SEB container.
    if (!password) fail('password');
    const outer = await readContainer(file);
    if (String.fromCharCode(...outer.subarray(0, 4)) !== 'plnd') fail('format');
    const bytes = await gunzip(outer.subarray(4), settingsLimit);
    return writeExam({ version: 2, bytes }, startUrl, await importPassword(password));
  }

  window.SebFile = Object.freeze({ exportExam, exportFromStandard });
})();
