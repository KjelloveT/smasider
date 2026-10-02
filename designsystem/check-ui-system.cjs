#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignored = new Set(['.git', '.worktrees', 'node_modules', '_kjelder']);
const errors = [];
const modalPages = new Set();
let htmlCount = 0;
let overlayCount = 0;
let panelCount = 0;
let nativeDialogCount = 0;

const backdropClasses = new Set([
  'vp-modal-backdrop', 'modal-overlay', 'bk-modal-overlay', 'hs-overlay',
  'help-modal', 'tv-ex-overlay', 'image-modal'
]);
const panelClasses = new Set([
  'vp-modal-panel', 'modal', 'modal1', 'modal2', 'modal3', 'modal4', 'modal5',
  'bk-modal', 'hs-dialog', 'help-modal-content', 'preview-inner', 'tv-ex',
  'tv-ex-names', 'modal-box'
]);
const forbiddenModalProperties = new Set([
  'position', 'inset', 'z-index', 'display', 'align-items', 'justify-content',
  'background', 'background-color', 'color', 'border', 'border-color',
  'border-radius', 'box-shadow', 'opacity'
]);
const forbiddenPanelProperties = new Set([
  'background', 'background-color', 'color', 'border', 'border-color',
  'border-radius', 'box-shadow'
]);
const forbiddenBaseProperties = new Set([
  'background', 'background-color', 'color', 'border', 'border-color',
  'border-radius', 'box-shadow', 'font-family', 'font-weight', 'text-transform'
]);

function fail(message) { errors.push(message); }

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}

function walk(directory, callback) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, callback);
    else if (entry.isFile()) callback(file);
  }
}

function relative(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }

