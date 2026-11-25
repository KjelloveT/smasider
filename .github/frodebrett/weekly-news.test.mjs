import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { newsPeriod, validateDraft, attachSources, archivePrevious, buildQuiz, reviewEmail } from './weekly-news.mjs';
import { supernyttTopics } from './supernytt.mjs';
import { readResearch } from './news-research.mjs';
import { licensedImage, publisherImage, storeWeeklyImages, weeklyImageFile } from './news-images.mjs';
import { quizQuestions, reviewImages } from './news-review.mjs';
import { addReviewedPhoto } from './add-reviewed-photo.mjs';

const period = { edition: '2026-11-28', from: '2026-11-21', through: '2026-11-27' };
const filePage = 'https://commons.wikimedia.org/wiki/File:Test.jpg';
const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8CcAAAAASUVORK5CYII=', 'base64');

function exampleDraft() {
  const make = (label, published = period.through) => ({
    question: 'Kva stad gjeld artikkel ' + label + '?',
    answer: 'Oslo',
    distractors: ['Bergen', 'Trondheim', 'Tromsø'],
    source: { title: 'Ein trygg testartikkel', publisher: 'Prøveavis', url: 'https://example.org/news/' + label,
      published, story: 'test-' + label, importance: 'major' },
    imagePage: '',
    imageAlt: ''
  });
  return {
    categories: ['snodige nyheiter', 'Natur', 'Idrett', 'Kultur og språk', 'Teknologi'].map((name, index) => ({
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
  assert.throws(() => validateDraft(wrongCategory, period), /snodige nyheiter/);
});

test('fire svaralternativ er ulike, og fasiten er med éin gong i alle rutene', async () => {
  const draft = exampleDraft();
  const board = await buildQuiz(draft, period);
  for (const { item } of quizQuestions(board.quiz)) {
    assert.equal(new Set(item.options).size, 4);
    assert.equal(item.options.filter(option => option === item.answer).length, 1);
  }
  draft.final.entry.distractors[2] = 'OSLO';
  assert.throws(() => validateDraft(draft, period), /tre ulike/);
});

test('episodemetadata frå Supernytt er avgrensa til veka', async () => {
  const calls = [];
  const results = await supernyttTopics(period, async url => {
    calls.push(url);
    return Response.json({ _embedded: { instalments: [
      { releaseDateOnDemand: '2026-11-24T09:00+01:00', titles: { title: 'Om naturen', subtitle: 'Om dyr og skog.' } },
      { releaseDateOnDemand: '2026-11-28T09:00+01:00', titles: { title: 'For seint', subtitle: 'Ny episode.' } }
    ] } });
  });
  assert.deepEqual(results, [{ date: '2026-11-24', title: 'Om naturen', summary: 'Om dyr og skog.' }]);
  assert.deepEqual(calls, ['https://psapi.nrk.no/tv/catalog/series/supernytt/seasons/202611']);
});

test('arkivet bevarer ei publisert frøde og hoppar over prøvekøyringar', async t => {
  const folder = mkdtempSync(join(tmpdir(), 'frodebrett-archive-'));
  t.after(() => rmSync(folder, { recursive: true }));
  const board = await buildQuiz(exampleDraft(), period);
  archivePrevious({ ...board, testRun: true }, folder);
  assert.throws(() => readFileSync(join(folder, 'json', 'weekly-archive', 'index.json')), /ENOENT/);
  archivePrevious(board, folder);
  archivePrevious(board, folder);
  const read = file => JSON.parse(readFileSync(join(folder, 'json', 'weekly-archive', file), 'utf8'));
  assert.deepEqual(read('index.json').editions, [period]);
  assert.deepEqual(read(period.edition + '.json'), board);
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

test('utkastet får lenkje, dato og biletkreditt frå den valde kjelda', () => {
  const draft = exampleDraft();
  const items = [...draft.categories.flatMap(category => category.questions), draft.final.entry];
  const sources = items.map(({ source }, index) => ({ ...source, id: 'kjelde-' + index }));
  items.forEach((item, index) => { item.sourceId = sources[index].id; });
  const item = items[0];
  item.source = { url: 'https://example.org/unverified' };
  item.pressPhotoAlt = 'Ein bygning';
  sources[0].pressPhoto = { url: sources[0].url, description: 'Rådhuset', credit: 'Foto Eigar' };
  assert.doesNotThrow(() => validateDraft(attachSources(draft, sources), period, sources));
  assert.equal(item.source.url, sources[0].url);
  assert.equal(item.pressPhoto.credit, 'Foto Eigar');
  assert.equal(item.pressPhoto.description, 'Ein bygning');
  item.sourceId = 'kjelde-ukjend';
  assert.throws(() => attachSources(draft, sources), /artikkel frå kjeldegrunnlaget/);
});

test('store konfliktsaker er tillatne og grensene for småsaker og gjentaking gjeld heile brettet', () => {
  const draft = exampleDraft();
  const [first, second, third] = draft.categories[0].questions;
  first.source.title = 'Ny runde med forhandlingar om krigen';
  first.question = 'I kva land fann våpenkvilesamtalane om krigen stad?';
  first.source.importance = second.source.importance = 'minor';
  assert.doesNotThrow(() => validateDraft(draft, period));
  draft.final.entry.source.importance = 'minor';
  assert.throws(() => validateDraft(draft, period), /høgst to småsaker/);
  draft.final.entry.source.importance = 'major';
  second.source.story = third.source.story = first.source.story;
  assert.throws(() => validateDraft(draft, period), /Meir enn to spørsmål frå same hending/);
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
  const data = await buildQuiz(draft, period);
  assert.deepEqual(data.quiz.categories[0].questions.map(item => item.points), [100, 200, 300, 400, 500, 1000]);
  assert.equal(data.quiz.categories[0].questions[0].image, undefined);
  const message = reviewEmail(data, {
    prUrl: 'https://github.com/KjelloveT/smasider/pull/999', from: 'test@example.org', to: 'review@example.org'
  });
  const body = Buffer.from(message.split('\r\n\r\n')[1], 'base64').toString('utf8');
  assert.equal((body.match(/Fasit – Oslo/g) || []).length, 31);
  assert.match(body, /https:\/\/github\.com\/KjelloveT\/smasider\/pull\/999/);
  assert.match(body, /https:\/\/example\.org\/news\/31/);
  assert.match(body, /[A-D]\. Trondheim/);
  const previewMail = reviewEmail({ ...data, testRun: true, testLabel: '2' }, {
    prUrl: 'https://github.com/KjelloveT/smasider/pull/999', from: 'test@example.org', to: 'review@example.org'
  });
  const subject = Buffer.from(previewMail.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/)[1], 'base64').toString('utf8');
  assert.match(subject, /Prøvekøyring 2 · /);
});

test('eit verifisert pressefoto ligg i quizmappa, PR-en og e-posten med same kreditering', async t => {
  const draft = exampleDraft();
  const first = draft.categories[0].questions[0];
  const article = 'https://www.nrk.no/norge/ei-nasjonal-sak-1.123';
  const imageUrl = 'https://gfx.nrk.no/123/bilete.png';
  first.source.url = article;
  first.source.publisher = 'NRK';
  first.imagePage = article;
  first.imageAlt = 'Rådhuset';
  first.pressPhoto = { url: article, credit: 'Foto Eigar', description: 'Bilete av rådhuset' };
  const fetchPhoto = async (url, options) => {
    assert.equal(options.redirect, 'error');
    if (url.href === article) return new Response('<head><meta content="' + imageUrl
      + '" property="og:image"></head>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
    assert.equal(url.href, imageUrl);
    return new Response(imageBytes, { headers: { 'content-type': 'image/png' } });
  };
  assert.equal(await publisherImage(first.source, { ...first.pressPhoto, url: 'https://other.example/a' }, fetchPhoto), null);
  const data = await buildQuiz(draft, period, () => assert.fail('Pressefoto er ikkje ei Commons-fil'),
    (source, proposal) => publisherImage(source, proposal, fetchPhoto));
  const folder = mkdtempSync(join(tmpdir(), 'frodebrett-media-'));
  t.after(() => rmSync(folder, { recursive: true }));
  storeWeeklyImages(quizQuestions(data.quiz).map(({ item }) => item), folder);
  const question = data.quiz.categories[0].questions[0];
  const name = weeklyImageFile(question.image);
  assert.deepEqual(readFileSync(join(folder, question.image)), imageBytes);
  assert.equal(question.imageCredit.imageUrl, imageUrl);
  assert.equal(question.imageCredit.author, 'Foto Eigar');
  const pr = reviewImages(data, 'a'.repeat(40));
  assert.ok(pr.includes('/' + question.image));
  assert.ok(pr.includes('NRK · Foto Eigar · Pressefoto'));
  assert.ok(pr.includes(article));
  const mail = reviewEmail(data, { prUrl: 'https://github.com/KjelloveT/smasider/pull/999',
    from: 'test@example.org', to: 'review@example.org',
    readPhoto: filename => {
      assert.equal(filename, name);
      return readFileSync(join(folder, question.image));
    }
  });
  assert.match(mail, /Content-Type: multipart\/related/);
  assert.match(mail, /Content-ID: <frodebrett-1\.1@vyrdepil>/);
  const htmlPayload = mail.match(/Content-Type: text\/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+)\r\n--/);
  const html = Buffer.from(htmlPayload[1], 'base64').toString('utf8');
  assert.match(html, /<h2[^>]*>snodige nyheiter<\/h2>/);
  assert.match(html, /<ol type="A"/);
  assert.match(html, /<strong>Fasit:<\/strong> Oslo/);
  const attachment = mail.match(/Content-Disposition: inline[^\r]+\r\n\r\n([A-Za-z0-9+/=\r\n]+)\r\n--/);
  assert.deepEqual(Buffer.from(attachment[1], 'base64'), imageBytes);
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
