import { Syne, DM_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
});

export const metadata = {
  title: 'CreatorLens — Brand & Creator Marketplace',
  description: 'AI-powered marketplace connecting brands and creators',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable}`}>
      <body className="bg-dark-900 text-white font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
