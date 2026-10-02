// Lokal gjennomgang av katalogen. Berre dei nødvendige referansefilene blir serverte.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = 8086;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'json/apps.json'), 'utf8'));
const appDirectories = new Set(manifest.apps.filter(app => !app.hidden && !app.disabled && app.href).map(app => app.href.split('/')[0]));
const publicDirectories = new Set(['designsystem', 'css', 'js', 'json', '_resources', '_libs', ...appDirectories]);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let route;
  try { route = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (route === '/') { res.writeHead(302, { Location: '/designsystem/' }); res.end(); return; }
  const allowed = publicDirectories.has(route.split('/')[1]) || route.startsWith('/designskisser/vyrde-redesign/') || ['/index.html', '/personvern.html', '/lisens.html', '/DESIGN.md'].includes(route);
  const file = path.resolve(root, '.' + route + (route.endsWith('/') ? 'index.html' : ''));
  if (!allowed || !file.startsWith(root + path.sep) || !types[path.extname(file)]) { res.writeHead(404); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(data);
  });
}).listen(port, '127.0.0.1', () => process.stdout.write(`Designreferanse: http://127.0.0.1:${port}/designsystem/\n`));
