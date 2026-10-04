/* Ormritaren — framgang gjennom leksjonane.
 *
 * Ligg lokalt gjennom VyrdepilStorage (AGENTS.md §2). Framgangen er elevens
 * eiga: ho er til for at han skal finne att staden sin, ikkje for å vurdere
 * han, og ingen lærar kan hente henne inn.
 */
const OrmFramgang = (function () {

    const APP = 'ormritaren';
    const SAMLING = 'framgang';
    let modular = [];

    const BRAGDER = [
        { id: 'fyrste-leksjon', name: 'Fyrste leksjon', icon: 'footprints', test: s => s.completedLessons >= 1 },
        { id: 'ti-leksjonar', name: 'Ti leksjonar', icon: 'check', test: s => s.completedLessons >= 10 },
        { id: 'fyrste-modul', name: 'Ferdig med ein modul', icon: 'layers', test: s => s.modulesCompleted >= 1 },
        { id: '25-leksjonar', name: '25 leksjonar', icon: 'target', test: s => s.completedLessons >= 25 },
        { id: 'halvvegs-bibliotek', name: 'Halvvegs i biblioteket', icon: 'map', test: s => s.libraryPercent >= 50 },
        { id: 'heile-biblioteket', name: 'Heile biblioteket', icon: 'trophy', test: s => s.completedLessons >= s.totalLessons }
    ];

    /** @returns {Array<{modul:string, leksjon:string, status:string, forsok:number, dato:string}>} */
    function alle() {
        return VyrdepilStorage.getCollection(APP, SAMLING) || [];
    }

    function lagre(liste) {
        VyrdepilStorage.setCollection(APP, SAMLING, liste);
    }

    function biblioteksframgang() {
        const tilgjengelege = modular.filter(m => m && m.klar !== false && Number(m.talLeksjonar) > 0);
        const perModul = new Map();
        const ferdige = new Set();
        const moduleIds = new Set(tilgjengelege.map(m => m.id));
        alle().forEach(item => {
            if (!item || item.status !== 'ferdig' || !moduleIds.has(item.modul) || typeof item.leksjon !== 'string') return;
            const key = item.modul + '\u0000' + item.leksjon;
            if (ferdige.has(key)) return;
            ferdige.add(key);
            perModul.set(item.modul, (perModul.get(item.modul) || 0) + 1);
        });
        const totalLessons = tilgjengelege.reduce((sum, m) => sum + Number(m.talLeksjonar), 0);
        const completedLessons = Math.min(totalLessons, ferdige.size);
        const modulesCompleted = tilgjengelege.filter(m => (perModul.get(m.id) || 0) >= Number(m.talLeksjonar)).length;
        return {
            completedLessons,
            totalLessons,
            libraryPercent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0,
            modulesCompleted,
            totalModules: tilgjengelege.length
        };
    }

    function synkBragd(annonser) {
        if (!modular.length || typeof VyrdepilStorage.updateBragdProgress !== 'function') return null;
        const snapshot = biblioteksframgang();
        const previous = VyrdepilStorage.getBragdData().progress[APP];
        if (JSON.stringify(previous || null) !== JSON.stringify(snapshot)) {
            VyrdepilStorage.updateBragdProgress(APP, snapshot);
        }

        const earned = new Set(VyrdepilStorage.getBragdData().badges[APP] || []);
        const unlocked = BRAGDER.filter(bragd => bragd.test(snapshot) && !earned.has(bragd.id))
            .filter(bragd => VyrdepilStorage.recordBadge(APP, bragd.id));
        if (annonser && typeof Vy !== 'undefined' && Vy.toast) {
            unlocked.forEach(bragd => Vy.toast('Ny bragd: ' + bragd.name, { icon: bragd.icon, kind: 'badge' }));
        }
        return snapshot;
    }

    async function setCatalogue(entries) {
        await VyrdepilBragd.migrationPromise;
        modular = Array.isArray(entries) ? entries.slice() : [];
        return synkBragd(false);
    }

    function hent(modul, leksjon) {
        return alle().find(f => f.modul === modul && f.leksjon === leksjon) || null;
    }

    /** Set eller oppdaterer status for éi leksjon. */
    function merk(modul, leksjon, endringar) {
        const liste = alle();
        const i = liste.findIndex(f => f.modul === modul && f.leksjon === leksjon);
        const varFerdig = i >= 0 && liste[i].status === 'ferdig';
        const grunn = { modul, leksjon, status: 'paabegynt', forsok: 0 };
        const ny = { ...(i >= 0 ? liste[i] : grunn), ...endringar, dato: new Date().toISOString() };

        // Ei ferdig leksjon skal ikkje bli «påbegynt» att om eleven kjem tilbake.
        if (i >= 0 && liste[i].status === 'ferdig' && ny.status !== 'ferdig') {
            ny.status = 'ferdig';
        }

        if (i >= 0) liste[i] = ny; else liste.push(ny);
        lagre(liste);
        if (!varFerdig && ny.status === 'ferdig') synkBragd(true);
        return ny;
    }

    function telForsok(modul, leksjon) {
        const no = hent(modul, leksjon);
        return merk(modul, leksjon, { forsok: (no ? no.forsok : 0) + 1 });
    }

    const erFerdig = (modul, leksjon) => hent(modul, leksjon)?.status === 'ferdig';

    /** Tal ferdige leksjonar i ein modul. */
    function talFerdige(modul) {
        return alle().filter(f => f.modul === modul && f.status === 'ferdig').length;
    }

    /** Fyrste leksjonen som ikkje er ferdig — det eleven skal halde fram med. */
    function neste(modul, leksjonIdar) {
        return leksjonIdar.find(id => !erFerdig(modul, id)) || null;
    }

    function nullstill(modul) {
        lagre(alle().filter(f => f.modul !== modul));
        synkBragd(false);
    }

    return { alle, hent, merk, telForsok, erFerdig, talFerdige, neste, nullstill, setCatalogue, biblioteksframgang };
})();
