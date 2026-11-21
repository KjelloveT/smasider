/* Frødebrett — fast katalog med frøder etter fag og trinn. */
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
  const grades = new Map();
  let renderVersion = 0;

  function loadGrade(grade) {
    if (!grades.has(grade)) {
      const pending = fetch('json/standard/' + grade + '.json?v=2')
        .then(response => {
          if (!response.ok) throw new Error('Kunne ikkje laste trinnet.');
          return response.json();
        })
        .catch(error => {
          grades.delete(grade);
          throw error;
        });
      grades.set(grade, pending);
    }
    return grades.get(grade);
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

  async function render() {
    const version = ++renderVersion;
    const grade = Number(FB.el('standard-grade').value);
    const select = FB.el('standard-subject');
    for (const option of select.options) {
      option.disabled = Boolean(grade && subjects[option.value]?.firstGrade > grade);
    }
    if (select.selectedOptions[0].disabled) select.value = '';
    const subject = select.value;
    const list = FB.el('standard-list');
    const status = FB.el('standard-status');
    const source = FB.el('standard-curriculum');
    list.replaceChildren();
    list.hidden = true;
    source.hidden = !grade || !subject;
    if (!source.hidden) {
      source.href = 'https://www.udir.no/lk20/' + subjects[subject].plan + '?lang=nno';
      source.textContent = 'Læreplan for ' + subjects[subject].name + ' (Udir)';
    }
    status.textContent = grade ? 'Lastar frødene …' : 'Vel trinn for å sjå frødene.';
    if (!grade) return;

    try {
      const pack = await loadGrade(grade);
      if (renderVersion !== version) return;
      const quizzes = pack.quizzes.filter(standard => !subject || standard.subject === subject);
      list.append(...quizzes.map(standard => FB.Saved.makeCard(toQuiz(standard, grade), true)));
      list.hidden = !quizzes.length;
      status.textContent = quizzes.length
        ? quizzes.length + (quizzes.length === 1 ? ' frøde' : ' frøder') + ' for ' + grade + '. trinn'
        : 'Ingen frøder for dette valet.';
    } catch {
      if (renderVersion === version) status.textContent = 'Kunne ikkje laste frødene. Vel trinn på nytt for å prøve att.';
    }
  }

  function bind() {
    const grade = FB.el('standard-grade');
    const subject = FB.el('standard-subject');
    for (let number = 1; number <= 10; number++) {
      const option = Vy.el('option', '', number + '. trinn');
      option.value = number;
      grade.append(option);
    }
    for (const [id, item] of Object.entries(subjects)) {
      const option = Vy.el('option', '', item.name);
      option.value = id;
      subject.append(option);
    }
    grade.addEventListener('change', render);
    subject.addEventListener('change', render);
    render();
  }

  FB.StandardQuizzes = { bind };
})(window);
