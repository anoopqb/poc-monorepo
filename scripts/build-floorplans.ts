import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, cpSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import crypto from 'crypto';

interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBg: string;
  headerText: string;
  fontFamily: string;
}

interface SiteConfig {
  id: string;
  name: string;
  basePath: string;
  brand?: BrandConfig;
}

interface FloorplanData {
  floorplans: Array<{
    id: string;
    name: string;
    beds: number;
    baths: number;
    sqft: number;
    price: number;
    availableDate: string | null;
  }>;
  lastUpdated?: string;
}

interface BuildCache {
  [siteId: string]: {
    floorplansHash: string;
    lastBuilt: string;
  };
}

// Default concurrency - number of parallel builds
const DEFAULT_CONCURRENCY = 2;

const ROOT_DIR = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT_DIR, 'packages');
const DIST_DIR = join(ROOT_DIR, 'dist');
const DATA_DIR = join(ROOT_DIR, 'data');
const DATA_FILE = join(DATA_DIR, 'floorplans-data.json');
const CACHE_FILE = join(DATA_DIR, '.build-cache.json');
const THEMES_DIR = join(ROOT_DIR, 'data/themes');
const TEMP_DIR = join(ROOT_DIR, '.build-temp');

// Generate hash of floorplan data for comparison
function hashData(data: unknown): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
}

