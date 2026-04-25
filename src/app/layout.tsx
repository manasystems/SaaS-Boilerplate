import '@/styles/global.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mana',
  description: 'Construction estimating',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
