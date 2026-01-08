/** @type {import('next').NextConfig} */
const basePath = process.env.SITE_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    SITE_ID: process.env.SITE_ID || '',
    SITE_NAME: process.env.SITE_NAME || '',
    SITE_BASE_PATH: basePath,
    FLOORPLANS_URL: basePath ? `${basePath}/floorplans` : '/floorplans',
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
