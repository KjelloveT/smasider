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
  return [credit.publisher, credit.author, credit.license].filter(Boolean).join(' · ');
}

function reviewText({ period, quiz, testRun }, prUrl) {
  function questionText(question, number) {
    const { title, url, published, publisher } = question.source;
    const credit = question.imageCredit;
    const suggestion = question.suggestedPressPhoto;
    return [
      number + '. ' + question.question,
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

function htmlLine(line) {
  const url = line.startsWith('https://') && httpsLink(line);
  return url ? '<a href="' + escapeHtml(url) + '">' + escapeHtml(line) + '</a>' : escapeHtml(line);
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
  const figures = photos.map(({ slot, id, alt, credit }) => '<figure style="margin:1em 0"><img width="480" '
    + 'style="max-width:100%;height:auto" src="cid:' + id + '" alt="' + escapeHtml(alt) + '"><figcaption>'
    + escapeHtml('Bilete ' + slot + ' · ' + creditText(credit)) + ' · ' + htmlLine(credit.source) + '</figcaption></figure>');
  const html = '<html lang="nn"><body><h1>Vekas nyheitsfrøde</h1>' + figures.join('')
    + '<p>' + body.split('\n').map(htmlLine).join('<br>') + '</p></body></html>';
  const related = photos.length ? multipart('related', [
    encodedPart('text/html; charset=utf-8', html),
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
