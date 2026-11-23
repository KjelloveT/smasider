import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { commonsFile, licensedImage } from './news-images.mjs';

const points = [100, 200, 300, 400, 500, 1000];
const oddNews = 'snodige nyheter';
const quizPath = 'frodebrett/json/weekly-news.json';
const day = 86_400_000;
const iso = date => date.toISOString().slice(0, 10);
const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });
const unsafeTopic = /(?:^|[^\p{L}])(?:drap|drep|mishandl|valdtekt|voldtekt|overgrep|skyting|terrordåd|sjølvmord|selvmord|pornografi|pengespel|pengespill|seksuell|krig\b|mobbing|narkotika|blodbad)/iu;

export function newsPeriod(now = new Date(), edition) {
  const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo', dateStyle: 'short' }).format(now);
  const date = new Date(edition || localDate);
  if (edition && (!/^\d{4}-\d{2}-\d{2}$/.test(edition) || !Number.isFinite(+date) || iso(date) !== edition || date.getUTCDay() !== 6)) {
    throw Error('Vekedatoen må vere ein laurdag i formatet ÅÅÅÅ-MM-DD.');
  }
  const saturday = new Date(+date - (date.getUTCDay() + 1) % 7 * day);
  return {
    edition: iso(saturday),
    from: iso(new Date(+saturday - 7 * day)),
    through: iso(new Date(+saturday - day))
  };
}

function text(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max
    && value === value.trim() && !/[\x00-\x1F\x7F]/.test(value);
}

function safeText(value, max) {
  return text(value, max) && !unsafeTopic.test(value);
}

function normalized(value) {
  return value.normalize('NFKC').toLocaleLowerCase('nn-NO').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function publicArticle(value) {
  if (!text(value, 1200)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && /\.[a-z]{2,}$/i.test(url.hostname) && url.pathname !== '/';
  } catch {
    return false;
  }
}

function validSource(source, period) {
  if (!safeText(source?.title, 240) || !safeText(source.publisher, 90) || !publicArticle(source.url)) return false;
  const published = source.published;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(published)) return false;
  const date = new Date(published);
  return Number.isFinite(+date) && iso(date) === published && published >= period.from && published <= period.through;
}

export function validateDraft(draft, period) {
  const categories = draft?.categories;
  if (!Array.isArray(categories) || categories.length !== 5) throw Error('Frøda må ha fem kategoriar.');
  if (categories.filter(category => category?.name === oddNews).length !== 1) {
    throw Error('Frøda må ha éin kategori med namnet «snodige nyheter».');
  }
  const names = new Set();
  const questions = new Set();

  function checkQuestion(item, context) {
    if (!safeText(item?.question, 320) || !safeText(item.answer, 65) || item.answer.split(/\s+/u).length > 2
      || !normalized(item.answer) || /[;\/]|^eller\b|\beller$/iu.test(item.answer)) {
      throw Error(context + ' treng eit tydeleg spørsmål og éin trygg fasit på høgst to ord.');
    }
    const key = normalized(item.question);
    if (!key || questions.has(key)) throw Error(context + ' manglar ei spørsmålsformulering eller gjentek eit anna spørsmål.');
    questions.add(key);
    if (!validSource(item.source, period)) throw Error(context + ' har inga gyldig kjelde i datoperioden.');
    if (item.imagePage !== '' || item.imageAlt !== '') {
      if (!commonsFile(item.imagePage) || !safeText(item.imageAlt, 160)) {
        throw Error(context + ' har ei ugyldig biletkjelde eller biletskildring.');
      }
    }
  }

  for (const [index, category] of categories.entries()) {
    const label = 'Kategori ' + (index + 1);
    if (!safeText(category?.name, 46) || !normalized(category.name) || names.has(normalized(category.name))
      || !Array.isArray(category.questions) || category.questions.length !== points.length) {
      throw Error(label + ' treng eit eige namn og seks spørsmål.');
    }
    names.add(normalized(category.name));
    category.questions.forEach((item, index) => checkQuestion(item, label + ', spørsmål ' + (index + 1)));
  }
  if (!safeText(draft.final?.category, 46) || !safeText(draft.final.hint, 180)) throw Error('Finalen treng eit namn og eit kort hint.');
  checkQuestion(draft.final.entry, 'Finalen');
}

export async function buildQuiz(draft, period, loadPhoto = licensedImage) {
  validateDraft(draft, period);
  const items = [...draft.categories.flatMap(category => category.questions), draft.final.entry];
  const photos = new Map();
  const candidates = items.filter(item => item.imagePage && !normalized(item.imageAlt).includes(normalized(item.answer)));
  const pressSuggestions = new Map(items.flatMap(item => {
    const proposal = item.pressPhoto;
    if (!publicArticle(proposal?.url) || !safeText(proposal.description, 200)) return [];
    const credit = safeText(proposal.credit, 180) ? proposal.credit : '';
    return [[item, { url: proposal.url, description: proposal.description, credit }]];
  }).slice(0, 4));
  await Promise.all(candidates.slice(0, 4).map(async item => {
    const photo = await loadPhoto(item.imagePage, item.imageAlt);
    if (photo) photos.set(item, photo);
  }));

  function makeQuestion(item) {
    const { question, answer, source, imagePage } = item;
    const photo = photos.get(item);
    const pressPhoto = pressSuggestions.get(item);
    return {
      question, answer, ...(photo || {}),
      source: { title: source.title, publisher: source.publisher, url: source.url, published: source.published },
      ...(imagePage && !photo ? { suggestedImagePage: imagePage } : {}),
      ...(pressPhoto ? { suggestedPressPhoto: pressPhoto } : {})
    };
  }

  const { category, hint, entry } = draft.final;
  return {
    app: 'frodebrett', version: 1, period,
    quiz: {
      title: 'Vekas nyheitsfrøde · ' + formatPeriod(period),
      categories: draft.categories.map(({ name, questions }) => ({
        name,
        questions: questions.map((item, index) => ({ points: points[index], ...makeQuestion(item) }))
      })),
      final: { category, hint, ...makeQuestion(entry) }
    }
  };
}

