/* Ordaklok — innebygd dømeliste */
(function (root) {
  'use strict';

  const SAMPLE_LIST = {
    app: 'ordaklok',
    version: 1,
    id: 'sample_engelsk_grunnord',
    title: 'Engelsk – grunnord (døme)',
    labelA: 'Engelsk',
    labelB: 'Norsk',
    description: 'Ti ord til å kome i gang.',
    pairs: [
      { a: 'wardrobe', b: 'garderobe' },
      { a: 'fish stick', b: 'fiskepinne' },
      { a: 'goat', b: 'geit' },
      { a: 'religion', b: 'religion' },
      { a: 'pillow', b: 'pute' },
      { a: 'daffodil', b: 'påskelilje' },
      { a: 'donut', b: 'smultring' },
      { a: 'pig', b: 'gris' },
      { a: 'wand', b: 'tryllestav' },
      { a: 'smear', b: 'smøre' }
    ]
  };

  root.OrdaklokSample = { SAMPLE_LIST };
})(window);
