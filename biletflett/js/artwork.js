/* Biletbanken lastar berre ressursar som faktisk blir valde. */
const Artwork = (() => {
    const cache = new Map();
    function load(src) {
        if (!cache.has(src)) {
            const image = new Image();
            const ready = new Promise((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = () => { cache.delete(src); reject(new Error('Kunne ikkje laste biletet.')); };
            });
            cache.set(src, { image, ready });
            image.src = src;
        }
        return cache.get(src).ready;
    }
    function draw(ctx, width, height, src, pixelated = false) {
        const entry = cache.get(src);
        if (!entry || !entry.image.complete || !entry.image.naturalWidth) return false;
        const image = entry.image;
        // Skaler utan å strekkje motivet når brukaren byter papirformat.
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        ctx.save(); ctx.imageSmoothingEnabled = !pixelated;
        ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
        ctx.restore();
        return true;
    }
    return { load, draw };
})();