function formatPeriod(period) {
  return dateFormat.formatRange(new Date(period.from), new Date(period.through));
}

export function reviewText({ period, quiz }, prUrl) {
  function questionText(question, number) {
    const { title, url, published, publisher } = question.source;
    const pressPhoto = question.suggestedPressPhoto;
    return [
      number + '. ' + question.question,
      'Fasit – ' + question.answer,
      'Kjelde og artikkelbilete – ' + publisher + ', «' + title + '», ' + published,
      url,
      ...(question.imageCredit ? [
        'Bilete i frøda – ' + question.imageCredit.author + ', ' + question.imageCredit.license,
        question.imageCredit.source, question.imageCredit.licenseUrl
      ] : []),
      ...(question.suggestedImagePage ? ['Biletframlegg til vurdering', question.suggestedImagePage] : []),
      ...(pressPhoto ? [
        'Pressefoto til vurdering – ' + pressPhoto.description + (pressPhoto.credit ? ' · ' + pressPhoto.credit : ''),
        pressPhoto.url
      ] : [])
    ].join('\n');
  }
  return [
    'Vekas nyheitsfrøde · ' + formatPeriod(period),
    'Gå gjennom spørsmål, fasitar og eventuelle bilete før du godkjenner PR-en.',
    prUrl, '',
    ...quiz.categories.flatMap(({ name, questions }) => [
      name, ...questions.map((question, index) => questionText(question, index + 1)), ''
    ]),
    'Finale · ' + quiz.final.category,
    'Hint – ' + quiz.final.hint,
    questionText(quiz.final, 31)
  ].join('\n\n');
}

export function reviewEmail(data, { prUrl, from, to }) {
  const email = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!email.test(from) || !email.test(to)) throw Error('Avsendar og mottakar må vere gyldige e-postadresser.');
  if (!/^https:\/\/github\.com\/KjelloveT\/smasider\/pull\/\d+$/i.test(prUrl)) throw Error('Ugyldig PR-lenkje for vekefrøda.');
  const subject = Buffer.from('Frødebrett · Vekas nyheitsfrøde ' + data.period.edition).toString('base64');
  const body = Buffer.from(reviewText(data, prUrl)).toString('base64').match(/.{1,76}/g).join('\r\n');
  return [
    'From: Vyrdepil <' + from + '>',
    'To: ' + to,
    'Subject: =?UTF-8?B?' + subject + '?=',
    'Date: ' + new Date().toUTCString(),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64', '', body, ''
  ].join('\r\n');
}

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const output = (key, value) => appendFileSync(process.env.GITHUB_OUTPUT, key + '=' + value + '\n');

async function run(mode) {
  const { WEEKLY_EDITION, RUNNER_TEMP, WEEKLY_PAYLOAD, WEEKLY_PR, MAIL_FROM, MAIL_TO } = process.env;
  const period = newsPeriod(new Date(), WEEKLY_EDITION);
  const file = name => join(RUNNER_TEMP, name);

  switch (mode) {
    case 'prepare': {
      const latest = readJson(quizPath);
      output('edition', period.edition);
      output('ready', String(!latest.period || latest.period.edition < period.edition));
      const prompt = readFileSync(new URL('./weekly-news-prompt.md', import.meta.url), 'utf8');
      const previous = latest.quiz?.categories.map(category => category.name).join(', ');
      writeFileSync(file('weekly-prompt.md'), prompt + '\n\nPubliseringslaurdag ' + period.edition
        + '. Bruk saker publiserte frå og med ' + period.from + ' til og med ' + period.through + ' (Europe/Oslo).'
        + (previous ? '\nDei førre kategoriane var ' + previous + '. La dei nye sakene styre dei fire frie kategoriane.' : '') + '\n');
      return;
    }
    case 'check': {
      const draft = readJson(file('weekly-draft.json'));
      validateDraft(draft, period);
      output('payload', gzipSync(JSON.stringify(draft)).toString('base64'));
      return;
    }
    case 'build': {
      const draft = JSON.parse(gunzipSync(Buffer.from(WEEKLY_PAYLOAD, 'base64')).toString('utf8'));
      const board = await buildQuiz(draft, period);
      writeFileSync(quizPath, JSON.stringify(board, null, 2) + '\n');
      return;
    }
    case 'email': {
      const board = readJson(file('weekly-reviewed.json'));
      if (board.period?.edition !== period.edition) throw Error('Brettet i PR-en gjeld feil veke.');
      writeFileSync(file('weekly-mail.eml'), reviewEmail(board, { prUrl: WEEKLY_PR, from: MAIL_FROM, to: MAIL_TO }));
      return;
    }
    default:
      throw Error('Ukjend handling for vekefrøda.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run(process.argv[2]);
}
