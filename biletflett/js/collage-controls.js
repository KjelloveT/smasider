/* Kontrollar for beskjering, zoom og fjerning av foto. */
const CollageControls = (() => {
    function draw(ctx, W, r) {
        const controlRects = [];
        const size = Math.max(34, W * 0.040);
        const gap = size * 0.25;
        const actions = ['zoomOut', 'zoomIn', 'crop', 'remove'];
        const totalW = actions.length * size + (actions.length - 1) * gap;
        let bx = r.x + r.w / 2 - totalW / 2;
        const by = r.y + gap;
        actions.forEach(act => {
            ctx.save();
            ctx.fillStyle = act === 'remove' ? 'rgba(217,48,37,0.92)' : 'rgba(26,26,26,0.82)';
            ctx.beginPath(); ctx.arc(bx + size / 2, by + size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, size * 0.07);
            ctx.lineCap = 'round';
            glyph(ctx, act, bx + size / 2, by + size / 2, size * 0.26);
            ctx.restore();
            controlRects.push({ action: act, x: bx, y: by, w: size, h: size });
            bx += size + gap;
        });
        return controlRects;
    }

    function glyph(ctx, act, cx, cy, s) {
        ctx.beginPath();
        if (act === 'zoomIn' || act === 'zoomOut') {
            ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy);
            if (act === 'zoomIn') { ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); }
        } else if (act === 'remove') {
            ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
            ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
        } else if (act === 'crop') {
            ctx.moveTo(cx - s, cy - s * 0.4); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx + s * 0.4, cy + s);
            ctx.moveTo(cx + s, cy + s * 0.4); ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx - s * 0.4, cy - s);
        }
        ctx.stroke();
    }

    return { draw };
})();
