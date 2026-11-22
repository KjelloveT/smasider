const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const subjects = [
  'engelsk', 'kroppsøving', 'krle', 'kunst-og-handverk', 'mat-og-helse',
  'matematikk', 'musikk', 'naturfag', 'norsk', 'samfunnsfag'
];

function nonEmptyText(text, field) {
  assert.equal(typeof text, 'string', field);
  assert.ok(text.trim(), field);
}

function shortAnswer(answer, field) {
  nonEmptyText(answer, field);
  assert.ok(answer.trim().split(/\s+/u).length <= 2, field + ': ' + answer);
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
  const data = JSON.parse(readFileSync(path.join(__dirname, '../json/themes/land-i-verda.json'), 'utf8'));
  assert.equal(data.app, 'frodebrett');
  assert.equal(data.version, 1);
  const { categories, final } = data.quiz;
  assert.deepEqual(categories.map(category => category.name), ['Flagg', 'Hovudstader', 'Landemerke']);
  for (const category of categories) {
    assert.deepEqual(category.questions.map(question => question.points), [100, 200, 300, 400, 500, 1000]);
    for (const question of category.questions) {
      nonEmptyText(question.question, category.name);
      shortAnswer(question.answer, question.question);
      if (category.name === 'Hovudstader') continue;
      assert.match(question.image, /^data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+$/);
      assert.ok(question.image.length <= 280000);
      nonEmptyText(question.imageAlt, question.question);
      const { title, author, license, source, licenseUrl } = question.imageCredit;
      for (const text of [title, author, license]) nonEmptyText(text, source);
      assert.match(source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      if (license.startsWith('CC ')) assert.match(licenseUrl, /^https:\/\/creativecommons\.org\/licenses\//);
    }
  }
  shortAnswer(final.answer, final.question);
  assert.equal(data.wikidata.filter(claim => claim.property === 'P41').length, 6);
  assert.equal(data.wikidata.filter(claim => claim.property === 'P18').length, 6);
});
