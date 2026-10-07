/* ══════════════════════════════════════════════
   VYRDEPIL — Framsida byggjer spel/verktøy-grids
   frå json/apps.json (same kjelde som toppmenyen).
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Kor lenge «Nytt»- og «Oppdatert»-merket heng ved før det fell av av seg sjølv. */
  const BADGE_DAYS = 45;

  const HOME_SUMMARIES = Object.freeze({
    duldord: 'Gjet eit nytt nynorsk fembokstavsord på seks forsøk kvar dag.',
    vidfaren: 'Utforsk land med spørsmål om geografi, kart og kjenneteikn.',
    heimsank: 'Løys matteoppgåver, vinn samlekort og bygg samlinga di.',
    reknedaesj: 'Spring, hopp og rekn deg gjennom eit fartfylt mattespel.',
    rettslause_raud: 'Hopp gjennom banar og bruk rekning for å kome vidare.',
    kludre_klodrian: 'Sym gjennom havet og vel porten med rett svar.',
    baretevling: 'Spel slagskip og øv på koordinatar og himmelretningar.',
    frodebrett: 'Lag Jeopardy-brett med eigne kategoriar og poeng.',
    ordaklok: 'Øv på gloser med fire ulike måtar å spele på.',
    tidvis: 'Øv på analoge og digitale klokkeslett.',
    heite_stavrim: 'Finn ord frå bokstavar og kategoriar i lagspel.',
    ordsmia: 'Smi det lengste norske ordet du finn av ni bokstavar.',
    talsmia: 'Bruk seks tal og rekneartar for å nå eit måltal.',
    frodekapp: 'Lag quiz og spel solo medan tevlingstenesta blir sett opp att.',
    bolkestokk: 'Dra kodeblokker på plass og la ei skilpadde teikne.',
    ormritaren: 'Skriv og køyr Python i nettlesaren utan oppsett.',
    bildebehandling: 'Skjer, roter og endre storleik på bilete lokalt.',
    biletflett: 'Lag collagar ved å dra bilete inn i ferdige oppsett.',
    lydskurd: 'Klipp, bland og lagre lydspor på ei tidslinje.',
    rissverk: 'Teikn og set saman eigne logoar, ikon og diagram.',
    klassekart: 'Møbler klasserommet og fordel elevar med drag og slepp.',
    flokkdeilar: 'Trekk tilfeldige grupper og vis dei på storskjerm.',
    eikekveik: 'Bygg idé- og flytkart med greiner og koplingar.',
    ordskodde: 'Lag ei fargerik ordsky av ein tekst.',
    ordkryss: 'Lag kryssord automatisk frå ord og forklaringar.',
    leitekryss: 'Gøym ord i eit bokstavrutenett på skjerm eller ark.',
    vitjingsruta: 'Lag og tilpass QR-kodar for lenkjer, nett og kontaktar.',
    dagsvegen: 'Vis dagsplanen og tel ned pågåande undervisningsøkter.',
    vegamot: 'Bygg interaktive forteljingar med vegval og fleire sluttingar.',
    livslina: 'Følg ein elev gjennom vidaregåande og utforsk korleis skule, arbeid, økonomi og fritid formar kvardagen.'
  });

  function svg(inner, size) {
    return `<svg width="${size}" height="${size}" style="vertical-align:-5px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  }

  /** Talet på dagar sidan ein ISO-dato. Ugyldig dato tel som uendeleg lenge sidan. */
  function daysSince(iso) {
    const then = Date.parse(String(iso) + 'T00:00:00');
    if (isNaN(then)) return Infinity;
    return (Date.now() - then) / 86400000;
  }

  /** «I ustand» vinn over alt, så vinn «Nytt» over «Oppdatert».
      Kjem-snart-korta får elles ikkje merke. */
  function badgeFor(app) {
    if (app.broken) {
      return { text: typeof app.broken === 'string' ? app.broken : 'I ustand', cls: 'card-flag card-flag-broken' };
    }
    if (app.disabled) return null;
    if (daysSince(app.added) <= BADGE_DAYS) return { text: 'Nytt', cls: 'card-flag card-flag-new' };
    if (daysSince(app.updated) <= BADGE_DAYS) return { text: 'Oppdatert', cls: 'card-flag card-flag-updated' };
    return null;
  }

  function card(app, logos) {
    const el = document.createElement(app.disabled ? 'div' : 'a');
    el.className = 'card vp-home-app' + (app.disabled ? ' disabled' : '');
    if (!app.disabled && app.href) el.href = app.href;

    const logo = logos[app.id] || app.img;
    if (logo) {
      const img = document.createElement('img');
      img.src = logo;
      img.alt = '';
      img.width = 160;
      img.height = 160;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'vp-home-app-logo';
      el.appendChild(img);
    } else if (app.icon) {
      const span = document.createElement('span');
      span.className = 'card-icon';
      span.innerHTML = svg(app.icon, 48).replace(' style="vertical-align:-5px;"', '');
      el.appendChild(span);
    }

    const badge = badgeFor(app);
    if (badge) {
      const flag = document.createElement('span');
      flag.className = badge.cls;
      flag.textContent = badge.text;
      el.appendChild(flag);
    }

    const h = document.createElement('h2');
    h.className = 'card-title';
    h.textContent = app.name;
    el.appendChild(h);

    const audience = Array.isArray(app.audience)
      ? app.audience.filter(label => typeof label === 'string' && label.trim())
      : [];
    if (audience.length) {
      const list = document.createElement('ul');
      list.className = 'vp-home-audience';
      list.setAttribute('aria-label', 'Passar for');
      audience.forEach(label => {
        const item = document.createElement('li');
        item.className = 'vp-home-audience-badge';
        item.textContent = label;
        list.appendChild(item);
      });
      el.appendChild(list);
    }

    const summary = HOME_SUMMARIES[app.id] || (app.desc || [])[0];
    if (summary) {
      const p = document.createElement('p');
      p.className = 'card-desc';
      p.textContent = summary;
      el.appendChild(p);
    }

    const tag = document.createElement('span');
    if (app.disabled) {
      tag.className = 'coming-tag';
      tag.textContent = app.comingTag || 'Kjem snart';
    } else {
      tag.className = 'card-btn';
      tag.textContent = app.btn || 'Opne →';
    }
    el.appendChild(tag);
    return el;
  }

  Promise.all([
    fetch('json/apps.json').then(response => {
      if (!response.ok) throw new Error('Appkatalogen kunne ikkje lastast');
      return response.json();
    }),
    window.VyrdepilDesign ? window.VyrdepilDesign.loadRegistry() : Promise.resolve({ logo: { files: {} } })
  ])
    .then(([data, registry]) => {
      const host = document.getElementById('appSections');
      if (!host) return;
      const logos = registry && registry.logo && registry.logo.files || {};
      (data.categories || []).forEach(cat => {
        /* hidden = appen finst framleis, men skal berre nåast med direktelenkje. */
        const apps = (data.apps || []).filter(a => a.cat === cat.id && !a.hidden);
        if (!apps.length) return;

        const sec = document.createElement('section');
        sec.className = 'vp-home-category';

        const ic = document.createElement('span');
        ic.className = 'vp-home-category-icon';
        ic.setAttribute('aria-hidden', 'true');
        ic.innerHTML = svg(cat.icon, 28).replace(' style="vertical-align:-5px;"', '');
        const h2 = document.createElement('h2');
        h2.className = 'vp-heading vp-home-section-heading vp-home-category-heading';
        h2.textContent = cat.label;
        h2.id = 'home-category-' + cat.id;
        h2.prepend(ic);
        sec.setAttribute('aria-labelledby', h2.id);
        sec.appendChild(h2);

        const grid = document.createElement('div');
        grid.className = 'card-grid';
        apps.forEach(a => grid.appendChild(card(a, logos)));
        sec.appendChild(grid);

        host.appendChild(sec);
      });
    })
    .catch(e => console.error('Klarte ikkje laste json/apps.json:', e));
})();
