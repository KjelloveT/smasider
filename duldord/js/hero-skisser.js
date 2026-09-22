(() => {
  'use strict';

  const brands = {
    duldord: {
      title: 'DULDORD',
      subtitle: 'Eitt fembokstavsord kvar dag',
      meta: 'Dag 49',
      icon: '../_resources/duldord.png',
      accent: '#a83f2d',
      deep: '#214c37'
    },
    klassekart: {
      title: 'KLASSEKART',
      subtitle: 'Plasser elevane. Sjå rommet.',
      meta: 'Nytt oppsett',
      icon: '../_resources/klassekart.png',
      accent: '#bf6d2c',
      deep: '#2f5945'
    },
    ordaklok: {
      title: 'ORDAKLOK',
      subtitle: 'Finn ord. Bygg meiningar.',
      meta: 'Språksporet',
      icon: '../_resources/ordaklok.png',
      accent: '#b06b24',
      deep: '#315848'
    }
  };

  const lab = document.querySelector('.hero-lab');
  const buttons = [...document.querySelectorAll('[data-brand-choice]')];

  function setBrand(key) {
    const brand = brands[key];
    if (!brand || !lab) return;

    lab.style.setProperty('--brand-accent', brand.accent);
    lab.style.setProperty('--brand-deep', brand.deep);
    lab.classList.toggle('is-long-title', brand.title.length > 8);

    document.querySelectorAll('[data-app-title]').forEach((node) => {
      node.textContent = brand.title;
    });
    document.querySelectorAll('[data-app-subtitle]').forEach((node) => {
      node.textContent = brand.subtitle;
    });
    document.querySelectorAll('[data-app-meta]').forEach((node) => {
      node.textContent = brand.meta;
    });
    document.querySelectorAll('[data-app-icon]').forEach((node) => {
      node.src = brand.icon;
      node.alt = '';
    });

    buttons.forEach((button) => {
      const active = button.dataset.brandChoice === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => setBrand(button.dataset.brandChoice));
  });
})();

