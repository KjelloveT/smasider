/* query.js — byggjer SPARQL ut frå vala i veivisaren */
const QueryBuilder = (() => {

    /** Make a safe SPARQL variable name from a property label, e.g. "folketal" -> ?folketal */
    function varNameFor(prop, used) {
        let base = prop.label
            .toLowerCase()
            .replace(/[æå]/g, 'a').replace(/ø/g, 'o')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 25);
        if (!base || /^[0-9]/.test(base)) base = prop.id.toLowerCase();
        let name = base, i = 2;
        while (used.has(name)) { name = `${base}${i++}`; }
        used.add(name);
        return name;
    }

    /**
     * cfg = {
     *   topic: {id, label}, includeSubclasses: bool,
     *   filters: [{prop: {id,label}, value: {id,label}}],
     *   requireImage: bool, requireArticle: bool,
     *   extraProps: [{id, label, type}],          // type: WikibaseItem|Quantity|Time|String|Monolingualtext
     *   limit: number,
     *   sort: {by: 'label'|'<varName>', dir: 'ASC'|'DESC'}
     * }
     * Returns { query, vars } where vars maps roles to variable names.
     */
    function build(cfg) {
        const used = new Set(['item', 'itemLabel', 'image', 'article']);
        const extra = cfg.extraProps.map(p => ({ ...p, varName: varNameFor(p, used) }));

        const selectVars = ['?item', '?itemLabel'];
        const lines = [];

        const path = cfg.includeSubclasses ? 'wdt:P31/wdt:P279*' : 'wdt:P31';
        lines.push(`  ?item ${path} wd:${cfg.topic.id} .`);

        for (const f of cfg.filters) {
            lines.push(`  ?item wdt:${f.prop.id} wd:${f.value.id} .   # ${f.prop.label}: ${f.value.label}`);
        }

        selectVars.push('?image');
        lines.push(cfg.requireImage
            ? '  ?item wdt:P18 ?image .'
            : '  OPTIONAL { ?item wdt:P18 ?image . }');

        selectVars.push('?article');
        lines.push('  OPTIONAL { ?artikkelNn schema:about ?item ; schema:isPartOf <https://nn.wikipedia.org/> . }');
        lines.push('  OPTIONAL { ?artikkelNo schema:about ?item ; schema:isPartOf <https://no.wikipedia.org/> . }');
        lines.push('  OPTIONAL { ?artikkelEn schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }');
        lines.push('  BIND(COALESCE(?artikkelNn, ?artikkelNo, ?artikkelEn) AS ?article)');
        if (cfg.requireArticle) {
            lines.push('  FILTER(BOUND(?article))');
        }

        for (const p of extra) {
            selectVars.push(`?${p.varName}`);
            if (p.type === 'WikibaseItem') selectVars.push(`?${p.varName}Label`);
            if (p.type === 'Quantity') {
                // Bruk normalisert verdi (SI-eining): råverdiane blandar einingar
                // (t.d. km² og m²) og kan ikkje sorterast eller samanliknast
                lines.push(`  OPTIONAL {   # ${p.label}
    ?item wdt:${p.id} ?${p.varName}_raa .
    OPTIONAL { ?item p:${p.id}/psn:${p.id}/wikibase:quantityAmount ?${p.varName}_norm . }
    BIND(COALESCE(?${p.varName}_norm, ?${p.varName}_raa) AS ?${p.varName})
  }`);
            } else {
                lines.push(`  OPTIONAL { ?item wdt:${p.id} ?${p.varName} . }   # ${p.label}`);
            }
        }

        lines.push('  SERVICE wikibase:label { bd:serviceParam wikibase:language "nb,nn,no,en". }');

        let orderBy = 'ORDER BY ?itemLabel';
        if (cfg.sort.by !== 'label') {
            const sortProp = extra.find(p => p.varName === cfg.sort.by);
            const sortVar = sortProp && sortProp.type === 'WikibaseItem'
                ? `?${cfg.sort.by}Label` : `?${cfg.sort.by}`;
            orderBy = `ORDER BY ${cfg.sort.dir}(${sortVar})`;
        }

        const query = `SELECT DISTINCT ${selectVars.join(' ')} WHERE {
${lines.join('\n')}
}
${orderBy}
LIMIT ${cfg.limit}`;

        return { query, extra };
    }

    return { build };
})();
