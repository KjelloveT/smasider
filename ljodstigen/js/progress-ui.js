(function (root) {
  'use strict';

  function render(host, p, opts) {
    if (!host) return;
    opts = opts || {};
    const R = LjodRender;
    const s = LjodProgress.summary(p);
    R.clear(host);
    host.classList.add('ljod-journey');
    if (!opts.inTask) host.appendChild(R.h('h3', 'vp-heading vp-heading--small',
      s.done ? 'Du har fullført Ljodstigen!' : 'Vegen din gjennom Ljodstigen'));
    host.appendChild(R.h('p', 'ljod-journey-summary', s.completed + ' av ' + s.total +
      ' steg fullførte · ' + s.percent + ' % · ' + s.remaining + ' steg står att'));
    const bar = R.h('progress', 'ljod-journey-progress');
    bar.max = 100;
    bar.value = s.percent;
    bar.setAttribute('aria-label', 'Fullførte læringsmål i Ljodstigen');
    bar.textContent = s.percent + ' %';
    host.appendChild(bar);
    if (!opts.inTask) host.appendChild(R.h('p', 'vp-help', s.done
      ? 'Alle ti stega er ferdige. Du kan halde fram med å øve og la skogen vekse.'
      : 'Neste mål: steg ' + s.current + ' — ' + s.levels[s.current - 1].title + '.'));

    if (opts.compact) return;
    if (!opts.teacher && s.current >= 6) {
      const next = R.h('a', 'vp-button vp-button--positive', s.done ? 'Øv på lesestega' : 'Hald fram på steg ' + s.current);
      next.href = 'spel.html#' + new URLSearchParams({ p: p.id, m: 'lesestigen', level: s.current });
      host.appendChild(next);
    }
    const list = R.h('ol', 'ljod-levels');
    const teacherOpen = LjodState.read().allModes;
    s.levels.forEach(function (level) {
      const finished = level.number <= s.completed;
      const available = level.number <= s.current || teacherOpen;
      const card = R.h('li', 'vp-panel vp-panel--inset ljod-level');
      const status = finished ? 'Fullført' : level.number === s.current ? 'Du er her' : 'Står att';
      card.appendChild(R.h('strong', null, level.number + '. ' + level.title));
      card.appendChild(R.h('span', 'ljod-level-state', status));
      card.appendChild(R.h('p', 'vp-help', level.detail));
      card.appendChild(R.h('p', null, level.status));
      if (opts.teacher) card.appendChild(R.h('p', 'vp-help', level.goal));
      if (opts.teacher && level.number >= 6) {
        const data = LjodReading.LEVELS.find(function (item) { return item.number === level.number; });
        const left = data.items.filter(function (item) { return LjodProgress.resultFor(p, item.id).right < LjodProgress.REQUIRED; });
        card.appendChild(R.h('p', 'vp-help', left.length
          ? 'Står att: ' + left.map(function (item) {
            return item.text + ' (' + LjodProgress.resultFor(p, item.id).right + '/2)';
          }).join(', ') + '.' : 'Alle lesemåla på dette steget er ferdige.'));
      }
      if (level.number >= 6 && available && !opts.teacher) {
        const link = R.h('a', 'vp-button vp-button--compact', finished ? 'Øv om att' : 'Øv på steg ' + level.number);
        link.href = 'spel.html#' + new URLSearchParams({ p: p.id, m: 'lesestigen', level: level.number });
        card.appendChild(link);
      }
      list.appendChild(card);
    });
    if (opts.teacher) host.appendChild(list);
    else {
      const details = R.h('details', 'vp-accordion');
      details.appendChild(R.h('summary', null, 'Sjå alle ti stega'));
      const body = R.h('div', 'vp-accordion-body');
      body.appendChild(list);
      details.appendChild(body);
      host.appendChild(details);
    }
    host.appendChild(R.h('p', 'vp-help',
      'Framgangen viser øvingsmål, ikkje ein karakter eller ein lesetest. Fullførte mål blir verande sjølv om du svarar feil seinare.'));
  }

  root.LjodProgressUI = { render: render };
})(window);
