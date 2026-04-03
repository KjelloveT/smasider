// Heimsank - Utility Functions

/**
 * Escape HTML special characters
 * @param {string} s - String to escape
 * @returns {string} Escaped string
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse CSV text into array of objects
 * @param {string} t - CSV text
 * @returns {Array<Object>} Array of parsed objects
 */
function parseCSV(t) {
  const lines = t.trim().split(/\r?\n/);
  const hdr = parseLine(lines[0]);
  return lines.slice(1).map(l => {
    const v = parseLine(l);
    const o = {};
    hdr.forEach((h, i) => o[h] = v[i] ?? '');
    return o;
  });
}

/**
 * Parse a single CSV line (handles quoted values)
 * @param {string} l - CSV line
 * @returns {Array<string>} Array of field values
 */
function parseLine(l) {
  const f = [];
  let c = '';
  let q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (ch === '"') {
      if (q && l[i + 1] === '"') {
        c += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (ch === ',' && !q) {
      f.push(c);
      c = '';
    } else {
      c += ch;
    }
  }
  f.push(c);
  return f;
}

/**
 * Get localStorage key for current category
 * @returns {string} Storage key
 */
function getStorageKey() {
  return `heimsank_samling_${S.selCat?.id || 'default'}`;
}

/**
 * Random integer helper
 * @param {number} m - Maximum value (inclusive)
 * @returns {number} Random integer from 1 to m
 */
function ri(m) {
  return Math.floor(Math.random() * m) + 1;
}
