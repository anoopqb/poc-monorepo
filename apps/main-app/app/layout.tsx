import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Main App',
  description: 'Primary CMS-driven application',
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

