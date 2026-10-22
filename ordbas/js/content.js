(function (root) {
  'use strict';
  const O = root.Ordbas;
  let data;
  function validate(pack) {
    if (!pack || pack.app !== 'Ordbås' || pack.version !== 1 || !Array.isArray(pack.questions)) throw new Error('Ukjent oppgåveformat');
    const ids = new Set();
    pack.questions.forEach(q => {
      if (!q || !/^ob-\d{3}$/.test(q.id) || ids.has(q.id) || !O.Config.classes.some(c => c.id === q.wordClass)) throw new Error('Ugyldig oppgåve');
      if (![1,2,3,4].includes(q.level) || !q.target || !['before','text','after'].every(k => typeof q.target[k] === 'string') || !q.target.text) throw new Error('Ugyldig setning');
      if (!['meaning','reason','tip','lemma'].every(k => typeof q[k] === 'string' && q[k].trim())) throw new Error('Ufullstendig forklaring');
      if (!q.source || !Number.isInteger(q.source.articleId) || !Number.isInteger(q.source.definitionId)) throw new Error('Manglar ordbokkjelde');
      ids.add(q.id);
    });
    return pack.questions;
  }
  async function load() {
    const response = await fetch('data/oppgaver.json');
    if (!response.ok) throw new Error('Ordkorga kunne ikkje lastast');
    const pack = await response.json();
    data = validate(pack);
    return data;
  }
  O.Content = { load, validate, all: () => data || [], get: id => (data || []).find(q => q.id === id) };
})(window);
