import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@repo/shared/components';

export const metadata: Metadata = {
  title: process.env.SITE_NAME || 'Property Website',
  description: `Welcome to ${process.env.SITE_NAME || 'our property'}`,
};

// Inject brand CSS variables as inline styles
function getBrandStyles(): React.CSSProperties {
  return {
    '--brand-primary': process.env.BRAND_PRIMARY_COLOR || '#667eea',
    '--brand-secondary': process.env.BRAND_SECONDARY_COLOR || '#764ba2',
    '--brand-accent': process.env.BRAND_ACCENT_COLOR || '#f093fb',
    '--brand-header-bg': process.env.BRAND_HEADER_BG || '#ffffff',
    '--brand-header-text': process.env.BRAND_HEADER_TEXT || '#333333',
    '--brand-font-family': process.env.BRAND_FONT_FAMILY || 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties;
}

const siteName = process.env.SITE_NAME || 'Property Website';
const floorplansUrl = process.env.FLOORPLANS_URL || '/floorplans';
const basePath = process.env.SITE_BASE_PATH || 'http://localhost:3002';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={getBrandStyles()}>

      <body>
        <Header siteName={siteName} floorplansUrl={floorplansUrl} websiteUrl={basePath || '/'} />
        {children}
      </body>
    </html>
  );
}
