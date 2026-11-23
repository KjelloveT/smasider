/* Frødebrett — lagdialogen på nett og i den sjølvstendige spelefila. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const minTeams = 2;
  let confirmStart;

  function syncRows() {
    const rows = [...FB.el('teams-container').children];
    rows.forEach((row, index) => {
      const label = 'Lag ' + (index + 1);
      const input = row.querySelector('input');
      input.placeholder = label;
      input.setAttribute('aria-label', label);
      const remove = row.querySelector('button');
      remove.hidden = rows.length <= minTeams;
      remove.setAttribute('aria-label', 'Fjern lag ' + (index + 1));
    });
    FB.el('btn-add-team').disabled = rows.length >= FB.TEAM_COLORS.length;
  }

  function appendRow() {
    const row = Vy.el('div', 'team-input');
    const input = Vy.el('input', 'vp-input team-name');
    input.type = 'text';
    input.maxLength = 20;
    const remove = Vy.el('button', 'vp-button vp-button--compact vp-button--quiet btn-remove-team', 'Fjern');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      const neighbour = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      syncRows();
      neighbour.querySelector('input').focus();
    });
    row.append(input, remove);
    FB.el('teams-container').append(row);
    return input;
  }

  function bind() {
    const dialog = FB.el('team-setup');
    for (let index = 0; index < minTeams; index++) appendRow();
    syncRows();
    FB.el('btn-add-team').addEventListener('click', () => {
      const input = appendRow();
      syncRows();
      input.focus();
    });
    FB.el('btn-cancel-team-setup').addEventListener('click', () => Vy.closeModal(dialog));
    FB.el('team-setup-form').addEventListener('submit', event => {
      event.preventDefault();
      const names = [...dialog.querySelectorAll('.team-name')].map(input => input.value.trim());
      const start = confirmStart;
      confirmStart = null;
      Vy.closeModal(dialog);
      start?.(names);
    });
    dialog.addEventListener('close', () => { if (!dialog.open) confirmStart = null; });
    Vy.bindOverlayClose(dialog);
  }

  function open(title, start) {
    confirmStart = start;
    FB.el('team-setup-quiz').textContent = title;
    Vy.openModal(FB.el('team-setup'));
  }

  function reset() {
    FB.el('teams-container').querySelectorAll('.team-name').forEach(input => { input.value = ''; });
  }

  FB.TeamSetup = { bind, open, reset };
})(window);
