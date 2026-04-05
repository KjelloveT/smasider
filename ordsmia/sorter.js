const fs = require('fs');

const raw = fs.readFileSync('norsk_ordliste.json', 'utf8');
const data = JSON.parse(raw);

// Sorter etter lengde (descending) for å finne lengste ord først
const sorted = data.ord.sort((a, b) => b.length - a.length);

const output = {
  meta: data.meta,
  ord: sorted
};

fs.writeFileSync('ordliste_sorted.json', JSON.stringify(output), 'utf8');
console.log('Sortert ordliste lagret:', sorted.length, 'ord');
console.log('Lengste ord:', sorted.slice(0, 5));
