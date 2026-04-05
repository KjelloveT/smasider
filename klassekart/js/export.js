/* ══════════════════════════════════════
   EXPORT.JS — PNG export (local, no CDN)
   Uses native browser canvas for rendering
   ══════════════════════════════════════ */

const Export = (() => {

    function toPNG() {
        const source = document.getElementById('canvas');
        const w = source.offsetWidth;
        const h = source.offsetHeight;
        const padding = 20;

        const c = document.createElement('canvas');
        c.width = (w + padding * 2) * 2;
        c.height = (h + padding * 2) * 2;
        const ctx = c.getContext('2d');
        ctx.scale(2, 2);

        // Fill background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w + padding * 2, h + padding * 2);

        ctx.translate(padding, padding);

        if (source.classList.contains('show-grid')) {
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            const cell = Grid.getCell();
            for (let x = 0; x <= w; x += cell) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y <= h; y += cell) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        const items = Array.from(source.querySelectorAll('.furniture, .desk'));
        items.sort((a, b) => {
            const za = parseInt(getComputedStyle(a).zIndex) || 0;
            const zb = parseInt(getComputedStyle(b).zIndex) || 0;
            return za - zb;
        });

        items.forEach(el => {
            const x = parseInt(el.style.left) || 0;
            const y = parseInt(el.style.top) || 0;
            const ew = el.offsetWidth;
            const eh = el.offsetHeight;

            const rot = parseInt(el.dataset.rotation) || 0;
            if (rot) {
                ctx.save();
                ctx.translate(x + ew / 2, y + eh / 2);
                ctx.rotate(rot * Math.PI / 180);
                ctx.translate(-ew / 2, -eh / 2);
                drawBox(ctx, 0, 0, ew, eh, el);
                ctx.restore();
            } else {
                drawBox(ctx, x, y, ew, eh, el);
            }
        });

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, w, h);

        const dataUrl = c.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'klassekart.png';
        a.click();
    }

    function drawBox(ctx, x, y, w, h, el) {
        const bg = getComputedStyle(el).backgroundColor || '#fff';
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        if (el.classList.contains('locked')) {
            ctx.setLineDash([4, 3]);
        }
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 0;
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        if (el.classList.contains('desk')) {
            const name = el.dataset.studentName || '';
            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const maxW = w - 6;
            let displayName = name;
            if (ctx.measureText(name).width > maxW) {
                while (displayName.length > 1 && ctx.measureText(displayName + '…').width > maxW) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '…';
            }
            ctx.fillText(displayName, x + w / 2, y + h / 2);

            /* Chair marker — brown bar at bottom */
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 8, y + h + 1, w - 16, 4);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8, y + h + 1, w - 16, 4);

            if (el.dataset.locked === '1') {
                ctx.fillStyle = '#000';
                ctx.font = 'bold 8px Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText('⚿', x + w - 3, y + 2);
            }
        }

        if (el.classList.contains('furniture')) {
            const lbl = el.querySelector('.furn-label');
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (lbl) {
                const fontSize = Math.max(7, Math.min(Math.min(w, h) * 0.3, 12));
                ctx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
                ctx.fillText(lbl.textContent, x + w / 2, y + h / 2);
            }
        }
    }

    return { toPNG };
})();
