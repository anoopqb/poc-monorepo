import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Small App',
  description: 'Independent application embedded in main-app',
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

