(function (root) {
  'use strict';
  function targetLabel(it) {
    const target = LjodReading.LEVELS.flatMap(function (level) { return level.items; })
      .find(function (item) { return item.id === it.target; });
    return (target ? target.text : it.target) +
      (it.kind === 'nonword' ? ' (tulleord)' : it.kind === 'new' ? ' (nytt ord)' : '');
  }
  function render(host, p) {
    const R = LjodRender, rows = LjodLearning.rows(p).slice(0, 24);
    const box = R.h('section', 'vp-stack');
    box.appendChild(R.h('h3', 'vp-heading vp-heading--small', 'Nye øvingsobservasjonar'));
    box.appendChild(R.h('p', 'vp-help', 'Historiske tre og bragder blir verande. Her ser du svar frå dei nye oppgåvene, skilde etter handling. Tida er ingen leseflytprøve.'));
    if (!rows.length) box.appendChild(R.h('p', null, 'Ingen nye oppgåvesvar enno.'));
    else {
      const wrap = R.h('div', 'ljod-observations'), table = R.h('table', 'vp-data-table'), head = R.h('tr');
      ['Oppgåve', 'Mål', 'Øvd', 'Rett utan hjelp', 'Med hjelp', 'Att i seinare økt', 'Las sjølv med vaksen'].forEach(function (text) { head.appendChild(R.h('th', null, text)); });
      const thead = R.h('thead'); thead.appendChild(head); table.appendChild(thead);
      const tbody = R.h('tbody');
      rows.forEach(function (it) {
        const row = R.h('tr');
        [it.label, targetLabel(it), it.attempts, it.independent, it.helped, it.later, it.adult]
          .forEach(function (text) { row.appendChild(R.h('td', null, String(text))); });
        tbody.appendChild(row);
      });
      table.appendChild(tbody); wrap.appendChild(table); box.appendChild(wrap);
      const uncertain = rows.find(function (it) { return it.last === 'wrong' || it.last === 'help'; });
      const target = targetLabel(uncertain || rows[0]);
      box.appendChild(R.h('p', 'vp-notice', 'Prøv i lag: ' + target + '. Vis eit døme, la eleven prøve sjølv, og bruk dei same lydane i eit nytt ord.'));
    }
    box.appendChild(R.h('p', 'vp-help', 'Eigenøving i Les sjølv tel som øving. Berre svar som ein vaksen har lytta til, kan telje som stadfesta høgtlesing. Oversikta er ingen diagnose eller lesetest.'));
    host.appendChild(box);
  }
  root.LjodLearningUI = { render: render };
})(window);
