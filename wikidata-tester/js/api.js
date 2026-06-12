/* api.js — kommunikasjon med Wikidata (søk + SPARQL) */
const WdApi = (() => {
    const SPARQL_URL = 'https://query.wikidata.org/sparql';
    const SEARCH_URL = 'https://www.wikidata.org/w/api.php';

    /**
     * Free-text entity search via wbsearchentities.
     * type: 'item' or 'property'. Tries Norwegian first, falls back to English.
     */
    async function searchEntities(term, type = 'item') {
        const langs = ['nb', 'en'];
        for (const lang of langs) {
            const params = new URLSearchParams({
                action: 'wbsearchentities',
                search: term,
                language: lang,
                uselang: 'nb',
                type,
                limit: '10',
                format: 'json',
                origin: '*'
            });
            const res = await fetch(`${SEARCH_URL}?${params}`);
            if (!res.ok) throw new Error(`Søket feila (HTTP ${res.status})`);
            const data = await res.json();
            if (data.search && data.search.length > 0) {
                return data.search.map(e => ({
                    id: e.id,
                    label: e.label || e.id,
                    description: e.description || ''
                }));
            }
        }
        return [];
    }

    /** Run a SPARQL query against WDQS, return parsed JSON. */
    async function runSparql(query) {
        const res = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`, {
            headers: { 'Accept': 'application/sparql-results+json' }
        });
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            if (res.status === 429) msg = 'For mange førespurnader — vent litt og prøv igjen.';
            if (res.status === 500) msg = 'Spørjinga var truleg for tung for Wikidata (tidsavbrot). Prøv utan undertypar, eller med strengare filter.';
            throw new Error(msg);
        }
        return res.json();
    }

    /**
     * Find which properties actually exist on items of the chosen topic,
     * with counts from a sample — used to suggest filters and extra columns.
     */
    async function suggestProperties(topicId, includeSubclasses) {
        const path = includeSubclasses ? 'wdt:P31/wdt:P279*' : 'wdt:P31';
        // To steg, elles blir spørjinga for tung for WDQS (60 s tidsavbrot):
        // 1) tel eigenskapane i ei lita stikkprøve — optimizer-hinten tvingar
        //    Blazegraph til å starte med stikkprøva i staden for heile databasen
        const countQuery = `SELECT ?claim (COUNT(DISTINCT ?item) AS ?cnt) WHERE {
  hint:Query hint:optimizer "None" .
  { SELECT DISTINCT ?item WHERE { ?item ${path} wd:${topicId} . } LIMIT 200 }
  ?item ?claim ?val .
  FILTER(STRSTARTS(STR(?claim), "http://www.wikidata.org/prop/direct/"))
}
GROUP BY ?claim
ORDER BY DESC(?cnt)
LIMIT 60`;
        const countData = await runSparql(countQuery);
        const counts = new Map();
        for (const b of countData.results.bindings) {
            counts.set(b.claim.value, parseInt(b.cnt.value, 10));
        }
        if (counts.size === 0) return [];

        // 2) hent namn og datatype berre for dei eigenskapane vi fann
        const claimList = [...counts.keys()].map(u => `<${u}>`).join(' ');
        const metaQuery = `SELECT ?claim ?p ?pLabel ?ptype WHERE {
  VALUES ?claim { ${claimList} }
  ?p wikibase:directClaim ?claim ;
     wikibase:propertyType ?ptype .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "nb,nn,no,en". }
}`;
        const metaData = await runSparql(metaQuery);

        const USEFUL_TYPES = new Set(['WikibaseItem', 'Quantity', 'Time', 'String', 'Monolingualtext']);
        const SKIP = new Set(['P31', 'P279', 'P361', 'P910', 'P373', 'P1424', 'P18', 'P935', 'P528', 'P443', 'P1472', 'P1889', 'P460']);
        return metaData.results.bindings
            .map(b => ({
                id: b.p.value.split('/').pop(),
                label: b.pLabel ? b.pLabel.value : b.p.value.split('/').pop(),
                type: b.ptype.value.split('#').pop(),
                count: counts.get(b.claim.value) || 0
            }))
            .filter(p => USEFUL_TYPES.has(p.type) && !SKIP.has(p.id))
            .sort((a, b) => b.count - a.count)
            .slice(0, 30);
    }

    return { searchEntities, runSparql, suggestProperties };
})();
