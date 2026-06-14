import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="border-t border-ink-200 bg-ink-900 text-ink-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
              8
            </div>
            <span className="text-lg font-bold text-white">Print 8</span>
          </div>
          <p className="text-sm">{t('tagline')}</p>
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-white">{t('quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/services"
                className="hover:text-white"
              >
                {nav('services')}
              </Link>
            </li>
            <li>
              <Link
                href="/designs"
                className="hover:text-white"
              >
                {nav('designs')}
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className="hover:text-white"
              >
                {nav('products')}
              </Link>
            </li>
            <li>
              <Link
                href="/faq"
                className="hover:text-white"
              >
                {nav('faq')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-white">{t('contact')}</h3>
          <ul className="space-y-2 text-sm">
            <li>info@print8.mk</li>
            <li>+389 XX XXX XXX</li>
            <li>Shtip, North Macedonia</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800 py-4 text-center text-sm">
        © {new Date().getFullYear()} Print 8. {t('rights')}
      </div>
    </footer>
  );
}
