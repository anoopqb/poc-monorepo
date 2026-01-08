import { buildSite } from './build-site';

interface SiteConfig {
  id: string;
  name: string;
  basePath: string;
  strapiEndpoint: string;
  floorplansEnabled: boolean;
}

// Default concurrency - number of parallel builds
const DEFAULT_CONCURRENCY = 2;

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
): Promise<void> {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n📦 Batch ${i + 1}/${batches.length} (${batch.length} sites in parallel)\n`);

    await Promise.all(batch.map(processor));
  }
}

async function buildAllSites(): Promise<void> {
  const sitesConfig = require('../sites.config.json');
  const sites: SiteConfig[] = sitesConfig.sites;
  const concurrency = getConcurrency();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Building ${sites.length} sites`);
  console.log(`   Concurrency: ${concurrency} parallel builds`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  await processBatches(sites, concurrency, async (site) => {
    await buildSite(site);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ All ${sites.length} sites built successfully in ${duration}s`);
  console.log(`   (${concurrency} parallel builds)`);
  console.log(`${'='.repeat(60)}\n`);
}

buildAllSites().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
