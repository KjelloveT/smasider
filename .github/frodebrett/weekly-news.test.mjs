import assert from 'node:assert/strict';
import test from 'node:test';
import { newsPeriod, validateDraft, buildQuiz, reviewEmail } from './weekly-news.mjs';
import { licensedImage } from './news-images.mjs';

const period = { edition: '2026-11-28', from: '2026-11-21', through: '2026-11-27' };
const filePage = 'https://commons.wikimedia.org/wiki/File:Test.jpg';
const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8CcAAAAASUVORK5CYII=', 'base64');

function exampleDraft() {
  const make = (label, published = period.through) => ({
    question: 'Kva stad gjeld artikkel ' + label + '?',
    answer: 'Oslo',
    source: { title: 'Ein trygg testartikkel', publisher: 'Prøveavis', url: 'https://example.org/news/' + label, published },
    imagePage: '',
    imageAlt: ''
  });
  return {
    categories: ['snodige nyheter', 'Natur', 'Idrett', 'Kultur og språk', 'Teknologi'].map((name, index) => ({
      name,
      questions: Array.from({ length: 6 }, (_, number) => make(1 + index * 6 + number))
    })),
    final: { category: 'Stader', hint: 'Ein norsk by', entry: make(31, period.from) }
  };
}

test('veka tek til laurdag i norsk tid og dekkjer sju fullførte datoar', () => {
  assert.deepEqual(newsPeriod(new Date('2026-11-27T23:30:00Z')), period);
  assert.equal(newsPeriod(new Date('2026-11-27T22:30:00Z')).edition, '2026-11-21');
  assert.deepEqual(newsPeriod(new Date('2027-01-04T23:00:00Z'), '2027-01-02'), {
    edition: '2027-01-02', from: '2026-12-26', through: '2027-01-01'
  });
  assert.throws(() => newsPeriod(new Date(), '2026-11-27'), /laurdag/);
});

test('utkastet må ha rett fast kategori, korte fasitar og kjelder innanfor perioden', () => {
  assert.doesNotThrow(() => validateDraft(exampleDraft(), period));
  const tooOld = exampleDraft();
  tooOld.final.entry.source.published = '2026-11-20';
  assert.throws(() => validateDraft(tooOld, period), /datoperioden/);
  const tooLong = exampleDraft();
  tooLong.categories[0].questions[0].answer = 'Dette er Oslo';
  assert.throws(() => validateDraft(tooLong, period), /høgst to ord/);
  const wrongCategory = exampleDraft();
  wrongCategory.categories[0].name = 'Snodige nyheiter';
  assert.throws(() => validateDraft(wrongCategory, period), /snodige nyheter/);
});

test('valideringa fangar opp enkelte upassande emne i både spørsmål og kjelder', () => {
  const draft = exampleDraft();
  draft.categories[0].questions[0].source.title = 'Ein sak om mishandling';
  assert.throws(() => validateDraft(draft, period), /gyldig kjelde/);
  draft.categories[0].questions[0].question = 'Kvar hende skytinga?';
  assert.throws(() => validateDraft(draft, period), /trygg fasit/);
});

test('berre eit bilete med kjent Wikimedia-kjelde, opphav og støtta lisens blir lagt inn', async () => {
  function serve(licenseUrl) {
    return async url => url.hostname === 'commons.wikimedia.org'
      ? Response.json({ query: { pages: [{ imageinfo: [{
          thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/test.png',
          descriptionurl: filePage,
          extmetadata: { Artist: { value: '<span>Foto Eigar</span>' }, LicenseUrl: { value: licenseUrl } }
        }] }] } })
      : new Response(imageBytes, { headers: { 'content-type': 'image/png' } });
  }
  const allowed = await licensedImage(filePage, 'Ein bygning', serve('https://creativecommons.org/licenses/by-sa/4.0/'));
  assert.equal(allowed.image, 'data:image/png;base64,' + imageBytes.toString('base64'));
  assert.equal(allowed.imageCredit.author, 'Foto Eigar');
  assert.equal(allowed.imageCredit.license, 'CC BY-SA 4.0');
  assert.equal(await licensedImage(filePage, 'Ein bygning', serve('https://creativecommons.org/licenses/by-nd/4.0/')), null);
  assert.equal(await licensedImage('https://example.org/wiki/File:Test.jpg', 'Ein bygning', () => assert.fail('Ugyldig vert')), null);
});

test('quiz og e-post bruker same fasitar, kjelder, datoperiode og PR', async () => {
  const draft = exampleDraft();
  Object.assign(draft.categories[0].questions[0], { imagePage: filePage, imageAlt: 'Ein bygning' });
  const data = await buildQuiz(draft, period, async () => null);
  assert.deepEqual(data.quiz.categories[0].questions.map(item => item.points), [100, 200, 300, 400, 500, 1000]);
  assert.equal(data.quiz.categories[0].questions[0].suggestedImagePage, filePage);
  assert.equal(data.quiz.categories[0].questions[0].image, undefined);
  const message = reviewEmail(data, {
    prUrl: 'https://github.com/KjelloveT/smasider/pull/999', from: 'test@example.org', to: 'review@example.org'
  });
  const body = Buffer.from(message.split('\r\n\r\n')[1], 'base64').toString('utf8');
  assert.equal((body.match(/Fasit – Oslo/g) || []).length, 31);
  assert.match(body, /https:\/\/github\.com\/KjelloveT\/smasider\/pull\/999/);
  assert.match(body, /https:\/\/example\.org\/news\/31/);
  assert.ok(body.includes(filePage));
});
