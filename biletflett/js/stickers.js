/* Flyttbar pynt i minnet, teikna inn i same lerret og eksport som fotografia. */
const Stickers = (() => {
    let canvas, redraw, items = [], selected = -1, drag = null;
    let list, controls, status;
    const fields = {};
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function init(target, render) {
        canvas = target; redraw = render;
        list = document.getElementById('placed-decor');
        controls = document.getElementById('decor-controls');
        status = document.getElementById('decor-status');
        list.addEventListener('change', () => { selected = Number(list.value); sync(); redraw(); });
        ['x', 'y', 'size', 'rotation'].forEach(key => {
            fields[key] = document.getElementById('decor-' + key);
            fields[key].addEventListener('input', () => {
                if (!items[selected]) return;
                items[selected][key] = Number(fields[key].value) / (key === 'rotation' ? 1 : 100);
                redraw();
            });
        });
        document.getElementById('decor-remove').addEventListener('click', () => {
            items.splice(selected, 1); selected = items.length - 1; sync(); redraw();
        });
        const host = document.getElementById('decor-library');
        BiletflettAssets.decor.forEach(asset => {
            const button = document.createElement('button');
            button.className = 'vp-button vp-button--quiet vp-button--compact decor-card';
            button.type = 'button'; button.setAttribute('aria-label', 'Legg til ' + asset.name);
            const image = document.createElement('img');
            image.src = asset.src; image.alt = ''; image.loading = 'lazy'; image.width = 64; image.height = 64;
            const label = document.createElement('span'); label.textContent = asset.name;
            button.append(image, label);
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    const img = await Artwork.load(asset.src);
                    items.push({ asset, img, x: .5, y: .5, size: .2, rotation: 0 });
                    selected = items.length - 1; sync(); redraw();
                    status.textContent = asset.name + ' er lagd til. Dra pynten eller bruk felta under.';
                } catch (error) { status.textContent = error.message + ' Prøv ein gong til.'; }
                finally { button.disabled = false; }
            });
            host.append(button);
        });
        canvas.addEventListener('mousedown', start, true);
        canvas.addEventListener('touchstart', start, { capture: true, passive: false });
        window.addEventListener('mousemove', move, true);
        window.addEventListener('touchmove', move, { capture: true, passive: false });
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
        window.addEventListener('touchcancel', stop);
        sync();
    }
    function sync() {
        list.replaceChildren();
        items.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index; option.textContent = (index + 1) + '. ' + item.asset.name;
            list.append(option);
        });
        list.value = selected; list.disabled = !items.length;
        controls.hidden = !items[selected];
        if (items[selected]) Object.entries(fields).forEach(([key, field]) => {
            field.value = Math.round(items[selected][key] * (key === 'rotation' ? 1 : 100));
        });
    }
    function geometry(item, width, height) {
        const side = item.size * Math.min(width, height);
        const scale = side / Math.max(item.img.naturalWidth, item.img.naturalHeight);
        return { w: item.img.naturalWidth * scale, h: item.img.naturalHeight * scale };
    }
    function paint(ctx, width, height, interactive) {
        items.forEach((item, index) => {
            const { w, h } = geometry(item, width, height);
            ctx.save(); ctx.translate(item.x * width, item.y * height);
            ctx.rotate(item.rotation * Math.PI / 180);
            ctx.drawImage(item.img, -w / 2, -h / 2, w, h);
            if (interactive && index === selected) {
                ctx.strokeStyle = '#142820'; ctx.lineWidth = Math.max(2, width / 600);
                ctx.setLineDash([8, 6]); ctx.strokeRect(-w / 2, -h / 2, w, h);
            }
            ctx.restore();
        });
    }
    function point(event) {
        const source = event.touches ? event.touches[0] : event;
        const rect = canvas.getBoundingClientRect();
        return { x: (source.clientX - rect.left) / rect.width, y: (source.clientY - rect.top) / rect.height };
    }
    function start(event) {
        if (event.type === 'mousedown' && event.button !== 0) return;
        const p = point(event);
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i], { w, h } = geometry(item, canvas.width, canvas.height);
            const angle = -item.rotation * Math.PI / 180;
            const dx = (p.x - item.x) * canvas.width, dy = (p.y - item.y) * canvas.height;
            if (Math.abs(dx * Math.cos(angle) - dy * Math.sin(angle)) > w / 2 ||
                Math.abs(dx * Math.sin(angle) + dy * Math.cos(angle)) > h / 2) continue;
            event.preventDefault(); event.stopImmediatePropagation();
            selected = i; drag = { x: p.x - item.x, y: p.y - item.y };
            sync(); redraw(); return;
        }
    }
    function move(event) {
        if (!drag || !items[selected]) return;
        event.preventDefault(); event.stopImmediatePropagation();
        const p = point(event);
        items[selected].x = clamp(p.x - drag.x, 0, 1);
        items[selected].y = clamp(p.y - drag.y, 0, 1);
        sync(); redraw();
    }
    function stop() { drag = null; }
    function clear() { items = []; selected = -1; drag = null; sync(); }
    return { init, paint, clear };
})();
