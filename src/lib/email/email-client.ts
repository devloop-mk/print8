import { BrevoClient } from '@getbrevo/brevo';

/** Shared brand tokens for transactional HTML emails. */
export const EMAIL_BRAND = {
  primary: '#2f7cb2',
  primaryDark: '#225376',
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f8fafc',
  white: '#ffffff',
  accent: '#e85d04',
} as const;

const DEFAULT_FROM = 'Print 8 <orders@print8.mk>';

let brevoSingleton: BrevoClient | null | undefined;

/** Lazily construct one Brevo client per process (serverless-friendly). */
export function getBrevoClient(): BrevoClient | null {
  if (brevoSingleton !== undefined) return brevoSingleton;
  const apiKey = process.env.BREVO_API_KEY?.trim();
  brevoSingleton = apiKey ? new BrevoClient({ apiKey }) : null;
  return brevoSingleton;
}

export function getEmailFromAddress(fallback = DEFAULT_FROM): string {
  return process.env.EMAIL_FROM?.trim() || fallback;
}

/** Parse `Name <email@domain>` or plain `email@domain`. */
export function parseEmailFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'Print 8', email: from.trim() };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type TransactionalEmailAttachment = {
  filename: string;
  content: Buffer;
};

export type SendTransactionalEmailInput = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: TransactionalEmailAttachment[];
  headers?: Record<string, string>;
};

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const brevo = getBrevoClient();
  if (!brevo) {
    return { ok: false, error: 'BREVO_API_KEY is not configured' };
  }

  const sender = parseEmailFromAddress(input.from ?? getEmailFromAddress());

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender,
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      attachment:
        input.attachments && input.attachments.length > 0
          ? input.attachments.map((file) => ({
              name: file.filename,
              content: file.content.toString('base64'),
            }))
          : undefined,
      headers: input.headers,
    });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Email send failed';
    return { ok: false, error: message };
  }
}
