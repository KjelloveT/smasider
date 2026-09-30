/* Små, valfrie tillegg til Vyrdepil-grunnlaget. Vy og ICON må vere lasta fyrst. */
(function (global) {
  'use strict';
  const assets = new URL('../_resources/vyrdepil-design/', document.currentScript.src);
  const project = new URL('../', document.currentScript.src);
  let registryPromise;
  function loadRegistry() {
    if (!registryPromise) registryPromise = fetch(new URL('json/vyrdepil-design.json?v=2', project)).then(response => {
      if (!response.ok) throw new Error('Designregisteret kunne ikkje lastast');
      return response.json();
    }).catch(error => { registryPromise = null; throw error; });
    return registryPromise;
  }
  async function initRegisteredLogos(root = document) {
    const registry = await loadRegistry();
    root.querySelectorAll('[data-vp-app-logo-id]').forEach(heading => {
      if (heading.querySelector(':scope > .vp-policy-app-logo')) return;
      const path = registry.logo?.files?.[heading.dataset.vpAppLogoId];
      if (!path) return;
      const image = document.createElement('img');
      image.className = 'vp-policy-app-logo';
      image.src = new URL(path, project).href;
      image.alt = '';
      image.width = 32;
      image.height = 32;
      image.loading = 'lazy';
      image.decoding = 'async';
      heading.prepend(image);
    });
  }
  async function applyIdentity(appId, root = document.body) {
    const registry = await loadRegistry();
    const assignment = registry.apps[appId];
    const background = registry.backgrounds.find(item => item.id === assignment?.backgroundId);
    if (!background || background.assignedTo !== appId) throw new Error(`Appen manglar ein reservert bakgrunn: ${appId}`);
    root.style.setProperty('--vp-landscape', `url("${new URL(background.file, project)}")`);
    const logo = registry.logo.files[appId];
    if (logo) root.querySelectorAll('[data-vp-app-logo]').forEach(image => {
      if (image.tagName === 'IMG') image.src = new URL(logo, project).href;
    });
    return background;
  }

  function decorate(root = document) {
    root.querySelectorAll('[data-vp-corners]').forEach(layer => {
      if (layer.dataset.vpReady) return;
      const variants = global.Vy.shuffle(Array.from({ length: 10 }, (_, i) => i + 1));
      layer.querySelectorAll('.vp-corner').forEach((corner, index) => {
        const variant = String(variants[index]).padStart(2, '0');
        corner.style.backgroundImage = `url("${new URL(`corners/corner-${variant}.png`, assets)}")`;
        corner.dataset.variant = variant;
      });
      layer.dataset.vpReady = 'true';
    });
  }

  function initSupport(root = document) {
    const sections = Array.from(root.querySelectorAll('details[data-vp-support]'));
    const wide = global.matchMedia('(min-width: 821px)');
    const mobileOpen = new WeakMap();
    sections.forEach(section => {
      mobileOpen.set(section, section.open);
      section.addEventListener('toggle', () => {
        if (!wide.matches) mobileOpen.set(section, section.open);
      });
      section.querySelector('summary').addEventListener('click', event => {
        if (wide.matches) event.preventDefault();
      });
    });
    function update() {
      sections.forEach(section => {
        section.open = wide.matches || mobileOpen.get(section);
        const summary = section.querySelector('summary');
        if (wide.matches) summary.setAttribute('tabindex', '-1');
        else summary.removeAttribute('tabindex');
      });
    }
    wide.addEventListener('change', update);
    update();
  }

  function initSelections(root = document) {
    root.querySelectorAll('.vp-button[aria-pressed]').forEach(button => {
      if (button.querySelector('.vp-selection-mark')) return;
      const marker = document.createElement('span');
      marker.className = 'vp-selection-mark';
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = global.ICON('check', 18);
      button.append(marker);
    });
  }

  function initMenus(root = document) {
    const dialogs = new Set();
    root.querySelectorAll('[data-vp-menu]').forEach(trigger => {
      const menu = document.getElementById(trigger.dataset.vpMenu);
      if (!menu || menu.tagName !== 'DIALOG') return;
      dialogs.add(menu);
      trigger.addEventListener('click', () => {
        menu.showModal();
        root.querySelectorAll('[data-vp-menu]').forEach(button => {
          if (button.dataset.vpMenu === menu.id) button.setAttribute('aria-expanded', 'true');
        });
      });
    });
    dialogs.forEach(menu => {
      menu.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          menu.close();
        }
      });
      menu.addEventListener('close', () => {
        root.querySelectorAll('[data-vp-menu]').forEach(button => {
          if (button.dataset.vpMenu === menu.id) button.setAttribute('aria-expanded', 'false');
        });
      });
      menu.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (link && menu.contains(link)) menu.close();
      });
    });
  }

  function initMascots(root = document) {
    const frameFiles = ['vyrde-01.png', 'vyrde-02.png', 'vyrde-03.png?v=2', 'vyrde-04.png'];
    const frames = frameFiles.map(file => new URL('mascot/' + file, assets).href);
    let current = 0;
    const images = new Set();
    function setFrame(image) {
      if (!image || image.tagName !== 'IMG' || !image.hasAttribute('data-vp-mascot')) return;
      images.add(image);
      image.src = frames[current];
      image.dataset.vpMascotFrame = String(current);
    }
    function scan(node) {
      if (!node || node.nodeType !== 1) return;
      setFrame(node);
      node.querySelectorAll('[data-vp-mascot]').forEach(setFrame);
    }
    scan(root.documentElement || root);
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(scan));
    });
    observer.observe(root.documentElement || root, { childList: true, subtree: true });
    window.setInterval(() => {
      current = (current + 1) % frames.length;
      images.forEach(image => {
        if (image.isConnected) setFrame(image);
        else images.delete(image);
      });
    }, 30000);
  }
  global.VyrdepilDesign = { decorate, initSupport, initSelections, initMenus, loadRegistry, applyIdentity, initRegisteredLogos };
  document.addEventListener('DOMContentLoaded', () => {
    decorate();
    initSupport();
    initSelections();
    initMenus();
    initMascots();
    if (document.querySelector('[data-vp-app-logo-id]')) initRegisteredLogos().catch(error => console.error(error.message));
    if (document.body.hasAttribute('data-vp-app')) applyIdentity(document.body.dataset.vpApp).catch(error => console.error(error.message));
  });
})(window);
