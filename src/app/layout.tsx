import '@/styles/global.css';

import type { Metadata } from 'next';
import { Archivo_Black } from 'next/font/google';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mana Build | Construction Estimating Software',
  description: 'Professional construction estimating for civil contractors.',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
  ],
  openGraph: {
    title: 'Mana Build | Construction Estimating Software',
    description: 'Professional construction estimating for civil contractors.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Mana Build | Construction Estimating Software',
    description: 'Professional construction estimating for civil contractors.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={archivoBlack.variable}>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
