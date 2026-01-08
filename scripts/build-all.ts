import { buildSite } from './build-site';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';

interface SiteConfig {
  id: string;
  name: string;
  basePath: string;
  strapiEndpoint: string;
  floorplansEnabled: boolean;
}

// Default concurrency - number of parallel builds
const DEFAULT_CONCURRENCY = 2;

const ROOT_DIR = join(__dirname, '..');
const TEMP_DIR = join(ROOT_DIR, '.build-temp');

function getConcurrency(): number {
  const args = process.argv.slice(2);

  // Check CLI args
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--concurrency' || args[i] === '-c') && args[i + 1]) {
      const value = parseInt(args[i + 1], 10);
      if (!isNaN(value) && value > 0) return value;
    }
    if (args[i].startsWith('--concurrency=')) {
      const value = parseInt(args[i].split('=')[1], 10);
      if (!isNaN(value) && value > 0) return value;
    }
  }

  // Check env var
  const envValue = process.env.CONCURRENCY;
  if (envValue) {
    const value = parseInt(envValue, 10);
    if (!isNaN(value) && value > 0) return value;
  }

  return DEFAULT_CONCURRENCY;
}

// Process items in batches with limited concurrency
async function processBatches<T>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<void>
): Promise<{ succeeded: number; failed: number }> {
  const batches: T[][] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 Batch ${i + 1}/${batches.length} (${batch.length} sites in parallel)`);
    console.log(`${'─'.repeat(60)}\n`);

    const results = await Promise.allSettled(batch.map(processor));
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        succeeded++;
      } else {
        failed++;
        console.error(`   ❌ ${result.reason}`);
      }
    });
  }

  return { succeeded, failed };
}

async function buildAllSites(): Promise<void> {
  const sitesConfig = require('../sites.config.json');
  const sites: SiteConfig[] = sitesConfig.sites;
  const concurrency = getConcurrency();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 PARALLEL BUILD: ${sites.length} sites`);
  console.log(`   Concurrency: ${concurrency} parallel builds`);
  console.log(`${'='.repeat(60)}`);

  // Clean temp directory before starting
  if (existsSync(TEMP_DIR)) {
    console.log(`\n🧹 Cleaning temp directory...`);
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  const startTime = Date.now();

  const { succeeded, failed } = await processBatches(sites, concurrency, async (site) => {
    await buildSite(site);
  });

  // Clean up temp directory after all builds
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 BUILD SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   ✅ Succeeded: ${succeeded}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
  }
  console.log(`   ⏱️  Total time: ${duration}s`);
  console.log(`   🔀 Concurrency: ${concurrency} parallel builds`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

buildAllSites().catch((err) => {
  console.error('Build failed:', err);
  // Clean up on error
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  process.exit(1);
});
