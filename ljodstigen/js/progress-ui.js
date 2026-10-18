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
    const summary = R.h('p', 'ljod-journey-summary', s.completed + ' av ' + s.total);
    summary.setAttribute('aria-label', s.completed + ' av ' + s.total + ' steg fullførte');
    host.appendChild(summary);
    if (!opts.inTask) {
      const dots = R.h('ol', 'ljod-stage-dots');
      dots.setAttribute('aria-label', 'Dei ti stega i Ljodstigen');
      s.levels.forEach(function (level) {
        const done = level.done;
        const item = R.h('li', 'ljod-stage-dot' + (done ? ' is-complete' : !s.done && level.number === s.current ? ' is-current' : ''), String(level.number));
        item.setAttribute('aria-label', 'Steg ' + level.number + ': ' + (done ? 'fullført' : level.number === s.current ? 'du er her' : 'står att'));
        dots.appendChild(item);
      });
      host.appendChild(dots);
    }
    if (!opts.inTask) host.appendChild(R.h('p', 'vp-help', s.done
      ? 'Alle ti stega er ferdige. Du kan halde fram med å øve og la skogen vekse.'
      : 'Neste mål: steg ' + s.current + ' — ' + s.levels[s.current - 1].title + '.'));

    if (opts.compact) return;
    if (!opts.teacher) {
      const next = R.h('a', 'vp-button vp-button--positive', s.done ? 'Øv vidare i Lesestigen' : 'Hald fram i ' + practiceMode(s.current) + ' — steg ' + s.current);
      next.href = practiceUrl(p, s.current);
      host.appendChild(next);
    }
    const list = R.h('ol', 'ljod-levels');
    const teacherOpen = LjodState.read().allModes;
    s.levels.forEach(function (level) {
      const finished = level.done;
      const available = LjodProgress.available(p, level.number) || teacherOpen;
      const card = R.h('li', 'vp-panel vp-panel--inset ljod-level');
      const status = finished ? 'Fullført' : level.number === s.current ? 'Du er her' : 'Står att';
      card.appendChild(R.h('strong', null, level.number + '. ' + level.title));
      card.appendChild(R.h('span', 'ljod-level-state', status));
      card.appendChild(R.h('p', 'vp-help', level.detail));
      card.appendChild(R.h('p', null, level.status));
      if (opts.teacher) card.appendChild(R.h('p', 'vp-help', level.goal));
      if (opts.teacher && level.number <= 5) card.appendChild(R.h('p', 'vp-help', level.practice.length
        ? 'Øv vidare på: ' + level.practice.join(' · ').toUpperCase() + '.'
        : 'Alle bokstavane på dette steget sit godt.'));
      if (opts.teacher && level.number >= 6) {
        const data = LjodReading.LEVELS.find(function (item) { return item.number === level.number; });
        const left = data.items.filter(function (item) { return LjodProgress.resultFor(p, item.id).right < LjodProgress.REQUIRED; });
        card.appendChild(R.h('p', 'vp-help', left.length
          ? 'Står att: ' + left.map(function (item) {
            return item.text + ' (' + LjodProgress.resultFor(p, item.id).right + '/2)';
          }).join(', ') + '.' : 'Alle lesemåla på dette steget er ferdige.'));
      }
      if (!opts.teacher) {
        if (available) {
          const link = R.h('a', 'vp-button vp-button--compact', 'Øv på steg ' + level.number + ' i ' + practiceMode(level.number));
          link.href = practiceUrl(p, level.number);
          card.appendChild(link);
        } else {
          const button = R.h('button', 'vp-button vp-button--compact', 'Øv på grunnlydane fyrst');
          button.type = 'button';
          button.disabled = true;
          card.appendChild(button);
        }
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

  function practiceUrl(p, number) {
    return 'spel.html#' + new URLSearchParams({ p: p.id, m: number <= 5 ? 'lydfangst' : 'lesestigen', level: number });
  }

  function practiceMode(number) { return number <= 5 ? 'Lydlyngen' : 'Lesestigen'; }

  root.LjodProgressUI = { render: render, practiceUrl: practiceUrl, practiceMode: practiceMode };
})(window);
