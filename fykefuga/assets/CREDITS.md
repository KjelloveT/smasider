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

Dei fire originale sekstentakts satsane er komponerte i `js/score.js`: Marmorfuga, Urverksinvensjon, Spegelmenuett (tretakt) og Tårntoccata. Motiv, imiterande inngangar, motrøyster, basslinjer, ornament og kadensar blir spelte av eigne cembalo-, fiolin-, cello- og orgelklangar i `js/instruments.js`. `js/mixer.js` lagar ein eigen stereoimpuls for romklang og blandar instrumenta med mjuk dynamikkontroll. `js/audio.js` styrer takt, modusskifte, ljodeffektar og demping av musikken ved krasj og rette svar. Ingen musikksamples eller eksterne ljodtenester blir brukte.

Spor, lysband, eksos, støv, ringar og korte animasjonar blir teikna med Canvas 2D i `js/effects.js`. Dei er uavhengige av fysikken og bruker ein eigen tilfeldig generator. Rasterfigurane får strekk ved hopp, samantrekking ved landing og særskild rørsle etter modus. Redusert dekor fjernar partiklar, spor og skjermristing.
