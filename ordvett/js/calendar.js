/* Lokal kalender for datofesta utfordringar. Ingen nettverk eller eiga lagring. */
window.OrdvettCalendar = (function () {
  'use strict';
  let selected, level, month, onSelect;
  const byId = id => document.getElementById(id);
  function paint() {
    const today = OrdvettSchedule.dateKey();
    byId('archiveMonth').value = month; byId('archiveMonth').max = today.slice(0, 7);
    byId('nextMonth').disabled = month >= today.slice(0, 7);
    byId('previousMonth').disabled = month === '0001-01';
    const first = new Date(month + '-01T12:00:00Z');
    const offset = (first.getUTCDay() + 6) % 7;
    const next = new Date(first); next.setUTCMonth(next.getUTCMonth() + 1);
    const count = Math.round((next - first) / 86400000);
    const dates = Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
    const keys = dates.map(date => OrdvettSchedule.daily(level, date).key);
    const statuses = OrdvettStorage.dayStatuses(keys);
    const cells = Array.from({ length: offset }, () => { const blank = Vy.el('span'); blank.setAttribute('aria-hidden', 'true'); return blank; });
    dates.forEach((date, index) => {
      const button = Vy.el('button', 'vp-button vp-button--quiet ov-calendar-day', String(index + 1));
      button.type = 'button'; button.disabled = date >= today;
      button.setAttribute('aria-pressed', String(date === selected));
      const status = statuses[keys[index]];
      button.setAttribute('aria-label', `${OrdvettSchedule.dateLabel(date)}${status === 'complete' ? ', ferdig' : status === 'started' ? ', påbyrja' : ''}`);
      if (status) {
        button.dataset.progress = status; const mark = Vy.el('span', 'ov-calendar-mark'); mark.setAttribute('aria-hidden', 'true');
        if (status === 'complete') { const glyph = Vy.el('span'); glyph.dataset.icon = 'check'; mark.append(glyph); }
        else mark.textContent = '·'; button.append(mark);
      }
      button.addEventListener('click', () => {
        onSelect(date); byId('archiveDays').querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
      }); cells.push(button);
    });
    byId('archiveDays').replaceChildren(...cells);
    VyrdepilIcons.hydrateIcons(byId('archiveDays'));
  }
  function shift(delta) {
    const date = new Date(month + '-01T12:00:00Z'); date.setUTCMonth(date.getUTCMonth() + delta);
    const next = date.toISOString().slice(0, 7);
    if (next < '0001-01' || next > OrdvettSchedule.dateKey().slice(0, 7)) return;
    month = next; paint();
  }
  function init(callback) {
    onSelect = callback;
    byId('previousMonth').addEventListener('click', () => shift(-1));
    byId('nextMonth').addEventListener('click', () => shift(1));
    byId('archiveMonth').addEventListener('change', event => {
      const value = event.target.value;
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= '0001-01' && value <= OrdvettSchedule.dateKey().slice(0, 7)) month = value;
      paint();
    });
  }
  function render(date, selectedLevel) { selected = date; level = selectedLevel; if (!month) month = date.slice(0, 7); paint(); }
  return Object.freeze({ init, render });
})();
