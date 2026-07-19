import { getSiteUrl, localePath } from '@/lib/seo/site';
import type { Locale } from '@/i18n/routing';
import {
  getNewsletterTemplate,
  type NewsletterTemplate,
  type NewsletterTemplateLocaleCopy,
} from '@/lib/email/newsletter-templates';
import {
  EMAIL_BRAND as BRAND,
  escapeHtml,
  getEmailFromAddress,
  getResendClient,
} from '@/lib/email/resend-client';

export function buildNewsletterUnsubscribeUrl(
  token: string,
  locale: string | null | undefined,
) {
  const resolved: Locale = locale === 'en' ? 'en' : 'mk';
  return `${getSiteUrl()}${localePath(resolved, '/newsletter/unsubscribe')}?token=${encodeURIComponent(token)}`;
}

export function toNewsletterHtmlParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br/>');
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${BRAND.ink};">${lines}</p>`;
    })
    .join('');
}

function resolveLocale(locale: string | null | undefined): Locale {
  return locale === 'en' ? 'en' : 'mk';
}

function pickTemplateCopy(
  template: NewsletterTemplate,
  locale: Locale,
): NewsletterTemplateLocaleCopy {
  return locale === 'en' ? template.en : template.mk;
}

export function buildBrandedNewsletterHtml(options: {
  locale: Locale;
  headline: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}) {
  const isMk = options.locale !== 'en';
  const unsubscribeLabel = isMk ? 'Откажи ја претплатата' : 'Unsubscribe';
  const footerNote = isMk
    ? 'Го добивате овој е-маил бидејќи се претплативте на Print 8.'
    : 'You are receiving this email because you subscribed to Print 8.';

  const ctaBlock =
    options.ctaLabel && options.ctaUrl
      ? `<tr>
          <td style="padding:8px 32px 28px;">
            <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:6px;">
              ${escapeHtml(options.ctaLabel)}
            </a>
          </td>
        </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="${options.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;background:${BRAND.white};border:1px solid ${BRAND.border};">
          <tr>
            <td style="padding:28px 32px;background:${BRAND.primaryDark};">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b9d5e9;">Print 8</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.white};">${escapeHtml(options.headline)}</h1>
              ${
                options.subtitle
                  ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#dceaf4;">${escapeHtml(options.subtitle)}</p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;">
              ${options.bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.surface};">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${BRAND.muted};">${escapeHtml(footerNote)}</p>
              <p style="margin:0;font-size:12px;">
                <a href="${options.unsubscribeUrl}" style="color:${BRAND.primary};">${unsubscribeLabel}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type NewsletterBroadcastInput = {
  /** Custom compose (used when no template, or as MK override) */
  subject: string;
  body: string;
  subjectEn?: string | null;
  bodyEn?: string | null;
  templateId?: string | null;
  headline?: string | null;
  subtitle?: string | null;
  headlineEn?: string | null;
  subtitleEn?: string | null;
  ctaLabel?: string | null;
  ctaLabelEn?: string | null;
  ctaPath?: string | null;
  recipients: { email: string; unsubscribeToken: string; locale?: string | null }[];
};

function resolveCopyForRecipient(
  input: NewsletterBroadcastInput,
  locale: Locale,
) {
  const template = getNewsletterTemplate(input.templateId);
  const fromTemplate = template ? pickTemplateCopy(template, locale) : null;
  const useEn = locale === 'en';

  const subject = useEn
    ? input.subjectEn?.trim() || fromTemplate?.subject || input.subject
    : input.subject;

  const body = useEn
    ? input.bodyEn?.trim() || fromTemplate?.body || input.body
    : input.body;

  const headline =
    (useEn ? input.headlineEn : input.headline)?.trim() ||
    fromTemplate?.headline ||
    subject;

  const subtitle =
    (useEn ? input.subtitleEn : input.subtitle)?.trim() ||
    fromTemplate?.subtitle ||
    undefined;

  const ctaLabel =
    (useEn ? input.ctaLabelEn : input.ctaLabel)?.trim() ||
    fromTemplate?.ctaLabel ||
    undefined;

  const ctaPath = input.ctaPath?.trim() || fromTemplate?.ctaPath || '/';
  // Support paths with query strings: /products/ready-designs?collection=x
  const [ctaPathname, ctaSearch = ''] = ctaPath.split('?');
  const ctaUrl = `${getSiteUrl()}${localePath(locale, ctaPathname || '/')}${
    ctaSearch ? `?${ctaSearch}` : ''
  }`;

  return {
    subject,
    body,
    headline,
    subtitle,
    ctaLabel,
    ctaUrl: ctaLabel ? ctaUrl : undefined,
  };
}

const NEWSLETTER_SEND_CONCURRENCY = 5;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  const poolSize = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));
  return results;
}

export async function sendNewsletterBroadcast(
  input: NewsletterBroadcastInput,
): Promise<{ sent: number; failed: number }> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const outcomes = await mapPool(
    input.recipients,
    NEWSLETTER_SEND_CONCURRENCY,
    async (recipient) => {
      const locale = resolveLocale(recipient.locale);
      const copy = resolveCopyForRecipient(input, locale);
      const unsubscribeUrl = buildNewsletterUnsubscribeUrl(
        recipient.unsubscribeToken,
        locale,
      );

      const html = buildBrandedNewsletterHtml({
        locale,
        headline: copy.headline,
        subtitle: copy.subtitle,
        bodyHtml: toNewsletterHtmlParagraphs(copy.body),
        ctaLabel: copy.ctaLabel,
        ctaUrl: copy.ctaUrl,
        unsubscribeUrl,
      });

      try {
        await resend.emails.send({
          from: getEmailFromAddress(),
          to: recipient.email,
          subject: copy.subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
          },
        });
        return true;
      } catch (error) {
        console.error('[newsletter] send failed for', recipient.email, error);
        return false;
      }
    },
  );

  let sent = 0;
  let failed = 0;
  for (const ok of outcomes) {
    if (ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed };
}
