# Originale Fykefuga-ressursar

Alle bileta er genererte særskilt for spelet med imagegen 10. oktober 2026. Ingen bilete, lydopptak, fontar eller modellar er henta frå tredjepartar. Ingen SVG er brukt til spelgrafikken eller barokkdekor. Generert biletekst blir ikkje brukt; alle spørsmål og svar er ekte HTML-tekst.

- **Figurar:** eit gjennomsiktig ark med åtte kolonnar og tre familiar: forgylte urverk med blå detaljar, kvitt porselen med koboltdekor og patinert kopar. Motiva er terning, luftskip, sveveklokke, svingfarkost, rullekule, bølgje, urverksløpar og spinneverk. Silhuettane er skorne ut som heile objekt og komprimerte til palett-PNG. `sprites.png` samlar alle 24 figurane.
- **Marmorsalen:** ein lys marmorsal med forgylte søyler, bogar, lysekroner og blå brokade.
- **Urverkhagen:** ein formell hage med topiar, marmorbogar, astronomiske ur og forgylte tannhjul.
- **Spegelgalleriet:** høge forgylte speglar, blå brokade og ljos marmor.
- **Orgeltårnet:** messingpiper, treskurd, høge vindauge og kremfarga stein.
- **Spelplan og mellomgrunn:** eit gjennomsiktig 3 × 3-ark med pigger, marmorkloss, klokkestolpe, golvflis, akantusornament, søyle, hagebog, spegel og orgelpiper. Bileta er skorne ut og palettkomprimerte. Fire eigne mellomgrunnslag gir ulik djupne i miljøa.
- **Applogo:** eit måla, forgylta luftskip i ein akantusring med porselensdetaljar og blågrønt band, utan tekst.

Originalane ligg lokalt i ignorerte `_kjelder/`-mapper. Bakgrunnar er JPEG i kvalitet 82, høgst 1920 pikslar. Logoen er høgst 384 pikslar og 128 fargar. Alle publiserte bilete er mindre enn 500 kB. Heile banken har om lag 1,9 MiB.

Dei fire originale sekstentakts satsane er komponerte i `js/score.js`: Marmorfuga, Urverksinvensjon, Spegelmenuett (tretakt) og Tårntoccata. Fiolin- og cellogruppene fører melodien med overlappande bogefrasar og tre litt ulikt stemde røyster. `assets/audio/` inneheld åtte eigne, syntetiserte PCM-klangar (16 bit, mono, 22 050 Hz), om lag 965 KiB totalt, med harmoniske partialar, kroppsresonansar, bogestøy og vibrato. Parameter og genereringskjelde blir tekne vare på lokalt i `_kjelder/fykefuga-implementation/compose-strings.py`. Lydane er ikkje tredjepartssamples eller opptak av verkelege instrument. `js/strings.js` lastar dei lokale lydane før start; `js/instruments.js` handterer register, artikulasjon og røyster. Cembalo og orgel bruker eigne bølgjeformer. `js/mixer.js` lagar ein eigen stereoimpuls for romklang og blandar instrumenta med mjuk dynamikkontroll. `js/audio.js` styrer takt, modusskifte, ljodeffektar og demping av musikken ved krasj og rette svar. Ingen eksterne ljodtenester blir brukte.

Alle 24 figurane er isolerte frå nabomotiv, skalerte med bevart sideforhold og sentrerte i 96 × 96-celler med minst åtte pikslar luft. Spor bruker eit avsmalnande lysband utan figurkopiar. Framdriftsflammar, røyk, sveveringar, elektrisk teletransport, mekaniske bein, hoppstøv, metallglimt, sjokkbølgjer og animasjonar blir teikna med Canvas 2D i `js/effects.js`. Dei er uavhengige av fysikken og bruker ein eigen tilfeldig generator, med høgst 220 partiklar. Redusert dekor fjernar partiklar, spor og skjermristing.
