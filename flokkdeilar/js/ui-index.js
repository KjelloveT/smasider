/* ══════════════════════════════════════
   UI-INDEX.JS — Startside for Flokkdeilar
   ══════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Ikon-injeksjon ── */
    function injectIcon(id, name, size) {
        const el = document.getElementById(id);
        if (el) el.appendChild(Icons.create(name, size || 16));
    }
    injectIcon('icon-plus', 'plus');
    injectIcon('icon-upload', 'upload');
    injectIcon('icon-users', 'users');

    /* ── DOM-referansar ── */
    const listGrid       = document.getElementById('listGrid');
    const emptyHelp      = document.getElementById('emptyHelp');

    const overlayNyListe = document.getElementById('overlayNyListe');
    const inputListeNamn = document.getElementById('inputListeNamn');
    const bulkStudents   = document.getElementById('bulkStudents');
    const checkExtended  = document.getElementById('checkExtended');
    const pinFields      = document.getElementById('pinFields');
    const inputPin1      = document.getElementById('inputPin1');
    const inputPin2      = document.getElementById('inputPin2');
    const pinMatchError  = document.getElementById('pinMatchError');

    const overlayKlassekart = document.getElementById('overlayKlassekart');
    const klassekartLister  = document.getElementById('klassekartLister');
    const kkEmptyMsg        = document.getElementById('kkEmptyMsg');

    const overlaySlettListe = document.getElementById('overlaySlettListe');
    let pendingDeleteId     = null;

    /* ── Hjelparar ── */
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function openModal(overlay) {
        overlay.classList.add('open');
    }

    function closeModal(overlay) {
        overlay.classList.remove('open');
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            [overlayNyListe, overlayKlassekart, overlaySlettListe].forEach(closeModal);
        }
    });

    /* ── Rendrer listegrid ── */
    function render() {
        const all = FStorage.getAll();
        listGrid.innerHTML = '';

        if (all.length === 0) {
            emptyHelp.style.display = '';
            return;
        }
        emptyHelp.style.display = 'none';

        all.forEach(liste => {
            const card = document.createElement('div');
            card.className = 'list-card';

            const count = (liste.students || []).length;
            const hasPin = !!liste.pinHash;

            card.innerHTML = `
                <div class="list-card-header">
                    <div class="list-card-title">${escapeHtml(liste.name)}</div>
                    ${hasPin ? `<span title="PIN-låst">${Icons.html('lock', 16)}</span>` : ''}
                </div>
                <div class="list-card-meta">${count} ${count === 1 ? 'elev' : 'elevar'}</div>
                ${liste.extended ? '<span class="badge-extended">' + Icons.html('shield', 12) + ' Utvida admin</span>' : ''}
                <div class="list-card-actions">
                    <a class="btn btn-primary" href="trekk.html?id=${encodeURIComponent(liste.id)}">
                        ${Icons.html('shuffle', 14)} Trekk grupper
                    </a>
                    <a class="btn" href="admin.html?id=${encodeURIComponent(liste.id)}">
                        ${Icons.html('settings', 14)} Administrer
                    </a>
                    <button class="btn btn-danger btn-icon" data-del="${escapeHtml(liste.id)}" aria-label="Slett ${escapeHtml(liste.name)}">
                        ${Icons.html('trash-2', 14)}
                    </button>
                </div>`;

            listGrid.appendChild(card);
        });

        listGrid.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                pendingDeleteId = btn.dataset.del;
                openModal(overlaySlettListe);
            });
        });
    }

    /* ── Ny liste ── */
    document.getElementById('btnNyListe').addEventListener('click', () => {
        inputListeNamn.value = '';
        bulkStudents.value = '';
        checkExtended.checked = false;
        pinFields.style.display = 'none';
        inputPin1.value = '';
        inputPin2.value = '';
        pinMatchError.textContent = '';
        openModal(overlayNyListe);
        inputListeNamn.focus();
    });

    checkExtended.addEventListener('change', () => {
        pinFields.style.display = checkExtended.checked ? '' : 'none';
    });

    document.getElementById('closeNyListe').addEventListener('click', () => closeModal(overlayNyListe));
    document.getElementById('btnAvbrytNy').addEventListener('click', () => closeModal(overlayNyListe));

    document.getElementById('btnLagListe').addEventListener('click', async () => {
        const name = inputListeNamn.value.trim();
        if (!name) { inputListeNamn.focus(); return; }

        const lines = bulkStudents.value.split('\n').map(l => l.trim()).filter(Boolean);
        const students = lines.map(n => ({ id: crypto.randomUUID(), name: n }));

        let pinHash = null, pinSalt = null;
        if (checkExtended.checked) {
            const p1 = inputPin1.value.trim();
            const p2 = inputPin2.value.trim();
            if (!/^\d{4,6}$/.test(p1)) {
                pinMatchError.textContent = 'PIN må vere 4–6 siffer.';
                inputPin1.focus();
                return;
            }
            if (p1 !== p2) {
                pinMatchError.textContent = 'PIN-kodane er ikkje like.';
                inputPin2.focus();
                return;
            }
            pinSalt = PinCrypto.randomSalt();
            pinHash = await PinCrypto.hash(p1, pinSalt);
        }

        FStorage.create(name, students, pinHash, pinSalt, checkExtended.checked);
        closeModal(overlayNyListe);
        render();
    });

    /* ── Import JSON ── */
    const importFile = document.getElementById('importJsonFile');
    document.getElementById('btnImportJson').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
        const file = importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const obj = JSON.parse(e.target.result);
                if (obj.app !== 'flokkdeilar') {
                    alert('Fila er ikkje ei Flokkdeilar-eksport.');
                    return;
                }
                /* Alltid ny ID ved import for å unngå kollisjon */
                const toSave = { ...obj, id: crypto.randomUUID(), date: new Date().toISOString() };
                FStorage.importFull(toSave);
                render();
            } catch {
                alert('Klarte ikkje å lesa JSON-fila.');
            }
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    /* ── Hent frå Klassekart ── */
    document.getElementById('btnImportKlassekart').addEventListener('click', () => {
        const kkLister = VyrdepilStorage.getList('klassekart', 'oppsett');
        klassekartLister.innerHTML = '';
        if (kkLister.length === 0) {
            kkEmptyMsg.style.display = '';
        } else {
            kkEmptyMsg.style.display = 'none';
            kkLister.forEach(kk => {
                const students = (kk.data?.students || []).map(s => ({
                    id: crypto.randomUUID(),
                    name: typeof s === 'string' ? s : (s.name || '')
                })).filter(s => s.name);

                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.display = 'block';
                btn.style.width = '100%';
                btn.style.marginBottom = '8px';
                btn.style.textAlign = 'left';
                btn.textContent = `${kk.name} (${students.length} elevar)`;
                btn.addEventListener('click', () => {
                    if (students.length === 0) { alert('Ingen elevar i dette oppsettet.'); return; }
                    FStorage.create(kk.name, students, null, null, false);
                    closeModal(overlayKlassekart);
                    render();
                    showSyncNote('Merk: Denne lista er ikkje kopla til Klassekart. Endringar i den eine appen oppdaterer ikkje den andre.');
                });
                klassekartLister.appendChild(btn);
            });
        }
        openModal(overlayKlassekart);
    });

    document.getElementById('closeKlassekart').addEventListener('click', () => closeModal(overlayKlassekart));
    document.getElementById('closeKlassekart2').addEventListener('click', () => closeModal(overlayKlassekart));

    /* ── Slett liste ── */
    document.getElementById('btnBekreftSlett').addEventListener('click', () => {
        if (pendingDeleteId) FStorage.remove(pendingDeleteId);
        pendingDeleteId = null;
        closeModal(overlaySlettListe);
        render();
    });
    document.getElementById('btnAvbrytSlett').addEventListener('click', () => {
        pendingDeleteId = null;
        closeModal(overlaySlettListe);
    });
    document.getElementById('closeSlettModal').addEventListener('click', () => {
        pendingDeleteId = null;
        closeModal(overlaySlettListe);
    });

    /* ── Synkroniseringsmelding ── */
    function showSyncNote(msg) {
        let note = document.getElementById('syncNote');
        if (!note) {
            note = document.createElement('p');
            note.id = 'syncNote';
            note.className = 'sync-note';
            document.querySelector('.main-content').insertBefore(note, listGrid);
        }
        note.textContent = msg;
        note.style.display = '';
        clearTimeout(note._timer);
        note._timer = setTimeout(() => { note.style.display = 'none'; }, 8000);
    }

    /* ── Init ── */
    render();

})();
