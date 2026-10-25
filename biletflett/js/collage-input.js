/* Mus og berøring for fotofelta; pynt har si eiga inndatamodul. */
const CollageInput = (() => {
    function init(canvas, api) {
        let dragging = false, dragSlot = -1, last = { x: 0, y: 0 };
        function down(event) {
            const template = api.template();
            if (!template || event.button !== 0) return;
            const p = api.point(event), hovered = api.hovered(), data = api.slots();
            if (hovered !== -1 && data[hovered]) {
                for (const control of api.controls()) {
                    if (p.x < control.x || p.x > control.x + control.w || p.y < control.y || p.y > control.y + control.h) continue;
                    if (control.action === 'zoomIn') api.zoom(hovered, 1.15);
                    else if (control.action === 'zoomOut') api.zoom(hovered, .87);
                    else if (control.action === 'remove') api.remove(hovered);
                    else if (control.action === 'crop') api.crop(hovered);
                    return;
                }
            }
            for (let index = 0; index < template.slots.length; index++) {
                if (!api.contains(p.x, p.y, template.slots[index])) continue;
                if (data[index]) { dragging = true; dragSlot = index; last = p; canvas.style.cursor = 'grabbing'; }
                else api.open(index);
                return;
            }
        }
        function move(event) {
            const template = api.template();
            if (!template) return;
            const p = api.point(event), data = api.slots();
            if (dragging && data[dragSlot]) {
                data[dragSlot].offsetX += p.x - last.x;
                data[dragSlot].offsetY += p.y - last.y;
                last = p; api.render(); return;
            }
            let hovered = -1;
            for (let i = 0; i < template.slots.length; i++) {
                if (api.contains(p.x, p.y, template.slots[i])) { hovered = i; break; }
            }
            if (hovered !== api.hovered()) api.hover(hovered);
            canvas.style.cursor = hovered !== -1 && data[hovered] ? 'grab' : hovered !== -1 ? 'pointer' : 'default';
        }
        function cancel() { dragging = false; dragSlot = -1; canvas.style.cursor = 'default'; }
        function touch(type) {
            return event => {
                event.preventDefault(); const point = event.touches[0];
                if (point) canvas.dispatchEvent(new MouseEvent(type, { clientX: point.clientX, clientY: point.clientY }));
            };
        }
        canvas.addEventListener('mousedown', down);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', cancel);
        canvas.addEventListener('mouseleave', () => { if (api.hovered() !== -1) api.hover(-1); });
        canvas.addEventListener('touchstart', touch('mousedown'), { passive: false });
        canvas.addEventListener('touchmove', touch('mousemove'), { passive: false });
        canvas.addEventListener('touchend', event => { event.preventDefault(); cancel(); });
        canvas.addEventListener('touchcancel', cancel);
        return { cancel };
    }
    return { init };
})();
