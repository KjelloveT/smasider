(function (root) {
  'use strict';
  const O = root.Ordbas;
  const api = VyrdepilStorage;
  const integer = value => Number.isFinite(value) ? Math.min(1000000, Math.max(0, Math.floor(value))) : 0;
  function settings(raw = {}) {
    const defaults = O.Config.defaults;
    let classes = O.Config.classes.map(c => c.id).filter(id => Array.isArray(raw.classes) && raw.classes.includes(id));
    if (classes.length < 2) classes = defaults.classes.slice();
    const mode = O.Config.modes.some(m => m.id === raw.mode) ? raw.mode : defaults.mode;
    if (mode === 'pairs') classes = ['adjektiv','adverb'];
    return { mode, classes, level: [1,2,3,4].includes(Number(raw.level)) ? Number(raw.level) : 1, count: [5,8,12].includes(Number(raw.count)) ? Number(raw.count) : 8, showMeaning: raw.showMeaning === true };
  }
  function read() {
    const raw = api.getGameState('ordbas') || {};
    const progress = {};
    O.Config.classes.forEach(c => {
      progress[c.id] = {};
      for (let level = 1; level <= 4; level++) {
        const bucket = raw.progress && raw.progress[c.id] && raw.progress[c.id][level] || {};
        progress[c.id][level] = {
          completed: integer(bucket.completed), firstTry: Math.min(integer(bucket.firstTry), integer(bucket.completed)),
          recent: Array.isArray(bucket.recent) ? bucket.recent.filter(x => x && typeof x.ok === 'boolean' && O.Content.get(x.id)).slice(-10).map(x => ({id:x.id,ok:x.ok})) : []
        };
      }
    });
    return { app:'Ordbås', version:1, settings:settings(raw.settings || {}), progress, rounds:integer(raw.rounds), correct:integer(raw.correct), firstTry:Math.min(integer(raw.firstTry),integer(raw.correct)), helpers:integer(raw.helpers), shifts:integer(raw.shifts), review:Array.isArray(raw.review)?[...new Set(raw.review.filter(id=>O.Content.get(id)))].slice(-30):[] };
  }
  function save(data) { api.setGameState('ordbas', data); }
  function saveSettings(value) { const data = read(); data.settings = settings(value); save(data); }
  function notePractice(id) { if (!O.Content.get(id)) return; const data = read(); data.review = [...data.review.filter(x=>x!==id),id].slice(-30); save(data); }
  function recordAnswer(answer) {
    if (answer.retry) return;
    const data = read(), bucket = data.progress[answer.wordClass][answer.level];
    bucket.completed++; bucket.firstTry += Number(answer.firstTry);
    bucket.recent = [...bucket.recent,{id:answer.id,ok:answer.firstTry}].slice(-10);
    data.correct++; data.firstTry += Number(answer.firstTry);
    if (answer.firstTry) data.review = data.review.filter(id=>id!==answer.id);
    else data.review = [...data.review.filter(id=>id!==answer.id),answer.id].slice(-30);
    save(data); publish(data);
  }
  async function finish(mode) {
    const data = read(); data.rounds++;
    if (mode === 'helper') data.helpers++;
    if (mode === 'pairs') data.shifts++;
    save(data); await publish(data);
  }
  async function publish(data) {
    const earned = data.rounds > 0 ? ['fyrste-levering'] : [];
    const touched = O.Config.classes.filter(c=>Object.values(data.progress[c.id]).some(b=>b.completed>0)).length;
    if (touched === 4) earned.push('fire-basar');
    if (data.helpers > 0) earned.push('vyrdes-hjelpar');
    if (data.shifts > 0) earned.push('ordskiftar');
    if (data.correct >= 100) earned.push('hundre-ord');
    api.updateBragdProgress('ordbas',{rounds:data.rounds,correct:data.correct,firstTry:data.firstTry});
    if (root.VyrdepilBragd) await root.VyrdepilBragd.announceBadges('ordbas',earned);
    else earned.forEach(id=>api.recordBadge('ordbas',id));
  }
  O.Storage = { read, settings, saveSettings, notePractice, recordAnswer, finish, reset:()=>{ api.clearGameState('ordbas'); api.updateBragdProgress('ordbas',{rounds:0,correct:0,firstTry:0}); }, earned:()=>api.getBragdData().badges.ordbas || [] };
})(window);
