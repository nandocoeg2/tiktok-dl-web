// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Impor CSS global
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TikTok Downloader',
  description: 'Download video TikTok dengan mudah',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <div className='min-h-screen bg-gray-100'>
          <Navigation />
          <main className='pb-8'>{children}</main>
          <footer className='py-4 text-gray-500 text-sm text-center'>
            Created with ❤️
          </footer>
        </div>
      </body>
    </html>
  );
}
