/* ══════════════════════════════════════
   STATE.JS — Datamodell og rein tidslogikk for Dagsvegen.
   Ingen DOM, ingen lagring — berre utrekningar, slik at
   rebalanseringa kan testast manuelt i konsollen.
   ══════════════════════════════════════ */

const State = (() => {
    const DAYS = ['sundag', 'måndag', 'tysdag', 'onsdag', 'torsdag', 'fredag', 'laurdag'];
    const DAYS_SHORT = ['Søn', 'Mån', 'Tys', 'Ons', 'Tor', 'Fre', 'Lau'];
    const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni',
                    'juli', 'august', 'september', 'oktober', 'november', 'desember'];

    function uid(prefix) {
        return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    /* ---- tid og dato ---- */

    function parseHM(str) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(str || '');
        if (!m) return null;
        return (+m[1]) * 60 + (+m[2]);
    }

    function fmtHM(min) {
        min = ((Math.round(min) % 1440) + 1440) % 1440;
        const h = Math.floor(min / 60), m = min % 60;
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function fmtMMSS(totalSec) {
        totalSec = Math.max(0, Math.round(totalSec));
        const m = Math.floor(totalSec / 60), s = totalSec % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function nowMinutes(date) {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    }

    /* ISO-vekenummer (torsdags-algoritmen) */
    function isoWeek(date) {
        const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = (t.getUTCDay() + 6) % 7;
        t.setUTCDate(t.getUTCDate() - day + 3);
        const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
        const fday = (firstThu.getUTCDay() + 6) % 7;
        firstThu.setUTCDate(firstThu.getUTCDate() - fday + 3);
        return 1 + Math.round((t - firstThu) / (7 * 864e5));
    }

    function isoWeekday(date) { return ((date.getDay() + 6) % 7) + 1; } // 1 = måndag

    function formatDate(date) {
        return DAYS[date.getDay()] + ' ' + date.getDate() + '. ' + MONTHS[date.getMonth()]
            + ' — veke ' + isoWeek(date);
    }

    function dateKey(date) {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
            + '-' + String(date.getDate()).padStart(2, '0');
    }

    /* ---- modell-fabrikkar ---- */

    function newPlan(name) {
        return { id: uid('p'), name: name || 'Utan namn', weekday: null, blocks: [] };
    }

    function newBlock(opts) {
        opts = opts || {};
        return {
            id: uid('b'),
            subjectId: opts.subjectId || null,
            emoji: opts.emoji || '📖',
            title: opts.title || 'Ny økt',
            type: opts.type || 'lesson',
            start: opts.start || '08:30',
            duration: opts.duration || 45,
            note: opts.note || '',
            activities: opts.activities || []
        };
    }

    function newActivity(title, duration, flexible) {
        return { id: uid('a'), title: title || 'Aktivitet', duration: duration || 10, flexible: !!flexible };
    }

    function clonePlan(plan) { return JSON.parse(JSON.stringify(plan)); }

    /* ---- blokk-utrekningar ---- */

    function blockStart(block) {
        const s = parseHM(block.start);
        return s == null ? 0 : s;
    }

    function blockEnd(block) { return blockStart(block) + (block.duration || 0); }

    function actSum(block) {
        return (block.activities || []).reduce((sum, a) => sum + (a.duration || 0), 0);
    }

    function hasActivities(block) { return block.activities && block.activities.length > 0; }

    /* Minutt utover planlagt blokkslutt (raud overtid) */
    function overflowMin(block) {
        if (!hasActivities(block)) return 0;
        return Math.max(0, actSum(block) - block.duration);
    }

    /* Effektiv slutt: aktivitetar kan strekkje blokka forbi planlagt slutt */
    function effectiveEnd(block) {
        return blockStart(block) + Math.max(block.duration || 0, hasActivities(block) ? actSum(block) : 0);
    }

    function sortBlocks(plan) {
        plan.blocks.sort((a, b) => blockStart(a) - blockStart(b));
    }

    /* Kumulativ start (minutt frå blokkstart) for kvar aktivitet */
    function activityOffsets(block) {
        const offsets = [];
        let cum = 0;
        for (const act of (block.activities || [])) {
            offsets.push(cum);
            cum += act.duration || 0;
        }
        return offsets;
    }

    /* Kor mange minutt av aktiviteten som alt er brukte akkurat no */
    function usedMin(block, actIdx, nowMin) {
        const offsets = activityOffsets(block);
        const aStart = blockStart(block) + offsets[actIdx];
        const aEnd = aStart + block.activities[actIdx].duration;
        if (nowMin <= aStart) return 0;
        if (nowMin >= aEnd) return block.activities[actIdx].duration;
        return Math.ceil(nowMin - aStart);
    }

    /* ---- status for heile planen, gitt klokkeslettet ---- */

    function computeStatus(plan, now) {
        const nm = nowMinutes(now);
        const st = {
            nowMin: nm,
            activeBlockIdx: -1,
            blockElapsed: 0,
            blockProgress: 0,
            activeActivityIdx: -1,
            remainingSec: null,      // til neste byte (aktivitet eller blokkslutt)
            nextLabel: null,
            warning: false,
            overflowMin: 0,
            beforeStart: false,
            done: false,
            nextBlockIdx: -1
        };
        if (!plan || !plan.blocks || plan.blocks.length === 0) return st;
        const blocks = plan.blocks;

        for (let i = 0; i < blocks.length; i++) {
            if (nm >= blockStart(blocks[i]) && nm < effectiveEnd(blocks[i])) {
                st.activeBlockIdx = i;
                break;
            }
        }

        if (st.activeBlockIdx === -1) {
            // før første, mellom blokker, eller etter siste
            for (let i = 0; i < blocks.length; i++) {
                if (nm < blockStart(blocks[i])) { st.nextBlockIdx = i; break; }
            }
            if (st.nextBlockIdx === -1) {
                st.done = true;
            } else {
                st.beforeStart = st.nextBlockIdx === 0;
                st.remainingSec = (blockStart(blocks[st.nextBlockIdx]) - nm) * 60;
                st.nextLabel = blocks[st.nextBlockIdx].title;
            }
            return st;
        }

        const block = blocks[st.activeBlockIdx];
        const start = blockStart(block);
        const total = Math.max(block.duration || 0, hasActivities(block) ? actSum(block) : 0);
        st.blockElapsed = nm - start;
        st.blockProgress = total > 0 ? Math.min(1, st.blockElapsed / total) : 0;
        st.overflowMin = overflowMin(block);
        st.nextBlockIdx = st.activeBlockIdx + 1 < blocks.length ? st.activeBlockIdx + 1 : -1;

        if (hasActivities(block)) {
            const offsets = activityOffsets(block);
            for (let i = 0; i < block.activities.length; i++) {
                const aStart = offsets[i], aEnd = aStart + block.activities[i].duration;
                if (st.blockElapsed >= aStart && st.blockElapsed < aEnd) {
                    st.activeActivityIdx = i;
                    st.remainingSec = (aEnd - st.blockElapsed) * 60;
                    if (i + 1 < block.activities.length) {
                        st.nextLabel = block.activities[i + 1].title;
                    } else {
                        st.nextLabel = st.nextBlockIdx >= 0 ? blocks[st.nextBlockIdx].title : 'Slutt';
                    }
                    break;
                }
            }
            if (st.activeActivityIdx === -1) {
                // ledig tid på slutten av blokka (aktivitetane er ferdige)
                st.remainingSec = (total - st.blockElapsed) * 60;
                st.nextLabel = st.nextBlockIdx >= 0 ? blocks[st.nextBlockIdx].title : 'Slutt';
            }
        } else {
            st.remainingSec = (total - st.blockElapsed) * 60;
            st.nextLabel = st.nextBlockIdx >= 0 ? blocks[st.nextBlockIdx].title : 'Slutt';
        }
        return st;
    }

    /* ---- +5/−5 med fleksibel buffer ----
       Invariant: blokkslutt (start + duration) står fast om mogeleg.
       Meirtid blir trekt frå fleksible aktivitetar — først dei som kjem
       etter den justerte, så tidlegare. Rest blir raud overtid. */

    function flexOrder(activities, skipIdx) {
        const after = [], before = [];
        activities.forEach((act, i) => {
            if (i === skipIdx || !act.flexible) return;
            (i > skipIdx ? after : before).push(i);
        });
        return after.concat(before);
    }

    function addTime(block, actId, delta, now) {
        const nm = nowMinutes(now);
        const acts = block.activities || [];
        const idx = acts.findIndex(a => a.id === actId);
        if (idx === -1 || !delta) return;
        const act = acts[idx];

        if (delta < 0) {
            const used = usedMin(block, idx, nm);
            const newDur = Math.max(used, act.duration + delta);
            const freed = act.duration - newDur;
            act.duration = newDur;
            if (freed > 0) {
                // fyll opp att mot planlagt slutt: gje ledig tid til første
                // fleksible aktivitet som ikkje er ferdig
                const deficit = block.duration - actSum(block);
                if (deficit > 0) {
                    const offsets = activityOffsets(block);
                    for (const j of flexOrder(acts, idx)) {
                        const aEnd = blockStart(block) + offsets[j] + acts[j].duration;
                        if (aEnd >= nm) { // ikkje alt ferdig — kan ta imot tid
                            acts[j].duration += deficit;
                            break;
                        }
                    }
                }
            }
        } else {
            act.duration += delta;
            let over = actSum(block) - block.duration;
            if (over > 0) {
                for (const j of flexOrder(acts, idx)) {
                    if (over <= 0) break;
                    const avail = acts[j].duration - usedMin(block, j, nm);
                    const take = Math.min(over, Math.max(0, avail));
                    acts[j].duration -= take;
                    over -= take;
                }
            }
            // rest-overtid blir ståande og vist raudt (overflowMin)
        }
    }

    return {
        DAYS, DAYS_SHORT, MONTHS,
        uid, parseHM, fmtHM, fmtMMSS, nowMinutes,
        isoWeek, isoWeekday, formatDate, dateKey,
        newPlan, newBlock, newActivity, clonePlan,
        blockStart, blockEnd, actSum, hasActivities, overflowMin, effectiveEnd,
        sortBlocks, activityOffsets, usedMin,
        computeStatus, addTime
    };
})();
