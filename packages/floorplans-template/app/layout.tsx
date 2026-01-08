import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: `Floorplans | ${process.env.SITE_NAME || 'Property'}`,
  description: `View available floorplans at ${process.env.SITE_NAME || 'our property'}`,
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
