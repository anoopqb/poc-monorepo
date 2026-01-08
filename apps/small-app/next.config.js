/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/small-app',
  assetPrefix: '/small-app/',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
