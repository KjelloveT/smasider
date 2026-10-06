/* Livslina — ui-setup.js
 * Start-skjerm og 4-stegs oppstartswizard (karakter, familie, linje, busituasjon).
 */
window.LL = window.LL || {};

LL.uiSetup = (function () {
  'use strict';

  let stepIndex = 0;
  const STEPS = ['character', 'family', 'line', 'housing'];

  // ── Start-skjerm ──
  function renderStart() {
    const cont = document.getElementById('startContinue');
    if (cont) cont.hidden = !LL.storage.hasActive();
  }

  function showInfo() {
    const base = LL.data.getBase();
    const body = document.getElementById('infoModalBody');
    body.textContent = '';
    const p = document.createElement('p');
    p.textContent = base.priceLevelNote;
    body.appendChild(p);
    const ul = document.createElement('ul');
    ul.style.marginTop = '0.75rem';
    Object.values(base.sources).forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.name;
      ul.appendChild(li);
    });
    body.appendChild(ul);
    LL.main.openModal('infoModal');
  }

  // ── Wizard-oppstart ──
  function startWizard() {
    LL.state.newGame({});
    stepIndex = 0;
    LL.main.showScreen('screen-setup');
    renderStep();
  }

  function renderSteps() {
    const wrap = document.getElementById('wizardSteps');
    const labels = ['Figur', 'Familie', 'Linje', 'Bustad'];
    wrap.textContent = '';
    labels.forEach((lbl, i) => {
      const d = document.createElement('div');
      d.className = 'vp-panel vp-panel--plain ll-wstep' + (i === stepIndex ? ' active' : (i < stepIndex ? ' done' : ''));
      d.textContent = (i + 1) + '. ' + lbl;
      wrap.appendChild(d);
    });
  }

  function renderStep() {
    renderSteps();
    document.querySelectorAll('.ll-wizard-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('wpanel-' + STEPS[stepIndex]);
    panel.classList.add('active');

    if (STEPS[stepIndex] === 'character') renderCharacter();
    if (STEPS[stepIndex] === 'family') renderFamily();
    if (STEPS[stepIndex] === 'line') renderLine();
    if (STEPS[stepIndex] === 'housing') renderHousing();

    updateNav();
  }

  function updateNav() {
    const back = document.getElementById('wizBack');
    const next = document.getElementById('wizNext');
    back.disabled = stepIndex === 0;
    const s = LL.state.get();
    let ready = true;
    if (STEPS[stepIndex] === 'line') ready = !!s.program &&
      (s.program.type !== 'yrkesfag' || s.trainingRoute === 'school' || s.trainingRoute === 'apprenticeship');
    if (STEPS[stepIndex] === 'housing') ready = !!s.housing;
    next.disabled = !ready;
    next.innerHTML = stepIndex === STEPS.length - 1
      ? 'Start livsline <span data-icon="play"></span>'
      : 'Neste <span data-icon="arrowRight"></span>';
    LL.util.hydrate(next);
  }

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      renderStep();
    } else {
      finish();
    }
  }
  function goBack() {
    if (stepIndex > 0) { stepIndex--; renderStep(); }
  }

  // ── Steg 1: lagdelt karakterbyggjar ──
  const CHARACTER_FAMILIES = {
    skin: { label: 'Hudtone', tab: 'Hud' },
    face: { label: 'Andletsuttrykk', tab: 'Andlet' },
    hair: { label: 'Frisyre', tab: 'Hår' },
    clothes: { label: 'Klede', tab: 'Klede' }
  };
  let activeCharacterFamily = 'skin';

  function refreshCharacter(refreshOptions) {
    const stage = document.getElementById('dollStage');
    const character = LL.state.get().character;
    stage.replaceChildren(LL.artCharacter.createCanvas(character, {
      className: 'll-character-canvas ll-character-canvas--main',
      label: LL.artCharacter.summary(character), width: 256, height: 384
    }));
    if (refreshOptions !== false) renderCharacterOptions();
  }

  function renderCharacter() {
    selectCharacterFamily(activeCharacterFamily);
    refreshCharacter(false);
  }

  function selectCharacterFamily(family) {
    if (!CHARACTER_FAMILIES[family]) return;
    activeCharacterFamily = family;
    document.querySelectorAll('#characterTabs [data-family]').forEach(tab => {
      const selected = tab.dataset.family === family;
      tab.setAttribute('aria-selected', String(selected));
      tab.classList.toggle('vp-button--selected', selected);
      if (selected) document.getElementById('characterOptions').setAttribute('aria-labelledby', tab.id);
    });
    const info = CHARACTER_FAMILIES[family];
    document.getElementById('characterFamilyLabel').textContent = 'Vel ' + info.label.toLowerCase();
    const options = document.getElementById('characterOptions');
    options.setAttribute('aria-label', 'Val for ' + info.label.toLowerCase());
    renderCharacterOptions();
  }

  function renderCharacterOptions() {
    const family = activeCharacterFamily;
    const options = document.getElementById('characterOptions');
    if (!options || !LL.artCharacter.ready()) return;
    options.textContent = '';
    const character = LL.state.get().character;
    LL.artCharacter.labels[family].forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vp-button vp-button--quiet ll-character-option';
      button.setAttribute('aria-pressed', String(Number(character[family]) === index));
      button.setAttribute('aria-label', CHARACTER_FAMILIES[family].label + ': ' + label);
      const previewCharacter = Object.assign({}, character, { [family]: index });
      const thumb = LL.artCharacter.createCanvas(previewCharacter, {
        className: 'll-character-thumb', label: '', width: 256, height: 384
      });
      thumb.setAttribute('aria-hidden', 'true');
      const frame = document.createElement('span');
      frame.className = 'll-character-thumb-frame ll-character-thumb-frame--' + family;
      frame.setAttribute('aria-hidden', 'true');
      frame.appendChild(thumb);
      button.appendChild(frame);
      button.addEventListener('click', () => {
        LL.state.get().character[family] = index;
        refreshCharacter();
      });
      options.appendChild(button);
    });
  }

  function randomCharacter() {
    const character = LL.state.get().character;
    Object.keys(CHARACTER_FAMILIES).forEach(family => {
      character[family] = LL.state.drawInt(0, LL.artCharacter.labels[family].length - 1);
    });
    refreshCharacter();
  }

  // ── Steg 2: familie (trekt) ──
  function renderFamily() {
    const s = LL.state.get();
    if (!s.family) drawFamily();
    else showFamilyCard();
  }

  function drawFamily() {
    const ids = LL.data.familyProfileIds();
    const id = LL.state.drawPick(ids);
    const prof = LL.data.familyProfile(id);
    LL.state.get().family = Object.assign({ id }, prof);
    showFamilyCard();
  }

  function showFamilyCard() {
    const s = LL.state.get();
    const f = s.family;
    const card = document.getElementById('familyCard');
    card.textContent = '';
    const h = document.createElement('h3');
    h.textContent = f.label;
    card.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'll-family-facts';
    const rows = [
      ['Startkapital (sparte gåvepengar)', kr(f.startCapital)],
      ['Lommepengar (om du bur heime)', kr(f.allowancePerMonth) + '/mnd'],
      ['Foreldrebidrag (om du bur på hybel)', kr(f.parentContributionHybelPerMonth) + '/mnd'],
      ['Inntektsavhengig stipend', f.incomeDependentGrant === 'none' ? 'Nei (for høg familieinntekt)' : 'Ja, full sats']
    ];
    rows.forEach(([k, v]) => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = k;
      const b = document.createElement('strong'); b.textContent = v; b.style.float = 'right';
      li.append(a, b);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    // startkapital settast på konto med det same
    s.stats.money = f.startCapital;
    s.lowestBalance = null;
    s.wentNegative = false;
    s.creditRestriction = false;
    LL.state.recordBalance(s);
  }

  // ── Steg 3: linje ──
  function renderLine() {
    const grid = document.getElementById('lineGrid');
    grid.textContent = '';
    const state = LL.state.get();
    const chosen = state.program;
    LL.data.getPrograms().forEach(p => {
      const hybelChance = Math.max(0, Math.min(1, Number(p.hybelChance) || 0));
      const hybelAvailable = LL.state.draw() < hybelChance;
      const availability = { nearbySchool: !hybelAvailable, hybelAvailable };
      if (chosen && chosen.id === p.id) {
        Object.assign(chosen, availability);
        state.hybelAvailable = hybelAvailable;
        state.housing = 'heime';
      }

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'vp-button vp-button--quiet ll-line-card';
      card.dataset.programId = p.id;
      card.setAttribute('aria-pressed', String(chosen && chosen.id === p.id));

      const illustration = LL.artProgram.create(p.id);
      const type = document.createElement('span');
      type.className = 'll-line-type ' + (p.type === 'yrkesfag' ? 'll-line-type--vocational' : 'll-line-type--study');
      type.textContent = p.type === 'yrkesfag' ? 'Yrkesfag' : 'Studieførebuande';
      const h = document.createElement('h4'); h.textContent = p.name;
      h.className = 'll-line-name';
      const nearbyPercent = Math.round((1 - hybelChance) * 100);
      const hybelPercent = Math.round(hybelChance * 100);
      const locationFacts = document.createElement('span');
      locationFacts.className = 'll-line-facts';
      locationFacts.setAttribute('aria-label', 'Sjansar og utfall for nærskule og hybel i denne runden');
      const nearby = document.createElement('span');
      nearby.className = 'll-line-fact';
      const nearbyLabel = document.createElement('span');
      nearbyLabel.className = 'll-line-fact-label';
      nearbyLabel.textContent = 'Sjanse for nærskule';
      const nearbyValue = document.createElement('strong');
      nearbyValue.textContent = nearbyPercent + ' %';
      const nearbyResult = document.createElement('span');
      nearbyResult.className = 'll-line-fact-result';
      nearbyResult.textContent = availability.nearbySchool ? 'Ja denne runden' : 'Nei denne runden';
      nearby.append(nearbyLabel, nearbyValue, nearbyResult);
      const housing = document.createElement('span');
      housing.className = 'll-line-fact';
      const housingLabel = document.createElement('span');
      housingLabel.className = 'll-line-fact-label';
      housingLabel.textContent = 'Sjanse for hybel';
      const housingValue = document.createElement('strong');
      housingValue.textContent = hybelPercent + ' %';
      const housingResult = document.createElement('span');
      housingResult.className = 'll-line-fact-result';
      housingResult.textContent = availability.hybelAvailable ? 'Valfritt denne runden' : 'Ikkje naudsynt';
      housing.append(housingLabel, housingValue, housingResult);
      locationFacts.append(nearby, housing);
      const blurb = document.createElement('p'); blurb.className = 'll-line-blurb'; blurb.textContent = p.blurb;
      const careers = document.createElement('p'); careers.className = 'll-line-careers';
      const cs = document.createElement('strong'); cs.textContent = 'Kan bli: ';
      careers.append(cs, document.createTextNode(p.careers.join(', ')));
      const grant = document.createElement('p'); grant.className = 'll-line-careers ll-line-grant';
      const grantRate = chosen && chosen.id === p.id
        ? (chosen.selectedEquipmentGrantRate || p.equipmentGrantRate)
        : p.equipmentGrantRate;
      grant.textContent = 'Utstyrsstipend: ' + kr(LL.data.equipmentGrant(grantRate)) + '/år';

      card.append(illustration, type, h, locationFacts, blurb, careers, grant);
      card.addEventListener('click', () => selectLine(p, availability, grid));
      grid.appendChild(card);
    });
    renderGrantAreaChoice(chosen);
    renderTrainingRoute(chosen);
  }

  function renderGrantAreaChoice(program) {
    const panel = document.getElementById('lineGrantChoice');
    panel.textContent = '';
    const variants = program && Array.isArray(program.equipmentGrantVariants) ? program.equipmentGrantVariants : [];
    if (!variants.length) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    const label = document.createElement('label');
    label.htmlFor = 'lineGrantArea';
    label.textContent = 'Vel programområde for utstyrsstipendet';

    const select = document.createElement('select');
    select.className = 'vp-input';
    select.id = 'lineGrantArea';
    const defaultOption = document.createElement('option');
    defaultOption.value = program.equipmentGrantRate;
    defaultOption.textContent = 'Andre programområde (grunnsats) — ' + kr(LL.data.equipmentGrant(program.equipmentGrantRate)) + '/år';
    select.appendChild(defaultOption);
    variants.forEach(variant => {
      const option = document.createElement('option');
      option.value = variant.equipmentGrantRate;
      option.textContent = variant.label + ' — ' + kr(LL.data.equipmentGrant(variant.equipmentGrantRate)) + '/år';
      select.appendChild(option);
    });
    select.value = program.selectedEquipmentGrantRate || program.equipmentGrantRate;
    select.addEventListener('change', () => {
      const current = LL.state.get().program;
      if (current && current.id === program.id) {
        current.selectedEquipmentGrantRate = select.value;
        document.querySelectorAll('.ll-line-card').forEach(card => {
          if (card.dataset.programId !== current.id) return;
          const grant = card.querySelector('.ll-line-grant');
          if (grant) grant.textContent = 'Utstyrsstipend: ' + kr(LL.data.equipmentGrant(select.value)) + '/år';
        });
      }
    });

    const help = document.createElement('p');
    help.className = 'll-line-grant-help';
    help.textContent = 'Lånekassen har ulik sats for desse programområda. Valet blir brukt i spelbudsjettet.';
    panel.append(label, select, help);
  }

  function selectLine(p, availability, grid) {
    const s = LL.state.get();
    const sameProgram = s.program && s.program.id === p.id;
    const selectedRate = sameProgram
      ? (s.program.selectedEquipmentGrantRate || p.equipmentGrantRate)
      : p.equipmentGrantRate;
    s.program = { ...p, ...availability, selectedEquipmentGrantRate: selectedRate };
    s.hybelAvailable = availability.hybelAvailable;
    s.housing = 'heime';
    s.trainingRoute = p.type === 'yrkesfag'
      ? (sameProgram ? s.trainingRoute : null)
      : 'school';
    grid.querySelectorAll('.ll-line-card').forEach(c => c.setAttribute('aria-pressed', 'false'));
    grid.querySelectorAll('.ll-line-card').forEach(c => {
      if (c.querySelector('h4').textContent === p.name) c.setAttribute('aria-pressed', 'true');
    });
    renderGrantAreaChoice(s.program);
    renderTrainingRoute(p);
    updateNav();
  }

  function renderTrainingRoute(program) {
    const panel = document.getElementById('lineRoute');
    if (!panel) return;
    panel.replaceChildren();
    if (!program || program.type !== 'yrkesfag') {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const heading = document.createElement('h3');
    heading.className = 'heading4';
    heading.textContent = 'Kva vil du gjere etter VG2?';
    const intro = document.createElement('p');
    intro.className = 'll-note';
    intro.textContent = 'Vel mellom VG3 i skule og fyrste året som lærling. Spelet følgjer det fyrste læreåret; 2+2-løpet held fram med eitt læreår til før fagprøva.';
    panel.append(heading, intro);

    const choices = document.createElement('div');
    choices.className = 'll-route-grid';
    choices.appendChild(routeCard(
      'school', 'VG3 i skule',
      'Du held fram som elev og får ikkje lærlingløn i denne perioden.'
    ));
    choices.appendChild(routeCard(
      'apprenticeship', 'Lærling i bedrift',
      'Fyrste året etter VG2. Spelet brukar eit KS-basert lønsoverslag: 30 % om hausten og 40 % om våren.'
    ));
    panel.appendChild(choices);
  }

  function routeCard(id, title, description) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vp-button vp-button--quiet ll-route-card';
    button.setAttribute('aria-pressed', String(LL.state.get().trainingRoute === id));
    const heading = document.createElement('strong');
    heading.textContent = title;
    const body = document.createElement('span');
    body.textContent = description;
    button.append(heading, body);
    button.addEventListener('click', () => {
      LL.state.get().trainingRoute = id;
      document.querySelectorAll('.ll-route-card').forEach(card => {
        card.setAttribute('aria-pressed', String(card === button));
      });
      updateNav();
    });
    return button;
  }

  // ── Steg 4: busituasjon ──
  function renderHousing() {
    const s = LL.state.get();
    const wrap = document.getElementById('housingBody');
    wrap.textContent = '';

    const intro = document.createElement('p');
    if (s.hybelAvailable) {
      intro.textContent = `${s.program.name} finst ikkje på ein skule nær heimen din. Du kan difor bu på hybel og få bortebuarstipend frå Lånekassen — eller pendle og bu heime.`;
    } else {
      intro.textContent = `${s.program.name} finst på ein skule i nærleiken, så du bur heime medan du går på skulen. (Hybel blir aktuelt i seinare livsfasar.)`;
    }
    wrap.appendChild(intro);

    const opts = document.createElement('div');
    opts.className = 'll-housing-opts';

    opts.appendChild(housingCard('heime', 'Bu heime',
      'Ingen husleige, foreldra dekkjer det meste. Lommepengar etter familieøkonomien.', s.housing));

    if (s.hybelAvailable) {
      opts.appendChild(housingCard('hybel', 'Bu på hybel',
        'Eigen hybel med husleige, mat og faste rekningar — men bortebuarstipend (' +
        kr(LL.data.value('grants.housingGrantPerMonth')) + '/mnd) og full fridom.', s.housing));
    }
    wrap.appendChild(opts);
    updateNav();
  }

  function housingCard(id, title, desc, current) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'vp-button vp-button--quiet ll-housing-card';
    c.setAttribute('aria-pressed', String(id === current));
    const h = document.createElement('h4'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = desc;
    c.append(h, p);
    c.addEventListener('click', () => {
      LL.state.get().housing = id;
      document.querySelectorAll('.ll-housing-card').forEach(x => x.setAttribute('aria-pressed', 'false'));
      c.setAttribute('aria-pressed', 'true');
      updateNav();
    });
    return c;
  }

  // ── Fullfør ──
  function finish() {
    const s = LL.state.get();
    LL.storage.saveActive(s);
    LL.main.enterHome();
  }

  function kr(n) { return LL.util.kr(n); }

  function init() {
    document.getElementById('btnNewGame').addEventListener('click', startWizard);
    const cont = document.getElementById('startContinue');
    if (cont) cont.addEventListener('click', () => {
      const saved = LL.storage.loadActive();
      if (saved) {
        LL.state.load(saved);
        LL.storage.saveActive(LL.state.get());
        LL.main.enterHome();
      }
    });
    document.getElementById('btnInfo').addEventListener('click', showInfo);
    const impBtn = document.getElementById('btnImport');
    const impFile = document.getElementById('importFile');
    if (impBtn && impFile) {
      impBtn.addEventListener('click', () => impFile.click());
      impFile.addEventListener('change', () => {
        if (!impFile.files.length) return;
        LL.storage.importSave(impFile.files[0])
          .then(obj => { LL.state.load(obj); LL.storage.saveActive(LL.state.get()); LL.main.enterHome(); LL.main.toast('Livsline importert.'); })
          .catch(err => LL.main.toast(err.message));
        impFile.value = '';
      });
    }
    document.querySelectorAll('#characterTabs [data-family]').forEach(tab => {
      tab.addEventListener('click', () => selectCharacterFamily(tab.dataset.family));
    });
    document.getElementById('randomCharacter').addEventListener('click', randomCharacter);
    document.getElementById('wizNext').addEventListener('click', goNext);
    document.getElementById('wizBack').addEventListener('click', goBack);
    const reroll = document.getElementById('familyReroll');
    if (reroll) reroll.addEventListener('click', () => { drawFamily(); });
  }

  return { init, renderStart };
})();
