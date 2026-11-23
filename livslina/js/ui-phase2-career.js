/* Først type veg, så fagfelt og løp. Valet blir ståande medan ein søkjer. */
window.LL = window.LL || {};
LL.uiPhase2Career = (function () {
  'use strict';
  const el = (...args) => Vy.el(...args);
  const types = [['study', 'Studer'], ['work', 'Gå i arbeid'], ['year', 'Prøv noko eit år']];

  function create(s, initial, { field, select }) {
    const data = LL.data.getAdult();
    const paths = LL.phase2Paths, state = LL.phase2State;
    const initialItem = state.route(initial.routeId);
    let picked = initial.routeId;
    let type = paths.category(s, initialItem);
    const panel = el('div', 'll-adult-stack ll-career-picker');
    const categories = el('div', 'll-career-types');
    categories.setAttribute('role', 'group');
    categories.setAttribute('aria-label', 'Type retning');
    const route = select('adultRoute', [], picked);
    const work = select('adultRole', [], initial.roleId);
    const category = select('adultCareerField', [['', 'Alle fagfelt'], ...Object.entries(data.fields)], '');
    const search = el('input', 'vp-input');
    search.id = 'adultCareerSearch';
    search.type = 'search';
    search.autocomplete = 'off';
    const eligible = el('input');
    eligible.type = 'checkbox';
    eligible.id = 'adultCareerEligible';
    const showWork = field('Yrkesrolle', work);
    const note = el('p', 'll-note');
    note.setAttribute('role', 'status');
    const limit = el('label', 'vp-choice ll-career-filter');
    limit.append(eligible, 'Vis berre det eg kan starte');
    const filters = el('div', 'll-career-filters');
    filters.append(field('Fagfelt', category), field('Søk etter løp eller yrke', search));
    const current = state.route(s.adult.routeId) || paths.tradeRoute(s);
    if (current && !state.startIssue(s, current) && paths.category(s, current) !== 'year') {
      const button = el('button', 'vp-button vp-button--tool', 'Hald fram · ' + state.label(s, current.id, s.adult.plan?.roleId));
      button.type = 'button';
      button.addEventListener('click', () => {
        type = paths.category(s, current);
        picked = current.id;
        category.value = search.value = '';
        update();
        updateRoles(current, s.adult.plan?.roleId);
        route.dispatchEvent(new Event('change', { bubbles: true }));
      });
      panel.append(button);
    }

    for (const [id, text] of types) {
      const button = el('button', 'vp-button vp-button--tool vp-button--compact');
      const check = LL.uiPhase2Visuals.icon('check', 16);
      check.classList.add('vp-selection-mark');
      button.append(check, text);
      button.dataset.careerType = id;
      button.type = 'button';
      button.addEventListener('click', () => {
        type = id;
        category.value = '';
        update();
      });
      categories.append(button);
    }
    panel.append(categories, filters, limit, field('Vel eit løp', route), note, showWork);

    function update() {
      Array.from(categories.children).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.careerType === type)));
      const query = search.value.trim().toLocaleLowerCase('nn-NO');
      const matches = data.routes.filter(item => {
        if (paths.category(s, item) !== type || category.value && paths.field(s, item) !== category.value) return false;
        if (eligible.checked && state.startIssue(s, item)) return false;
        const names = [item.label, item.graduate, ...(item.roles || []).map(role => role.label)].filter(Boolean);
        return names.some(label => label.toLocaleLowerCase('nn-NO').includes(query));
      });
      const option = item => {
        const blocked = state.startIssue(s, item);
        const node = el('option', '', state.label(s, item.id) + (blocked ? ' · sjå krav' : ''));
        node.value = item.id;
        return node;
      };
      route.replaceChildren(...matches.map(option));
      if (!matches.some(item => item.id === picked)) {
        const previous = option(state.route(picked));
        previous.textContent = 'Vald no · ' + previous.textContent;
        route.prepend(previous);
      }
      route.value = picked;
      note.textContent = matches.length ? '' : 'Ingen treff. Prøv eit anna fagfelt eller søkjeord.';
      note.hidden = Boolean(matches.length);
    }

    function updateRoles(item, previous = work.value) {
      const choices = paths.roles(s, item);
      work.replaceChildren(...choices.map(role => {
        const option = el('option', '', role.label + ' · ' + paths.rhythm(role).label.toLocaleLowerCase('nn-NO'));
        option.value = role.id;
        return option;
      }));
      work.value = choices.some(role => role.id === previous) ? previous : choices[0]?.id || '';
      showWork.hidden = choices.length < 2;
    }

    route.addEventListener('change', () => {
      const previous = picked;
      picked = route.value;
      if (picked !== previous) updateRoles(state.route(picked), '');
    });
    category.addEventListener('change', update);
    eligible.addEventListener('change', update);
    search.addEventListener('input', update);
    update();
    updateRoles(initialItem, initial.roleId);
    return { panel, route, work };
  }

  return { create };
})();
