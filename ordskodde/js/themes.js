/* themes.js — forhandsdefinerte tema, skrifttypar og form-register for Ordskodde.
   Sjølve ordskya er unnateke frå neobrutalisme-designsystemet (avklart i AGENTS-arbeidsflyten),
   difor har temaa eigne fargar uavhengig av globalt fargetema. */
(function (root) {
  'use strict';

  // Kun systemfontar — ingen CDN/webfontar (AGENTS §5.6)
  const FONTS = [
    { id: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
    { id: 'sans', label: 'Sans', stack: 'system-ui, "Segoe UI", Arial, sans-serif' },
    { id: 'rund', label: 'Rund sans', stack: '"Trebuchet MS", Verdana, sans-serif' },
    { id: 'handskrift', label: 'Handskrift', stack: '"Segoe Print", "Comic Sans MS", cursive' },
    { id: 'skrivemaskin', label: 'Skrivemaskin', stack: 'Consolas, "Courier New", monospace' },
    { id: 'plakat', label: 'Plakat', stack: 'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif' }
  ];

  const THEMES = [
    { id: 'klassisk', name: 'Klassisk', fontId: 'serif', background: '#faf6ee',
      colors: ['#1a1a2e', '#16538a', '#b3402a', '#2a6b4f', '#8a6d1a'] },
    { id: 'nordlys', name: 'Nordlys', fontId: 'sans', background: '#101426',
      colors: ['#7df9ff', '#b388ff', '#69f0ae', '#ffd54f', '#ff8a80'] },
    { id: 'krit', name: 'Krit', fontId: 'handskrift', background: '#2f3e35',
      colors: ['#fdfdfd', '#f7e08a', '#a8d8b9', '#f2b6c1', '#9fc5e8'] },
    { id: 'solnedgang', name: 'Solnedgang', fontId: 'rund', background: '#fff8f0',
      colors: ['#d62828', '#f77f00', '#fcbf49', '#6a4c93', '#003049'] },
    { id: 'skrivemaskin', name: 'Skrivemaskin', fontId: 'skrivemaskin', background: '#f4f1ea',
      colors: ['#222222', '#555555', '#8b0000', '#1f4e79', '#777777'] },
    { id: 'godteri', name: 'Godteri', fontId: 'plakat', background: '#ffffff',
      colors: ['#ff5d8f', '#ffb800', '#00b4d8', '#8338ec', '#06d6a0'] }
  ];

  /* Former som maskefunksjonar i normaliserte koordinatar (nx, ny ∈ [-1, 1], y nedover).
     Ny form = éin ny entry her (+ evt. ikon i icons.js). */
  const SHAPES = {
    square: {
      id: 'square', name: 'Firkant', icon: 'square',
      contains: () => true // grensesjekken mot lerretet held
    },
    circle: {
      id: 'circle', name: 'Sirkel', icon: 'circle',
      contains: (nx, ny) => nx * nx + ny * ny <= 1
    },
    heart: {
      id: 'heart', name: 'Hjarte', icon: 'heart',
      contains: (nx, ny) => {
        // Hjartekurve med markert kløft og spiss: x² + (y − ∛(x²))² ≤ 1, flippa og skalert
        const x = nx * 1.02;
        const y = 0.25 - ny * 1.27;
        const t = y - Math.cbrt(x * x);
        return x * x + t * t <= 1;
      }
    }
  };

  function getFont(id) {
    return FONTS.find(f => f.id === id) || FONTS[0];
  }

  function getTheme(id) {
    return THEMES.find(t => t.id === id) || THEMES[0];
  }

  /** Standardinnstillingar utleidde frå eit tema */
  function settingsFromTheme(themeId) {
    const theme = getTheme(themeId);
    return {
      themeId: theme.id,
      shape: 'circle',
      fontId: theme.fontId,
      colors: theme.colors.slice(),
      background: theme.background,
      transparentBg: false,
      maxWords: 100,
      minSize: 14,
      maxSize: 110,
      rotationMode: 'some', // 'none' | 'some' | 'many'
      seed: Math.floor(Math.random() * 2 ** 31)
    };
  }

  root.OrdskoddeThemes = { FONTS, THEMES, SHAPES, getFont, getTheme, settingsFromTheme };
})(window);
