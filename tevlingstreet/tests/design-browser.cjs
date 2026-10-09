/* Full fixture/UI cross-check and measured design audit. Run coverage.cjs first.
 * Uses the same installed-browser environment as browser.cjs. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.VYRDEPIL_PLAYWRIGHT || 'playwright');
const folder = path.resolve(__dirname, '../../_kjelder/tevlingstreet-audit');
const base = process.env.VYRDEPIL_TEST_URL || 'http://127.0.0.1:18191';
const cases = JSON.parse(fs.readFileSync(path.join(folder, 'tournaments.json'))).results;
let browser;
async function load(page, number, complete = false, long = false) {
    const file = path.join(folder, (complete ? 'complete-' : 'initial-') + number + '.json');
    let source = file;
    if (long) {
        const raw = JSON.parse(fs.readFileSync(file));
        raw.title = 'Skuleturnering med eit langt namn som skal vere lesbart på alle skjermar og ikkje kome oppå noko anna';
        raw.participants.forEach((p, i) => { p.name = 'Deltakar ' + (i + 1) + ' med eit uvanleg langt namn som krev god plass i både kampoversikta og poengtabellen'; });
        raw.settings.venues = ['Gymsalen — den lengste bana langs vindauga, ved den store inngangsdøra'];
        source = path.join(folder, 'long-' + number + '.json'); fs.writeFileSync(source, JSON.stringify(raw));
    }
    const previous = await page.locator('#workspace').getAttribute('data-tournament-id');
    await page.locator('#importFile').setInputFiles(source);
    await page.waitForFunction(previous => { const id = document.querySelector('#workspace')?.dataset.tournamentId; return id && id !== previous; }, previous);
    await page.getByRole('button', { name: 'Start neste spelbolk', exact: true }).waitFor();
    assert.equal(await page.locator('#appError').isVisible(), false);
    return page.locator('#workspace').getAttribute('data-tournament-id');
}
async function measure(page, label, projector = false) {
    await page.mouse.move(0, 0);
    return page.evaluate(({ label, projector }) => {
        const visible = e => e.getClientRects().length && !e.closest('[hidden],dialog:not([open]),details:not([open]) .vp-accordion-body');
        const issues = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Vassrett sideoverflyt');
        if (projector && document.querySelector('#displayContent').getBoundingClientRect().bottom > innerHeight + 1) issues.push('Storskjerminnhald går under skjermbotnen');
        for (const box of document.querySelectorAll('.ts-tree-stack,.ts-person,.ts-member,.vp-app-intro-board,.ts-match-side')) {
            const items = [...box.children].filter(visible).map(e => ({ text: e.textContent.slice(0, 35), r: e.getBoundingClientRect() }));
            for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
                const a = items[i].r, b = items[j].r;
                if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) issues.push('Overlapp: ' + items[i].text + ' / ' + items[j].text);
            }
        }
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let node;
        let texts = 0;
        while ((node = walker.nextNode())) {
            const e = node.parentElement;
            if (!node.textContent.trim() || !visible(e) || e.closest('script,style,option,svg,.vp-skip:not(:focus)')) continue;
            const s = getComputedStyle(e); texts++;
            if (s.color !== 'rgb(0, 0, 0)') issues.push('Tekstfarge: ' + s.color + ' ' + node.textContent.trim().slice(0, 25));
            if (parseFloat(s.fontSize) < 14) issues.push('For lita skrift: ' + s.fontSize);
            const range = document.createRange(); range.selectNodeContents(node);
            for (let parent = e; parent; parent = parent.parentElement) {
                const style = getComputedStyle(parent), r = parent.getBoundingClientRect();
                if (['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)) {
                    const scrollable = e.closest('dialog[open]');
                    if (scrollable && getComputedStyle(scrollable).overflowY === 'auto') continue;
                    for (const text of range.getClientRects()) {
                        if (['hidden', 'clip'].includes(style.overflowX) && (text.left < r.left - 2 || text.right > r.right + 2) || ['hidden', 'clip'].includes(style.overflowY) && (text.top < r.top - 2 || text.bottom > r.bottom + 2)) issues.push('Klipt tekst: ' + node.textContent.trim().slice(0, 25));
                    }
                }
            }
        }
        const selected = [...document.querySelectorAll('.vp-button[aria-pressed="true"]')].filter(visible);
        for (const b of selected) {
            if (getComputedStyle(b).backgroundColor !== 'rgb(245, 223, 170)') issues.push('Vald knapp manglar honningfyll');
            if (!b.querySelector('.vp-selection-mark svg')) issues.push('Vald knapp manglar svart hake');
        }
        return { label, width: innerWidth, height: innerHeight, texts, issues: [...new Set(issues)] };
    }, { label, projector });
}
function expectedRows(raw, ids) {
    const selected = ids || raw.participants.map(p => p.id), scores = new Map(selected.map(id => [id, { id, played: 0, win: 0, draw: 0, loss: 0, bye: 0, points: 0 }]));
    for (const m of raw.matches) if (m.result && ['league', 'pool', 'swiss'].includes(m.stage)) {
        const a = scores.get(m.a.id), b = scores.get(m.b.id); if (!a || !b) continue;
        for (const [r, side] of [[a, 'a'], [b, 'b']]) { const result = m.result === 'draw' ? 'draw' : m.result === side ? 'win' : 'loss'; r.played++; r[result]++; r.points += raw.settings[result]; }
    }
    for (const r of raw.rounds.filter(r => r.stage === 'swiss')) for (const id of r.pauses) { const s = scores.get(id); if (s) { s.bye++; s.points += raw.settings.win; } }
    const rows = [...scores.values()].sort((a, b) => b.points - a.points || raw.order.indexOf(a.id) - raw.order.indexOf(b.id));
    return rows.map((r, i) => {
        const p = raw.participants.find(p => p.id === r.id), name = p.name + (raw.participants.filter(x => x.name === p.name).length > 1 ? ' (nr. ' + (raw.order.indexOf(p.id) + 1) + ')' : '');
        return [String(rows.findIndex(x => x.points === r.points) + 1) + '.', name, r.played, r.win, r.draw, r.loss, r.bye, r.points].map(String);
    });
}
(async () => {
    browser = await chromium.launch({ headless: true, executablePath: process.env.VYRDEPIL_BROWSER || undefined });
    const context = await browser.newContext(), errors = [], report = [];
    context.on('page', p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text() + ' ' + m.location().url); }); });
    const teacher = await context.newPage(); await teacher.goto(base + '/tevlingstreet/');
    for (const width of [320, 437, 768, 1024, 1920]) {
        await teacher.setViewportSize({ width, height: 900 }); report.push(await measure(teacher, 'Oppsett ' + width));
        await teacher.screenshot({ path: path.join(folder, 'setup-' + width + '.png'), fullPage: true });
    }
    for (const item of cases) {
        const width = [320, 437, 768, 1024, 1280, 1920][(item.number - 1) % 6];
        await teacher.setViewportSize({ width, height: 900 });
        await load(teacher, item.number);
        const first = teacher.locator('.ts-match button[aria-label]').first();
        if (await first.count()) {
            const label = await first.getAttribute('aria-label'); await first.click();
            await teacher.getByRole('button', { name: label, exact: true }).waitFor();
            assert.equal(await teacher.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
        }
        report.push(await measure(teacher, 'Turnering ' + item.number + ' første resultat'));
        await load(teacher, item.number, true);
        await teacher.getByRole('button', { name: item.format === 'cup' ? 'Sluttresultat' : 'Poengtabell', exact: true }).click();
        const raw = JSON.parse(fs.readFileSync(path.join(folder, 'complete-' + item.number + '.json')));
        if (item.format !== 'cup') {
            const expected = raw.pools.length ? raw.pools.flatMap(p => expectedRows(raw, p.ids)) : expectedRows(raw);
            const actual = await teacher.locator('.ts-table tbody tr').evaluateAll(rows => rows.map(row => [...row.cells].map(c => c.textContent)));
            assert.deepEqual(actual, expected, 'Skjermtabellen skal stemme med kontrollberekninga');
        } else {
            const final = raw.matches.filter(m => m.stage === 'cup').at(-1);
            const resolve = s => !s ? null : s.kind === 'participant' ? s.id : (() => { const m = raw.matches[s.id - 1]; const a = resolve(m.a), b = resolve(m.b); return !a || !b ? a || b : m.result === 'a' ? a : b; })();
            const person = raw.participants.find(p => p.id === resolve(final.result === 'a' ? final.a : final.b));
            const champion = person.name + (raw.participants.filter(p => p.name === person.name).length > 1 ? ' (nr. ' + (raw.order.indexOf(person.id) + 1) + ')' : '');
            assert.equal(await teacher.getByText('Turneringsvinnar: ' + champion, { exact: true }).count(), 1);
        }
        report.push(await measure(teacher, 'Turnering ' + item.number + ' sluttresultat'));
        console.log('UI PASS ' + item.number + '/50 (' + item.participants + ' ' + item.format + ')');
    }
    // Long labels, dialogue focus and actual projector pages in every display mode.
    const warning = teacher.getByRole('button', { name: 'Skjul varsel', exact: true });
    if (await warning.count()) { await warning.click(); assert.equal(await teacher.locator('.vp-storage-warning').count(), 0); }
    const id = await load(teacher, 49, false, true);
    for (const width of [320, 437, 768, 1024, 1280, 1920]) for (const view of ['Kampar', 'Turneringstre', 'Sluttresultat']) {
        await teacher.setViewportSize({ width, height: 900 }); await teacher.getByRole('button', { name: view, exact: true }).click();
        report.push(await measure(teacher, 'Lange namn ' + view + ' ' + width));
        if ([437, 1280].includes(width)) await teacher.screenshot({ path: path.join(folder, 'teacher-' + view + '-' + width + '.png'), fullPage: true });
    }
    await teacher.getByRole('button', { name: 'Rett namn', exact: true }).click();
    // Initial fixtures allow renaming after freeze, before any score.
    report.push(await measure(teacher, 'Dialog med lange namn'));
    await teacher.keyboard.press('Escape'); assert.equal(await teacher.locator('dialog[open]').count(), 0);
    await teacher.locator('#openLibrary').focus(); await teacher.keyboard.press('Tab');
    assert(await teacher.evaluate(() => getComputedStyle(document.activeElement).boxShadow.includes('138, 91, 37')), 'Synleg varm fokusmarkering');
    const display = await context.newPage();
    for (const complete of [false, true]) {
        const displayId = complete ? await load(teacher, 49, true, true) : id;
        await teacher.getByLabel('Byt side kvart 15. sekund').uncheck();
        await display.goto(base + '/tevlingstreet/display.html#' + displayId);
        await display.getByText('Direktekontakt med lærarvindauget', { exact: true }).waitFor();
        for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) for (const mode of ['matches', 'tree', 'table']) {
            await teacher.getByLabel('Vising på storskjermen').selectOption(mode);
            await display.setViewportSize(viewport);
            await display.waitForFunction(({mode, complete}) => mode === 'table' ? document.querySelector('#displayContent h2')?.textContent === 'Sluttresultat' : mode === 'tree' ? !!document.querySelector('.ts-tree') : complete ? document.querySelector('#displayContent')?.textContent.includes('Alle oppsette kampar er ferdige') : !!document.querySelector('.ts-match'), { mode, complete });
            await display.waitForFunction(() => document.querySelector('#displayContent').getBoundingClientRect().bottom <= innerHeight);
            const count = Number((await display.locator('#pageNumber').textContent()).split(' av ')[1]), seen = new Set();
            for (let page = 0; page < count; page++) {
                report.push(await measure(display, 'Storskjerm ' + mode + ' ' + viewport.width + (complete ? ' ferdig' : '') + ' side ' + (page + 1), true));
                const values = mode === 'table' ? await display.locator('.ts-table tbody td:nth-child(2)').allTextContents() : mode === 'tree' ? await display.locator('.ts-match > p:first-child').allTextContents() : [];
                values.forEach(value => seen.add(mode === 'tree' ? Number(value.match(/^Kamp (\d+)/)[1]) : value));
                if (page === 0) await display.screenshot({ path: path.join(folder, 'display-' + mode + '-' + viewport.width + (complete ? '-complete' : '') + '.png'), fullPage: true });
                await display.locator('#next').click();
            }
            if (mode === 'table') {
                assert.equal(await display.locator('.ts-table').count(), 0, 'Cup skal aldri vise ein poengtabell');
                if (complete) assert(await display.getByText(/^Turneringsvinnar:/).count());
            }
            if (mode === 'tree') assert.equal(seen.size, 128, 'Alle kampar med på tre-sidene');
        }
    }
    const leagueId = await load(teacher, 50, true, true);
    await teacher.getByLabel('Byt side kvart 15. sekund').uncheck();
    await teacher.getByLabel('Vising på storskjermen').selectOption('table');
    await display.goto(base + '/tevlingstreet/display.html#' + leagueId);
    await display.locator('.ts-table').waitFor();
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
        await display.setViewportSize(viewport);
        await display.waitForFunction(() => document.querySelector('#displayContent').getBoundingClientRect().bottom <= innerHeight);
        const count = Number((await display.locator('#pageNumber').textContent()).split(' av ')[1]), seen = new Set();
        for (let page = 0; page < count; page++) {
            report.push(await measure(display, 'Storskjerm tabell ' + viewport.width + ' side ' + (page + 1), true));
            (await display.locator('.ts-table tbody td:nth-child(2)').allTextContents()).forEach(name => seen.add(name));
            if (!page) await display.screenshot({ path: path.join(folder, 'league-table-' + viewport.width + '.png'), fullPage: true });
            await display.locator('#next').click();
        }
        assert.equal(seen.size, 128, 'Alle deltakarane på lesbare tabellsider');
    }
    const result = { source: base, tournaments: 50, errors, checks: report.length, issues: report.filter(r => r.issues.length), report };
    fs.writeFileSync(path.join(folder, 'design.json'), JSON.stringify(result, null, 2));
    await browser.close(); browser = null;
    console.log(JSON.stringify({ checks: result.checks, issues: result.issues, errors }, null, 2));
    assert.deepEqual(errors, []); assert.equal(result.issues.length, 0, 'Ingen målte designavvik');
})().catch(async e => { console.error(e); await browser?.close(); process.exitCode = 1; });
