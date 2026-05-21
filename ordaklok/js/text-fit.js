/**
 * text-fit.js
 * Hjelpar for å skalere font-storleik basert på tekstlengd i Ordaklok.
 *
 * Brukast av alle fire spelmodusar (flashcard, mc, type, match) for å
 * unngå at lange begrep og setningar sprenger boksane sine.
 *
 * Cutoffs (kan finstemmast):
 *   ≤ 14 teikn → 'len-sm' (default — full font)
 *   15–28      → 'len-md' (~75 %)
 *   29–55      → 'len-lg' (~55 %)
 *   > 55       → 'len-xl' (~40 %)
 */
(function (root) {
  'use strict';

  function lengthClass(text) {
    const n = (text || '').length;
    if (n <= 14) return 'len-sm';
    if (n <= 28) return 'len-md';
    if (n <= 55) return 'len-lg';
    return 'len-xl';
  }

  /**
   * Erstattar/legg til ein len-* klasse på eit element basert på teksten.
   * Fjernar gamle len-* klassar fyrst slik at funksjonen er trygg å kalle fleire gonger.
   */
  function applyLengthClass(el, text) {
    if (!el) return;
    el.classList.remove('len-sm', 'len-md', 'len-lg', 'len-xl');
    el.classList.add(lengthClass(text));
  }

  /** Sjekk om eit svar bør brukast med plain input i staden for bokstavboksar. */
  function isLongAnswer(answer) {
    if (!answer) return false;
    return answer.length > 20 || /\s/.test(answer);
  }

  root.OrdaklokText = {
    lengthClass: lengthClass,
    applyLengthClass: applyLengthClass,
    isLongAnswer: isLongAnswer
  };
})(window);
