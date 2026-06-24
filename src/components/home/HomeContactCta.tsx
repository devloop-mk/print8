'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

export function HomeContactCta() {
  const th = useTranslations('home');
  const tc = useTranslations('contact');

  return (
    <section className="section-band py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ink-950 text-white shadow-lift-lg">
          <div className="absolute inset-0 bg-mesh-dark opacity-80" aria-hidden />
          <div
            className="absolute inset-0 bg-grid-light bg-grid opacity-10"
            aria-hidden
          />
          <div className="relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-12">
            <div>
              <p className="eyebrow-on-dark mb-4">
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
                    className="border-white bg-white text-brand-900 hover:bg-brand-50"
                  >
                    {th('contactCtaButton')}
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
                  >
                    {th('contactCtaFaq')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { icon: Phone, label: tc('phone'), value: tc('phoneValue') },
                { icon: Mail, label: tc('email'), value: tc('emailValue') },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
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
