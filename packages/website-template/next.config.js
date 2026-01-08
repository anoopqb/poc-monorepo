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
  },
};

module.exports = nextConfig;
