#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-var-requires */
/**
 * Lighthouse CI Runner Script
 *
 * Runs Lighthouse locally on the built application.
 * Fails if performance budgets are not met.
 *
 * Usage:
 *   node scripts/lighthouse-runner.js [options]
 *
 * Options:
 *   --port=<port>         Port for the local server (default: 3001)
 *   --runs=<n>            Number of runs per URL (default: 3)
 *   --budget-lcp=<ms>     LCP budget in ms (default: 2500)
 *   --budget-fid=<ms>     FID budget in ms (default: 100)
 *   --budget-inp=<ms>     INP budget in ms (default: 200)
 *   --budget-cls=<num>    CLS budget (default: 0.1)
 *   --output-dir=<dir>    Output directory for results (default: ./lighthouse-results)
 *   --no-serve            Don't start server, use existing (for CI)
 *   --help                Show help
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3001;
const DEFAULT_RUNS = 3;
const DEFAULT_OUTPUT_DIR = './lighthouse-results';

const DEFAULT_BUDGETS = {
  lcp: 2500,
  fid: 100,
  inp: 200,
  cls: 0.1,
  fcp: 1800,
  ttfB: 800,
  tbt: 200,
};

const URLS = [
  '/',
  '/compare?ids=1,2,3',
  '/category/travel',
  '/card/synthetic-bank-2/synthetic-visa-travel',
  '/perfect-card-finder',
  '/reward-calculator',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: DEFAULT_PORT,
    runs: DEFAULT_RUNS,
    budgets: { ...DEFAULT_BUDGETS },
    outputDir: DEFAULT_OUTPUT_DIR,
    serve: true,
    help: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--runs=')) {
      config.runs = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-lcp=')) {
      config.budgets.lcp = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-fid=')) {
      config.budgets.fid = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-inp=')) {
      config.budgets.inp = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-cls=')) {
      config.budgets.cls = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--budget-fcp=')) {
      config.budgets.fcp = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-ttfb=')) {
      config.budgets.ttfB = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--budget-tbt=')) {
      config.budgets.tbt = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--output-dir=')) {
      config.outputDir = arg.split('=')[1];
    } else if (arg === '--no-serve') {
      config.serve = false;
    } else if (arg === '--help' || arg === '-h') {
      config.help = true;
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Lighthouse CI Runner
====================

Runs Lighthouse locally on the built application.

Usage: node scripts/lighthouse-runner.js [options]

Options:
  --port=<port>         Port for the local server (default: ${DEFAULT_PORT})
  --runs=<n>            Number of runs per URL (default: ${DEFAULT_RUNS})
  --budget-lcp=<ms>     LCP budget in ms (default: ${DEFAULT_BUDGETS.lcp})
  --budget-fid=<ms>     FID budget in ms (default: ${DEFAULT_BUDGETS.fid})
  --budget-inp=<ms>     INP budget in ms (default: ${DEFAULT_BUDGETS.inp})
  --budget-cls=<num>    CLS budget (default: ${DEFAULT_BUDGETS.cls})
  --budget-fcp=<ms>     FCP budget in ms (default: ${DEFAULT_BUDGETS.fcp})
  --budget-ttfb=<ms>    TTFB budget in ms (default: ${DEFAULT_BUDGETS.ttfB})
  --budget-tbt=<ms>     TBT budget in ms (default: ${DEFAULT_BUDGETS.tbt})
  --output-dir=<dir>    Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --no-serve            Don't start server, use existing
  --help, -h            Show this help

Environment variables:
  LHCI_PORT             Same as --port
  LHCI_RUNS             Same as --runs
  LHCI_BUDGET_LCP       Same as --budget-lcp
  LHCI_BUDGET_FID       Same as --budget-fid
  LHCI_BUDGET_INP       Same as --budget-inp
  LHCI_BUDGET_CLS       Same as --budget-cls
  LHCI_OUTPUT_DIR       Same as --output-dir

Prerequisites:
  - Run "npm run build" first
  - Lighthouse CI installed: npm install -g @lhci/cli (or use npx)
`);
}

function checkBuildExists() {
  const buildDir = path.resolve('build');
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }
}

function checkLighthouseInstalled() {
  try {
    execSync('npx lhci --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function generateLighthouseConfig(config) {
  const configContent = `
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx serve -s build -l ${config.port}',
      url: ${JSON.stringify(URLS.map(u => `http://localhost:${config.port}${u}`))},
      numberOfRuns: ${config.runs},
      settings: {
        headless: true,
        disableStorageReset: true,
        emulatedFormFactor: 'mobile',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['error', { maxNumericValue: ${config.budgets.lcp} }],
        'first-input-delay': ['error', { maxNumericValue: ${config.budgets.fid} }],
        'interaction-to-next-paint': ['error', { maxNumericValue: ${config.budgets.inp} }],
        'cumulative-layout-shift': ['error', { maxNumericValue: ${config.budgets.cls} }],
        'first-contentful-paint': ['warn', { maxNumericValue: ${config.budgets.fcp} }],
        'time-to-first-byte': ['warn', { maxNumericValue: ${config.budgets.ttfB} }],
        'total-blocking-time': ['error', { maxNumericValue: ${config.budgets.tbt} }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '${config.outputDir}',
    },
  },
};
`;

  const configPath = path.resolve('lighthouse-ci.config.js');
  fs.writeFileSync(configPath, configContent);
  return configPath;
}

function runLighthouse(config) {
  console.log('\n🔦 Running Lighthouse CI...');
  console.log(`   URLs: ${URLS.length}`);
  console.log(`   Runs per URL: ${config.runs}`);
  console.log(
    `   Budgets: LCP=${config.budgets.lcp}ms, FID=${config.budgets.fid}ms, INP=${config.budgets.inp}ms, CLS=${config.budgets.cls}`
  );
  console.log(`   Output: ${config.outputDir}\n`);

  try {
    execSync('npx lhci autorun', {
      stdio: 'inherit',
      env: {
        ...process.env,
        LHCI_SERVER_BASE_URL: '', // Disable external upload
      },
    });
    console.log('\n✅ Lighthouse CI passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Lighthouse CI failed!');
    console.error('   Performance budgets not met. Check the output above for details.');
    return false;
  }
}

function startServer(port) {
  console.log(`\n🚀 Starting local server on port ${port}...`);
  const server = spawn('npx', ['serve', '-s', 'build', '-l', String(port)], {
    stdio: 'inherit',
    detached: false,
  });

  // Wait for server to be ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000);

    const checkServer = setInterval(() => {
      const http = require('http');
      http
        .get(`http://localhost:${port}`, res => {
          if (res.statusCode === 200) {
            clearTimeout(timeout);
            clearInterval(checkServer);
            console.log('✅ Server ready');
            resolve(server);
          }
        })
        .on('error', () => {
          // Server not ready yet
        });
    }, 500);
  });
}

async function main() {
  const config = parseArgs();

  // Allow env var overrides
  if (process.env.LHCI_PORT) config.port = parseInt(process.env.LHCI_PORT, 10);
  if (process.env.LHCI_RUNS) config.runs = parseInt(process.env.LHCI_RUNS, 10);
  if (process.env.LHCI_BUDGET_LCP) config.budgets.lcp = parseInt(process.env.LHCI_BUDGET_LCP, 10);
  if (process.env.LHCI_BUDGET_FID) config.budgets.fid = parseInt(process.env.LHCI_BUDGET_FID, 10);
  if (process.env.LHCI_BUDGET_INP) config.budgets.inp = parseInt(process.env.LHCI_BUDGET_INP, 10);
  if (process.env.LHCI_BUDGET_CLS) config.budgets.cls = parseFloat(process.env.LHCI_BUDGET_CLS);
  if (process.env.LHCI_OUTPUT_DIR) config.outputDir = process.env.LHCI_OUTPUT_DIR;

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  console.log('🔦 Lighthouse CI Runner');
  console.log('='.repeat(40));

  checkBuildExists();

  if (!checkLighthouseInstalled()) {
    console.error('❌ Lighthouse CI not found. Install with: npm install -g @lhci/cli');
    process.exit(1);
  }

  // Generate config
  generateLighthouseConfig(config);

  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  let server = null;
  try {
    if (config.serve) {
      server = await startServer(config.port);
    }

    const passed = runLighthouse(config);

    if (server) {
      server.kill();
    }

    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (server) server.kill();
    process.exit(1);
  }
}

main();
