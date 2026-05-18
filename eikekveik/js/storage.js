// Eikekveik — Storage (auto-save og namngjevne kart i VyrdepilStorage)

Eikekveik.Storage = (function () {
    const LIST_KEY = 'maps';

    function init() {
        const el = Eikekveik.el;

        el.btnSave.addEventListener('click', openSaveModal);
        el.saveModalClose.addEventListener('click', closeSaveModal);
        el.saveCancel.addEventListener('click', closeSaveModal);
        el.saveConfirm.addEventListener('click', confirmSave);
        el.saveModal.addEventListener('click', (e) => {
            if (e.target === el.saveModal) closeSaveModal();
        });
        el.saveName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); confirmSave(); }
        });

        el.btnOpen.addEventListener('click', openOpenModal);
        el.openModalClose.addEventListener('click', closeOpenModal);
        el.openCancel.addEventListener('click', closeOpenModal);
        el.openModal.addEventListener('click', (e) => {
            if (e.target === el.openModal) closeOpenModal();
        });
    }

    // ── Auto-save av siste kart ──
    function autoSave() {
        const snap = Eikekveik.State.snapshot();
        VyrdepilStorage.setGameState(Eikekveik.GAME_KEY, snap);
    }

    function loadAutoSave() {
        return VyrdepilStorage.getGameState(Eikekveik.GAME_KEY);
    }

    // ── Namngjevne kart ──
    function getSavedMaps() {
        return VyrdepilStorage.getList(Eikekveik.GAME_KEY, LIST_KEY);
    }

    function saveMap(name) {
        const list = getSavedMaps();
        const existingIdx = list.findIndex(m => m.name === name);
        const entry = {
            id: existingIdx >= 0 ? list[existingIdx].id : Date.now(),
            name,
            savedAt: new Date().toISOString(),
            data: Eikekveik.State.snapshot()
        };

        if (existingIdx >= 0) {
            VyrdepilStorage.deleteListItem(Eikekveik.GAME_KEY, LIST_KEY, list[existingIdx].id);
        }
        VyrdepilStorage.saveListItem(Eikekveik.GAME_KEY, LIST_KEY, entry);
    }

    function deleteMap(id) {
        VyrdepilStorage.deleteListItem(Eikekveik.GAME_KEY, LIST_KEY, id);
    }

    function loadMap(id) {
        const list = getSavedMaps();
        const m = list.find(x => x.id === id);
        if (!m) return false;
        Eikekveik.State.load(m.data);
        Eikekveik.Render.renderAll();
        Eikekveik.Render.showColorPalette(false);
        autoSave();
        return true;
    }

    // ── Modalar ──
    function openSaveModal() {
        Eikekveik.el.saveName.value = '';
        Eikekveik.el.saveModal.classList.add('open');
        Eikekveik.el.saveName.focus();
    }
    function closeSaveModal() {
        Eikekveik.el.saveModal.classList.remove('open');
    }
    function confirmSave() {
        const name = Eikekveik.el.saveName.value.trim();
        if (!name) {
            Eikekveik.el.saveName.focus();
            return;
        }
        const existing = getSavedMaps().find(m => m.name === name);
        if (existing) {
            const ok = confirm(`"${name}" finst allereie. Overskrive?`);
            if (!ok) return;
        }
        saveMap(name);
        closeSaveModal();
    }

    function openOpenModal() {
        renderSavedList();
        Eikekveik.el.openModal.classList.add('open');
    }
    function closeOpenModal() {
        Eikekveik.el.openModal.classList.remove('open');
    }

    function renderSavedList() {
        const list = getSavedMaps()
            .slice()
            .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
        const container = Eikekveik.el.savedList;
        container.replaceChildren();

        if (!list.length) {
            const p = document.createElement('p');
            p.className = 'saved-empty';
            p.textContent = 'Ingen lagra Eikekveik-kart enno.';
            container.appendChild(p);
            return;
        }

        for (const m of list) {
            const row = document.createElement('div');
            row.className = 'saved-item';

            const info = document.createElement('div');
            info.className = 'saved-item-info';
            const name = document.createElement('span');
            name.className = 'saved-item-name';
            name.textContent = m.name;
            info.appendChild(name);

            const meta = document.createElement('span');
            meta.className = 'saved-item-meta';
            meta.textContent = formatDate(m.savedAt) + ' · ' + (m.data?.nodes?.length || 0) + ' nodar';
            info.appendChild(meta);

            const actions = document.createElement('div');
            actions.className = 'saved-item-actions';

            const openBtn = document.createElement('button');
            openBtn.className = 'btn btn-primary';
            openBtn.textContent = 'Opne';
            openBtn.addEventListener('click', () => {
                loadMap(m.id);
                closeOpenModal();
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.textContent = 'Slett';
            delBtn.setAttribute('aria-label', 'Slett ' + m.name);
            delBtn.addEventListener('click', () => {
                if (confirm(`Slette "${m.name}"?`)) {
                    deleteMap(m.id);
                    renderSavedList();
                }
            });

            actions.append(openBtn, delBtn);
            row.append(info, actions);
            container.appendChild(row);
        }
    }

    function formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('nn-NO', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return iso.slice(0, 10);
        }
    }

    function closeOpenModals() {
        closeSaveModal();
        closeOpenModal();
    }

    return {
        init, autoSave, loadAutoSave,
        saveMap, loadMap, deleteMap, getSavedMaps,
        closeOpenModals
    };
})();
