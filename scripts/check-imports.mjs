#!/usr/bin/env node

// Import guard that forbids deep imports across package boundaries and only allows index-level alias imports.
// It also disallows deep relative imports into sibling top-level folders from outside.
// Allowed public aliases: @osric/engine, @osric/osric-engine, @osric/renderer-underworld
// Disallowed: any import starting with those aliases followed by a slash, e.g. @osric/engine/core/...

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();

const SRC_FOLDERS = [
  '__tests__',
  'engine',
  'osric-engine',
  'renderer-underworld',
  'viewer-underworld',
  'docs',
];

const FILE_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const IMPORT_RE =
  /\b(?:import|export)\b[^'"`]*?from\s*['"]([^'"`]+)['"];?|\brequire\(\s*['"]([^'"`]+)['"]\s*\)/g;

const DISALLOWED_PATTERNS = [
  /^@osric\/engine\//,
  /^@osric\/osric-engine\//,
  /^@osric\/renderer-underworld\//,
  /^(?:\.\.)+\/(?:engine|osric-engine|renderer-underworld)\//,
];

const ALLOWED_PREFIXES = ['@osric/engine', '@osric/osric-engine', '@osric/renderer-underworld'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === 'build' || name === '.git')
        continue;
      walk(full, files);
    } else if (FILE_RE.test(name)) {
      files.push(full);
    }
  }
  return files;
}

function findViolations(paths) {
  const violations = [];
  for (const file of paths) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(IMPORT_RE)) {
      const spec = match[1] || match[2];
      if (!spec) continue;
      if (ALLOWED_PREFIXES.includes(spec)) continue;
      if (DISALLOWED_PATTERNS.some((re) => re.test(spec))) {
        violations.push({ file, spec });
      }
    }
  }
  return violations;
}

const allFiles = SRC_FOLDERS.flatMap((f) => {
  const dir = join(repoRoot, f);
  try {
    return walk(dir, []);
  } catch {
    return [];
  }
});

const violations = findViolations(allFiles);
if (violations.length) {
  console.error('Deep import violations found (index-only policy):');
  for (const v of violations) {
    console.error(`- ${relative(repoRoot, v.file)} -> '${v.spec}'`);
  }
  process.exit(1);
} else {
  console.log('No deep import violations.');
}
