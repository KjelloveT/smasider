/* ══════════════════════════════════════
   UI-ADMIN.JS — Admin-side for Flokkdeilar
   ══════════════════════════════════════ */

(function () {
    'use strict';

    const params = new URLSearchParams(location.search);
    const listId = params.get('id');
    if (!listId) { location.href = 'index.html'; return; }

    let liste = FStorage.getById(listId);
    if (!liste) { location.href = 'index.html'; return; }

    /* ── State ── */
    let pinUnlocked  = false;
    let pinFailCount = 0;
    /* Arbeidskoopi av elevar (redigerast lokalt, lagrast ved knappetrykk) */
    let editStudents = [...(liste.students || [])];

    /* ── DOM ── */
    const adminTittel             = document.getElementById('adminTittel');
    const pinScreen               = document.getElementById('pinScreen');
    const adminMain               = document.getElementById('adminMain');
    const extendedSection         = document.getElementById('extendedSection');
    const activateExtendedSection = document.getElementById('activateExtendedSection');
    const inputListeNamn          = document.getElementById('inputListeNamn');
    const studentList             = document.getElementById('studentList');
    const relationGrid            = document.getElementById('relationGrid');
    const pinInput                = document.getElementById('pinInput');
    const pinError                = document.getElementById('pinError');
    const overlayFjern            = document.getElementById('overlayFjern');
    const overlayAktiverPin       = document.getElementById('overlayAktiverPin');

    /* ── Ikon ── */
    document.getElementById('icon-back').appendChild(Icons.create('arrow-left', 16));
    document.getElementById('icon-check').appendChild(Icons.create('check', 16));
    document.getElementById('icon-plus').appendChild(Icons.create('plus', 16));
    document.getElementById('icon-save').appendChild(Icons.create('check', 16));
    document.getElementById('icon-download').appendChild(Icons.create('download', 16));
    document.getElementById('icon-upload').appendChild(Icons.create('upload', 16));
    {
        const el = document.getElementById('icon-lock-big');
        if (el) el.appendChild(Icons.create('lock', 48));
    }
    {
        const el = document.getElementById('icon-shield');
        if (el) el.appendChild(Icons.create('shield', 16));
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── Init-visning ── */
    adminTittel.textContent = liste.name;
    document.title = `Flokkdeilar — ${liste.name}`;
    inputListeNamn.value = liste.name;

    function showAdmin() {
        pinScreen.style.display = 'none';
        adminMain.style.display = '';
        renderStudentList();
        if (pinUnlocked || (liste.extended && !liste.pinHash)) {
            activateExtendedSection.style.display = 'none';
            extendedSection.style.display = '';
            renderRelationGrid();
        } else {
            activateExtendedSection.style.display = liste.extended ? 'none' : '';
        }
    }

    if (liste.pinHash) {
        pinScreen.style.display = '';
    } else {
        adminMain.style.display = '';
        renderStudentList();
        if (liste.extended) {
            activateExtendedSection.style.display = 'none';
            extendedSection.style.display = '';
            renderRelationGrid();
        } else {
            activateExtendedSection.style.display = '';
        }
    }

    /* ── PIN-validering ── */
    document.getElementById('btnPinSend').addEventListener('click', tryPin);
    pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryPin(); });

    async function tryPin() {
        const pin = pinInput.value.trim();
        const ok = await PinCrypto.verify(pin, liste.pinSalt, liste.pinHash);
        if (ok) {
            pinUnlocked = true;
            pinFailCount = 0;
            showAdmin();
        } else {
            pinFailCount++;
            pinError.textContent = 'Feil PIN. Prøv igjen.';
            pinInput.value = '';
            pinInput.focus();
            if (pinFailCount >= 3 && !document.getElementById('btnFjernFraPinScreen')) {
                pinError.textContent = 'Gløymd PIN? Du kan fjerne tilleggsinformasjonen og halde fram med berre elevnamna.';
                const row = document.createElement('div');
                row.className = 'btn-row';
                row.style.cssText = 'justify-content:center;margin-top:8px;';
                const fb = document.createElement('button');
                fb.className = 'btn btn-danger';
                fb.id = 'btnFjernFraPinScreen';
                fb.textContent = 'Fjern tilleggsinfo og hald fram';
                fb.addEventListener('click', () => openModal(overlayFjern));
                row.appendChild(fb);
                pinScreen.appendChild(row);
            }
        }
    }

    /* ── Modalar ── */
    function openModal(el) { el.classList.add('open'); }
    function closeModal(el) { el.classList.remove('open'); }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal(overlayFjern);
            closeModal(overlayAktiverPin);
        }
    });

    /* ── Aktiver utvida administrasjon ── */
    document.getElementById('btnAktiverUtvidet').addEventListener('click', () => {
        document.getElementById('newPin1').value = '';
        document.getElementById('newPin2').value = '';
        document.getElementById('newPinError').textContent = '';
        openModal(overlayAktiverPin);
        document.getElementById('newPin1').focus();
    });

    document.getElementById('closeAktiverPin').addEventListener('click', () => closeModal(overlayAktiverPin));
    document.getElementById('btnAvbrytAktiverPin').addEventListener('click', () => closeModal(overlayAktiverPin));

    document.getElementById('btnBekreftAktiverPin').addEventListener('click', async () => {
        const p1 = document.getElementById('newPin1').value.trim();
        const p2 = document.getElementById('newPin2').value.trim();
        const err = document.getElementById('newPinError');

        if (!/^\d{4,6}$/.test(p1)) {
            err.textContent = 'PIN må vere 4–6 siffer.';
            document.getElementById('newPin1').focus();
            return;
        }
        if (p1 !== p2) {
            err.textContent = 'PIN-kodane er ikkje like.';
            document.getElementById('newPin2').focus();
            return;
        }

        const salt = PinCrypto.randomSalt();
        const pinHash = await PinCrypto.hash(p1, salt);

        liste = FStorage.update(listId, { extended: true, pinHash, pinSalt: salt });
        pinUnlocked = true;

        closeModal(overlayAktiverPin);
        activateExtendedSection.style.display = 'none';
        extendedSection.style.display = '';
        renderRelationGrid();
    });

    /* ── Listenamn ── */
    document.getElementById('btnLagreNamn').addEventListener('click', () => {
        const name = inputListeNamn.value.trim();
        if (!name) return;
        liste = FStorage.update(listId, { name });
        adminTittel.textContent = name;
        document.title = `Flokkdeilar — ${name}`;
    });

    /* ── Elevliste ── */
    function renderStudentList() {
        studentList.innerHTML = '';
        editStudents.forEach((s, idx) => {
            const row = document.createElement('div');
            row.className = 'student-row';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'student-name-input';
            input.value = s.name;
            input.setAttribute('aria-label', `Elev ${idx + 1}`);
            input.addEventListener('input', () => { editStudents[idx].name = input.value; });

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-icon';
            delBtn.setAttribute('aria-label', `Slett ${s.name}`);
            delBtn.appendChild(Icons.create('trash-2', 16));
            delBtn.addEventListener('click', () => {
                editStudents.splice(idx, 1);
                renderStudentList();
            });

            row.appendChild(input);
            row.appendChild(delBtn);
            studentList.appendChild(row);
        });
    }

    document.getElementById('btnLeggTilElev').addEventListener('click', () => {
        editStudents.push({ id: crypto.randomUUID(), name: '' });
        renderStudentList();
        const inputs = studentList.querySelectorAll('.student-name-input');
        inputs[inputs.length - 1]?.focus();
    });

    document.getElementById('btnBulkAdd').addEventListener('click', () => {
        const lines = document.getElementById('bulkAdd').value
            .split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(name => editStudents.push({ id: crypto.randomUUID(), name }));
        document.getElementById('bulkAdd').value = '';
        renderStudentList();
    });

    document.getElementById('btnLagreElevar').addEventListener('click', () => {
        const cleaned = editStudents.filter(s => s.name.trim()).map(s => ({
            ...s, name: s.name.trim()
        }));
        editStudents = cleaned;
        liste = FStorage.update(listId, { students: cleaned });
        renderStudentList();
        if (pinUnlocked || (liste.extended && !liste.pinHash)) renderRelationGrid();
    });

    /* ── Relasjonsgrid ── */
    function renderRelationGrid() {
        relationGrid.innerHTML = '';
        const students = liste.students || [];
        if (students.length < 2) {
            relationGrid.textContent = 'Treng minst 2 elevar.';
            return;
        }

        const table = document.createElement('table');
        table.className = 'relation-table';

        /* Kolonnehovud */
        const headRow = document.createElement('tr');
        const emptyTh = document.createElement('th');
        emptyTh.className = 'row-header';
        headRow.appendChild(emptyTh);

        /* Vis berre øvre triangel: kolonnar frå student[1] til siste */
        for (let j = 1; j < students.length; j++) {
            const th = document.createElement('th');
            th.textContent = students[j].name;
            headRow.appendChild(th);
        }
        table.appendChild(headRow);

        /* Rader */
        for (let i = 0; i < students.length - 1; i++) {
            const tr = document.createElement('tr');
            const rowTh = document.createElement('th');
            rowTh.className = 'row-header';
            rowTh.textContent = students[i].name;
            tr.appendChild(rowTh);

            /* Tomme celler for allereie viste par (nedre triangel).
               Kolonnane startar på students[1], så rad i treng berre i tomceller. */
            for (let j = 0; j < i; j++) {
                const td = document.createElement('td');
                td.className = 'diagonal';
                tr.appendChild(td);
            }

            /* Aktive celler */
            for (let j = i + 1; j < students.length; j++) {
                const td  = document.createElement('td');
                const val = FStorage.getRelation(liste, students[i].id, students[j].id);

                const btn = document.createElement('button');
                btn.className = 'rel-cell-btn';
                btn.dataset.val = val;
                btn.textContent = val === 'ja' ? 'Ja' : val === 'maybe' ? 'Kan' : 'Nei';
                btn.setAttribute('aria-label', `${students[i].name} og ${students[j].name}: ${val}`);

                btn.addEventListener('click', () => {
                    const cur = btn.dataset.val;
                    const next = cur === 'ja' ? 'maybe' : cur === 'maybe' ? 'never' : 'ja';
                    btn.dataset.val = next;
                    btn.textContent = next === 'ja' ? 'Ja' : next === 'maybe' ? 'Kan' : 'Nei';
                    btn.setAttribute('aria-label', `${students[i].name} og ${students[j].name}: ${next}`);
                    FStorage.setRelation(listId, students[i].id, students[j].id, next);
                    liste = FStorage.getById(listId);
                });

                td.appendChild(btn);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        relationGrid.appendChild(table);
    }

    /* ── Eksport ── */
    document.getElementById('btnExport').addEventListener('click', () => {
        const current = FStorage.getById(listId);
        const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `flokkdeilar-${(current.name || 'liste').replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    /* ── Import ── */
    const importFile = document.getElementById('importFile');
    document.getElementById('btnImport').addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
        const file = importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const obj = JSON.parse(e.target.result);
                if (obj.app !== 'flokkdeilar') { alert('Fila er ikkje ei Flokkdeilar-eksport.'); return; }
                /* Overskriv berre students og relations; behald id/pin */
                liste = FStorage.update(listId, {
                    students:  obj.students  || liste.students,
                    relations: obj.relations || {}
                });
                editStudents = [...(liste.students || [])];
                renderStudentList();
                if (pinUnlocked || (liste.extended && !liste.pinHash)) renderRelationGrid();
            } catch { alert('Klarte ikkje å lesa JSON-fila.'); }
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    /* ── Fjern tilleggsinfo ── */
    document.getElementById('btnFjernTillegg')?.addEventListener('click', () => openModal(overlayFjern));
    document.getElementById('closeFjern').addEventListener('click', () => closeModal(overlayFjern));
    document.getElementById('btnFjernAvbryt').addEventListener('click', () => closeModal(overlayFjern));

    document.getElementById('btnFjernBekreft').addEventListener('click', () => {
        liste = FStorage.update(listId, {
            pinHash: null,
            pinSalt: null,
            extended: false,
            relations: {}
        });
        closeModal(overlayFjern);
        pinScreen.style.display = 'none';
        extendedSection.style.display = 'none';
        pinUnlocked = false;
        adminMain.style.display = '';
        renderStudentList();
    });

})();
