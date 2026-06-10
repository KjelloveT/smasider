/* text.js — tokenisering og frekvenstelling for Ordskodde. */
(function (root) {
  'use strict';

  const WORD_RE = /[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu;
  const MAX_LIST = 250; // rader viste i ordlista (toggla ord kan dra inn nye)

  /**
   * Analyser rå tekst til ei frekvensliste.
   * @returns [{ word, count, stopword, enabled }] sortert på count (desc), så alfabetisk
   */
  function analyze(rawText, opts) {
    opts = opts || {};
    const minLength = opts.minLength || 2;
    const stopwords = OrdskoddeStopwords.all();
    const counts = new Map();

    const normalized = String(rawText || '').toLowerCase().normalize('NFC');
    const tokens = normalized.match(WORD_RE) || [];
    for (const token of tokens) {
      if (token.length < minLength) continue;
      counts.set(token, (counts.get(token) || 0) + 1);
    }

    const words = [...counts.entries()].map(([word, count]) => {
      const stopword = stopwords.has(word);
      return { word, count, stopword, enabled: !stopword };
    });

    words.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'nn'));
    return words.slice(0, MAX_LIST);
  }

  root.OrdskoddeText = { analyze, MAX_LIST };
})(window);
