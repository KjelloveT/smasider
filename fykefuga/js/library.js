(function (root) {
  'use strict';
  const F = root.Fykefuga, $ = id => document.getElementById(id);
  function create(ui) {
    let draft;
    function button(text, action, host, variant) {
      const node = Vy.el('button', 'vp-button vp-button--compact' + (variant ? ' vp-button--' + variant : ''), text);
      node.type = 'button'; node.addEventListener('click', action); host.appendChild(node); return node;
    }
    function message(text) { $('library-message').textContent = text; $('library-message').hidden = !text; }
    function render() {
      const host = $('library-list'); host.replaceChildren();
      F.Storage.list().forEach(pack => {
        const builtin = pack.id.startsWith('builtin-'), card = Vy.el('article', 'vp-panel vp-panel--inset ff-library-card');
        card.append(Vy.el('h3', '', pack.title), Vy.el('p', '', pack.questions.length + ' spørsmål' + (builtin ? ' · standardinnhald' : ' · lokalt sett')));
        const issues = F.Questions.validate(pack);
        if (issues.length) card.appendChild(Vy.el('p', 'vp-notice vp-notice--warning', 'Må rettast før spel: ' + issues[0].message));
        const actions = Vy.el('div', 'ff-actions');
        button('Spel', () => ui.select(pack), actions, 'primary').disabled = issues.length > 0;
        button(builtin ? 'Lag eigen kopi' : 'Rediger', () => edit(pack, builtin), actions);
        if (!builtin) button('Dupliser', () => { const copy = structuredClone(pack); copy.id = Vy.uuid(); copy.title += ' – kopi'; F.Storage.save(copy); render(); ui.refresh(); }, actions);
        button('Førehandsvis', () => preview(pack), actions);
        button('Del', () => share(pack), actions).disabled = issues.length > 0;
        button('Eksporter', () => Vy.downloadJson(pack, Vy.slug(pack.title) + '.json'), actions);
        if (!builtin) button('Slett', () => confirmDelete(pack), actions, 'danger');
        card.appendChild(actions); host.appendChild(card);
      });
    }
    function confirmDelete(pack) {
      const body = ui.dialog('Slett spørsmålsett');
      body.appendChild(Vy.el('p', '', 'Vil du slette «' + pack.title + '» frå denne nettlesaren?'));
      button('Slett settet', () => { F.Storage.remove(pack.id); Vy.closeModal($('utility-dialog')); render(); ui.refresh(); }, body, 'danger');
    }
    function field(label, value, kind) {
      const node = Vy.el('label', 'vp-field', label), input = document.createElement(kind === 'textarea' ? 'textarea' : 'input');
      input.className = 'vp-input'; if (kind !== 'textarea') input.type = 'text'; input.value = value;
      node.appendChild(input); return { node, input };
    }
    function row(item, index) {
      const wrap = Vy.el('div', 'ff-question-row'); wrap.dataset.id = item.id;
      const prompt = field('Spørsmål ' + (index + 1) + ' (60 teikn)', item.prompt);
      const correct = field('Rett svar (24 teikn)', item.correct);
      const wrong = field('Feilalternativ, eitt per linje', item.wrong.join('\n'), 'textarea');
      const accepted = field('Godkjende svarvariantar, éin per linje', item.accepted.join('\n'), 'textarea'); accepted.node.classList.add('ff-variants');
      prompt.input.dataset.field = 'prompt'; correct.input.dataset.field = 'correct'; wrong.input.dataset.field = 'wrong'; accepted.input.dataset.field = 'accepted';
      wrap.append(prompt.node, correct.node, wrong.node);
      button('Fjern rad', () => { collect(); draft.questions.splice(index, 1); renderRows(); validate(); }, wrap, 'danger');
      const details = Vy.el('details', 'ff-variants'); details.append(Vy.el('summary', '', 'Svarvariantar'), accepted.node); wrap.appendChild(details);
      $('question-rows').appendChild(wrap);
    }
    function renderRows() { $('question-rows').replaceChildren(); draft.questions.forEach(row); }
    function collect() {
      draft.title = $('editor-title').value.trim();
      draft.questions = Array.from($('question-rows').children).map(node => {
        const value = name => node.querySelector('[data-field="' + name + '"]').value.trim();
        const lines = name => value(name).split(/\r?\n/).map(text => text.trim()).filter(Boolean);
        return { id: node.dataset.id, prompt: value('prompt'), correct: value('correct'), wrong: lines('wrong'), accepted: lines('accepted') };
      });
      draft.recommended = { level: $('editor-level').value, reading: Number($('editor-reading').value), difficulty: Number($('editor-difficulty').value) };
      return draft;
    }
    function validate() {
      collect();
      const issues = F.Questions.validate(draft), host = $('editor-issues'); host.replaceChildren(); host.hidden = !issues.length;
      if (issues.length) {
        host.appendChild(Vy.el('p', '', 'Rett dette før du spelar eller deler:'));
        const list = Vy.el('ul'); issues.forEach(issue => list.appendChild(Vy.el('li', '', (issue.row ? 'Rad ' + issue.row + ': ' : '') + issue.message))); host.appendChild(list);
      }
      return issues;
    }
    function edit(pack, copy) {
      draft = pack ? structuredClone(pack) : F.Questions.newPack();
      if (copy) { draft.id = Vy.uuid(); draft.title += ' – eigen kopi'; }
      $('editor-title').value = draft.title; $('editor-level').value = draft.recommended.level;
      $('editor-reading').value = draft.recommended.reading; $('editor-difficulty').value = draft.recommended.difficulty;
      renderRows(); ui.view('editor'); validate(); $('editor-title').focus();
    }
    function preview(pack) {
      const body = ui.dialog('Førehandsvis spørsmål');
      if (F.Questions.validate(pack).length) { body.appendChild(Vy.el('p', '', 'Settet må rettast før det kan førehandsvisast.')); return; }
      const q = pack.questions[0], choice = F.Questions.choice(pack, q, Vy.rng(42));
      body.append(Vy.el('h3', '', q.prompt), Vy.el('p', '', 'Øvre løp: ' + choice.upper), Vy.el('p', '', 'Nedre løp: ' + choice.lower), Vy.el('p', '', 'Fasit: ' + q.correct));
      button('Prøv settet i spelet', () => { Vy.closeModal($('utility-dialog')); ui.select(pack); }, body, 'primary');
    }
    async function share(pack) {
      const body = ui.dialog('Del med elevane'); body.appendChild(Vy.el('p', '', 'Gjer delingslenkja klar …'));
      try {
        const url = await VyrdepilShare.buildUrl(pack, new URL('index.html', location.href));
        body.replaceChildren();
        if (url.length > 12000) { body.appendChild(Vy.el('p', '', 'Dette settet er stort. Eksporter ei JSON-fil og del henne med elevane.')); }
        else {
          body.appendChild(Vy.el('p', '', 'Lenkja inneheld spørsmåla og dei tilrådde vala. Dei blir ikkje sende til ein tenar.'));
          const f = field('Delingslenkje', url, 'textarea'); f.input.readOnly = true; body.appendChild(f.node);
          button('Kopier lenkje', async () => { try { await navigator.clipboard.writeText(url); Vy.toast('Lenkja er kopiert.'); } catch (_) { f.input.focus(); f.input.select(); Vy.toast('Marker og kopier lenkja.'); } }, body);
        }
        button('Eksporter JSON', () => Vy.downloadJson(pack, Vy.slug(pack.title) + '.json'), body);
      } catch (error) { body.replaceChildren(Vy.el('p', 'vp-notice vp-notice--error', error.message)); }
    }
    function pastePairs() {
      const body = ui.dialog('Lim inn ordpar'); body.appendChild(Vy.el('p', '', 'Kopier to kolonnar frå eit rekneark: spørsmål til venstre, rett svar til høgre. Ei rad per ordpar.'));
      const f = field('To kolonnar', '', 'textarea'); body.appendChild(f.node); const warning = Vy.el('p', 'vp-notice'); warning.hidden = true; body.appendChild(warning);
      button('Legg til ordpara', () => {
        try { collect(); const items = F.Questions.parsePairs(f.input.value); if (draft.questions.length + items.length > 500) throw new Error('Eit sett kan ha høgst 500 spørsmål.'); draft.questions.push(...items); renderRows(); validate(); Vy.closeModal($('utility-dialog')); }
        catch (error) { warning.textContent = error.message; warning.hidden = false; }
      }, body, 'positive');
    }
    function ordaklok() {
      const body = ui.dialog('Hent frå Ordaklok');
      body.appendChild(Vy.el('p', '', 'Vel ei lokalt lagra Ordaklok-liste, eller lim inn ei eksisterande Ordaklok-lenkje. Importen lagar ein kopi.'));
      const lists = F.Storage.ordaklok();
      lists.forEach(list => button(list.title || 'Utan namn', () => { try { const pack = F.Questions.fromOrdaklok(list); Vy.closeModal($('utility-dialog')); edit(pack); } catch (error) { Vy.toast(error.message); } }, body));
      if (!lists.length) body.appendChild(Vy.el('p', '', 'Ingen Ordaklok-lister er lagra i denne nettlesaren.'));
      const f = field('Ordaklok-lenkje', ''); body.appendChild(f.node);
      button('Importer lenkja', async () => {
        try { const url = new URL(f.input.value); const params = new URLSearchParams(url.hash.slice(1) || url.search.slice(1)); const list = await VyrdepilShare.decodeFromParams(params); const pack = F.Questions.fromOrdaklok(list); Vy.closeModal($('utility-dialog')); edit(pack); }
        catch (error) { Vy.toast(error instanceof TypeError ? 'Skriv inn ei gyldig Ordaklok-lenkje.' : 'Lenkja kunne ikkje lesast: ' + error.message); }
      }, body, 'positive');
    }
    async function importFile(file) {
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('Fila er for stor. Grensa er 2 MB.');
        const data = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON-fila må innehalde eit spørsmålsett eller eit bibliotek.');
        if ((data.app === 'ordaklok' || Array.isArray(data.pairs)) && !Array.isArray(data.lists)) { edit(F.Questions.fromOrdaklok(data)); return; }
        const ordaklok = data.app === 'ordaklok' && Array.isArray(data.lists);
        const entries = ordaklok ? data.lists : data.app === 'fykefuga' && data.version === 1 && Array.isArray(data.packs) ? data.packs : [data];
        if (!entries.length || entries.length > 100) throw new Error('Importer mellom 1 og 100 sett om gongen.');
        const packs = entries.map(ordaklok ? F.Questions.fromOrdaklok : F.Questions.normalizePack);
        if (packs.length === 1) { packs[0].id = Vy.uuid(); edit(packs[0]); return; }
        packs.forEach(pack => { pack.id = Vy.uuid(); F.Storage.save(pack); }); render(); ui.refresh(); message(packs.length + ' sett er importerte. Sett med feil må rettast før spel.');
      } catch (error) { message('Importen kunne ikkje lesast: ' + (error instanceof SyntaxError ? 'Fila er ikkje gyldig JSON.' : error.message)); }
    }
    $('create-pack').addEventListener('click', () => edit());
    $('add-question').addEventListener('click', () => { collect(); if (draft.questions.length >= 500) { Vy.toast('Høgst 500 spørsmål per sett.'); return; } draft.questions.push({ id: Vy.uuid(), prompt: '', correct: '', wrong: [], accepted: [] }); renderRows(); $('question-rows').lastElementChild.querySelector('input').focus(); validate(); });
    $('paste-pairs').addEventListener('click', pastePairs);
    $('save-pack').addEventListener('click', () => { collect(); try { F.Storage.save(draft); ui.refresh(); render(); ui.view('library'); message(F.Questions.validate(draft).length ? 'Utkastet er lagra. Rett dei merkte spørsmåla før spel.' : 'Spørsmålsettet er lagra.'); } catch (error) { Vy.toast(error.message); } });
    $('preview-pack').addEventListener('click', () => { if (!validate().length) preview(draft); });
    $('editor-back').addEventListener('click', () => ui.view('library'));
    $('editor-view').addEventListener('input', validate);
    $('import-button').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', event => { if (event.target.files[0]) importFile(event.target.files[0]); event.target.value = ''; });
    $('import-ordaklok').addEventListener('click', ordaklok);
    $('export-library').addEventListener('click', () => Vy.downloadJson({ app: 'fykefuga', version: 1, packs: F.Storage.list().filter(pack => !pack.id.startsWith('builtin-')) }, 'fykefuga-bibliotek.json'));
    return { render, edit, share };
  }
  F.Library = { create };
})(window);
