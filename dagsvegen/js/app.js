/* ══════════════════════════════════════
   APP.JS — Init og samankopling: modusbyte, verktøyrad, økt-tilstand,
   innstillingar, Escape-handtering og toast-meldingar.
   ══════════════════════════════════════ */

const App = (() => {
    const $ = (id) => document.getElementById(id);
    let session = null;

    /* ---- økt-tilstand og dagens plan ---- */

    function getSession() { return session; }
    function getSettings() { return session.settings; }
    function saveSession() { Store.setState(session); }

    function getTodayPlan() {
        if (!session.today) return null;
        if (session.today.date !== State.dateKey(Engine.now())) {
            session.today = null; // ny dag — arbeidskopien frå i går er utgått
            saveSession();
            return null;
        }
        return session.today.plan;
    }

    function setTodayPlan(plan, sourcePlanId) {
        session.today = {
            date: State.dateKey(Engine.now()),
            sourcePlanId: sourcePlanId || null,
            plan: plan
        };
        saveSession();
        Render.bump();
        Engine.tick();
    }

    /* +5/−5 på ein aktivitet — muterer berre dagens arbeidskopi */
    function adjustTime(blockId, actId, delta) {
        const plan = getTodayPlan();
        if (!plan) return;
        const block = plan.blocks.find(b => b.id === blockId);
        if (!block) return;
        State.addTime(block, actId, delta, Engine.now());
        saveSession();
        Render.bump();
        Engine.tick();
    }

    /* ---- modus ---- */

    function setMode(mode) {
        document.body.dataset.mode = mode;
        $('edit-view').classList.toggle('dv-hidden', mode !== 'edit');
        $('hero').classList.toggle('dv-hidden', mode !== 'edit');
        if (mode === 'edit') {
            $('display-view').classList.add('dv-hidden');
            $('empty-state').classList.add('dv-hidden');
            Edit.enter();
        } else {
            Render.bump();
            Engine.tick();
        }
    }

    /* ---- toast ---- */

    let toastTimer = null;
    function toast(msg) {
        const el = $('toast');
        el.textContent = msg;
        el.classList.add('open');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('open'), 3500);
    }

    /* ---- innstillingar ---- */

    function openSettings() {
        $('set-warn').value = session.settings.warnMinutes;
        $('set-autoclear').checked = session.settings.autoClearDrawing;
        $('set-showclock').checked = session.settings.showClock;
        $('set-breaks').value = Store.getBreaks().map(b => b.text).join('\n');
        $('modal-settings').classList.add('open');
    }

    function wireSettings() {
        $('set-warn').addEventListener('change', () => {
            session.settings.warnMinutes = Math.max(0, parseInt($('set-warn').value, 10) || 2);
            saveSession();
        });
        $('set-autoclear').addEventListener('change', () => {
            session.settings.autoClearDrawing = $('set-autoclear').checked;
            saveSession();
        });
        $('set-showclock').addEventListener('change', () => {
            session.settings.showClock = $('set-showclock').checked;
            saveSession();
            Widgets.applyClockVisibility();
        });
        $('set-breaks').addEventListener('change', () => {
            const lines = $('set-breaks').value.split('\n').map(t => t.trim()).filter(Boolean);
            Store.setBreaks(lines.map(t => ({ id: State.uid('br'), text: t })));
        });
        $('btn-settings-subjects').addEventListener('click', () => {
            $('modal-settings').classList.remove('open');
            document.getElementById('btn-open-subjects').click();
        });
    }

    /* ---- Escape og modal-lukking ---- */

    function wireModals() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) overlay.classList.remove('open');
            });
        });
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const overlay = document.getElementById(btn.dataset.close);
                if (overlay) overlay.classList.remove('open');
            });
        });
        document.addEventListener('keydown', (ev) => {
            if (ev.key !== 'Escape') return;
            const openModal = document.querySelector('.modal-overlay.open');
            if (openModal) { openModal.classList.remove('open'); return; }
            if (Draw.isActive()) { Draw.setActive(false); return; }
            if (Widgets.calmIsOpen()) Widgets.closeCalm();
        });
    }

    /* ---- tom tilstand ---- */

    function wireEmptyState() {
        $('btn-empty-create').addEventListener('click', () => setMode('edit'));
        $('btn-empty-load').addEventListener('click', () => {
            setMode('edit');
            Edit.openFilesModal();
        });
        const wd = State.isoWeekday(Engine.now());
        const tpl = Store.getWeekdayPlan(wd);
        const btn = $('btn-empty-weekday');
        if (tpl) {
            btn.classList.remove('dv-hidden');
            Dom.clear(btn);
            btn.appendChild(Icons.create('calendar', 18));
            btn.appendChild(document.createTextNode('Last vekemalen for ' + State.DAYS[wd % 7]));
            btn.addEventListener('click', () => {
                const copy = State.clonePlan(tpl);
                copy.id = State.uid('p');
                copy.weekday = null;
                copy.name = 'I dag';
                setTodayPlan(copy, tpl.id);
            });
        }
    }

    /* ---- verktøyrad ---- */

    function wireToolbar() {
        $('btn-edit').addEventListener('click', () => setMode('edit'));
        $('btn-done').addEventListener('click', () => setMode('display'));
        $('btn-countdown').addEventListener('click', () => Widgets.toggle('countdown-widget'));
        $('btn-stopwatch').addEventListener('click', () => Widgets.toggle('stopwatch-widget'));
        $('btn-traffic').addEventListener('click', () => Widgets.toggle('traffic-widget'));
        $('btn-calm').addEventListener('click', () => Widgets.openCalm());
        $('btn-break').addEventListener('click', () => Widgets.openBrainBreak());
        $('btn-draw').addEventListener('click', () => Draw.setActive(!Draw.isActive()));
        $('btn-note').addEventListener('click', () => Notes.addNote());
        $('btn-settings').addEventListener('click', openSettings);
        $('btn-fullscreen').addEventListener('click', () => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        });
    }

    /* ---- init ---- */

    function init() {
        Store.ensureSeed();
        session = Store.getState();

        Edit.init();
        Widgets.init();
        Notes.init();
        Draw.init();
        wireToolbar();
        wireSettings();
        wireModals();
        wireEmptyState();

        Engine.setPlanProvider(getTodayPlan);
        Engine.onTick(Render.update);
        Engine.onSwitch(() => {
            if (session.settings.autoClearDrawing) Draw.clear();
        });

        setMode('display');
        Engine.start();
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        session: getSession, getSettings, saveSession,
        getTodayPlan, setTodayPlan, adjustTime,
        setMode, toast
    };
})();
