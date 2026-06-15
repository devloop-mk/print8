'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

export function HomeContactCta() {
  const th = useTranslations('home');
  const tc = useTranslations('contact');

  return (
    <section className="border-t border-ink-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white shadow-lg">
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-12">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-100">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {th('contactCtaBadge')}
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {th('contactCtaTitle')}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">
                {th('contactCtaDesc')}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="bg-white text-brand-800 hover:bg-brand-50"
                  >
                    {th('contactCtaButton')}
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/60 bg-transparent text-white hover:bg-white/10"
                  >
                    {th('contactCtaFaq')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
                    {tc('phone')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">{tc('phoneValue')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
                    {tc('email')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">{tc('emailValue')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-200">
                    {tc('address')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">{tc('addressValue')}</p>
                  <p className="mt-1 text-xs text-brand-200">{tc('hoursValue')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
