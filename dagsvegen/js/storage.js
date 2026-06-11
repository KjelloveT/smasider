/* ══════════════════════════════════════
   STORAGE.JS — All lagring for Dagsvegen går gjennom VyrdepilStorage.
   Lister: 'plans' (lagra planar + vekemalar), 'subjects' (fag med emoji),
   'breaks' (hjernepause-aktivitetar). Økt-tilstand i gameState.
   ══════════════════════════════════════ */

const Store = (() => {
    const GAME = 'dagsvegen';

    const DEFAULT_SUBJECTS = [
        { name: 'Norsk', emoji: '📖' },
        { name: 'Matematikk', emoji: '➗' },
        { name: 'Engelsk', emoji: '🫖' },
        { name: 'Naturfag', emoji: '🔬' },
        { name: 'Samfunnsfag', emoji: '🌍' },
        { name: 'KRLE', emoji: '🕊️' },
        { name: 'Kroppsøving', emoji: '⚽' },
        { name: 'Musikk', emoji: '🎵' },
        { name: 'Kunst og handverk', emoji: '🎨' },
        { name: 'Mat og helse', emoji: '🍳' },
        { name: 'Friminutt', emoji: '🏃' },
        { name: 'Matpause', emoji: '🥪' },
        { name: 'Utetid', emoji: '🌳' },
        { name: 'Lesestund', emoji: '📚' },
        { name: 'Samling', emoji: '🧑‍🏫' }
    ];

    const DEFAULT_BREAKS = [
        'Gjer ti hopp på staden',
        'Strekk hendene mot taket og tel til ti',
        'Pust djupt inn og ut fem gonger',
        'Spel stein–saks–papir med naboen din',
        'Skriv namnet ditt i lufta med begge hendene',
        'Tel sakte baklengs frå tretti',
        'Spegl rørslene til læraren',
        'Stå på eitt bein medan du tel til tjue',
        'Rull skuldrene ti gonger kvar veg',
        'Gå stilt ein runde rundt pulten din'
    ];

    function ensureSeed() {
        if (VyrdepilStorage.getList(GAME, 'subjects').length === 0) {
            VyrdepilStorage.setList(GAME, 'subjects',
                DEFAULT_SUBJECTS.map(s => ({ id: State.uid('s'), name: s.name, emoji: s.emoji })));
        }
        if (VyrdepilStorage.getList(GAME, 'breaks').length === 0) {
            VyrdepilStorage.setList(GAME, 'breaks',
                DEFAULT_BREAKS.map(t => ({ id: State.uid('br'), text: t })));
        }
    }

    /* ---- fag ---- */
    function getSubjects() { return VyrdepilStorage.getList(GAME, 'subjects'); }
    function setSubjects(arr) { VyrdepilStorage.setList(GAME, 'subjects', arr); }

    /* ---- hjernepausar ---- */
    function getBreaks() { return VyrdepilStorage.getList(GAME, 'breaks'); }
    function setBreaks(arr) { VyrdepilStorage.setList(GAME, 'breaks', arr); }

    /* ---- planar (namngjevne + vekemalar) ---- */
    function getPlans() { return VyrdepilStorage.getList(GAME, 'plans'); }

    function savePlan(plan) {
        const exists = getPlans().some(p => p.id === plan.id);
        if (exists) {
            VyrdepilStorage.updateListItem(GAME, 'plans', plan.id, plan);
        } else {
            VyrdepilStorage.saveListItem(GAME, 'plans', plan);
        }
    }

    function deletePlan(id) { VyrdepilStorage.deleteListItem(GAME, 'plans', id); }

    function getWeekdayPlan(weekday) {
        return getPlans().find(p => p.weekday === weekday) || null;
    }

    /* Lagre gjeldande plan som vekemal — erstattar eksisterande for same dag */
    function saveWeekdayPlan(plan, weekday) {
        const old = getWeekdayPlan(weekday);
        if (old) deletePlan(old.id);
        const copy = State.clonePlan(plan);
        copy.id = State.uid('p');
        copy.weekday = weekday;
        copy.name = 'Vekemal ' + State.DAYS[weekday % 7];
        VyrdepilStorage.saveListItem(GAME, 'plans', copy);
        return copy;
    }

    /* ---- økt-tilstand ---- */
    function defaultState() {
        return {
            settings: { warnMinutes: 2, autoClearDrawing: false, showClock: true },
            today: null,
            notes: [],
            trafficLight: 'green'
        };
    }

    function getState() {
        const saved = VyrdepilStorage.getGameState(GAME);
        const def = defaultState();
        if (!saved) return def;
        return {
            settings: Object.assign(def.settings, saved.settings || {}),
            today: saved.today || null,
            notes: Array.isArray(saved.notes) ? saved.notes : [],
            trafficLight: saved.trafficLight || 'green'
        };
    }

    function setState(state) { VyrdepilStorage.setGameState(GAME, state); }

    /* ---- eksport / import (AGENTS.md §5.2) ---- */
    function exportAll() {
        return JSON.stringify({
            app: 'dagsvegen',
            version: 1,
            plans: getPlans(),
            subjects: getSubjects(),
            breaks: getBreaks()
        }, null, 2);
    }

    function importAll(obj) {
        if (!obj || obj.app !== 'dagsvegen') {
            return { ok: false, error: 'Fila er ikkje ei Dagsvegen-fil.' };
        }
        if (Array.isArray(obj.plans)) VyrdepilStorage.setList(GAME, 'plans', obj.plans);
        if (Array.isArray(obj.subjects) && obj.subjects.length) VyrdepilStorage.setList(GAME, 'subjects', obj.subjects);
        if (Array.isArray(obj.breaks) && obj.breaks.length) VyrdepilStorage.setList(GAME, 'breaks', obj.breaks);
        return { ok: true };
    }

    return {
        ensureSeed,
        getSubjects, setSubjects,
        getBreaks, setBreaks,
        getPlans, savePlan, deletePlan, getWeekdayPlan, saveWeekdayPlan,
        getState, setState,
        exportAll, importAll
    };
})();
