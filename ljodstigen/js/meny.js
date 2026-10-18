/* ══════════════════════════════════════════════
   MENY.JS — Startskjermen

   Profilval, modusval, skogen, merka og læraroversikta.

   Heile denne skjermen skal kunne brukast med lyden av. Eit klasserom
   har ikkje alltid hovudtelefonar til alle, og ein elev som ikkje finn
   fram i menyen utan lyd kjem aldri til oppgåvene.
   ══════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const R = function () { return LjodRender; };

  /* Modusar som finst i meir enn éi utgåve. Utgåva er eit VAL og ikkje
     ein ny modus: same oppgåve, same motor, same framgang. */
  const VARIANTAR = {
    bokstavropet: {
      href: 'ropet.html',
      label: 'Prøv Bokstavropet på Leirplassen',
      aria: 'Bokstavropet på leirplassen, ei 3D-utgåve der lydane bur i telt'
    }
  };
  let current = null;   // vald profil

  function $(id) { return document.getElementById(id); }

  /* ──────────────── Profilar ──────────────── */

  function avatarButton(av, selected) {
    const b = R().h('button', 'ljod-avatar vp-button vp-button--quiet' + (selected ? ' is-active' : ''));
    b.type = 'button';
    b.dataset.avatar = av.id;
    b.dataset.tone = av.tone;
    b.appendChild(LjodAvatar.image(av.id, 56));
    b.appendChild(R().h('span', 'ljod-avatar-name', av.name));
    b.setAttribute('aria-label', 'Figuren ' + av.name);
    return b;
  }

  function renderProfiles() {
    const host = $('profiles');
    if (!host) return;
    R().clear(host);
    const s = LjodState.read();

    s.profiles.forEach(function (p) {
      const av = LjodState.avatarOf(p.avatar);
      const st = LjodProgress.summary(p);
      const card = R().h('div', 'ljod-profile' + (current && current.id === p.id ? ' is-active' : ''));
      card.dataset.tone = av.tone;

      const pick = R().h('button', 'ljod-profile-pick vp-button vp-button--quiet vp-button--block');
      pick.type = 'button';
      pick.appendChild(LjodAvatar.image(av.id, 56));
      pick.appendChild(R().h('span', 'ljod-profile-name', av.name));
      pick.appendChild(R().h('span', 'ljod-profile-sum', st.completed + ' av ' + st.total));
      pick.setAttribute('aria-label', 'Vel ' + av.name + ', ' + st.completed + ' av ' + st.total + ' steg');
      pick.setAttribute('aria-pressed', String(!!(current && current.id === p.id)));
      pick.addEventListener('click', function () { select(p.id); });
      card.appendChild(pick);

      const del = R().h('button', 'ljod-profile-del vp-button vp-button--danger vp-button--compact vp-button--block');
      del.type = 'button';
      del.textContent = 'Slett';
      del.setAttribute('aria-label', 'Slett ' + av.name);
      del.addEventListener('click', function () {
        if (!confirm('Slette ' + av.name + ' og alt som er lagra?')) return;
        LjodState.deleteProfile(p.id);
        if (current && current.id === p.id) current = null;
        refresh();
      });
      card.appendChild(del);
      host.appendChild(card);
    });

    /* Ledige figurar å opprette. */
    const taken = s.profiles.map(function (p) { return p.avatar; });
    const free = LjodState.AVATARS.filter(function (a) { return taken.indexOf(a.id) === -1; });
    free.forEach(function (av) {
      const b = avatarButton(av, false);
      b.appendChild(R().h('span', 'ljod-profile-sum', '0 av 10'));
      b.addEventListener('click', function () {
        const p = LjodState.createProfile(av.id);
        select(p.id);
      });
      host.appendChild(b);
    });
    if (root.VyrdepilDesign) root.VyrdepilDesign.initSelections(host);
  }

  function select(id) {
    current = LjodState.getProfile(id);
    const s = LjodState.read();
    s.lastProfile = id;
    LjodState.write(s);
    refresh();
    const dialog = $('profileDialog');
    if (dialog && dialog.open) Vy.closeModal(dialog);
  }

  /* ──────────────── Modusar ──────────────── */

  function renderModes() {
    const host = $('modes');
    if (!host) return;
    R().clear(host);
    if (!current) return;

    const allOpen = LjodState.read().allModes;
    const open = allOpen
      ? LjodAdaptive.MODES.map(function (m) { return m.id; })
      : LjodAdaptive.unlockedModes(current.adaptive).map(function (m) { return m.id; });
    const suggested = LjodAdaptive.suggestMode(current.adaptive);
    /* Kva som er opna av eleven sjølv, uavhengig av brytaren. Ein modus
       som berre er open fordi alt er opna skal ikkje sjå ut som noko
       eleven har fortent. */
    const earned = LjodAdaptive.unlockedModes(current.adaptive).map(function (m) { return m.id; });

    LjodAdaptive.MODES.forEach(function (m) {
      const def = window['LjodMode_' + m.id];
      const unlocked = open.indexOf(m.id) !== -1;

      const variant = VARIANTAR[m.id];
      const bridge = m.id === 'ordbyggjar';
      const card = R().h(unlocked && !variant && !bridge ? 'a' : 'article', 'ljod-mode vp-panel ' + (unlocked ? 'vp-panel--plain' : 'vp-panel--inset is-locked'));
      if (unlocked && !variant && !bridge) {
        card.href = 'spel.html#' + new URLSearchParams({ p: current.id, m: m.id });
      }
      const thumbnail = R().h('img', 'ljod-mode-thumbnail');
      thumbnail.src = LjodAvatar.thumbnailUrl(current.avatar, m.id);
      thumbnail.width = 480;
      thumbnail.height = 360;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      card.appendChild(thumbnail);
      card.appendChild(R().h('span', 'ljod-mode-title', m.label));
      card.appendChild(R().h('span', 'ljod-mode-blurb', def ? def.blurb : ''));

      if (unlocked && earned.indexOf(m.id) === -1) {
        card.appendChild(R().h('span', 'ljod-mode-flag ljod-flag-open', 'Opna av lærar'));
      } else if (unlocked && m.id === suggested) {
        /* Appen foreslår, eleven vel. Forslaget er ei brikke, ikkje ein
           låst veg — autonomi er halve motivasjonen på dette trinnet. */
        card.appendChild(R().h('span', 'ljod-mode-flag', 'Prøv denne'));
      }
      if (!unlocked) {
        card.appendChild(R().h('span', 'ljod-mode-flag', m.reading ? 'Opnar når grunnlydane er øvde' : 'Opnar seg snart'));
        card.setAttribute('aria-disabled', 'true');
      }

      if (variant) {
        const actions = R().h('div', 'vp-actions ljod-mode-actions');
        const start = R().h(unlocked ? 'a' : 'button', 'vp-button vp-button--positive', 'Start');
        const alt = R().h(unlocked ? 'a' : 'button', 'vp-button', variant.label);
        if (unlocked) {
          start.href = 'spel.html#' + new URLSearchParams({ p: current.id, m: m.id });
          start.setAttribute('aria-label', 'Start Bokstavropet');
          alt.href = variant.href;
          alt.setAttribute('aria-label', variant.label);
        } else {
          start.type = alt.type = 'button';
          start.disabled = alt.disabled = true;
        }
        actions.appendChild(start);
        actions.appendChild(alt);
        card.appendChild(actions);
      }
      if (bridge && unlocked) {
        const actions = R().h('div', 'vp-actions ljod-mode-actions');
        [['blend', 'Set lydane saman'], ['build', 'Bygg ordet'], ['read', 'Les sjølv']].forEach(function (task) {
          const link = R().h('a', 'vp-button', task[1]);
          link.href = 'spel.html#' + new URLSearchParams({ p: current.id, m: m.id, task: task[0] });
          actions.appendChild(link);
        });
        card.appendChild(actions);
      }
      host.appendChild(card);
    });
  }

  /* ──────────────── Panel ──────────────── */

  function refresh() {
    if (!current) current = LjodState.currentProfile();
    renderProfiles();
    const chosen = $('currentProfile');
    if (chosen && current) {
      R().clear(chosen);
      const avatar = LjodState.avatarOf(current.avatar);
      chosen.appendChild(LjodAvatar.image(avatar.id, 96));
      chosen.appendChild(R().h('strong', null, avatar.name));
    }
    const panel = $('player');
    if (!panel) return;

    if (!current) { panel.hidden = true; return; }
    panel.hidden = false;

    const av = LjodState.avatarOf(current.avatar);
    const title = $('playerName');
    if (title) title.textContent = av.name;

    renderModes();
    LjodProgressUI.render($('journey'), current);
    LjodSkog.renderStars($('stars'), current);
    LjodSkog.renderSkog($('garden'), current);
    LjodSkog.renderBadges($('badges'), current);
    LjodLaerar.render($('laerar'), current);
  }

  function wireDialogs() {
    ['teacher', 'profile'].forEach(function (name) {
      const dialog = $(name + 'Dialog');
      if (!dialog) return;
      $(name + 'Open').addEventListener('click', function () { Vy.openModal(dialog); });
      $(name + 'Close').addEventListener('click', function () { Vy.closeModal(dialog); });
      Vy.bindOverlayClose(dialog);
    });
  }

  /* ──────────────── Faner ──────────────── */

  function wireTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    const panes = document.querySelectorAll('[data-pane]');
    if (!tabs.length) return;
    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (x) {
          x.classList.toggle('active', x === t);
          x.setAttribute('aria-selected', x === t ? 'true' : 'false');
        });
        Array.prototype.forEach.call(panes, function (p) {
          p.hidden = p.dataset.pane !== t.dataset.tab;
        });
      });
    });
  }

  /* ──────────────── Stemmeveljar ──────────────── */

  /* Same stad og same form som fontveljaren. Er det berre éi stemme
     innspelt, viser vi ingenting — eit val med eitt alternativ er ikkje
     eit val, berre støy på ei side lærarar skal finne fram på. */
  function wireVoice() {
    const host = $('voicepick');
    if (!host) return;
    LjodAudio.voices().then(function (reg) {
      if (!reg || !Array.isArray(reg.voices) || reg.voices.length < 2) {
        const wrap = host.closest('[data-voice-section]');
        if (wrap) wrap.hidden = true;
        return;
      }
      const chosen = LjodState.read().voice || reg.default;
      reg.voices.forEach(function (v) {
        const b = R().h('button', 'vp-button vp-button--compact ljod-fontbtn' + (chosen === v.id ? ' active' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(chosen === v.id));
        b.textContent = v.name || v.id;
        if (v.note) b.title = v.note;
        b.addEventListener('click', function () {
          const st = LjodState.read();
          st.voice = v.id;
          LjodState.write(st);
          Array.prototype.forEach.call(host.children, function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
          b.classList.add('active');
          b.setAttribute('aria-pressed', 'true');
        });
        host.appendChild(b);
      });
      if (root.VyrdepilDesign) root.VyrdepilDesign.initSelections(host);
    });
  }

  /* ──────────────── Opne alle modusane ──────────────── */

  function wireAllModes() {
    const host = $('allmodes');
    if (!host) return;
    const box = R().h('input');
    box.type = 'checkbox';
    box.id = 'allModesBox';
    box.checked = LjodState.read().allModes;
    box.addEventListener('change', function () {
      const s = LjodState.read();
      s.allModes = box.checked;
      LjodState.write(s);
      refresh();
    });
    const lab = R().h('label', 'ljod-check vp-choice');
    lab.htmlFor = 'allModesBox';
    lab.appendChild(box);
    lab.appendChild(R().h('span', null, 'Opne alle modusane'));
    host.appendChild(lab);
  }

  function init() {
    document.body.dataset.font = 'lesefont';
    wireDialogs();
    wireVoice();
    wireAllModes();
    wireTabs();
    const s = LjodState.read();
    if (s.lastProfile) current = LjodState.getProfile(s.lastProfile);
    refresh();

    const print = document.getElementById('printLaerar');
    if (print) print.addEventListener('click', function () { window.print(); });
  }

  root.LjodMeny = { init: init, refresh: refresh };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
