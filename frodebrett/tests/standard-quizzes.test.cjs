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