function scanDynamicClasses(source, context) {
  const backdropAliases = new Set([...backdropClasses].filter(name => name !== 'vp-modal-backdrop'));
  const panelAliases = new Set([...panelClasses].filter(name => name !== 'vp-modal-panel'));
  const classValues = /\bclass(?:Name)?\s*(?:=|:)\s*(['"`])([^'"`]*?)\1/g;
  for (const match of source.matchAll(classValues)) {
    const classes = new Set(match[2].split(/\s+/).filter(Boolean));
    if ([...classes].some(name => backdropAliases.has(name)) && !classes.has('vp-modal-backdrop')) {
      fail(`${context}: dynamically created modal backdrop is missing vp-modal-backdrop`);
    }
    if ([...classes].some(name => panelAliases.has(name)) && !classes.has('vp-modal-panel')) {
      fail(`${context}: dynamically created modal surface is missing vp-modal-panel`);
    }
  }
}

function scanHtml(file) {
  if (!/\.html?$/i.test(file)) return;
  htmlCount++;
  const source = fs.readFileSync(file, 'utf8');
  const page = relative(file);
  scanDynamicClasses(source, page);
  const hasUtil = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*vyrdepil-util\.js(?:[?#][^"']*)?["']/i.test(source);
  const tags = source.matchAll(/<(dialog|div|section|form)\b[^>]*>/gi);

  for (const match of tags) {
    const tagName = match[1].toLowerCase();
    const attrs = attributes(match[0]);
    const classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
    const hasBackdropHook = classes.has('vp-modal-backdrop');
    const isBackdrop = [...classes].some(name => backdropClasses.has(name)) || attrs.id === 'preview-overlay';
    const isNativeDialog = tagName === 'dialog';
    const isPanel = [...classes].some(name => panelClasses.has(name));

    if (attrs.style) {
      const inlineProperties = new Set(attrs.style.split(';').map(declaration => declaration.split(':', 1)[0].trim().toLowerCase()).filter(Boolean));
      const forbidden = isBackdrop ? forbiddenModalProperties : isPanel ? forbiddenPanelProperties : null;
      if (forbidden && [...inlineProperties].some(property => forbidden.has(property))) {
        fail(`${page}: modal appearance must come from css/vyrdepil-design.css, not an inline style`);
      }
    }

    if (isBackdrop) {
      overlayCount++;
      modalPages.add(page);
      if (!hasBackdropHook) fail(`${page}: dialog backdrop is missing vp-modal-backdrop`);
      if (!hasUtil) fail(`${page}: modal page does not load js/vyrdepil-util.js`);
    }
    if (isNativeDialog) {
      nativeDialogCount++;
      modalPages.add(page);
      if (!classes.has('vp-dialog')) fail(`${page}: native dialog is missing vp-dialog`);
      if (!hasUtil) fail(`${page}: native dialog page does not load js/vyrdepil-util.js`);
    }
    if (isPanel) {
      panelCount++;
      if (!classes.has('vp-modal-panel')) fail(`${page}: modal surface is missing vp-modal-panel`);
    }
  }

  for (const match of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    scanCssSource(match[1], `${page} (<style>)`);
  }
}

function scanCssSource(sourceText, context) {
  const source = sourceText.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    if (/@media\s+print/i.test(selector)) continue;
    const properties = new Set(match[2].split(';').map(declaration => declaration.split(':', 1)[0].trim().toLowerCase()).filter(Boolean));
    const backdropNames = new Set(['vp-modal-backdrop', 'modal-overlay', 'bk-modal-overlay', 'hs-overlay', 'help-modal', 'tv-ex-overlay']);
    const panelNames = new Set(['vp-modal-panel', 'modal', 'modal1', 'modal2', 'modal3', 'modal4', 'modal5', 'bk-modal', 'hs-dialog', 'help-modal-content', 'preview-inner', 'tv-ex', 'tv-ex-names', 'modal-box']);
    const terminalClasses = [...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].filter(classMatch => {
      const following = selector.slice(classMatch.index + classMatch[0].length);
      return !/^(?:\s|>|\+|~)/.test(following);
    }).map(classMatch => classMatch[1]);
    const hasBackdrop = terminalClasses.some(name => backdropNames.has(name)) || /#preview-overlay(?![\w-])/.test(selector);
    const hasPanel = terminalClasses.some(name => panelNames.has(name));
    const isModalPrintHide = /\.(?:tv-fb-overlay|tv-ex-overlay)(?![\w-])/.test(selector) && properties.size === 1 && properties.has('display');
    if (isModalPrintHide) continue;
    const forbidden = hasBackdrop ? forbiddenModalProperties : hasPanel ? forbiddenPanelProperties : null;
    if (forbidden && [...properties].some(property => forbidden.has(property))) {
      fail(`${context}: modal appearance belongs in css/vyrdepil-design.css (${selector})`);
    }

    const genericBase = /^(?:button|\.(?:btn|button|panel|card|box[1-5]))$/i.test(selector);
    if (genericBase && [...properties].some(property => forbiddenBaseProperties.has(property))) {
      fail(`${context}: generic ${selector} styling belongs in the shared design stylesheet`);
    }
  }
}

function scanCss(file) {
  if (!file.endsWith('.css') || path.resolve(file) === path.join(root, 'css', 'vyrdepil-design.css')) return;
  scanCssSource(fs.readFileSync(file, 'utf8'), relative(file));
}

function scanJs(file) {
  if (!file.endsWith('.js') || path.resolve(file) === path.join(root, 'js', 'vyrdepil-util.js')) return;
  const source = fs.readFileSync(file, 'utf8');
  const fileName = relative(file);
  scanDynamicClasses(source, fileName);
  if (/createElement\(\s*['"]dialog['"]\s*\)/.test(source) && !/vp-dialog/.test(source)) {
    fail(`${fileName}: dynamically created native dialog is missing vp-dialog`);
  }
  for (const line of source.split(/\r?\n/)) {
    if (/\.showModal\s*\(/.test(line)) fail(`${fileName}: open native dialogs through Vy.openModal()`);
    if (/classList\.(?:add|remove|toggle)\(\s*['"]open['"]/.test(line) && !/calm-overlay|dropdown|sidebar/i.test(line)) {
      fail(`${fileName}: open/close modals through Vy.openModal() and Vy.closeModal()`);
    }
  }
}

walk(root, scanHtml);
walk(root, scanCss);
walk(root, scanJs);

if (errors.length) {
  console.error(`Checked ${htmlCount} HTML pages, ${overlayCount} overlay backdrops, ${panelCount} modal surfaces and ${nativeDialogCount} native dialogs.`);
  errors.forEach(error => console.error(`ERROR ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlCount} HTML pages: ${overlayCount} overlay backdrops and ${nativeDialogCount} native dialogs use the shared modal system. All ${panelCount} modal surfaces use vp-modal-panel; no local modal or generic base styles bypass the shared CSS, and no app opens a modal outside Vy.`);
}
