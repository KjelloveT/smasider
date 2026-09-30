#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', '.worktrees', 'node_modules', '_kjelder']);
const retiredAssets = new Set([
  'neobrutalisme.css',
  'neobrutalisme.js',
  'neo-header.js',
  'vyrdepil-migration.css',
]);
const problems = [];
let htmlCount = 0;
let assetCount = 0;
let sharedDesignCount = 0;

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}

function checkLocalAsset(pagePath, url, kind) {
  if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url) || url.startsWith('#') || /^var\(/i.test(url)) return;
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  if (!pathname) return;
  const assetPath = pathname.startsWith('/')
    ? path.resolve(root, `.${pathname}`)
    : path.resolve(path.dirname(pagePath), pathname);
  if (!assetPath.startsWith(root + path.sep) && assetPath !== root) {
    problems.push(`${path.relative(root, pagePath)}: ${kind} path leaves the repository: ${url}`);
    return;
  }
  assetCount++;
  if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
    problems.push(`${path.relative(root, pagePath)}: missing ${kind}: ${url}`);
  }
  if (retiredAssets.has(path.basename(pathname).toLowerCase())) {
    problems.push(`${path.relative(root, pagePath)}: retired design asset: ${url}`);
  }
}

function checkCssText(sourcePath, css) {
  for (const match of css.matchAll(/@import\s+(?:url\(\s*)?(?:['"]([^'"]+)['"]|([^\s;)]+))\s*\)?\s*;?/gi)) {
    checkLocalAsset(sourcePath, match[1] || match[2], 'CSS import');
  }
  for (const match of css.matchAll(/url\(\s*(?:['"]([^'"]*)['"]|([^)]*))\s*\)/gi)) {
    checkLocalAsset(sourcePath, (match[1] ?? match[2] ?? '').trim(), 'CSS URL');
  }
}

function scanDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }
    if (!entry.isFile() || !/\.html?$/i.test(entry.name)) continue;
    htmlCount++;
    const html = fs.readFileSync(fullPath, 'utf8');
    for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
      checkCssText(fullPath, match[1]);
    }
    const stylesheetTags = [...html.matchAll(/<link\b[^>]*>/gi)];
    let hasSharedDesign = false;
    for (const match of stylesheetTags) {
      const attrs = attributes(match[0]);
      if ((attrs.rel || '').toLowerCase().split(/\s+/).includes('stylesheet')) {
        checkLocalAsset(fullPath, attrs.href, 'stylesheet');
        if (path.basename((attrs.href || '').split(/[?#]/, 1)[0]).toLowerCase() === 'vyrdepil-design.css') {
          hasSharedDesign = true;
        }
      }
    }
    if (hasSharedDesign) sharedDesignCount++;
    else problems.push(`${path.relative(root, fullPath)}: missing shared stylesheet css/vyrdepil-design.css`);
    const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] || '';
    if (!/\bdata-vp-(?:design|app|site-page|home)(?:\s|=|>)/i.test(bodyTag)) {
      problems.push(`${path.relative(root, fullPath)}: body is missing its Vyrdepil design marker`);
    }
    for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      if (attrs.src) checkLocalAsset(fullPath, attrs.src, 'script');
    }
  }
}

function scanStylesheets(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      scanStylesheets(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.css')) {
      checkCssText(fullPath, fs.readFileSync(fullPath, 'utf8'));
    }
  }
}

scanDirectory(root);
scanStylesheets(root);
if (problems.length) {
  console.error(`Checked ${htmlCount} HTML pages (${sharedDesignCount} use the shared design stylesheet) and ${assetCount} local asset references.`);
  problems.forEach(problem => console.error(`ERROR ${problem}`));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlCount} HTML pages; all use the shared design stylesheet and a Vyrdepil marker. All ${assetCount} local stylesheet, script, import, and CSS URL references exist, and no retired design assets are linked.`);
}
