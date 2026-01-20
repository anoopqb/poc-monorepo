import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: `Floorplans | ${process.env.SITE_NAME || 'Property'}`,
  description: `View available floorplans at ${process.env.SITE_NAME || 'our property'}`,
  other: {
    'units-site-id': process.env.UNITS_SITE_ID || 'p1526057',
  },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const unitsSiteId = process.env.UNITS_SITE_ID || "p1526057";
  
  return (
    <html lang="en" style={getBrandStyles()}>
      <head>
        <meta name="units-site-id" content={unitsSiteId} />
      </head>
      <body data-units-site-id={unitsSiteId}>{children}</body>
    </html>
  );
}
