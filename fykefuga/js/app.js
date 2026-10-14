(function (root) {
  'use strict';
  const F = root.Fykefuga, $ = id => document.getElementById(id);
  let sharedPack, selected, engine, config, currentView = 'setup', paused = false, countdown = 0, deathTimer, deathProgressTimer, frame = 0, previous = 0, feedbackUntil = 0, bestPercent = 0;
  const errors = [], render = F.Render.create($('game-canvas'));
  const retrayHud = F.ReTrayHud.create($('game-stage'));
  const clock = F.Physics.accumulator(), input = F.Input.create($('game-stage'), restart, () => paused ? resume() : pause('Spelet er sett på pause.'));
  const settings = F.Storage.settings();
  const demoLevels = ['retray-probe', 'stereo-study', 'back-on-track-study', 'polargeist-study'];
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
    const levels = [
      { id: 'stereo-study', name: 'Villrina i Gyllengarden' },
      { id: 'back-on-track-study', name: 'Eidskvedet' },
      { id: 'polargeist-study', name: 'Utflukt med danning' },
      { id: 'retray-probe', name: 'Sorgsalane' }
    ];
    levels.forEach(level => select.add(new Option(level.name, level.id)));
  }
  options($('level-select')); options($('editor-level'));
  const setupChoices = F.SetupChoices.create();
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
    $('progress-label').textContent = 'Kjem snart.';
    $('bragder').hidden = true;
    setupChoices.refresh(packs); updateSetup();
  }
  function getConfig() {
    const level = $('level-select').value;
    const difficulty = level === 'endless' ? Number($('difficulty-select').value) : level.startsWith('tutorial-') || demoLevels.includes(level) ? 0 : F.level(level).difficulty;
    return { level, reading: Number($('reading-select').value), difficulty, skin: $('skin-select').value, reduced: $('reduced-input').checked, sound: $('sound-input').checked, ...soundControls.values() };
  }
  function updateSetup() {
    if (!selected) return;
    setupChoices.sync();
    const c = getConfig(), probe = demoLevels.includes(c.level);
    $('difficulty-field').hidden = true;
    $('pack-select-choices').hidden = true; $('pack-description').hidden = true;
    $('reading-select-choices').hidden = true; $('record-label').hidden = true;
    $('pack-description').textContent = selected.questions.length + ' korte spørsmål. Tilrådde val kan justerast.';
    $('shared-note').hidden = probe || selected !== sharedPack; $('save-shared').hidden = probe || selected !== sharedPack;
    $('record-label').textContent = 'Rekord med desse vala: ' + F.Storage.best(selected, c) + ' rette vegval.';
  }
  function select(pack, focusStart = true) {
    selected = pack;
    if (!F.Storage.list().some(item => item.id === pack.id) && pack !== sharedPack) { sharedPack = pack; refresh(); }
    $('pack-select').value = pack.id;
    const recommendation = pack.recommended; $('level-select').value = recommendation.level; $('reading-select').value = recommendation.reading; $('difficulty-select').value = recommendation.difficulty;
    view('setup'); updateSetup(); if (focusStart) $('start-button').focus();
  }
  const library = F.Library.create({ view, dialog, refresh, select });
  $('pack-select').addEventListener('change', () => { const pack = F.Storage.list().concat(sharedPack ? [sharedPack] : []).find(item => item.id === $('pack-select').value); if (pack) select(pack, false); });
  ['level-select', 'reading-select', 'difficulty-select', 'skin-select'].forEach(id => $(id).addEventListener('change', updateSetup));
  $('sound-input').checked = !!settings.sound; $('reduced-input').checked = settings.reduced === undefined ? matchMedia('(prefers-reduced-motion: reduce)').matches : !!settings.reduced;
  if (Array.from($('level-select').options).some(option => option.value === settings.level)) $('level-select').value = settings.level;
  if ([2, 4, 6].includes(settings.reading)) $('reading-select').value = settings.reading;
  if ([0, 1, 2].includes(settings.difficulty)) $('difficulty-select').value = settings.difficulty;
  async function start(nextConfig) {
    if ($('start-button').disabled) return;
    const issues = F.Questions.validate(selected);
    if (issues.length && !getConfig().level.startsWith('tutorial-') && !demoLevels.includes(getConfig().level)) { $('setup-message').textContent = 'Settet må rettast: ' + issues[0].message; $('setup-message').hidden = false; return; }
    $('start-button').disabled = true; $('setup-message').textContent = 'Lastar farkostar, kulissar og musikk …'; $('setup-message').hidden = false;
    try {
      config = nextConfig || { ...getConfig(), seed: Vy.newSeed(), offset: 0 };
      if (config.level !== 'endless' && !config.level.startsWith('tutorial-') && !demoLevels.includes(config.level)) config.difficulty = F.level(config.level).difficulty;
      const musicScene = config.level === 'polargeist-study' ? 7 : config.level === 'back-on-track-study' ? 6 : config.level === 'stereo-study' ? 5 : config.level === 'retray-probe' ? 4 : config.level === 'endless' || config.level.startsWith('tutorial-') ? 0 : F.level(config.level).scene;
      soundControls.stopPreview(); await F.Audio.init(musicScene); F.Audio.setVolumes(config.musicVolume, config.effectsVolume); F.Audio.setMuted(!config.sound); await F.Assets.load();
      if (document.hidden) throw new Error('Kom attende til fana og start spelet når du er klar.');
      $('setup-message').hidden = true;
      F.Storage.saveSettings({ ...getConfig() });
      engine = F.Engine.create(selected, config); bestPercent = F.Storage.bestPercent(config.level); $('question-board').hidden = true; retrayHud.hide(); render.reset(config, engine.state); errors.length = 0; paused = false; countdown = 0; feedbackUntil = 0;
      $('game-overlay').hidden = true; view('game'); input.enable(true); clock.clear(); previous = performance.now();
      F.Audio.start(engine.world.musicScene ?? engine.world.segment(0).scene); syncSound(); $('game-stage').focus({ preventScroll: true }); processEvents();
      cancelAnimationFrame(frame); frame = requestAnimationFrame(loop);
    } catch (error) { $('setup-message').textContent = error.message; $('setup-message').hidden = false; view('setup'); }
    finally { $('start-button').disabled = false; }
  }
  function restart() {
    if (!engine || currentView !== 'game' || paused) return;
    saveBestPercent();
    clearTimeout(deathTimer); engine.reset(); F.Audio.start(engine.world.musicScene ?? engine.world.segment(0).scene); render.reset(config, engine.state); clock.clear(); input.discardPress(); previous = performance.now(); processEvents();
  }
  function progressPercent() {
    if (!engine || !Number.isFinite(engine.world.end) || engine.world.end <= 0) return null;
    return engine.state.status === 'complete' ? 100 : Math.max(0, Math.min(99, Math.floor(engine.state.time / engine.world.end * 100)));
  }
  function saveBestPercent() {
    const percent = progressPercent();
    if (percent !== null && config) bestPercent = F.Storage.recordPercent(config.level, percent);
  }
  function flashProgress() {
    clearTimeout(deathProgressTimer);
    const percent = progressPercent();
    if (percent === null) return;
    const badge = $('death-progress');
    badge.textContent = percent + '%'; badge.hidden = false;
    badge.classList.remove('is-visible'); void badge.offsetWidth; badge.classList.add('is-visible');
    deathProgressTimer = setTimeout(() => { badge.hidden = true; badge.classList.remove('is-visible'); }, 1000);
  }
  function setIcon(button, name) {
    const icon = button.querySelector('[data-icon]');
    if (!icon) return;
    icon.dataset.icon = name; delete icon.dataset.iconDone; icon.replaceChildren(); hydrateIcons(button);
  }
  function processEvents() {
    engine.drain().forEach(event => {
      F.Audio.effect(event); render.notify(event, engine.state);
      if (event.type === 'mode') {
        F.Audio.setScene(engine.world.musicScene ?? engine.world.at(engine.state.time).scene);
      }
      if (!engine.world.demo && (event.type === 'answer' || event.type === 'complete')) F.Storage.progress(event, { ...config, mode: engine.state.player.mode });
      if (event.type === 'dead') {
        saveBestPercent();
        if (!engine.world.demo) F.Storage.record(selected, config, engine.state);
        flashProgress();
        if (event.reason === 'answer') {
          const chosen = event.detail.item.kind === 'flag' ? F.FlagQuestions.nameFor(event.detail.chosen) : event.detail.chosen;
          errors.push({ prompt: event.detail.item.prompt, correct: event.detail.item.correct, chosen }); if (errors.length > 100) errors.shift();
          $('question-text').textContent = 'Fasit: ' + event.detail.item.correct; $('question-help').textContent = 'Spørsmålet: ' + event.detail.item.prompt;
        } else { $('question-text').textContent = 'Krasj! Prøv på nytt.'; $('question-help').textContent = 'Same bane og spørsmålsrekkje.'; }
        feedbackUntil = performance.now() + (event.reason === 'answer' ? 1700 : 280);
        $('upper-answer').hidden = $('lower-answer').hidden = true;
        deathTimer = setTimeout(restart, 280);
      }
      if (event.type === 'complete') complete();
    });
  }
  function complete() {
    saveBestPercent();
    const score = engine.world.demo ? { best: 0, newRecord: false } : F.Storage.record(selected, config, engine.state);
    if (engine.world.demo) {
      $('result-title').textContent = config.level === 'polargeist-study' ? 'Utflukt med danning er fullført!' : config.level === 'back-on-track-study' ? 'Eidskvedet er fullført!' : config.level === 'stereo-study' ? 'Villrina i Gyllengarden er fullført!' : 'Sorgsalane er fullført!';
      $('result-text').textContent = engine.state.correct + (config.level === 'polargeist-study' ? ' rette flagg' : config.level === 'back-on-track-study' ? ' rette hovudstader' : ' rette gangestykke') + ' og heile bana fullført.';
      $('next-batch').hidden = true; view('result'); refresh(); $('replay-button').focus(); return;
    }
    $('result-title').textContent = engine.world.tutorial ? 'Øvinga er fullført!' : F.level(config.level).name + ' er fullført!';
    $('result-text').textContent = engine.world.tutorial ? 'Du har øvd på ' + F.mode(engine.state.player.mode).name.toLowerCase() + '. Prøv ei hovudbane eller ein ny modus.' : engine.state.correct + ' rette vegval. ' + (score.newRecord ? 'Ny rekord! ' : '') + 'Rekord med desse vala: ' + score.best + '.';
    $('next-batch').hidden = engine.world.tutorial || selected.questions.length <= engine.world.count;
    view('result'); refresh(); $('replay-button').focus();
  }
  function hud() {
    const state = engine.state, choice = engine.activeChoice();
    $('run-label').textContent = engine.world.demo ? (config.level === 'polargeist-study' ? 'Utflukt med danning' : config.level === 'back-on-track-study' ? 'Eidskvedet' : config.level === 'stereo-study' ? 'Villrina i Gyllengarden' : 'Sorgsalane') + ' · ' + state.correct + '/' + (engine.world.questionCount || engine.world.count - 1) + ' rette · forsøk ' + state.attempt : state.correct + ' rette · forsøk ' + state.attempt;
    const progress = progressPercent(); $('run-progress').textContent = progress === null ? '∞' : Math.max(bestPercent, progress) + '%';
    if (engine.world.demo) {
      $('question-board').hidden = $('upper-answer').hidden = $('lower-answer').hidden = true;
      retrayHud.update(choice, render.screen);
      return;
    }
    retrayHud.hide();
    if (choice && state.status === 'running') {
      $('question-board').hidden = false;
      $('question-text').textContent = choice.item.prompt; $('question-help').textContent = 'Vel vegen før avgjerdslina · ' + choice.remaining.toFixed(1) + ' s';
      ['upper', 'lower'].forEach(side => { const answer = $(side + '-answer'); answer.hidden = false; answer.textContent = (side === 'upper' ? 'Øvre: ' : 'Nedre: ') + choice[side]; answer.classList.toggle('is-selected', (state.player.y < F.Physics.SPLIT ? 'upper' : 'lower') === side); });
    } else if (state.status === 'running' && performance.now() > feedbackUntil) {
      $('question-board').hidden = true;
      $('upper-answer').hidden = $('lower-answer').hidden = true;
    }
  }
  function loop(now) {
    if (currentView !== 'game') return;
    const elapsed = Math.max(0, (now - previous) / 1000); previous = now;
    let alpha = 1;
    if (!paused && countdown <= now) {
      if (countdown) { countdown = 0; render.snap(engine.state); $('game-overlay').hidden = true; input.enable(true); F.Audio.resume(engine.world.musicScene ?? engine.world.at(engine.state.time).scene); }
      if (elapsed > 0.25) pause('Spelet tok ein pust i bakken. Hald fram når du er klar.');
      else alpha = clock.advance(elapsed, () => { const control = input.read(); engine.step(control); render.update(engine.state, control); processEvents(); }).alpha;
    } else if (!paused && countdown) $('overlay-title').textContent = 'Klar om ' + Math.ceil((countdown - now) / 1000);
    if (currentView === 'game') { render.draw(engine, config, alpha); hud(); frame = requestAnimationFrame(loop); }
  }
  function pause(reason) {
    if (currentView !== 'game' || paused) return;
    paused = true; countdown = 0; setIcon($('pause-button'), 'play'); $('pause-button').setAttribute('aria-label', 'Hald fram'); $('pause-button').title = 'Hald fram'; render.snap(engine.state); clearTimeout(deathTimer); input.enable(false); clock.clear(); F.Audio.pause();
    $('game-overlay').hidden = false; $('overlay-title').textContent = 'Pause'; $('overlay-text').textContent = reason || 'Hald fram når du er klar.'; $('resume-button').hidden = false;
  }
  function resume() {
    if (currentView !== 'game' || !paused || document.hidden) return;
    paused = false; setIcon($('pause-button'), 'pause'); $('pause-button').setAttribute('aria-label', 'Pause'); $('pause-button').title = 'Pause'; countdown = performance.now() + 2000; input.enable(false); clock.clear(); $('overlay-title').textContent = 'Klar om 2'; $('resume-button').hidden = true;
    F.Audio.init(engine.world.musicScene ?? engine.world.at(engine.state.time).scene).catch(error => Vy.toast(error.message));
    if (engine.state.status === 'dead') { engine.reset(); F.Audio.rewind(); render.reset(config, engine.state); processEvents(); }
  }
  function syncSound() { const label = config.sound ? 'Ljod på' : 'Ljod av'; $('game-sound').setAttribute('aria-label', label); $('game-sound').title = label; $('game-sound').setAttribute('aria-pressed', String(config.sound)); $('sound-input').checked = config.sound; }
  $('start-button').addEventListener('click', () => start());
  $('library-button').addEventListener('click', () => { library.render(); view('library'); });
  ['library-home', 'result-home'].forEach(id => $(id).addEventListener('click', () => { view('setup'); refresh(); }));
  $('save-shared').addEventListener('click', () => { const copy = structuredClone(selected); copy.id = Vy.uuid(); F.Storage.save(copy); sharedPack = null; refresh(); select(copy); Vy.toast('Ein lokal kopi er lagra.'); });
  $('pause-button').addEventListener('click', () => paused ? resume() : pause()); $('resume-button').addEventListener('click', resume);
  $('restart-button').addEventListener('click', restart);
  $('new-round-button').addEventListener('click', () => { saveBestPercent(); start({ ...config, seed: Vy.newSeed(), offset: 0 }); });
  $('leave-button').addEventListener('click', () => { saveBestPercent(); if (!engine.world.demo) F.Storage.record(selected, config, engine.state); view('setup'); refresh(); });
  $('game-sound').addEventListener('click', () => { config.sound = !config.sound; F.Audio.setMuted(!config.sound); F.Storage.saveSettings({ ...getConfig(), sound: config.sound }); syncSound(); });
  $('fullscreen-button').hidden = !VyrdepilFullscreen.isSupported;
  $('fullscreen-button').addEventListener('click', () => VyrdepilFullscreen.toggle($('game-view'), 'landscape'));
  $('errors-button').addEventListener('click', () => {
    pause('Sjå feila dine og hald fram når du er klar.'); const body = dialog('Feila dine');
    if (!errors.length) body.appendChild(Vy.el('p', '', 'Ingen feil svar i denne runden.'));
    else errors.forEach(error => { const item = Vy.el('div', 'vp-panel vp-panel--inset'); item.append(Vy.el('h3', '', error.prompt), Vy.el('p', '', 'Du valde: ' + error.chosen), Vy.el('p', '', 'Rett svar: ' + error.correct)); body.appendChild(item); });
  });
  $('next-batch').addEventListener('click', () => start({ ...config, offset: config.offset + engine.world.count }));
  $('replay-button').addEventListener('click', () => start({ ...config, seed: engine.world.demo ? Vy.newSeed() : config.seed }));
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
