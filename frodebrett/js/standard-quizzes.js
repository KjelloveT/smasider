/* Frødebrett — førehandslaga frøder etter fag, trinn og tema. */
(function (root) {
  'use strict';

  const FB = root.FB;
  const subjects = {
    norsk: { name: 'Norsk', plan: 'nor01-08' },
    engelsk: { name: 'Engelsk', plan: 'eng01-06' },
    matematikk: { name: 'Matematikk', plan: 'mat01-06' },
    naturfag: { name: 'Naturfag', plan: 'nat01-05' },
    samfunnsfag: { name: 'Samfunnsfag', plan: 'saf01-05' },
    krle: { name: 'KRLE', plan: 'rle01-04' },
    'kunst-og-handverk': { name: 'Kunst og handverk', plan: 'khv01-03' },
    musikk: { name: 'Musikk', plan: 'mus01-03' },
    kroppsøving: { name: 'Kroppsøving', plan: 'kro01-06' },
    'mat-og-helse': { name: 'Mat og helse', plan: 'mhe01-03' },
    utdanningsval: { name: 'Utdanningsval', plan: 'utv01-03', firstGrade: 8 }
  };
  const gradeNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
  const themes = {
    land: 'Land og geografi',
    dyr: 'Dyr',
    hogtider: 'Religion og høgtider',
    film: 'Film',
    tv: 'TV-seriar',
    barnetv: 'Barne-TV',
    bil: 'Bilmerke',
    fotball: 'Fotball'
  };
  const catalogue = new Map();
  let renderVersion = 0;

  function load(path) {
    if (!catalogue.has(path)) {
      const pending = fetch(path)
        .then(response => {
          if (!response.ok) throw new Error('Kunne ikkje laste frødene.');
          return response.json();
        })
        .catch(error => {
          catalogue.delete(path);
          throw error;
        });
      catalogue.set(path, pending);
    }
    return catalogue.get(path);
  }

  function toQuiz(standard, grade) {
    return {
      title: subjects[standard.subject].name + ' · ' + grade + '. trinn',
      categories: standard.categories.map(category => ({
        name: category.name,
        questions: category.questions.map(([question, answer], index) => ({
          points: FB.POINTS[index], question, answer
        }))
      })),
      final: standard.final
    };
  }

  async function themeCards(selectedThemes) {
    const manifest = await load('json/themes/index.json?v=3');
    return manifest.filter(entry => selectedThemes.includes(entry.theme)).map(entry => {
      const summary = { title: entry.title, categories: entry.categories.map(name => ({ name })) };
      const loadQuiz = () => load('json/themes/' + entry.file + '?v=1').then(data => data.quiz);
      return FB.Saved.makeCard(summary, true, loadQuiz);
    });
  }

  function checked(id) {
    return [...FB.el(id).querySelectorAll('input:checked')].map(input => input.value);
  }

  function renderCurricula(selectedSubjects) {
    const source = FB.el('standard-curriculum');
    const links = selectedSubjects.map(id => {
      const item = subjects[id];
      const link = Vy.el('a', 'vp-help', 'Læreplan for ' + item.name + ' (Udir)');
      link.href = 'https://www.udir.no/lk20/' + item.plan + '?lang=nno';
      link.referrerPolicy = 'no-referrer';
      return link;
    });
    source.replaceChildren(...links);
    source.hidden = !links.length;
  }

  async function render() {
    const version = ++renderVersion;
    const selectedGrades = checked('standard-grade').map(Number);
    const selectedSubjects = checked('standard-subject');
    const selectedThemes = checked('standard-theme');
    const list = FB.el('standard-list');
    const status = FB.el('standard-status');
    list.replaceChildren();
    list.hidden = true;
    renderCurricula(selectedSubjects);

    if (!selectedGrades.length && !selectedSubjects.length && !selectedThemes.length) {
      status.textContent = 'Kryss av eit trinn, eit fag eller eit tema.';
      return;
    }
    status.textContent = 'Lastar frødene …';
    const grades = selectedGrades.length ? selectedGrades : gradeNumbers;
    const loads = selectedThemes.length ? [themeCards(selectedThemes)] : [];
    if (selectedGrades.length || selectedSubjects.length) {
      for (const grade of grades) {
        if (selectedSubjects.length && !selectedSubjects.some(id => (subjects[id].firstGrade ?? 1) <= grade)) continue;
        loads.push(load('json/standard/' + grade + '.json?v=2').then(pack => pack.quizzes
          .filter(standard => !selectedSubjects.length || selectedSubjects.includes(standard.subject))
          .map(standard => FB.Saved.makeCard(toQuiz(standard, grade), true))));
      }
    }
    const results = await Promise.allSettled(loads);
    if (renderVersion !== version) return;
    const cards = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    list.append(...cards);
    list.hidden = !cards.length;
    const count = cards.length ? cards.length + (cards.length === 1 ? ' frøde' : ' frøder') : '';
    if (results.some(result => result.status === 'rejected')) {
      status.textContent = count
        ? count + '. Nokre frøder kunne ikkje lastast.'
        : 'Kunne ikkje laste frødene. Endre eit val for å prøve att.';
    } else {
      status.textContent = count || 'Ingen frøder for desse vala.';
    }
  }

  function addChoice(group, value, name, selected) {
    const label = Vy.el('label', 'vp-choice');
    const input = Vy.el('input');
    input.type = 'checkbox';
    input.value = value;
    input.checked = input.defaultChecked = selected;
    label.append(input, name);
    group.append(label);
    return input;
  }

  function bind() {
    const filters = FB.el('standard-filters');
    const all = FB.el('standard-all');
    const grade = FB.el('standard-grade');
    const subject = FB.el('standard-subject');
    const theme = FB.el('standard-theme');
    for (const number of gradeNumbers) {
      addChoice(grade, number, number + '.', all.checked).setAttribute('aria-label', number + '. trinn');
    }
    for (const [id, item] of Object.entries(subjects)) {
      addChoice(subject, id, item.name, all.checked);
    }
    for (const [id, name] of Object.entries(themes)) {
      addChoice(theme, id, name, all.checked);
    }
    const choices = [...filters.querySelectorAll('input[type="checkbox"]:not(#standard-all)')];
    filters.addEventListener('change', ({ target }) => {
      if (target === all) {
        for (const choice of choices) choice.checked = all.checked;
      } else {
        all.checked = choices.every(choice => choice.checked);
      }
      render();
    });
    render();
  }

  FB.StandardQuizzes = { bind };
})(window);
