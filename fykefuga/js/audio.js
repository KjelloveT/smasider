(function (root) {
  'use strict';
  const F = root.Fykefuga;
  let context, master, music, effects, instruments, timer, step = 0, next = 0, scene = 0, pendingScene = 0;
  let active = false, muted = true, musicVolume = .65, effectsVolume = .8, duckUntil = 0, tailTimer;
  function levels() {
    if (!context) return;
    const now = context.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : .68, now, .025);
    music.gain.setTargetAtTime(musicVolume * (now < duckUntil ? .42 : 1), now, .025);
    effects.gain.setTargetAtTime(effectsVolume, now, .018);
  }
  function init() {
    clearTimeout(tailTimer);
    if (context) return context.resume().catch(() => {});
    const Audio = root.AudioContext || root.webkitAudioContext;
    if (!Audio) return Promise.resolve();
    try {
      context = new Audio({ latencyHint: 'interactive' });
      ({ master, music, effects, instruments } = F.Mixer.create(context)); master.gain.value = 0; levels();
    } catch (_) { context = null; }
    return context ? context.resume().catch(() => {}) : Promise.resolve();
  }
  function schedule() {
    if (!active || !context || context.state !== 'running') return;
    levels(); if (next < context.currentTime) next = context.currentTime + .015;
    let count = 0;
    while (next < context.currentTime + .13 && count++ < 8) {
      // Modusskiftet held pulsen; ny sats kjem inn på neste taktstrek.
      if (step % F.Score.stepsPerBar(scene) === 0 && pendingScene !== scene) { scene = pendingScene; step = 0; }
      if (!muted && musicVolume > 0) F.Score.eventsAt(scene, step).forEach(event => instruments.note(event, next + event.delay));
      next += F.Score.quaver(scene); step++;
    }
  }
  function start(newScene) {
    if (!context) return;
    clearTimeout(tailTimer);
    scene = pendingScene = newScene; active = true; step = 0; next = context.currentTime + .025;
    clearInterval(timer); timer = setInterval(schedule, 35); schedule();
  }
  function stop(tail) {
    active = false; clearInterval(timer); clearTimeout(tailTimer);
    if (instruments) instruments.clear(tail ? music : null);
    if (context && tail && !muted) tailTimer = setTimeout(() => stop(), 1700);
    else if (context) context.suspend().catch(() => {});
  }
  function setMuted(value) { muted = !!value; levels(); }
  function setVolumes(musicLevel, effectsLevel) { musicVolume = Math.max(0, Math.min(1, musicLevel / 100)); effectsVolume = Math.max(0, Math.min(1, effectsLevel / 100)); levels(); }
  function effect(event) {
    if (!context || muted || effectsVolume === 0 || context.state !== 'running') return;
    const kind = typeof event === 'string' ? event : event.type, mode = event.mode || '', time = context.currentTime + .002;
    const pluck = (midi, delay, duration, velocity, pan) => instruments.note({ instrument: 'cembalo', midi, duration, velocity, pan }, time + delay, effects);
    if (kind === 'dead') {
      duckUntil = time + .24; instruments.rustle(time, .13, .16, 2300); instruments.sweep(260, 78, .18, .21, time, 'triangle');
      [67, 63, 58].forEach((n, i) => pluck(n, i * .038, .095, .1, 0));
    } else if (kind === 'answer') {
      duckUntil = time + .38; [72, 76, 79, 84].forEach((n, i) => pluck(n, i * .042, .24, .23, (i - 1.5) * .15));
      instruments.note({ instrument: 'organ', midi: 60, duration: .32, velocity: .09, pan: 0 }, time, effects);
    } else if (kind === 'complete') {
      duckUntil = time + 1.7; [72, 76, 79, 84, 83, 79, 86, 84].forEach((n, i) => pluck(n, i * .105, i === 7 ? .65 : .18, .2, -.12));
      [48, 60, 64, 67].forEach(n => instruments.note({ instrument: 'organ', midi: n, duration: 1.2, velocity: .065, pan: .12 }, time + .74, effects));
    } else if (kind === 'mode') {
      [67, 74, 79].forEach((n, i) => pluck(n, i * .025, .14, .09, .1)); instruments.sweep(350, 1000, .13, .035, time);
    } else if (kind === 'teleport') {
      instruments.sweep(240, 1400, .09, .10, time); instruments.rustle(time, .08, .045, 4600); pluck(88, .025, .1, .085, 0);
    } else if (kind === 'turn') {
      instruments.sweep(600, 300, .08, .075, time); pluck(76, 0, .08, .085, 0);
    } else if (kind === 'land') {
      instruments.sweep(110, 55, .06, .07, time, 'triangle'); instruments.rustle(time, .055, .028, 1800);
    } else if (kind === 'jump') {
      instruments.sweep(mode === 'ufo' ? 370 : 170, mode === 'ufo' ? 820 : 390, .085, .095, time, 'triangle'); pluck(mode === 'robot' ? 79 : 84, .004, .065, .045, -.08);
    }
    levels();
  }
  F.Audio = { init, start, stop, setMuted, setVolumes, effect, setScene(value) { pendingScene = value; } };
})(window);
