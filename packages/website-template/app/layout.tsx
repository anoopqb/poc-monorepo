import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.SITE_NAME || 'Property Website',
  description: `Welcome to ${process.env.SITE_NAME || 'our property'}`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
