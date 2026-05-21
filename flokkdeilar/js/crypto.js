/* ══════════════════════════════════════
   CRYPTO.JS — PIN-hashing via SubtleCrypto (SHA-256)
   ══════════════════════════════════════ */

const PinCrypto = (() => {
    function hexFromBuffer(buf) {
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return hexFromBuffer(bytes.buffer);
    }

    async function hash(pin, salt) {
        const msg = new TextEncoder().encode(pin + salt);
        const buf = await crypto.subtle.digest('SHA-256', msg);
        return hexFromBuffer(buf);
    }

    async function verify(pin, salt, storedHash) {
        const computed = await hash(pin, salt);
        return computed === storedHash;
    }

    return { randomSalt, hash, verify };
})();
