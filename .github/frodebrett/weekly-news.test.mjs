import assert from 'node:assert/strict';
import test from 'node:test';
import { newsPeriod, validateDraft, buildQuiz, reviewEmail } from './weekly-news.mjs';
import { readResearch } from './news-research.mjs';
import { licensedImage } from './news-images.mjs';
import { addReviewedPhoto } from './add-reviewed-photo.mjs';

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
  assert.deepEqual(newsPeriod(new Date('2026-11-23T08:00:00Z'), '', '2026-11-23'), {
    edition: '2026-11-23', from: '2026-11-16', through: '2026-11-22'
  });
  assert.throws(() => newsPeriod(new Date(), '', '2026-11-31'), /gyldig dato/);
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

test('nettsøket tek berre med kjelder det fann, og frøda bruker dei same datoane', () => {
  const draft = exampleDraft();
  const articles = [...draft.categories.flatMap(category => category.questions), draft.final.entry]
    .map(item => ({ ...item.source, facts: ['Saka gjeld Oslo.'] }));
  const results = articles.map(source => ({ url: source.url + '?utm_source=test' }));
  const unverified = { ...articles[0], url: 'https://example.org/news/unverified' };
  const old = { ...unverified, url: 'https://example.org/news/old', published: '2026-11-20' };
  const response = { status: 'completed', output: [
    { type: 'web_search_call', status: 'completed', action: { sources: [...results, { url: old.url }] } },
    { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ articles: [...articles, old, unverified] }) }] }
  ] };
  const sources = readResearch(response, period);
  assert.deepEqual(sources, articles);
  assert.doesNotThrow(() => validateDraft(draft, period, sources));
  draft.categories[0].questions[0].source.url = unverified.url;
  assert.throws(() => validateDraft(draft, period, sources), /kjeldegrunnlaget/);
  assert.throws(() => readResearch({ ...response, status: 'incomplete' }, period), /ferdig kjeldegrunnlag/);
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
  const pressPhoto = { url: 'https://example.org/photos/1', credit: 'Foto Eigar', description: 'Bilete av rådhuset' };
  draft.categories[0].questions[0].pressPhoto = pressPhoto;
  const data = await buildQuiz(draft, period, async () => null);
  assert.deepEqual(data.quiz.categories[0].questions.map(item => item.points), [100, 200, 300, 400, 500, 1000]);
  assert.equal(data.quiz.categories[0].questions[0].suggestedImagePage, filePage);
  assert.deepEqual(data.quiz.categories[0].questions[0].suggestedPressPhoto, pressPhoto);
  assert.equal(data.quiz.categories[0].questions[0].image, undefined);
  const message = reviewEmail(data, {
    prUrl: 'https://github.com/KjelloveT/smasider/pull/999', from: 'test@example.org', to: 'review@example.org'
  });
  const body = Buffer.from(message.split('\r\n\r\n')[1], 'base64').toString('utf8');
  assert.equal((body.match(/Fasit – Oslo/g) || []).length, 31);
  assert.match(body, /https:\/\/github\.com\/KjelloveT\/smasider\/pull\/999/);
  assert.match(body, /https:\/\/example\.org\/news\/31/);
  assert.ok(body.includes(filePage));
  assert.match(body, /Pressefoto til vurdering – Bilete av rådhuset · Foto Eigar/);
  assert.ok(body.includes(pressPhoto.url));
  const previewMail = reviewEmail({ ...data, testRun: true }, {
    prUrl: 'https://github.com/KjelloveT/smasider/pull/999', from: 'test@example.org', to: 'review@example.org'
  });
  const subject = Buffer.from(previewMail.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)[1], 'base64').toString('utf8');
  assert.match(subject, /Prøvekøyring/);
});

test('redaktøren kan leggje til eit vurdert pressefoto med opphav og bruksgrunnlag', async () => {
  const board = await buildQuiz(exampleDraft(), period);
  const credit = {
    title: 'Rådhuset', author: 'Foto Eigar', publisher: 'Prøveavis',
    source: 'https://example.org/news/2', rights: 'Løyve frå fotograf', alt: 'Ein bygning'
  };
  assert.throws(() => addReviewedPhoto(board, '2.1', imageBytes, { ...credit, rights: '' }), /bruksgrunnlag/);
  assert.throws(() => addReviewedPhoto(board, '2.1', Buffer.from('not an image'), credit), /JPEG/);
  addReviewedPhoto(board, '2.1', imageBytes, credit);
  const question = board.quiz.categories[1].questions[0];
  assert.equal(question.imageCredit.publisher, 'Prøveavis');
  assert.equal(question.imageCredit.license, 'Løyve frå fotograf');
  assert.equal(question.imageAlt, 'Ein bygning');
  assert.match(question.image, /^data:image\/png;base64,/);
});
