import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { commonsFile, licensedImage, publisherImage, storeWeeklyImages } from './news-images.mjs';
import { quizQuestions, reviewEmail, reviewImages } from './news-review.mjs';
export { reviewEmail } from './news-review.mjs';

const points = [100, 200, 300, 400, 500, 1000];
const oddNews = 'snodige nyheter';
const quizPath = 'frodebrett/json/weekly-news.json';
const day = 86_400_000;
const iso = date => date.toISOString().slice(0, 10);
const dateFormat = new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeZone: 'UTC' });
const unsafeTopic = /(?:^|[^\p{L}])(?:drap|drep|mishandl|valdtekt|voldtekt|overgrep|skyting|terrordåd|sjølvmord|selvmord|pornografi|pengespel|pengespill|seksuell|mobbing|narkotika|blodbad|murder|sexual assault|torture|suicide)/iu;

export function newsPeriod(now = new Date(), edition, testDate) {
  const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo', dateStyle: 'short' }).format(now);
  const reference = testDate || edition;
  const date = new Date(reference || localDate);
  if (reference && (!/^\d{4}-\d{2}-\d{2}$/.test(reference) || !Number.isFinite(+date) || iso(date) !== reference)) {
    throw Error('Oppgje ein gyldig dato i formatet ÅÅÅÅ-MM-DD.');
  }
  if (!testDate && edition && date.getUTCDay() !== 6) {
    throw Error('Vekedatoen må vere ein laurdag i formatet ÅÅÅÅ-MM-DD.');
  }
  const cutoff = testDate ? date : new Date(+date - (date.getUTCDay() + 1) % 7 * day);
  return {
    edition: iso(cutoff),
    from: iso(new Date(+cutoff - 7 * day)),
    through: iso(new Date(+cutoff - day))
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

function revealsAnswer(alt, answer) {
  return (' ' + normalized(alt) + ' ').includes(' ' + normalized(answer) + ' ');
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

export function articleKey(value) {
  if (!publicArticle(value)) return null;
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.href.replace(/\/$/, '');
}

export function validSource(source, period) {
  if (!safeText(source?.title, 240) || !safeText(source.publisher, 90) || !publicArticle(source.url)) return false;
  const published = source.published;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(published)) return false;
  const date = new Date(published);
  return Number.isFinite(+date) && iso(date) === published && published >= period.from && published <= period.through;
}

export function validStory(source) {
  return typeof source?.story === 'string' && source.story.length <= 70
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.story) && ['major', 'minor'].includes(source.importance);
}

function draftQuestions(draft) {
  return [...draft.categories.flatMap(category => category.questions), draft.final.entry];
}

export function attachSources(draft, sources) {
  const evidence = new Map(sources.map(source => [source.id, source]));
  for (const item of draftQuestions(draft)) {
    const source = evidence.get(item.sourceId);
    if (!source) throw Error('Spørsmålet må bruke ein artikkel frå kjeldegrunnlaget.');
    item.source = source;
    item.imagePage = item.imageAlt && source.imagePage ? source.imagePage : '';
    item.pressPhoto = item.pressPhotoAlt && source.pressPhoto?.url
      ? { ...source.pressPhoto, description: item.pressPhotoAlt } : undefined;
  }
  return draft;
}

export function validateDraft(draft, period, sources) {
  const categories = draft?.categories;
  if (!Array.isArray(categories) || categories.length !== 5) throw Error('Frøda må ha fem kategoriar.');
  if (categories.filter(category => category?.name === oddNews).length !== 1) {
    throw Error('Frøda må ha éin kategori med namnet «snodige nyheter».');
  }
  const names = new Set();
  const questions = new Set();
  const storyCounts = new Map();
  const evidence = sources && new Map(sources.map(source => [articleKey(source.url), source]));
  let minorCount = 0;

  function checkQuestion(item, context) {
    if (!safeText(item?.question, 320) || !safeText(item.answer, 65) || item.answer.split(/\s+/u).length > 2
      || !normalized(item.answer) || /[;\/]|^eller\b|\beller$/iu.test(item.answer)) {
      throw Error(context + ' treng eit tydeleg spørsmål og éin trygg fasit på høgst to ord.');
    }
    const key = normalized(item.question);
    if (!key || questions.has(key)) throw Error(context + ' manglar ei spørsmålsformulering eller gjentek eit anna spørsmål.');
    questions.add(key);
    const source = item.source;
    if (!validSource(source, period) || !validStory(source)) throw Error(context + ' har inga gyldig kjelde i datoperioden.');
    const verified = evidence?.get(articleKey(source.url));
    if (evidence && (!verified || source.published !== verified.published || source.story !== verified.story
      || source.importance !== verified.importance || source.publisher !== verified.publisher)) {
      throw Error(context + ' brukar kjeldeopplysningar som manglar i kjeldegrunnlaget.');
    }
    const count = (storyCounts.get(source.story) ?? 0) + 1;
    storyCounts.set(source.story, count);
    if (count > 2) throw Error('Meir enn to spørsmål frå same hending: ' + source.story + '.');
    if (source.importance === 'minor' && ++minorCount > 2) {
      throw Error('Frøda kan ha høgst to småsaker.');
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

export async function buildQuiz(draft, period, loadPhoto = licensedImage, loadPressPhoto = publisherImage) {
  validateDraft(draft, period);
  const items = draftQuestions(draft);
  const photos = new Map();
  const picturedStories = new Set();
  const picturedImages = new Set();
  const candidates = items.filter(item => commonsFile(item.imagePage) && safeText(item.imageAlt, 160)
    && !revealsAnswer(item.imageAlt, item.answer));
  const press = items.filter(item => publicArticle(item.pressPhoto?.url)
    && safeText(item.pressPhoto.credit, 180) && safeText(item.pressPhoto.description, 200)
    && !revealsAnswer(item.pressPhoto.description, item.answer));

  function addPhotos(pairs) {
    for (const [item, photo] of pairs) {
      if (!photo || picturedStories.has(item.source.story) || picturedImages.has(photo.image)) continue;
      picturedStories.add(item.source.story);
      picturedImages.add(photo.image);
      photos.set(item, photo);
      if (photos.size === 6) break;
    }
  }
  addPhotos(await Promise.all(press.slice(0, 18).map(async item =>
    [item, await loadPressPhoto(item.source, item.pressPhoto)])));
  if (photos.size < 6) {
    addPhotos(await Promise.all(candidates.filter(item => !picturedStories.has(item.source.story)).slice(0, 6)
      .map(async item => [item, await loadPhoto(item.imagePage, item.imageAlt)])));
  }

  function makeQuestion(item) {
    const { question, answer, source } = item;
    const photo = photos.get(item);
    return {
      question, answer, ...(photo || {}),
      source: {
        title: source.title, publisher: source.publisher, url: source.url, published: source.published,
        story: source.story, importance: source.importance
      }
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

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const output = (key, value) => appendFileSync(process.env.GITHUB_OUTPUT, key + '=' + value + '\n');

async function run(mode) {
  const { WEEKLY_EDITION, WEEKLY_TEST_DATE, WEEKLY_TEST_LABEL, RUNNER_TEMP,
    WEEKLY_PAYLOAD, WEEKLY_COMMIT, WEEKLY_PR, MAIL_FROM, MAIL_TO } = process.env;
  const period = newsPeriod(new Date(), WEEKLY_EDITION, WEEKLY_TEST_DATE);
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
      const sources = readJson(file('weekly-sources.json'));
      const draft = attachSources(readJson(file('weekly-draft.json')), sources);
      validateDraft(draft, period, sources);
      output('payload', gzipSync(JSON.stringify(draft)).toString('base64'));
      return;
    }
    case 'build': {
      const draft = JSON.parse(gunzipSync(Buffer.from(WEEKLY_PAYLOAD, 'base64')).toString('utf8'));
      const board = await buildQuiz(draft, period);
      if (WEEKLY_TEST_DATE) {
        board.testRun = true;
        if (/^\d{1,3}$/.test(WEEKLY_TEST_LABEL ?? '')) board.testLabel = WEEKLY_TEST_LABEL;
      }
      const items = quizQuestions(board.quiz).map(({ item }) => item);
      storeWeeklyImages(items, 'frodebrett');
      writeFileSync(quizPath, JSON.stringify(board, null, 2) + '\n');
      console.log('Frøda har ' + items.filter(item => item.image).length + ' bilete, av dei '
        + items.filter(item => item.imageCredit?.license === 'Pressefoto').length + ' pressefoto.');
      return;
    }
    case 'review': {
      const board = readJson(file('weekly-reviewed.json'));
      process.stdout.write(reviewImages(board, WEEKLY_COMMIT));
      return;
    }
    case 'email': {
      const board = readJson(file('weekly-reviewed.json'));
      if (board.period?.edition !== period.edition) throw Error('Brettet i PR-en gjeld feil veke.');
      const readPhoto = name => execFileSync('git', ['show', 'FETCH_HEAD:frodebrett/json/weekly-media/' + name],
        { maxBuffer: 195_001 });
      writeFileSync(file('weekly-mail.eml'), reviewEmail(board, {
        prUrl: WEEKLY_PR, from: MAIL_FROM, to: MAIL_TO, readPhoto
      }));
      return;
    }
    default:
      throw Error('Ukjend handling for vekefrøda.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run(process.argv[2]);
}
