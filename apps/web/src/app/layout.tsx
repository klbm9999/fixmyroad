import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FixMyRoad — Hyderabad',
  description: 'Crowdsourced road quality reporting for Hyderabad',
  icons: { icon: '/logo.svg' },
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
