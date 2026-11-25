import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { commonsFile, findLicensedImage, imageLimit, licensedImage, publisherImage, storeWeeklyImages, weeklyImageFile } from './news-images.mjs';
import { quizQuestions, reviewEmail, reviewImages } from './news-review.mjs';
export { reviewEmail } from './news-review.mjs';

const points = [100, 200, 300, 400, 500, 1000];
const oddNews = 'snodige nyheiter';
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
    item.pressPhoto = item.pressPhotoAlt
      ? { ...source.pressPhoto, url: source.pressPhoto?.url || source.url, description: item.pressPhotoAlt } : undefined;
  }
  return draft;
}

export function validateDraft(draft, period, sources) {
  const categories = draft?.categories;
  if (!Array.isArray(categories) || categories.length !== 5) throw Error('Frøda må ha fem kategoriar.');
  if (categories.filter(category => category?.name === oddNews).length !== 1) {
    throw Error('Frøda må ha éin kategori med namnet «' + oddNews + '».');
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
    const distractors = item.distractors;
    if (!Array.isArray(distractors) || distractors.length !== 3
      || !distractors.every(option => safeText(option, 65) && normalized(option))
      || new Set([item.answer, ...distractors].map(normalized)).size !== 4) {
      throw Error(context + ' treng tre ulike svaralternativ i tillegg til fasiten.');
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

function mixOptions(item) {
  const options = [item.answer, ...item.distractors];
  for (let index = options.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [options[index], options[other]] = [options[other], options[index]];
  }
  return options;
}

export async function buildQuiz(draft, period, loadPhoto = licensedImage, loadPressPhoto = publisherImage,
  searchPhoto = findLicensedImage) {
  validateDraft(draft, period);
  const items = draftQuestions(draft);
  const photos = new Map();
  const picturedImages = new Map();

  async function getPhoto(item) {
    let photo;
    const press = item.pressPhoto;
    if (publicArticle(press?.url) && safeText(press.description, 200) && !revealsAnswer(press.description, item.answer)) {
      photo = await loadPressPhoto(item.source, { ...press, credit: safeText(press.credit, 180) ? press.credit : '' });
    }
    if (photo || !safeText(item.imageAlt, 160) || revealsAnswer(item.imageAlt, item.answer)) return photo;
    if (commonsFile(item.imagePage)) photo = await loadPhoto(item.imagePage, item.imageAlt);
    if (!photo && safeText(item.imageSearch, 110) && !revealsAnswer(item.imageSearch, item.answer)) {
      photo = await searchPhoto(item.imageSearch, item.imageAlt);
    }
    return photo;
  }

  for (let index = 0; index < items.length; index += 6) {
    const batch = items.slice(index, index + 6);
    const results = await Promise.all(batch.map(getPhoto));
    for (const [offset, photo] of results.entries()) {
      if (!photo) continue;
      const item = batch[offset];
      const prior = picturedImages.get(photo.image);
      if (prior && prior !== item.source.story) continue;
      picturedImages.set(photo.image, item.source.story);
      photos.set(item, photo);
    }
  }

  function makeQuestion(item) {
    const { question, answer, source } = item;
    const photo = photos.get(item);
    return {
      question, answer, options: mixOptions(item), ...(photo || {}),
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

export function archivePrevious(board, appDirectory) {
  const period = board?.period;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period?.edition) || !board.quiz || board.testRun) return;
  const folder = join(appDirectory, 'json', 'weekly-archive');
  const indexPath = join(folder, 'index.json');
  const index = existsSync(indexPath) ? readJson(indexPath) : { app: 'frodebrett', version: 1, editions: [] };
  if (index.editions.some(entry => entry.edition === period.edition)) return;
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, period.edition + '.json'), JSON.stringify(board, null, 2) + '\n');
  index.editions.push(period);
  index.editions.sort((a, b) => b.edition.localeCompare(a.edition));
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
}

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
      const count = items.slice(0, -1).filter(item => weeklyImageFile(item.image)).length;
      console.log('Frøda har ' + count + ' brettspørsmål med bilete, av dei '
        + items.filter(item => item.imageCredit?.license === 'Pressefoto').length + ' pressefoto.');
      if (count < 15) throw Error('Frøda treng minst 15 brettspørsmål med bilete. Fann ' + count + '.');
      if (!WEEKLY_TEST_DATE) archivePrevious(readJson(quizPath), 'frodebrett');
      writeFileSync(quizPath, JSON.stringify(board, null, 2) + '\n');
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
        { maxBuffer: imageLimit + 1 });
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
