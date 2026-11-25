import { randomUUID } from 'node:crypto';
import { decodeImage, weeklyImageFile } from './news-images.mjs';

const crlf = '\r\n';
const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });

export function quizQuestions(quiz) {
  return [
    ...quiz.categories.flatMap((category, col) =>
      category.questions.map((item, row) => ({ item, slot: (col + 1) + '.' + (row + 1) }))),
    { item: quiz.final, slot: 'finale' }
  ];
}

function creditText(credit) {
  return [credit.illustration ? 'Illustrasjonsbilete' : '', credit.publisher, credit.author, credit.license]
    .filter(Boolean).join(' · ');
}

function reviewText({ period, quiz, testRun }, prUrl) {
  function questionText(question, number) {
    const { title, url, published, publisher } = question.source;
    const credit = question.imageCredit;
    const suggestion = question.suggestedPressPhoto;
    return [
      number + '. ' + question.question,
      ...(question.options ?? []).map((option, index) => 'ABCD'[index] + '. ' + option),
      'Fasit – ' + question.answer,
      'Kjelde – ' + publisher + ', «' + title + '», ' + published,
      url,
      ...(credit ? ['Bilete i frøda – ' + creditText(credit), credit.source, credit.licenseUrl].filter(Boolean) : []),
      ...(question.suggestedImagePage ? ['Biletframlegg til vurdering', question.suggestedImagePage] : []),
      ...(suggestion ? ['Pressefoto til vurdering – ' + suggestion.description + ' · ' + suggestion.credit, suggestion.url] : [])
    ].join('\n');
  }

  return [
    (testRun ? 'Prøvekøyring · ' : '') + 'Vekas nyheitsfrøde · '
      + dateFormat.formatRange(new Date(period.from), new Date(period.through)),
    ...(testRun ? ['Prøvefrøda er lagd fram for godkjenning i førehandsvisinga.'] : []),
    'Gå gjennom spørsmål, fasitar og eventuell biletbruk før du godkjenner PR-en.',
    prUrl, '',
    ...quiz.categories.flatMap(({ name, questions }) => [
      name, ...questions.map((question, index) => questionText(question, index + 1)), ''
    ]),
    'Finale · ' + quiz.final.category,
    'Hint – ' + quiz.final.hint,
    questionText(quiz.final, 31)
  ].join('\n\n');
}

function base64(value) {
  return Buffer.from(value).toString('base64').match(/.{1,76}/g).join(crlf);
}

function encodedPart(type, body, headers = []) {
  return ['Content-Type: ' + type, 'Content-Transfer-Encoding: base64', ...headers, '', base64(body)].join(crlf);
}

function multipart(type, parts) {
  const boundary = 'vyrdepil-' + randomUUID();
  return ['Content-Type: multipart/' + type + '; boundary="' + boundary + '"', '',
    ...parts.flatMap(part => ['--' + boundary, part]), '--' + boundary + '--'].join(crlf);
}

function escapeHtml(value) {
  const escaped = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, char => escaped[char]);
}

function httpsLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href.replace(/[<>]/g, encodeURIComponent) : '';
  } catch {
    return '';
  }
}

function htmlLink(value, title) {
  const url = httpsLink(value);
  return url ? '<a href="' + escapeHtml(url) + '">' + escapeHtml(title) + '</a>' : escapeHtml(title);
}

function reviewPhotos(quiz, readPhoto) {
  const photos = [];
  for (const { item, slot } of quizQuestions(quiz)) {
    if (!item.imageCredit || !item.image) continue;
    const filename = weeklyImageFile(item.image);
    const format = filename?.endsWith('.jpg') ? 'jpeg' : filename?.split('.').at(-1);
    const photo = filename ? { bytes: readPhoto(filename), format } : decodeImage(item.image);
    if (!photo) throw Error('Manglar eit gyldig bilete til spørsmål ' + slot + '.');
    photos.push({ ...photo, slot, alt: item.imageAlt, credit: item.imageCredit, id: 'frodebrett-' + slot + '@vyrdepil' });
  }
  return photos;
}

