/* ══════════════════════════════════════
   EMOJI.JS — Eigenbygd emoji-veljar med kuratert, skulerelevant utval.
   Ingen flagg-emoji (Segoe UI Emoji på Windows viser dei som bokstavar).
   Dagsvegen har eksplisitt unntak frå emoji-forbodet i AGENTS.md.
   ══════════════════════════════════════ */

const EmojiPicker = (() => {
    const CATEGORIES = [
        { id: 'fag', label: 'Fag og læring', emojis: [
            { e: '📖', n: 'open bok' }, { e: '📚', n: 'bøker' }, { e: '✏️', n: 'blyant' },
            { e: '🖊️', n: 'penn' }, { e: '📝', n: 'notat' }, { e: '➗', n: 'deling' },
            { e: '➕', n: 'pluss' }, { e: '🔢', n: 'tal' }, { e: '📐', n: 'vinkelhake' },
            { e: '📏', n: 'linjal' }, { e: '🔬', n: 'mikroskop' }, { e: '🔭', n: 'teleskop' },
            { e: '🧪', n: 'prøyverøyr' }, { e: '🧲', n: 'magnet' }, { e: '🌍', n: 'jordklode' },
            { e: '🗺️', n: 'kart' }, { e: '🧭', n: 'kompass' }, { e: '🕊️', n: 'due' },
            { e: '🎵', n: 'musikknote' }, { e: '🎨', n: 'målarpalett' }, { e: '🖌️', n: 'målarkost' },
            { e: '🧶', n: 'garn' }, { e: '🪚', n: 'sag' }, { e: '🍳', n: 'steikepanne' },
            { e: '🧑‍🏫', n: 'lærar' }, { e: '🎓', n: 'studenthatt' }, { e: '🫖', n: 'tekanne' },
            { e: '💻', n: 'datamaskin' }, { e: '🤖', n: 'robot' }, { e: '🧠', n: 'hjerne' }
        ]},
        { id: 'aktivitet', label: 'Aktivitet', emojis: [
            { e: '⚽', n: 'fotball' }, { e: '🏀', n: 'basketball' }, { e: '🏐', n: 'volleyball' },
            { e: '🏃', n: 'springande person' }, { e: '🤸', n: 'turnar' }, { e: '🧘', n: 'yoga' },
            { e: '🏊', n: 'symjar' }, { e: '⛷️', n: 'skiløpar' }, { e: '⛸️', n: 'skøyter' },
            { e: '🛷', n: 'kjelke' }, { e: '🚲', n: 'sykkel' }, { e: '🥾', n: 'tursko' },
            { e: '🎲', n: 'terning' }, { e: '🧩', n: 'puslespel' }, { e: '♟️', n: 'sjakk' },
            { e: '🃏', n: 'kort' }, { e: '🎯', n: 'blink' }, { e: '🎭', n: 'teater' },
            { e: '🎬', n: 'film' }, { e: '🎤', n: 'mikrofon' }, { e: '🥁', n: 'tromme' },
            { e: '🎸', n: 'gitar' }, { e: '🎹', n: 'piano' }, { e: '🪁', n: 'drake' },
            { e: '🤾', n: 'handball' }, { e: '🏓', n: 'bordtennis' }
        ]},
        { id: 'mat', label: 'Mat', emojis: [
            { e: '🥪', n: 'matpakke' }, { e: '🍎', n: 'eple' }, { e: '🍐', n: 'pære' },
            { e: '🍌', n: 'banan' }, { e: '🥕', n: 'gulrot' }, { e: '🥛', n: 'mjølk' },
            { e: '🧃', n: 'juskartong' }, { e: '🍞', n: 'brød' }, { e: '🥣', n: 'graut' },
            { e: '🍲', n: 'gryte' }, { e: '🍕', n: 'pizza' }, { e: '🌮', n: 'taco' },
            { e: '🍿', n: 'popkorn' }, { e: '🎂', n: 'kake' }, { e: '🍪', n: 'kjeks' },
            { e: '🍓', n: 'jordbær' }, { e: '🫐', n: 'blåbær' }, { e: '🍉', n: 'vassmelon' }
        ]},
        { id: 'natur', label: 'Natur og vêr', emojis: [
            { e: '🌳', n: 'tre' }, { e: '🌲', n: 'grantre' }, { e: '🌱', n: 'spire' },
            { e: '🌸', n: 'blome' }, { e: '🍂', n: 'haustlauv' }, { e: '🍄', n: 'sopp' },
            { e: '☀️', n: 'sol' }, { e: '⛅', n: 'sol bak sky' }, { e: '☁️', n: 'sky' },
            { e: '🌧️', n: 'regn' }, { e: '⛈️', n: 'torevêr' }, { e: '❄️', n: 'snøfnugg' },
            { e: '⛄', n: 'snømann' }, { e: '🌈', n: 'regnboge' }, { e: '🌙', n: 'måne' },
            { e: '⭐', n: 'stjerne' }, { e: '🔥', n: 'bål' }, { e: '🌊', n: 'bylgje' },
            { e: '🐦', n: 'fugl' }, { e: '🦋', n: 'sommarfugl' }, { e: '🐞', n: 'marihøne' },
            { e: '🐟', n: 'fisk' }, { e: '🐑', n: 'sau' }, { e: '🦊', n: 'rev' },
            { e: '🐻', n: 'bjørn' }, { e: '🫎', n: 'elg' }
        ]},
        { id: 'kjensler', label: 'Kjensler', emojis: [
            { e: '😀', n: 'glad' }, { e: '😄', n: 'leande' }, { e: '🥳', n: 'feirande' },
            { e: '😌', n: 'roleg' }, { e: '🤔', n: 'tenkjande' }, { e: '😮', n: 'overraska' },
            { e: '😴', n: 'trøytt' }, { e: '🤫', n: 'hyss' }, { e: '😢', n: 'lei seg' },
            { e: '😠', n: 'sint' }, { e: '😱', n: 'redd' }, { e: '🤗', n: 'klem' },
            { e: '👍', n: 'tommel opp' }, { e: '👏', n: 'klappande hender' }, { e: '💪', n: 'sterk arm' },
            { e: '❤️', n: 'hjarte' }, { e: '🤝', n: 'handtrykk' }, { e: '🙌', n: 'hender i vêret' }
        ]},
        { id: 'symbol', label: 'Symbol', emojis: [
            { e: '⏰', n: 'vekkjarklokke' }, { e: '⏳', n: 'timeglas' }, { e: '🕐', n: 'klokke' },
            { e: '📅', n: 'kalender' }, { e: '✅', n: 'hake' }, { e: '❌', n: 'kryss' },
            { e: '❓', n: 'spørjeteikn' }, { e: '❗', n: 'ropeteikn' }, { e: '💡', n: 'lyspære' },
            { e: '🔔', n: 'bjølle' }, { e: '🔇', n: 'lyd av' }, { e: '🔍', n: 'forstørringsglas' },
            { e: '🎉', n: 'konfetti' }, { e: '🎈', n: 'ballong' }, { e: '🎁', n: 'gåve' },
            { e: '🏆', n: 'pokal' }, { e: '🥇', n: 'gullmedalje' }, { e: '🚌', n: 'buss' },
            { e: '🏫', n: 'skule' }, { e: '🏠', n: 'hus' }, { e: '🧦', n: 'sokk' },
            { e: '🧤', n: 'vottar' }, { e: '🧢', n: 'caps' }, { e: '🎒', n: 'skulesekk' },
            { e: '✂️', n: 'saks' }, { e: '🧮', n: 'kuleramme' }
        ]}
    ];

    let overlay = null;
    let gridEl = null;
    let onSelectCb = null;
    let activeCat = CATEGORIES[0].id;

    function build() {
        const tabs = Dom.el('div', { class: 'dv-emoji-tabs', role: 'tablist' });
        gridEl = Dom.el('div', { class: 'dv-emoji-grid' });

        CATEGORIES.forEach(cat => {
            tabs.appendChild(Dom.el('button', {
                class: 'dv-emoji-tab' + (cat.id === activeCat ? ' active' : ''),
                role: 'tab',
                text: cat.label,
                dataset: { cat: cat.id },
                onclick: () => {
                    activeCat = cat.id;
                    tabs.querySelectorAll('.dv-emoji-tab').forEach(b =>
                        b.classList.toggle('active', b.dataset.cat === cat.id));
                    renderGrid();
                }
            }));
        });

        const modal = Dom.el('div', { class: 'modal3 dv-emoji-modal' },
            Dom.el('div', { class: 'modal-header' },
                Dom.el('span', { text: 'Vel emoji' }),
                Dom.el('button', { class: 'dv-icon-btn dv-modal-x', 'aria-label': 'Lukk', onclick: close }, Icons.create('x'))
            ),
            Dom.el('div', { class: 'modal-body' }, tabs, gridEl)
        );
        overlay = Dom.el('div', { class: 'modal-overlay', onclick: (ev) => { if (ev.target === overlay) close(); } }, modal);
        document.body.appendChild(overlay);
        renderGrid();
    }

    function renderGrid() {
        Dom.clear(gridEl);
        const cat = CATEGORIES.find(c => c.id === activeCat);
        cat.emojis.forEach(item => {
            gridEl.appendChild(Dom.el('button', {
                class: 'dv-emoji-btn',
                'aria-label': item.n,
                text: item.e,
                onclick: () => {
                    const cb = onSelectCb;
                    close();
                    if (cb) cb(item.e);
                }
            }));
        });
    }

    function open(onSelect) {
        onSelectCb = onSelect;
        if (!overlay) build();
        overlay.classList.add('open');
        const first = gridEl.querySelector('.dv-emoji-btn');
        if (first) first.focus();
    }

    function close() {
        if (overlay) overlay.classList.remove('open');
        onSelectCb = null;
    }

    function isOpen() { return overlay && overlay.classList.contains('open'); }

    return { open, close, isOpen };
})();
