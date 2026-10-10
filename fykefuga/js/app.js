(function (root) {
  'use strict';
  const F = root.Fykefuga, $ = id => document.getElementById(id);
  let sharedPack, selected, engine, config, currentView = 'setup', paused = false, countdown = 0, deathTimer, frame = 0, previous = 0, feedbackUntil = 0;
  const errors = [], render = F.Render.create($('game-canvas'));
  const clock = F.Physics.accumulator(), input = F.Input.create($('game-stage'), restart, () => paused ? resume() : pause('Spelet er sett på pause.'));
  const settings = F.Storage.settings();
  const soundControls = F.SoundControls.create(settings, () => F.Storage.saveSettings(getConfig()));
  function view(name) {
    currentView = name;
    ['setup', 'game', 'result', 'library', 'editor'].forEach(id => { $(id + '-view').hidden = id !== name; });
    document.body.classList.toggle('ff-playing', name === 'game');
    if (root.VyrdepilAppShell) VyrdepilAppShell.setGameActive(name === 'game');
    if (name !== 'game') { input.enable(false); clearTimeout(deathTimer); cancelAnimationFrame(frame); soundControls.stopPreview(); F.Audio.stop(name === 'result'); }
  }
  function dialog(title) {
    $('dialog-title').textContent = title; $('dialog-body').replaceChildren(); Vy.openModal($('utility-dialog')); return $('dialog-body');
  }
  $('dialog-close').addEventListener('click', () => Vy.closeModal($('utility-dialog')));
  function options(select, includeTutorials) {
    F.levels.concat([{ id: 'endless', name: 'Endelaus fuga' }]).forEach(level => select.add(new Option(level.name, level.id)));
    if (includeTutorials) F.modes.forEach(mode => select.add(new Option('Øving: ' + mode.name, 'tutorial-' + mode.id)));
  }
  options($('level-select'), true); options($('editor-level'));
  function refresh() {
    const old = $('pack-select').value;
    const packs = F.Storage.list(); if (sharedPack) packs.push(sharedPack);
    $('pack-select').replaceChildren();
    packs.forEach(pack => $('pack-select').add(new Option(pack.title + (pack === sharedPack ? ' · delt' : ''), pack.id)));
    $('pack-select').value = packs.some(pack => pack.id === old) ? old : packs[0].id;
    selected = packs.find(pack => pack.id === $('pack-select').value);
    const oldSkin = $('skin-select').value || settings.skin || 'gold'; $('skin-select').replaceChildren();
    F.skins.forEach(skin => { const option = new Option(skin.name + (F.Storage.unlocked(skin.id) ? '' : ' · låst'), skin.id); option.disabled = !F.Storage.unlocked(skin.id); $('skin-select').add(option); });
    $('skin-select').value = F.Storage.unlocked(oldSkin) ? oldSkin : 'gold';
    const progress = F.Storage.progressData(); $('progress-label').textContent = progress.correct + ' rette vegval · ' + progress.levels.length + '/4 hovudbaner · ' + progress.modes.length + '/8 modusar meistra';
    VyrdepilBragd.renderGameBadges($('bragder'), 'fykefuga', F.Storage.earned()).catch(() => { $('bragder').textContent = 'Bragdlista kunne ikkje lastast. Last sida på nytt.'; });
    updateSetup();
  }
  function getConfig() {
    const level = $('level-select').value;
    const difficulty = level === 'endless' ? Number($('difficulty-select').value) : level.startsWith('tutorial-') ? 0 : F.level(level).difficulty;
    return { level, reading: Number($('reading-select').value), difficulty, skin: $('skin-select').value, reduced: $('reduced-input').checked, sound: $('sound-input').checked, ...soundControls.values() };
  }
  function updateSetup() {
    if (!selected) return;
    const c = getConfig(); $('difficulty-field').hidden = c.level !== 'endless';
    $('pack-description').textContent = selected.questions.length + ' korte spørsmål. Tilrådde val kan justerast.';
    $('shared-note').hidden = selected !== sharedPack; $('save-shared').hidden = selected !== sharedPack;
    $('record-label').textContent = 'Rekord med desse vala: ' + F.Storage.best(selected, c) + ' rette vegval.';
  }
  function select(pack) {
    selected = pack;
    if (!F.Storage.list().some(item => item.id === pack.id) && pack !== sharedPack) { sharedPack = pack; refresh(); }
    $('pack-select').value = pack.id;
    const recommendation = pack.recommended; $('level-select').value = recommendation.level; $('reading-select').value = recommendation.reading; $('difficulty-select').value = recommendation.difficulty;
    view('setup'); updateSetup(); $('start-button').focus();
  }
  const library = F.Library.create({ view, dialog, refresh, select });
  $('pack-select').addEventListener('change', () => { const pack = F.Storage.list().concat(sharedPack ? [sharedPack] : []).find(item => item.id === $('pack-select').value); if (pack) select(pack); });
  ['level-select', 'reading-select', 'difficulty-select', 'skin-select'].forEach(id => $(id).addEventListener('change', updateSetup));
  $('sound-input').checked = !!settings.sound; $('reduced-input').checked = settings.reduced === undefined ? matchMedia('(prefers-reduced-motion: reduce)').matches : !!settings.reduced;
  if (Array.from($('level-select').options).some(option => option.value === settings.level)) $('level-select').value = settings.level;
  if ([2, 4, 6].includes(settings.reading)) $('reading-select').value = settings.reading;
  if ([0, 1, 2].includes(settings.difficulty)) $('difficulty-select').value = settings.difficulty;
  F.modes.forEach(mode => {
    const button = Vy.el('button', 'vp-button vp-button--compact');
    const image = document.createElement('img'); image.src = 'assets/gold-' + mode.id + '.png'; image.alt = ''; image.width = 40; image.height = 40;
    button.append(image, Vy.el('span', '', mode.name)); button.title = mode.help; button.addEventListener('click', () => { $('level-select').value = 'tutorial-' + mode.id; start(); }); $('tutorials').appendChild(button);
  });
  async function start(nextConfig) {
    const issues = F.Questions.validate(selected);
    if (issues.length && !getConfig().level.startsWith('tutorial-')) { $('setup-message').textContent = 'Settet må rettast: ' + issues[0].message; $('setup-message').hidden = false; return; }
    $('start-button').disabled = true; $('setup-message').textContent = 'Lastar farkostar og kulissar …'; $('setup-message').hidden = false;
    try {
      config = nextConfig || { ...getConfig(), seed: Vy.newSeed(), offset: 0 };
      if (config.level !== 'endless' && !config.level.startsWith('tutorial-')) config.difficulty = F.level(config.level).difficulty;
      soundControls.stopPreview(); await F.Audio.init(); F.Audio.setVolumes(config.musicVolume, config.effectsVolume); F.Audio.setMuted(!config.sound); await F.Assets.load();
      $('setup-message').hidden = true;
      F.Storage.saveSettings({ ...getConfig() });
      engine = F.Engine.create(selected, config); render.reset(config); errors.length = 0; paused = false; countdown = 0; feedbackUntil = 0;
      $('game-overlay').hidden = true; view('game'); input.enable(true); clock.clear(); previous = performance.now();
      F.Audio.start(engine.world.segment(0).scene); syncSound(); $('game-stage').focus({ preventScroll: true }); processEvents();
      cancelAnimationFrame(frame); frame = requestAnimationFrame(loop);
    } catch (error) { $('setup-message').textContent = error.message; $('setup-message').hidden = false; view('setup'); }
    finally { $('start-button').disabled = false; }
  }
  function restart() {
    if (!engine || currentView !== 'game' || paused) return;
    clearTimeout(deathTimer); engine.reset(); render.reset(config); clock.clear(); input.discardPress(); previous = performance.now(); processEvents();
  }
  function processEvents() {
    engine.drain().forEach(event => {
      F.Audio.effect(event); render.notify(event, engine.state);
      if (event.type === 'mode') {
        const mode = F.mode(event.mode); $('mode-label').textContent = mode.name; $('control-help').textContent = mode.help;
        F.Audio.setScene(engine.world.at(engine.state.time).scene);
      }
      if (event.type === 'answer' || event.type === 'complete') F.Storage.progress(event, { ...config, mode: engine.state.player.mode });
      if (event.type === 'dead') {
        F.Storage.record(selected, config, engine.state);
        if (event.reason === 'answer') {
          errors.push({ prompt: event.detail.item.prompt, correct: event.detail.item.correct, chosen: event.detail.chosen }); if (errors.length > 100) errors.shift();
          $('question-text').textContent = 'Fasit: ' + event.detail.item.correct; $('question-help').textContent = 'Spørsmålet: ' + event.detail.item.prompt;
        } else { $('question-text').textContent = 'Krasj! Prøv på nytt.'; $('question-help').textContent = 'Same bane og spørsmålsrekkje.'; }
        feedbackUntil = performance.now() + 1700;
        $('upper-answer').hidden = $('lower-answer').hidden = true;
        deathTimer = setTimeout(restart, 280);
      }
      if (event.type === 'complete') complete();
    });
  }
  function complete() {
    const score = F.Storage.record(selected, config, engine.state);
    $('result-title').textContent = engine.world.tutorial ? 'Øvinga er fullført!' : F.level(config.level).name + ' er fullført!';
    $('result-text').textContent = engine.world.tutorial ? 'Du har øvd på ' + F.mode(engine.state.player.mode).name.toLowerCase() + '. Prøv ei hovudbane eller ein ny modus.' : engine.state.correct + ' rette vegval. ' + (score.newRecord ? 'Ny rekord! ' : '') + 'Rekord med desse vala: ' + score.best + '.';
    $('next-batch').hidden = engine.world.tutorial || selected.questions.length <= engine.world.count;
    view('result'); refresh(); $('replay-button').focus();
  }
  function hud() {
    const state = engine.state, choice = engine.activeChoice(), segment = engine.world.at(state.time);
    $('run-label').textContent = state.correct + ' rette · forsøk ' + state.attempt;
    if (choice && state.status === 'running') {
      $('control-help').textContent = ['cube', 'robot'].includes(state.player.mode) ? 'Hopp opp på hylla for øvre svar. Bli på golvet for nedre.' : F.mode(state.player.mode).help;
      $('question-text').textContent = choice.item.prompt; $('question-help').textContent = 'Vel vegen før avgjerdslina · ' + choice.remaining.toFixed(1) + ' s';
      ['upper', 'lower'].forEach(side => { const answer = $(side + '-answer'); answer.hidden = false; answer.textContent = (side === 'upper' ? 'Øvre: ' : 'Nedre: ') + choice[side]; answer.classList.toggle('is-selected', (state.player.y < F.Physics.SPLIT ? 'upper' : 'lower') === side); });
    } else if (state.status === 'running' && performance.now() > feedbackUntil) {
      $('control-help').textContent = F.mode(state.player.mode).help;
      $('upper-answer').hidden = $('lower-answer').hidden = true;
      const untilSwitch = segment.end - state.time, nextMode = engine.world.segment(segment.index + 1).mode;
      $('question-text').textContent = !engine.world.tutorial && untilSwitch < 1 ? 'Neste modus: ' + F.mode(nextMode).name : F.mode(state.player.mode).name;
      $('question-help').textContent = engine.world.tutorial ? F.mode(state.player.mode).help : 'Pass hinderet. Spørsmålet kjem på ei trygg strekning.';
    }
  }
  function loop(now) {
    if (currentView !== 'game') return;
    const elapsed = Math.max(0, (now - previous) / 1000); previous = now;
    if (!paused && countdown <= now) {
      if (countdown) { countdown = 0; $('game-overlay').hidden = true; input.enable(true); F.Audio.init().then(() => F.Audio.start(engine.world.at(engine.state.time).scene)); }
      if (elapsed > 0.25) pause('Spelet tok ein pust i bakken. Hald fram når du er klar.');
      else clock.advance(elapsed, () => { const control = input.read(); engine.step(control); render.update(engine.state, control); processEvents(); });
    } else if (!paused && countdown) $('overlay-title').textContent = 'Klar om ' + Math.ceil((countdown - now) / 1000);
    if (currentView === 'game') { render.draw(engine, config); hud(); frame = requestAnimationFrame(loop); }
  }
  function pause(reason) {
    if (currentView !== 'game' || paused) return;
    paused = true; countdown = 0; clearTimeout(deathTimer); input.enable(false); clock.clear(); F.Audio.stop();
    $('game-overlay').hidden = false; $('overlay-title').textContent = 'Pause'; $('overlay-text').textContent = reason || 'Hald fram når du er klar.'; $('resume-button').hidden = false;
  }
  function resume() {
    if (currentView !== 'game' || !paused || document.hidden) return;
    paused = false; countdown = performance.now() + 2000; input.enable(false); clock.clear(); $('overlay-title').textContent = 'Klar om 2'; $('resume-button').hidden = true;
    F.Audio.init();
    if (engine.state.status === 'dead') { engine.reset(); render.reset(config); processEvents(); }
  }
  function syncSound() { $('game-sound').textContent = config.sound ? 'Ljod på' : 'Ljod av'; $('game-sound').setAttribute('aria-pressed', String(config.sound)); $('sound-input').checked = config.sound; }
  $('start-button').addEventListener('click', () => start());
  $('library-button').addEventListener('click', () => { library.render(); view('library'); });
  ['library-home', 'result-home'].forEach(id => $(id).addEventListener('click', () => { view('setup'); refresh(); }));
  $('save-shared').addEventListener('click', () => { const copy = structuredClone(selected); copy.id = Vy.uuid(); F.Storage.save(copy); sharedPack = null; refresh(); select(copy); Vy.toast('Ein lokal kopi er lagra.'); });
  $('pause-button').addEventListener('click', () => paused ? resume() : pause()); $('resume-button').addEventListener('click', resume);
  $('restart-button').addEventListener('click', restart);
  $('new-round-button').addEventListener('click', () => start({ ...config, seed: Vy.newSeed(), offset: 0 }));
  $('leave-button').addEventListener('click', () => { F.Storage.record(selected, config, engine.state); view('setup'); refresh(); });
  $('game-sound').addEventListener('click', () => { config.sound = !config.sound; F.Audio.setMuted(!config.sound); F.Storage.saveSettings({ ...getConfig(), sound: config.sound }); syncSound(); });
  $('fullscreen-button').hidden = !VyrdepilFullscreen.isSupported;
  $('fullscreen-button').addEventListener('click', () => VyrdepilFullscreen.toggle($('game-view'), 'landscape'));
  $('errors-button').addEventListener('click', () => {
    pause('Sjå feila dine og hald fram når du er klar.'); const body = dialog('Feila dine');
    if (!errors.length) body.appendChild(Vy.el('p', '', 'Ingen feil svar i denne runden.'));
    else errors.forEach(error => { const item = Vy.el('div', 'vp-panel vp-panel--inset'); item.append(Vy.el('h3', '', error.prompt), Vy.el('p', '', 'Du valde: ' + error.chosen), Vy.el('p', '', 'Rett svar: ' + error.correct)); body.appendChild(item); });
  });
  $('next-batch').addEventListener('click', () => start({ ...config, offset: config.offset + engine.world.count }));
  $('replay-button').addEventListener('click', () => start({ ...config }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('Fana vart lagd i bakgrunnen.'); });
  window.addEventListener('blur', () => pause('Vindauget mista fokus.'));
  window.addEventListener('orientationchange', () => pause('Skjermen vart snudd.'));
  if (root.screen && root.screen.orientation) root.screen.orientation.addEventListener('change', () => pause('Skjermen vart snudd.'));
  document.addEventListener('keydown', event => {
    if (paused && currentView === 'game' && event.code === 'KeyP' && !event.repeat && !$('utility-dialog').open) { event.preventDefault(); resume(); }
  }, true);
  document.addEventListener('fullscreenchange', () => { if (currentView === 'game') pause('Skjermvisinga vart endra.'); });
  refresh();
  (async () => {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('d') && !params.has('dz')) return;
    try {
      const data = await VyrdepilShare.decodeFromParams(params);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Lenkja inneheld ikkje eit spørsmålsett.');
      sharedPack = data.app === 'ordaklok' || Array.isArray(data.pairs) ? F.Questions.fromOrdaklok(data) : F.Questions.normalizePack(data);
      sharedPack.id = 'shared-' + sharedPack.id; refresh(); select(sharedPack);
      const issues = F.Questions.validate(sharedPack); if (issues.length) { library.edit(sharedPack); Vy.toast('Det delte settet må rettast før spel.'); }
    } catch (error) { $('setup-message').textContent = 'Delingslenkja kunne ikkje lesast: ' + error.message; $('setup-message').hidden = false; }
  })();
})(window);
