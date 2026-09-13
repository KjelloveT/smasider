// Eikekveik — Picker (veljar for ikon og emoji på ein node)

Eikekveik.Picker = (function () {
    const ICON_TAB = 'ikon';
    let activeTab = ICON_TAB;
    let onSelect = null;
    let current = null;

    function init() {
        const el = Eikekveik.el;
        Vy.bindOverlayClose(el.pickerModal);
        el.pickerClose.addEventListener('click', close);
        el.pickerSearch.addEventListener('input', renderGrid);
        el.pickerTabs.addEventListener('click', onTab);
        el.pickerGrid.addEventListener('click', onPick);
        buildTabs();
    }

    function tabs() {
        return [{ id: ICON_TAB, label: 'Ikon' }]
            .concat(Eikekveik.Symbols.EMOJI.map(c => ({ id: c.id, label: c.label })));
    }

    function buildTabs() {
        const row = Eikekveik.el.pickerTabs;
        for (const t of tabs()) {
            const btn = Vy.el('button', 'box-tab', t.label);
            btn.type = 'button';
            btn.setAttribute('role', 'tab');
            btn.dataset.tab = t.id;
            row.appendChild(btn);
        }
    }

    function itemsFor(tabId) {
        if (tabId === ICON_TAB) {
            return Eikekveik.Symbols.ICONS.map(i => ({ type: 'icon', value: i.id, name: i.n }));
        }
        const cat = Eikekveik.Symbols.EMOJI.find(c => c.id === tabId);
        return cat ? cat.emojis.map(x => ({ type: 'emoji', value: x.e, name: x.n })) : [];
    }

    function renderGrid() {
        const el = Eikekveik.el;
        const query = el.pickerSearch.value.trim().toLowerCase();
        const list = query
            ? tabs().flatMap(t => itemsFor(t.id)).filter(i => i.name.includes(query))
            : itemsFor(activeTab);

        // Under søk gjeld treffa alle fanene, så ingen av dei er aktive.
        el.pickerTabs.querySelectorAll('.box-tab').forEach(btn => {
            const on = !query && btn.dataset.tab === activeTab;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });

        const grid = el.pickerGrid;
        grid.replaceChildren();
        if (!list.length) {
            grid.appendChild(Vy.el('p', 'picker-empty', `Fann ingenting for «${query}».`));
            return;
        }

        for (const item of list) {
            const btn = Vy.el('button', 'picker-item');
            btn.type = 'button';
            btn.dataset.type = item.type;
            btn.dataset.value = item.value;
            btn.title = item.name;
            btn.setAttribute('aria-label', item.name);
            const isCurrent = current && current.type === item.type && current.value === item.value;
            btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
            if (item.type === 'emoji') {
                btn.textContent = item.value;
            } else {
                // ICON() gjev fast SVG-markup frå vår eigen ikonmodul, og
                // namnet kjem frå kvitlista i symbols.js, ikkje frå brukaren.
                btn.innerHTML = ICON(item.value, 26);
            }
            grid.appendChild(btn);
        }
    }

    function onTab(e) {
        const btn = e.target.closest('.box-tab');
        if (!btn) return;
        activeTab = btn.dataset.tab;
        Eikekveik.el.pickerSearch.value = '';
        renderGrid();
    }

    function onPick(e) {
        const btn = e.target.closest('.picker-item');
        if (!btn) return;
        const cb = onSelect;
        const icon = { type: btn.dataset.type, value: btn.dataset.value };
        close();
        if (cb) cb(icon);
    }

    function open(currentIcon, cb) {
        const el = Eikekveik.el;
        current = currentIcon || null;
        onSelect = cb;
        if (current && current.type === 'emoji') {
            const cat = Eikekveik.Symbols.EMOJI.find(c => c.emojis.some(x => x.e === current.value));
            if (cat) activeTab = cat.id;
        } else if (current) {
            activeTab = ICON_TAB;
        }
        el.pickerSearch.value = '';
        renderGrid();
        Vy.openModal(el.pickerModal);
        const first = el.pickerGrid.querySelector('[aria-pressed="true"]') || el.pickerGrid.querySelector('.picker-item');
        if (first) first.focus();
    }

    function close() {
        Vy.closeModal(Eikekveik.el.pickerModal);
        onSelect = null;
        Eikekveik.el.btnIcon.focus();
    }

    return { init, open, close };
})();
