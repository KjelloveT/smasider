/* Eitt årsresultat om gongen, med utslag frå spela val. */
window.LL = window.LL || {};
LL.uiPhase2Report = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);

  function balanceContributions(report) {
    const start = report.start, end = report.end;
    return [
      ['Konto', end.stats.money - start.stats.money],
      ['Fri sparing', end.stats.savings - start.stats.savings],
      ['BSU', end.bsu - start.bsu],
      ['Depositum', end.deposit - start.deposit],
      ['Bustadverdi', (end.propertyValue || 0) - (start.propertyValue || 0)],
      ['Endring i samla gjeld', start.debt - end.debt]
    ];
  }

  function comment(key, delta) {
    if (key === 'networth') return 'Nettoformue er det du eig, trekt frå det du skuldar. Avdrag flyttar pengar frå konto til eigenkapital i bustaden.';
    if (key === 'money') return 'Kontoen viser pengane du kan bruke no. Lån kan auke saldoen, medan sparing og avdrag flyttar pengane til andre kontoar eller verdiar.';
    if (delta > .05) return 'Medrekna nedturane enda du høgare enn då året byrja.';
    if (delta < -.05) return 'Medrekna det som gjekk bra enda du lågare enn då året byrja.';
    return 'Du enda om lag der du byrja. Desse vala kan ha trekt i ulike retningar.';
  }

  function open(report) {
    const visuals = LL.uiPhase2Visuals;
    const measures = [
      ['money', 'På konto', 'coins', report.start.stats.money, report.end.stats.money, true],
      ['networth', 'Nettoformue', 'home', report.start.networth, report.end.networth, true],
      ...Object.entries(visuals.METERS).map(([key, [label, icon]]) =>
        [key, label, icon, report.start.stats[key], report.end.stats[key], false])
    ];
    const dialog = Vy.createDialog('Årsoppgjer');
    dialog.classList.add('ll-adult-report-dialog');
    const title = dialog.querySelector('h2');
    const body = el('div', 'll-adult-stack');
    body.setAttribute('aria-live', 'polite');
    const nav = el('div', 'vp-actions');
    const previous = el('button', 'vp-button vp-button--quiet', 'Førre');
    const next = el('button', 'vp-button vp-button--primary', 'Neste');
    previous.type = next.type = 'button';
    nav.append(previous, next);
    dialog.append(body, nav);
    let page = 0;

    function render() {
      const [key, label, symbol, before, after, money] = measures[page];
      const delta = after - before;
      const format = value => money ? LL.util.kr(value) : value.toLocaleString('nn-NO', { maximumFractionDigits: 1 });
      title.textContent = label;
      const headline = el('div', 'll-adult-report-reading');
      headline.append(visuals.icon(symbol, 28), el('strong', '', format(before) + ' → ' + format(after)));
      const direction = visuals.trend(delta, money);
      headline.append(direction);
      const choices = key === 'networth' ? balanceContributions(report) :
        (Array.isArray(report.impacts) ? report.impacts : []).filter(Boolean).map(item => [item.label, item.deltas?.[key]]);
      const notable = choices.filter(([, value]) => Number.isFinite(value) && Math.abs(value) >= (money ? .5 : .05));
      const strongest = [1, -1].flatMap(sign => notable.filter(([, value]) => Math.sign(value) === sign)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4));
      body.replaceChildren(el('p', 'll-note', (page + 1) + ' av ' + measures.length), headline,
        el('p', '', comment(key, delta)));
      if (strongest.length) {
        const list = el('ul', 'll-adult-report-list');
        for (const [description, value] of strongest) {
          const row = el('li');
          row.append(el('span', '', description), visuals.trend(value, money));
          list.append(row);
        }
        body.append(el('h3', 'heading4 no-mt', 'Største utslag'), list);
      }
      previous.disabled = page === 0;
      next.textContent = page === measures.length - 1 ? 'Ferdig' : 'Neste';
    }

    previous.addEventListener('click', () => {
      page--;
      render();
      if (previous.disabled) next.focus();
    });
    next.addEventListener('click', () => {
      if (page === measures.length - 1) { Vy.closeModal(dialog); return; }
      page++;
      render();
    });
    render();
    Vy.bindOverlayClose(dialog);
    Vy.openModal(dialog);
  }

  return { open };
})();
