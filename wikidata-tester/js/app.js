/* app.js — UI, resultatvising og eksport for Listesmia */
(() => {
    // ---------- Tilstand ----------
    const S = {
        topic: null,              // {id, label, description}
        suggestedProps: [],       // frå WdApi.suggestProperties
        filters: [],              // [{prop, value}]
        selectedProps: new Map(), // id -> prop
        statPropId: null,         // P-id for stat-feltet (eller null)
        results: null,            // deduplisert rad-liste
        vars: [],                 // kolonnenamn i resultatet
        extra: []                 // extraProps med varName frå siste bygde spørjing
    };

    const $ = id => document.getElementById(id);

    // Snøggval: emne som funkar godt og gjev fine kort
    const QUICK_TOPICS = [
        { id: 'Q39367', label: 'Hunderasar' },
        { id: 'Q43577', label: 'Katterasar' },
        { id: 'Q8502', label: 'Fjell', sub: true },
        { id: 'Q8072', label: 'Vulkanar', sub: true },
        { id: 'Q23397', label: 'Innsjøar' },
        { id: 'Q11344', label: 'Grunnstoff' },
        { id: 'Q12280', label: 'Bruer', sub: true },
        { id: 'Q33506', label: 'Museum' },
        { id: 'Q3305213', label: 'Måleri' },
        { id: 'Q34770', label: 'Språk' }
    ];

    // ---------- Hjelparar ----------
    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        Object.assign(node, props);
        for (const c of children) node.append(c);
        return node;
    }

    function showStatus(msg, type) {
        const s = $('status');
        s.textContent = msg;
        s.className = `status ${type}`;
        if (type === 'success' || type === 'info') {
            setTimeout(() => { if (s.textContent === msg) s.className = 'status'; }, 6000);
        }
    }

    function debounce(fn, ms) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    }

    function qidFrom(value) {
        const m = /Q\d+/.exec(value || '');
        return m ? m[0] : null;
    }

    // ---------- Generisk entitetssøk med nedtrekksliste ----------
    function attachEntitySearch(input, dropdown, onPick) {
        const doSearch = debounce(async () => {
            const term = input.value.trim();
            if (term.length < 2) { dropdown.classList.remove('open'); return; }
            try {
                const hits = await WdApi.searchEntities(term, 'item');
                dropdown.replaceChildren();
                if (hits.length === 0) {
                    dropdown.append(el('div', { className: 'dropdown-item', textContent: 'Ingen treff.' }));
                } else {
                    for (const hit of hits) {
                        const btn = el('button', { type: 'button', className: 'dropdown-item' });
                        const lbl = el('span', { className: 'di-label', textContent: hit.label });
                        const id = el('span', { className: 'di-id', textContent: hit.id });
                        const desc = el('span', { className: 'di-desc', textContent: hit.description });
                        btn.append(lbl, id, desc);
                        btn.addEventListener('click', () => {
                            dropdown.classList.remove('open');
                            input.value = hit.label;
                            onPick(hit);
                        });
                        dropdown.append(btn);
                    }
                }
                dropdown.classList.add('open');
            } catch (err) {
                showStatus(`Søket feila: ${err.message}`, 'error');
            }
        }, 350);

        input.addEventListener('input', doSearch);
        input.addEventListener('blur', () => setTimeout(() => dropdown.classList.remove('open'), 200));
    }

    // ---------- Steg 1: emne ----------
    function renderQuickTopics() {
        const wrap = $('quickTopics');
        for (const t of QUICK_TOPICS) {
            const chip = el('button', { type: 'button', className: 'chip', textContent: t.label });
            chip.addEventListener('click', () => {
                if (t.sub) $('includeSubclasses').checked = true;
                pickTopic({ id: t.id, label: t.label, description: '' });
            });
            wrap.append(chip);
        }
    }

    async function pickTopic(hit) {
        S.topic = hit;
        S.filters = [];
        S.selectedProps = new Map();
        S.statPropId = null;
        $('filterList').replaceChildren();
        $('topicSearch').value = '';

        const picked = $('pickedTopic');
        picked.replaceChildren(
            el('strong', { textContent: hit.label }),
            el('span', { className: 'picked-id', textContent: hit.id + (hit.description ? ' · ' + hit.description : '') }),
            (() => {
                const x = el('button', { type: 'button', textContent: '✕', title: 'Fjern emne' });
                x.setAttribute('aria-label', 'Fjern valt emne');
                x.addEventListener('click', clearTopic);
                return x;
            })()
        );
        picked.style.display = 'inline-flex';
        $('runBtn').disabled = false;

        await loadPropertySuggestions();
    }

    function clearTopic() {
        S.topic = null;
        S.suggestedProps = [];
        S.selectedProps = new Map();
        S.filters = [];
        $('pickedTopic').style.display = 'none';
        $('propGrid').replaceChildren(el('p', { className: 'hint-text', textContent: 'Vel eit emne i steg 1 først.' }));
        $('filterList').replaceChildren();
        $('runBtn').disabled = true;
        renderStatPick();
        renderSortOptions();
    }

    async function loadPropertySuggestions() {
        const grid = $('propGrid');
        grid.replaceChildren(el('div', { className: 'loading', innerHTML: '<div class="spinner"></div><p>Undersøkjer kva opplysningar som finst for dette emnet …</p>' }));
        try {
            S.suggestedProps = await WdApi.suggestProperties(S.topic.id, $('includeSubclasses').checked);
            renderPropGrid();
            renderStatPick();
            renderSortOptions();
        } catch (err) {
            grid.replaceChildren(el('p', { className: 'hint-text', textContent: 'Fekk ikkje henta forslag: ' + err.message + ' (du kan framleis hente lista utan ekstra kolonnar)' }));
        }
    }

    // ---------- Steg 2: filter ----------
    function addFilterRow() {
        const itemProps = S.suggestedProps.filter(p => p.type === 'WikibaseItem');
        if (itemProps.length === 0) {
            showStatus('Vel eit emne først, så verktøyet veit kva filter som er aktuelle.', 'warn');
            return;
        }

        const filter = { prop: itemProps[0], value: null };
        S.filters.push(filter);

        const row = el('div', { className: 'filter-row' });
        const sel = el('select');
        sel.setAttribute('aria-label', 'Eigenskap å filtrere på');
        for (const p of itemProps) {
            sel.append(el('option', { value: p.id, textContent: `${p.label} (${p.count} av 200 har denne)` }));
        }
        sel.addEventListener('change', () => {
            filter.prop = itemProps.find(p => p.id === sel.value);
        });

        const wrap = el('div', { className: 'search-wrap' });
        const input = el('input', { type: 'text', placeholder: 'Søk etter verdi, t.d. «Noreg» …' });
        const dd = el('div', { className: 'dropdown' });
        wrap.append(input, dd);
        attachEntitySearch(input, dd, hit => { filter.value = hit; });

        const rm = el('button', { type: 'button', className: 'btn-mini danger', textContent: 'Fjern' });
        rm.addEventListener('click', () => {
            S.filters = S.filters.filter(f => f !== filter);
            row.remove();
        });

        row.append(el('span', { textContent: 'der' }), sel, el('span', { textContent: 'er' }), wrap, rm);
        $('filterList').append(row);
    }

    // ---------- Steg 3: ekstra opplysningar ----------
    const TYPE_LABELS = {
        WikibaseItem: 'oppslag (t.d. land, person)',
        Quantity: 'tal',
        Time: 'dato/årstal',
        String: 'tekst',
        Monolingualtext: 'tekst'
    };

    function renderPropGrid() {
        const grid = $('propGrid');
        grid.replaceChildren();
        if (S.suggestedProps.length === 0) {
            grid.append(el('p', { className: 'hint-text', textContent: 'Fann ingen forslag for dette emnet.' }));
            return;
        }
        for (const p of S.suggestedProps) {
            const card = el('label', { className: 'prop-card' });
            const cb = el('input', { type: 'checkbox' });
            cb.addEventListener('change', () => {
                if (cb.checked) S.selectedProps.set(p.id, p);
                else {
                    S.selectedProps.delete(p.id);
                    if (S.statPropId === p.id) S.statPropId = null;
                }
                card.classList.toggle('on', cb.checked);
                renderStatPick();
                renderSortOptions();
            });
            const txt = el('span');
            txt.append(
                el('span', { className: 'pc-name', textContent: p.label }),
                el('span', { className: 'pc-meta', textContent: `${TYPE_LABELS[p.type] || p.type} · ${p.count} av 200 i stikkprøva har denne` })
            );
            card.append(cb, txt);
            grid.append(card);
        }
    }

    function renderStatPick() {
        const wrap = $('statPick');
        wrap.replaceChildren();
        const sel = [...S.selectedProps.values()];
        if (sel.length === 0) return;

        wrap.append(el('p', { textContent: 'Kva av desse skal visast som statistikk på korta i Heimsank?', style: 'font-weight:600; margin-bottom:4px;' }));
        const none = el('label', { className: 'opt-label' });
        const noneRadio = el('input', { type: 'radio', name: 'statProp', checked: S.statPropId === null });
        noneRadio.addEventListener('change', () => { S.statPropId = null; });
        none.append(noneRadio, 'Inga');
        wrap.append(none);

        for (const p of sel) {
            const lab = el('label', { className: 'opt-label' });
            const r = el('input', { type: 'radio', name: 'statProp', checked: S.statPropId === p.id });
            r.addEventListener('change', () => {
                S.statPropId = p.id;
                // Sorter automatisk etter stat-feltet — namnesortering er upåliteleg
                // på store emne (Wikidata set namna først ETTER sortering og LIMIT)
                const sortSel = $('sortBy');
                if ([...sortSel.options].some(o => o.value === p.id)) sortSel.value = p.id;
            });
            lab.append(r, p.label);
            wrap.append(lab);
        }
    }

    // ---------- Steg 4: sortering ----------
    function renderSortOptions() {
        const sel = $('sortBy');
        const prev = sel.value;
        sel.replaceChildren(el('option', { value: 'label', textContent: 'Namn (A–Å)' }));
        for (const p of S.selectedProps.values()) {
            sel.append(el('option', { value: p.id, textContent: p.label }));
        }
        if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
    }

    // ---------- Køyring ----------
    function currentConfig() {
        const sortPropId = $('sortBy').value;
        return {
            topic: S.topic,
            includeSubclasses: $('includeSubclasses').checked,
            filters: S.filters.filter(f => f.value),
            requireImage: $('requireImage').checked,
            requireArticle: $('requireArticle').checked,
            skipUnnamed: $('skipUnnamed').checked,
            extraProps: [...S.selectedProps.values()],
            limit: Math.max(1, Math.min(2000, parseInt($('limitInput').value, 10) || 100)),
            sortPropId,
            sortDir: $('sortDir').value
        };
    }

    async function runGuided() {
        if (!S.topic) { showStatus('Vel eit emne først.', 'warn'); return; }
        const cfg = currentConfig();

        // Omset sorterings-P-id til varName via byggjaren
        const built = QueryBuilder.build({
            ...cfg,
            sort: { by: 'label', dir: 'ASC' }
        });
        let sortBy = 'label';
        if (cfg.sortPropId !== 'label') {
            const m = built.extra.find(p => p.id === cfg.sortPropId);
            if (m) sortBy = m.varName;
        }

        // Hent fleire rader enn ønskt slik at det er noko att etter at duplikat
        // og namnlause element er fjerna; trim ned att lokalt etterpå.
        const fetchLimit = Math.min(cfg.limit * 2, 2000);
        const final = QueryBuilder.build({ ...cfg, limit: fetchLimit, sort: { by: sortBy, dir: cfg.sortDir } });

        $('sparqlQuery').value = final.query;
        S.extra = final.extra;
        S.trimTo = cfg.limit;
        // Namneteneste i Wikidata fyller inn namn etter LIMIT, så A–Å-sortering
        // må gjerast lokalt for å bli rett.
        S.clientSortByLabel = (sortBy === 'label');
        await executeQuery(final.query);
    }

    async function runAdvanced() {
        const q = $('sparqlQuery').value.trim();
        if (!q) { showStatus('Ingen spørjing å køyre.', 'warn'); return; }
        S.extra = [];
        S.trimTo = null;
        S.clientSortByLabel = false;
        await executeQuery(q);
    }

    async function executeQuery(query) {
        const section = $('resultsSection');
        section.style.display = 'block';
        section.replaceChildren(el('div', { className: 'loading', innerHTML: '<div class="spinner"></div><p>Hentar data frå Wikidata … (store lister kan ta opptil eitt minutt)</p>' }));
        $('runBtn').disabled = true;

        try {
            const data = await WdApi.runSparql(query);
            const vars = data.head.vars;
            const idVar = vars[0];

            // Dedupliser: same element kan kome fleire gonger (fleire bilete o.l.)
            // Hopp eventuelt over element der namnet berre er Q-koden (manglar label).
            const skipUnnamed = $('skipUnnamed').checked;
            const labelVar = vars.includes(idVar + 'Label') ? idVar + 'Label' : null;
            const seen = new Set();
            let rows = [];
            let dupCount = 0, unnamedCount = 0;
            for (const b of data.results.bindings) {
                const key = b[idVar] ? b[idVar].value : JSON.stringify(b);
                if (seen.has(key)) { dupCount++; continue; }
                seen.add(key);
                if (skipUnnamed && labelVar && b[labelVar] && /^Q\d+$/.test(b[labelVar].value)) { unnamedCount++; continue; }
                rows.push(b);
            }

            if (S.clientSortByLabel && labelVar) {
                rows.sort((a, c) => ((a[labelVar] && a[labelVar].value) || '')
                    .localeCompare((c[labelVar] && c[labelVar].value) || '', 'no'));
            }
            if (S.trimTo && rows.length > S.trimTo) rows = rows.slice(0, S.trimTo);

            S.results = rows;
            S.vars = vars;
            displayResults(rows, vars, data.results.bindings.length);
            const notes = [];
            if (dupCount > 0) notes.push(`${dupCount} duplikatrader fjerna`);
            if (unnamedCount > 0) notes.push(`${unnamedCount} element utan namn hoppa over`);
            const note = notes.length ? ` (${notes.join(', ')})` : '';
            if (unnamedCount > rows.length) {
                showStatus(`Fann ${rows.length} element${note}. Tips: store emne har mange namnlause element — sorter etter ein talverdi (t.d. areal) eller kryss av for «Må ha Wikipedia-artikkel», så kjem dei kjende elementa øvst.`, 'warn');
            } else {
                showStatus(`Fann ${rows.length} element${note}.`, rows.length > 0 ? 'success' : 'warn');
            }
            $('exportSection').style.display = rows.length > 0 ? 'block' : 'none';
        } catch (err) {
            section.style.display = 'none';
            showStatus(`Noko gjekk gale: ${err.message}`, 'error');
        } finally {
            $('runBtn').disabled = !S.topic;
        }
    }

    // ---------- Resultatvising ----------
    function isImageUrl(url) {
        if (typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].some(ext => lower.includes(ext))
            || lower.includes('commons.wikimedia.org');
    }

    function displayResults(rows, vars, rawCount) {
        const section = $('resultsSection');
        section.replaceChildren();

        const header = el('div', { className: 'results-header' },
            el('h2', { textContent: 'Resultat' }),
            el('span', { className: 'result-count', textContent: `${rows.length} element` }));

        const table = el('table');
        const thead = el('thead');
        const headRow = el('tr');
        for (const v of vars) headRow.append(el('th', { textContent: v }));
        thead.append(headRow);

        const tbody = el('tbody');
        for (const b of rows) {
            const tr = el('tr');
            for (const v of vars) {
                const td = el('td');
                if (!b[v]) { td.textContent = '–'; tr.append(td); continue; }
                const value = b[v].value;
                const datatype = b[v].datatype || '';
                if (isImageUrl(value)) {
                    const img = el('img', { className: 'result-image', alt: v, loading: 'lazy', src: value.replace(/^http:/, 'https:') });
                    img.addEventListener('click', () => showImageModal(value));
                    td.append(img);
                } else if (datatype.endsWith('#dateTime') || datatype.endsWith('#date')) {
                    const y = /^(-?\d+)/.exec(value);
                    td.textContent = y ? y[1] : value;
                } else if (b[v].type === 'uri') {
                    const a = el('a', { href: value, target: '_blank', rel: 'noopener' });
                    a.textContent = value.includes('wikipedia.org/wiki/')
                        ? decodeURIComponent(value.split('/wiki/')[1]).replace(/_/g, ' ')
                        : value.split('/').pop();
                    td.append(a);
                } else {
                    td.textContent = value;
                }
                tr.append(td);
            }
            tbody.append(tr);
        }

        table.append(thead, tbody);
        section.append(header, el('div', { className: 'table-container' }, table));
    }

    function showImageModal(url) {
        let modal = $('imageModal');
        if (!modal) {
            modal = el('div', { id: 'imageModal', className: 'image-modal' });
            modal.addEventListener('click', () => { modal.style.display = 'none'; });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.style.display = 'none'; });
            document.body.append(modal);
        }
        modal.replaceChildren(el('img', { src: url.replace(/^http:/, 'https:'), alt: 'Stort bilete' }));
        modal.style.display = 'block';
    }

    // ---------- Eksport ----------
    function listSlug() {
        const name = $('listName').value.trim() || (S.topic ? S.topic.label : 'liste');
        return name.toLowerCase()
            .replace(/[æå]/g, 'a').replace(/ø/g, 'o')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'liste';
    }

    function download(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const a = el('a', { href: URL.createObjectURL(blob), download: filename });
        document.body.append(a);
        a.click();
        a.remove();
    }

    function exportCSV() {
        if (!S.results) return;
        let csv = S.vars.join(',') + '\n';
        for (const b of S.results) {
            csv += S.vars.map(v => `"${(b[v] ? b[v].value : '').replace(/"/g, '""')}"`).join(',') + '\n';
        }
        download(csv, `${listSlug()}.csv`, 'text/csv;charset=utf-8;');
        showStatus(`CSV lasta ned. Legg fila i heimsank/kort/ og lim inn categories-utdraget.`, 'success');
    }

    function statFieldInfo() {
        // Finn varName og type for valt stat-felt i den genererte spørjinga
        if (!S.statPropId) return null;
        const p = S.extra.find(x => x.id === S.statPropId);
        if (!p) return null;
        const statField = p.type === 'WikibaseItem' ? `${p.varName}Label` : p.varName;
        const statType = p.type === 'Quantity' ? 'number' : p.type === 'Time' ? 'year' : 'text';
        const statLabel = statType === 'number' ? 'users' : statType === 'year' ? 'calendar' : 'globe';
        return { statField, statType, statLabel };
    }

    function exportCategorySnippet() {
        if (!S.results) return;
        const idVar = S.vars[0];
        const nameVar = S.vars.includes(idVar + 'Label') ? idVar + 'Label' : (S.vars[1] || idVar);
        const imageVar = S.vars.includes('image') ? 'image' : (S.vars.includes('flag') ? 'flag' : '');
        const articleVar = S.vars.includes('article') ? 'article' : '';
        const stat = statFieldInfo();
        const slug = listSlug();
        const name = $('listName').value.trim() || (S.topic ? S.topic.label : 'Ny liste');

        const snippet = {
            id: slug,
            label: name,
            icon: 'sparkles',
            csv: `${slug}.csv`,
            rarity: `rarity-${slug}.json`,
            idField: idVar,
            nameField: nameVar,
            imageField: imageVar,
            articleField: articleVar,
            statField: stat ? stat.statField : nameVar,
            statType: stat ? stat.statType : 'text',
            statLabel: stat ? stat.statLabel : 'globe'
        };

        const box = $('snippetBox');
        box.textContent = JSON.stringify(snippet, null, 2);
        box.style.display = 'block';
        showStatus('Utdraget under kan limast inn i heimsank/kort/categories.json (hugs komma mellom oppføringane). Byt gjerne ikon — sjå heimsank/js/icons.js.', 'info');
    }

    function exportRarity() {
        if (!S.results) return;
        const idVar = S.vars[0];
        const qids = S.results.map(b => qidFrom(b[idVar] && b[idVar].value)).filter(Boolean);
        if (qids.length === 0) { showStatus('Fann ingen Wikidata-id-ar (Q-nummer) i første kolonne.', 'error'); return; }

        const pct = {
            vanleg: parseFloat($('pctVanleg').value) || 0,
            sjeldgjevt: parseFloat($('pctSjeldgjevt').value) || 0,
            segngjeten: parseFloat($('pctSegngjeten').value) || 0,
            gudebore: parseFloat($('pctGudebore').value) || 0
        };
        const total = pct.vanleg + pct.sjeldgjevt + pct.segngjeten + pct.gudebore;
        if (total <= 0) { showStatus('Prosentane må vere større enn null.', 'error'); return; }

        // Stokk om og del ut etter prosentdelane
        const shuffled = [...qids];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const out = {};
        let idx = 0;
        const tiers = ['gudebore', 'segngjeten', 'sjeldgjevt'];
        for (const tier of tiers) {
            const n = Math.round(shuffled.length * pct[tier] / total);
            for (let i = 0; i < n && idx < shuffled.length; i++) out[shuffled[idx++]] = tier;
        }
        while (idx < shuffled.length) out[shuffled[idx++]] = 'vanleg';

        download(JSON.stringify(out, null, 2), `rarity-${listSlug()}.json`, 'application/json');
        showStatus('Rarity-fil lasta ned. Legg ho i heimsank/kort/.', 'success');
    }

    // ---------- Init ----------
    function init() {
        renderQuickTopics();
        attachEntitySearch($('topicSearch'), $('topicDropdown'), pickTopic);

        $('includeSubclasses').addEventListener('change', () => { if (S.topic) loadPropertySuggestions(); });
        $('addFilterBtn').addEventListener('click', addFilterRow);
        $('runBtn').addEventListener('click', runGuided);
        $('runAdvancedBtn').addEventListener('click', runAdvanced);
        $('exportCsvBtn').addEventListener('click', exportCSV);
        $('snippetBtn').addEventListener('click', exportCategorySnippet);
        $('rarityBtn').addEventListener('click', exportRarity);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
