import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, cpSync, copyFileSync, writeFileSync } from 'fs';

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
  strapiEndpoint: string;
  floorplansEnabled: boolean;
  brand?: BrandConfig;
}

const ROOT_DIR = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT_DIR, 'packages');
const DIST_DIR = join(ROOT_DIR, 'dist');
const THEMES_DIR = join(ROOT_DIR, 'data/themes');
const TEMP_DIR = join(ROOT_DIR, '.build-temp');

// Copy site-specific theme CSS to a temp template directory
function copyThemeFileToTemp(siteId: string, tempTemplateDir: string): void {
  const siteTheme = join(THEMES_DIR, `${siteId}.css`);
  const defaultTheme = join(THEMES_DIR, '_default.css');
  const destPath = join(tempTemplateDir, 'app/theme.css');

  const sourceTheme = existsSync(siteTheme) ? siteTheme : defaultTheme;

  if (existsSync(sourceTheme)) {
    copyFileSync(sourceTheme, destPath);
    console.log(`[${siteId}] 📎 Theme: ${sourceTheme.replace(ROOT_DIR, '')}`);
  } else {
    writeFileSync(destPath, '/* No theme overrides */\n');
    console.log(`[${siteId}] 📎 Theme: (none)`);
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

// Clone template to isolated temp directory for parallel builds
function cloneTemplate(templateName: string, siteId: string): string {
  const sourceDir = join(PACKAGES_DIR, templateName);
  const tempDir = join(TEMP_DIR, siteId, templateName);

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
    // Use junction on Windows, symlink on Unix
    try {
      require('fs').symlinkSync(sourceNodeModules, tempNodeModules, 'junction');
    } catch {
      // Fallback: copy if symlink fails
      cpSync(sourceNodeModules, tempNodeModules, { recursive: true });
    }
  }

  return tempDir;
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

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[${siteId}] ✅ Build completed`);
        resolve();
      } else {
        console.error(`[${siteId}] ❌ Build failed`);
        console.error(stderr || stdout);
        reject(new Error(`Build failed for ${siteId} with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function buildSite(config: SiteConfig): Promise<void> {
  const startTime = Date.now();
  console.log(`[${config.id}] 🏗️  Starting build: ${config.name}`);

  const siteOutputDir = join(DIST_DIR, config.id);
  const siteTempDir = join(TEMP_DIR, config.id);

  // Clean previous build for this site
  if (existsSync(siteOutputDir)) {
    rmSync(siteOutputDir, { recursive: true, force: true });
  }
  mkdirSync(siteOutputDir, { recursive: true });

  // Common environment variables including brand
  const commonEnv: NodeJS.ProcessEnv = {
    ...process.env,
    SITE_ID: config.id,
    SITE_NAME: config.name,
    SITE_BASE_PATH: config.basePath,
    STRAPI_API_URL: config.strapiEndpoint,
    ...getBrandEnv(config.brand),
  };

  try {
    // 1. Build Website Template
    console.log(`[${config.id}] 📦 Cloning website template...`);
    const websiteTempDir = cloneTemplate('website-template', config.id);
    copyThemeFileToTemp(config.id, websiteTempDir);

    console.log(`[${config.id}] 🔨 Building website...`);
    await buildTemplateAsync(websiteTempDir, commonEnv, config.id);

    // Copy website output to site directory
    const websiteOutDir = join(websiteTempDir, 'out');
    cpSync(websiteOutDir, siteOutputDir, { recursive: true });

    // 2. Build Floorplans Template (if enabled)
    if (config.floorplansEnabled) {
      console.log(`[${config.id}] 📦 Cloning floorplans template...`);
      const floorplansTempDir = cloneTemplate('floorplans-template', config.id);
      copyThemeFileToTemp(config.id, floorplansTempDir);

      console.log(`[${config.id}] 🔨 Building floorplans...`);
      await buildTemplateAsync(floorplansTempDir, commonEnv, config.id);

      // Copy floorplans output
      const floorplansOutDir = join(floorplansTempDir, 'out');
      const floorplansDestDir = join(siteOutputDir, 'floorplans');
      mkdirSync(floorplansDestDir, { recursive: true });
      cpSync(floorplansOutDir, floorplansDestDir, { recursive: true });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[${config.id}] 🎉 Complete in ${duration}s → ${siteOutputDir}`);

  } finally {
    // Clean up temp directory for this site
    if (existsSync(siteTempDir)) {
      rmSync(siteTempDir, { recursive: true, force: true });
    }
  }
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
