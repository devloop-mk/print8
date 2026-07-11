import {
  Lora,
  Merriweather,
  Montserrat,
  Oswald,
  Playfair_Display,
  Roboto,
} from 'next/font/google';

const roboto = Roboto({
  variable: '--font-customizer-roboto',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '700', '900'],
});

const montserrat = Montserrat({
  variable: '--font-customizer-montserrat',
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700', '800'],
});

const oswald = Oswald({
  variable: '--font-customizer-oswald',
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
});

const playfair = Playfair_Display({
  variable: '--font-customizer-playfair',
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700', '800'],
});

const lora = Lora({
  variable: '--font-customizer-lora',
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
});

const merriweather = Merriweather({
  variable: '--font-customizer-merriweather',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700', '900'],
});

export default function CustomizeProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${roboto.variable} ${montserrat.variable} ${oswald.variable} ${playfair.variable} ${lora.variable} ${merriweather.variable}`}
    >
      {children}
    </div>
  );
}
