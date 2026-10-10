(function (root) {
  'use strict';
  const bank = [], roots = { violin: [55, 62, 69, 76], cello: [36, 43, 50, 57] };
  const base = new URL('../assets/audio/', document.currentScript.src);
  let pending;
  // These are our own generated PCM performances, not recordings or a downloaded soundfont.
  function load(context) {
    if (!pending) pending = Promise.all(Object.entries(roots).flatMap(([instrument, keys]) => keys.map(async midi => {
      const response = await fetch(new URL(instrument + '-' + midi + '.wav', base));
      if (!response.ok) throw new Error('Strykarklangen kunne ikkje lastast. Last sida på nytt.');
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      bank.push({ instrument, midi, buffer });
    }))).catch(error => { bank.length = 0; pending = null; throw error; });
    return pending;
  }
  function nearest(instrument, midi) {
    return bank.filter(value => value.instrument === instrument).sort((a, b) => Math.abs(a.midi - midi) - Math.abs(b.midi - midi))[0];
  }
  root.Fykefuga.Strings = { load, nearest };
})(window);
