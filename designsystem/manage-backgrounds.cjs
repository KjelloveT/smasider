// Fordeling blir lagra i repoet, aldri i nettlesaren. Køyr frå kva mappe som helst.
const fs = require('node:fs');
const path = require('node:path');
const { randomInt } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'json/vyrdepil-design.json');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
function validate(registry, manifest) {
  const ids = new Set();
  const owners = new Set();
  const appIds = new Set(manifest.apps.map(app => app.id));
  for (const background of registry.backgrounds) {
    if (ids.has(background.id)) throw new Error(`Duplikat: ${background.id}`);
    ids.add(background.id);
    if (!background.file.startsWith('_resources/vyrdepil-design/') || !fs.existsSync(path.join(root, background.file))) throw new Error(`Manglar bilete: ${background.file}`);
    if (background.assignedTo) {
      if (owners.has(background.assignedTo)) throw new Error(`Appen har fleire bakgrunnar: ${background.assignedTo}`);
      // Ei sletta app held reservasjonen til ho blir frigjeven med eit medvite val.
      owners.add(background.assignedTo);
    }
  }
  if (!registry.home?.backgroundId) throw new Error('Framsida manglar fast bakgrunn.');
  const homeBackground = registry.backgrounds.find(item => item.id === registry.home.backgroundId);
  if (!homeBackground || homeBackground.assignedTo) throw new Error(`Ugyldig reservasjon for framsida: ${registry.home.backgroundId}`);
  for (const [appId, assignment] of Object.entries(registry.apps)) {
    const background = registry.backgrounds.find(item => item.id === assignment.backgroundId);
    if (!background || background.assignedTo !== appId) throw new Error(`Ugyldig reservasjon: ${appId}`);
  }
  for (const background of registry.backgrounds) {
    if (background.assignedTo && registry.apps[background.assignedTo]?.backgroundId !== background.id) throw new Error(`Reservasjonen er ikkje samsvarande: ${background.id}`);
  }
  for (const file of Object.values(registry.logo.files)) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Manglar logo: ${file}`);
  }
  const homeReserved = 1;
  return { backgrounds: ids.size, assigned: owners.size, homeReserved, available: ids.size - owners.size - homeReserved, catalogued: appIds.size };
}
function assign(registry, appIds) {
  const missing = appIds.filter(id => !registry.apps[id]);
  const available = registry.backgrounds.filter(item => !item.assignedTo && item.id !== registry.home?.backgroundId);
  if (missing.length > available.length) throw new Error('Ingen ledige bakgrunnar. Utvid banken før du legg til fleire appar.');
  for (const appId of missing) {
    const index = randomInt(available.length);
    const background = available.splice(index, 1)[0];
    background.assignedTo = appId;
    registry.apps[appId] = { backgroundId: background.id };
  }
  return missing;
}
function save(registry) {
  const temporary = `${registryPath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`);
  fs.renameSync(temporary, registryPath);
}
function main() {
  const manifest = read('json/apps.json');
  const [command = 'check', appId] = process.argv.slice(2);
  let registry;
  if (command === 'init') {
    if (fs.existsSync(registryPath)) throw new Error('Designregisteret finst alt. Bruk assign-new; eksisterande val skal stå fast.');
    const bank = read('designsystem/illustration-bank.json');
    registry = {
      version: 1, updated: '2026-09-28',
      appCatalog: 'json/apps.json',
      policy: { allocation: 'random-unused-on-creation', stableAcrossLoads: true, releaseRemovedAppsAutomatically: false },
      home: { backgroundId: 'bypark-sommar-dag' },
      logo: { style: 'mala', name: 'Måla flater', files: Object.fromEntries(bank.outputs.filter(item => item.kind === 'logo' && item.variant === 'mala').map(item => [item.subject, item.file])) },
      scenes: bank.scenes.map(({ id, name }) => ({ id, name })),
      seasons: bank.seasons, times: bank.times,
      backgrounds: bank.outputs.filter(item => item.kind === 'landscape').map(item => ({ id: item.key, scene: item.subject, season: item.variant.split('-')[0], time: item.variant.split('-')[1], file: item.file, sourceSize: item.sourceSize, assignedTo: null })),
      apps: {}
    };
    const duldord = registry.backgrounds.find(item => item.id === 'sykkelsti-sommar-kveld');
    duldord.assignedTo = 'duldord';
    registry.apps.duldord = { backgroundId: duldord.id };
    assign(registry, manifest.apps.map(app => app.id));
  } else {
    registry = read('json/vyrdepil-design.json');
    validate(registry, manifest);
    if (command === 'assign') {
      if (!manifest.apps.some(app => app.id === appId)) throw new Error('Appen må fyrst leggjast til i json/apps.json.');
      assign(registry, [appId]);
    } else if (command === 'assign-new') assign(registry, manifest.apps.map(app => app.id));
    else if (command !== 'check') throw new Error('Bruk check, assign <app-id> eller assign-new.');
  }
  const result = validate(registry, manifest);
  const unassigned = manifest.apps.filter(app => !registry.apps[app.id]).map(app => app.id);
  if (command === 'check' && unassigned.length) throw new Error(`Må fordelast: ${unassigned.join(', ')}`);
  if (command !== 'check') {
    registry.updated = new Date().toISOString().slice(0, 10);
    save(registry);
  }
  console.log(JSON.stringify({ ...result, unassigned }));
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { assign, validate };
