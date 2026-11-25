/* Frødebrett — valfrie hint i spel og førehandsvising. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const choices = question => Array.isArray(question?.options) && question.options.length === 4
    && question.options.every(value => typeof value === 'string' && value.trim()) ? question.options : null;

  function formatOptions(question) {
    return choices(question)?.map((value, index) => 'ABCD'[index] + '. ' + value).join('\n') || '';
  }

  function readOptions(text) {
    const lines = text.split('\n');
    if (lines.length !== 4) return null;
    const options = lines.map((line, index) => {
      const prefix = 'ABCD'[index] + '. ';
      return line.startsWith(prefix) ? line.slice(prefix.length).trim() : '';
    });
    return choices({ options });
  }

  function setOpen(prefix, open) {
    const button = FB.el(prefix + '-hint-button');
    const panel = FB.el(prefix + '-hint');
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Gøym hint' : 'Vis hint';
  }

  function prepare(prefix, question, hint = question?.hint) {
    const button = FB.el(prefix + '-hint-button');
    const panel = FB.el(prefix + '-hint');
    if (!button || !panel) return;
    const options = choices(question);
    const text = typeof hint === 'string' ? hint.trim() : '';
    panel.replaceChildren();
    if (options) {
      const list = Vy.el('ol', 'fb-hint-options');
      list.type = 'A';
      list.append(...options.map(option => Vy.el('li', '', option)));
      panel.append(Vy.el('strong', '', 'Svaralternativ'), list);
    } else if (text) {
      panel.append(Vy.el('p', 'fb-hint-text', text));
    }
    button.hidden = !options && !text;
    setOpen(prefix, false);
  }

  function bind(prefix) {
    const panel = FB.el(prefix + '-hint');
    FB.el(prefix + '-hint-button')?.addEventListener('click', () => {
      setOpen(prefix, panel.hidden);
      if (!panel.hidden) panel.scrollIntoView({ block: 'nearest' });
    });
  }

  FB.Hints = { choices, formatOptions, readOptions, prepare, bind };
})(window);
