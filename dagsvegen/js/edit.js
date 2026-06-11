/* ══════════════════════════════════════
   EDIT.JS — Redigeringsmodus: blokker og aktivitetar (CRUD),
   vekemalar, lagra planar, eksport/import og fagliste.
   All brukartekst blir sett med textContent/value — aldri innerHTML.
   ══════════════════════════════════════ */

const Edit = (() => {
    const $ = (id) => document.getElementById(id);
    let lastSig = '';

    function plan() { return App.getTodayPlan(); }

    function changed(structural) {
        App.saveSession();
        Render.bump();
        if (structural) renderEditor();
    }

    /* Signatur for rekkjefølgje + overlapp-varsel. Tids- og varigheitsfelt
       utset ombygging av editoren til feltet mistar fokus (blur), slik at
       blokkene ikkje byter plass medan ein framleis skriv. */
    function editorSig(p) {
        const sorted = p.blocks.slice().sort((a, b) => State.blockStart(a) - State.blockStart(b));
        let prevEnd = null;
        return sorted.map(b => {
            const overlap = prevEnd != null && State.blockStart(b) < prevEnd;
            prevEnd = State.blockEnd(b);
            return b.id + (overlap ? '!' : '');
        }).join('|');
    }

    function maybeResort() {
        const p = plan();
        if (p && editorSig(p) !== lastSig) renderEditor();
    }

    /* ---- inngang ---- */

    function enter() {
        if (!plan()) {
            App.setTodayPlan(State.newPlan('I dag'), null);
        }
        renderEditor();
    }

    function renderEditor() {
        renderWeekdayRow();
        renderBlocks();
    }

    /* ---- vekemalar ---- */

    function renderWeekdayRow() {
        const row = $('weekday-row');
        Dom.clear(row);
        row.appendChild(Dom.el('span', { class: 'dv-edit-label', text: 'Vekemalar:' }));
        for (let wd = 1; wd <= 7; wd++) {
            const tpl = Store.getWeekdayPlan(wd);
            row.appendChild(Dom.el('button', {
                class: 'btn dv-btn-small' + (tpl ? '' : ' dv-btn-ghost'),
                text: State.DAYS_SHORT[wd % 7],
                'aria-label': (tpl ? 'Last vekemal for ' : 'Inga vekemal for ') + State.DAYS[wd % 7],
                onclick: () => {
                    if (!tpl) { App.toast('Inga vekemal lagra for ' + State.DAYS[wd % 7] + ' enno.'); return; }
                    if (plan() && plan().blocks.length &&
                        !confirm('Erstatte dagens plan med vekemalen for ' + State.DAYS[wd % 7] + '?')) return;
                    const copy = State.clonePlan(tpl);
                    copy.id = State.uid('p');
                    copy.weekday = null;
                    copy.name = 'I dag';
                    App.setTodayPlan(copy, tpl.id);
                    renderEditor();
                }
            }));
        }
        const daySel = Dom.el('select', { class: 'dv-input', 'aria-label': 'Vel dag for vekemal' });
        for (let wd = 1; wd <= 7; wd++) {
            const opt = Dom.el('option', { value: String(wd), text: State.DAYS[wd % 7] });
            if (wd === State.isoWeekday(Engine.now())) opt.selected = true;
            daySel.appendChild(opt);
        }
        row.appendChild(Dom.el('span', { class: 'dv-weekday-save' },
            daySel,
            Dom.el('button', {
                class: 'btn dv-btn-small',
                onclick: () => {
                    const wd = parseInt(daySel.value, 10);
                    Store.saveWeekdayPlan(plan(), wd);
                    App.toast('Lagra som vekemal for ' + State.DAYS[wd % 7] + '.');
                    renderWeekdayRow();
                }
            }, Icons.create('save', 16), 'Lagre som vekemal')));
    }

    /* ---- blokk-redigering ---- */

    function renderBlocks() {
        const wrap = $('blocks-editor');
        Dom.clear(wrap);
        const p = plan();
        if (!p) return;
        State.sortBlocks(p);

        if (!p.blocks.length) {
            wrap.appendChild(Dom.el('p', { class: 'dv-edit-empty', text: 'Ingen økter enno. Legg til den første under.' }));
        }

        let prevEnd = null;
        p.blocks.forEach((block, i) => {
            if (prevEnd != null && State.blockStart(block) < prevEnd) {
                wrap.appendChild(Dom.el('p', { class: 'dv-overlap-warn', text: 'Obs: denne økta overlappar med den førre.' }));
            }
            prevEnd = State.blockEnd(block);
            wrap.appendChild(blockRow(block, i, p));
        });
        lastSig = editorSig(p);
    }

    function blockRow(block, i, p) {
        const subjects = Store.getSubjects();

        const emojiBtn = Dom.el('button', {
            class: 'dv-emoji-pick', 'aria-label': 'Vel emoji for ' + block.title, text: block.emoji,
            onclick: () => EmojiPicker.open(e => { block.emoji = e; changed(true); })
        });

        const subjectSel = Dom.el('select', { class: 'dv-input dv-subject-sel', 'aria-label': 'Vel fag' });
        subjectSel.appendChild(Dom.el('option', { value: '', text: '— Vel fag —' }));
        subjects.forEach(s => {
            const opt = Dom.el('option', { value: s.id, text: s.emoji + ' ' + s.name });
            if (s.id === block.subjectId) opt.selected = true;
            subjectSel.appendChild(opt);
        });
        subjectSel.addEventListener('change', () => {
            const s = subjects.find(x => x.id === subjectSel.value);
            if (s) {
                block.subjectId = s.id;
                block.title = s.name;
                block.emoji = s.emoji;
                block.type = /friminutt|pause|utetid/i.test(s.name) ? 'break' : block.type;
                changed(true);
            }
        });

        const titleInput = Dom.el('input', { class: 'dv-input dv-title-input', type: 'text',
            'aria-label': 'Namn på økta', placeholder: 'Namn på økta' });
        titleInput.value = block.title;
        titleInput.addEventListener('change', () => { block.title = titleInput.value.trim() || 'Økt'; changed(false); });

        const typeSel = Dom.el('select', { class: 'dv-input', 'aria-label': 'Type økt' },
            Dom.el('option', { value: 'lesson', text: 'Økt' }),
            Dom.el('option', { value: 'break', text: 'Pause' }));
        typeSel.value = block.type;
        typeSel.addEventListener('change', () => { block.type = typeSel.value; changed(true); });

        const sumRef = { fn: null }; // live-oppdatering av minutt-summen utan full ombygging

        const startInput = Dom.el('input', { class: 'dv-input', type: 'time', 'aria-label': 'Starttid' });
        startInput.value = block.start;
        startInput.addEventListener('change', () => {
            if (State.parseHM(startInput.value) != null) { block.start = startInput.value; changed(false); }
        });
        startInput.addEventListener('blur', maybeResort);

        const durInput = Dom.el('input', { class: 'dv-input dv-dur-input', type: 'number', min: '5', max: '480', step: '5',
            'aria-label': 'Varigheit i minutt' });
        durInput.value = block.duration;
        durInput.addEventListener('change', () => {
            block.duration = Math.max(5, parseInt(durInput.value, 10) || 45);
            changed(false);
            if (sumRef.fn) sumRef.fn();
        });
        durInput.addEventListener('blur', maybeResort);

        const noteInput = Dom.el('input', { class: 'dv-input dv-note-input', type: 'text',
            'aria-label': 'Notat om innhaldet', placeholder: 'Kva skal de gjere? (valfritt)' });
        noteInput.value = block.note;
        noteInput.addEventListener('change', () => { block.note = noteInput.value; changed(false); });

        const moveBtns = Dom.el('span', { class: 'dv-row-actions' },
            Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Flytt opp', disabled: i === 0,
                onclick: () => moveBlock(p, i, -1) }, Icons.create('chevron-up')),
            Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Flytt ned', disabled: i === p.blocks.length - 1,
                onclick: () => moveBlock(p, i, 1) }, Icons.create('chevron-down')),
            Dom.el('button', { class: 'dv-icon-btn dv-danger', 'aria-label': 'Slett økta',
                onclick: () => { if (confirm('Slette «' + block.title + '»?')) { p.blocks.splice(i, 1); changed(true); } }
            }, Icons.create('trash-2')));

        const row = Dom.el('div', { class: 'box1 dv-block-edit' },
            Dom.el('div', { class: 'dv-block-edit-main' },
                emojiBtn, subjectSel, titleInput, typeSel, startInput, durInput, moveBtns),
            Dom.el('div', { class: 'dv-block-edit-note' }, noteInput)
        );

        if (block.type === 'lesson') {
            const acts = activitiesEditor(block);
            sumRef.fn = acts._updateSum;
            row.appendChild(acts);
        }
        return row;
    }

    /* Flytt blokk og juster starttid slik at rekkjefølgja held seg */
    function moveBlock(p, i, dir) {
        const j = i + dir;
        if (j < 0 || j >= p.blocks.length) return;
        const a = p.blocks[i], b = p.blocks[j];
        const tmp = a.start;
        a.start = b.start;
        b.start = tmp;
        changed(true);
    }

    /* ---- aktivitetar i ei økt ----
       onStructure: kva som skal teiknast om når lista endrar form
       (standard: heile editoren — snøggøkt-modalen sender si eiga). */

    function activitiesEditor(block, onStructure) {
        const rerender = onStructure || renderEditor;
        const mutate = () => { changed(false); rerender(); };
        const wrap = Dom.el('div', { class: 'dv-acts-edit' });

        const sumEl = Dom.el('span', { class: 'dv-acts-sum' });
        function updateSum() {
            const sum = State.actSum(block);
            const over = State.overflowMin(block);
            sumEl.className = 'dv-acts-sum' + (over > 0 ? ' is-over' : '');
            sumEl.textContent = block.activities.length
                ? sum + ' av ' + block.duration + ' min' + (over > 0 ? ' (' + over + ' min over!)' : '')
                : '';
        }
        updateSum();
        wrap._updateSum = updateSum;

        const head = Dom.el('div', { class: 'dv-acts-head' },
            Dom.el('span', { class: 'dv-edit-label', text: 'Plan for timen' }),
            sumEl);
        wrap.appendChild(head);

        block.activities.forEach((act, i) => {
            const title = Dom.el('input', { class: 'dv-input dv-act-input', type: 'text',
                'aria-label': 'Namn på aktiviteten', placeholder: 'Aktivitet' });
            title.value = act.title;
            title.addEventListener('change', () => { act.title = title.value.trim() || 'Aktivitet'; changed(false); });

            const dur = Dom.el('input', { class: 'dv-input dv-dur-input', type: 'number', min: '1', max: '240',
                'aria-label': 'Minutt' });
            dur.value = act.duration;
            dur.addEventListener('change', () => {
                act.duration = Math.max(1, parseInt(dur.value, 10) || 5);
                changed(false);
                updateSum();
            });

            const flexId = 'flex_' + act.id;
            const flex = Dom.el('input', { type: 'checkbox', id: flexId, class: 'dv-flex-check' });
            flex.checked = !!act.flexible;
            flex.addEventListener('change', () => { act.flexible = flex.checked; changed(false); });

            wrap.appendChild(Dom.el('div', { class: 'dv-act-edit-row' },
                title, dur, Dom.el('span', { class: 'dv-edit-label', text: 'min' }),
                Dom.el('label', { class: 'dv-flex-label', for: flexId, title: 'Fleksibel aktivitet: tida blir henta herifrå når andre får meir' },
                    flex, 'Fleksibel'),
                Dom.el('span', { class: 'dv-row-actions' },
                    Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Flytt aktiviteten opp', disabled: i === 0,
                        onclick: () => { const t = block.activities[i - 1]; block.activities[i - 1] = act; block.activities[i] = t; mutate(); }
                    }, Icons.create('chevron-up', 16)),
                    Dom.el('button', { class: 'dv-icon-btn', 'aria-label': 'Flytt aktiviteten ned', disabled: i === block.activities.length - 1,
                        onclick: () => { const t = block.activities[i + 1]; block.activities[i + 1] = act; block.activities[i] = t; mutate(); }
                    }, Icons.create('chevron-down', 16)),
                    Dom.el('button', { class: 'dv-icon-btn dv-danger', 'aria-label': 'Slett aktiviteten',
                        onclick: () => { block.activities.splice(i, 1); mutate(); }
                    }, Icons.create('trash-2', 16)))));
        });

        wrap.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small',
            onclick: () => { block.activities.push(State.newActivity('', 10, block.activities.length > 0)); mutate(); }
        }, Icons.create('plus', 16), 'Aktivitet'));
        return wrap;
    }

    /* ---- snøggøkt: éi økt no, utan dagsplan ---- */

    let quickBlock = null;

    function openQuickModal() {
        const start = State.fmtHM(Math.floor(State.nowMinutes(Engine.now())));
        quickBlock = State.newBlock({ title: '', emoji: '📖', type: 'lesson', start, duration: 45 });
        renderQuickBody();
        $('modal-quick').classList.add('open');
    }

    function renderQuickBody() {
        const body = $('quick-body');
        Dom.clear(body);
        const block = quickBlock;
        const subjects = Store.getSubjects();

        const emojiBtn = Dom.el('button', {
            class: 'dv-emoji-pick', 'aria-label': 'Vel emoji for økta', text: block.emoji,
            onclick: () => EmojiPicker.open(e => { block.emoji = e; renderQuickBody(); })
        });

        const titleInput = Dom.el('input', { class: 'dv-input dv-title-input', type: 'text',
            'aria-label': 'Namn på økta', placeholder: 'Namn på økta' });
        titleInput.value = block.title;
        titleInput.addEventListener('change', () => { block.title = titleInput.value.trim(); });

        const subjectSel = Dom.el('select', { class: 'dv-input dv-subject-sel', 'aria-label': 'Vel fag' });
        subjectSel.appendChild(Dom.el('option', { value: '', text: '— Vel fag —' }));
        subjects.forEach(s => {
            const opt = Dom.el('option', { value: s.id, text: s.emoji + ' ' + s.name });
            if (s.id === block.subjectId) opt.selected = true;
            subjectSel.appendChild(opt);
        });
        subjectSel.addEventListener('change', () => {
            const s = subjects.find(x => x.id === subjectSel.value);
            if (s) { block.subjectId = s.id; block.title = s.name; block.emoji = s.emoji; renderQuickBody(); }
        });

        const durInput = Dom.el('input', { class: 'dv-input dv-dur-input', type: 'number',
            min: '5', max: '480', step: '5', 'aria-label': 'Varigheit i minutt' });
        durInput.value = block.duration;
        durInput.addEventListener('change', () => {
            block.duration = Math.max(5, parseInt(durInput.value, 10) || 45);
            const acts = body.querySelector('.dv-acts-edit');
            if (acts && acts._updateSum) acts._updateSum();
        });

        body.appendChild(Dom.el('div', { class: 'dv-quick-row' },
            emojiBtn, subjectSel, titleInput, durInput,
            Dom.el('span', { class: 'dv-edit-label', text: 'min' })));
        body.appendChild(activitiesEditor(block, renderQuickBody));
        body.appendChild(Dom.el('div', { class: 'dv-quick-actions' },
            Dom.el('button', { class: 'btn active', text: 'Start økta no', onclick: startQuickLesson })));
    }

    function startQuickLesson() {
        const now = Engine.now();
        const nm = State.nowMinutes(now);
        if (!plan()) App.setTodayPlan(State.newPlan('I dag'), null);
        const p = plan();

        /* avslutt det som eventuelt er aktivt akkurat no, slik at snøggøkta tek over */
        const status = State.computeStatus(p, now);
        if (status.activeBlockIdx >= 0) {
            const ab = p.blocks[status.activeBlockIdx];
            const elapsed = Math.max(0, Math.floor(nm - State.blockStart(ab)));
            ab.duration = Math.min(ab.duration, elapsed);
            if (State.hasActivities(ab)) {
                let left = elapsed;
                ab.activities.forEach(a => {
                    const take = Math.max(0, Math.min(a.duration, left));
                    a.duration = take;
                    left -= take;
                });
            }
        }

        quickBlock.title = quickBlock.title || 'Økt';
        quickBlock.start = State.fmtHM(Math.floor(nm));
        p.blocks.push(quickBlock);
        State.sortBlocks(p);
        App.saveSession();

        $('modal-quick').classList.remove('open');
        App.setPanel('lesson', true);
        App.setMode('display');
        App.toast('Økta er i gang.');
    }

    function addBlock(type) {
        const p = plan();
        const last = p.blocks[p.blocks.length - 1];
        const start = last ? State.fmtHM(State.blockEnd(last)) : '08:30';
        p.blocks.push(State.newBlock(type === 'break'
            ? { title: 'Friminutt', emoji: '🏃', type: 'break', start, duration: 15 }
            : { title: 'Ny økt', emoji: '📖', type: 'lesson', start, duration: 45 }));
        changed(true);
    }

    /* ---- lagra planar (modal) ---- */

    function openFilesModal() {
        renderPlansList();
        $('modal-files').classList.add('open');
        $('save-name').focus();
    }

    function renderPlansList() {
        const list = $('plans-list');
        Dom.clear(list);
        const named = Store.getPlans().filter(p => p.weekday == null);
        if (!named.length) {
            list.appendChild(Dom.el('p', { class: 'dv-edit-empty', text: 'Ingen lagra planar enno.' }));
            return;
        }
        named.forEach(p => {
            list.appendChild(Dom.el('div', { class: 'dv-plan-row' },
                Dom.el('span', { class: 'dv-plan-name', text: p.name }),
                Dom.el('span', { class: 'dv-plan-meta', text: p.blocks.length + ' økter' }),
                Dom.el('button', { class: 'btn dv-btn-small', text: 'Last inn',
                    onclick: () => {
                        if (plan() && plan().blocks.length && !confirm('Erstatte dagens plan med «' + p.name + '»?')) return;
                        const copy = State.clonePlan(p);
                        copy.id = State.uid('p');
                        copy.weekday = null;
                        App.setTodayPlan(copy, p.id);
                        $('modal-files').classList.remove('open');
                        renderEditor();
                    }
                }),
                Dom.el('button', { class: 'dv-icon-btn dv-danger', 'aria-label': 'Slett planen ' + p.name,
                    onclick: () => { if (confirm('Slette «' + p.name + '»?')) { Store.deletePlan(p.id); renderPlansList(); } }
                }, Icons.create('trash-2', 16))));
        });
    }

    function saveCurrentPlan() {
        const name = $('save-name').value.trim();
        if (!name) { App.toast('Skriv eit namn på planen først.'); return; }
        const copy = State.clonePlan(plan());
        copy.id = State.uid('p');
        copy.name = name;
        copy.weekday = null;
        Store.savePlan(copy);
        $('save-name').value = '';
        renderPlansList();
        App.toast('Planen «' + name + '» er lagra.');
    }

    /* ---- eksport / import ---- */

    function exportFile() {
        const blob = new Blob([Store.exportAll()], { type: 'application/json' });
        const a = Dom.el('a', { href: URL.createObjectURL(blob), download: 'dagsvegen-eksport.json' });
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
    }

    function importFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let obj = null;
            try { obj = JSON.parse(reader.result); } catch (e) { /* ugyldig JSON */ }
            const res = Store.importAll(obj);
            if (!res.ok) { App.toast(res.error || 'Klarte ikkje å lese fila.'); return; }
            App.toast('Importen er ferdig.');
            renderEditor();
        };
        reader.readAsText(file);
    }

    /* ---- fagliste (modal) ---- */

    function openSubjectsModal() {
        renderSubjectsList();
        $('modal-subjects').classList.add('open');
    }

    function renderSubjectsList() {
        const list = $('subjects-list');
        Dom.clear(list);
        const subjects = Store.getSubjects();
        subjects.forEach((s, i) => {
            const nameInput = Dom.el('input', { class: 'dv-input', type: 'text', 'aria-label': 'Namn på faget' });
            nameInput.value = s.name;
            nameInput.addEventListener('change', () => {
                subjects[i].name = nameInput.value.trim() || s.name;
                Store.setSubjects(subjects);
            });
            list.appendChild(Dom.el('div', { class: 'dv-subject-row' },
                Dom.el('button', { class: 'dv-emoji-pick', 'aria-label': 'Vel emoji for ' + s.name, text: s.emoji,
                    onclick: () => EmojiPicker.open(e => { subjects[i].emoji = e; Store.setSubjects(subjects); renderSubjectsList(); })
                }),
                nameInput,
                Dom.el('button', { class: 'dv-icon-btn dv-danger', 'aria-label': 'Slett faget ' + s.name,
                    onclick: () => {
                        if (!confirm('Slette faget «' + s.name + '»?')) return;
                        subjects.splice(i, 1);
                        Store.setSubjects(subjects);
                        renderSubjectsList();
                    }
                }, Icons.create('trash-2', 16))));
        });
        list.appendChild(Dom.el('button', {
            class: 'btn dv-btn-small',
            onclick: () => {
                subjects.push({ id: State.uid('s'), name: 'Nytt fag', emoji: '📖' });
                Store.setSubjects(subjects);
                renderSubjectsList();
            }
        }, Icons.create('plus', 16), 'Legg til fag'));
    }

    function init() {
        $('btn-add-block').addEventListener('click', () => addBlock('lesson'));
        $('btn-add-break').addEventListener('click', () => addBlock('break'));
        $('btn-open-files').addEventListener('click', openFilesModal);
        $('btn-open-subjects').addEventListener('click', openSubjectsModal);
        $('btn-save-plan').addEventListener('click', saveCurrentPlan);
        $('btn-export').addEventListener('click', exportFile);
        $('btn-import').addEventListener('click', () => $('import-file').click());
        $('import-file').addEventListener('change', (ev) => {
            if (ev.target.files[0]) importFile(ev.target.files[0]);
            ev.target.value = '';
        });
    }

    return { init, enter, renderEditor, openFilesModal, openQuickModal };
})();
