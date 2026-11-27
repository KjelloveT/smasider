const assert = require('node:assert/strict');
const { readFileSync, statSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const subjects = [
  'engelsk', 'kroppsøving', 'krle', 'kunst-og-handverk', 'mat-og-helse',
  'matematikk', 'musikk', 'naturfag', 'norsk', 'samfunnsfag'
];
const points = [100, 200, 300, 400, 500, 1000];
const revisedGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function readTheme(file) {
  return JSON.parse(readFileSync(path.join(__dirname, '../json/themes', file), 'utf8'));
}

function nonEmptyText(text, field) {
  assert.equal(typeof text, 'string', field);
  assert.ok(text.trim(), field);
}

function shortAnswer(answer, field) {
  nonEmptyText(answer, field);
  assert.ok(answer.trim().split(/\s+/u).length <= 2, field + ': ' + answer);
}

function checkMedia(question) {
  if (question.image.startsWith('data:')) {
    assert.match(question.image, /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/);
    assert.ok(question.image.length <= 280000);
  } else {
    assert.match(question.image, /^json\/standard-media\/[a-f0-9]{24}\.jpg$/);
    const file = statSync(path.join(__dirname, '..', question.image));
    assert.ok(file.isFile() && file.size > 0 && file.size <= 500000, question.image);
  }
  nonEmptyText(question.imageAlt, question.question);
  const { title, author, license, source, licenseUrl } = question.imageCredit;
  for (const text of [title, author, license]) nonEmptyText(text, source);
  assert.match(source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  if (license.startsWith('CC ')) assert.match(licenseUrl, /^https:\/\/creativecommons\.org\/licenses\//);
}

const normalized = value => value.trim().normalize('NFC').toLocaleLowerCase('nn');

function checkNewQuestion(question) {
  assert.equal(question.options.length, 4, question.question);
  for (const option of question.options) shortAnswer(option, question.question);
  const choices = question.options.map(normalized);
  assert.equal(new Set(choices).size, 4, question.question);
  assert.ok(choices.includes(normalized(question.answer)), question.question);
  if (!question.image) return 0;

  checkMedia(question);
  const wordCount = question.imageKeywords.trim().split(/\s+/u).length;
  assert.ok(wordCount >= 2 && wordCount <= 4, question.question);
  return 1;
}

for (let grade = 1; grade <= 10; grade++) {
  test(`LK20-frøder for ${grade}. trinn har alle fag og poengnivå, med korte fasitsvar`, () => {
    const pack = JSON.parse(readFileSync(path.join(__dirname, '../json/standard', grade + '.json'), 'utf8'));
    const expected = grade < 8 ? subjects : [...subjects, 'utdanningsval'];
    assert.equal(pack.grade, grade);
    assert.deepEqual(pack.quizzes.map(quiz => quiz.subject).sort(), [...expected].sort());

    const revised = revisedGrades.includes(grade);
    const categoryCount = revised ? 5 : 3;
    for (const quiz of pack.quizzes) {
      assert.equal(quiz.categories.length, categoryCount, quiz.subject);
      if (!revised) assert.equal(quiz.categories[2].name, 'Snodige fakta', quiz.subject);
      assert.equal(new Set(quiz.categories.map(category => category.name)).size, categoryCount, quiz.subject);
      const prompts = new Set();
      const answers = new Set();
      let images = 0;

      for (const category of quiz.categories) {
        nonEmptyText(category.name, quiz.subject + ' category');
        assert.equal(category.questions.length, 6, category.name);
        for (const pair of category.questions) {
          assert.ok(Array.isArray(pair));
          assert.equal(pair.length, revised ? 3 : 2);
          const [question, answer, details] = pair;
          nonEmptyText(question, category.name + ' question');
          shortAnswer(answer, question);
          prompts.add(normalized(question));
          if (revised) {
            images += checkNewQuestion({ ...details, question, answer });
            answers.add(normalized(answer));
          }
        }
      }

      nonEmptyText(quiz.final.category, quiz.subject + ' final category');
      nonEmptyText(quiz.final.question, quiz.subject + ' final question');
      shortAnswer(quiz.final.answer, quiz.final.question);
      prompts.add(normalized(quiz.final.question));
      assert.equal(prompts.size, categoryCount * points.length + 1, quiz.subject + ' unike spørsmål');
      if (revised) {
        assert.equal(quiz.thumbnail, grade + '-' + quiz.subject);
        images += checkNewQuestion(quiz.final);
        answers.add(normalized(quiz.final.answer));
        assert.equal(answers.size, 31, quiz.subject + ' unike fasitar');
        assert.ok(images >= 16, quiz.subject + ' minst 16 illustrerte spørsmål');
      }
    }
  });
}

test('Alle fag- og temafrøder har lokale miniatyrbilete med kjelder', () => {
  const { boards, subjects: subjectCovers, themes: themeCovers } = JSON.parse(
    readFileSync(path.join(__dirname, '../json/thumbnails.json'), 'utf8')
  );
  for (const grade of revisedGrades) {
    for (const subject of subjects) checkMedia(boards[grade + '-' + subject]);
  }
  for (const subject of [...subjects, 'utdanningsval']) checkMedia(subjectCovers[subject]);
  for (const entry of readTheme('index.json')) checkMedia(themeCovers[entry.file]);
});

test('Land i verda har korte fasitar og innebygde bilete med kjelder', () => {
  const data = readTheme('land-i-verda.json');
  assert.equal(data.app, 'frodebrett');
  assert.equal(data.version, 1);
  const { categories, final } = data.quiz;
  assert.deepEqual(categories.map(category => category.name), ['Flagg', 'Hovudstader', 'Landemerke']);
  for (const category of categories) {
    assert.deepEqual(category.questions.map(question => question.points), points);
    for (const question of category.questions) {
      nonEmptyText(question.question, category.name);
      shortAnswer(question.answer, question.question);
      if (category.name === 'Hovudstader') continue;
      checkMedia(question);
    }
  }
  shortAnswer(final.answer, final.question);
  assert.equal(data.wikidata.filter(claim => claim.property === 'P41').length, 6);
  assert.equal(data.wikidata.filter(claim => claim.property === 'P18').length, 6);
});

test('Temakatalogen peikar på heile brett med korte fasitar og krediterte bilete', () => {
  const catalogue = readTheme('index.json');
  const expected = new Map([
    ['Land i verda', 'land'],
    ['Land i Europa', 'land'],
    ['Land i Asia', 'land'],
    ['Land i Afrika', 'land'],
    ['Land i Nord-Amerika', 'land'],
    ['Land i Sør-Amerika', 'land'],
    ['Land i Oseania', 'land'],
    ['Antarktis', 'land'],
    ['Utdøydde dyr', 'dyr'],
    ['Fisk', 'dyr'],
    ['Pattedyr', 'dyr'],
    ['Fuglar', 'dyr'],
    ['Norsk fauna', 'dyr'],
    ['Disney-filmar', 'film'],
    ['Kjende bilmerke', 'bil'],
    ['Fotballspelarar i 2026', 'fotball'],
    ['Kristne høgtider', 'hogtider'],
    ['Høgtider i islam', 'hogtider'],
    ['Jødiske høgtider', 'hogtider'],
    ['Hinduistiske høgtider', 'hogtider'],
    ['Buddhistiske høgtider', 'hogtider'],
    ['Norske familiefilmar', 'film'],
    ['Animasjonsfilmar', 'film'],
    ['Slik blir film laga', 'film'],
    ['Bluey', 'tv'],
    ['Pokémon – Indigo-ligaen', 'tv'],
    ['Avatar – legenda om Aang', 'tv'],
    ['Barne-TV', 'barnetv']
  ]);
  assert.equal(catalogue.length, expected.size);
  assert.equal(new Set(catalogue.map(entry => entry.file)).size, expected.size);
  assert.equal(new Set(catalogue.map(entry => entry.title)).size, expected.size);

  for (const entry of catalogue) {
    assert.equal(entry.theme, expected.get(entry.title), entry.title);
    assert.match(entry.file, /^[a-z0-9-]+\.json$/);
    const { app, version, quiz, wikidata = [] } = readTheme(entry.file);
    assert.equal(app, 'frodebrett');
    assert.equal(version, 1);
    assert.equal(quiz.title, entry.title);
    assert.deepEqual(entry.categories, quiz.categories.map(category => category.name));
    if (entry.file === 'land-i-verda.json') continue;
    assert.equal(new Set(entry.categories).size, 5, entry.title);
    assert.equal(entry.categories.length, 5, entry.title);

    const prompts = new Set();
    let imageCount = 0;
    for (const category of quiz.categories) {
      nonEmptyText(category.name, entry.title);
      assert.deepEqual(category.questions.map(question => question.points), points);
      for (const question of category.questions) {
        nonEmptyText(question.question, category.name);
        shortAnswer(question.answer, question.question);
        prompts.add(question.question.trim());
        if (question.image) {
          checkMedia(question);
          imageCount++;
        }
      }
    }
    if (entry.categories.includes('Hovudstader')) {
      assert.equal(wikidata.filter(claim => claim.property === 'P36').length, points.length);
    }
    nonEmptyText(quiz.final.category, entry.title);
    nonEmptyText(quiz.final.question, quiz.final.category);
    shortAnswer(quiz.final.answer, quiz.final.question);
    if (quiz.final.image) {
      checkMedia(quiz.final);
      imageCount++;
    }
    if (['land', 'dyr', 'bil'].includes(entry.theme)) assert.ok(imageCount >= 6, entry.title);
    if (['hogtider', 'tv', 'barnetv'].includes(entry.theme)) assert.ok(imageCount > 0, entry.title);
    assert.equal(wikidata.filter(claim => ['P18', 'P41', 'P154'].includes(claim.property)).length, imageCount);
    prompts.add(quiz.final.question.trim());
    assert.equal(prompts.size, 31, entry.title);
  }
});

test('TV-frødene har dokumentert aldersgrense til og med 12 år', () => {
  const entries = readTheme('index.json').filter(entry => entry.theme === 'tv');
  assert.equal(entries.length, 3);
  for (const entry of entries) {
    const { minimumAge, sources } = readTheme(entry.file);
    assert.ok(Number.isInteger(minimumAge) && minimumAge >= 0 && minimumAge <= 12, entry.title);
    assert.match(sources[0], /^https:\/\/(?:www\.)?(?:disneyplus\.com\/(?:en|no)-no\/|netflix\.com\/no\/)/);
  }
});

test('Logogjettinga har Wikidata-logoar og nøytrale ledetrådar', () => {
  const { quiz, wikidata } = readTheme('bilmerke.json');
  const logoCategory = quiz.categories.find(category => category.name === 'Kjenn att logoen');
  assert.equal(logoCategory.questions.length, points.length);
  assert.ok(wikidata.every(claim => /^Q\d+$/.test(claim.item) && claim.property === 'P154'));

  for (const question of logoCategory.questions) {
    checkMedia(question);
    const clue = (question.question + ' ' + question.imageAlt).toLowerCase();
    assert.ok(!clue.includes(question.answer.toLowerCase()), question.answer);
  }
});
