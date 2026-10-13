#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-var-requires */
/**
 * Bundle Size Budget Check Script
 *
 * Reads the build output and verifies that gzipped JS bundles
 * stay within the configured budget (default: 200KB).
 *
 * Usage: node scripts/bundle-budget.js [--budget=200] [--build-dir=build]
 *
 * Exits with code 1 if any bundle exceeds the budget.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_BUDGET_KB = 200;
const DEFAULT_BUILD_DIR = 'build';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    budgetKb: DEFAULT_BUDGET_KB,
    buildDir: DEFAULT_BUILD_DIR,
  };

  for (const arg of args) {
    if (arg.startsWith('--budget=')) {
      config.budgetKb = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--build-dir=')) {
      config.buildDir = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Bundle Size Budget Check
========================

Usage: node scripts/bundle-budget.js [options]

Options:
  --budget=<kb>       Budget in KB (default: ${DEFAULT_BUDGET_KB})
  --build-dir=<dir>   Build output directory (default: ${DEFAULT_BUILD_DIR})
  --help, -h          Show this help

Environment variables:
  BUNDLE_BUDGET_KB    Same as --budget
  BUILD_DIR           Same as --build-dir

The script checks all *.js files in the build/static/js directory
and their gzipped sizes against the budget.
`);
}

function getGzipSize(filePath) {
  try {
    const output = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
    return parseInt(output.trim(), 10);
  } catch (error) {
    console.error(`Error getting gzip size for ${filePath}:`, error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function checkBundleBudget(config) {
  const buildDir = path.resolve(config.buildDir);
  const jsDir = path.join(buildDir, 'static', 'js');

  if (!fs.existsSync(jsDir)) {
    console.error(`❌ Build directory not found: ${jsDir}`);
    console.error('Run "npm run build" first.');
    process.exit(1);
  }

  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));

  if (jsFiles.length === 0) {
    console.error('❌ No JavaScript bundles found in build output.');
    process.exit(1);
  }

  console.log(`\n📦 Bundle Size Budget Check`);
  console.log(`   Budget: ${config.budgetKb} KB gzipped`);
  console.log(`   Build dir: ${buildDir}`);
  console.log(`   Checking ${jsFiles.length} bundle(s)...\n`);

  let hasFailures = false;
  const results = [];

  for (const file of jsFiles) {
    const filePath = path.join(jsDir, file);
    const rawSize = fs.statSync(filePath).size;
    const gzipSize = getGzipSize(filePath);

    if (gzipSize === null) {
      hasFailures = true;
      continue;
    }

    const gzipKb = gzipSize / 1024;
    const status = gzipKb <= config.budgetKb ? '✅ PASS' : '❌ FAIL';
    const budgetPct = ((gzipKb / config.budgetKb) * 100).toFixed(1);

    if (gzipKb > config.budgetKb) {
      hasFailures = true;
    }

    results.push({
      file,
      rawSize,
      gzipSize,
      gzipKb,
      status,
      budgetPct,
    });

    console.log(`   ${status}  ${file}`);
    console.log(
      `         Raw: ${formatBytes(rawSize)}  |  Gzipped: ${formatBytes(
        gzipSize
      )}  |  ${budgetPct}% of budget`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const totalGzip = results.reduce((sum, r) => sum + r.gzipSize, 0);
  const totalGzipKb = totalGzip / 1024;
  const totalStatus = totalGzipKb <= config.budgetKb ? '✅ PASS' : '❌ FAIL';
  console.log(
    `${totalStatus}  TOTAL: ${formatBytes(totalGzip)} (${totalGzipKb.toFixed(1)} KB / ${
      config.budgetKb
    } KB)`
  );

  if (hasFailures) {
    console.log('\n❌ Bundle size budget exceeded!');
    console.log(
      '   Consider code splitting, removing unused dependencies, or increasing the budget.'
    );
    process.exit(1);
  } else {
    console.log('\n✅ All bundles within budget!');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();
  // Allow env var overrides
  if (process.env.BUNDLE_BUDGET_KB) config.budgetKb = parseInt(process.env.BUNDLE_BUDGET_KB, 10);
  if (process.env.BUILD_DIR) config.buildDir = process.env.BUILD_DIR;
  checkBundleBudget(config);
}

module.exports = { checkBundleBudget, getGzipSize, formatBytes };
