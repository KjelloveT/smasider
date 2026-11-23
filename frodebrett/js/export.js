/* Frødebrett — pakk ei frøde og den same spelmotoren i éi HTML-fil. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const downloadHelp = {
    html: {
      label: 'Om den køyrbare spelefila',
      title: 'Køyrbar spelefil',
      text: 'HTML-fila inneheld heile spelet. Send fila vidare eller opne henne direkte i ein nettlesar. Ho kan spelast utan nett.'
    },
    json: {
      label: 'Om JSON-fila',
      title: 'Redigerbar JSON-fil',
      text: 'Send JSON-fila til den du vil dele frøda med. Mottakaren vel «Opne JSON-fil» i Frødebrett og kan deretter redigere eller spele frøda.'
    }
  };
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
    const scriptSources = ['vyrdepil-util.js', 'state.js', 'images.js', 'team-setup.js', 'board.js'].map(name =>
      markup.querySelector('script[src*="' + name + '"]').getAttribute('src'));
    const [styles, scripts] = await Promise.all([
      Promise.all(styleSources.map(readText)),
      Promise.all([...scriptSources, 'js/offline.js?v=1'].map(readText))
    ]);

    const game = markup.getElementById('game-screen');
    const panel = game.querySelector('#quiz-selection');
    panel.classList.add('vp-panel', 'vp-panel--plain');
    panel.replaceChildren();
    const start = Vy.el('button', 'vp-button vp-button--positive', 'Start spel');
    start.type = 'button';
    start.id = 'btn-offline-start';
    start.setAttribute('aria-haspopup', 'dialog');
    start.setAttribute('aria-controls', 'team-setup');
    panel.append(start);

    const setup = markup.getElementById('team-setup');
    const question = markup.getElementById('question-modal');
    const winner = markup.getElementById('winner-modal');
    // Berre spelvisinga blir med. Fjern filreferansar til felles landskap og dekor.
    const css = styles.join('\n').replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/gi, 'none');
    return { game: game.outerHTML, modals: setup.outerHTML + question.outerHTML + winner.outerHTML, css, scripts };
  }

  function questionData(question) {
    const data = {
      question: question.question || '',
      answer: question.answer || ''
    };
    if (FB.Images.valid(question.image)) {
      data.image = question.image;
      data.imageAlt = question.imageAlt || '';
      if (question.imageCredit) data.imageCredit = question.imageCredit;
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

  function fileName(quiz, extension) {
    return 'frodebrett_' + (Vy.slug(quiz.title) || 'spel') + '.' + extension;
  }

  async function download(quiz, button) {
    button.disabled = true;
    try {
      const html = await buildHtml(quiz);
      Vy.downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }),
        fileName(quiz, 'html'));
      Vy.toast('HTML-fila er lasta ned. Ho kan opnast direkte i nettlesaren.', { kind: 'good' });
    } catch {
      Vy.toast('Kunne ikkje lage HTML-fila. Prøv å laste sida på nytt.', { kind: 'warn' });
    } finally {
      button.disabled = false;
    }
  }

  function downloadJson(quiz) {
    Vy.downloadJson({ app: 'frodebrett', version: 1, quiz }, fileName(quiz, 'json'));
  }

  function downloadTemplate() {
    const emptyCategory = () => ({
      name: '',
      questions: FB.POINTS.map(points => ({ points, question: '', answer: '' }))
    });
    Vy.downloadJson({
      app: 'frodebrett',
      version: 1,
      _instruksar: [
        'Lag ei spelbar frøde på nynorsk for emnet og aldersgruppa brukaren oppgjev.',
        'Fyll ut tittel og 2–6 kategoriar med ulike namn. Kvar kategori skal ha seks spørsmål, eitt for kvar av poengverdiane 100, 200, 300, 400, 500 og 1000.',
        'Lat spørsmåla bli vanskelegare med poengverdien. Kvart spørsmål skal peike på eitt tydeleg fasitsvar utan å røpe det.',
        'Skriv fasitsvar på eitt eller to ord, eller eit tal med eventuell eining. Gje svar utan forklaringar.',
        'Fyll ut finalen med kategori, valfritt hint, spørsmål og kort fasitsvar. Set final til null om brukaren vil spele utan finale.',
        'Behald app, version og quiz samt feltnamna i malen. Fjern _instruksar. Lever berre gyldig JSON utan Markdown eller kodegjerde.'
      ],
      quiz: {
        title: '',
        categories: [emptyCategory(), emptyCategory()],
        final: { category: '', hint: '', question: '', answer: '' }
      }
    }, 'frodebrett_tom_mal.json');
  }

  function withHelp(button, format) {
    const group = Vy.el('div', 'fb-download-action');
    const help = Vy.el('button', button.className + ' vp-button--icon');
    help.type = 'button';
    help.dataset.fbDownloadHelp = format;
    help.setAttribute('aria-label', downloadHelp[format].label);
    help.setAttribute('aria-haspopup', 'dialog');
    help.setAttribute('aria-controls', 'download-help-dialog');
    help.innerHTML = ICON('helpCircle', 18);
    group.append(button, help);
    return group;
  }

  function bindEditor(prepareQuiz) {
    FB.el('btn-editor-export').addEventListener('click', event => {
      const quiz = prepareQuiz();
      if (quiz) download(quiz, event.currentTarget);
    });
    FB.el('btn-editor-export-json').addEventListener('click', () => {
      const quiz = prepareQuiz();
      if (quiz) downloadJson(quiz);
    });
  }

  function bindHelp() {
    const dialog = FB.el('download-help-dialog');
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-fb-download-help]');
      if (!button) return;
      const help = downloadHelp[button.dataset.fbDownloadHelp];
      FB.el('download-help-title').textContent = help.title;
      FB.el('download-help-text').textContent = help.text;
      Vy.openModal(dialog);
    });
    FB.el('btn-close-download-help').addEventListener('click', () => Vy.closeModal(dialog));
    Vy.bindOverlayClose(dialog);
  }

  FB.Export = { download, downloadJson, downloadTemplate, withHelp, bindEditor, bindHelp };
})(window);
