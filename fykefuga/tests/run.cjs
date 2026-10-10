const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const context = vm.createContext({ console, URL, URLSearchParams, TextEncoder, TextDecoder, Blob, CompressionStream, DecompressionStream, btoa, atob, setTimeout, clearTimeout, crypto: crypto.webcrypto, document: { addEventListener() {} } });
context.window = context;
for (const file of ['js/vyrdepil-util.js', 'js/vyrdepil-share.js', 'fykefuga/js/data.js', 'fykefuga/js/questions.js', 'fykefuga/js/physics.js', 'fykefuga/js/levels.js', 'fykefuga/js/engine.js', 'fykefuga/js/score.js', 'fykefuga/js/effects.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const F = context.Fykefuga;
let assertions = 0;
function check(condition, message) { assert.ok(condition, message); assertions++; }
const input = { held: false, pressed: false, released: false };
// Dei same tidsstempla for input, uavhengig av render-frekvens.
for (const mode of F.modes) {
  const results = [30, 60, 120, 144].map(rate => {
    const player = F.Physics.player(mode.id), clock = F.Physics.accumulator();
    let tick = 0;
    for (let frame = 0; frame < rate * 4; frame++) clock.advance(1 / rate, () => {
      const phase = tick % 72;
      F.Physics.update(player, { held: phase < 32, pressed: phase === 0, released: phase === 32 }); tick++;
    });
    return [player.y, player.velocity, player.gravity, tick];
  });
  for (const result of results) check(JSON.stringify(result) === JSON.stringify(results[0]), mode.id + ': fysikken varierer med skjermfrekvens');
  for (const side of ['upper', 'lower']) {
    const player = F.Physics.player(mode.id);
    for (let tick = 0; tick < 480; tick++) {
      const upward = side === 'upper';
      let control;
      if (mode.id === 'cube') control = { held: upward && tick >= 450 };
      else if (mode.id === 'robot') control = { held: upward && tick >= 450, pressed: upward && tick === 450 };
      else if (['ball', 'spider', 'swing'].includes(mode.id)) control = { held: upward, pressed: upward && tick === 0 };
      else if (mode.id === 'ufo') control = { held: upward, pressed: upward && tick % 30 === 0 };
      else control = { held: upward };
      F.Physics.update(player, control);
    }
    check((player.y < F.Physics.SPLIT ? 'upper' : 'lower') === side, mode.id + ': svarvegen ' + side + ' kan ikkje nåast');
  }
}
const pack = F.builtins[2];
check(F.Questions.validate(pack).length === 0, 'Standardlista er ugyldig');
const long = structuredClone(pack); long.questions[0].prompt = 'x'.repeat(61);
check(F.Questions.validate(long).some(issue => issue.row === 1), 'Langt spørsmål blir ikkje merkt');
const synonym = structuredClone(pack); synonym.questions[0].accepted = ['hund'];
check(!F.Questions.alternatives(synonym, synonym.questions[0]).includes('hund'), 'Godkjend variant vart feilalternativ');
const duplicate = structuredClone(pack); duplicate.questions[1].prompt = duplicate.questions[0].prompt;
check(F.Questions.validate(duplicate).some(issue => issue.message.includes('fasitar')), 'Tvitydige spørsmål blir ikkje merkte');
assert.throws(() => F.Questions.parsePairs('berre eitt felt')); assertions++;
const imported = F.Questions.fromOrdaklok({ app: 'ordaklok', title: 'Æ ø å', pairs: [{ a: 'cat', b: 'katt', alts: ['pus'] }, { a: 'dog', b: 'hund' }] });
check(imported.questions[0].accepted.includes('pus'), 'Ordaklok-variant vart borte');
for (const mode of F.modes) for (let variant = 0; variant < 2; variant++) for (let difficulty = 0; difficulty < 3; difficulty++) {
  const hazards = F.Levels.obstacles(mode.id, 0, difficulty, variant);
  check(hazards.every(h => h.x / 310 < 5.2 && h.w / 310 + h.x / 310 < 5.2), 'Hinder ligg i lesestrekninga');
  // Ein enkel kontrollpolicy provar at kvart av dei endelege byggjestykka er framkomeleg.
  const p = F.Physics.player(mode.id);
  let alive = true;
  for (let tick = 0; tick < 624 && alive; tick++) {
    const time = tick / 120, x = time * 310;
    const next = hazards.find(h => h.x + h.w > x - 14);
    const near = next && (next.x - x) / 310 < (['cube', 'robot'].includes(mode.id) ? 0.30 : 0.5);
    let held = false, pressed = false;
    if (['cube', 'robot'].includes(mode.id)) { held = !!near; pressed = !!near && p.grounded; }
    else if (['ball', 'spider'].includes(mode.id)) {
      pressed = !!near && p.grounded && (next.y > 300 ? p.gravity === 1 : p.gravity === -1);
    } else {
      const target = next ? (next.y > 300 ? 245 : 360) : 320;
      held = p.y > target;
      if (mode.id === 'ufo') pressed = held && p.velocity > -100;
      if (mode.id === 'swing') pressed = held ? p.gravity === 1 && p.velocity > -100 : p.gravity === -1 && p.velocity < 100;
    }
    F.Physics.update(p, { held, pressed });
    alive = !hazards.some(h => F.Physics.collision(x, x + 310 / 120, p, h));
  }
  check(alive, 'Uframkomeleg byggjestykke: ' + mode.id + ', nivå ' + difficulty + ', variant ' + variant);
}
check(F.Physics.collision(0, 100, { mode: 'wave', y: 250, previousY: 250 }, { x: 50, y: 230, w: 2, h: 40 }), 'Tynn hindring vart hoppa over');
const engine = F.Engine.create(pack, { level: 'marmor', seed: 42, reading: 4, offset: 0 });
const before = Array.from({ length: 4 }, (_, index) => engine.getChoice(index).item.id);
const placements = Array.from({ length: 4 }, (_, index) => engine.getChoice(index).correctSide);
engine.reset();
check(JSON.stringify(before) === JSON.stringify(Array.from({ length: 4 }, (_, i) => engine.getChoice(i).item.id)), 'Omstart endrar spørsmålsrekkja');
let changed = false;
for (let retry = 0; retry < 5; retry++) {
  engine.reset();
  changed ||= JSON.stringify(placements) !== JSON.stringify(Array.from({ length: 4 }, (_, i) => engine.getChoice(i).correctSide));
}
check(changed, 'Svarplasseringa varierer aldri');
const robotChoices = new WeakMap();
function control(run, tick) {
  const state = run.state, segment = run.world.at(state.time), p = state.player, mode = p.mode;
  const choice = state.time >= segment.questionAt && !run.world.tutorial ? run.getChoice(segment.index) : null;
  if (choice) {
    const upper = choice.correctSide === 'upper';
    if (['cube', 'robot'].includes(mode)) {
      const held = upper && state.time >= segment.questionAt + 0.5;
      if (!robotChoices.has(run)) robotChoices.set(run, new Set());
      const choices = robotChoices.get(run), pressed = held && p.grounded && !choices.has(segment.index);
      if (pressed) choices.add(segment.index);
      return { held, pressed };
    }
    if (['ball', 'spider', 'swing'].includes(mode)) return { held: upper, pressed: p.gravity !== (upper ? -1 : 1) && (mode === 'swing' || p.grounded) };
    return { held: upper, pressed: mode === 'ufo' && upper && tick % 24 === 0 };
  }
  const next = segment.obstacles.find(h => h.x + h.w > state.x - 14);
  const near = next && (next.x - state.x) / 310 < (['cube', 'robot'].includes(mode) ? 0.3 : 0.5);
  if (['cube', 'robot'].includes(mode)) return { held: !!near, pressed: !!near && p.grounded };
  if (['ball', 'spider'].includes(mode)) return { held: false, pressed: !!near && p.grounded && (next.y > 300 ? p.gravity === 1 : p.gravity === -1) };
  const target = next ? (next.y > 300 ? 245 : 360) : 320, held = p.y > target;
  return { held, pressed: mode === 'ufo' ? held && p.velocity > -100 : mode === 'swing' ? held ? p.gravity === 1 && p.velocity > -100 : p.gravity === -1 && p.velocity < 100 : false };
}
for (const reading of [2, 4, 6]) for (const level of F.levels) {
  const run = F.Engine.create(pack, { level: level.id, reading, seed: 735, offset: 0 });
  let tick = 0;
  while (run.state.status === 'running' && tick < 20000) { run.step(control(run, tick++)); }
  check(run.state.status === 'complete', level.id + ': heil bane feila ved lesetid ' + reading + ', tid ' + run.state.time + ', modus ' + run.state.player.mode);
  check(run.state.correct === level.modes.length, 'Bana hoppa over eit vegval');
}
for (const reading of [2, 4, 6]) for (const difficulty of [0, 1, 2]) for (const seed of [21, 872, 91234]) {
  const run = F.Engine.create(pack, { level: 'endless', reading, difficulty, seed, offset: 0 });
  let tick = 0;
  while (run.state.status === 'running' && run.state.correct < 100) { run.step(control(run, tick++)); }
  check(run.state.status === 'running' && run.state.correct === 100, 'Endelaus overgang feila: seed ' + seed + ', lesetid ' + reading + ', nivå ' + difficulty + ', tid ' + run.state.time + ', modus ' + run.state.player.mode);
}
// Kontroller den faktisk publiserte rasterbanken, ikkje berre filendingane i koden.
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'fykefuga/assets/manifest.json'), 'utf8'));
for (const asset of manifest.files) {
  const bytes = fs.readFileSync(path.join(root, 'fykefuga/assets', asset.file));
  check(bytes.length <= 500 * 1024 && bytes.length === asset.bytes, 'Bilete bryt storleiksgrensa');
  check(crypto.createHash('sha256').update(bytes).digest('hex') === asset.sha256, 'Ressursoversikta er utdatert');
  check(asset.file.endsWith('.png') ? bytes.subarray(1, 4).toString() === 'PNG' : bytes[0] === 255 && bytes[1] === 216, 'Ressursen er ikkje eit rasterbilete');
}
for (const directory of ['fykefuga/js', 'fykefuga/css']) for (const file of fs.readdirSync(path.join(root, directory))) {
  const text = fs.readFileSync(path.join(root, directory, file), 'utf8');
  check(!/<svg[\s>]|\.svg\b|image\/svg/i.test(text), 'SVG vart brukt i speldesignet');
  check(!/\blocalStorage\b/.test(text), 'Direkte lokal lagring i spelet');
  if (file.endsWith('.js')) check(text.split('\n').length <= 400, 'Modulen må splittast');
}
(async () => {
  const share = context.VyrdepilShare;
  for (const data of [pack, { app: 'ordaklok', title: 'Æ ø å', pairs: [{ a: 'blå', b: 'blue' }] }]) {
    const encoded = await share.encode(data);
    const decoded = await share.decodeFromParams(new URLSearchParams({ [encoded.param]: encoded.value }));
    check(JSON.stringify(decoded) === JSON.stringify(data), 'Deling mistar innhald');
    const raw = Buffer.from(JSON.stringify(data)).toString('base64url');
    check(JSON.stringify(await share.decodeFromParams(new URLSearchParams({ d: raw }))) === JSON.stringify(data), 'Eldre ukomprimert lenkje verkar ikkje');
  }
  const url = await share.buildUrl(pack, 'https://example.org/fykefuga/?private=1');
  check(new URL(url).search === '' && new URL(url).hash.startsWith('#'), 'Delinga legg data i spørjestrengen');
  await assert.rejects(() => share.decodeFromParams(new URLSearchParams({ d: '!invalid' }))); assertions++;
  const zlib = require('node:zlib');
  const oldList = { app: 'ordaklok', version: 1, title: 'Gamle gloser æøå', pairs: [{ a: 'cat', b: 'katt', alts: ['pus'] }, { a: 'dog', b: 'hund' }] };
  const legacyGzip = zlib.gzipSync(Buffer.from(JSON.stringify(oldList))).toString('base64url');
  check(JSON.stringify(await share.decodeFromParams(new URLSearchParams({ dz: legacyGzip }))) === JSON.stringify(oldList), 'Eldre gzip-lenkje verkar ikkje');
  const bomb = zlib.gzipSync(Buffer.from('x'.repeat(2 * 1024 * 1024 + 1))).toString('base64url');
  await assert.rejects(() => share.decodeFromParams(new URLSearchParams({ dz: bomb }))); assertions++;
  const malformed = structuredClone(pack); malformed.questions[0].prompt = { value: 'tekst' };
  assert.throws(() => F.Questions.normalizePack(malformed)); assertions++;
  context.location = { origin: 'https://example.org', pathname: '/ordaklok/index.html', search: '?d=old&keep=1', hash: '#d=new' };
  let replaced;
  context.history = { replaceState(a,b,url) { replaced = url; } };
  vm.runInContext(fs.readFileSync(path.join(root,'ordaklok/js/share.js'),'utf8'),context);
  check(context.OrdaklokShare.readParams().get('d') === 'new', 'Fragmentet må vinne over den eldre spørjestrengen');
  context.location.hash = '';
  check(context.OrdaklokShare.readParams().get('d') === 'old', 'Gamle Ordaklok-spørjestrengar vart borte');
  context.OrdaklokShare.scrubLegacyQuery();
  check(replaced === '/ordaklok/index.html?keep=1', 'Oppryddinga fjernar andre parametrar');
  check((await context.OrdaklokShare.buildShareUrl(oldList)).includes('#dz='), 'Ordaklok lagar ikkje fragmentlenkje');
  let stored, badges = [], snapshot;
  context.VyrdepilStorage = {
    getGameState() { return stored ? structuredClone(stored) : null; },
    setGameState(app, value) { check(app === 'fykefuga', 'Lagring under feil app'); stored = structuredClone(value); },
    updateBragdProgress(app, value) { snapshot = structuredClone(value); },
    recordBadge(app, id) { if (!badges.includes(id)) badges.push(id); },
    getBragdData() { return { badges: { fykefuga: badges } }; }
  };
  vm.runInContext(fs.readFileSync(path.join(root,'fykefuga/js/storage.js'),'utf8'),context);
  const baseConfig = { level: 'marmor', reading: 4, difficulty: 0 };
  F.Storage.save(pack);
  check(F.Storage.list().some(item => item.id === pack.id), 'Lagra spørsmålsett vart borte');
  check(F.Storage.key(pack,baseConfig) !== F.Storage.key(pack,{...baseConfig,reading:6}), 'Ulike lesetider deler rekord');
  const changedPack = structuredClone(pack); changedPack.questions[0].correct += '!';
  check(F.Storage.key(pack,baseConfig) !== F.Storage.key(changedPack,baseConfig), 'Endra spørsmål deler gammal rekord');
  F.Storage.record(pack,baseConfig,{correct:3,time:31,status:'dead'});
  check(F.Storage.best(pack,baseConfig) === 3, 'Rekorden vart ikkje lagra');
  stored.progress.correct = 99; // Ei anna fane har skrive sidan modulen vart lasta.
  F.Storage.saveSettings({sound:false});
  check(F.Storage.progressData().correct === 99, 'Ei anna fane sin framgang vart skriven over');
  check(!F.Storage.unlocked('porcelain') && !F.Storage.unlocked('copper'), 'Kosmetikk vart opna for tidleg');
  F.Storage.progress({type:'answer',correct:1},{...baseConfig,mode:'cube'});
  check(F.Storage.unlocked('copper'), '100 rette vegval opnar ikkje kopar');
  F.Storage.progress({type:'complete',tutorial:false,mode:'cube'},baseConfig);
  check(F.Storage.unlocked('porcelain') && badges.includes('fyrste-bane'), 'Fyrste hovudbane opnar ikkje porselen og bragd');
  for (const level of F.levels) F.Storage.progress({type:'complete',tutorial:false,mode:'cube'},{...baseConfig,level:level.id});
  for (const mode of F.modes) F.Storage.progress({type:'complete',tutorial:true,mode:mode.id},{...baseConfig,level:'tutorial-'+mode.id});
  F.Storage.progress({type:'answer',correct:25},{...baseConfig,level:'endless',mode:'wave'});
  check(badges.includes('alle-banene') && badges.includes('alle-modusane') && badges.includes('tjuefem-vegval'), 'Bragdvilkåra blir ikkje evaluerte');
  check(Object.values(snapshot).every(value=>Number.isFinite(value)), 'Bragd-samandraget inneheld namn eller datoar');
  const keyboard = {}, pointer = {};
  context.document = { addEventListener(type,handler) { keyboard[type] = handler; } };
  context.addEventListener = () => {};
  vm.runInContext(fs.readFileSync(path.join(root,'fykefuga/js/input.js'),'utf8'),context);
  const controls = F.Input.create({ addEventListener(type,handler) { pointer[type] = handler; }, setPointerCapture() {} },()=>{},()=>{});
  controls.enable(true);
  const keyEvent = { code:'Space',target:{tagName:'DIV'},repeat:false,preventDefault(){} };
  keyboard.keydown(keyEvent); keyboard.keyup(keyEvent);
  const tap = controls.read();
  check(tap.pressed && !tap.held && !controls.read().pressed, 'Eit svært kort trykk vart mista eller gjenteke');
  const cube = F.Physics.player('cube'); F.Physics.update(cube,tap);
  check(cube.y < F.Physics.BOTTOM, 'Kort trykk gjev ikkje respons neste fysikksteg');
  keyboard.keydown(keyEvent); pointer.pointerdown({button:0,pointerId:1,preventDefault(){}}); keyboard.keyup(keyEvent);
  check(controls.read().held, 'Slepp av tast kansellerer ein annan kontroll');
  pointer.pointercancel({pointerId:1}); check(!controls.read().held, 'Avbroten berøring held fram');
  keyboard.keydown(keyEvent); controls.discardPress();
  const restartControl = controls.read(); check(restartControl.held && !restartControl.pressed, 'Omstart mistar halde kontroll eller finn på eit nytt trykk');
  controls.enable(false); keyboard.keydown(keyEvent); check(!controls.read().held, 'Kontroll blir teken imot under pause');
  for (let scene = 0; scene < 4; scene++) {
    const bars = F.Score.stepsPerBar(scene) * 16;
    const notes = Array.from({length:bars}, (_,step)=>F.Score.eventsAt(scene,step)).flat();
    check(notes.length > 200 && notes.every(note => Number.isFinite(note.midi) && note.midi >= 24 && note.midi < 100 && note.duration > 0 && note.velocity > 0 && note.delay >= 0), 'Musikksatsen har ugyldige eller manglande notar');
    check(new Set(notes.map(note=>note.instrument)).size === 4, 'Satsen manglar ei instrumentgruppe');
    check(JSON.stringify(F.Score.eventsAt(scene,0)) === JSON.stringify(F.Score.eventsAt(scene,bars)), 'Satsen får eit brot ved gjentaking');
  }
  check(F.Score.stepsPerBar(2) === 6, 'Menuetten må ha tretakt');
  const presentation = F.Effects.create(); presentation.reset({skin:'gold',reduced:false});
  const visualState = { player:F.Physics.player('wave'),status:'running',x:0 };
  for (let step = 0; step < 600; step++) {
    visualState.x += 310 * F.Physics.STEP; F.Physics.update(visualState.player,{held:step%90<45});
    const before = JSON.stringify(visualState); presentation.update(visualState,{held:true});
    if (step === 599) check(before === JSON.stringify(visualState), 'Spor eller partiklar endrar fysikk eller speltilstand');
  }
  check(presentation.count <= 120 && presentation.trailCount <= 30 && presentation.trailCount > 10, 'Presentasjonen har ubunde ressursbruk eller manglar spor');
  presentation.reset({skin:'gold',reduced:true});
  presentation.notify({type:'dead'},visualState); presentation.update(visualState,{held:true});
  check(presentation.count === 0 && presentation.trailCount === 0 && presentation.shake === 0, 'Redusert dekor gir framleis skjermristing eller partiklar');
  process.stdout.write(assertions + ' meiningsfulle kontrollar bestod.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
