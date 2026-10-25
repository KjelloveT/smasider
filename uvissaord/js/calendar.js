/* Lokal kalender for datofesta utfordringar. Ingen nettverk eller eiga lagring. */
window.OrdvettCalendar = (function () {
  'use strict';
  let selected, month, onSelect;
  const byId = id => document.getElementById(id);
  function paint() {
    const today = OrdvettSchedule.dateKey(), last = OrdvettSchedule.latestArchive(today);
    const firstMonth = OrdvettSchedule.START.slice(0, 7), lastMonth = (last || OrdvettSchedule.START).slice(0, 7);
    if (month > lastMonth) month = lastMonth;
    byId('archiveMonth').value = month; byId('archiveMonth').min = firstMonth; byId('archiveMonth').max = lastMonth;
    byId('nextMonth').disabled = month >= lastMonth;
    byId('previousMonth').disabled = month <= firstMonth;
    byId('archiveNotice').hidden = month > firstMonth;
    const dates = OrdvettSchedule.archiveDates(month, today);
    const offset = dates.length ? (new Date(dates[0] + 'T12:00:00Z').getUTCDay() + 6) % 7 : 0;
    const keys = dates.map(date => OrdvettSchedule.inRange(date) ? OrdvettSchedule.LEVELS.map(level => OrdvettSchedule.daily(level.id, date).key) : []);
    const statuses = OrdvettStorage.dayStatuses(keys.flat());
    const cells = Array.from({ length: offset }, () => { const blank = Vy.el('span'); blank.setAttribute('aria-hidden', 'true'); return blank; });
    dates.forEach((date, index) => {
      const button = Vy.el('button', 'vp-button vp-button--quiet ov-calendar-day', String(Number(date.slice(-2))));
      button.type = 'button'; button.disabled = date >= today || !OrdvettSchedule.inRange(date);
      button.setAttribute('aria-pressed', String(date === selected));
      const dayStates = keys[index].map(key => statuses[key]);
      const complete = dayStates.filter(state => state === 'complete').length;
      button.setAttribute('aria-label', `${OrdvettSchedule.dateLabel(date)}${dayStates.some(Boolean) ? `, ${complete} av 3 nivå ferdige` : ''}`);
      if (dayStates.some(Boolean)) {
        const mark = Vy.el('span', 'ov-calendar-mark'); mark.setAttribute('aria-hidden', 'true');
        dayStates.forEach(state => { const dot = Vy.el('i'); dot.dataset.state = state || 'waiting'; mark.append(dot); });
        button.append(mark);
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
    if (next < OrdvettSchedule.START.slice(0, 7) || next > (OrdvettSchedule.latestArchive() || OrdvettSchedule.START).slice(0, 7)) return;
    month = next; paint();
  }
  function init(callback) {
    onSelect = callback;
    byId('previousMonth').addEventListener('click', () => shift(-1));
    byId('nextMonth').addEventListener('click', () => shift(1));
    byId('archiveMonth').addEventListener('change', event => {
      const value = event.target.value;
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= OrdvettSchedule.START.slice(0, 7) && value <= (OrdvettSchedule.latestArchive() || OrdvettSchedule.START).slice(0, 7)) month = value;
      paint();
    });
  }
  function render(date) { selected = date; if (!month) month = date.slice(0, 7); paint(); }
  return Object.freeze({ init, render });
})();
