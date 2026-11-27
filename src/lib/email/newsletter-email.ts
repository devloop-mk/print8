import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCanonicalSiteUrl, localePath } from '@/lib/seo/site';
import type { Locale } from '@/i18n/routing';
import {
  getNewsletterTemplate,
  type NewsletterTemplate,
  type NewsletterTemplateLocaleCopy,
} from '@/lib/email/newsletter-templates';
import {
  EMAIL_BRAND as BRAND,
  escapeHtml,
  getBrevoClient,
  getNewsletterFromAddress,
  sendTransactionalEmail,
  type TransactionalEmailAttachment,
} from '@/lib/email/email-client';

export function buildNewsletterUnsubscribeUrl(
  token: string,
  locale: string | null | undefined,
) {
  const resolved: Locale = locale === 'en' ? 'en' : 'mk';
  return `${getCanonicalSiteUrl()}${localePath(resolved, '/newsletter/unsubscribe')}?token=${encodeURIComponent(token)}`;
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

const NEWSLETTER_LOGO_PATH = '/email/newsletter-logo.png';

function getNewsletterHostedAssetUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const cdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, '');
  if (cdn && normalized.startsWith('/email/')) {
    return `${cdn}${normalized}`;
  }
  return `${getCanonicalSiteUrl()}${normalized}`;
}

export function getNewsletterLogoUrl() {
  return getNewsletterHostedAssetUrl(NEWSLETTER_LOGO_PATH);
}

export function buildBrandedNewsletterHtml(options: {
  locale: Locale;
  headline: string;
  subtitle?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroImageUrl?: string;
  unsubscribeUrl: string;
}) {
  const isMk = options.locale !== 'en';
  const unsubscribeLabel = isMk ? 'Откажи ја претплатата' : 'Unsubscribe';
  const footerNote = isMk
    ? 'Го добивате овој е-маил бидејќи се претплативте на Print 8.'
    : 'You are receiving this email because you subscribed to Print 8.';
  const logoUrl = getNewsletterLogoUrl();
  const phoneLabel = isMk ? 'Тел' : 'Phone';
  const webLabel = isMk ? 'Веб' : 'Web';

  const ctaBlock =
    options.ctaLabel && options.ctaUrl
      ? `<tr>
          <td align="center" style="padding:8px 32px 32px;">
            <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.02em;padding:14px 28px;border-radius:6px;">
              ${escapeHtml(options.ctaLabel)}
            </a>
          </td>
        </tr>`
      : '';

  const heroBlock =
    options.heroImageUrl && options.ctaUrl
      ? `<tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <a href="${escapeHtml(options.ctaUrl)}" style="display:block;">
              <img src="${escapeHtml(options.heroImageUrl)}" alt="${escapeHtml(options.headline)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </a>
          </td>
        </tr>`
      : options.heroImageUrl
        ? `<tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <img src="${escapeHtml(options.heroImageUrl)}" alt="${escapeHtml(options.headline)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
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
            <td style="height:6px;line-height:6px;font-size:0;background:${BRAND.accent};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 26px;background:${BRAND.primaryDark};">
              <img src="${escapeHtml(logoUrl)}" alt="Print 8" width="168" height="45" style="display:block;width:168px;height:auto;border:0;margin:0 0 18px;" />
              ${
                options.subtitle
                  ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f4c7a8;">${escapeHtml(options.subtitle)}</p>`
                  : `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#b9d5e9;">Print 8</p>`
              }
              <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:${BRAND.white};">${escapeHtml(options.headline)}</h1>
            </td>
          </tr>
          ${heroBlock}
          <tr>
            <td style="padding:28px 32px 12px;">
              ${options.bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:22px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.surface};">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${BRAND.ink};">PRINT8</p>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.55;color:${BRAND.ink};">
                ${phoneLabel}: <a href="tel:+38974606906" style="color:${BRAND.primary};text-decoration:none;">074 606 906</a>
              </p>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.55;color:${BRAND.ink};">
                <a href="mailto:print8@gmail.com" style="color:${BRAND.primary};text-decoration:none;">print8@gmail.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:print8mk@hotmail.com" style="color:${BRAND.primary};text-decoration:none;">print8mk@hotmail.com</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:${BRAND.ink};">
                ${webLabel}: <a href="https://www.print8.mk" style="color:${BRAND.primary};text-decoration:none;">www.print8.mk</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 22px;background:${BRAND.surface};">
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
  const ctaUrl = `${getCanonicalSiteUrl()}${localePath(locale, ctaPathname || '/')}${
    ctaSearch ? `?${ctaSearch}` : ''
  }`;

  const heroImageUrl = template?.heroImagePath
    ? getNewsletterHostedAssetUrl(template.heroImagePath)
    : undefined;

  return {
    subject,
    body,
    headline,
    subtitle,
    ctaLabel,
    ctaUrl: ctaLabel ? ctaUrl : undefined,
    heroImageUrl,
  };
}

const NEWSLETTER_SEND_CONCURRENCY = 5;

async function loadTemplateAttachments(
  templateId: string | null | undefined,
): Promise<TransactionalEmailAttachment[]> {
  const attachment = getNewsletterTemplate(templateId)?.attachment;
  if (!attachment) return [];

  const relative = attachment.publicPath.replace(/^\/+/, '');
  const filePath = path.join(process.cwd(), 'public', relative);
  try {
    const content = await readFile(filePath);
    return [{ filename: attachment.filename, content }];
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unreadable file';
    throw new Error(
      `Newsletter attachment is missing (${attachment.filename}): ${detail}`,
    );
  }
}

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
  const brevo = getBrevoClient();
  if (!brevo) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const attachments = await loadTemplateAttachments(input.templateId);

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
        heroImageUrl: copy.heroImageUrl,
        unsubscribeUrl,
      });

      try {
        const result = await sendTransactionalEmail({
          from: getNewsletterFromAddress(),
          to: recipient.email,
          subject: copy.subject,
          html,
          attachments,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
          },
        });
        return result.ok;
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
