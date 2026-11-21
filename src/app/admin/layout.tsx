import { NextIntlClientProvider } from 'next-intl';
import mkMessages from '../../../messages/mk.json';
import { inter } from '@/lib/site-fonts';
import '@/app/globals.css';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mk">
      <body className={`${inter.variable} min-h-screen bg-ink-50 font-sans antialiased`}>
        <NextIntlClientProvider locale="mk" messages={mkMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
