import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function addReviewedPhoto(board, slot, bytes, metadata) {
  const position = /^([1-5])\.([1-6])$/.exec(slot);
  const question = slot === 'finale' ? board.quiz?.final
    : position && board.quiz?.categories[Number(position[1]) - 1]?.questions[Number(position[2]) - 1];
  if (board.app !== 'frodebrett' || board.version !== 1 || !board.period || !question) {
    throw Error('Vel eit spørsmål frå 1.1 til 5.6, eller finale, i ei vekefrøde.');
  }

  const mime = bytes[0] === 0xFF && bytes[1] === 0xD8 ? 'image/jpeg'
    : bytes.subarray(0, 8).equals(Buffer.from('89504E470D0A1A0A', 'hex')) ? 'image/png'
      : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : '';
  if (!mime || bytes.length > 195_000) throw Error('Bruk eit JPEG-, PNG- eller WebP-bilete på høgst 195 kB.');

  const { title, author, publisher, source, rights, alt, cropped } = metadata;
  if (![title, author, publisher, source, rights, alt].every(value =>
    typeof value === 'string' && value.length <= 1200 && value.trim() && !/[\x00-\x1F]/.test(value))) {
    throw Error('Oppgje tittel, fotograf, utgjevar, kjeldelenkje, bruksgrunnlag og biletskildring.');
  }
  const url = new URL(source.trim());
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Bruk ei HTTPS-lenkje til opphavskjelda.');

  question.image = 'data:' + mime + ';base64,' + bytes.toString('base64');
  question.imageAlt = alt.trim();
  question.imageCredit = {
    title: title.trim(), author: author.trim(), publisher: publisher.trim(), source: url.href,
    license: rights.trim(), ...(cropped === true ? { cropped: true } : {})
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , slot, imagePath, metadataPath] = process.argv;
  if (!slot || !imagePath || !metadataPath) throw Error('Oppgje spørsmålsnummer, lokal biletfil og krediteringsfil.');
  const quizPath = 'frodebrett/json/weekly-news.json';
  const board = JSON.parse(readFileSync(quizPath, 'utf8'));
  addReviewedPhoto(board, slot, readFileSync(imagePath), JSON.parse(readFileSync(metadataPath, 'utf8')));
  writeFileSync(quizPath, JSON.stringify(board, null, 2) + '\n');
}
