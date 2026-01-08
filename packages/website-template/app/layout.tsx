import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={getBrandStyles()}>
      <body>{children}</body>
    </html>
  );
}
