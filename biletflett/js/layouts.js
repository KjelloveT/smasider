/* Fotooppsett er uavhengige av bakgrunnsbiletet. Alle mål er normaliserte. */
const PhotoLayouts = (() => {
    const styles = { grid: 'Rutenett', feature: 'Eitt stort og fleire små', rows: 'Vassrette rader', columns: 'Loddrette spalter', polaroid: 'Polaroid' };
    const ratios = { portrait: 1240 / 1754, landscape: 1754 / 1240, square: 1 };
    function grid(count, area, format, frame = 'rounded') {
        const gap = .018;
        let columns = 1, best = Infinity;
        for (let c = 1; c <= count; c++) {
            const rows = Math.ceil(count / c);
            const width = (area.w - (c - 1) * gap) / c;
            const height = (area.h - (rows - 1) * gap) / rows;
            if (width <= 0 || height <= 0) continue;
            const aspect = width * ratios[format] / height;
            const score = Math.abs(Math.log(aspect / (4 / 3))) + (c * rows - count) / count * .5;
            if (score < best) { best = score; columns = c; }
        }
        const rows = Math.ceil(count / columns);
        const w = (area.w - (columns - 1) * gap) / columns;
        const h = (area.h - (rows - 1) * gap) / rows;
        return Array.from({ length: count }, (_, index) => {
            const row = Math.floor(index / columns), col = index % columns;
            const inRow = Math.min(columns, count - row * columns);
            const inset = (columns - inRow) * (w + gap) / 2;
            return { x: area.x + col * (w + gap) + inset, y: area.y + row * (h + gap), w, h, frame };
        });
    }
    function make(count, style, format) {
        count = Math.max(1, Math.min(12, Math.round(count)));
        const area = { x: .18, y: .25, w: .64, h: .52 }, gap = .018;
        if (count === 1) return [{ ...area, frame: style === 'polaroid' ? 'polaroid' : 'rounded' }];
        if (style === 'rows' || style === 'columns') {
            const horizontal = style === 'rows';
            return Array.from({ length: count }, (_, i) => ({
                x: area.x + (horizontal ? 0 : i * (area.w + gap) / count),
                y: area.y + (horizontal ? i * (area.h + gap) / count : 0),
                w: horizontal ? area.w : (area.w - (count - 1) * gap) / count,
                h: horizontal ? (area.h - (count - 1) * gap) / count : area.h,
                frame: 'rounded'
            }));
        }
        if (style === 'feature') {
            const h = area.h * .52;
            const main = { x: area.x, y: area.y, w: area.w, h, frame: 'rounded' };
            return [main, ...grid(count - 1, { x: area.x, y: area.y + h + gap, w: area.w, h: area.h - h - gap }, format)];
        }
        const slots = grid(count, area, format, style === 'polaroid' ? 'polaroid' : 'rounded');
        if (style === 'polaroid') slots.forEach((slot, i) => { slot.rotation = i % 2 ? 2 : -2; slot.shadow = true; });
        return slots;
    }
    function init(onChange) {
        const count = document.getElementById('photo-count'), layout = document.getElementById('photo-layout');
        for (let value = 1; value <= 12; value++) {
            const option = document.createElement('option'); option.value = value; option.textContent = value + ' bilete'; count.append(option);
        }
        Object.entries(styles).forEach(([value, label]) => {
            const option = document.createElement('option'); option.value = value; option.textContent = label; layout.append(option);
        });
        count.value = '3'; layout.value = 'feature';
        const change = () => onChange(Number(count.value), layout.value);
        count.addEventListener('change', change); layout.addEventListener('change', change);
    }
    return { make, init, styles };
})();
