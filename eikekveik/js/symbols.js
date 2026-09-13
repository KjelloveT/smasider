// Eikekveik — Symbol til nodane: kuraterte emoji og Lucide-ikon
//
// Eikekveik har eksplisitt unntak frå emoji-forbodet i AGENTS.md (§3.2),
// men berre for innhaldet i kartet. Knappar og verktøylinjer brukar Lucide.
// Ingen flagg-emoji: Segoe UI Emoji på Windows viser dei som to bokstavar.
// Ingen ZWJ-samansette emoji heller, av same grunn på eldre system.

Eikekveik.Symbols = (function () {
    const EMOJI = [
        { id: 'skule', label: 'Skule', emojis: [
            { e: '📚', n: 'bøker' }, { e: '📖', n: 'open bok' }, { e: '✏️', n: 'blyant' },
            { e: '📝', n: 'notat' }, { e: '📐', n: 'vinkelhake' }, { e: '📏', n: 'linjal' },
            { e: '🔬', n: 'mikroskop' }, { e: '🔭', n: 'teleskop' }, { e: '🧪', n: 'prøverøyr' },
            { e: '🧲', n: 'magnet' }, { e: '🌍', n: 'jordklode' }, { e: '🗺️', n: 'kart' },
            { e: '🧭', n: 'kompass' }, { e: '🎵', n: 'musikk' }, { e: '🎨', n: 'målarpalett' },
            { e: '💻', n: 'datamaskin' }, { e: '🤖', n: 'robot' }, { e: '🧠', n: 'hjerne' },
            { e: '🏫', n: 'skule' }, { e: '🎓', n: 'studenthatt' }, { e: '🧮', n: 'kuleramme' },
            { e: '➗', n: 'deling' }, { e: '🔢', n: 'tal' }, { e: '📊', n: 'stolpediagram' },
            { e: '📈', n: 'graf' }, { e: '🗂️', n: 'kartotek' }, { e: '📌', n: 'teiknestift' },
            { e: '📎', n: 'binders' }
        ]},
        { id: 'natur', label: 'Natur', emojis: [
            { e: '🌳', n: 'lauvtre' }, { e: '🌲', n: 'grantre' }, { e: '🌱', n: 'spire' },
            { e: '🌸', n: 'blome' }, { e: '🍂', n: 'haustlauv' }, { e: '🍄', n: 'sopp' },
            { e: '☀️', n: 'sol' }, { e: '☁️', n: 'sky' }, { e: '🌧️', n: 'regn' },
            { e: '❄️', n: 'snøfnugg' }, { e: '🌈', n: 'regnboge' }, { e: '🌙', n: 'måne' },
            { e: '🔥', n: 'eld' }, { e: '🌊', n: 'bølgje' }, { e: '💧', n: 'drope' },
            { e: '🐦', n: 'fugl' }, { e: '🦋', n: 'sommarfugl' }, { e: '🐞', n: 'marihøne' },
            { e: '🐝', n: 'bie' }, { e: '🐟', n: 'fisk' }, { e: '🐑', n: 'sau' },
            { e: '🦊', n: 'rev' }, { e: '🐻', n: 'bjørn' }, { e: '🫎', n: 'elg' },
            { e: '🌾', n: 'korn' }, { e: '🍎', n: 'eple' }, { e: '🥕', n: 'gulrot' }
        ]},
        { id: 'folk', label: 'Folk', emojis: [
            { e: '😀', n: 'glad' }, { e: '😄', n: 'leande' }, { e: '🥳', n: 'feirande' },
            { e: '😌', n: 'roleg' }, { e: '🤔', n: 'tenkjande' }, { e: '😮', n: 'overraska' },
            { e: '😴', n: 'trøytt' }, { e: '😢', n: 'lei seg' }, { e: '😠', n: 'sint' },
            { e: '😱', n: 'redd' }, { e: '🤗', n: 'klem' }, { e: '👍', n: 'tommel opp' },
            { e: '👎', n: 'tommel ned' }, { e: '👏', n: 'klappande hender' }, { e: '💪', n: 'sterk' },
            { e: '❤️', n: 'hjarte' }, { e: '🤝', n: 'handtrykk' }, { e: '🙌', n: 'hender i vêret' },
            { e: '👀', n: 'auge' }, { e: '🗣️', n: 'snakkar' }, { e: '👥', n: 'gruppe' }
        ]},
        { id: 'symbol', label: 'Symbol', emojis: [
            { e: '💡', n: 'idé lyspære' }, { e: '❓', n: 'spørsmål' }, { e: '❗', n: 'viktig ropeteikn' },
            { e: '✅', n: 'hake ferdig' }, { e: '❌', n: 'kryss feil' }, { e: '⚠️', n: 'åtvaring' },
            { e: '🔍', n: 'søk forstørringsglas' }, { e: '🎯', n: 'mål blink' }, { e: '🏆', n: 'pokal' },
            { e: '⭐', n: 'stjerne' }, { e: '🔑', n: 'nøkkel' }, { e: '🔒', n: 'lås' },
            { e: '⏰', n: 'vekkjarklokke' }, { e: '⏳', n: 'timeglas' }, { e: '📅', n: 'kalender' },
            { e: '🎉', n: 'feiring konfetti' }, { e: '🚀', n: 'rakett' }, { e: '🧩', n: 'puslespel' },
            { e: '⚙️', n: 'tannhjul' }, { e: '🔗', n: 'lenkje' }, { e: '➡️', n: 'pil høgre' },
            { e: '⬅️', n: 'pil venstre' }, { e: '⬆️', n: 'pil opp' }, { e: '⬇️', n: 'pil ned' },
            { e: '🔄', n: 'syklus' }, { e: '💬', n: 'snakkeboble' }, { e: '💭', n: 'tankeboble' },
            { e: '🏠', n: 'hus heim' }, { e: '💰', n: 'pengar' }
        ]}
    ];

    // Namna er nøklar i js/vyrdepil-icons.js. Berre ikon som gjev meining
    // som innhald i eit kart — ikkje UI-ikon som «grip» eller «chevR».
    const ICONS = [
        { id: 'lightbulb', n: 'lyspære idé' }, { id: 'brain', n: 'hjerne' },
        { id: 'book', n: 'bok' }, { id: 'bookOpen', n: 'open bok' },
        { id: 'graduationCap', n: 'studenthatt' }, { id: 'microscope', n: 'mikroskop' },
        { id: 'globe', n: 'jordklode' }, { id: 'map', n: 'kart' },
        { id: 'mapPin', n: 'kartnål stad' }, { id: 'compass', n: 'kompass' },
        { id: 'calendar', n: 'kalender' }, { id: 'clock', n: 'klokke tid' },
        { id: 'hourglass', n: 'timeglas' }, { id: 'target', n: 'blink mål' },
        { id: 'flag', n: 'flagg' }, { id: 'star', n: 'stjerne' },
        { id: 'heart', n: 'hjarte' }, { id: 'award', n: 'utmerking' },
        { id: 'medal', n: 'medalje' }, { id: 'crown', n: 'krone' },
        { id: 'gem', n: 'edelstein' }, { id: 'key', n: 'nøkkel' },
        { id: 'lock', n: 'lås' }, { id: 'shield', n: 'skjold' },
        { id: 'alertTriangle', n: 'åtvaring' }, { id: 'helpCircle', n: 'spørsmål' },
        { id: 'check', n: 'hake' }, { id: 'x', n: 'kryss' },
        { id: 'plus', n: 'pluss' }, { id: 'minus', n: 'minus' },
        { id: 'arrowRight', n: 'pil høgre' }, { id: 'arrowLeft', n: 'pil venstre' },
        { id: 'arrowLeftRight', n: 'pil begge vegar' }, { id: 'refreshCw', n: 'syklus' },
        { id: 'shuffle', n: 'stokk' }, { id: 'link', n: 'lenkje' },
        { id: 'messageSquare', n: 'snakkeboble' }, { id: 'mail', n: 'brev e-post' },
        { id: 'phone', n: 'telefon' }, { id: 'users', n: 'gruppe folk' },
        { id: 'userPlus', n: 'ny person' }, { id: 'home', n: 'hus heim' },
        { id: 'building', n: 'bygning' }, { id: 'landmark', n: 'institusjon' },
        { id: 'monitor', n: 'skjerm' }, { id: 'camera', n: 'kamera' },
        { id: 'image', n: 'bilete' }, { id: 'music', n: 'musikk' },
        { id: 'mic', n: 'mikrofon' }, { id: 'palette', n: 'palett' },
        { id: 'brush', n: 'pensel' }, { id: 'pencil', n: 'blyant' },
        { id: 'scissors', n: 'saks' }, { id: 'package', n: 'pakke' },
        { id: 'gift', n: 'gåve' }, { id: 'coins', n: 'pengar myntar' },
        { id: 'rocket', n: 'rakett' }, { id: 'plane', n: 'fly' },
        { id: 'sailboat', n: 'seglbåt' }, { id: 'footprints', n: 'fotspor' },
        { id: 'mountain', n: 'fjell' }, { id: 'treeDeciduous', n: 'lauvtre' },
        { id: 'treePine', n: 'grantre' }, { id: 'leaf', n: 'blad' },
        { id: 'flower2', n: 'blome' }, { id: 'sun', n: 'sol' },
        { id: 'moon', n: 'måne' }, { id: 'cloud', n: 'sky' },
        { id: 'cloudSun', n: 'sol og sky' }, { id: 'snowflake', n: 'snøfnugg' },
        { id: 'droplets', n: 'dropar vatn' }, { id: 'flame', n: 'flamme eld' },
        { id: 'zap', n: 'lyn straum' }, { id: 'waves', n: 'bølgjer' },
        { id: 'wheat', n: 'korn' }, { id: 'apple', n: 'eple' },
        { id: 'fish', n: 'fisk' }, { id: 'bird', n: 'fugl' },
        { id: 'rabbit', n: 'kanin' }, { id: 'egg', n: 'egg' },
        { id: 'tent', n: 'telt' }, { id: 'umbrella', n: 'paraply' },
        { id: 'sparkles', n: 'gnistar' }, { id: 'layers', n: 'lag' },
        { id: 'list', n: 'liste' }, { id: 'search', n: 'søk' },
        { id: 'eye', n: 'auge' }, { id: 'settings', n: 'innstillingar tannhjul' },
        { id: 'stickyNote', n: 'lapp' }, { id: 'folder', n: 'mappe' },
        { id: 'trafficLight', n: 'trafikklys' }, { id: 'play', n: 'start spel av' },
        { id: 'pause', n: 'pause' }, { id: 'stop', n: 'stopp' }
    ].filter(i => window.VyrdepilIcons && VyrdepilIcons.has(i.id));

    const EMOJI_SET = new Set(EMOJI.flatMap(c => c.emojis.map(x => x.e)));

    // Godtek berre symbol frå listene over. Eit importert kart kan
    // innehalde kva som helst, og då er ei kvitliste enklare å stole på
    // enn å prøve å avgjere kva som er ein «ekte» emoji.
    function clean(icon) {
        if (!icon || typeof icon !== 'object') return null;
        if (icon.type === 'emoji' && EMOJI_SET.has(icon.value)) {
            return { type: 'emoji', value: icon.value };
        }
        if (icon.type === 'icon' && window.VyrdepilIcons && VyrdepilIcons.has(icon.value)) {
            return { type: 'icon', value: icon.value };
        }
        return null;
    }

    return { EMOJI, ICONS, clean };
})();
