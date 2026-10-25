const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, 'js/layouts.js'), 'utf8'), context);
const layouts = vm.runInContext('PhotoLayouts', context);
let combinations = 0;
for (const format of ['portrait', 'landscape', 'square']) {
    for (const style of Object.keys(layouts.styles)) {
        for (let count = 1; count <= 12; count++) {
            const slots = layouts.make(count, style, format);
            assert.equal(slots.length, count);
            slots.forEach(slot => {
                assert.ok(slot.w > 0 && slot.h > 0);
                assert.ok(slot.x >= 0 && slot.y >= 0 && slot.x + slot.w <= 1 && slot.y + slot.h <= 1);
            });
            for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
                const a = slots[i], b = slots[j];
                assert.ok(a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9 || a.y + a.h <= b.y + 1e-9 || b.y + b.h <= a.y + 1e-9);
            }
            combinations++;
        }
    }
}

const palette = { bg: '#ffffff', ink: '#000000', accent: '#000000' };
const templates = Object.fromEntries(['a', 'b', 'blank'].map(id => [id, {
    id, palette, orientation: 'portrait', background: { type: id === 'blank' ? 'solid' : 'image' },
    texts: [{ id: 'title', text: '', x: .1, y: .1, w: .8, size: .03 }], slots: []
}]));
const noop = () => {};
const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 8 }) }, {
    get: (target, key) => key in target ? target[key] : noop,
    set: (target, key, value) => { target[key] = value; return true; }
});
Object.assign(context, {
    Templates: { get: id => templates[id] },
    CollageInput: { init: () => ({ cancel: noop }) }, CollageControls: { draw: () => [] },
    Decor: { background: noop, item: noop }, Stickers: { paint: noop, clear: noop },
    Fonts: { stack: { bold: 'sans-serif' }, weightFor: () => 700 },
    Palette: { resolve: value => value }, Icons: new Proxy({}, { get: () => noop }),
    Image: class { constructor() { this.width = 400; this.height = 300; } set src(value) { this.value = value; this.onload(); } },
    FileReader: class { readAsDataURL(file) { this.onload({ target: { result: file.name } }); } }
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/collage.js'), 'utf8'), context);
const collage = vm.runInContext('Collage', context);
collage.init({ getContext: () => ctx, style: {} }, {});
collage.setTemplate('a');
collage.setLayout(5, 'grid');
collage.addImages(Array.from({ length: 5 }, (_, index) => ({ name: 'test-' + index, type: 'image/png' })));
const ids = Array.from({ length: 5 }, (_, i) => collage.getSlotImageId(i));
assert.ok(ids.every(Boolean));
collage.setText('title', 'Klassen vår');
collage.setLayout(2, 'feature');
collage.setTemplate('b');
assert.equal(collage.current.slots.length, 2);
assert.equal(collage.getTextFields()[0].text, 'Klassen vår');
collage.setLayout(5, 'polaroid');
assert.deepEqual(Array.from({ length: 5 }, (_, i) => collage.getSlotImageId(i)), ids);
collage.setFormat('landscape');
assert.equal(collage.current.slots.length, 5);
collage.setTemplate('blank');
assert.deepEqual(Array.from({ length: 5 }, (_, i) => collage.getSlotImageId(i)), ids);
assert.equal(collage.getTextFields()[0].text, 'Klassen vår');
assert.equal(templates.a.slots.length, 0, 'Katalogen skal ikkje endrast av arbeidsoppsettet');
console.log(combinations + ' kombinasjonar kontrollerte; foto og tekst blir bevarte ved byte av bakgrunn, tal, plassering og papirformat.');
