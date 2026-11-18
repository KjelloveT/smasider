/* Frødebrett — pakk ei frøde og den same spelmotoren i éi HTML-fil. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const page = new URL('../index.html', document.currentScript.src);
  let cachedAssets;

  async function readText(location) {
    const response = await fetch(new URL(location, page));
    if (!response.ok) throw new Error('Kunne ikkje hente spelfilene. Prøv på nytt.');
    return response.text();
  }

  async function loadAssets() {
    const template = document.createElement('template');
    template.innerHTML = await readText(page);
    const markup = template.content;
    const styleSources = [...markup.querySelectorAll('link[rel="stylesheet"]')].map(node => node.getAttribute('href'));
    const scriptSources = ['vyrdepil-util.js', 'state.js', 'images.js', 'board.js'].map(name =>
      markup.querySelector('script[src*="' + name + '"]').getAttribute('src'));
    const [styles, scripts] = await Promise.all([
      Promise.all(styleSources.map(readText)),
      Promise.all([...scriptSources, 'js/offline.js?v=1'].map(readText))
    ]);

    const game = markup.getElementById('game-screen');
    game.querySelector('#team-setup').open = true;
    const panel = game.querySelector('#quiz-selection');
    panel.replaceChildren();
    const start = Vy.el('button', 'vp-button vp-button--positive', 'Start spel');
    start.type = 'button';
    start.id = 'btn-offline-start';
    panel.append(start);
    game.prepend(game.querySelector('#team-setup'));

    game.querySelectorAll('.box1').forEach(element => element.classList.add('vp-panel', 'vp-panel--plain'));
    const question = markup.getElementById('question-modal');
    const winner = markup.getElementById('winner-modal');
    // Berre spelvisinga blir med. Fjern filreferansar til felles landskap og dekor.
    const css = styles.join('\n').replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/gi, 'none');
    return { game: game.outerHTML, modals: question.outerHTML + winner.outerHTML, css, scripts };
  }

  function questionData(question) {
    const data = {
      question: question.question || '',
      answer: question.answer || ''
    };
    if (FB.Images.valid(question.image)) {
      data.image = question.image;
      data.imageAlt = question.imageAlt || '';
    }
    return data;
  }

  function packageData(quiz) {
    const categories = quiz.categories.map(category => ({
      name: category.name,
      questions: category.questions.map(question => ({
        points: question.points,
        ...questionData(question)
      }))
    }));
    const final = quiz.final && {
      category: quiz.final.category, hint: quiz.final.hint || '', ...questionData(quiz.final)
    };
    return JSON.stringify({ app: 'frodebrett', version: 1, quiz: { title: quiz.title, categories, final } })
      .replace(/</g, '\\u003c');
  }

  async function buildHtml(quiz) {
    if (!cachedAssets) cachedAssets = loadAssets().catch(error => {
      cachedAssets = null;
      throw error;
    });
    const { game, modals, css, scripts } = await cachedAssets;
    const title = Vy.escapeHtml(quiz.title);
    const code = scripts.map(source => '<script>' + source.replace(/<\/script/gi, '<\\/script') + '</script>').join('\n');

    return `<!doctype html>
<html lang="nn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${title} — Frødebrett</title>
<style>
${css}
main { margin-block: clamp(12px, 3vw, 32px); }
#quiz-selection { justify-items: start; }
#game-screen { margin-block-start: 16px; }
.fb-export-credit { margin-block: 16px; }
</style>
</head>
<body class="vp-page vp-migrated-page" data-vp-design data-vp-app="frodebrett">
<main class="vp-shell">
<header class="vp-panel vp-panel--plain">
<h1 id="library-heading" tabindex="-1">${title}</h1>
<p class="vp-help">Frødebrett · Spel direkte i nettlesaren, med eller utan nett.</p>
</header>
${game}
<footer class="fb-export-credit"><small>Spelmotor frå Vyrdepil · CC BY-NC-SA 4.0</small></footer>
</main>
${modals}
<script id="frode-data" type="application/json">${packageData(quiz)}</script>
${code}
</body>
</html>`;
  }

  async function download(quiz, button) {
    button.disabled = true;
    try {
      const html = await buildHtml(quiz);
      Vy.downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }),
        'frodebrett_' + (Vy.slug(quiz.title) || 'spel') + '.html');
      Vy.toast('HTML-fila er lasta ned. Ho kan opnast direkte i nettlesaren.', { kind: 'good' });
    } catch {
      Vy.toast('Kunne ikkje lage HTML-fila. Prøv å laste sida på nytt.', { kind: 'warn' });
    } finally {
      button.disabled = false;
    }
  }

  FB.Export = { download };
})(window);
