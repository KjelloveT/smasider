/* ══════════════════════════════════════
   PROCESSOR.JS — Rein biletlogikk (canvas)
   Ingen DOM-avhengnad utanom canvas-element vi lagar sjølve.
   ══════════════════════════════════════ */

const Processor = (() => {

    /* Les ei fil til eit dekoda Image-objekt vi kan teikne på canvas. */
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Klarte ikkje lese fila'));
            reader.onload = () => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Klarte ikkje dekode biletet'));
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* Teikn kjeldebiletet med rotasjon + spegling til ein ny canvas.
       rotation: 0/90/180/270. flipH/flipV: bool. */
    function orient(source, rotation, flipH, flipV) {
        const rot = ((rotation % 360) + 360) % 360;
        const swap = rot === 90 || rot === 270;
        const sw = source.width, sh = source.height;
        const cv = document.createElement('canvas');
        cv.width = swap ? sh : sw;
        cv.height = swap ? sw : sh;
        const ctx = cv.getContext('2d');
        ctx.translate(cv.width / 2, cv.height / 2);
        ctx.rotate(rot * Math.PI / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(source, -sw / 2, -sh / 2);
        return cv;
    }

    /* Skaler ein canvas til mål-storleik (om sett). */
    function resize(canvas, targetW, targetH) {
        if (!targetW && !targetH) return canvas;
        const w = Math.max(1, Math.round(targetW || canvas.width));
        const h = Math.max(1, Math.round(targetH || canvas.height));
        if (w === canvas.width && h === canvas.height) return canvas;
        const out = document.createElement('canvas');
        out.width = w; out.height = h;
        const ctx = out.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, w, h);
        return out;
    }

    /* Skriv tekst- og/eller logo-vassmerke på ein canvas (in-place). */
    function watermark(canvas, wm) {
        if (!wm) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const pad = Math.round(Math.min(W, H) * 0.03) + 6;

        if (wm.logo) {
            const scale = (wm.logoScale || 20) / 100;
            const lw = W * scale;
            const lh = lw * (wm.logo.height / wm.logo.width);
            const [x, y] = anchor(wm.position, W, H, lw, lh, pad);
            ctx.save();
            ctx.globalAlpha = (wm.opacity ?? 80) / 100;
            ctx.drawImage(wm.logo, x, y, lw, lh);
            ctx.restore();
        }

        if (wm.text) {
            const size = wm.size || Math.round(Math.min(W, H) * 0.05);
            ctx.save();
            ctx.globalAlpha = (wm.opacity ?? 80) / 100;
            ctx.font = `900 ${size}px Arial, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillStyle = wm.color || '#ffffff';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = Math.max(2, size / 12);
            const m = ctx.measureText(wm.text);
            const tw = m.width, th = size;
            const [x, y] = anchor(wm.position, W, H, tw, th, pad);
            ctx.strokeText(wm.text, x, y);
            ctx.fillText(wm.text, x, y);
            ctx.restore();
        }
    }

    function anchor(pos, W, H, w, h, pad) {
        const map = {
            'top-left':      [pad, pad],
            'top-center':    [(W - w) / 2, pad],
            'top-right':     [W - w - pad, pad],
            'center-left':   [pad, (H - h) / 2],
            'center':        [(W - w) / 2, (H - h) / 2],
            'center-right':  [W - w - pad, (H - h) / 2],
            'bottom-left':   [pad, H - h - pad],
            'bottom-center': [(W - w) / 2, H - h - pad],
            'bottom-right':  [W - w - pad, H - h - pad]
        };
        return map[pos] || map['bottom-right'];
    }

    /* Skjer eit Image til ny canvas. rect i kjelde-pikslar. */
    function crop(source, rect) {
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(rect.w));
        out.height = Math.max(1, Math.round(rect.h));
        out.getContext('2d').drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, out.width, out.height);
        return out;
    }

    function mime(format) {
        return format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
    }
    function ext(format) {
        return format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg';
    }

    function toBlob(canvas, format, quality) {
        return new Promise(resolve => canvas.toBlob(resolve, mime(format), quality));
    }

    /* Eksporter canvas. Om targetBytes er sett (og format ikkje png),
       iterer kvaliteten ned til storleiken er under målet. */
    async function exportCanvas(canvas, format, quality, targetBytes) {
        if (!targetBytes || format === 'png') {
            return toBlob(canvas, format, quality / 100);
        }
        let lo = 0.1, hi = 0.95, best = null;
        for (let i = 0; i < 7; i++) {
            const q = (lo + hi) / 2;
            const blob = await toBlob(canvas, format, q);
            if (blob.size > targetBytes) {
                hi = q;
            } else {
                best = blob;
                lo = q;
            }
        }
        // Fall tilbake til lågaste kvalitet om vi aldri kom under målet.
        return best || toBlob(canvas, format, lo);
    }

    /* Full pipeline for eitt bilete -> { blob, width, height }. */
    async function process(item, settings) {
        // Bruk allereie beskoren kjelde om den finst, elles originalen.
        const source = item.cropped || item.source;
        let cv = orient(source, item.rotation, item.flipH, item.flipV);
        cv = resize(cv, settings.width, settings.height);
        watermark(cv, settings.watermark);
        const targetBytes = settings.targetKb ? settings.targetKb * 1024 : null;
        const blob = await exportCanvas(cv, settings.format, settings.quality, targetBytes);
        return { blob, width: cv.width, height: cv.height };
    }

    return { loadImage, orient, resize, watermark, crop, process, exportCanvas, mime, ext };
})();
