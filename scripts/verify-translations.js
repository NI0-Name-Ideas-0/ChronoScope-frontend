#!/usr/bin/env node

/**
 * Translation Completeness Verification Script
 *
 * Extracts all transloco key usages from templates and TS files,
 * cross-references against en.json and de.json, and reports gaps.
 *
 * Usage: node scripts/verify-translations.js
 * Exit 0 = all keys covered, Exit 1 = gaps found
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const EN_PATH = path.resolve(__dirname, '..', 'public', 'i18n', 'en.json');
const DE_PATH = path.resolve(__dirname, '..', 'public', 'i18n', 'de.json');

// --- File Discovery ---

function walkDir(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// --- Key Extraction ---

function extractKeysFromHtml(files) {
  const keys = new Set();
  // Match 'KEY' | transloco or "KEY" | transloco (with optional whitespace)
  const pipeRegex = /['"]([A-Z][A-Z0-9_]+)['"]\s*\|\s*transloco/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = pipeRegex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }
  return keys;
}

function extractKeysFromTs(files) {
  const keys = new Set();
  // Match translate('KEY') or selectTranslate('KEY') with single or double quotes
  const serviceRegex = /(?:translate|selectTranslate)\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = serviceRegex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }
  return keys;
}

// --- Main ---

const htmlFiles = walkDir(SRC_DIR, '.html');
const tsFiles = walkDir(SRC_DIR, '.ts');

const htmlKeys = extractKeysFromHtml(htmlFiles);
const tsKeys = extractKeysFromTs(tsFiles);
const usedKeys = new Set([...htmlKeys, ...tsKeys]);

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf-8'));
const enKeys = new Set(Object.keys(en));
const deKeys = new Set(Object.keys(de));

// Cross-reference
const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
const missingInDe = [...usedKeys].filter((k) => !deKeys.has(k)).sort();
const enOnly = [...enKeys].filter((k) => !deKeys.has(k)).sort();
const deOnly = [...deKeys].filter((k) => !enKeys.has(k)).sort();
const emptyEn = [...enKeys].filter((k) => en[k] === '').sort();
const emptyDe = [...deKeys].filter((k) => de[k] === '').sort();
const unused = [...enKeys].filter((k) => !usedKeys.has(k)).sort();

// Report
let errors = 0;

console.log('=== Translation Verification ===\n');
console.log(`Templates scanned: ${htmlFiles.length} HTML, ${tsFiles.length} TS`);
console.log(`Keys used in code: ${usedKeys.size}`);
console.log(`EN keys: ${enKeys.size}  |  DE keys: ${deKeys.size}\n`);

function report(label, items, isError = true) {
  if (items.length === 0) return;
  const tag = isError ? '❌ ERROR' : '⚠️  WARN';
  console.log(`${tag}: ${label} (${items.length})`);
  items.forEach((k) => console.log(`  - ${k}`));
  console.log();
  if (isError) errors += items.length;
}

report('MISSING IN EN (used in code but not in en.json)', missingInEn);
report('MISSING IN DE (used in code but not in de.json)', missingInDe);
report('EN-ONLY (in en.json but not in de.json)', enOnly);
report('DE-ONLY (in de.json but not in en.json)', deOnly);
report('EMPTY VALUE in en.json', emptyEn);
report('EMPTY VALUE in de.json', emptyDe);
report('UNUSED (in JSON but not referenced in code)', unused, false);

if (errors === 0) {
  console.log('✅ All translations verified — zero gaps!\n');
  process.exit(0);
} else {
  console.log(`❌ ${errors} error(s) found. Fix the issues above.\n`);
  process.exit(1);
}
