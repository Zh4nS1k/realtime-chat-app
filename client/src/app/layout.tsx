import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import '@uploadthing/react/styles.css';
import './globals.css';
import { UiWatcher } from '@/components/ui-watcher';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Realtime Chat',
  description: 'DM и групповые чаты с realtime доставкой и историей',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <UiWatcher />
        {children}
      </body>
    </html>
  );
}
