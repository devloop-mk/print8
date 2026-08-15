import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { PageIntro } from '@/components/brand/PageIntro';
import type { LegalPageKey } from '@/lib/legal/pages';

type LegalSection = {
  title: string;
  body: string;
  items?: string[];
};

type LegalDocumentProps = {
  documentKey: LegalPageKey;
};

function linkifyParagraph(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(urlPattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const url = match[0];
    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand-600 hover:text-brand-700"
      >
        {url}
      </a>,
    );
    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderParagraphs(body: string) {
  return body.split('\n\n').map((paragraph) => (
    <p key={paragraph.slice(0, 48)} className="leading-relaxed text-ink-600">
      {linkifyParagraph(paragraph)}
    </p>
  ));
}

export async function LegalDocument({ documentKey }: LegalDocumentProps) {
  const t = await getTranslations('legal');
  const sections = t.raw(`${documentKey}.sections`) as LegalSection[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro
        title={t(`${documentKey}.title`)}
        subtitle={t(`${documentKey}.subtitle`)}
        className="mb-8"
      />

      <div className="mb-8 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
        <p>{t(`${documentKey}.lastUpdated`)}</p>
        <p className="mt-2">{t(`${documentKey}.intro`)}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-ink-900">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm sm:text-base">
              {renderParagraphs(section.body)}
              {section.items?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-ink-600">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-ink-600">
        <p>{t('shared.disclaimer')}</p>
        <p className="mt-3">
          {t('shared.questions')}{' '}
          <Link href="/contact" className="font-medium text-brand-600 hover:text-brand-700">
            {t('shared.contactLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
