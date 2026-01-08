import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, cpSync } from 'fs';

interface SiteConfig {
  id: string;
  name: string;
  basePath: string;
  strapiEndpoint: string;
  floorplansEnabled: boolean;
}

const ROOT_DIR = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT_DIR, 'packages');
const DIST_DIR = join(ROOT_DIR, 'dist');

export async function buildSite(config: SiteConfig): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏗️  Building site: ${config.name} (${config.id})`);
  console.log(`${'='.repeat(60)}\n`);

  const siteOutputDir = join(DIST_DIR, config.id);

  // Clean previous build for this site
  if (existsSync(siteOutputDir)) {
    console.log(`🧹 Cleaning previous build...`);
    rmSync(siteOutputDir, { recursive: true, force: true });
  }
  mkdirSync(siteOutputDir, { recursive: true });

  // Common environment variables
  const commonEnv: NodeJS.ProcessEnv = {
    ...process.env,
    SITE_ID: config.id,
    SITE_NAME: config.name,
    SITE_BASE_PATH: config.basePath,
    STRAPI_API_URL: config.strapiEndpoint,
  };

  // 1. Build Website Template
  console.log(`\n📦 Building website template...`);
  buildTemplate('website-template', commonEnv);

  // Copy website output to site directory (at root level)
  const websiteOutDir = join(PACKAGES_DIR, 'website-template/out');
  cpSync(websiteOutDir, siteOutputDir, { recursive: true });
  console.log(`✅ Website copied to ${siteOutputDir}`);

  // 2. Build Floorplans Template (if enabled)
  if (config.floorplansEnabled) {
    console.log(`\n📦 Building floorplans template...`);
    buildTemplate('floorplans-template', commonEnv);

    // Copy floorplans output to site/floorplans subdirectory
    const floorplansOutDir = join(PACKAGES_DIR, 'floorplans-template/out');
    const floorplansDestDir = join(siteOutputDir, 'floorplans');
    mkdirSync(floorplansDestDir, { recursive: true });
    cpSync(floorplansOutDir, floorplansDestDir, { recursive: true });
    console.log(`✅ Floorplans copied to ${floorplansDestDir}`);
  }

  console.log(`\n🎉 Site ${config.id} build complete!`);
  console.log(`   Output: ${siteOutputDir}\n`);
}

function buildTemplate(templateName: string, env: NodeJS.ProcessEnv): void {
  const templateDir = join(PACKAGES_DIR, templateName);
  const outDir = join(templateDir, 'out');

  // Clean previous output
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }

  // Run Next.js build
  execSync('npm run build', {
    cwd: templateDir,
    env,
    stdio: 'inherit',
  });
}

// CLI entry point
if (require.main === module) {
  const siteId = process.argv[2];

  if (!siteId) {
    console.error('Usage: npx ts-node scripts/build-site.ts <site-id>');
    console.error('       npx ts-node scripts/build-site.ts property-001');
    process.exit(1);
  }

  const sitesConfig = require('../sites.config.json');
  const site = sitesConfig.sites.find((s: SiteConfig) => s.id === siteId);

  if (!site) {
    console.error(`❌ Site "${siteId}" not found in sites.config.json`);
    console.error(
      `   Available sites: ${sitesConfig.sites.map((s: SiteConfig) => s.id).join(', ')}`
    );
    process.exit(1);
  }

  buildSite(site).catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}