function reviewHtml(data, prUrl, photos) {
  const { quiz, period, testRun } = data;
  const bySlot = new Map(photos.map(photo => [photo.slot, photo]));
  const para = 'style="margin:8px 0"';
  const small = 'style="margin:8px 0;font-size:14px"';
  function question(item, slot, heading) {
    const photo = bySlot.get(slot);
    const { title, url, published, publisher } = item.source;
    const options = item.options?.length ? '<ol type="A" style="margin:6px 0;padding-left:24px">'
      + item.options.map(option => '<li>' + escapeHtml(option) + '</li>').join('') + '</ol>' : '';
    const picture = photo ? '<div style="margin:12px 0"><img width="440" style="max-width:100%;height:auto" src="cid:'
      + photo.id + '" alt="' + escapeHtml(photo.alt) + '"><p ' + small + '>'
      + escapeHtml(creditText(photo.credit)) + ' · ' + htmlLink(photo.credit.source, 'Biletkjelde')
      + (photo.credit.licenseUrl ? ' · ' + htmlLink(photo.credit.licenseUrl, 'Lisens') : '') + '</p></div>' : '';
    return '<li style="margin:0 0 12px;padding:10px 12px;background:#fff9e9;border:1px solid #d8d7c9">'
      + '<p ' + para + '><strong>' + escapeHtml(heading) + '</strong> ' + escapeHtml(item.question) + '</p>'
      + options + '<p ' + para + '><strong>Fasit:</strong> ' + escapeHtml(item.answer) + '</p>'
      + '<p ' + small + '>' + htmlLink(url, publisher + ' · ' + title) + ' · ' + escapeHtml(published) + '</p>'
      + picture + '</li>';
  }
  const categories = quiz.categories.map(({ name, questions }, col) =>
    '<h2 style="margin:26px 0 8px">' + escapeHtml(name) + '</h2><ol style="margin:0;padding-left:20px">'
    + questions.map((item, row) => question(item, (col + 1) + '.' + (row + 1), item.points + ' poeng')).join('') + '</ol>');
  return '<html lang="nn"><body style="margin:0;color:#000;font-family:system-ui,sans-serif;line-height:1.5">'
    + '<div style="max-width:700px;margin:auto;padding:18px"><h1 style="margin:0">Vekas nyheitsfrøde</h1><p '
    + para + '>' + (testRun ? 'Prøvekøyring · ' : '')
    + escapeHtml(dateFormat.formatRange(new Date(period.from), new Date(period.through))) + ' · 30 spørsmål og finale</p>'
    + '<p ' + para + '>' + htmlLink(prUrl, 'Opne PR-en for redaksjonell gjennomgang') + '</p>'
    + categories.join('') + '<h2>Finale · ' + escapeHtml(quiz.final.category) + '</h2>'
    + (quiz.final.hint ? '<p ' + para + '><strong>Hint før innsats:</strong> ' + escapeHtml(quiz.final.hint) + '</p>' : '')
    + '<ol style="margin:0;padding-left:20px">' + question(quiz.final, 'finale', '') + '</ol></div></body></html>';
}

export function reviewEmail(data, { prUrl, from, to, readPhoto }) {
  const email = /^[A-Z0-9.!#$%&'*+/=?^`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!email.test(from) || !email.test(to)) throw Error('Avsendar og mottakar må vere gyldige e-postadresser.');
  if (!/^https:\/\/github\.com\/KjelloveT\/smasider\/pull\/\d+$/i.test(prUrl)) throw Error('Ugyldig PR-lenkje for vekefrøda.');
  const testLabel = data.testLabel ? data.testLabel + ' · ' : '';
  const subject = Buffer.from('Frødebrett · ' + (data.testRun ? 'Prøvekøyring ' + testLabel : 'Vekas nyheitsfrøde ')
    + data.period.edition).toString('base64');
  const body = reviewText(data, prUrl);
  const plain = encodedPart('text/plain; charset=utf-8', body);
  const photos = reviewPhotos(data.quiz, readPhoto);
  const related = photos.length ? multipart('related', [
    encodedPart('text/html; charset=utf-8', reviewHtml(data, prUrl, photos)),
    ...photos.map(photo => encodedPart('image/' + photo.format, photo.bytes, [
      'Content-ID: <' + photo.id + '>',
      'Content-Disposition: inline; filename="bilete-' + photo.slot + '.' + photo.format + '"'
    ]))
  ]) : null;
  return [
    'From: Vyrdepil <' + from + '>', 'To: ' + to,
    'Subject: =?UTF-8?B?' + subject + '?=', 'Date: ' + new Date().toUTCString(),
    'MIME-Version: 1.0', related ? multipart('alternative', [plain, related]) : plain, ''
  ].join(crlf);
}

export function reviewImages({ quiz }, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('Oppgje commiten som inneheld quizbileta.');
  const images = [];
  for (const { item, slot } of quizQuestions(quiz)) {
    const filename = weeklyImageFile(item.image);
    if (!filename || !item.imageCredit) continue;
    const credit = item.imageCredit;
    const imageUrl = 'https://raw.githubusercontent.com/KjelloveT/smasider/' + commit + '/frodebrett/' + item.image;
    const source = httpsLink(credit.source);
    images.push([
      '#### Bilete ' + slot, '![Bilete ' + slot + '](<' + imageUrl + '>)',
      escapeHtml(creditText(credit)).replace(/[[\]()_*~`@]/g, char => '&#' + char.charCodeAt(0) + ';'),
      source && '[Biletkjelde](<' + source + '>)'
    ].filter(Boolean).join('\n\n'));
  }
  return images.length ? '\n\n### Bilete i frøda\n\n' + images.join('\n\n') + '\n' : '';
}
