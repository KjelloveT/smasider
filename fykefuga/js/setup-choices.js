(function (root) {
  'use strict';
  const F = root.Fykefuga;
  const scenes = ['marmor', 'urverk', 'spegel', 'orgel'];
  function create() {
    const groups = new Map();
    let packs = [];
    function picture(file, className) {
      const image = document.createElement('img');
      image.src = 'assets/' + file; image.alt = ''; image.loading = 'lazy';
      image.className = className || ''; image.width = 240; image.height = 104;
      return image;
    }
    function preview(selectId, value) {
      const box = Vy.el('span', 'ff-choice-preview');
      box.setAttribute('aria-hidden', 'true');
      if (selectId === 'level-select' || selectId === 'preview-theme') {
        if (value === 'retray-probe') { box.append(picture('marmor.jpg')); }
        else if (value.startsWith('tutorial-')) {
          box.classList.add('ff-choice-preview--figures'); box.append(picture('gold-' + value.slice(9) + '.png'));
        } else if (value === 'endless') {
          box.classList.add('ff-choice-preview--scenes'); scenes.forEach(scene => box.append(picture(scene + '.jpg')));
        } else {
          const scene = selectId === 'preview-theme' ? scenes[Number(value)] || 'marmor' : value;
          box.append(picture(scene + '.jpg'));
        }
      } else if (selectId === 'skin-select') {
        box.classList.add('ff-choice-preview--figures');
        ['cube', 'ship', 'wave'].forEach(mode => box.append(picture(value + '-' + mode + '.png')));
      } else if (selectId === 'pack-select') {
        box.classList.add('ff-choice-preview--words');
        const pack = packs.find(item => item.id === value);
        const sample = pack && pack.questions[0];
        box.append(Vy.el('span', '', sample ? sample.prompt : 'Ditt sett'));
        if (sample) box.append(Vy.el('small', '', sample.correct));
      } else return null;
      return box;
    }
    function hint(id, option) {
      if (id === 'skin-select') {
        const skin = F.skins.find(item => item.id === option.value);
        return option.disabled ? 'Låst · ' + skin.hint : '';
      }
      if (id === 'pack-select') {
        const pack = packs.find(item => item.id === option.value);
        return pack ? pack.questions.length + ' spørsmål' : '';
      }
      if (id === 'level-select') {
        if (option.value === 'endless') return 'Ei ny rekkje kvar runde';
        if (option.value === 'retray-probe') return 'Dei fyrste 9 prosentane, utan spørsmål · bana er under arbeid.';
        if (option.value.startsWith('tutorial-')) return 'Øving i éin modus';
        return F.level(option.value).description;
      }
      if (id === 'reading-select') return ({ 2: 'Raskt vegval', 4: 'God lesetid', 6: 'Ekstra lesetid' })[option.value];
      if (id === 'difficulty-select') return ({ 0: 'Romslege opningar', 1: 'Fleire hinder', 2: 'Tette hinderparti' })[option.value];
      return '';
    }
    function visibleOptions(group) {
      return Array.from(group.select.options).filter(option => group.id !== 'level-select' || !option.value.startsWith('tutorial-') || option.selected);
    }
    function paint(group) {
      group.grid.replaceChildren(); group.radios = [];
      visibleOptions(group).forEach((option, index) => {
        const card = Vy.el('label', 'vp-choice ff-choice-card');
        const radio = document.createElement('input'); radio.type = 'radio';
        radio.name = group.id + '-cards'; radio.value = option.value; radio.disabled = option.disabled;
        const title = Vy.el('span', 'ff-choice-title', option.textContent.replace(/ · låst$/, ''));
        title.id = group.id + '-title-' + index; radio.setAttribute('aria-labelledby', title.id);
        const art = preview(group.id, option.value); if (art) card.append(art);
        card.append(radio, title);
        const description = hint(group.id, option);
        if (description) {
          const help = Vy.el('small', 'ff-choice-hint', description);
          help.id = group.id + '-hint-' + index; radio.setAttribute('aria-describedby', help.id); card.append(help);
        }
        if (option.disabled) card.classList.add('ff-choice-card--locked');
        radio.addEventListener('change', () => {
          if (!radio.checked) return;
          group.select.value = radio.value;
          group.select.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
        });
        group.radios.push(radio); group.grid.append(card);
      });
      group.signature = visibleOptions(group).map(option => option.value).join('|');
    }
    function sync() {
      groups.forEach(group => {
        if (group.signature !== visibleOptions(group).map(option => option.value).join('|')) paint(group);
        group.radios.forEach(radio => { radio.checked = radio.value === group.select.value; });
      });
    }
    [
      ['pack-select', 'Spørsmålsett'], ['level-select', 'Bane'], ['reading-select', 'Lesetid'],
      ['difficulty-select', 'Endelaus vanskegrad'], ['skin-select', 'Utsjånad'], ['preview-theme', 'Musikkstykke']
    ].forEach(([id, name]) => {
      const select = document.getElementById(id), label = select.closest('label');
      const fieldset = Vy.el('fieldset', 'vp-choices ff-card-fieldset ff-card-fieldset--' + id);
      fieldset.id = label.id || id + '-choices'; fieldset.hidden = label.hidden;
      const grid = Vy.el('div', 'ff-choice-grid');
      fieldset.append(Vy.el('legend', '', name)); label.replaceWith(fieldset);
      // Behald det eksisterande innstillings-API-et; berre radiokorta er tilgjengelege i UI-et.
      select.hidden = true; select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
      fieldset.append(select, grid);
      groups.set(id, { id, select, grid, radios: [], signature: null });
      select.addEventListener('change', sync);
    });
    return { sync, refresh(items) { packs = items; groups.forEach(paint); sync(); } };
  }
  F.SetupChoices = { create };
})(window);
