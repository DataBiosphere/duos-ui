#!/usr/bin/env node
/**
 * Merges Istanbul coverage JSON outputs from multiple vitest runs into the
 * root coverage/ directory so a single report action covers the whole repo.
 *
 * Usage: node scripts/merge-coverage.mjs
 *
 * Reads:  coverage/coverage-{final,summary}.json        (root vitest)
 *         server/coverage/coverage-{final,summary}.json (server vitest)
 * Writes: coverage/coverage-{final,summary}.json        (merged, in place)
 */

import { readFileSync, writeFileSync } from 'node:fs'

function read(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function write(path, data) {
  writeFileSync(path, JSON.stringify(data))
}

// coverage-final.json: Istanbul file map — keys are absolute file paths,
// values are per-file hit counts. No cross-file data; simple merge suffices.
const finalMerged = {
  ...read('coverage/coverage-final.json'),
  ...read('server/coverage/coverage-final.json'),
}
write('coverage/coverage-final.json', finalMerged)

// coverage-summary.json: { total: {...}, "/abs/path": {...}, ... }
// Merge file entries then recompute totals by summing across all files.
const { total: _ta, ...filesA } = read('coverage/coverage-summary.json')
const { total: _tb, ...filesB } = read('server/coverage/coverage-summary.json')
const files = { ...filesA, ...filesB }

const total = {}
for (const metric of ['lines', 'statements', 'functions', 'branches']) {
  const t = Object.values(files).reduce((n, f) => n + (f[metric]?.total ?? 0), 0)
  const c = Object.values(files).reduce((n, f) => n + (f[metric]?.covered ?? 0), 0)
  total[metric] = {
    total: t,
    covered: c,
    skipped: 0,
    pct: t === 0 ? 100 : Number(((c / t) * 100).toFixed(2)),
  }
}

write('coverage/coverage-summary.json', { total, ...files })

console.log('Coverage merged: root + server → coverage/')
