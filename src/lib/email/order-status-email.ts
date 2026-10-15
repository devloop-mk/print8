import type { Locale } from '@/i18n/routing';
import type { OrderStatus } from '@/lib/db';
import { getSiteUrl, localePath } from '@/lib/seo/site';
import { formatPrice } from '@/lib/utils';
import {
  EMAIL_BRAND as BRAND,
  escapeHtml,
  getBrevoClient,
  getEmailFromAddress,
  sendTransactionalEmail,
} from '@/lib/email/email-client';

type Fulfillment = 'cargo' | 'pickup';

type StatusCopy = {
  subject: string;
  headline: string;
  subtitle: string;
  body: string;
  next: string;
};

const STATUS_LABELS: Record<Locale, Record<OrderStatus, string>> = {
  mk: {
    pending: 'На чекање',
    confirmed: 'Потврдена',
    printing: 'Се печати',
    ready: 'Подготвена',
    delivered: 'Испорачана',
    cancelled: 'Откажана',
  },
  en: {
    pending: 'Pending',
    confirmed: 'Confirmed',
    printing: 'Printing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
};

function copyFor(
  locale: Locale,
  status: OrderStatus,
  fulfillment: Fulfillment,
): StatusCopy {
  const isPickup = fulfillment === 'pickup';

  if (locale === 'en') {
    const byStatus: Record<OrderStatus, StatusCopy> = {
      pending: {
        subject: 'Order {n} — status: Pending',
        headline: 'Your order is waiting for review',
        subtitle: 'We received your order and will confirm it shortly.',
        body: 'Order {n} is pending review. We will get back to you as soon as we confirm the details.',
        next: 'No payment is due yet. You will hear from us when the order is confirmed.',
      },
      confirmed: {
        subject: 'Order {n} — confirmed',
        headline: 'Your order is confirmed',
        subtitle: 'We are getting it ready for print.',
        body: 'Order {n} has been confirmed. We are starting preparation.',
        next: 'Next step: printing. We will email you again when it is in production.',
      },
      printing: {
        subject: 'Order {n} — now printing',
        headline: 'Your order is in print',
        subtitle: 'Production has started.',
        body: 'Order {n} is currently being printed.',
        next: 'We will let you know as soon as it is ready.',
      },
      ready: {
        subject: isPickup
          ? 'Order {n} — ready for pickup'
          : 'Order {n} — ready for delivery',
        headline: isPickup
          ? 'Your order is ready for pickup'
          : 'Your order is ready for delivery',
        subtitle: isPickup
          ? 'You can collect it from our shop.'
          : 'We are handing it over for delivery.',
        body: isPickup
          ? 'Order {n} is ready. Please pick it up from the Print 8 shop. Payment on pickup.'
          : 'Order {n} is ready and will be sent out. Payment on delivery. The courier will contact you.',
        next: isPickup
          ? 'Bring your order number when you come to collect it.'
          : 'Keep your phone nearby so the courier can reach you.',
      },
      delivered: {
        subject: isPickup
          ? 'Order {n} — collected'
          : 'Order {n} — delivered',
        headline: isPickup ? 'Thank you for picking up your order' : 'Your order has been delivered',
        subtitle: 'We hope you like it.',
        body: isPickup
          ? 'Order {n} has been marked as collected. Thank you for shopping with Print 8.'
          : 'Order {n} has been marked as delivered. Thank you for shopping with Print 8.',
        next: 'If anything is missing or damaged, reply to this email or call us.',
      },
      cancelled: {
        subject: 'Order {n} — cancelled',
        headline: 'Your order was cancelled',
        subtitle: 'This order will not be produced.',
        body: 'Order {n} has been cancelled. If this was a mistake, contact us and we will help.',
        next: 'You can place a new order anytime at print8.mk.',
      },
    };
    return byStatus[status];
  }

  const byStatus: Record<OrderStatus, StatusCopy> = {
    pending: {
      subject: 'Нарачка {n} — статус: На чекање',
      headline: 'Нарачката чека на преглед',
      subtitle: 'Ја добивме и наскоро ќе ја потврдиме.',
      body: 'Нарачката {n} е на чекање за преглед. Ќе ве известиме штом ги потврдиме деталите.',
      next: 'Плаќање нема сега. Ќе добиете нова порака кога нарачката ќе биде потврдена.',
    },
    confirmed: {
      subject: 'Нарачка {n} — потврдена',
      headline: 'Нарачката е потврдена',
      subtitle: 'Ја подготвуваме за печат.',
      body: 'Нарачката {n} е потврдена. Почнуваме со подготовка.',
      next: 'Следен чекор е печатење. Ќе ве известиме кога ќе влезе во продукција.',
    },
    printing: {
      subject: 'Нарачка {n} — се печати',
      headline: 'Нарачката е во печат',
      subtitle: 'Продукцијата започна.',
      body: 'Нарачката {n} моментално се печати.',
      next: 'Ќе ве известиме штом биде подготвена.',
    },
    ready: {
      subject: isPickup
        ? 'Нарачка {n} — готова за подигнување'
        : 'Нарачка {n} — готова за испорака',
      headline: isPickup
        ? 'Нарачката е готова за подигнување'
        : 'Нарачката е готова за испорака',
      subtitle: isPickup
        ? 'Може да ја подигнете во салонот.'
        : 'Ја предаваме на достава.',
      body: isPickup
        ? 'Нарачката {n} е готова. Подигнете ја во салонот на Print 8. Плаќање при подигнување.'
        : 'Нарачката {n} е готова и се испраќа. Плаќање при достава. Курирот ќе ве контактира.',
      next: isPickup
        ? 'Земете го бројот на нарачката кога доаѓате да ја подигнете.'
        : 'Имајте го телефонот при себе за курирот да ве добие.',
    },
    delivered: {
      subject: isPickup
        ? 'Нарачка {n} — подигната'
        : 'Нарачка {n} — испорачана',
      headline: isPickup
        ? 'Ви благодариме што ја подигнавте нарачката'
        : 'Нарачката е испорачана',
      subtitle: 'Се надеваме дека ќе ви се допадне.',
      body: isPickup
        ? 'Нарачката {n} е означена како подигната. Ви благодариме што купувате кај Print 8.'
        : 'Нарачката {n} е означена како испорачана. Ви благодариме што купувате кај Print 8.',
      next: 'Ако нешто недостасува или е оштетено, одговорете на оваа порака или јавете ни се.',
    },
    cancelled: {
      subject: 'Нарачка {n} — откажана',
      headline: 'Нарачката е откажана',
      subtitle: 'Оваа нарачка нема да се печати.',
      body: 'Нарачката {n} е откажана. Ако ова е грешка, контактирајте нè и ќе помогнеме.',
      next: 'Нова нарачка може да направите во секое време на print8.mk.',
    },
  };
  return byStatus[status];
}

function interpolate(template: string, orderNumber: string) {
  return template.replaceAll('{n}', orderNumber);
}

function buildStatusEmailHtml(input: {
  locale: Locale;
  orderNumber: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  totalAmount: number;
  customerName: string;
}): string {
  const isMk = input.locale !== 'en';
  const copy = copyFor(input.locale, input.status, input.fulfillment);
  const statusLabel = STATUS_LABELS[input.locale][input.status];
  const firstName = input.customerName.trim().split(/\s+/)[0] || (isMk ? 'здраво' : 'there');
  const greeting = isMk ? `Здраво, ${firstName}` : `Hi, ${firstName}`;
  const orderLabel = isMk ? 'Број на нарачка' : 'Order number';
  const statusHeading = isMk ? 'Нов статус' : 'New status';
  const totalLabel = isMk ? 'Вкупно' : 'Total';
  const ctaLabel = isMk ? 'Провери статус' : 'Check status';
  const ctaUrl = `${getSiteUrl()}${localePath(input.locale, '/order-status')}`;
  const total = formatPrice(input.totalAmount, input.locale);
  const footer = isMk
    ? 'Print 8 · Ова е автоматско известување за статусот на вашата нарачка.'
    : 'Print 8 · This is an automated update for your order status.';

  return `<!DOCTYPE html>
<html lang="${input.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(interpolate(copy.headline, input.orderNumber))}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(interpolate(copy.subtitle, input.orderNumber))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;background:${BRAND.white};border:1px solid ${BRAND.border};">
          <tr>
            <td style="padding:28px 32px;background:${BRAND.primaryDark};">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b9d5e9;">Print 8</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.white};">${escapeHtml(interpolate(copy.headline, input.orderNumber))}</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#dceaf4;">${escapeHtml(interpolate(copy.subtitle, input.orderNumber))}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};border:1px solid ${BRAND.border};">
                <tr>
                  <td style="padding:16px 18px;width:50%;vertical-align:top;border-right:1px solid ${BRAND.border};">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.muted};">${orderLabel}</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.ink};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${escapeHtml(input.orderNumber)}</p>
                  </td>
                  <td style="padding:16px 18px;width:50%;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.muted};">${statusHeading}</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.primary};">${escapeHtml(statusLabel)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(greeting)},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${BRAND.ink};">${escapeHtml(interpolate(copy.body, input.orderNumber))}</p>
              <p style="margin:0;font-size:14px;line-height:1.65;color:${BRAND.muted};">${escapeHtml(copy.next)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.muted};">${totalLabel}</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND.ink};">${escapeHtml(total)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:6px;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.surface};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderStatusEmail(input: {
  to: string;
  locale: Locale;
  orderNumber: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  totalAmount: number;
  customerName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const brevo = getBrevoClient();
  if (!brevo) {
    return { ok: false, error: 'BREVO_API_KEY is not configured' };
  }

  const locale: Locale = input.locale === 'en' ? 'en' : 'mk';
  const copy = copyFor(locale, input.status, input.fulfillment);
  const subject = interpolate(copy.subject, input.orderNumber);
  const html = buildStatusEmailHtml({ ...input, locale });
  const text = [
    interpolate(copy.headline, input.orderNumber),
    interpolate(copy.body, input.orderNumber),
    copy.next,
    `${locale === 'mk' ? 'Нарачка' : 'Order'}: ${input.orderNumber}`,
    `${locale === 'mk' ? 'Статус' : 'Status'}: ${STATUS_LABELS[locale][input.status]}`,
  ].join('\n\n');

  return sendTransactionalEmail({
    from: getEmailFromAddress(),
    to: input.to,
    subject,
    html,
    text,
  });
}
