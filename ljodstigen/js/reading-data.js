/* Leseinnhald frå opptakslista 14. oktober 2026. Heile ord blir lesne
   naturleg; lydgrupper blir ikkje splitta i bokstavlydar. */
(function (root) {
  'use strict';
  root.LjodReading = { LEVELS: [
  {
    "number": 6,
    "title": "Ng-lyden",
    "detail": "To bokstavar, éin lyd",
    "hint": "Høyr korleis ng blir éin lyd i ord som ring og seng.",
    "groups": [
      {"id": "f_ng", "text": "ng"}
    ],
    "items": [
      {"id": "o_ring", "text": "ring", "kind": "word"},
      {"id": "o_ting", "text": "ting", "kind": "word"},
      {"id": "o_seng", "text": "seng", "kind": "word"},
      {"id": "o_lang", "text": "lang", "kind": "word"},
      {"id": "o_tung", "text": "tung", "kind": "word"},
      {"id": "o_song", "text": "song", "kind": "word"},
      {"id": "o_gang", "text": "gang", "kind": "word"},
      {"id": "o_sving", "text": "sving", "kind": "word"},
      {"id": "o_vinge", "text": "vinge", "kind": "word"},
      {"id": "o_mange", "text": "mange", "kind": "word"},
      {"id": "o_tunge", "text": "tunge", "kind": "word"},
      {"id": "o_konge", "text": "konge", "kind": "word"}
    ]
  },
  {
    "number": 7,
    "title": "Enkel og dobbel konsonant",
    "detail": "Kort og lang vokal",
    "hint": "Høyr godt etter: bake og bakke har ulik vokallengd.",
    "groups": [],
    "items": [
      {"id": "o_tak", "text": "tak", "kind": "word", "pair": "takk"},
      {"id": "o_takk", "text": "takk", "kind": "word", "pair": "tak"},
      {"id": "o_bake", "text": "bake", "kind": "word", "pair": "bakke"},
      {"id": "o_bakke", "text": "bakke", "kind": "word", "pair": "bake"},
      {"id": "o_måte", "text": "måte", "kind": "word", "pair": "måtte"},
      {"id": "o_måtte", "text": "måtte", "kind": "word", "pair": "måte"},
      {"id": "o_luke", "text": "luke", "kind": "word", "pair": "lukke"},
      {"id": "o_lukke", "text": "lukke", "kind": "word", "pair": "luke"},
      {"id": "o_pute", "text": "pute", "kind": "word", "pair": "putte"},
      {"id": "o_putte", "text": "putte", "kind": "word", "pair": "pute"},
      {"id": "o_åtte", "text": "åtte", "kind": "word"}
    ]
  },
  {
    "number": 8,
    "title": "Diftongar",
    "detail": "ei · øy · au",
    "hint": "Ein diftong glir frå éin vokallyd til ein annan.",
    "groups": [
      {"id": "f_ei", "text": "ei"},
      {"id": "f_øy", "text": "øy"},
      {"id": "f_au", "text": "au"}
    ],
    "items": [
      {"id": "o_hei", "text": "hei", "kind": "word"},
      {"id": "o_feil", "text": "feil", "kind": "word"},
      {"id": "o_stein", "text": "stein", "kind": "word"},
      {"id": "o_meir", "text": "meir", "kind": "word"},
      {"id": "o_reim", "text": "reim", "kind": "word"},
      {"id": "o_øy", "text": "øy", "kind": "word"},
      {"id": "o_røyk", "text": "røyk", "kind": "word"},
      {"id": "o_høyr", "text": "høyr", "kind": "word"},
      {"id": "o_raud", "text": "raud", "kind": "word"},
      {"id": "o_laus", "text": "laus", "kind": "word"},
      {"id": "o_haust", "text": "haust", "kind": "word"},
      {"id": "o_saum", "text": "saum", "kind": "word"},
      {"id": "o_maur", "text": "maur", "kind": "word"}
    ]
  },
  {
    "number": 9,
    "title": "Sj- og kj-lydar",
    "detail": "sj · skj · sk · kj",
    "hint": "Fleire bokstavar kan stå for éin lyd. Høyr opptaket og følg talemålet ditt.",
    "groups": [
      {"id": "f_sj", "text": "sj"},
      {"id": "f_kj", "text": "kj"}
    ],
    "items": [
      {"id": "o_sjå", "text": "sjå", "kind": "word"},
      {"id": "o_sjø", "text": "sjø", "kind": "word"},
      {"id": "o_sjuk", "text": "sjuk", "kind": "word"},
      {"id": "o_sjuke", "text": "sjuke", "kind": "word"},
      {"id": "o_skjorte", "text": "skjorte", "kind": "word"},
      {"id": "o_skjule", "text": "skjule", "kind": "word"},
      {"id": "o_ski", "text": "ski", "kind": "word"},
      {"id": "o_skinn", "text": "skinn", "kind": "word"},
      {"id": "o_kjole", "text": "kjole", "kind": "word"},
      {"id": "o_kjenne", "text": "kjenne", "kind": "word"},
      {"id": "o_kjøpe", "text": "kjøpe", "kind": "word"},
      {"id": "o_kjøt", "text": "kjøt", "kind": "word"},
      {"id": "o_kjem", "text": "kjem", "kind": "word"}
    ]
  },
  {
    "number": 10,
    "title": "Lange ord og setningar",
    "detail": "Samansette ord, bøying og samanheng",
    "hint": "Les heile ordet eller setninga. Du har god tid.",
    "groups": [],
    "items": [
      {"id": "o_skuleveg", "text": "skuleveg", "kind": "word"},
      {"id": "o_solskin", "text": "solskin", "kind": "word"},
      {"id": "o_venene", "text": "venene", "kind": "word"},
      {"id": "o_hestane", "text": "hestane", "kind": "word"},
      {"id": "o_bøkene", "text": "bøkene", "kind": "word"},
      {"id": "o_leseboka", "text": "leseboka", "kind": "word"},
      {"id": "o_skuleplassen", "text": "skuleplassen", "kind": "word"},
      {"id": "o_sommarferie", "text": "sommarferie", "kind": "word"},
      {"id": "o_fotballaget", "text": "fotballaget", "kind": "word"},
      {"id": "o_familien", "text": "familien", "kind": "word"},
      {"id": "o_hageslange", "text": "hageslange", "kind": "word"},
      {"id": "o_middagstid", "text": "middagstid", "kind": "word"},
      {"id": "s_lesbok", "text": "Eg les ei bok.", "kind": "sentence"},
      {"id": "s_solskin", "text": "Sola skin i dag.", "kind": "sentence"},
      {"id": "s_boker", "text": "Mange bøker ligg i sekken.", "kind": "sentence"},
      {"id": "s_baten", "text": "Den raude båten er lang.", "kind": "sentence"},
      {"id": "s_skule", "text": "Vi går til skulen saman.", "kind": "sentence"},
      {"id": "s_hoyr", "text": "Høyr etter og finn ordet.", "kind": "sentence"}
    ]
  }
] };
})(window);
