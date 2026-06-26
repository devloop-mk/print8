import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import { Logo } from '@/components/brand/Logo';



export function Footer() {

  const t = useTranslations('footer');

  const nav = useTranslations('nav');

  const legal = useTranslations('legal.nav');



  return (

    <footer className="relative mt-16 border-t border-ink-800 bg-ink-950 text-ink-300">

      <div

        className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-60"

        aria-hidden

      />

      <div

        className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-20"

        aria-hidden

      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

        <div>

          <div className="mb-4">

            <Logo onDark className="h-8" />

          </div>

          <p className="text-sm leading-relaxed">{t('tagline')}</p>

        </div>



        <div>

          <h3 className="mb-4 border-b border-ink-700 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-white">

            {t('quickLinks')}

          </h3>

          <ul className="space-y-2 text-sm">

            <li>

              <Link href="/services" className="transition hover:text-white">

                {nav('services')}

              </Link>

            </li>

            <li>

              <Link href="/designs" className="transition hover:text-white">

                {nav('designs')}

              </Link>

            </li>

            <li>

              <Link href="/products" className="transition hover:text-white">

                {nav('products')}

              </Link>

            </li>

            <li>

              <Link href="/faq" className="transition hover:text-white">

                {nav('faq')}

              </Link>

            </li>

          </ul>

        </div>



        <div>

          <h3 className="mb-4 border-b border-ink-700 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-white">

            {t('legal')}

          </h3>

          <ul className="space-y-2 text-sm">

            <li>

              <Link href="/privacy" className="transition hover:text-white">

                {legal('privacy')}

              </Link>

            </li>

            <li>

              <Link href="/terms" className="transition hover:text-white">

                {legal('terms')}

              </Link>

            </li>

            <li>

              <Link href="/cookies" className="transition hover:text-white">

                {legal('cookies')}

              </Link>

            </li>

            <li>

              <Link href="/returns" className="transition hover:text-white">

                {legal('returns')}

              </Link>

            </li>

            <li>

              <Link href="/legal-notice" className="transition hover:text-white">

                {legal('legalNotice')}

              </Link>

            </li>

          </ul>

        </div>



        <div>

          <h3 className="mb-4 border-b border-ink-700 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-white">

            {t('contact')}

          </h3>

          <ul className="space-y-2 text-sm">

            <li>info@print8.mk</li>

            <li>+389 XX XXX XXX</li>

            <li>Shtip, North Macedonia</li>

          </ul>

        </div>

      </div>



      <div className="relative border-t border-ink-800 bg-ink-950/80 py-4 text-center text-xs font-medium uppercase tracking-wider">

        © {new Date().getFullYear()} Print 8. {t('rights')}

      </div>

    </footer>

  );

}

