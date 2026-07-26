import {
  escapeHtml,
  getBrevoClient,
  getEmailFromAddress,
  sendTransactionalEmail,
} from '@/lib/email/email-client';

export async function sendContactMessageEmail(input: {
  name: string;
  email: string;
  message: string;
  locale?: string | null;
}): Promise<void> {
  const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL;

  if (!getBrevoClient()) {
    console.warn('[email] BREVO_API_KEY not set — skipping contact email');
    return;
  }
  if (!adminEmail) {
    console.warn(
      '[email] ORDER_NOTIFICATION_EMAIL not set — skipping contact email',
    );
    return;
  }

  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br/>');
  const locale = input.locale === 'en' ? 'en' : 'mk';

  const result = await sendTransactionalEmail({
    from: getEmailFromAddress(),
    to: adminEmail,
    replyTo: input.email,
    subject: `[Print 8] Contact — ${input.name}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
        <h1 style="font-size:18px;margin:0 0 12px;">New contact message</h1>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 8px;"><strong>Locale:</strong> ${locale}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p style="margin:0;line-height:1.6;">${safeMessage}</p>
      </div>
    `,
    text: `Name: ${input.name}\nEmail: ${input.email}\nLocale: ${locale}\n\n${input.message}`,
  });

  if (!result.ok) {
    console.error('[email] contact message failed:', result.error);
  }
}
