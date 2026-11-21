/* Faner, piler og startstadfesting for halvårsplanen og årsplanen. */
window.LL = window.LL || {};
LL.uiPlanSteps = (function () {
  'use strict';

  function connect(tabList, heading, previous, next) {
    const tabs = Array.from(tabList.children);
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const visited = new Set();
    let active = 0;

    function select(index) {
      const selected = tabs[index];
      if (!selected) return;
      active = index;
      visited.add(selected);
      heading.textContent = selected.textContent.trim();
      tabs.forEach((tab, position) => {
        const current = tab === selected;
        tab.setAttribute('aria-selected', String(current));
        tab.tabIndex = current ? 0 : -1;
        panels[position].hidden = !current;
      });
      previous.disabled = index === 0;
      next.disabled = index === tabs.length - 1;
    }

    function reset() {
      visited.clear();
      select(0);
    }

    const unvisited = () => tabs.filter(tab => !visited.has(tab));
    function review() {
      select(tabs.indexOf(unvisited()[0]));
      heading.focus();
    }

    tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
    tabList.addEventListener('keydown', event => {
      let index;
      switch (event.key) {
        case 'ArrowLeft': index = (active - 1 + tabs.length) % tabs.length; break;
        case 'ArrowRight': index = (active + 1) % tabs.length; break;
        case 'Home': index = 0; break;
        case 'End': index = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      select(index);
      tabs[index].focus();
    });
    [[previous, -1], [next, 1]].forEach(([arrow, offset]) => {
      arrow.addEventListener('click', () => {
        select(active + offset);
        if (arrow.disabled) heading.focus();
      });
    });

    reset();
    return {
      reset, unvisited, review,
      reveal(control) { select(panels.findIndex(panel => panel.contains(control))); }
    };
  }

  const dialog = document.getElementById('planStartDialog');
  Vy.bindOverlayClose(dialog);

  function confirmStart(steps, question, confirmLabel, start) {
    const remaining = steps.unvisited();
    if (!remaining.length) {
      start();
      return;
    }
    if (dialog.open) return;

    const names = new Intl.ListFormat('nn-NO').format(remaining.map(tab => tab.textContent.trim()));
    document.getElementById('planStartMissing').textContent = 'Du har ' + names + ' att å sjå over.';
    document.getElementById('planStartTitle').textContent = question;
    const review = document.getElementById('planReview');
    const proceed = document.getElementById('planStartAnyway');
    proceed.textContent = confirmLabel;
    let afterClose;
    review.onclick = () => { afterClose = steps.review; Vy.closeModal(dialog); };
    proceed.onclick = () => { afterClose = start; Vy.closeModal(dialog); };
    Vy.openModal(dialog);
    dialog.addEventListener('close', () => {
      review.onclick = null;
      proceed.onclick = null;
      if (afterClose) afterClose();
    }, { once: true });
  }

  return { connect, confirmStart };
})();
