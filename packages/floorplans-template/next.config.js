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
  },
};

module.exports = nextConfig;