// Load build cache
function loadBuildCache(): BuildCache {
  if (existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Save build cache
function saveBuildCache(cache: BuildCache): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Check if site's floorplan data has changed
function hasChanged(siteId: string, newData: FloorplanData, cache: BuildCache): boolean {
  const newHash = hashData(newData.floorplans);
  const cachedHash = cache[siteId]?.floorplansHash;

  if (!cachedHash) {
    console.log(`[${siteId}] ℹ️  No previous build found`);
    return true;
  }

  if (newHash !== cachedHash) {
    console.log(`[${siteId}] 🔄 Data changed (${cachedHash.substring(0, 8)}... → ${newHash.substring(0, 8)}...)`);
    return true;
  }

  console.log(`[${siteId}] ✓ No changes (hash: ${newHash.substring(0, 8)}...)`);
  return false;
}

// Clone template to isolated temp directory for parallel builds
function cloneTemplate(siteId: string): string {
  const sourceDir = join(PACKAGES_DIR, 'floorplans-template');
  const tempDir = join(TEMP_DIR, `fp-${siteId}`, 'floorplans-template');

  // Clean and create temp directory
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
  mkdirSync(tempDir, { recursive: true });

  // Copy template files (excluding node_modules, .next, out)
  const excludeDirs = ['node_modules', '.next', 'out'];
  
  cpSync(sourceDir, tempDir, {
    recursive: true,
    filter: (src) => {
      const relativePath = src.replace(sourceDir, '');
      return !excludeDirs.some(dir => relativePath.includes(`/${dir}`) || relativePath.includes(`\\${dir}`));
    },
  });

  // Symlink node_modules from original template (faster than copying)
  const sourceNodeModules = join(sourceDir, 'node_modules');
  const tempNodeModules = join(tempDir, 'node_modules');
  if (existsSync(sourceNodeModules)) {
    try {
      require('fs').symlinkSync(sourceNodeModules, tempNodeModules, 'junction');
    } catch {
      // Fallback: copy if symlink fails
      cpSync(sourceNodeModules, tempNodeModules, { recursive: true });
    }
  }

  return tempDir;
}

// Copy site-specific theme CSS to temp template directory
function copyThemeFileToTemp(siteId: string, tempTemplateDir: string): void {
  const siteTheme = join(THEMES_DIR, `${siteId}.css`);
  const defaultTheme = join(THEMES_DIR, '_default.css');
  const destPath = join(tempTemplateDir, 'app/theme.css');

  const sourceTheme = existsSync(siteTheme) ? siteTheme : defaultTheme;

  if (existsSync(sourceTheme)) {
    copyFileSync(sourceTheme, destPath);
  } else {
    writeFileSync(destPath, '/* No theme overrides */\n');
  }
}

// Get brand environment variables
function getBrandEnv(brand?: BrandConfig): Record<string, string> {
  if (!brand) return {};

  return {
    BRAND_PRIMARY_COLOR: brand.primaryColor,
    BRAND_SECONDARY_COLOR: brand.secondaryColor,
    BRAND_ACCENT_COLOR: brand.accentColor,
    BRAND_HEADER_BG: brand.headerBg,
    BRAND_HEADER_TEXT: brand.headerText,
    BRAND_FONT_FAMILY: brand.fontFamily,
  };
}

// Async build using spawn
function buildTemplateAsync(templateDir: string, env: NodeJS.ProcessEnv, siteId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outDir = join(templateDir, 'out');

    // Clean previous output
    if (existsSync(outDir)) {
      rmSync(outDir, { recursive: true, force: true });
    }

    // Run Next.js build
    const child = spawn('npm', ['run', 'build'], {
      cwd: templateDir,
      env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[${siteId}] ✅ Build completed`);
        resolve();
      } else {
        console.error(`[${siteId}] ❌ Build failed`);
        if (stderr) console.error(stderr);
        reject(new Error(`Build failed for ${siteId} with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Get concurrency from CLI args or env
function getConcurrency(): number {
  const args = process.argv.slice(2);

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

  const envValue = process.env.CONCURRENCY;
  if (envValue) {
    const value = parseInt(envValue, 10);
    if (!isNaN(value) && value > 0) return value;
  }

  return DEFAULT_CONCURRENCY;
}

// Process items in batches with limited concurrency
async function processBatches<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (batches.length > 1) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📦 Batch ${i + 1}/${batches.length} (${batch.length} sites in parallel)`);
      console.log(`${'─'.repeat(60)}\n`);
    }

    const batchResults = await Promise.allSettled(batch.map(processor));
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`   ❌ ${result.reason}`);
        results.push(false as R);
      }
    });
  }

  return results;
}

export async function buildFloorplans(siteId: string, force = false): Promise<boolean> {
  const startTime = Date.now();

  // Load site config
  const sitesConfig = require('../sites.config.json');
  const site = sitesConfig.sites.find((s: SiteConfig) => s.id === siteId);

  if (!site) {
    console.error(`[${siteId}] ❌ Site not found in sites.config.json`);
    return false;
  }

  // Check if floorplans data exists
  if (!existsSync(DATA_FILE)) {
    console.error(`[${siteId}] ❌ Floorplans data file not found`);
    return false;
  }

  const allFloorplansData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  const siteData: FloorplanData = allFloorplansData[siteId];

  if (!siteData) {
    console.error(`[${siteId}] ❌ No floorplans data found`);
    return false;
  }

  // Load cache and check for changes
  const cache = loadBuildCache();

  if (!force && !hasChanged(siteId, siteData, cache)) {
    return false; // No rebuild needed
  }

  console.log(`[${siteId}] 🏗️  Building floorplans (${siteData.floorplans.length} plans)`);

  const siteOutputDir = join(DIST_DIR, siteId);
  const floorplansDestDir = join(siteOutputDir, 'floorplans');
  const siteTempDir = join(TEMP_DIR, `fp-${siteId}`);

  // Check if website exists (must build website first)
  if (!existsSync(join(siteOutputDir, 'index.html'))) {
    console.error(`[${siteId}] ❌ Website not found. Run "npm run build:site ${siteId}" first.`);
    return false;
  }

  try {
    // Clone template to isolated directory
    console.log(`[${siteId}] 📦 Cloning template...`);
    const tempTemplateDir = cloneTemplate(siteId);
    copyThemeFileToTemp(siteId, tempTemplateDir);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      SITE_ID: site.id,
      SITE_NAME: site.name,
      SITE_BASE_PATH: site.basePath,
      FLOORPLANS_DATA: JSON.stringify(siteData.floorplans),
      ...getBrandEnv(site.brand),
    };

    console.log(`[${siteId}] 🔨 Building...`);
    await buildTemplateAsync(tempTemplateDir, env, siteId);

    // Remove existing floorplans folder and replace with new build
    if (existsSync(floorplansDestDir)) {
      rmSync(floorplansDestDir, { recursive: true, force: true });
    }
    mkdirSync(floorplansDestDir, { recursive: true });
    cpSync(join(tempTemplateDir, 'out'), floorplansDestDir, { recursive: true });

    // Update cache with new hash
    cache[siteId] = {
      floorplansHash: hashData(siteData.floorplans),
      lastBuilt: new Date().toISOString(),
    };
    saveBuildCache(cache);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[${siteId}] 🎉 Complete in ${duration}s → ${floorplansDestDir}`);
    return true;

  } finally {
    // Clean up temp directory for this site
    if (existsSync(siteTempDir)) {
      rmSync(siteTempDir, { recursive: true, force: true });
    }
  }
}

export async function buildAllFloorplans(force = false, concurrency?: number): Promise<void> {
  if (!existsSync(DATA_FILE)) {
    console.error(`❌ Floorplans data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const floorplansData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  const siteIds = Object.keys(floorplansData);
  const actualConcurrency = concurrency || getConcurrency();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 PARALLEL FLOORPLANS BUILD: ${siteIds.length} sites`);
  console.log(`   Concurrency: ${actualConcurrency} parallel builds`);
  console.log(`${'='.repeat(60)}\n`);

  // Clean temp directory before starting
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  const startTime = Date.now();

  const results = await processBatches(siteIds, actualConcurrency, async (siteId) => {
    return await buildFloorplans(siteId, force);
  });

  // Clean up temp directory after all builds
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  const rebuiltCount = results.filter(Boolean).length;
  const skippedCount = results.filter((r) => !r).length;

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 BUILD SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   ✅ Rebuilt: ${rebuiltCount} sites`);
  console.log(`   ⏭️  Skipped: ${skippedCount} sites (no changes)`);
  console.log(`   ⏱️  Total time: ${duration}s`);
  console.log(`   🔀 Concurrency: ${actualConcurrency} parallel builds`);
  console.log(`${'='.repeat(60)}\n`);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const siteId = args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-'));

  if (!siteId && !args.includes('--all')) {
    console.error('Usage: npx ts-node scripts/build-floorplans.ts <site-id> [--force]');
    console.error('       npx ts-node scripts/build-floorplans.ts --all [--force] [--concurrency N]');
    console.error('');
    console.error('Options:');
    console.error('  --force           Rebuild even if no changes detected');
    console.error('  --all             Process all sites in floorplans-data.json');
    console.error('  --concurrency N   Number of parallel builds (default: 2)');
    console.error('  -c N              Shorthand for --concurrency');
    process.exit(1);
  }

  if (args.includes('--all')) {
    buildAllFloorplans(force);
  } else if (siteId) {
    buildFloorplans(siteId, force);
  }
}
