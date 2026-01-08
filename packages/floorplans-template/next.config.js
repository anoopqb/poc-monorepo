/** @type {import('next').NextConfig} */
const siteBasePath = process.env.SITE_BASE_PATH || '';
const basePath = siteBasePath ? `${siteBasePath}/floorplans` : '/floorplans';

const nextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: `${basePath}/`,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    SITE_ID: process.env.SITE_ID || '',
    SITE_NAME: process.env.SITE_NAME || '',
    SITE_BASE_PATH: siteBasePath,
    WEBSITE_URL: siteBasePath || '/',
    FLOORPLANS_DATA: process.env.FLOORPLANS_DATA || '',
    // Brand tokens
    BRAND_PRIMARY_COLOR: process.env.BRAND_PRIMARY_COLOR || '#667eea',
    BRAND_SECONDARY_COLOR: process.env.BRAND_SECONDARY_COLOR || '#764ba2',
    BRAND_ACCENT_COLOR: process.env.BRAND_ACCENT_COLOR || '#f093fb',
    BRAND_HEADER_BG: process.env.BRAND_HEADER_BG || '#ffffff',
    BRAND_HEADER_TEXT: process.env.BRAND_HEADER_TEXT || '#333333',
    BRAND_FONT_FAMILY: process.env.BRAND_FONT_FAMILY || 'system-ui, -apple-system, sans-serif',
  },
};

module.exports = nextConfig;
