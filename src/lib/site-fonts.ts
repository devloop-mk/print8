import localFont from 'next/font/local';

/** Self-hosted so `next build` does not fetch Google Fonts (Turbopack flakes on /l/font?kit= URLs). */
export const inter = localFont({
  src: '../fonts/Inter-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
});

export const spaceGrotesk = localFont({
  src: '../fonts/SpaceGrotesk.woff2',
  variable: '--font-display',
  weight: '500 700',
  display: 'swap',
});
