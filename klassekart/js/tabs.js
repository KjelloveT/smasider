/* ══════════════════════════════════════
   TABS.JS — Manage multiple classroom layouts
   ══════════════════════════════════════ */

const Tabs = (() => {
    let tabs = [];
    let activeTabId = null;

    function init() {
        const savedState = VyrdepilStorage.getGameState('klassekart');
        const savedTabs = savedState?.tabs || null;
        if (savedTabs && Array.isArray(savedTabs)) {
            tabs = savedTabs;
        }

        if (tabs.length === 0) {
            // Create initial tab
            const id = crypto.randomUUID();
            tabs.push({
                id,
                name: 'Hovudoppsett',
                data: Storage.captureState()
            });
            activeTabId = id;
        } else {
            activeTabId = tabs[0].id;
        }

        render();
        bindEvents();
        
        // Load the initial tab state
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab) {
            Storage.restoreState(activeTab.data, true); // true to skip history push on init
        }
    }

    function bindEvents() {
        document.getElementById('btn-new-tab').addEventListener('click', createNewTab);
    }

    function createNewTab() {
        const name = prompt('Gje namn til det nye oppsettet:', 'Ny fane');
        if (!name) return;

        // Save current state to active tab before switching
        saveCurrentState();

        const id = crypto.randomUUID();
        const newTab = {
            id,
            name,
            data: Storage.captureState() // Copy current state as starting point
        };

        tabs.push(newTab);
        activeTabId = id;
        
        render();
        persist();
        Storage.pushHistory();
    }

    function saveCurrentState() {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab) {
            activeTab.data = Storage.captureState();
        }
    }

    function switchTab(id) {
        if (id === activeTabId) return;

        saveCurrentState();
        activeTabId = id;
        
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab) {
            Storage.restoreState(activeTab.data, true);
        }

        render();
        persist();
        Storage.pushHistory(); // Push history on tab switch
    }

    function deleteTab(id, e) {
        if (e) e.stopPropagation();
        if (tabs.length <= 1) {
            alert('Du må ha minst éi fane.');
            return;
        }

        if (!confirm('Vil du slette denne fana?')) return;

        const index = tabs.findIndex(t => t.id === id);
        tabs = tabs.filter(t => t.id !== id);

        if (activeTabId === id) {
            activeTabId = tabs[Math.max(0, index - 1)].id;
            const activeTab = tabs.find(t => t.id === activeTabId);
            Storage.restoreState(activeTab.data, true);
        }

        render();
        persist();
        Storage.pushHistory();
    }

    function renameTab(id, e) {
        if (e) e.stopPropagation();
        const tab = tabs.find(t => t.id === id);
        if (!tab) return;

        const newName = prompt('Endre namn på oppsettet:', tab.name);
        if (newName && newName.trim()) {
            tab.name = newName.trim();
            render();
            persist();
            Storage.pushHistory();
        }
    }

    function render() {
        const container = document.getElementById('tabs-list');
        if (!container) return;
        container.innerHTML = '';

        tabs.forEach(tab => {
            const el = document.createElement('div');
            el.className = `tab-item ${tab.id === activeTabId ? 'active' : ''}`;
            el.dataset.id = tab.id;
            
            const name = document.createElement('span');
            name.className = 'tab-name';
            name.textContent = tab.name;
            name.title = 'Dobbeltklikk for å endre namn';
            name.addEventListener('dblclick', (e) => renameTab(tab.id, e));

            const close = document.createElement('span');
            close.className = 'tab-close';
            close.innerHTML = Icons.html('x', 14); // Use Lucide icon
            close.title = 'Slett fane';
            close.addEventListener('click', (e) => deleteTab(tab.id, e));

            el.appendChild(name);
            el.appendChild(close);
            el.addEventListener('click', () => switchTab(tab.id));

            container.appendChild(el);
        });
    }

    function persist() {
        const currentState = VyrdepilStorage.getGameState('klassekart') || {};
        currentState.tabs = tabs;
        VyrdepilStorage.setGameState('klassekart', currentState);
    }

    function getActiveTab() {
        return tabs.find(t => t.id === activeTabId);
    }

    // When loading a whole file, we might want to replace all tabs or just add one
    function setAllTabs(newTabs, skipHistory = false) {
        tabs = newTabs;
        if (tabs.length > 0) {
            // Find if there was an active tab before, otherwise use first
            const active = tabs.find(t => t.active) || tabs[0];
            activeTabId = active.id;
            Storage.restoreState(active.data, true);
        }
        render();
        persist();
        if (!skipHistory) Storage.pushHistory();
    }

    function getAllTabs() {
        saveCurrentState();
        // Mark which one is active for restoration
        return tabs.map(t => ({
            ...t,
            active: t.id === activeTabId
        }));
    }

    return {
        init,
        getActiveTab,
        saveCurrentState,
        getAllTabs,
        setAllTabs
    };
})();
