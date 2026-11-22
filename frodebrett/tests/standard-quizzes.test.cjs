const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const subjects = [
  'engelsk', 'kroppsøving', 'krle', 'kunst-og-handverk', 'mat-og-helse',
  'matematikk', 'musikk', 'naturfag', 'norsk', 'samfunnsfag'
];
const points = [100, 200, 300, 400, 500, 1000];

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
  assert.match(question.image, /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/);
  assert.ok(question.image.length <= 280000);
  nonEmptyText(question.imageAlt, question.question);
  const { title, author, license, source, licenseUrl } = question.imageCredit;
  for (const text of [title, author, license]) nonEmptyText(text, source);
  assert.match(source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  if (license.startsWith('CC ')) assert.match(licenseUrl, /^https:\/\/creativecommons\.org\/licenses\//);
}

for (let grade = 1; grade <= 10; grade++) {
  test(`LK20-frøder for ${grade}. trinn har alle fag og poengnivå, med korte fasitsvar`, () => {
    const pack = JSON.parse(readFileSync(path.join(__dirname, '../json/standard', grade + '.json'), 'utf8'));
    const expected = grade < 8 ? subjects : [...subjects, 'utdanningsval'];
    assert.equal(pack.grade, grade);
    assert.deepEqual(pack.quizzes.map(quiz => quiz.subject).sort(), [...expected].sort());

    for (const quiz of pack.quizzes) {
      assert.equal(quiz.categories.length, 3, quiz.subject);
      assert.equal(quiz.categories[2].name, 'Snodige fakta', quiz.subject);
      assert.equal(new Set(quiz.categories.map(category => category.name)).size, 3, quiz.subject);
      const prompts = new Set();

      for (const category of quiz.categories) {
        nonEmptyText(category.name, quiz.subject + ' category');
        assert.equal(category.questions.length, 6, category.name);
        for (const pair of category.questions) {
          assert.ok(Array.isArray(pair));
          assert.equal(pair.length, 2);
          const [question, answer] = pair;
          nonEmptyText(question, category.name + ' question');
          shortAnswer(answer, question);
          prompts.add(question.trim());
        }
      }

      nonEmptyText(quiz.final.category, quiz.subject + ' final category');
      nonEmptyText(quiz.final.question, quiz.subject + ' final question');
      shortAnswer(quiz.final.answer, quiz.final.question);
      prompts.add(quiz.final.question.trim());
      assert.equal(prompts.size, 19, quiz.subject + ' unique prompts');
    }
  });
}

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
    ['Utdøydde dyr', 'utdoydde-dyr'],
    ['Fisk', 'fisk'],
    ['Pattedyr', 'pattedyr'],
    ['Fuglar', 'fuglar']
  ]);
  assert.equal(catalogue.length, expected.size);
  assert.equal(new Set(catalogue.map(entry => entry.file)).size, expected.size);
  assert.equal(new Set(catalogue.map(entry => entry.title)).size, expected.size);

  for (const entry of catalogue) {
    assert.equal(entry.theme, expected.get(entry.title), entry.title);
    assert.match(entry.file, /^[a-z-]+\.json$/);
    const { app, version, quiz, wikidata } = readTheme(entry.file);
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
    assert.ok(imageCount >= 6, entry.title);
    assert.equal(wikidata.filter(claim => ['P18', 'P41'].includes(claim.property)).length, imageCount);
    if (entry.categories.includes('Hovudstader')) {
      assert.equal(wikidata.filter(claim => claim.property === 'P36').length, points.length);
    }
    nonEmptyText(quiz.final.category, entry.title);
    nonEmptyText(quiz.final.question, quiz.final.category);
    shortAnswer(quiz.final.answer, quiz.final.question);
    prompts.add(quiz.final.question.trim());
    assert.equal(prompts.size, 31, entry.title);
  }
});
