/* Redaksjonell byggjekontroll, aldri eit automatisk uttrekk av heile ordboka.
   Lista supplerer gjennomlesing av det lukka ordutvalet og dei valde tydingane.
   Ho dekkjer kjende seksualiserte ord, grove bannord og rasistiske skjellsord.
   Treff blir kontrollerte som ordstammar, ikkje som vilkårlege delstrengar. */
const blockedStems = [
  'dildo', 'hore', 'hora', 'horing', 'porno', 'pornograf', 'prostitu', 'bordell',
  'pikk', 'kuk', 'fitte', 'fitta', 'fitt', 'pule', 'pula', 'puling', 'knulle', 'knulla', 'knulling',
  'runke', 'runka', 'runking', 'onan', 'orgasm', 'erek', 'penis', 'vagina', 'klitoris',
  'sæd', 'sperma', 'sex', 'seksual', 'samleie', 'samlege',
  'faen', 'fanden', 'jævel', 'jævla', 'jævlig', 'helvete', 'satan', 'dritt', 'piss',
  'fuck', 'fucking', 'shit', 'bitch', 'cunt', 'asshole', 'bastard',
  'neger', 'negro', 'nigger', 'niggar', 'nigga', 'svarting', 'guling', 'pakkis',
  'chink', 'gook', 'faggot', 'soper', 'sopar'
];
const tokens = value => String(value).normalize('NFC').toLocaleLowerCase('nn-NO').match(/\p{L}+/gu) || [];
function unsuitable(value) { return tokens(value).some(token => blockedStems.some(stem => token.startsWith(stem))); }
function checkWords(words) {
  if (new Set(words.map(word => word.id)).size !== words.length || new Set(words.map(word => word.answer)).size !== words.length) throw new Error('Duplikat i ordbanken.');
  for (const word of words) {
    const fields = ['answer', 'alternatives', 'inflections', 'theme', 'grammar', 'usage', 'definition', 'sentence'];
    for (const field of fields) {
      const values = Array.isArray(word[field]) ? word[field] : [word[field]];
      if (values.some(unsuitable)) throw new Error(`Ueigna ordgrunnlag: ${word.answer}, felt ${field}`);
    }
    if (word.level === 'lett' && Array.from(word.answer).length > 6) throw new Error(`For langt lettord: ${word.answer}`);
    if ((word.sentence.match(/___/g) || []).length !== 1) throw new Error(`Manglar setningsluke: ${word.answer}`);
    const answers = [word.answer, ...word.alternatives].map(value => value.normalize('NFC').toLocaleLowerCase('nn-NO'));
    for (const field of ['usage', 'definition', 'sentence']) {
      if (!word[field] || tokens(word[field]).some(token => answers.includes(token))) throw new Error(`Hint røper svaret: ${word.answer}, felt ${field}`);
    }
  }
}
module.exports = { unsuitable, checkWords };
