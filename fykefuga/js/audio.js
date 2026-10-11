(function (root) {
  'use strict';
  const F = root.Fykefuga;
  let context, master, music, effects, instruments, player, timer, tailTimer, suspendTimer;
  let active = false, muted = true, musicVolume = .65, effectsVolume = .8, duckUntil = 0;
  function levels() {
    if (!master) return;
    const now = context.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : .68, now, .025);
    music.gain.setTargetAtTime(musicVolume * (now < duckUntil ? .42 : 1), now, .025);
    effects.gain.setTargetAtTime(effectsVolume, now, .018);
  }
  async function init(scene) {
    clearTimeout(tailTimer); clearTimeout(suspendTimer);
    const Audio = root.AudioContext || root.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio({ latencyHint: 'interactive' });
      ({ master, music, effects, instruments } = F.Mixer.create(context));
      master.gain.value = 0; player = F.Music.create(context, music); levels();
    }
    // Resume from the user gesture, before awaiting any downloads.
    const resumed = context.resume();
    await Promise.all([F.Music.prepare(context, scene === undefined ? 0 : scene), resumed]);
  }
  function report(error) { stop(); Vy.toast(error.message || 'Musikken kunne ikkje klargjerast. Prøv på nytt.'); }
  function run(scene, resume) {
    if (!player) return;
    clearTimeout(tailTimer); clearTimeout(suspendTimer); duckUntil = 0;
    active = true; instruments.clear();
    clearInterval(timer); timer = setInterval(levels, 35); levels();
    (resume ? player.resume(scene) : player.start(scene)).catch(report);
  }
  function stop(tail) {
    active = false; clearInterval(timer); clearTimeout(tailTimer); clearTimeout(suspendTimer);
    if (player) player.stop();
    if (instruments) instruments.clear(tail ? music : null);
    if (context && tail && !muted) tailTimer = setTimeout(() => stop(), 1700);
    else if (context) suspendTimer = setTimeout(() => context.suspend().catch(() => {}), 20);
  }
  function pause() {
    active = false; clearInterval(timer); clearTimeout(tailTimer); clearTimeout(suspendTimer);
    if (player) player.pause();
    if (instruments) instruments.clear();
    if (context) suspendTimer = setTimeout(() => context.suspend().catch(() => {}), 20);
  }
  function setMuted(value) { muted = !!value; levels(); }
  function setVolumes(musicLevel, effectsLevel) { musicVolume = Math.max(0, Math.min(1, musicLevel / 100)); effectsVolume = Math.max(0, Math.min(1, effectsLevel / 100)); levels(); }
  function effect(event) {
    if (!context || muted || effectsVolume === 0 || context.state !== 'running') return;
    const kind = typeof event === 'string' ? event : event.type, mode = event.mode || '', time = context.currentTime + .002;
    const pluck = (midi, delay, duration, velocity, pan) => instruments.note({ instrument: 'cembalo', midi, duration, velocity, pan }, time + delay, effects);
    if (kind === 'dead') {
      duckUntil = time + .24; instruments.rustle(time, .19, .24, 3200); instruments.impact(time, 82, .22, .19);
    } else if (kind === 'answer') {
      duckUntil = time + .38; [72, 76, 79, 84].forEach((n, i) => pluck(n, i * .042, .24, .23, (i - 1.5) * .15));
      instruments.note({ instrument: 'organ', midi: 60, duration: .32, velocity: .09, pan: 0 }, time, effects);
    } else if (kind === 'complete') {
      duckUntil = time + 1.7; [72, 76, 79, 84, 83, 79, 86, 84].forEach((n, i) => pluck(n, i * .105, i === 7 ? .65 : .18, .2, -.12));
      [48, 60, 64, 67].forEach(n => instruments.note({ instrument: 'organ', midi: n, duration: 1.2, velocity: .065, pan: .12 }, time + .74, effects));
    } else if (kind === 'mode') {
      instruments.rustle(time, .16, .06, 4000); instruments.impact(time, 620, .25, .08);
    } else if (kind === 'teleport') {
      instruments.rustle(time, .17, .14, 5200); instruments.impact(time, 980, .2, .10);
    } else if (kind === 'turn') {
      instruments.impact(time, 510, .085, .13); instruments.rustle(time, .1, .045, 2800);
    } else if (kind === 'land') {
      instruments.impact(time, 94, .1, .1); instruments.rustle(time, .075, .06, 1900);
    } else if (kind === 'jump') {
      instruments.rustle(time, .14, .11, mode === 'ufo' ? 4300 : 2400); instruments.impact(time, mode === 'robot' ? 210 : 145, .1, .07);
    }
    levels();
  }
  F.Audio = { init, start(scene) { run(scene, false); }, resume(scene) { run(scene, true); }, stop, pause,
    rewind() { if (player) player.rewind(); }, setMuted, setVolumes, effect,
    setScene(scene) { if (player && active) player.setScene(scene).catch(report); },
    status() { return { context: context ? context.state : 'uninitialised', active, muted, musicVolume, effectsVolume,
      music: player ? player.status() : null }; } };
})(window);
