import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mk">
      <body className={`${inter.variable} min-h-screen bg-ink-50 font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
