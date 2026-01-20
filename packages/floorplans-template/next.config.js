/** @type {import('next').NextConfig} */
const siteBasePath = process.env.SITE_BASE_PATH || "";
// In development mode (when SITE_BASE_PATH is not set), don't use basePath
// In production builds, use the configured basePath
const isDev = process.env.NODE_ENV !== "production" && !siteBasePath;
const basePath = isDev
  ? ""
  : siteBasePath
  ? `${siteBasePath}/floorplans`
  : "/floorplans";

const nextConfig = {
  output: "export",
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    SITE_ID: process.env.SITE_ID || "",
    SITE_NAME: process.env.SITE_NAME || "",
    SITE_BASE_PATH: siteBasePath,
    WEBSITE_URL: siteBasePath || "/",
    FLOORPLANS_DATA: process.env.FLOORPLANS_DATA || "",
    UNITS_SITE_ID: process.env.UNITS_SITE_ID || "p1526057",
    // Brand tokens
    BRAND_PRIMARY_COLOR: process.env.BRAND_PRIMARY_COLOR || "#667eea",
    BRAND_SECONDARY_COLOR: process.env.BRAND_SECONDARY_COLOR || "#764ba2",
    BRAND_ACCENT_COLOR: process.env.BRAND_ACCENT_COLOR || "#f093fb",
    BRAND_HEADER_BG: process.env.BRAND_HEADER_BG || "#ffffff",
    BRAND_HEADER_TEXT: process.env.BRAND_HEADER_TEXT || "#333333",
    BRAND_FONT_FAMILY:
      process.env.BRAND_FONT_FAMILY || "system-ui, -apple-system, sans-serif",
  },
};

module.exports = nextConfig;
