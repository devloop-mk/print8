import { getSiteUrl, localePath } from '@/lib/seo/site';
import type { Locale } from '@/i18n/routing';
import {
  EMAIL_BRAND as BRAND,
  escapeHtml,
  getBrevoClient,
  getEmailFromAddress,
  sendTransactionalEmail,
} from '@/lib/email/email-client';

export async function sendSpinRewardEmail(input: {
  to: string;
  locale: Locale;
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  validDays: number;
}): Promise<{ ok: boolean; error?: string }> {
  const brevo = getBrevoClient();
  if (!brevo) {
    return { ok: false, error: 'Email not configured' };
  }

  const isMk = input.locale !== 'en';
  const subject = isMk
    ? `Вашиот купон од тркалото: ${input.code}`
    : `Your spin-wheel coupon: ${input.code}`;
  const headline = isMk ? 'Честитки — освоивте попуст!' : 'Congrats — you won a discount!';
  const subtitle = isMk
    ? `−${input.discountAmount} ден. на вашата нарачка`
    : `−${input.discountAmount} MKD on your order`;
  const bodyLines = isMk
    ? [
        `Вашиот уникатен код е подолу. Важи еднаш и е врзан за оваа е-пошта.`,
        `Минимална нарачка: ${input.minOrderAmount} ден.`,
        `Важност: ${input.validDays} дена.`,
        `Внесете го кодот на каса при нарачка.`,
      ]
    : [
        `Your unique code is below. It can be used once and is locked to this email.`,
        `Minimum order: ${input.minOrderAmount} MKD.`,
        `Valid for: ${input.validDays} days.`,
        `Enter the code at checkout when you order.`,
      ];
  const ctaLabel = isMk ? 'Купи сега' : 'Shop now';
  const ctaUrl = `${getSiteUrl()}${localePath(input.locale, '/products')}`;

  const bodyHtml = bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${BRAND.ink};">${escapeHtml(line)}</p>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="${input.locale}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;background:${BRAND.white};border:1px solid ${BRAND.border};">
          <tr>
            <td style="padding:28px 32px;background:${BRAND.primaryDark};">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b9d5e9;">Print 8</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.white};">${escapeHtml(headline)}</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#dceaf4;">${escapeHtml(subtitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;">
              ${bodyHtml}
              <p style="margin:20px 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">${isMk ? 'Код' : 'Code'}</p>
              <p style="margin:0;padding:14px 18px;background:${BRAND.surface};border:2px dashed ${BRAND.accent};font-size:22px;font-weight:800;letter-spacing:0.06em;color:${BRAND.ink};text-align:center;">${escapeHtml(input.code)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.surface};">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">print8.mk</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const result = await Promise.race([
      sendTransactionalEmail({
        from: getEmailFromAddress(),
        to: input.to,
        subject,
        html,
      }),
      new Promise<{ ok: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ ok: false, error: 'Email timeout' }), 8000),
      ),
    ]);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}
