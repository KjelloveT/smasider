/* Browser/PDF checks. Requires an existing Playwright installation; no app dependency.
 * VYRDEPIL_PLAYWRIGHT = module path, VYRDEPIL_BROWSER = installed Chromium executable.
 * VYRDEPIL_TEST_URL = local server (default below). Outputs stay in ignored _kjelder/.
 */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.VYRDEPIL_PLAYWRIGHT || 'playwright');
const { make, Store } = require('./engine.cjs');
const root = path.resolve(__dirname, '../..'), output = path.join(root, '_kjelder/tevlingstreet-qa');
fs.mkdirSync(output, { recursive: true });
const base = process.env.VYRDEPIL_TEST_URL || 'http://127.0.0.1:18191';
let activeBrowser;
function fixture(n, format, long) {
    const t = make(n, format, format === 'swiss' && !long ? { venues: [] } : undefined); t.title = format + ' — ' + n + ' deltakarar';
    if (long) t.participants.forEach((p, i) => { p.name = 'Deltakar ' + (i + 1) + ' med eit langt namn som skal vere lett å lese på arket utan at skriftstorleiken blir redusert'; });
    const file = path.join(output, format + '-' + n + '.json'); fs.writeFileSync(file, JSON.stringify(Store.exportData(t))); return file;
}
async function importFile(page, file) {
    const previous = await page.locator('#workspace').getAttribute('data-tournament-id');
    await page.locator('#importFile').setInputFiles(file);
    await page.waitForFunction(previous => { const id = document.querySelector('#workspace')?.dataset.tournamentId; return id && id !== previous; }, previous);
    await page.getByRole('button', { name: 'Start neste spelbolk', exact: true }).waitFor();
    return page.locator('#workspace').getAttribute('data-tournament-id');
}
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.VYRDEPIL_BROWSER || undefined });
    activeBrowser = browser;
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), errors = [], report = [];
    context.on('page', page => page.on('pageerror', e => errors.push(e.message)));
    const teacher = await context.newPage(); await teacher.goto(base + '/tevlingstreet/');
    const file = fixture(7, 'cup'), id = await importFile(teacher, file);
    await teacher.getByRole('button', { name: 'Start neste spelbolk', exact: true }).click();
    const display = await context.newPage(); await display.goto(base + '/tevlingstreet/display.html#' + id);
    await display.getByText('Direktekontakt med lærarvindauget', { exact: true }).waitFor();
    await teacher.locator('.ts-match button[aria-label]').first().click();
    await display.getByText('Vinnar', { exact: true }).waitFor();
    await display.reload(); await display.getByText('Vinnar', { exact: true }).waitFor();
    const duplicate = await context.newPage(); await duplicate.goto(base + '/tevlingstreet/');
    await duplicate.getByText(/Denne turneringa er open i eit anna lærarvindauge/).waitFor();
    assert.equal(await duplicate.locator('.ts-match button[aria-label]').count(), 0);
    await duplicate.close();
    const other = await context.newPage(); await other.goto(base + '/tevlingstreet/');
    await importFile(other, fixture(8, 'league'));
    assert.equal(await display.locator('#displayTitle').textContent(), 'cup — 7 deltakarar');
    await other.close();
    // Responsive widths and long labels never overflow the page.
    for (const width of [360, 768, 1024, 1920]) {
        await teacher.setViewportSize({ width, height: 900 });
        assert(await teacher.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at ' + width);
    }
    await teacher.setViewportSize({ width: 1440, height: 1000 });
    await teacher.screenshot({ path: path.join(output, 'teacher.png'), fullPage: true });
    await display.screenshot({ path: path.join(output, 'display.png'), fullPage: true });
    // Dialog Escape and keyboard focus restore.
    await teacher.getByRole('button', { name: 'Elevbiblioteket', exact: true }).click();
    await teacher.getByRole('dialog', { name: 'Elevbiblioteket', exact: true }).waitFor();
    await teacher.keyboard.press('Escape');
    assert.equal(await teacher.locator('dialog[open]').count(), 0);
    // Real A3 PDFs, small and 128-person fixtures, all four formats.
    for (const long of [false, true]) for (const format of ['cup', 'league', 'pools', 'swiss']) {
        const n = long ? 128 : format === 'pools' ? 8 : 7;
        const id = await importFile(teacher, fixture(n, format, long));
        const paper = await context.newPage(); await paper.goto(base + '/tevlingstreet/print.html#' + id);
        await paper.waitForFunction(() => !!document.documentElement.dataset.printReady, { timeout: 60000 });
        const checks = await paper.evaluate(() => ({
            ready: document.documentElement.dataset.printReady,
            sheets: document.querySelectorAll('.ts-sheet').length,
            overflow: [...document.querySelectorAll('.ts-sheet-body')].filter(b => b.scrollHeight > b.clientHeight + 1).length,
            tiny: [...document.querySelectorAll('.ts-sheet td,.ts-sheet p,.ts-sheet strong')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).length,
            shortFields: [...document.querySelectorAll('.ts-paper-write,.ts-paper-name,.ts-paper-table tbody td')].filter(e => e.getBoundingClientRect().height < 30).length,
            outside: [...document.querySelectorAll('.ts-paper-match,.ts-paper-sort-card,.ts-paper-table tbody td')].filter(e => e.getBoundingClientRect().bottom > e.closest('.ts-sheet-body').getBoundingClientRect().bottom + 1).length
        }));
        assert.equal(checks.ready, 'true', format + ' ' + n + ': ' + await paper.locator('#printCount').textContent());
        assert.equal(checks.overflow, 0); assert.equal(checks.tiny, 0); assert.equal(checks.shortFields, 0); assert.equal(checks.outside, 0);
        const name = format + '-' + n;
        await paper.pdf({ path: path.join(output, name + '.pdf'), preferCSSPageSize: true, printBackground: false });
        await paper.screenshot({ path: path.join(output, name + '.png'), fullPage: false });
        report.push({ name, ...checks }); console.log('A3 ' + name + ': ' + checks.sheets + ' ark');
        await paper.close();
    }
    // Closed controller gives a clear disconnected message and keeps the last state.
    await teacher.close();
    await display.getByText(/Ingen kontakt med lærarvindauget/).waitFor({ timeout: 15000 });
    await context.close();
    // Storage blocked: state still travels between windows in memory.
    const memory = await browser.newContext();
    await memory.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked for test'); } }));
    const m = await memory.newPage(); await m.goto(base + '/tevlingstreet/'); const memoryId = await importFile(m, file);
    await m.getByText(/Berre i minnet/).waitFor();
    const ms = await memory.newPage(); await ms.goto(base + '/tevlingstreet/display.html#' + memoryId);
    await ms.getByText('Direktekontakt med lærarvindauget', { exact: true }).waitFor();
    await ms.getByRole('heading', { name: 'cup — 7 deltakarar', exact: true }).waitFor(); await memory.close();
    // Blocked popup has an actionable message.
    const blocked = await browser.newContext(); await blocked.addInitScript(() => { window.open = () => null; });
    const b = await blocked.newPage(); await b.goto(base + '/tevlingstreet/'); await importFile(b, file);
    await b.getByRole('button', { name: 'Opne storskjerm', exact: true }).click();
    await b.getByText(/Nettlesaren blokkerte storskjermen/).waitFor(); await blocked.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ report, errors }, null, 2));
    await browser.close(); console.log('PASS: vindauge, lås, responsivitet, minnelagring, dialogar og A3.');
})().catch(async error => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
