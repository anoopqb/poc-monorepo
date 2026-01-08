import { buildSite } from './build-site';

interface SiteConfig {
  id: string;
  name: string;
  basePath: string;
  strapiEndpoint: string;
  floorplansEnabled: boolean;
}

async function buildAllSites(): Promise<void> {
  const sitesConfig = require('../sites.config.json');
  const sites: SiteConfig[] = sitesConfig.sites;

  console.log(`\n🚀 Building ${sites.length} sites...\n`);

  const startTime = Date.now();

  for (const site of sites) {
    await buildSite(site);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ All ${sites.length} sites built successfully in ${duration}s`);
  console.log(`${'='.repeat(60)}\n`);
}

buildAllSites().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

