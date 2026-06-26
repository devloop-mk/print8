import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { buildLegalMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/navigation';
import type { LegalPageKey } from '@/lib/legal/pages';

type LegalPageProps = {
  params: Promise<{ locale: string }>;
};

export function createLegalPage(documentKey: LegalPageKey) {
  async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
    const { locale } = await params;
    return buildLegalMetadata(locale as Locale, documentKey);
  }

  async function LegalPage() {
    return <LegalDocument documentKey={documentKey} />;
  }

  return { generateMetadata, default: LegalPage };
}
