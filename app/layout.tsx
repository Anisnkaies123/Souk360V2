import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Souk360 – Annuaire des commerces de Bizerte',
  description: 'Découvrez les meilleurs commerces, artisans et services de Bizerte, Tunisie.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className} style={{ background: '#0a1f3c', minHeight: '100vh' }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
