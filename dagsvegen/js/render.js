/* ══════════════════════════════════════
   RENDER.JS — Visningsmodus: datolinje, dagsplan-kolonne med no-markør,
   og panel for aktiv økt med aktivitets-tidsline, nedteljing og +5/−5.
   Bygger om DOM berre når struktur/aktiv blokk endrar seg; per tick
   blir berre tekst og posisjonar oppdaterte.
   ══════════════════════════════════════ */

const Render = (() => {
    let structVersion = 0;
    let lastKey = null;
    let selectedBlockId = null; // manuelt vald blokk (null = følg klokka)
    const refs = { dayRows: [], marker: null, countdown: null, nextLabel: null,
                   actRows: [], warnBadge: null, segs: [] };

    const $ = (id) => document.getElementById(id);

    function bump() { structVersion++; }

    function selectBlock(id) {
        selectedBlockId = (selectedBlockId === id) ? null : id;
        Engine.tick();
    }

    function shownBlockIdx(plan, status) {
        if (selectedBlockId) {
            const idx = plan.blocks.findIndex(b => b.id === selectedBlockId);
            if (idx >= 0) return idx;
            selectedBlockId = null;
        }
        if (status.activeBlockIdx >= 0) return status.activeBlockIdx;
        if (status.nextBlockIdx >= 0) return status.nextBlockIdx;
        return plan.blocks.length - 1;
    }

    function update(now, status) {
        $('date-text').textContent = State.formatDate(now);
        if (document.body.dataset.mode === 'edit') return;

        const plan = App.getTodayPlan();
        const hasPlan = !!(plan && plan.blocks && plan.blocks.length);
        $('empty-state').classList.toggle('dv-hidden', hasPlan || App.session().ui.emptyDismissed);
        App.applyPanels();
        if (!hasPlan) { lastKey = null; return; }

        const shownIdx = shownBlockIdx(plan, status);
        const key = [structVersion, status.activeBlockIdx, status.activeActivityIdx,
                     shownIdx, selectedBlockId || ''].join('|');
        if (key !== lastKey) {
            buildDayCol(plan, status);
            buildLessonPanel(plan, status, shownIdx);
            lastKey = key;
        }
        tickUpdate(plan, status, shownIdx);
    }

    /* ---- dagsplan-kolonna ---- */

    function buildDayCol(plan, status) {
        const col = $('day-col');
        Dom.clear(col);
        refs.dayRows = [];
        plan.blocks.forEach((block, i) => {
            const past = status.nowMin >= State.effectiveEnd(block);
            const active = i === status.activeBlockIdx;
            const range = block.start + '–' + State.fmtHM(State.blockEnd(block));

            const progress = Dom.el('div', { class: 'dv-day-progress' }, Dom.el('span'));
            const row = Dom.el('button', {
                class: 'dv-day-row' + (active ? ' is-active' : past ? ' is-past' : ' is-future')
                    + (block.type === 'break' ? ' is-break' : '')
                    + (selectedBlockId === block.id ? ' is-selected' : ''),
                'aria-label': block.title + ' ' + range,
                onclick: () => selectBlock(block.id)
            },
                Dom.el('span', { class: 'dv-day-emoji', 'aria-hidden': 'true', text: block.emoji }),
                Dom.el('span', { class: 'dv-day-info' },
                    Dom.el('span', { class: 'dv-day-title', text: block.title }),
                    Dom.el('span', { class: 'dv-day-time', text: range }),
                    block.note ? Dom.el('span', { class: 'dv-day-note', text: block.note }) : null
                ),
                active ? progress : null
            );
            col.appendChild(row);
            refs.dayRows.push({ block, row, progressBar: active ? progress.firstChild : null });
        });
    }

    /* ---- panel for vald/aktiv økt ---- */

    function buildLessonPanel(plan, status, shownIdx) {
        const panel = $('lesson-panel');
        Dom.clear(panel);
        refs.marker = refs.countdown = refs.nextLabel = refs.warnBadge = null;
        refs.actRows = []; refs.segs = [];
        const block = plan.blocks[shownIdx];
        if (!block) return;

        const isActive = shownIdx === status.activeBlockIdx;
        const isPast = status.nowMin >= State.effectiveEnd(block);
        const nextBlock = plan.blocks[shownIdx + 1] || null;

        const head = Dom.el('div', { class: 'box-header dv-lesson-head' },
            Dom.el('span', { class: 'dv-lesson-emoji', 'aria-hidden': 'true', text: block.emoji }),
            Dom.el('span', { class: 'dv-lesson-title', text: block.title }),
            Dom.el('span', { class: 'dv-lesson-time', text: block.start + '–' + State.fmtHM(State.blockEnd(block)) })
        );
        const body = Dom.el('div', { class: 'box-body dv-lesson-body' });

        if (selectedBlockId && !isActive) {
            body.appendChild(Dom.el('div', { class: 'dv-not-active' },
                Dom.el('span', { text: isPast ? 'Denne økta er ferdig.' : 'Denne økta har ikkje starta enno.' }),
                Dom.el('button', { class: 'btn dv-btn-small', text: 'Følg klokka', onclick: () => { selectedBlockId = null; Engine.tick(); } })
            ));
        }

        if (block.note) body.appendChild(Dom.el('p', { class: 'dv-lesson-note', text: block.note }));

        /* stor nedteljing */
        if (isActive || (!isPast && !isActive)) {
            refs.countdown = Dom.el('div', { class: 'dv-countdown-num', text: '--:--' });
            refs.nextLabel = Dom.el('div', { class: 'dv-countdown-label' });
            refs.warnBadge = Dom.el('div', { class: 'dv-warn-badge dv-hidden', text: '' });
            body.appendChild(Dom.el('div', { class: 'dv-countdown-wrap' }, refs.countdown, refs.nextLabel, refs.warnBadge));
        } else if (isPast) {
            body.appendChild(Dom.el('div', { class: 'dv-countdown-wrap' },
                Dom.el('div', { class: 'dv-countdown-label', text: 'Ferdig' })));
        }

        /* aktivitets-tidsline */
        if (State.hasActivities(block)) {
            const total = Math.max(block.duration, State.actSum(block));
            const over = State.overflowMin(block);
            const offsets = State.activityOffsets(block);
            const start = State.blockStart(block);

            const bar = Dom.el('div', { class: 'dv-timeline', 'aria-hidden': 'true' });
            block.activities.forEach((act, i) => {
                const seg = Dom.el('div', { class: 'dv-tl-seg', title: act.title });
                seg.style.width = total > 0 ? (act.duration / total * 100) + '%' : '0%';
                bar.appendChild(seg);
                refs.segs.push({ seg, actIdx: i });
            });
            if (over > 0) {
                const zone = Dom.el('div', { class: 'dv-tl-overflow' });
                zone.style.left = (block.duration / total * 100) + '%';
                zone.style.width = (over / total * 100) + '%';
                bar.appendChild(zone);
            }
            refs.marker = Dom.el('div', { class: 'dv-tl-marker' });
            bar.appendChild(refs.marker);
            body.appendChild(bar);

            if (over > 0) {
                body.appendChild(Dom.el('div', { class: 'dv-overflow-warn' },
                    Dom.el('span', { text: '−' + over + ' min av ' + (nextBlock ? nextBlock.title : 'tida etter økta') })));
            }

            /* aktivitetsliste */
            const list = Dom.el('div', { class: 'dv-act-list' });
            block.activities.forEach((act, i) => {
                const aStart = start + offsets[i];
                const aEnd = aStart + act.duration;
                const finished = status.nowMin >= aEnd;
                const current = isActive && i === status.activeActivityIdx;

                const remainEl = Dom.el('span', { class: 'dv-act-remaining' });
                const row = Dom.el('div', {
                    class: 'dv-act-row' + (current ? ' is-active' : finished ? ' is-past' : '')
                },
                    Dom.el('span', { class: 'dv-act-status', 'aria-hidden': 'true' },
                        finished ? Icons.create('check', 16) : null),
                    Dom.el('span', { class: 'dv-act-title', text: act.title }),
                    act.flexible ? Dom.el('span', { class: 'dv-flex-badge', title: 'Fleksibel aktivitet (buffer)' },
                        Icons.create('flag', 12), 'fleks') : null,
                    Dom.el('span', { class: 'dv-act-dur', text: act.duration + ' min' }),
                    current ? remainEl : null,
                    !finished ? Dom.el('span', { class: 'dv-act-adjust' },
                        Dom.el('button', { class: 'dv-adjust-btn', 'aria-label': 'Trekk frå 5 minutt på ' + act.title,
                            onclick: () => App.adjustTime(block.id, act.id, -5) }, Icons.create('minus', 20), '5'),
                        Dom.el('button', { class: 'dv-adjust-btn', 'aria-label': 'Legg til 5 minutt på ' + act.title,
                            onclick: () => App.adjustTime(block.id, act.id, 5) }, Icons.create('plus', 20), '5')
                    ) : null
                );
                list.appendChild(row);
                refs.actRows.push({ actIdx: i, remainEl: current ? remainEl : null });
            });
            body.appendChild(list);
        }

        panel.appendChild(head);
        panel.appendChild(body);
    }

    /* ---- lette oppdateringar kvar tick ---- */

    function tickUpdate(plan, status, shownIdx) {
        const block = plan.blocks[shownIdx];
        if (!block) return;
        const isActive = shownIdx === status.activeBlockIdx;

        // progresjonsstrek i dagsplan-kolonna
        const activeRef = refs.dayRows.find(r => r.progressBar);
        if (activeRef && status.activeBlockIdx >= 0) {
            activeRef.progressBar.style.width = (status.blockProgress * 100) + '%';
        }

        // nedteljing
        if (refs.countdown) {
            if (isActive && status.remainingSec != null) {
                refs.countdown.textContent = State.fmtMMSS(status.remainingSec);
                refs.nextLabel.textContent = status.nextLabel ? 'Neste: ' + status.nextLabel : '';
            } else if (!isActive) {
                refs.countdown.textContent = block.start;
                refs.nextLabel.textContent = 'Startar';
            }
        }

        // 2-minutts varsel
        if (refs.warnBadge) {
            const warn = isActive && status.remainingSec != null && status.remainingSec > 0
                && status.remainingSec <= App.getSettings().warnMinutes * 60;
            refs.warnBadge.classList.toggle('dv-hidden', !warn);
            if (warn) {
                refs.warnBadge.textContent = Math.ceil(status.remainingSec / 60) + ' min att';
            }
        }

        // no-markør på tidslina
        if (refs.marker && isActive) {
            const total = Math.max(block.duration, State.actSum(block));
            const frac = total > 0 ? Math.min(1, status.blockElapsed / total) : 0;
            refs.marker.style.left = (frac * 100) + '%';
            refs.marker.classList.remove('dv-hidden');
        } else if (refs.marker) {
            refs.marker.classList.add('dv-hidden');
        }

        // tid att i aktiv aktivitet
        for (const r of refs.actRows) {
            if (r.remainEl && status.remainingSec != null) {
                r.remainEl.textContent = State.fmtMMSS(status.remainingSec) + ' att';
            }
        }
    }

    return { update, bump, selectBlock };
})();
